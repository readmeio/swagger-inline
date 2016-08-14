const assert = require('chai').assert;
const cli = require('../src/cli');

describe('Cli', () => {
    it('is a function', () => {
        assert.isFunction(cli);
    });
});
