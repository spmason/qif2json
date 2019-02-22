#!/usr/bin/env node
/* eslint no-console: "off" */
const qif2json = require('./lib/qif2json.js');

const args = process.argv.slice(2);
let transactionsOnly;
let file;

args.forEach((arg) => {
  if (arg.indexOf('-') !== 0) {
    file = arg;
    return;
  }
  switch (arg) {
    case '--transactions':
    case '-t':
      transactionsOnly = true;
      break;
    default:
      break;
  }
});

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
  qif2json.parseStream(process.stdin, output);
  process.stdin.resume();
} else {
  qif2json.parseFile(file, output);
}
