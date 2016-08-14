const assert = require('chai').assert;
const swaggerInline = require('../src/swagger-inline');

describe('Swagger Inline', () => {
    it('is a function', () => {
        assert.isFunction(swaggerInline);
    });
});
