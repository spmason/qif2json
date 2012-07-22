# qif2json

Parse .qif files into a sensible JSON format

## Getting Started
Install the module with: `npm install qif2json`

```javascript
var qif2json = require('qif2json');
qif2json.parse(qifData);

// Or to read in a file directly
qif2json.parseFile(filePath, function(errm qifData){
    // done!
});
```

If installed globally, the `qif2json` command can also be used with an input file and the output JSON will be pretty-printed to the console

## Contributing
Take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using `grunt lint` and `grunt test`.

## Release History
* 0.0.1 Initial release, small subset of qif fields understood, please make a pull request if you need more

## License
Copyright (c) 2012 Steve Mason  
Licensed under the MIT license.