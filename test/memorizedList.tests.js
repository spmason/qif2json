
const fs = require('fs');
const qif2json = require('../lib/qif2json.js');

describe('memorizedList', () => {
  const reader = fs.createReadStream(`${__dirname}/files/memorizedList.qif`);

  xit('can parse memorizedList', (done) => {
    qif2json.parseStream(reader, { dateFormat: 'us' }, (err, qifData) => {
      expect(err).toBeUndefined();

      expect(qifData.type).toEqual('Invst');
      expect(qifData.transactions.length).toEqual(2);
      expect(qifData.transactions[0].date).toEqual('1993-08-25');

      done();
    });
  });
});
