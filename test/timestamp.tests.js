const qif2json = require('../lib/qif2json.js');

describe('timestamp date format', () => {
  it('Can parse timestamp example', () => {
    const data = qif2json.parse(['!Type:Bank',
      'D26-06-2019 00:00:00',
      'T-379.00',
      'PCITY OF SPRINGFIELD',
      '^',
      'D27-06-2019 00:00:00',
      'T-20.28',
      'PYOUR LOCAL SUPERMARKET',
      '^',
      'D28-06-2019 00:00:00',
      'T-421.35',
      'PSPRINGFIELD WATER UTILITY',
      '^',
    ].join('\r\n'));

    expect(data.type).toEqual('Bank');
    expect(data.transactions.length).toEqual(3);

    expect(data.transactions[0].date).toEqual('2019-06-26');
    expect(data.transactions[0].amount).toEqual(-379);
    expect(data.transactions[0].payee).toEqual('CITY OF SPRINGFIELD');
  });
});
