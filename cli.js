#!/usr/bin/env node
/* eslint no-console: "off" */
const qif2json = require('./lib/qif2json.js');

const args = process.argv.slice(2);
let transactionsOnly;
let file;
let dateFormat;

while (args.length > 0) {
  const arg = args.shift();
  if (arg.indexOf('-') !== 0) {
    file = arg;
    continue;
  }
  switch (arg) {
    case '--transactions':
    case '-t':
      transactionsOnly = true;
      break;
    case '--date-format':
    case '-d':
      dateFormat = args.shift().split(',');
      break;
    default:
      break;
  }
}

function output(err, data) {
  let finalData = data;
  if (err) {
    console.error(err.message);
    return;
  }

  if (transactionsOnly) {
    finalData = data.transactions;
  }

  console.log(JSON.stringify(finalData, null, 4));
}

if (!file) {
  qif2json.parseStream(process.stdin, { dateFormat }, output);
  process.stdin.resume();
} else {
  qif2json.parseFile(file, { dateFormat }, output);
}
