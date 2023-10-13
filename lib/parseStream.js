const { parseInput } = require('./parseInput');

/* eslint-disable no-param-reassign */
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
    parseInput(qifData, options, callback);
  });
};
/* eslint-enable no-param-reassign */
