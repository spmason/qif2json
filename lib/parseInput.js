const Iconv = require('iconv-lite');
const jschardet = require('jschardet');
const { parse } = require('./parse');

/* eslint-disable no-param-reassign */
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
    qifData = parse(qifData, options);
  } catch (e) {
    err = e;
  }

  callback(err || undefined, qifData);
};
/* eslint-enable no-param-reassign */
