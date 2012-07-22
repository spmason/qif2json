/*
 * qif2json
 * https://github.com/spmason/qif2json
 *
 * Copyright (c) 2012 Steve Mason
 * Licensed under the MIT license.
 */
var fs = require('fs');

function parseDate(str){
    var date = str.split('/');

    if(date[2].length === 2){
        date[2] = '20' + date[2];
    }

    return date[2] + '-' + date[1] + '-' + date[0];
}

exports.parse = function(qif){
    var lines = qif.split('\n'),
        line = lines.shift(),
        type = /!Type:([^$]*)$/.exec(line.trim()),
        data = {},
        transactions = data.transactions = [],
        transaction = {};

    if(!type || !type.length){
        throw new Error('File does not appear to be a valid qif file: ' + line);
    }
    data.type = type[1];

    while(line = lines.shift()){
        line = line.trim();
        if(line === '^'){
            transactions.push(transaction);
            transaction = {};
            continue;
        }
        switch(line[0]){
            case 'D':
                transaction.date = parseDate(line.substring(1));
                break;
            case 'T':
                transaction.amount = parseFloat(line.substring(1));
                break;
            case 'P':
                transaction.payee = line.substring(1);
        }
    }

    return data;
};

exports.parseFile = function(qifFile, callback){
    fs.readFile(qifFile, 'utf8', function(err, qifData){
        if(err){
            return callback(err);
        }
        try{
            qifData = exports.parse(qifData);
        }catch(e){
            err = e;
        }

        callback(err, qifData);
    });
};