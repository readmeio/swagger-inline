const fs = require('fs');
const program = require('commander');
const packageJson = require('../package.json');
const Options = require('./options');
const swaggerInline = require('./swagger-inline');

function Cli(args) {
    program
        .version(packageJson.version)
        .usage('[options] <inputGlob>')
        .option('-b, --base [path]', 'A base swagger file.')
        .option('-f, --format', 'Output swagger format (.json or .yaml).');

    program.on('--help', () => {
        [
            'Example:',
            '\tswagger-inline "./*.js" --base ./swaggerBase.json',
        ].forEach((line) => console.log(line));
    });

    program.parse(args);

    if (program.args.length <= 0) {
        program.outputHelp();
        process.exit();
    }

    const providedOptions = {
        base: program.base,
        format: program.format,
    };

    swaggerInline(program.args[0], providedOptions).then((output) => {
        const options = new Options(providedOptions);

        fs.writeFileSync(`./swagger${options.getFormat()}`, output, 'utf-8');
    });
}

module.exports = Cli;
