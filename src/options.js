const path = require('path');

class Options {
  constructor(providedOptions = {}) {
    this.options = { ...providedOptions };

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

  getPattern() {
    return this.options.pattern;
  }

  setPattern(pattern) {
    this.options.pattern = pattern;
    return this.options;
  }

  getTitle() {
    return this.options.title;
  }

  getApiVersion() {
    return this.options.apiVersion;
  }
}

Options.DEFAULTS = {
  format: '.json',
  logger: () => {},
  ignore: ['node_modules/**/*', 'bower_modules/**/*'],
  ignoreErrors: false,
  pattern: null,
  title: null,
  apiVersion: null,
};

module.exports = Options;
