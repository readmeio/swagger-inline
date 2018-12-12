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

    describe('.expandParam', () => {
        it('parses params properly', () => {

            var test = {
                "(query) hi=2* {Integer} This is a description": {
                    "in": "query",
                    "name": "hi",
                    "default": 2,
                    "required": true,
                    "type": "integer",
                    "description": "This is a description",
                },
                "(query) hi=2 {Integer} This is a description": {
                    "in": "query",
                    "name": "hi",
                    "default": 2,
                    "type": "integer",
                    "description": "This is a description",
                },
                "(path) hi=2* {Integer} This is a description": {
                    "in": "path",
                    "name": "hi",
                    "default": 2,
                    "required": true,
                    "type": "integer",
                    "description": "This is a description",
                },
                "(path) hi=2 {Integer} This is a description": {
                    "in": "path",
                    "name": "hi",
                    "default": 2,
                    "required": true,
                    "type": "integer",
                    "description": "This is a description",
                },
                "(body) test {Boolean} this is a description": {
                    "in": "body",
                    "name": "test",
                    "type": "boolean",
                    "description": "this is a description",
                },
                "(body) test=true {Boolean} this is a description": {
                    "in": "body",
                    "name": "test",
                    "default": true,
                    "type": "boolean",
                    "description": "this is a description",
                },
                "(body) test {Boolean:hi} this is a description": {
                    "in": "body",
                    "name": "test",
                    "type": "boolean",
                    "format": "hi",
                    "description": "this is a description",
                },
                "test {Boolean:hi} this is a description": false,
                "(body) {Boolean:hi} this is a description": false,
                "(body) test this is a description": false,
            };

            Object.keys(test).forEach((k) => {
                assert.deepEqual(Loader.expandParam(k), test[k]);
            });

        });
    });

    describe('.expandParam OAS 3', () => {
        it('parses params properly', () => {

            var test = {
                "(query) hi=2 {Integer} This is a description": {
                    "in": "query",
                    "name": "hi",
                    "schema": {
                      "type": "integer",
                      "default": 2,
                    },
                    "description": "This is a description",
                },
                "(query) hi=2* {Integer} This is a description": {
                    "in": "query",
                    "name": "hi",
                    "required": true,
                    "schema": {
                      "type": "integer",
                      "default": 2,
                    },
                    "description": "This is a description",
                },
                "(path) hi=2* {Integer} This is a description": {
                    "in": "path",
                    "name": "hi",
                    "required": true,
                    "schema": {
                      "type": "integer",
                      "default": 2,
                    },
                    "description": "This is a description",
                },
                "(path) hi=2 {Integer} This is a description": {
                    "in": "path",
                    "name": "hi",
                    "required": true, // in paths, always require
                    "schema": {
                      "default": 2,
                      "type": "integer",
                    },
                    "description": "This is a description",
                },
                "(body) test {Boolean} this is a description": {
                    "in": "body",
                    "name": "test",
                    "schema": {
                      "type": "boolean",
                    },
                    "description": "this is a description",
                },
                "(body) test {Boolean:hi} this is a description": {
                    "in": "body",
                    "name": "test",
                    "schema": {
                      "type": "boolean",
                      "format": "hi",
                    },
                    "description": "this is a description",
                },
                "(body) test=true {Boolean} this is a description": {
                    "in": "body",
                    "name": "test",
                    "schema": {
                      "type": "boolean",
                      "default": true,
                    },
                    "description": "this is a description",
                },
                "(body) {Boolean:hi} this is a description": {
                    "in": "body",
                    "name": "__base__",
                    "schema": {
                      "type": "boolean",
                      "format": "hi",
                    },
                    "description": "this is a description",
                },
                "test {Boolean:hi} this is a description": false,
                "(body) test this is a description": false,
            };

            Object.keys(test).forEach((k) => {
                assert.deepEqual(Loader.expandParam(k, 3), test[k]);
            });

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
