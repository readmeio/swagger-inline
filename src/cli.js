/* eslint-disable no-console */
const program = require('commander');

const pkg = require('../package.json');

const swaggerInline = require('.');

module.exports = function (args) {
  program
    .version(pkg.version)
    .usage('[options] <inputGlobs ...>')
    .option('-b, --base [path]', 'A base OpenAPI or Swagger definition to build off of.')
    .option('-f, --format [format]', 'Output format (.json or .yaml).')
    .option('-s, --scope [scope]', 'API scope to constrain against')
    .option(
      '-p, --pattern [pattern]',
      'Custom comment pattern supported by the multilang-extract-comments library in the form of a JSON file'
    )
    .option(
      '-t, --title [title]',
      'Value to update the `info.title` attribute with in the base OpenAPI or Swagger definition'
    )
    .option(
      '-v, --apiVersion [version]',
      'Value to update the `info.version` attribute with in the base OpenAPI or Swagger definition'
    );

  program.on('--help', () => {
    console.log('');
    console.log('Example:');
    console.log('  swagger-inline "./*.js" --base ./openapiBase.json --scope public > api.json');
  });

  program.parse(args);

  if (program.args.length <= 0) {
    program.outputHelp();
    process.exit();
  }

  const providedOptions = {
    base: program.base,
    format: program.format,
    scope: program.scope,
    pattern: program.pattern,
    title: program.title,
    apiVersion: program.apiVersion,
  };

  swaggerInline(program.args, providedOptions)
    .then(output => {
      console.log(output);
    })
    .catch(err => {
      console.error('An error occured:');
      console.error(err);
      process.exit(-1);
    });
};
