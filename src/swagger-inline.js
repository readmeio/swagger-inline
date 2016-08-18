const path = require('path');
const glob = require('glob');
const Promise = require('bluebird');
const jsYaml = require('js-yaml');

const Loader = require('./loader');
const Extractor = require('./extractor');
const Options = require('./options');

function outputResult(object, options) {
    return options.getFormat() === '.json' ? JSON.stringify(object, null, 4) : jsYaml.dump(object);
}

function mergeEndpointsWithBase(swaggerBase, endpoints) {
    const merged = swaggerBase;
    merged.paths = merged.paths || {};

    return endpoints.reduce((prev, current) => {
        const method = current.method;
        const route = current.route;

        if (!method || !route) {
            return prev;
        }

        delete current.method;
        delete current.route;
        merged.paths[route] = merged.paths[route] || {};
        merged.paths[route][method] = merged.paths[route][method] || {};

        Object.assign(merged.paths[route][method], current);
        return merged;
    }, merged);
}

function swaggerInline(globPattern, providedOptions) {
    const options = new Options(providedOptions);

    if (typeof globPattern !== 'string') {
        throw new Error('No files specificied...');
    }

    return new Promise((resolve, reject) => {
        glob(globPattern, (err, files) => {
            if (err) {
                reject(err);
            }

            const base = options.getBase();
            const BasePromise = base ? Loader.loadData(base) : Promise.resolve({});

            BasePromise.then((baseObj) => {
                Loader.loadFiles(files).then((filesData) => {
                    const endpoints = filesData.map((code) => {
                        return Extractor.extractEndpointsFromCode(code);
                    }).reduce((prev, current) => {
                        return prev.concat(current); // Flatten
                    }, []);

                    const swagger = mergeEndpointsWithBase(baseObj, endpoints);

                    resolve(outputResult(swagger, options));
                });
            });
        });
    });
}

module.exports = swaggerInline;
