const assert = require('chai').assert;
const fs = require('fs');
const jsYaml = require('js-yaml');

const Loader = require('../src/loader');

describe('Loader', () => {
    describe('path resolving', () => {
        it('resolves multiple string paths', (done) => {
            const inputPaths = [`${__dirname}/../package.json`, `${__dirname}/../README.md`];
            Loader.resolvePaths(inputPaths).then((filepaths) => {
                assert.deepEqual(filepaths, inputPaths);
                done();
            }).catch(done);
        });

        it('resolves mixtures of glob and string paths', (done) => {
            const inputPaths = [`${__dirname}/*.js`, `${__dirname}/../README.md`];
            Loader.resolvePaths(inputPaths).then((filepaths) => {
                assert.isTrue(filepaths.length > 1);
                filepaths.forEach((filepath) => { assert.isString(filepath); });
                done();
            }).catch(done);
        });

        it('can resolve a string path', (done) => {
            Loader.resolvePaths(`${__dirname}/*.js`).then((filepaths) => {
                assert.isTrue(filepaths.length > 1);
                filepaths.forEach((filepath) => { assert.isString(filepath); });
                done();
            }).catch(done);
        });

        it('resolves a string glob', (done) => {
            Loader.resolvePath(`${__dirname}/../*.json`).then((filepaths) => {
                assert.isTrue(filepaths.length >= 1);
                assert.include(filepaths[0], 'package.json');
                done();
            }).catch(done);
        });

        it('resolves a string path', (done) => {
            Loader.resolvePath(__filename).then((filepaths) => {
                assert.lengthOf(filepaths, 1);
                done();
            }).catch(done);
        });

        it('rejects if the path is invalid', (done) => {
            Loader.resolvePath(['./nonsense']).then(() => {
                done(new Error('Loader.resolvePath was expected to reject'));
            }).catch((err) => {
                assert.include(err.toString(), 'TypeError');
                done();
            });
        });
    });

    describe('file loading', () => {
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

        it('loads yaml data', () => {
            const yamlPath = `${__dirname}/fixtures/project/swaggerBase.yaml`;
            const yamlObject = jsYaml.load(fs.readFileSync(yamlPath, 'utf-8'));
            Loader.loadData(yamlPath).then((yaml) => {
                Object.keys(yamlObject).forEach((key) => {
                    assert.isDefined(yaml[key]);
                });
            });
        });

        it('loads json data', () => {
            const jsonPath = `${__dirname}/fixtures/project/swaggerBase.json`;
            const jsonObject = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            Loader.loadData(jsonPath).then((json) => {
                Object.keys(jsonObject).forEach((key) => {
                    assert.isDefined(json[key]);
                });
            });
        });
    });
});
