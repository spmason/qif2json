const fs = require('fs');
const qif2json = require('../lib/qif2json.js');

describe('accounts', () => {
  const reader = fs.createReadStream(`${__dirname}/files/accounts.qif`);

  it('can parse accounts', (done) => {
    qif2json.parseStream(reader, { dateFormat: 'us' }, (err, qifData) => {
      expect(err).toBeUndefined();

      expect(qifData.accounts.length).toEqual(1);
      expect(qifData.transactions.length).toEqual(3);
      expect(qifData.transactions[0].account).toEqual('Alior GBP');
      expect(qifData.accounts[0].name).toEqual('Alior GBP');
      expect(qifData.accounts[0].type).toEqual('Bank');

      done();
    });
  });
});
