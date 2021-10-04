const fs = require('fs');
const path = require('path');

const Extractor = require('../src/extractor');

describe('Extractor', () => {
  describe('comment extraction', () => {
    const expectations = [
      { type: 'multiline', content: 'block' },
      { type: 'singleline', content: 'inline' },
    ];

    ['javascript.js', 'ruby.rb', 'python.py'].forEach(language => {
      it(`can extract ${language} comments`, () => {
        const code = fs.readFileSync(`${__dirname}/__fixtures__/code/${language}`, 'utf-8');
        const comments = Extractor.extractComments(code, {
          filename: language,
        });

        expect(Object.keys(comments)).toHaveLength(2);

        Object.keys(comments).forEach((key, index) => {
          const comment = comments[key];
          expect(comment.info.type).toBe(expectations[index].type);
          expect(comment.content).toContain(expectations[index].content);
        });
      });
    });
  });

  describe('Swagger/OpenAPI extraction', () => {
    it('shouldnt fail on a markdown file', () => {
      const markdown = fs.readFileSync(path.join(__dirname, '../CHANGELOG.md'), 'utf8');
      const endpoint = Extractor.extractEndpoint(markdown);

      expect(endpoint).toStrictEqual({});
    });

    it('extracts endpoints from comment strings', () => {
      const operation = [
        '',
        ' @api [get] /pets',
        ' description: "Returns all pets from the system that the user has access to"',
        ' responses:',
        '   "200":',
        '     description: "A list of pets."',
        '     schema:',
        '       type: "String"',
        '',
      ].join('\n');

      const endpoint = Extractor.extractEndpoint(operation);

      expect(endpoint.method).toBe('get');
      expect(endpoint.route).toBe('/pets');
      expect(endpoint.description).toContain('Returns all');
      expect(typeof endpoint.responses).toBe('object');
      expect(typeof endpoint.responses['200']).toBe('object');
    });

    it('extracts endpoints from comment strings + summary', () => {
      const operationWithSummary = [
        '',
        ' @api [get] /pets Get pets',
        ' description: "Returns all pets from the system that the user has access to"',
        ' responses:',
        '   "200":',
        '     description: "A list of pets."',
        '     schema:',
        '       type: "String"',
        '',
      ].join('\n');

      const endpoint = Extractor.extractEndpoint(operationWithSummary);

      expect(endpoint.method).toBe('get');
      expect(endpoint.route).toBe('/pets');
      expect(endpoint.summary).toBe('Get pets');
      expect(endpoint.description).toContain('Returns all');
      expect(typeof endpoint.responses).toBe('object');
      expect(typeof endpoint.responses['200']).toBe('object');
    });

    it('extracts endpoints from code strings', () => {
      const code = fs.readFileSync(`${__dirname}/__fixtures__/code/swagger-api.js`, 'utf-8');
      const endpoints = Extractor.extractEndpointsFromCode(code);

      expect(endpoints).toHaveLength(4);

      endpoints.forEach(endpoint => {
        expect(endpoint.route).toContain('pet');
        expect(typeof endpoint.method).toBe('string');
        expect(Object.keys(endpoint.responses)).toHaveLength(2);
      });
    });

    it('extracts schemas from comment strings', () => {
      const comment = [
        '',
        ' @schema Pet',
        '   required:',
        '     - id',
        '     - name',
        '   properties:',
        '     id:',
        '       type: integer',
        '       format: int64',
        '     name:',
        '       type: string',
        '     tag:',
        '       type: string',
        '',
      ].join('\n');

      const schema = Extractor.extractSchemas(comment);

      expect(schema.name).toBe('Pet');
      expect(Array.isArray(schema.required)).toBe(true);
      expect(typeof schema.properties).toBe('object');
      expect(typeof schema.properties.id).toBe('object');
    });

    it('returns only endpoints', () => {
      const emptyCode = ['/*', ' * Empty comment', ' */', ' ', '/*', ' * Second comment', ' */'].join('\n');

      const endpoints = Extractor.extractEndpointsFromCode(emptyCode);

      expect(endpoints).toHaveLength(0);
    });

    it('prints pretty errors for endpoints that cannot be parsed', () => {
      const malformedComment = [
        '',
        ' @api [get] /pets',
        '  description: "Returns all pets from the system that the user has access to"', // This line has an extra space
        ' responses:',
        '   "200":',
        '     description: "A list of pets."',
        '     schema:',
        '       type: "String"',
        '',
      ].join('\n');

      expect(() => {
        Extractor.extractEndpoint(malformedComment);
      }).toThrow("YAML Exception in 'get /pets'");
    });

    it('prints pretty errors for schemas that cannot be parsed', () => {
      const malformedSchema = [
        '',
        ' @schema Pet',
        '    required:', // This line has an extra space
        '     - id',
        '     - name',
        '   properties:',
        '     id:',
        '       type: integer',
        '       format: int64',
        '     name:',
        '       type: string',
        '     tag:',
        '       type: string',
        '',
      ].join('\n');

      expect(() => {
        Extractor.extractSchemas(malformedSchema);
      }).toThrow("YAML Exception in 'Schema: Pet'");
    });

    it('can parse an OAS block if there exists a `scope` property within an object', () => {
      const code = fs.readFileSync(`${__dirname}/__fixtures__/endpoint-with-scope-obj-prop.js`, 'utf-8');

      let endpoints = Extractor.extractEndpointsFromCode(code);
      expect(endpoints).toHaveLength(3);

      endpoints = Extractor.extractEndpointsFromCode(code, { scope: 'patchScope' });
      expect(endpoints).toHaveLength(1);
    });
  });
});
