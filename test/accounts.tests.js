const fs = require('fs');
const qif2json = require('../lib/qif2json.js');

describe('accounts', () => {
  const reader = fs.createReadStream(`${__dirname}/files/accounts.qif`);

  it('can parse accounts', (done) => {
    qif2json.parseStream(reader, { dateFormat: 'us' }, (err, qifData) => {
      expect(err).toBeUndefined();

      expect(qifData.accounts.length).toEqual(1);
      expect(qifData.transactions.length).toEqual(4);
      expect(qifData.transactions[3].date.startsWith('2016'));
      expect(qifData.transactions[0].account).toEqual('Alior GBP');
      expect(qifData.accounts[0].name).toEqual('Alior GBP');
      expect(qifData.accounts[0].type).toEqual('Bank');

      done();
    });
  });

  it('handle with duplicates', () => {
    const data = qif2json.parse(`!Account
NAlior GBP
TBank
^
NAlior PLN
TBank
^
!Account
NAlior PLN
TBank
^
!Type:Bank
D04/30'16
PWeb Page
U750.00
T750.00
LIncome:Invoices
^
D05/04'16
PAccounting
U-668.28
T-668.28
LCompany:Accounting
^
!Account
NAlior GBP
TBank
^
!Type:Bank
D04/30'16
PNew computer
U900.00
T900.00
LCompany:Devices
^
D05/04'16
PCoffee
U-855.28
T-855.28
LFood:Drink
^`);

    console.log(data);

    expect(data.transactions.filter((t) => t.account === 'Alior GBP').length).toEqual(2);
    expect(data.accounts.filter((t) => t.name === 'Alior GBP').length).toEqual(1);
  });
});
