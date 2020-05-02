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
const { TYPES } = require('./types');

const US_DATE_FORMATS = ['MM-DD-YYYYHH:mm:ss', 'MM-DD-YYYY', 'MM-DD-YY'];
const UK_DATE_FORMATS = ['DD-MM-YYYYHH:mm:ss', 'DD-MM-YYYY', 'DD-MM-YY'];

function parseDate(dateStr, formats) {
  if (formats === 'us' || dateStr.includes("'")) {
    formats = US_DATE_FORMATS;
  }
  if (!formats) {
    formats = UK_DATE_FORMATS;
  }
  formats = [].concat(formats);

  let str = dateStr.replace(/ /g, '');
  str = str.replace(/\//g, '-');
  str = str.replace(/'/g, '-');
  str = str.split(/\s*-\s*/g).map((s) => s.padStart(2, '0')).join('-');
  debug(`input date ${dateStr} became ${str}`);

  while (formats.length) {
    const format = formats.shift();
    const formatted = fecha.parse(str, format);
    if (formatted) {
      debug(`input date ${str} parses correctly with ${format}`);
      return fecha.format(formatted, 'YYYY-MM-DDTHH:mm:ss');
    }
  }

  return `<invalid date:"${dateStr}">`;
}

function appendEntity(data, type, entity, currentBankName, isMultiAccount) {
  if (isMultiAccount && currentBankName && type.list_name === 'transactions') {
    entity.account = currentBankName;
  }
  if (!isMultiAccount && type.list_name === 'accounts') {
    data.type = entity.type.replace('Type:', '');
    return data;
  }

  if (type.list_name === 'accounts'
      && Object.hasOwnProperty.call(data, 'accounts')
      && data.accounts.find((a) => a.name === entity.name)
  ) {
    return data; // skip duplicates
  }

  if (Object.hasOwnProperty.call(data, type.list_name)) {
    data[type.list_name].push(entity);
  } else {
    data[type.list_name] = [entity];
  }

  return data;
}

function clean(line) {
  line = line.trim();
  if (line.charCodeAt(0) === 239 && line.charCodeAt(1) === 187 && line.charCodeAt(2) === 191) {
    line = line.substring(3);
  }
  return line;
}

exports.parse = function parse(qif, options) {
  /* eslint no-multi-assign: "off", no-param-reassign: "off", no-cond-assign: "off",
      no-continue: "off", prefer-destructuring: "off", no-case-declarations: "off" */
  const lines = qif.split('\n');
  let type = { }; // /^(!Type:([^$]*)|!Account)$/.exec(line.trim());
  let currentBankName = '';
  let isMultiAccount = false;

  let data = {};

  let entity = {};

  options = options || {};

  let division = {};
  let line;

  // let i = 0;

  while (line = lines.shift()) {
    line = clean(line);
    // console.log(++i, line, line.charCodeAt(0), [...line], [...line].map((c) => c.charCodeAt(0)));

    if (line === '^') {
      if (type.list_name === 'accounts') {
        currentBankName = entity.name;
      }
      data = appendEntity(data, type, entity, currentBankName, isMultiAccount);
      entity = {};
      continue;
    }
    switch (line[0]) {
      case 'D':
        if (type.list_name === 'transactions') {
          entity.date = parseDate(line.substring(1), options.dateFormat);
        } else {
          entity.description = line.substring(1);
        }
        break;
      case 'T':
        if (type.list_name === 'transactions') {
          entity.amount = parseFloat(line.substring(1).replace(',', ''));
        } else {
          entity.type = line.substring(1);
        }
        break;
      case 'U':
        // Looks like a legacy repeat of 'T'
        break;
      case 'N':
        const propName = type.list_name === 'transactions' ? 'number' : 'name';
        entity[propName] = line.substring(1);
        break;
      case 'M':
        entity.memo = line.substring(1);
        break;
      case 'A':
        entity.address = (entity.address || []).concat(line.substring(1));
        break;
      case 'P':
        entity.payee = line.substring(1).replace(/&amp;/g, '&');
        break;
      case 'L':
        const lArray = line.substring(1).split(':');
        entity.category = lArray[0];
        if (lArray[1] !== undefined) {
          entity.subcategory = lArray[1];
        }
        break;
      case 'C':
        entity.clearedStatus = line.substring(1);
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
        if (!(entity.division instanceof Array)) {
          entity.division = [];
        }
        entity.division.push(division);
        division = {};
        break;
      case '!':
        const typeName = line.substring(1);
        type = TYPES.find(({ name }) => name === typeName);
        if (typeName === 'Account') {
          isMultiAccount = true;
        }
        if (!type && typeName.startsWith('Type:')) {
          type = {
            type: typeName,
            list_name: 'transactions',
          };
        }
        if (isMultiAccount === false) {
          data = appendEntity(data, { list_name: 'accounts' }, { type: typeName }, currentBankName, isMultiAccount);
        }

        if (!type) {
          throw new Error(`File does not appear to be a valid qif file: ${line}. Type ${typeName} is not supported.`);
        }
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(line);
        throw new Error(`Unknown Detail Code: ${line[0]}`);
    }
  }

  if (Object.keys(entity).length) {
    data = appendEntity(data, type, entity, currentBankName, isMultiAccount);
  }

  return data;
};


exports.parseInput = function parseInput(qifData, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }

  const { encoding } = { ...jschardet.detect(qifData), ...options };
  let err;

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
