/*
 * qif2json
 * https://github.com/spmason/qif2json
 *
 * Copyright (c) 2012 Steve Mason
 * Licensed under the MIT license.
 */


const fs = require('fs');
const jschardet = require('jschardet');
const Iconv = require('iconv-lite');

function parseDate(str, format) {
  const date = str.replace(' ', '').split(/[^0-9]/);

  if (date[0].length < 2) {
    date[0] = `0${date[0]}`;
  }
  if (date[1].length < 2) {
    date[1] = `0${date[1]}`;
  }
  if (date[2].length <= 2) {
    date[2] = 2000 + parseInt(date[2], 10);

    if (date[2] > new Date().getFullYear()) {
      date[2] -= 100;
    }
  }

  if (format === 'us') {
    return `${date[2]}-${date[0]}-${date[1]}`;
  }
  return `${date[2]}-${date[1]}-${date[0]}`;
}

exports.parse = function parse(qif, options) {
  /* eslint no-multi-assign: "off", no-param-reassign: "off", no-cond-assign: "off",
      no-continue: "off", prefer-destructuring: "off", no-case-declarations: "off" */
  const lines = qif.split('\n');
  let line = lines.shift();
  const type = /!Type:([^$]*)$/.exec(line.trim());
  const data = {};
  const transactions = data.transactions = [];
  let transaction = {};

  options = options || {};

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
        transaction.date = parseDate(line.substring(1), options.dateFormat);
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
        const lArray = line.substring(1).split(':');
        transaction.category = lArray[0];
        if (lArray[1] !== undefined) {
          transaction.subcategory = lArray[1];
        }
        break;
      case 'C':
        transaction.clearedStatus = line.substring(1);
        break;
      case 'S':
        const sArray = line.substring(1).split(':');
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

exports.parseInput = function paeeInput(qifData, options, callback) {
  const { encoding } = jschardet.detect(qifData);
  let err;

  if (!callback) {
    callback = options;
    options = {};
  }

  if (encoding.toUpperCase() !== 'UTF-8' && encoding.toUpperCase() !== 'ASCII') {
    qifData = Iconv.decode(qifData, encoding);
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

exports.parseStream = function parseStream(stream, options, callback) {
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

exports.parseFile = function parseFile(qifFile, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  fs.readFile(qifFile, (err, qifData) => {
    if (err) {
      return callback(err);
    }
    return exports.parseInput(qifData, options, callback);
  });
};
