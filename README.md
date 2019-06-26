# qif2json

Parse .qif files into a sensible JSON format

[![Build Status](https://travis-ci.org/spmason/qif2json.svg)](https://travis-ci.org/spmason/qif2json)

## Getting Started
Install the module with: `npm install qif2json`

```javascript
var qif2json = require('qif2json');
qif2json.parse(qifData, options);

// Or to read in a file directly
qif2json.parseFile(filePath, options, function(err, qifData){
    // done!
});
```

If installed globally, the `qif2json` command can also be used with an input file and the output JSON will be pretty-printed to the console

## Options

* `dateFormat` - The format of dates within the file.  The `fetcha` module is used for parsing them into Date objects.  See https://www.npmjs.com/package/fecha#formatting-tokens for available formatting tokens. The special format `"us"` will use us-format MM/DD/YYYY dates. Dates are normalised before parsing so `/`, `'` become `-` and spaces are removed.

## Contributing
Take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using `npm test`.

## Release History
* 0.0.1 Initial release, small subset of qif fields understood, please make a pull request if you need more
* 0.0.2 Charset detection
* 0.0.4 Removed pretty-data dependency
* 0.0.5 Added --transaction flag to cli
* 0.0.6 Added stdin support
* 0.0.7 Better date parsing
* 0.0.8 Remove HTML encoded attributes during parse
* 0.0.9 Removed grunt, added jshint, jscs and editorconfig files to keep existing coding style. Updated dependencies & added to Travis
* 0.1.0 Support for Money 97 and "partial" transactions
* 0.1.1 Installs on node 0.12 and iojs 1.6
* 0.2.0 Added normalTransactions.qif example file + tests

## License
Licensed under the MIT license.
