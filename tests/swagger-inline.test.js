const fs = require('fs');
const jsYaml = require('js-yaml');

const swaggerInline = require('../src/swagger-inline');

const projectDir = `${__dirname}/fixtures/project`;
const baseYAMLPath = `${projectDir}/swaggerBase.yaml`;
const baseJSONPath = `${projectDir}/swaggerBase.json`;

describe('Swagger Inline', () => {
  it('requires inputs', () => {
    expect(() => {
      return swaggerInline();
    }).toThrow('No files specified.');
  });

  it('returns a promise', () => {
    const returned = swaggerInline('*.js', { base: baseJSONPath });

    expect(typeof returned.then).toBe('function');
    expect(typeof returned.catch).toBe('function');
  });

  it('throws an error if no base was supplied', () => {
    expect(() => {
      return swaggerInline('*.js');
    }).toThrow('No base specification provided!');
  });

  it('resolves to a string', () => {
    return swaggerInline(`${__dirname}/fixtures/project/*.js`, { base: baseJSONPath }).then(generatedSwagger => {
      expect(typeof generatedSwagger).toBe('string');
    });
  });

  it('adds the base json', () => {
    const baseJSON = JSON.parse(fs.readFileSync(baseJSONPath, 'utf-8'));
    return swaggerInline(`${projectDir}/*.js`, { base: baseJSONPath }).then(json => {
      const outputJSON = JSON.parse(json);
      Object.keys(baseJSON).forEach(baseKey => {
        expect(outputJSON[baseKey]).not.toBeUndefined();
      });
    });
  });

  it('adds the base yaml', () => {
    const baseYAML = jsYaml.load(fs.readFileSync(baseYAMLPath, 'utf-8'));
    return swaggerInline(`${projectDir}/*.js`, { base: baseYAMLPath }).then(yaml => {
      const outputYAML = jsYaml.load(yaml);
      Object.keys(baseYAML).forEach(baseKey => {
        expect(outputYAML[baseKey]).not.toBeUndefined();
      });

      expect(() => {
        return JSON.parse(yaml);
      }).toThrow(/Unexpected token/);
    });
  });

  it('merges extracted swagger into the base swagger', () => {
    return swaggerInline(`${projectDir}/*.js`, { base: baseJSONPath }).then(json => {
      const outputJSON = JSON.parse(json);

      expect(typeof outputJSON.paths).toBe('object');

      Object.keys(outputJSON.paths).forEach(paths => {
        expect(paths.charAt(0)).toBe('/'); // everything is a path
      });
    });
  });

  it('merges extracted schemes into the base swagger', () => {
    return swaggerInline(`${projectDir}/*.js`, { base: baseJSONPath }).then(json => {
      const outputJSON = JSON.parse(json);

      Object.keys(outputJSON.components.schemas).forEach(component => {
        expect(typeof outputJSON.components.schemas[component]).toBe('object');
      });
    });
  });
});
