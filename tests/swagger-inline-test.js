const fs = require('fs');
const assert = require('chai').assert;
const jsYaml = require('js-yaml');

const swaggerInline = require('../src/swagger-inline');

const projectDir = `${__dirname}/fixtures/project`;
const baseYAMLPath = `${projectDir}/swaggerBase.yaml`;
const baseJSONPath = `${projectDir}/swaggerBase.json`;

describe('Swagger Inline', () => {
    it('requires inputs', () => {
        assert.throws(swaggerInline.bind(null, undefined), 'files');
    });

    it('returns a promise', () => {
        const returned = swaggerInline('*.js', {});

        assert.isFunction(returned.then);
        assert.isFunction(returned.catch);
    });

    it('resolves to a string', (done) => {
        swaggerInline(`${__dirname}/fixtures/project/*.js`).then((generatedSwagger) => {
            assert.isString(generatedSwagger);
            done();
        }).catch(done);
    });

    it('adds the base json', (done) => {
        const baseJSON = JSON.parse(fs.readFileSync(baseJSONPath, 'utf-8'));
        swaggerInline(`${projectDir}/*.js`, { base: baseJSONPath }).then((json) => {
            const outputJSON = JSON.parse(json);
            Object.keys(baseJSON).forEach((baseKey) => {
                assert.isDefined(outputJSON[baseKey], `'${baseKey}' was not in swagger output`);
            });
            done();
        }).catch(done);
    });

    it('adds the base yaml', (done) => {
        const baseYAML = jsYaml.load(fs.readFileSync(baseYAMLPath, 'utf-8'));
        swaggerInline(`${projectDir}/*.js`, { base: baseYAMLPath }).then((yaml) => {
            const outputYAML = jsYaml.load(yaml);
            Object.keys(baseYAML).forEach((baseKey) => {
                assert.isDefined(outputYAML[baseKey], `'${baseKey}' was not in swagger output`);
            });
            assert.throws(JSON.parse.bind(null, yaml));
            done();
        }).catch(done);
    });

    it('merges extracted swagger into the base swagger', (done) => {
        swaggerInline(`${projectDir}/*.js`, { base: baseJSONPath }).then((json) => {
            const outputJSON = JSON.parse(json);

            assert.isObject(outputJSON.paths);

            Object.keys(outputJSON.paths).forEach((paths) => {
                assert.equal(paths.charAt(0), '/'); // everything is a path
            });

            done();
        }).catch(done);
    });
});
