const assert = require('chai').assert;

const Options = require('../src/options');

describe('Options', () => {
    describe('constructor', () => {
        it('has defaults', () => {
            const options = new Options();

            assert.equal(options.getFormat(), '.json');
            assert.isTrue(options.isJSON());
        });
    });

    describe('#getFormat', () => {
        it('copies the base format', () => {
            const options = new Options({ base: 'someFile.yaml' });

            assert.equal(options.getFormat(), '.yaml');
            assert.equal(options.getBase(), 'someFile.yaml');
        });

        it('copies the output format', () => {
            const options = new Options({ out: 'someFile.yaml' });
            assert.equal(options.getFormat(), '.yaml');
        });

        it('output format overrides other provided options', () => {
            let options = new Options({
                base: 'someFile.yaml',
                format: '.yaml',
                out: 'someFile.json',
            });

            assert.equal(options.getFormat(), '.json');

            options = new Options({
                base: 'someFile.json',
                format: '.json',
                out: 'someFile.yaml',
            });

            assert.equal(options.getFormat(), '.yaml');
        });
    });

    describe('isJSON', () => {
        it('is true when no format is provided', () => {
            const options = new Options({ format: '' });
            assert.isTrue(options.isJSON());
        });
    });

    describe('#getOut()', () => {
        it('returns the out option', () => {
            const out = 'someFile.yaml';
            const options = new Options({ out });

            assert.equal(options.getOut(), out);
        });
    });

    describe('#getLogger', () => {
        it('has a logger', () => {
            process.env.NODE_ENV = 'production';
            const options = new Options();
            assert.isFunction(options.getLogger());
            process.env.NODE_ENV = 'test';
        });
    });
});
