const fs = require('fs');
const { parseInput } = require('./parseInput');

/* eslint-disable no-param-reassign */
exports.parseFile = function parseFile(qifFile, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  fs.readFile(qifFile, (err, qifData) => {
    if (err) {
      return callback(err);
    }
    return parseInput(qifData, options, callback);
  });
};
/* eslint-enable no-param-reassign */
