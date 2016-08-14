const assert = require('chai').assert;

const Loader = require('../src/loader');
const packageJson = require('../package.json');

describe('Loader', () => {
    it('loads arrays of files', (done) => {
        Loader.loadFiles(
            [`${__dirname}/../package.json`, `${__dirname}/../package.json`]
        ).then((files) => {
            assert.lengthOf(files, 2);
            assert.isAtLeast(files[0].length, 100);
            done();
        }).catch(done);
    });

    it('returns errors for non-existent files', (done) => {
        Loader.loadFiles(['dne.js']).then((files) => {
            assert.typeOf(files[0], 'Error');
            done();
        }).catch(done);
    });
});
