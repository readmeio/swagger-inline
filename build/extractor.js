'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var Extractor = function () {
    function Extractor() {
        _classCallCheck(this, Extractor);
    }

    _createClass(Extractor, null, [{
        key: 'extractEndpointsFromCode',
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
        key: 'extractComments',
        value: function extractComments(code, options) {
            return _extractComments(code, options);
        }
    }, {
        key: 'extractEndpoint',
        value: function extractEndpoint(comment, options) {
            var _this2 = this;

            var lines = comment.split('\n');
            var yamlLines = [];
            var route = null;
            var scopeMatched = false;

            lines.some(function (line) {
                if (route) {
                    if (options && options.scope) {
                        if (line.trim().indexOf('scope:') == 0 && line.indexOf(options.scope) >= 0) {
                            scopeMatched = true;
                            return false;
                        }
                    } else {
                        scopeMatched = true;
                    }
                    if (line.trim().indexOf('scope:') == 0) {
                        return false;
                    }
                    return !pushLine(yamlLines, line); // end when lines stop being pushed
                }
                route = route || line.match(_this2.ROUTE_REGEX);
                return false;
            });

            if (!scopeMatched) {
                route = null;
            }

            return buildEndpoint(route, yamlLines);
        }
    }]);

    return Extractor;
}();

Extractor.ROUTE_REGEX = /@(?:oas|api)\s+\[(\w+)\]\s+(.*?)(?:\s+(.*))?$/m;

module.exports = Extractor;