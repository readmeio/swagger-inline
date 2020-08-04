"use strict";

var Promise = require('bluebird');

var jsYaml = require('js-yaml');

var _ = require('lodash');

var Loader = require('./loader');

var Extractor = require('./extractor');

var Options = require('./options');

function outputResult(object, options) {
  return new Promise(function (resolve) {
    var result = options.isJSON() ? JSON.stringify(object, null, 2) : jsYaml.dump(object);
    resolve(result);
  });
}

function mergeEndpointsWithBase() {
  var swaggerBase = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var endpoints = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  return endpoints.reduce(function (prev, current) {
    var method = current.method;
    var route = current.route;

    var descriptor = _.omit(current, ['method', 'route']);

    if (!method || !route) {
      return prev;
    }

    return _.set(prev, ['paths', route, method], descriptor);
  }, swaggerBase);
}

function mergeSchemasWithBase() {
  var swaggerBase = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var schemas = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  return schemas.reduce(function (prev, current) {
    var name = current.name;

    var descriptor = _.omit(current, ['name']);

    if (!name) {
      return prev;
    }

    return _.set(prev, ['components', 'schemas', name], descriptor);
  }, swaggerBase);
}

function swaggerInline(globPatterns, providedOptions) {
  if (typeof globPatterns === 'undefined') {
    throw new TypeError('No files specified.');
  }

  var options = new Options(providedOptions);
  var log = options.getLogger();
  var base = options.getBase();

  if (!base) {
    throw new Error('No base specification provided!');
  }

  return Loader.resolvePaths(globPatterns, options).then(function (files) {
    return Loader.loadBase(base, options).then(function (baseObj) {
      var swaggerVersion = parseInt(baseObj.swagger || baseObj.openapi, 10);

      if (Object.keys(baseObj).length === 0) {
        throw new Error("The base specification either wasn't found, or it is not a Swagger or OpenAPI definition.");
      }

      log("".concat(files.length, " files matched..."));
      return Loader.loadFiles(files).then(function (filesData) {
        var successfulFiles = filesData.map(function (fileData, index) {
          return {
            fileData: fileData,
            fileName: files[index]
          };
        }).filter(function (fileInfo) {
          return typeof fileInfo.fileData === 'string';
        });
        var endpoints = [];
        var schemas = [];
        return Promise.all(successfulFiles.map(function (fileInfo) {
          try {
            var newEndpoints = Extractor.extractEndpointsFromCode(fileInfo.fileData, {
              filename: fileInfo.fileName,
              scope: options.getScope(),
              ignoreErrors: options.getIgnoreErrors()
            });
            newEndpoints = Loader.addResponse(newEndpoints);
            newEndpoints = Loader.expandParams(newEndpoints, swaggerVersion);
            endpoints = _.concat(endpoints, newEndpoints);
            var scheme = Extractor.extractSchemasFromCode(fileInfo.fileData, {
              filename: fileInfo.fileName,
              scope: options.getScope(),
              ignoreErrors: options.getIgnoreErrors()
            });

            _.remove(scheme, function (s) {
              return _.isEmpty(s);
            });

            schemas = _.concat(schemas, scheme);
            return Promise.resolve();
          } catch (e) {
            return Promise.reject(new Error("".concat(e.toString(), " \n at ").concat(fileInfo.fileName)));
          }
        })).then(function () {
          log("".concat(endpoints.length, " definitions found..."));
          log("".concat(schemas.length, " schemas found..."));
          var baseObjWithEndpoints = mergeEndpointsWithBase(baseObj, endpoints);
          var swagger = mergeSchemasWithBase(baseObjWithEndpoints, schemas);
          return outputResult(swagger, options);
        })["catch"](function (e) {
          return Promise.reject(e);
        });
      });
    });
  });
}

module.exports = swaggerInline;