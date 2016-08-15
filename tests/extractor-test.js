const fs = require('fs');
const assert = require('chai').assert;

const Extractor = require('../src/extractor.js');

describe('Extractor', () => {
    describe('comment extraction', () => {
        const expectations = [
            { type: 'multiline', content: 'block' },
            { type: 'singleline', content: 'inline' },
        ];

        it('can extract js comments', () => {
            const js = fs.readFileSync(`${__dirname}/fixtures/code/javascript.js`, 'utf-8');
            const comments = Extractor.extractComments(js);

            assert.lengthOf(Object.keys(comments), 2);

            Object.keys(comments).forEach((key, index) => {
                const comment = comments[key];
                assert.equal(comment.info.type, expectations[index].type);
                assert.include(comment.content, expectations[index].content);
            });
        });

        // Won't work until multilang-extract-comments supports multiline ruby comments
        // Source: https://github.com/nknapp/comment-patterns/blob/master/languages/patterns/ruby.js
        // Issue: https://github.com/nknapp/comment-patterns/issues/2
        xit('can extract ruby', () => {
            const ruby = fs.readFileSync(`${__dirname}/fixtures/code/ruby.rb`, 'utf-8');
            const comments = Extractor.extractComments(ruby, { filename: 'functi.rb' });

            assert.lengthOf(Object.keys(comments), 2);

            Object.keys(comments).forEach((key, index) => {
                const comment = comments[key];
                assert.equal(comment.info.type, expectations[index].type);
                assert.include(comment.content, expectations[index].content);
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

        it('extracts endpoints from code strings', () => {
            const code = fs.readFileSync(`${__dirname}/fixtures/code/swagger-api.js`, 'utf-8');
            const endpoints = Extractor.extractEndpointsFromCode(code);

            assert.lengthOf(endpoints, 4);

            endpoints.forEach((endpoint) => {
                assert.include(endpoint.route, 'pet');
                assert.isString(endpoint.method);
                assert.lengthOf(Object.keys(endpoint.responses), 2);
            });
        });
    });
});
