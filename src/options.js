const path = require('path');

class Options {
    constructor(providedOptions = {}) {
        this.options = Object.assign({}, Options.DEFAULTS, providedOptions);

        if (this.options.base && !providedOptions.format) {
            this.options.format = path.extname(this.options.base);
        }
    }

    isJSON() {
        return this.getFormat() === '.json';
    }

    getFormat() {
        return this.options.format;
    }

    getBase() {
        return this.options.base;
    }

    getLogger() {
        return this.options.logger;
    }
}

Options.DEFAULTS = {
    format: '.json',
    logger: () => {},
};

module.exports = Options;
