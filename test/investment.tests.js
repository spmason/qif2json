
const fs = require('fs');
const qif2json = require('../lib/qif2json.js');

describe('investments', () => {
  const reader = fs.createReadStream(`${__dirname}/files/investments.qif`);

  xit('can parse investments', (done) => {
    qif2json.parseStream(reader, { dateFormat: 'us' }, (err, qifData) => {
      expect(err).toBeUndefined();

      expect(qifData.type).toEqual('Invst');
      expect(qifData.transactions.length).toEqual(2);
      expect(qifData.transactions[0].date).toEqual('1993-08-25');

      done();
    });
  });
});
