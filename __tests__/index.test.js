const fs = require('fs');
const jsYaml = require('js-yaml');

const swaggerInline = require('../src');

describe('Swagger Inline', () => {
  it('requires inputs', () => {
    expect(() => {
      return swaggerInline();
    }).toThrow('No files specified.');
  });

  it('returns a promise', () => {
    const returned = swaggerInline('*.js', { base: `${__dirname}/__fixtures__/project` });

    expect(typeof returned.then).toBe('function');
    expect(typeof returned.catch).toBe('function');
  });

  it('throws an error if no base was supplied', () => {
    expect(() => {
      return swaggerInline('*.js');
    }).toThrow('No base specification provided!');
  });

  it('resolves to a string', () => {
    return swaggerInline(`${__dirname}/__fixtures__/project/*.js`, { base: `${__dirname}/__fixtures__/project` }).then(
      res => {
        expect(typeof res).toBe('string');
      }
    );
  });

  describe.each([
    ['OpenAPI', `${__dirname}/__fixtures__/project-openapi`, 'openapiBase'],
    ['Swagger', `${__dirname}/__fixtures__/project`, 'swaggerBase'],
  ])('%s', (c, projectDir, base) => {
    const baseYAMLPath = `${projectDir}/${base}.yaml`;
    const baseJSONPath = `${projectDir}/${base}.json`;

    it('supports JSON', () => {
      return swaggerInline(`${projectDir}/*.js`, { base: baseJSONPath }).then(json => {
        expect(JSON.parse(json)).toMatchSnapshot();
      });
    });

    it('supports YAML', () => {
      const baseYAML = jsYaml.load(fs.readFileSync(baseYAMLPath, 'utf-8'));
      expect(Object.keys(baseYAML).length).toBeGreaterThan(0);

      return swaggerInline(`${projectDir}/*.js`, { base: baseYAMLPath }).then(yaml => {
        expect(yaml).toMatchSnapshot();

        expect(() => {
          return JSON.parse(yaml);
        }).toThrow(/Unexpected token/);
      });
    });
  });
});
