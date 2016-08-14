const assert = require('chai').assert;
const swaggerInline = require('../src/swagger-inline');

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
        swaggerInline('./tests/*.js').then((generatedSwagger) => {
            assert.isString(generatedSwagger);
            done();
        }).catch(done);
    });
});
