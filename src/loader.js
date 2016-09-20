const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const jsYaml = require('js-yaml');
const glob = require('glob');

class Loader {
    static resolvePaths(filepaths) {
        let paths = filepaths;
        if (typeof paths === 'string') {
            paths = [filepaths];
        }

        return new Promise((resolve, reject) => {
            const resolvePromises = paths.map((filepath) => {
                return Loader.resolvePath(filepath);
            });
            Promise.all(resolvePromises).then((resolvePathResults) => {
                const resolvedPaths = resolvePathResults.reduce((prev, current) => {
                    return prev.concat(current);
                }, []);
                resolve(resolvedPaths);
            }).catch(reject);
        });
    }

    static resolvePath(filepath) {
        return new Promise((resolve, reject) => {
            fs.stat(filepath, (err) => {
                if (err) {
                    glob(filepath, (globErr, filepaths) => {
                        if (globErr) {
                            reject(globErr);
                        } else {
                            resolve(filepaths);
                        }
                    });
                } else {
                    resolve([filepath]);
                }
            });
        });
    }

    static findSwagger(directory = process.cwd()) {
        return new Promise((resolve, reject) => {
            fs.readdir(directory, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    const swaggerCandidates = files.filter((file) => {
                        return Loader.SWAGGER_TYPES_REGEX.test(file);
                    }).map((file) => { return path.join(directory, file); });

                    const swaggerPromises = swaggerCandidates.map((filepath) => {
                        return Loader.loadData(filepath).then((data) => {
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

    static loadData(filepath) {
        const extname = path.extname(filepath);
        const loadFunction = Loader.LOADER_METHODS[extname];

        if (!loadFunction) {
            throw new Error(`Did not recognize ${filepath}.`);
        }
        return Loader.LOADER_METHODS[extname](filepath);
    }

    static loadBase(base = '') {
        return new Promise((resolve) => {
            fs.stat(base, (err, stat) => {
                if (!err && stat.isFile()) {
                    this.loadData(base).then((baseData) => {
                        resolve(baseData);
                    });
                } else if (!err && stat.isDirectory()) {
                    this.findSwagger(base).then((baseData) => {
                        resolve(baseData);
                    });
                } else {
                    this.findSwagger().then((baseData) => {
                        resolve(baseData);
                    });
                }
            });
        });
    }

    static loadYAML(filepath) {
        return Loader.loadFile(filepath).then((data) => jsYaml.load(data));
    }

    static loadJSON(filepath) {
        return Loader.loadFile(filepath).then((data) => JSON.parse(data));
    }
}

Loader.LOADER_METHODS = {
    '.yaml': Loader.loadYAML,
    '.yml': Loader.loadYAML,
    '.json': Loader.loadJSON,
};
Loader.SWAGGER_TYPES_REGEX = /\.json|\.yaml|\.yml/i
Loader.MAX_CONCURRENCY = 500;

module.exports = Loader;
