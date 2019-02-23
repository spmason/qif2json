#!/usr/bin/env node


const qif2json = require('./lib/qif2json.js');

const args = process.argv.slice(2);
let transactionsOnly;
let usDates;
let oldDates;
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
    case '-u':
      usDates = true;
      break;
    case '-m':
      oldDates = true;
      break;
  }
});

function output(err, data) {
  let outputObj = data;
  if (err) {
    console.error(err.message);
    return;
  }

  if (transactionsOnly) {
    outputObj = data.transactions;
  }

  console.log(JSON.stringify(outputObj, null, 4));
}

const options = { usDates, oldDates };

if (!file) {
  qif2json.parseStream(process.stdin, options, output);
  process.stdin.resume();
} else {
  qif2json.parseFile(file, options, output);
}
