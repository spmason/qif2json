#!/usr/bin/env node

var qif2json = require('./lib/qif2json.js'),
    args = process.argv.slice(2),
    transactionsOnly,
    file = [];

args.forEach(function(arg){
    'use strict';
    if(arg.indexOf('-') !== 0){
        file = arg;
        return;
    }
    switch(arg){
        case '--transactions':
        case '-t':
            transactionsOnly = true;
            break;
    }
});
if(!file){
    console.error('Usage: qif2json [files]');
    console.error('    --transactions, -t Generate only transactions');
    return;
}

qif2json.parseFile(file, function(err, data){
    'use strict';
    if(err){
        return console.error(err.message);
    }

    if(transactionsOnly){
        data = data.transactions;
    }

    console.log(JSON.stringify(data, null, 4));
});