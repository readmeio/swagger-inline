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
  });

  describe('isJSON', () => {
    it('is true when no format is provided', () => {
      const options = new Options({ format: '' });
      assert.isTrue(options.isJSON());
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
