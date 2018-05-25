const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const jsYaml = require('js-yaml');
const glob = require('multi-glob').glob;

class Loader {
    static resolvePaths(filepaths, options) {
        const ignore = options ? options.getIgnore() : undefined;
        return new Promise(function (resolve, reject) {
            glob(filepaths, { ignore: ignore }, (err, files) => {
                return err === null ? resolve(files) : reject(err)
            })
        });
    }

    static findSwagger(directory = process.cwd(), options) {
        return new Promise((resolve, reject) => {
            fs.readdir(directory, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    const swaggerCandidates = files.filter((file) => {
                        return Loader.SWAGGER_TYPES_REGEX.test(file);
                    }).map((file) => { return path.join(directory, file); });

                    const swaggerPromises = swaggerCandidates.map((filepath) => {
                        return Loader.loadData(filepath, options).then((data) => {
                            return (data.swagger || data.openapi) ? Promise.resolve(data) : Promise.reject();
                        });
                    });

                    Promise.any(swaggerPromises).then((loadedSwagger) => {
                        resolve(loadedSwagger);
                    }).catch(() => { resolve({}); });
                }
            });
        });
    }

    static loadFiles(filepaths) {
        return new Promise((resolve) => {
            const loadPromises = Promise.map(filepaths, (filepath) => {
                return Loader.loadFile(filepath).reflect();
            }, { concurrency: Loader.MAX_CONCURRENCY });
            resolve(loadPromises);
        }).then((loadResults) => {
            return loadResults.map((loadResult) => {
                return loadResult.isFulfilled() ? loadResult.value() : loadResult.reason();
            });
        });
    }

    static loadFile(filepath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filepath, 'utf-8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    static loadData(filepath, options) {
        const extname = path.extname(filepath);
        const loadFunction = Loader.LOADER_METHODS[extname];

        if (!loadFunction) {
            throw new Error(`Did not recognize ${filepath}.`);
        }
        var loaded = Loader.LOADER_METHODS[extname](filepath, options);
        return loaded;
    }

    static loadBase(base = '', options) {
        return new Promise((resolve) => {
            fs.stat(base, (err, stat) => {
                if (!err && stat.isFile()) {
                    this.loadData(base, options).then((baseData) => {
                        resolve(baseData);
                    });
                } else if (!err && stat.isDirectory()) {
                    this.findSwagger(base, options).then((baseData) => {
                        resolve(baseData);
                    });
                } else {
                    this.findSwagger(process.cwd(), options).then((baseData) => {
                        resolve(baseData);
                    });
                }
            });
        });
    }

    static loadYAML(filepath, options) {
        return Loader.loadFile(filepath).then((data) =>
            Loader.addMetadata(jsYaml.load(data), filepath, options)
        );
    }

    static loadJSON(filepath, options) {
        return Loader.loadFile(filepath).then((data) =>
            Loader.addMetadata(JSON.parse(data), filepath, options)
        );
    }

    static addMetadata(data, filepath, options) {
        if(options && options.getMetadata()) {
            data['x-si-base'] = filepath;
        }
        return data;
    }

    static addResponse(endpoints = {}) {
        // If there's no response, add a default one
        endpoints.forEach(endpoint => {
            if(!endpoint.responses || !Object.keys(endpoint.responses).length) {
                endpoint.responses = {
                    "200": {
                        "description": "Successful response",
                    }
                };
            }
        });
        return endpoints;
    }

    static expandParams(endpoints = {}) {
        endpoints.forEach(endpoint => {
            if(endpoint && endpoint.parameters) {
                endpoint.parameters.forEach((param, i) => {
                    if(typeof param === 'string') {
                        endpoint.parameters[i] = Loader.expandParam(param);
                    }
                })

                // Remove any params that couldn't be parsed
                endpoint.parameters = endpoint.parameters.filter(n => n != false)
            };
        });
        return endpoints;
    }

    static expandParam(param = "") {
        var parsed = param.match(/(?:\((.*)\))?\s*([\w._-]+)(?:=([^{*]*))?([*])?\s*{(.*?)(?::(.*))?}\s*(.*)?/);;

        if(!parsed || !parsed[1] || !parsed[2] || !parsed[5]) return false;

        var out = {
            'in': parsed[1],
            'name': parsed[2],
            'type': parsed[5].toLowerCase(),
        };

        if(parsed[3]) out.default = parsed[3].trim();
        if(parsed[4]) out.required = true;
        if(parsed[6]) out.format = parsed[6];
        if(parsed[7]) out.description = parsed[7];

        return out;
    }

}

Loader.LOADER_METHODS = {
    '.yaml': Loader.loadYAML,
    '.yml': Loader.loadYAML,
    '.json': Loader.loadJSON,
};
Loader.SWAGGER_TYPES_REGEX = /\.json|\.yaml|\.yml/i;
Loader.MAX_CONCURRENCY = 500;

module.exports = Loader;
