const Options = require('../src/options');

describe('Options', () => {
  describe('constructor', () => {
    it('has defaults', () => {
      const options = new Options();

      expect(options.getFormat()).toBe('.json');
      expect(options.isJSON()).toBe(true);
    });
  });

  describe('#getFormat', () => {
    it('copies the base format', () => {
      const options = new Options({ base: 'someFile.yaml' });

      expect(options.getFormat()).toBe('.yaml');
      expect(options.getBase()).toBe('someFile.yaml');
    });
  });

  describe('isJSON', () => {
    it('is true when no format is provided', () => {
      const options = new Options({ format: '' });
      expect(options.isJSON()).toBe(true);
    });
  });

  describe('#getLogger', () => {
    it('has a logger', () => {
      process.env.NODE_ENV = 'production';
      const options = new Options();
      expect(typeof options.getLogger()).toBe('function');
      process.env.NODE_ENV = 'test';
    });
  });
});
