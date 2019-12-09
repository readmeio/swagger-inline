const fs = require('fs');
const jsYaml = require('js-yaml');

const Loader = require('../src/loader');

describe('Loader', () => {
  describe('.resolvePaths', () => {
    it('resolves multiple string paths', () => {
      const inputPaths = [`${process.cwd()}/package.json`, `${process.cwd()}/README.md`];
      return Loader.resolvePaths(inputPaths).then(filepaths => {
        expect(filepaths).toStrictEqual(inputPaths);
      });
    });

    it('resolves mixtures of glob and string paths', () => {
      const inputPaths = [`${process.cwd()}/tests/*.js`, `${process.cwd()}/README.md`];
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

  describe('.loadBase', () => {
    it('loads an empty object if no swagger is found', () => {
      return Loader.loadBase().then(base => {
        expect(base).toStrictEqual({});
      });
    });

    it('loads json file data', () => {
      const jsonPath = `${__dirname}/fixtures/project/swaggerBase.json`;
      return Loader.loadBase(jsonPath).then(base => {
        expect(base.swagger).not.toBeUndefined();
      });
    });

    it('loads yaml file data', () => {
      const yamlPath = `${__dirname}/fixtures/project/swaggerBase.yaml`;
      return Loader.loadBase(yamlPath).then(base => {
        expect(base.swagger).not.toBeUndefined();
      });
    });

    it('searches for swagger in the provided directory', () => {
      const dir = `${__dirname}/fixtures/project/`;
      return Loader.loadBase(dir).then(base => {
        expect(base.swagger).not.toBeUndefined();
      });
    });

    it('returns an empty object if swagger is not found in a directory', () => {
      return Loader.loadBase(__dirname).then(base => {
        expect(base).toStrictEqual({});
      });
    });
  });

  describe('.loadFiles', () => {
    it('loads arrays of files', () => {
      return Loader.loadFiles([`${__dirname}/../package.json`, `${__dirname}/../package.json`]).then(files => {
        expect(files).toHaveLength(2);
        expect(files[0].length).toBeGreaterThan(100);
      });
    });

    it('returns errors for non-existent files', () => {
      return Loader.loadFiles(['dne.js']).then(files => {
        expect(typeof files[0]).toBe('object');
        expect(files[0].message).toContain('no such file or directory');
      });
    });
  });

  describe('.expandParam', () => {
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
  });

  describe('.expandParam OAS 3', () => {
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

  describe('.loadData', () => {
    it('loads yaml data', () => {
      const yamlPath = `${__dirname}/fixtures/project/swaggerBase.yaml`;
      const yamlObject = jsYaml.load(fs.readFileSync(yamlPath, 'utf-8'));
      return Loader.loadData(yamlPath).then(yaml => {
        Object.keys(yamlObject).forEach(key => {
          expect(yaml[key]).not.toBeUndefined();
        });
      });
    });

    it('loads json data', () => {
      const jsonPath = `${__dirname}/fixtures/project/swaggerBase.json`;
      const jsonObject = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      return Loader.loadData(jsonPath).then(json => {
        Object.keys(jsonObject).forEach(key => {
          expect(json[key]).not.toBeUndefined();
        });
      });
    });
  });
});
