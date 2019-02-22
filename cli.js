#!/usr/bin/env node
'use strict';
var qif2json = require('./lib/qif2json.js'),
    args = process.argv.slice(2),
    transactionsOnly,
    usDates,
    oldDates,
    file;

args.forEach(function(arg) {
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
    if (err) {
        console.error(err.message);
        return;
    }

    if (transactionsOnly) {
        data = data.transactions;
    }

    console.log(JSON.stringify(data, null, 4));
}

var options = {usDates, oldDates};

if (!file) {
    qif2json.parseStream(process.stdin, options, output);
    process.stdin.resume();
} else {
    qif2json.parseFile(file, options, output);
}
