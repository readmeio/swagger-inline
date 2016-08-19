const Promise = require('bluebird');
const jsYaml = require('js-yaml');
const _ = require('lodash');

const Loader = require('./loader');
const Extractor = require('./extractor');
const Options = require('./options');

function outputResult(object, options) {
    return options.getFormat() === '.json' ? JSON.stringify(object, null, 2) : jsYaml.dump(object);
}

function mergeEndpointsWithBase(swaggerBase = {}, endpoints = []) {
    return endpoints.reduce((prev, current) => {
        const method = current.method;
        const route = current.route;
        const descriptor = _.omit(current, ['method', 'route']);

        if (!method || !route) {
            return prev;
        }

        return _.set(prev, ['paths', route, method], descriptor);
    }, swaggerBase);
}

function swaggerInline(globPatterns, providedOptions) {
    if (typeof globPatterns === 'undefined') {
        throw Error('No files specificied');
    }

    const options = new Options(providedOptions);
    const log = options.getLogger();

    return Loader.resolvePaths(globPatterns).then((files) => {
        const base = options.getBase();
        const BasePromise = base ? Loader.loadData(base) : Promise.resolve({});

        log(`${files.length} files matched...`);

        return BasePromise.then((baseObj) => {
            return Loader.loadFiles(files).then((filesData) => {
                const successfulFilesData = filesData.filter((fileData) => {
                    return typeof fileData === 'string';
                });
                const endpoints = _.flatten(successfulFilesData.map((code) => {
                    return Extractor.extractEndpointsFromCode(code);
                }));

                log(`${endpoints.length} swagger definitions found...`);

                const swagger = mergeEndpointsWithBase(baseObj, endpoints);
                log(`swagger${options.getFormat()} created!`);
                return outputResult(swagger, options);
            });
        });
    });
}

module.exports = swaggerInline;
