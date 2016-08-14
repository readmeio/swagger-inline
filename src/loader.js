const fs = require('fs');
const Promise = require('bluebird');

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
                }
                resolve(data);
            });
        });
    }
}

module.exports = Loader;
