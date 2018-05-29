'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var jsYaml = require('js-yaml');
var glob = require('multi-glob').glob;

var Loader = function () {
    function Loader() {
        _classCallCheck(this, Loader);
    }

    _createClass(Loader, null, [{
        key: 'resolvePaths',
        value: function resolvePaths(filepaths, options) {
            var ignore = options ? options.getIgnore() : undefined;
            return new Promise(function (resolve, reject) {
                glob(filepaths, { ignore: ignore }, function (err, files) {
                    return err === null ? resolve(files) : reject(err);
                });
            });
        }
    }, {
        key: 'findSwagger',
        value: function findSwagger() {
            var directory = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : process.cwd();
            var options = arguments[1];

            return new Promise(function (resolve, reject) {
                fs.readdir(directory, function (err, files) {
                    if (err) {
                        reject(err);
                    } else {
                        var swaggerCandidates = files.filter(function (file) {
                            return Loader.SWAGGER_TYPES_REGEX.test(file);
                        }).map(function (file) {
                            return path.join(directory, file);
                        });

                        var swaggerPromises = swaggerCandidates.map(function (filepath) {
                            return Loader.loadData(filepath, options).then(function (data) {
                                return data.swagger || data.openapi ? Promise.resolve(data) : Promise.reject();
                            });
                        });

                        Promise.any(swaggerPromises).then(function (loadedSwagger) {
                            resolve(loadedSwagger);
                        }).catch(function () {
                            resolve({});
                        });
                    }
                });
            });
        }
    }, {
        key: 'loadFiles',
        value: function loadFiles(filepaths) {
            return new Promise(function (resolve) {
                var loadPromises = Promise.map(filepaths, function (filepath) {
                    return Loader.loadFile(filepath).reflect();
                }, { concurrency: Loader.MAX_CONCURRENCY });
                resolve(loadPromises);
            }).then(function (loadResults) {
                return loadResults.map(function (loadResult) {
                    return loadResult.isFulfilled() ? loadResult.value() : loadResult.reason();
                });
            });
        }
    }, {
        key: 'loadFile',
        value: function loadFile(filepath) {
            return new Promise(function (resolve, reject) {
                fs.readFile(filepath, 'utf-8', function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        }
    }, {
        key: 'loadData',
        value: function loadData(filepath, options) {
            var extname = path.extname(filepath);
            var loadFunction = Loader.LOADER_METHODS[extname];

            if (!loadFunction) {
                throw new Error('Did not recognize ' + filepath + '.');
            }
            var loaded = Loader.LOADER_METHODS[extname](filepath, options);
            return loaded;
        }
    }, {
        key: 'loadBase',
        value: function loadBase() {
            var _this = this;

            var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
            var options = arguments[1];

            return new Promise(function (resolve) {
                fs.stat(base, function (err, stat) {
                    if (!err && stat.isFile()) {
                        _this.loadData(base, options).then(function (baseData) {
                            resolve(baseData);
                        });
                    } else if (!err && stat.isDirectory()) {
                        _this.findSwagger(base, options).then(function (baseData) {
                            resolve(baseData);
                        });
                    } else {
                        _this.findSwagger(process.cwd(), options).then(function (baseData) {
                            resolve(baseData);
                        });
                    }
                });
            });
        }
    }, {
        key: 'loadYAML',
        value: function loadYAML(filepath, options) {
            return Loader.loadFile(filepath).then(function (data) {
                return Loader.addMetadata(jsYaml.load(data), filepath, options);
            });
        }
    }, {
        key: 'loadJSON',
        value: function loadJSON(filepath, options) {
            return Loader.loadFile(filepath).then(function (data) {
                return Loader.addMetadata(JSON.parse(data), filepath, options);
            });
        }
    }, {
        key: 'addMetadata',
        value: function addMetadata(data, filepath, options) {
            if (options && options.getMetadata()) {
                data['x-si-base'] = filepath;
            }
            return data;
        }
    }, {
        key: 'addResponse',
        value: function addResponse() {
            var endpoints = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            // If there's no response, add a default one
            endpoints.forEach(function (endpoint) {
                if (!endpoint.responses || !Object.keys(endpoint.responses).length) {
                    endpoint.responses = {
                        "200": {
                            "description": "Successful response"
                        }
                    };
                }
            });
            return endpoints;
        }
    }, {
        key: 'expandParams',
        value: function expandParams() {
            var endpoints = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            endpoints.forEach(function (endpoint) {
                if (endpoint && endpoint.parameters) {
                    endpoint.parameters.forEach(function (param, i) {
                        if (typeof param === 'string') {
                            endpoint.parameters[i] = Loader.expandParam(param);
                        }
                    });

                    // Remove any params that couldn't be parsed
                    endpoint.parameters = endpoint.parameters.filter(function (n) {
                        return n != false;
                    });
                };
            });
            return endpoints;
        }
    }, {
        key: 'expandParam',
        value: function expandParam() {
            var param = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

            var parsed = param.match(/(?:\((.*)\))?\s*([\w._-]+)(?:=([^{*]*))?([*])?\s*{(.*?)(?::(.*))?}\s*(.*)?/);;

            if (!parsed || !parsed[1] || !parsed[2] || !parsed[5]) return false;

            var out = {
                'in': parsed[1],
                'name': parsed[2],
                'type': parsed[5].toLowerCase()
            };

            if (parsed[3]) out.default = parsed[3].trim();
            if (parsed[4]) out.required = true;
            if (parsed[6]) out.format = parsed[6];
            if (parsed[7]) out.description = parsed[7];

            return out;
        }
    }]);

    return Loader;
}();

Loader.LOADER_METHODS = {
    '.yaml': Loader.loadYAML,
    '.yml': Loader.loadYAML,
    '.json': Loader.loadJSON
};
Loader.SWAGGER_TYPES_REGEX = /\.json|\.yaml|\.yml/i;
Loader.MAX_CONCURRENCY = 500;

module.exports = Loader;