const fs = require('fs');

const Extractor = require('../src/extractor');

describe('Extractor', () => {
  describe('comment extraction', () => {
    const expectations = [
      { type: 'multiline', content: 'block' },
      { type: 'singleline', content: 'inline' },
    ];

    ['javascript.js', 'ruby.rb', 'python.py'].forEach(language => {
      it(`can extract ${language} comments`, () => {
        const code = fs.readFileSync(`${__dirname}/fixtures/code/${language}`, 'utf-8');
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

  describe('swagger extraction', () => {
    const swaggerComment = [
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

    it('extracts endpoints from comment strings', () => {
      const endpoint = Extractor.extractEndpoint(swaggerComment);

      expect(endpoint.method).toBe('get');
      expect(endpoint.route).toBe('/pets');
      expect(endpoint.description).toContain('Returns all');
      expect(typeof endpoint.responses).toBe('object');
      expect(typeof endpoint.responses['200']).toBe('object');
    });

    const swaggerCommentSummary = [
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

    it('extracts endpoints from comment strings + summary', () => {
      const endpoint = Extractor.extractEndpoint(swaggerCommentSummary);

      expect(endpoint.method).toBe('get');
      expect(endpoint.route).toBe('/pets');
      expect(endpoint.summary).toBe('Get pets');
      expect(endpoint.description).toContain('Returns all');
      expect(typeof endpoint.responses).toBe('object');
      expect(typeof endpoint.responses['200']).toBe('object');
    });

    it('extracts endpoints from code strings', () => {
      const code = fs.readFileSync(`${__dirname}/fixtures/code/swagger-api.js`, 'utf-8');
      const endpoints = Extractor.extractEndpointsFromCode(code);

      expect(endpoints).toHaveLength(4);

      endpoints.forEach(endpoint => {
        expect(endpoint.route).toContain('pet');
        expect(typeof endpoint.method).toBe('string');
        expect(Object.keys(endpoint.responses)).toHaveLength(2);
      });
    });

    const swaggerSchemeComment = [
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

    it('extracts schemes from comment strings', () => {
      const scheme = Extractor.extractSchemas(swaggerSchemeComment);

      expect(scheme.name).toBe('Pet');
      expect(Array.isArray(scheme.required)).toBeTruthy();
      expect(typeof scheme.properties).toBe('object');
      expect(typeof scheme.properties.id).toBe('object');
    });

    it('returns only endpoints', () => {
      const emptyCode = ['/*', ' * Empty comment', ' */', ' ', '/*', ' * Second comment', ' */'].join('\n');

      const endpoints = Extractor.extractEndpointsFromCode(emptyCode);

      expect(endpoints).toHaveLength(0);
    });
  });
});
