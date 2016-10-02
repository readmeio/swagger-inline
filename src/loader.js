const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const jsYaml = require('js-yaml');
const glob = require('multi-glob').glob;

class Loader {
    static resolvePaths(filepaths, callback) {
        return new Promise(function (resolve, reject) {
            glob(filepaths, {ignore: ['node_modules/*']}, (err, files) => {
                return err === null ? resolve(files) : reject(err)
            })
        });
    }

    static findSwagger(directory = process.cwd(), options = {}) {
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
                            return data.swagger ? Promise.resolve(data) : Promise.reject();
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

    static loadBase(base = '', options = {}) {
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
        if(options.options.metadata) {
            data['x-si-base'] = filepath;
        }
        return data;
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
