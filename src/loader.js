const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const jsYaml = require('js-yaml');

class Loader {
    static loadFiles(filepaths) {
        return new Promise((resolve) => {
            const loadPromises = filepaths.map((filepath) => {
                return Loader.loadFile(filepath);
            });
            resolve(Promise.all(loadPromises));
        });
    }

    static loadFile(filepath) {
        return new Promise((resolve) => {
            fs.readFile(filepath, 'utf-8', (err, data) => {
                if (err) {
                    resolve(err);
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

module.exports = Loader;
