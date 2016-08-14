const glob = require('glob');
const Promise = require('bluebird');

const Loader = require('./loader');

function swaggerInline(globPattern, options) {
    if (typeof globPattern !== 'string') {
        throw new Error('No files specificied...');
    }

    return new Promise((resolve, reject) => {
        glob(globPattern, (err, files) => {
            if (err) {
                reject(err);
            }

            Loader.loadFiles(files).then((filesData) => {
                resolve(filesData.join('\n'));
            });
        });
    });
}

module.exports = swaggerInline;
