/* eslint-disable no-console */
const program = require('commander');
const packageJson = require('../package.json');
const swaggerInline = require('./swagger-inline');

function Cli(args) {
  program
    .version(packageJson.version)
    .usage('[options] <inputGlobs ...>')
    .option('-b, --base [path]', 'A base Swagger file.')
    .option('-f, --format [format]', 'Output format (.json or .yaml).')
    .option('-s, --scope [scope]', 'API scope to constrain against');

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
  };

  swaggerInline(program.args, providedOptions)
    .then(output => {
      console.log(output);
    })
    .catch(err => {
      console.log('An error occured:');
      console.log(err);
    });
}

module.exports = Cli;
