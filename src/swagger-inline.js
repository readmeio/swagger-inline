const Promise = require("bluebird");
const fs = require("fs-extra");
const jsYaml = require("js-yaml");
const _ = require("lodash");
const chalk = require("chalk");

const Loader = require("./loader");
const Extractor = require("./extractor");
const Options = require("./options");

function outputResult(object, options) {
    return new Promise(resolve => {
        const result = options.isJSON()
            ? JSON.stringify(object, null, 2)
            : jsYaml.dump(object);
        const outPath = options.getOut();
        if (outPath) {
            fs.outputFile(outPath, result, err => {
                if (err) {
                    options.getLogger()(
                        `Failed to write swagger to ${outPath}`
                    );
                }
                resolve(result);
            });
        } else {
            resolve(result);
        }
    });
}

function mergeEndpointsWithBase(swaggerBase = {}, endpoints = []) {
    return endpoints.reduce((prev, current) => {
        const method = current.method;
        const route = current.route;
        const descriptor = _.omit(current, ["method", "route"]);

        if (!method || !route) {
            return prev;
        }

        return _.set(prev, ["paths", route, method], descriptor);
    }, swaggerBase);
}

function swaggerInline(globPatterns, providedOptions) {
    if (typeof globPatterns === "undefined") {
        throw Error("No files specificied");
    }

    const options = new Options(providedOptions);
    const log = options.getOut() ? options.getLogger() : () => {};

    return Loader.resolvePaths(globPatterns, options).then(files => {
        const base = options.getBase();

        return Loader.loadBase(base, options).then(baseObj => {
            const swaggerVersion = parseInt(
                baseObj.swagger || baseObj.openapi,
                10
            );

            if (Object.keys(baseObj).length === 0) {
                log(chalk.yellow("No base swagger provided/found!"));
            }

            log(`${files.length} files matched...`);
            return Loader.loadFiles(files).then(filesData => {
                const successfulFiles = filesData
                    .map((fileData, index) => {
                        return { fileData, fileName: files[index] };
                    })
                    .filter(fileInfo => {
                        return typeof fileInfo.fileData === "string";
                    });
                const endpoints = _.flatten(
                    successfulFiles.map(fileInfo => {
                        try {
                            let endpoints = Extractor.extractEndpointsFromCode(
                                fileInfo.fileData,
                                {
                                    filename: fileInfo.fileName,
                                    scope: options.getScope()
                                }
                            );

                            endpoints = Loader.addResponse(endpoints);
                            endpoints = Loader.expandParams(
                                endpoints,
                                swaggerVersion
                            );
                            return endpoints;
                        } catch (e) {
                            log(
                                chalk.red(`Error parsing ${fileInfo.fileName}`)
                            );
                            log(chalk.red(e.toString()));
                            return {};
                        }
                    })
                );

                log(`${endpoints.length} swagger definitions found...`);

                const swagger = mergeEndpointsWithBase(baseObj, endpoints);
                log(`swagger${options.getFormat()} created!`);
                return outputResult(swagger, options);
            });
        });
    });
}

module.exports = swaggerInline;
