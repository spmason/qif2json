/*
 * qif2json
 * https://github.com/spmason/qif2json
 *
 * Copyright (c) 2012 Steve Mason
 * Licensed under the MIT license.
 */


const fs = require('fs');
const jschardet = require('jschardet');
const { Iconv } = require('iconv');

function parseDate(str, usDates, mixed) {
  // sometimes in the 2000's there are multiple spaces
  const date = str.replace(/ /g, '').split(/[^0-9]/);

  if (date[0].length < 2) {
    date[0] = `0${date[0]}`;
  }
  if (date[1].length < 2) {
    date[1] = `0${date[1]}`;
  }
  if (date[2].length <= 2) {
    let century = 1900;
    const twoDigit = parseInt(date[2], 10);
    if (mixed) {
      // Hey a real Y2K problem solution in the wild!
      // On older versions of QIF exports with data from the 90s
      // When mixed dates are present, QB uses ' instead of /
      // the ' indicates the millenium
      // Dec 31, 1999: "D12/31/99"
      // Jan 1, 2000:  "D 1/ 1' 0"
      if (str.indexOf("'") > -1) {
        century = 2000;
      }
    } else if (twoDigit < 83) {
      // quicken released in 1983!
      // This compare is faster than new Date()
      // Will work OK until 2083, almost 64 years.
      century = 2000;
    }
    date[2] = century + twoDigit;
  }

  if (usDates) {
    return `${date[2]}-${date[0]}-${date[1]}`;
  }
  return `${date[2]}-${date[1]}-${date[0]}`;
}

exports.parse = function (qif, options) {
  const lines = qif.split('\n');
  let line = lines.shift();
  const type = /!Type:([^$]*)$/.exec(line.trim());
  const data = {};
  const transactions = data.transactions = [];
  let transaction = {};

  options = options || {};
  if (options.dateFormat) {
    // no need to break old code. There was only one option previously
    options.usDates = true;
  }

  if (!type || !type.length) {
    throw new Error(`File does not appear to be a valid qif file: ${line}`);
  }
  data.type = type[1];

  let division = {};

  while (line = lines.shift()) {
    line = line.trim();
    if (line === '^') {
      transactions.push(transaction);
      transaction = {};
      continue;
    }
    switch (line[0]) {
      case 'D':
        transaction.date = parseDate(line.substring(1), options.usDates, options.oldDates);
        break;
      case 'U':
        // Looks like a legacy repeat of 'T'
        break;
      case 'T':
        transaction.amount = parseFloat(line.substring(1).replace(',', ''));
        break;
      case 'N':
        transaction.number = line.substring(1);
        break;
      case 'M':
        transaction.memo = line.substring(1);
        break;
      case 'A':
        transaction.address = (transaction.address || []).concat(line.substring(1));
        break;
      case 'P':
        transaction.payee = line.substring(1).replace(/&amp;/g, '&');
        break;
      case 'L':
        var lArray = line.substring(1).split(':');
        transaction.category = lArray[0];
        if (lArray[1] !== undefined) {
          transaction.subcategory = lArray[1];
        }
        break;
      case 'C':
        transaction.clearedStatus = line.substring(1);
        break;
      case 'S':
        var sArray = line.substring(1).split(':');
        division.category = sArray[0];
        if (sArray[1] !== undefined) {
          division.subcategory = sArray[1];
        }
        break;
      case 'E':
        division.description = line.substring(1);
        break;
      case '$':
        division.amount = parseFloat(line.substring(1));
        if (!(transaction.division instanceof Array)) {
          transaction.division = [];
        }
        transaction.division.push(division);
        division = {};

        break;

      default:
        throw new Error(`Unknown Detail Code: ${line[0]}`);
    }
  }

  if (Object.keys(transaction).length) {
    transactions.push(transaction);
  }

  return data;
};

exports.parseInput = function (qifData, options, callback) {
  const { encoding } = jschardet.detect(qifData);
  let iconv;
  let err;

  if (!callback) {
    callback = options;
    options = {};
  }

  if (encoding.toUpperCase() !== 'UTF-8' && encoding.toUpperCase() !== 'ASCII') {
    iconv = new Iconv(encoding, 'UTF-8');
    qifData = iconv.convert(qifData).toString();
  } else {
    qifData = qifData.toString('utf8');
  }

  try {
    qifData = exports.parse(qifData, options);
  } catch (e) {
    err = e;
  }

  callback(err || undefined, qifData);
};

exports.parseStream = function (stream, options, callback) {
  let qifData = '';
  if (!callback) {
    callback = options;
    options = {};
  }
  stream.on('data', (chunk) => {
    qifData += chunk;
  });
  stream.on('end', () => {
    exports.parseInput(qifData, options, callback);
  });
};

exports.parseFile = function (qifFile, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  fs.readFile(qifFile, (err, qifData) => {
    if (err) {
      return callback(err);
    }
    exports.parseInput(qifData, options, callback);
  });
};
