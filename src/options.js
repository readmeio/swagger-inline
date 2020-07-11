const path = require('path');

class Options {
  constructor(providedOptions = {}) {
    // eslint-disable-next-line prefer-object-spread
    this.options = Object.assign({}, providedOptions);

    Object.keys(Options.DEFAULTS).forEach(option => {
      this.options[option] = this.options[option] || Options.DEFAULTS[option];
    });

    if (this.options.base && !providedOptions.format) {
      this.options.format = path.extname(this.options.base);
    }
  }

  isJSON() {
    return this.getFormat() === '.json' || !this.getFormat();
  }

  getFormat() {
    return this.options.format;
  }

  getBase() {
    return this.options.base;
  }

  getScope() {
    return this.options.scope;
  }

  getLogger() {
    return this.options.logger;
  }

  getIgnore() {
    return 'ignore' in this.options ? this.options.ignore : [];
  }

  getMetadata() {
    return this.options.metadata;
  }

  getIgnoreErrors() {
    return this.options.ignoreErrors;
  }
}

Options.DEFAULTS = {
  format: '.json',
  logger: () => {},
  ignore: ['node_modules/**/*', 'bower_modules/**/*'],
  ignoreErrors: false,
};

module.exports = Options;
