const Options = require('../src/options');

describe('Options', () => {
  describe('constructor', () => {
    it('has defaults', () => {
      const options = new Options();

      expect(options.getFormat()).toBe('.json');
      expect(options.isJSON()).toBeTruthy();
    });
  });

  describe('#getFormat', () => {
    it('copies the base format', () => {
      const options = new Options({ base: 'someFile.yaml' });

      expect(options.getFormat()).toBe('.yaml');
      expect(options.getBase()).toBe('someFile.yaml');
    });

    it('copies the output format', () => {
      const options = new Options({ out: 'someFile.yaml' });
      expect(options.getFormat()).toBe('.yaml');
    });

    it('output format overrides other provided options', () => {
      let options = new Options({
        base: 'someFile.yaml',
        format: '.yaml',
        out: 'someFile.json',
      });

      expect(options.getFormat()).toBe('.json');

      options = new Options({
        base: 'someFile.json',
        format: '.json',
        out: 'someFile.yaml',
      });

      expect(options.getFormat()).toBe('.yaml');
    });
  });

  describe('isJSON', () => {
    it('is true when no format is provided', () => {
      const options = new Options({ format: '' });
      expect(options.isJSON()).toBeTruthy();
    });
  });

  describe('#getOut()', () => {
    it('returns the out option', () => {
      const out = 'someFile.yaml';
      const options = new Options({ out });

      expect(options.getOut()).toBe(out);
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
