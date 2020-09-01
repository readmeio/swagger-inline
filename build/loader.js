"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint-disable no-param-reassign */
var fs = require('fs');

var path = require('path');

var Promise = require('bluebird');

var jsYaml = require('js-yaml');

var globby = require('globby');

var Loader = /*#__PURE__*/function () {
  function Loader() {
    _classCallCheck(this, Loader);
  }

  _createClass(Loader, null, [{
    key: "resolvePaths",
    value: function resolvePaths(filepaths, options) {
      var ignore = options ? options.getIgnore() : [];
      return globby(filepaths, {
        ignore: ignore
      });
    }
  }, {
    key: "findSwagger",
    value: function findSwagger() {
      var directory = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : process.cwd();
      var options = arguments.length > 1 ? arguments[1] : undefined;
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
            })["catch"](function () {
              resolve({});
            });
          }
        });
      });
    }
  }, {
    key: "loadFiles",
    value: function loadFiles(filepaths) {
      return new Promise(function (resolve) {
        var loadPromises = Promise.map(filepaths, function (filepath) {
          return Loader.loadFile(filepath).reflect();
        }, {
          concurrency: Loader.MAX_CONCURRENCY
        });
        resolve(loadPromises);
      }).then(function (loadResults) {
        return loadResults.map(function (loadResult) {
          return loadResult.isFulfilled() ? loadResult.value() : loadResult.reason();
        });
      });
    }
  }, {
    key: "loadFile",
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
    key: "loadData",
    value: function loadData(filepath, options) {
      var extname = path.extname(filepath);
      var loadFunction = Loader.LOADER_METHODS[extname];

      if (!loadFunction) {
        throw new Error("Did not recognize ".concat(filepath, "."));
      }

      return Loader.LOADER_METHODS[extname](filepath, options);
    }
  }, {
    key: "loadBase",
    value: function loadBase() {
      var _this = this;

      var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var options = arguments.length > 1 ? arguments[1] : undefined;
      return new Promise(function (resolve, reject) {
        fs.stat(base, function (err, stat) {
          if (!err && stat.isFile()) {
            _this.loadData(base, options).then(function (baseData) {
              resolve(baseData);
            })["catch"](reject);
          } else if (!err && stat.isDirectory()) {
            _this.findSwagger(base, options).then(function (baseData) {
              resolve(baseData);
            })["catch"](reject);
          } else {
            _this.findSwagger(process.cwd(), options).then(function (baseData) {
              resolve(baseData);
            })["catch"](reject);
          }
        });
      });
    }
  }, {
    key: "loadYAML",
    value: function loadYAML(filepath, options) {
      return Loader.loadFile(filepath).then(function (data) {
        return Loader.addMetadata(jsYaml.load(data), filepath, options);
      });
    }
  }, {
    key: "loadJSON",
    value: function loadJSON(filepath, options) {
      return Loader.loadFile(filepath).then(function (data) {
        return Loader.addMetadata(JSON.parse(data), filepath, options);
      });
    }
  }, {
    key: "addMetadata",
    value: function addMetadata(data, filepath, options) {
      if (options && options.getMetadata()) {
        data['x-si-base'] = filepath;
      }

      return data;
    }
  }, {
    key: "addResponse",
    value: function addResponse() {
      var endpoints = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      // If there's no response, add a default one
      endpoints.forEach(function (endpoint) {
        if (!endpoint.responses || !Object.keys(endpoint.responses).length) {
          endpoint.responses = {
            200: {
              description: 'Successful response'
            }
          };
        }
      });
      return endpoints;
    }
  }, {
    key: "expandParams",
    value: function expandParams() {
      var endpoints = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var swaggerVersion = arguments.length > 1 ? arguments[1] : undefined;
      endpoints.forEach(function (endpoint) {
        if (endpoint && endpoint.parameters) {
          var requestBody = [];
          endpoint.parameters.forEach(function (param, i) {
            if (typeof param === 'string') {
              param = Loader.expandParam(param, swaggerVersion);

              if (param["in"] === 'body' && swaggerVersion >= 3) {
                requestBody.push(param);
              } else {
                endpoint.parameters[i] = param;
              }
            }
          }); // Remove the ones that weren't converted

          endpoint.parameters = endpoint.parameters.filter(function (n) {
            return _typeof(n) === 'object';
          });

          if (swaggerVersion >= 3 && Object.keys(requestBody).length) {
            var properties = {};
            var required = [];
            var base = false;
            requestBody.forEach(function (prop) {
              if (prop.name === '__base__') {
                base = prop;
              } else {
                properties[prop.name] = prop.schema;

                if (prop.description) {
                  properties[prop.name].description = prop.description;
                }

                if (prop.required) {
                  required.push(prop.name);
                }
              }
            });
            if (!required.length) required = undefined;
            var schema;

            if (!base) {
              schema = {
                type: 'object',
                required: required,
                properties: properties
              };
            } else {
              schema = base.schema;
            }

            endpoint.requestBody = {
              content: {
                'application/json': {
                  schema: schema
                }
              }
            };

            if (base) {
              endpoint.requestBody.required = base.required;
              endpoint.requestBody.description = base.description;
            }
          } // Remove any params that couldn't be parsed


          endpoint.parameters = endpoint.parameters.filter(function (n) {
            return n !== false;
          });
        }
      });
      return endpoints;
    }
  }, {
    key: "expandParam",
    value: function expandParam() {
      var param = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var swaggerVersion = arguments.length > 1 ? arguments[1] : undefined;
      // eslint-disable-next-line unicorn/no-unsafe-regex
      var parsed = param.match(/(?:\((.*)\))?\s*([\w._-]*)(?:=([^{*]*))?([*])?\s*{(.*?)(?::(.*))?}\s*(.*)?/);
      if (!parsed || !parsed[1] || !parsed[5]) return false;

      if (parsed && !parsed[2]) {
        if (swaggerVersion >= 3 && parsed[1] === 'body') {
          parsed[2] = '__base__';
        } else {
          return false;
        }
      }

      var out = {
        "in": parsed[1],
        name: parsed[2]
      };
      var schema = {
        type: parsed[5].toLowerCase()
      };
      if (parsed[3]) schema["default"] = parsed[3].trim();
      if (parsed[6]) schema.format = parsed[6]; // Format defaults
      // (Currently only supports ints and bools; we probably should find a library
      // to do this safer)

      if (schema.type === 'integer' && schema["default"]) {
        try {
          schema["default"] = parseInt(schema["default"], 10);
        } catch (e) {// noop
        }
      }

      if (schema.type === 'boolean' && schema["default"]) {
        schema["default"] = schema["default"] === 'true';
      }

      if (parsed[4] || out["in"] === 'path') out.required = true;
      if (parsed[7]) out.description = parsed[7]; // OAS 3.0 moves some schema stuff into its own thing

      if (swaggerVersion >= 3) {
        out.schema = schema;
      } else {
        out = Object.assign(out, schema);
      }

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