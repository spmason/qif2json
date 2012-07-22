#!/usr/bin/env node

var qif2json = require('./lib/qif2json.js'),
    pd = require('pretty-data').pd,
    file = process.argv[2];

if(!file){
    return console.error('Usage: qif2json [file]');
}

qif2json.parseFile(file, function(err, data){
    if(err){
        return console.error(err.message);
    }

    console.log(pd.json(data));
});