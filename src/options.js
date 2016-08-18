const path = require('path');

class Options {
    constructor(providedOptions = {}) {
        this.options = Object.assign({}, providedOptions, Options.DEFAULTS);

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
}

Options.DEFAULTS = {
    format: '.json',
};

module.exports = Options;
