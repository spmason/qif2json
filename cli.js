#!/usr/bin/env node
'use strict';
var qif2json = require('./lib/qif2json.js'),
    args = process.argv.slice(2),
    transactionsOnly,
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

if (!file) {
    qif2json.parseStream(process.stdin, output);
    process.stdin.resume();
} else {
    qif2json.parseFile(file, output);
}
