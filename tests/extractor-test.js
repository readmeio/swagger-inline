const fs = require('fs');
const assert = require('chai').assert;

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

        assert.lengthOf(Object.keys(comments), 2);

        Object.keys(comments).forEach((key, index) => {
          const comment = comments[key];
          assert.equal(comment.info.type, expectations[index].type);
          assert.include(comment.content, expectations[index].content);
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

      assert.equal(endpoint.method, 'get');
      assert.equal(endpoint.route, '/pets');
      assert.include(endpoint.description, 'Returns all');
      assert.isObject(endpoint.responses);
      assert.isObject(endpoint.responses['200']);
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

      assert.equal(endpoint.method, 'get');
      assert.equal(endpoint.route, '/pets');
      assert.equal(endpoint.summary, 'Get pets');
      assert.include(endpoint.description, 'Returns all');
      assert.isObject(endpoint.responses);
      assert.isObject(endpoint.responses['200']);
    });

    it('extracts endpoints from code strings', () => {
      const code = fs.readFileSync(`${__dirname}/fixtures/code/swagger-api.js`, 'utf-8');
      const endpoints = Extractor.extractEndpointsFromCode(code);

      assert.lengthOf(endpoints, 4);

      endpoints.forEach(endpoint => {
        assert.include(endpoint.route, 'pet');
        assert.isString(endpoint.method);
        assert.lengthOf(Object.keys(endpoint.responses), 2);
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

      assert.equal(scheme.name, 'Pet');
      assert.isArray(scheme.required);
      assert.isObject(scheme.properties);
      assert.isObject(scheme.properties.id);
    });

    it('returns only endpoints', () => {
      const emptyCode = ['/*', ' * Empty comment', ' */', ' ', '/*', ' * Second comment', ' */'].join('\n');

      const endpoints = Extractor.extractEndpointsFromCode(emptyCode);

      assert.lengthOf(endpoints, 0);
    });
  });
});
