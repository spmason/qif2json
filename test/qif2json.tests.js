'use strict';
var qif2json = require('../lib/qif2json.js'),
    fs = require('fs');

describe('qif2json', function() {
    it('Can parse Bank example', function() {
        var data = qif2json.parse(['!Type:Bank',
'D03/03/10',
'T-379.00',
'PCITY OF SPRINGFIELD',
'^',
'D03/04/10',
'T-20.28',
'PYOUR LOCAL SUPERMARKET',
'^',
'D03/03/10',
'T-421.35',
'PSPRINGFIELD WATER UTILITY',
'^'].join('\r\n'));

        expect(data.type).toEqual('Bank');
        expect(data.transactions.length).toEqual(3);

        expect(data.transactions[0].date).toEqual('2010-03-03');
        expect(data.transactions[0].amount).toEqual(-379);
        expect(data.transactions[0].payee).toEqual('CITY OF SPRINGFIELD');

        expect(data.transactions[1].date).toEqual('2010-04-03');
        expect(data.transactions[1].amount).toEqual(-20.28);
        expect(data.transactions[1].payee).toEqual('YOUR LOCAL SUPERMARKET');

        expect(data.transactions[2].date).toEqual('2010-03-03');
        expect(data.transactions[2].amount).toEqual(-421.35);
        expect(data.transactions[2].payee).toEqual('SPRINGFIELD WATER UTILITY');
    });

    it('Can parse Bank example with single entry', function() {
        var data = qif2json.parse(['!Type:Bank',
        'D03/03/10',
        'T-379.00',
        'PCITY OF SPRINGFIELD\r\n'].join('\r\n'));

        expect(data.type).toEqual('Bank');
        expect(data.transactions.length).toEqual(1);

        expect(data.transactions[0].date).toEqual('2010-03-03');
        expect(data.transactions[0].amount).toEqual(-379);
        expect(data.transactions[0].payee).toEqual('CITY OF SPRINGFIELD');
    });

    it('Can parse dash-separated dates', function() {
        var data = qif2json.parse(['!Type:Bank',
'D03-03-10',
'T-379.00',
'PCITY OF SPRINGFIELD\r\n'].join('\r\n'));

        expect(data.type).toEqual('Bank');
        expect(data.transactions.length).toEqual(1);

        expect(data.transactions[0].date).toEqual('2010-03-03');
        expect(data.transactions[0].amount).toEqual(-379);
        expect(data.transactions[0].payee).toEqual('CITY OF SPRINGFIELD');
    });

    it('errors on invalid type field', function() {
        var err, data;
        try {
            data = qif2json.parse('!FOO');
        } catch (e) {
            err = e;
        }

        expect(err).toBeDefined();
    });

    it('errors on unknown detail code', function() {
        var err, data;
        try {
            data = qif2json.parse(['!Type:Bank',
'123',
'^',
''].join('\r\n'));
        } catch (e) {
            err = e;
        }

        expect(err).toBeDefined();
    });

    it('can parse a UTF8 file', function(done) {
        qif2json.parseFile(__dirname + '/files/utf8.qif', function(err, data) {
            expect(err).not.toBeDefined();
            expect(data.transactions[0].payee).toEqual('SOME £$™€ CHARACTERS');

            done();
        });
    });

    it('can parse a windows-1252 file', function(done) {
        qif2json.parseFile(__dirname + '/files/windows-1252.qif', function(err, data) {
            expect(err).not.toBeDefined();
            expect(data.transactions[0].payee).toEqual('SOME £$™€ CHARACTERS');

            done();
        });
    });

    it('can parse stream', function(done) {
        var reader = fs.createReadStream(__dirname + '/files/utf8.qif');

        qif2json.parseStream(reader, function(err, qifData) {
            expect(err).not.toBeDefined();
            expect(qifData.transactions.length).toEqual(1);

            done();
        });
    });

    it ('can parse \'Microsoft Money\' bank account', function() {
        var data = qif2json.parse(['!Type:AccounType',
            'D10/26\'14',
            'T1,337.00',
            'CX',
            'POpening Balance',
            'L[AccountName]'].join('\r\n'));

        expect(data.type).toEqual('AccounType');
        expect(data.transactions[0].category).toEqual('[AccountName]');
        expect(data.transactions[0].date).toEqual('2014-26-10');
        expect(data.transactions[0].amount).toEqual(1337.00);
        expect(data.transactions[0].clearedStatus).toEqual('X');
    });

    it ('can parse partial transaction with related detail codes', function() {
        var data = qif2json.parse(['!Type:Cardname',
            'D10/28\'14',
            'T-67.00',
            'PWallmart',
            'LFood:Greens',
            'SFood:Greens',
            '$-45.00',
            'SFood:Meat',
            '$-16.00',
            'SFood:Dispensary',
            '$-6.00\r\n'].join('\r\n'));

        expect(data.type).toEqual('Cardname');
        expect(data.transactions.length).toEqual(1);

        expect(data.transactions[0].date).toEqual('2014-28-10');
        expect(data.transactions[0].amount).toEqual(-67);
        expect(data.transactions[0].payee).toEqual('Wallmart');

        expect(data.transactions[0].division[0].subcategory).toEqual('Greens');
        expect(data.transactions[0].division[1].category).toEqual('Food');
        expect(data.transactions[0].division[2].amount).toEqual(-6);
    });

});
