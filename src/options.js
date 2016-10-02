const path = require('path');

class Options {
    constructor(providedOptions = {}) {
        this.options = Object.assign({}, providedOptions);

        Object.keys(Options.DEFAULTS).forEach((option) => {
            this.options[option] = this.options[option] || Options.DEFAULTS[option];
        });

        if (this.options.base && !providedOptions.format) {
            this.options.format = path.extname(this.options.base);
        }

        if (this.options.out) {
            this.options.format = path.extname(this.options.out);
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

    getOut() {
        return this.options.out;
    }

    getLogger() {
        return this.options.logger;
    }

    getIgnore() {
        return this.options.ignore;
    }
}

Options.DEFAULTS = {
    format: '.json',
    logger: () => {},
    ignore: ['node_modules/*', 'bower_modules/*'],
};

module.exports = Options;
