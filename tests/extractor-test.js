const fs = require('fs');
const assert = require('chai').assert;

const Extractor = require('../src/extractor.js');

describe('Extractor', () => {
    const expectations = [
        { type: 'multiline', content: 'block' },
        { type: 'singleline', content: 'inline' },
    ];

    it('can extract js comments', () => {
        const js = fs.readFileSync(`${__dirname}/fixtures/code/javascript.js`, 'utf-8');
        const comments = Extractor.extractComments(js);

        Object.keys(comments).forEach((key, index) => {
            const comment = comments[key];
            assert.equal(comment.info.type, expectations[index].type);
            assert.include(comment.content, expectations[index].content);
        });
    });

    it('can extract ruby', () => {
        const ruby = fs.readFileSync(`${__dirname}/fixtures/code/ruby.rb`, 'utf-8');
        const comments = Extractor.extractComments(ruby);

        Object.keys(comments).forEach((key, index) => {
            const comment = comments[key];
            assert.equal(comment.info.type, expectations[index].type);
            assert.include(comment.content, expectations[index].content);
        });
    });
});
