/*
 * qif2json
 * https://github.com/spmason/qif2json
 *
 * Copyright (c) 2012 Steve Mason
 * Licensed under the MIT license.
 */
'use strict';
var fs = require('fs'),
    jschardet = require('jschardet'),
    Iconv = require('iconv').Iconv;

function parseDate(str) {
    var date = str.split(/[^0-9]/);

    if (date[2].length === 2) {
        date[2] = '20' + date[2];
    }

    return date[2] + '-' + date[1] + '-' + date[0];
}

exports.parse = function(qif) {
    var lines = qif.split('\n'),
        line = lines.shift(),
        type = /!Type:([^$]*)$/.exec(line.trim()),
        data = {},
        transactions = data.transactions = [],
        transaction = {};

    if (!type || !type.length) {
        throw new Error('File does not appear to be a valid qif file: ' + line);
    }
    data.type = type[1];

    var division = {};

    while (line = lines.shift()) {
        line = line.trim();
        if (line === '^') {
            transactions.push(transaction);
            transaction = {};
            continue;
        }
        switch (line[0]) {
            case 'D':
                transaction.date = parseDate(line.substring(1));
                break;
            case 'T':
                transaction.amount = parseFloat(line.substring(1).replace(',', ''));
                break;
            case 'P':
                transaction.payee = line.substring(1).replace(/&amp;/g, '&');
                break;
            case 'L':
                var lArray = line.substring(1).split(':');
                transaction.category = lArray[0];
                if (lArray[1] !== undefined) {
                    transaction.subcategory = lArray[1];
                }
                break;
            case 'C':
                // Not sure what this short code is for yet,
                // guessing some kind of account-type
                transaction.accountType = line.substring(1);
                break;
            case 'S':
                var sArray = line.substring(1).split(':');
                division.category = sArray[0];
                if (sArray[1] !== undefined) {
                    division.subcategory = sArray[1];
                }
                break;
            case '$':
                division.amount = parseFloat(line.substring(1));
                if (!(transaction.division instanceof Array)) {
                    transaction.division = [];
                }
                transaction.division.push(division);
                division = {};

                break;
            case 'N':
                transaction.number = line.substring(1);
                break;

            default:
                throw new Error('Unknown Detail Code: ' + line[0]);
        }
    }

    if (Object.keys(transaction).length) {
        transactions.push(transaction);
    }

    return data;
};

exports.parseInput = function(qifData, callback) {
    var encoding = jschardet.detect(qifData).encoding,
        iconv, err;

    if (encoding.toUpperCase() !== 'UTF-8' && encoding.toUpperCase() !== 'ASCII') {
        iconv = new Iconv(encoding, 'UTF-8');
        qifData = iconv.convert(qifData).toString();
    } else {
        qifData = qifData.toString('utf8');
    }

    try {
        qifData = exports.parse(qifData);
    } catch (e) {
        err = e;
    }

    callback(err || undefined, qifData);
};

exports.parseStream = function(stream, callback) {
    var qifData = '';
    stream.on('data', function(chunk) {
        qifData += chunk;
    });
    stream.on('end', function() {
        exports.parseInput(qifData, callback);
    });
};

exports.parseFile = function(qifFile, callback) {
    fs.readFile(qifFile, function(err, qifData) {
        if (err) {
            return callback(err);
        }
        exports.parseInput(qifData, callback);
    });
};
