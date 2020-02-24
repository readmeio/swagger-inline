"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _extractComments = require('multilang-extract-comments');

var jsYaml = require('js-yaml');

function pushLine(array, line) {
  if (line.trim()) {
    array.push(line);
    return true;
  }

  return false;
}

function buildEndpoint(route, yamlLines) {
  var endpoint = {};

  if (route) {
    var yamlObject = jsYaml.load(yamlLines.join('\n'));
    endpoint.method = route[1];
    endpoint.route = route[2];

    if (route[3]) {
      endpoint.summary = route[3];
    }

    Object.assign(endpoint, yamlObject);
  }

  return endpoint;
}

function buildSchema(schema, yamlLines) {
  var scheme = {};

  if (schema) {
    var yamlObject = jsYaml.load(yamlLines.join('\n'));
    scheme.name = schema[1];
    Object.assign(scheme, yamlObject);
  }

  return scheme;
}

var Extractor =
/*#__PURE__*/
function () {
  function Extractor() {
    _classCallCheck(this, Extractor);
  }

  _createClass(Extractor, null, [{
    key: "extractEndpointsFromCode",
    value: function extractEndpointsFromCode(code, options) {
      var _this = this;

      var comments = this.extractComments(code, options);
      return Object.keys(comments).map(function (commentKey) {
        var comment = comments[commentKey];
        return _this.extractEndpoint(comment.content, options);
      }).filter(function (endpoint) {
        return endpoint.method && endpoint.route;
      });
    }
  }, {
    key: "extractSchemasFromCode",
    value: function extractSchemasFromCode(code, options) {
      var _this2 = this;

      var comments = this.extractComments(code, options);
      return Object.keys(comments).map(function (commentKey) {
        var comment = comments[commentKey];
        return _this2.extractSchemas(comment.content, options);
      });
    }
  }, {
    key: "extractComments",
    value: function extractComments(code, options) {
      return _extractComments(code, options);
    }
  }, {
    key: "extractEndpoint",
    value: function extractEndpoint(comment, options) {
      var _this3 = this;

      var lines = comment.split('\n');
      var yamlLines = [];
      var route = null;
      var scopeMatched = false;
      lines.some(function (line) {
        if (route) {
          if (options && options.scope) {
            if (line.trim().indexOf('scope:') === 0 && line.indexOf(options.scope) >= 0) {
              scopeMatched = true;
              return false;
            }
          } else {
            scopeMatched = true;
          }

          if (line.trim().indexOf('scope:') === 0) {
            return false;
          }

          pushLine(yamlLines, line); // eslint-disable-next-line consistent-return

          return;
        }

        route = route || line.match(_this3.ROUTE_REGEX);
        return false;
      });

      if (!scopeMatched) {
        route = null;
      }

      return buildEndpoint(route, yamlLines);
    }
  }, {
    key: "extractSchemas",
    value: function extractSchemas(comment, options) {
      var _this4 = this;

      var lines = comment.split('\n');
      var yamlLines = [];
      var route = null;
      var scopeMatched = false;
      lines.some(function (line) {
        if (route) {
          if (options && options.scope) {
            if (line.trim().indexOf('scope:') === 0 && line.indexOf(options.scope) >= 0) {
              scopeMatched = true;
              return false;
            }
          } else {
            scopeMatched = true;
          }

          if (line.trim().indexOf('scope:') === 0) {
            return false;
          }

          pushLine(yamlLines, line);
          return undefined;
        }

        route = route || line.match(_this4.SCHEMA_REGEX);
        return false;
      });

      if (!scopeMatched) {
        route = null;
      }

      return buildSchema(route, yamlLines);
    }
  }]);

  return Extractor;
}(); // eslint-disable-next-line unicorn/no-unsafe-regex


Extractor.ROUTE_REGEX = /@(?:oas|api)\s+\[(\w+)\]\s+(.*?)(?:\s+(.*))?$/m;
Extractor.SCHEMA_REGEX = /@schema\s+(.*)$/m;
module.exports = Extractor;