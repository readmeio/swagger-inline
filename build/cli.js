"use strict";

/* eslint-disable no-console */
var program = require('commander');

var packageJson = require('../package.json');

var swaggerInline = require('./swagger-inline');

function Cli(args) {
  program.version(packageJson.version).usage('[options] <inputGlobs ...>').option('-b, --base [path]', 'A base Swagger file.').option('-f, --format [format]', 'Output format (.json or .yaml).').option('-s, --scope [scope]', 'API scope to constrain against');
  program.on('--help', function () {
    console.log('');
    console.log('Example:');
    console.log('  swagger-inline "./*.js" --base ./openapiBase.json --scope public > api.json');
  });
  program.parse(args);

  if (program.args.length <= 0) {
    program.outputHelp();
    process.exit();
  }

  var providedOptions = {
    base: program.base,
    format: program.format,
    scope: program.scope
  };
  swaggerInline(program.args, providedOptions).then(function (output) {
    console.log(output);
  })["catch"](function (err) {
    console.log('An error occured:');
    console.log(err);
  });
}

module.exports = Cli;