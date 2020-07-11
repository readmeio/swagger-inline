"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var path = require('path');

var Options = /*#__PURE__*/function () {
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
  }

  _createClass(Options, [{
    key: "isJSON",
    value: function isJSON() {
      return this.getFormat() === '.json' || !this.getFormat();
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
      return 'ignore' in this.options ? this.options.ignore : [];
    }
  }, {
    key: "getMetadata",
    value: function getMetadata() {
      return this.options.metadata;
    }
  }, {
    key: "getIgnoreErrors",
    value: function getIgnoreErrors() {
      return this.options.ignoreErrors;
    }
  }]);

  return Options;
}();

Options.DEFAULTS = {
  format: '.json',
  logger: function logger() {},
  ignore: ['node_modules/**/*', 'bower_modules/**/*'],
  ignoreErrors: false
};
module.exports = Options;