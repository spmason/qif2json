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
const fecha = require('fecha');
const debug = require('debug')('qif2json');

const US_DATE_FORMATS = ['MM-DD-YYYYHH:mm:ss', 'M-D-YYYY', 'M-D-YY'];
const UK_DATE_FORMATS = ['DD-MM-YYYYHH:mm:ss', 'D-M-YYYY', 'D-M-YY'];

function parseDate(dateStr, formats) {
  if (formats === 'us') {
    formats = US_DATE_FORMATS;
  }
  if (!formats) {
    formats = UK_DATE_FORMATS;
  }
  formats = [].concat(formats);

  let str = dateStr.replace(/ /g, '');
  str = str.replace(/\//g, '-');
  str = str.replace(/'/g, '-');
  str = str.replace(/(^|[^0-9])([0-9])([^0-9]|$)/g, '$10$2$3');
  debug(`input date ${dateStr} became ${str}`);

  while (formats.length) {
    const format = formats.shift();
    const formatted = fecha.parse(str, format);

    if (formatted) {
      debug(`input date ${str} parses correctly with ${format}`);
      return fecha.format(formatted, 'YYYY-MM-DDTHH:mm:ss');
    }
  }

  return `<invalid date:"${dateStr}" cleanDate:"${str}">`;
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
        transaction.amount = parseFloat(line.substring(1).replace(/,/g, ''));
        break;
      case 'U':
        // Looks like a legacy repeat of 'T'
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

exports.parseInput = function parseInput(qifData, options, callback) {
  const { encoding } = jschardet.detect(qifData);
  let err;

  if (!callback) {
    callback = options;
    options = {};
  }

  if (encoding.toUpperCase() !== 'UTF-8' && encoding.toUpperCase() !== 'ASCII') {
    qifData = Iconv.decode(Buffer.from(qifData), encoding);
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
