"use strict";

/* eslint-disable no-console */
var program = require("commander");
var packageJson = require("../package.json");
var Options = require("./options");
var swaggerInline = require("./swagger-inline");

function Cli(args) {
    program.version(packageJson.version).usage("[options] <inputGlobs ...>").option("-b, --base [path]", "A base swagger file.").option("-o, --out [path]", "Output file path.").option("-f, --format [format]", "Output swagger format (.json or .yaml).").option("-s, --scope [scope]", "api scope to generate");

    program.on("--help", function () {
        ["Example:", '\tswagger-inline "./*.js" --base ./swaggerBase.json --out ./swagger.json --scope public'].forEach(function (line) {
            return console.log(line);
        });
    });

    program.parse(args);

    if (program.args.length <= 0) {
        program.outputHelp();
        process.exit();
    }

    var providedOptions = {
        base: program.base,
        format: program.format,
        out: program.out,
        scope: program.scope,
        logger: console.log
    };

    swaggerInline(program.args, providedOptions).then(function (output) {
        var options = new Options(providedOptions);

        if (!options.getOut()) {
            console.log(output);
        }
    }).catch(function (err) {
        console.log("An error occured:");
        console.log(err);
    });
}

module.exports = Cli;