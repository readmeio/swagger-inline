"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = require("path");

var Options = function () {
    function Options() {
        var _this = this;

        var providedOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, Options);

        // eslint-disable-next-line prefer-object-spread
        this.options = Object.assign({}, providedOptions);

        Object.keys(Options.DEFAULTS).forEach(function (option) {
            _this.options[option] = _this.options[option] || Options.DEFAULTS[option];
        });

        if (this.options.base && !providedOptions.format) {
            this.options.format = path.extname(this.options.base);
        }

        if (this.options.out) {
            this.options.format = path.extname(this.options.out);
        }
    }

    _createClass(Options, [{
        key: "isJSON",
        value: function isJSON() {
            return this.getFormat() === ".json" || !this.getFormat();
        }
    }, {
        key: "getFormat",
        value: function getFormat() {
            return this.options.format;
        }
    }, {
        key: "getBase",
        value: function getBase() {
            return this.options.base;
        }
    }, {
        key: "getOut",
        value: function getOut() {
            return this.options.out;
        }
    }, {
        key: "getScope",
        value: function getScope() {
            return this.options.scope;
        }
    }, {
        key: "getLogger",
        value: function getLogger() {
            return this.options.logger;
        }
    }, {
        key: "getIgnore",
        value: function getIgnore() {
            return this.options.ignore;
        }
    }, {
        key: "getMetadata",
        value: function getMetadata() {
            return this.options.metadata;
        }
    }]);

    return Options;
}();

Options.DEFAULTS = {
    format: ".json",
    logger: function logger() {},
    ignore: ["node_modules/**/*", "bower_modules/**/*"]
};

module.exports = Options;