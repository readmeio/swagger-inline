const assert = require('chai').assert;
const fs = require('fs');
const jsYaml = require('js-yaml');

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
