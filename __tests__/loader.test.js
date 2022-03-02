const fs = require('fs');
const jsYaml = require('js-yaml');

const Loader = require('../src/loader');

describe('Loader', () => {
  describe('#resolvePaths', () => {
    it('resolves multiple string paths', () => {
      const inputPaths = [`${process.cwd()}/package.json`, `${process.cwd()}/README.md`];
      return Loader.resolvePaths(inputPaths).then(filepaths => {
        expect(filepaths).toStrictEqual(inputPaths);
      });
    });

    it('resolves mixtures of glob and string paths', () => {
      const inputPaths = [`${process.cwd()}/__tests__/*.js`, `${process.cwd()}/README.md`];
      return Loader.resolvePaths(inputPaths).then(filepaths => {
        expect(filepaths.length).toBeGreaterThan(1);
        filepaths.forEach(filepath => {
          expect(typeof filepath).toBe('string');
        });
      });
    });

    it('can resolve a string path', () => {
      return Loader.resolvePaths(`${__dirname}/*.js`).then(filepaths => {
        expect(filepaths.length).toBeGreaterThan(1);
        filepaths.forEach(filepath => {
          expect(typeof filepath).toBe('string');
        });
      });
    });
  });

  describe('#loadBase', () => {
    it('loads an empty object if no base definition is found', () => {
      return Loader.loadBase().then(base => {
        expect(base).toStrictEqual({});
      });
    });

    it('loads JSON file data', () => {
      const jsonPath = `${__dirname}/__fixtures__/project/swaggerBase.json`;
      return Loader.loadBase(jsonPath).then(base => {
        expect(base.swagger).toBeDefined();
      });
    });

    it('loads YAML file data', () => {
      const yamlPath = `${__dirname}/__fixtures__/project/swaggerBase.yaml`;
      return Loader.loadBase(yamlPath).then(base => {
        expect(base.swagger).toBeDefined();
      });
    });

    it('searches for a base API definition in the provided directory', () => {
      const dir = `${__dirname}/__fixtures__/project/`;
      return Loader.loadBase(dir).then(base => {
        expect(base.swagger).toBeDefined();
      });
    });

    it('returns an empty object if base API is not found in a directory', () => {
      return Loader.loadBase(__dirname).then(base => {
        expect(base).toStrictEqual({});
      });
    });
  });

  describe('#loadPattern', () => {
    it('returns a pattern object', async () => {
      const patternPath = `${__dirname}/__fixtures__/patterns/pattern-valid.json`;
      await expect(Loader.loadPattern(patternPath)).resolves.toStrictEqual({
        multiLineComment: [
          {
            end: '*/',
            middle: '',
            start: '/*',
          },
        ],
        name: 'Apex',
        nameMatchers: ['.cls'],
        singleLineComment: [
          {
            start: '//',
          },
        ],
      });
    });

    it('returns null if the file is invalid json', async () => {
      const patternPath = `${__dirname}/__fixtures__/patterns/pattern-invalid.json`;
      await expect(Loader.loadPattern(patternPath)).resolves.toBeNull();
    });

    it('returns null if the file does not exist', () => {
      const patternPath = '${__dirname}/__fixtures__/patterns/pattern-that-does-not-exist.json';
      return Loader.loadPattern(patternPath).then(pattern => {
        expect(pattern).toBeNull();
      });
    });

    it('does not error when the filepath input param is null', () => {
      return Loader.loadPattern(null).then(pattern => {
        expect(pattern).toBeNull();
      });
    });
  });

  describe('#loadFiles', () => {
    it('loads arrays of files', () => {
      return Loader.loadFiles([`${__dirname}/../package.json`, `${__dirname}/../package.json`]).then(files => {
        expect(files).toHaveLength(2);
        expect(files[0].length).toBeGreaterThan(100);
      });
    });

    it('returns errors for non-existent files', () => {
      return expect(() => {
        return Loader.loadFiles([`${__dirname}/../package.json`, `dne.js`]);
      }).rejects.toThrow(/no such file or directory/);
    });
  });

  describe('#expandParam', () => {
    it('parses params properly', () => {
      const test = {
        '(query) hi=2* {Integer} This is a description': {
          in: 'query',
          name: 'hi',
          default: 2,
          required: true,
          type: 'integer',
          description: 'This is a description',
        },
        '(query) hi=2 {Integer} This is a description': {
          in: 'query',
          name: 'hi',
          default: 2,
          type: 'integer',
          description: 'This is a description',
        },
        '(path) hi=2* {Integer} This is a description': {
          in: 'path',
          name: 'hi',
          default: 2,
          required: true,
          type: 'integer',
          description: 'This is a description',
        },
        '(path) hi=2 {Integer} This is a description': {
          in: 'path',
          name: 'hi',
          default: 2,
          required: true,
          type: 'integer',
          description: 'This is a description',
        },
        '(body) test {Boolean} this is a description': {
          in: 'body',
          name: 'test',
          type: 'boolean',
          description: 'this is a description',
        },
        '(body) test=true {Boolean} this is a description': {
          in: 'body',
          name: 'test',
          default: true,
          type: 'boolean',
          description: 'this is a description',
        },
        '(body) test {Boolean:hi} this is a description': {
          in: 'body',
          name: 'test',
          type: 'boolean',
          format: 'hi',
          description: 'this is a description',
        },
        'test {Boolean:hi} this is a description': false,
        '(body) {Boolean:hi} this is a description': false,
        '(body) test this is a description': false,
      };

      Object.keys(test).forEach(k => {
        expect(Loader.expandParam(k)).toStrictEqual(test[k]);
      });
    });

    describe('OpenAPI 3.0', () => {
      it('parses params properly', () => {
        const test = {
          '(query) hi=2 {Integer} This is a description': {
            in: 'query',
            name: 'hi',
            schema: {
              type: 'integer',
              default: 2,
            },
            description: 'This is a description',
          },
          '(query) hi=2* {Integer} This is a description': {
            in: 'query',
            name: 'hi',
            required: true,
            schema: {
              type: 'integer',
              default: 2,
            },
            description: 'This is a description',
          },
          '(path) hi=2* {Integer} This is a description': {
            in: 'path',
            name: 'hi',
            required: true,
            schema: {
              type: 'integer',
              default: 2,
            },
            description: 'This is a description',
          },
          '(path) hi=2 {Integer} This is a description': {
            in: 'path',
            name: 'hi',
            required: true, // in paths, always require
            schema: {
              default: 2,
              type: 'integer',
            },
            description: 'This is a description',
          },
          '(body) test {Boolean} this is a description': {
            in: 'body',
            name: 'test',
            schema: {
              type: 'boolean',
            },
            description: 'this is a description',
          },
          '(body) test {Boolean:hi} this is a description': {
            in: 'body',
            name: 'test',
            schema: {
              type: 'boolean',
              format: 'hi',
            },
            description: 'this is a description',
          },
          '(body) test=true {Boolean} this is a description': {
            in: 'body',
            name: 'test',
            schema: {
              type: 'boolean',
              default: true,
            },
            description: 'this is a description',
          },
          '(body) {Boolean:hi} this is a description': {
            in: 'body',
            name: '__base__',
            schema: {
              type: 'boolean',
              format: 'hi',
            },
            description: 'this is a description',
          },
          'test {Boolean:hi} this is a description': false,
          '(body) test this is a description': false,
        };

        Object.keys(test).forEach(k => {
          expect(Loader.expandParam(k, 3)).toStrictEqual(test[k]);
        });
      });
    });
  });

  describe('#loadData', () => {
    it('loads YAML data', () => {
      const yamlPath = `${__dirname}/__fixtures__/project/swaggerBase.yaml`;
      const yamlObject = jsYaml.load(fs.readFileSync(yamlPath, 'utf-8'));
      return Loader.loadData(yamlPath).then(yaml => {
        Object.keys(yamlObject).forEach(key => {
          expect(yaml[key]).toBeDefined();
        });
      });
    });

    it('loads JSON data', () => {
      const jsonPath = `${__dirname}/__fixtures__/project/swaggerBase.json`;
      const jsonObject = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      return Loader.loadData(jsonPath).then(json => {
        Object.keys(jsonObject).forEach(key => {
          expect(json[key]).toBeDefined();
        });
      });
    });
  });
});
