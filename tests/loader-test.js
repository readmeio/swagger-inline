const assert = require('chai').assert;
const fs = require('fs');
const jsYaml = require('js-yaml');

const Loader = require('../src/loader');

describe('Loader', () => {
    describe('.resolvePaths', () => {
        it('resolves multiple string paths', (done) => {
            const inputPaths = [`${process.cwd()}/package.json`, `${process.cwd()}/README.md`];
            Loader.resolvePaths(inputPaths).then((filepaths) => {
                assert.deepEqual(filepaths, inputPaths);
                done();
            }).catch(done);
        });

        it('resolves mixtures of glob and string paths', (done) => {
            const inputPaths = [`${process.cwd()}/tests/*.js`, `${process.cwd()}/README.md`];
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
    });

    describe('.loadBase', () => {
        it('loads an empty object if no swagger is found', () => {
            return Loader.loadBase().then((base) => {
                assert.deepEqual(base, {});
            });
        });

        it('loads json file data', () => {
            const jsonPath = `${__dirname}/fixtures/project/swaggerBase.json`;
            return Loader.loadBase(jsonPath).then((base) => {
                assert.isDefined(base.swagger);
            });
        });

        it('loads yaml file data', () => {
            const yamlPath = `${__dirname}/fixtures/project/swaggerBase.yaml`;
            return Loader.loadBase(yamlPath).then((base) => {
                assert.isDefined(base.swagger);
            });
        });

        it('searches for swagger in the provided directory', () => {
            const dir = `${__dirname}/fixtures/project/`;
            return Loader.loadBase(dir).then((base) => {
                assert.isDefined(base.swagger);
            });
        });

        it('returns an empty object if swagger is not found in a directory', () => {
            return Loader.loadBase(__dirname).then((base) => {
                assert.deepEqual(base, {});
            });
        });
    });

    describe('.loadFiles', () => {
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

    describe('.loadData', () => {
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
