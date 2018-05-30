'use strict';

var Promise = require('bluebird');
var fs = require('fs-extra');
var jsYaml = require('js-yaml');
var _ = require('lodash');
var chalk = require('chalk');

var Loader = require('./loader');
var Extractor = require('./extractor');
var Options = require('./options');

function outputResult(object, options) {
    return new Promise(function (resolve) {
        var result = options.isJSON() ? JSON.stringify(object, null, 2) : jsYaml.dump(object);
        var outPath = options.getOut();
        if (outPath) {
            fs.outputFile(outPath, result, function (err) {
                if (err) {
                    options.getLogger()('Failed to write swagger to ' + outPath);
                }
                resolve(result);
            });
        } else {
            resolve(result);
        }
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

function swaggerInline(globPatterns, providedOptions) {
    if (typeof globPatterns === 'undefined') {
        throw Error('No files specificied');
    }

    var options = new Options(providedOptions);
    var log = options.getOut() ? options.getLogger() : function () {};

    return Loader.resolvePaths(globPatterns, options).then(function (files) {
        var base = options.getBase();

        return Loader.loadBase(base, options).then(function (baseObj) {
            var swaggerVersion = parseInt(baseObj.swagger || baseObj.openapi, 10);

            if (Object.keys(baseObj).length === 0) {
                log(chalk.yellow('No base swagger provided/found!'));
            }

            log(files.length + ' files matched...');
            return Loader.loadFiles(files).then(function (filesData) {
                var successfulFiles = filesData.map(function (fileData, index) {
                    return { fileData: fileData, fileName: files[index] };
                }).filter(function (fileInfo) {
                    return typeof fileInfo.fileData === 'string';
                });
                var endpoints = _.flatten(successfulFiles.map(function (fileInfo) {
                    try {
                        var _endpoints = Extractor.extractEndpointsFromCode(fileInfo.fileData, { filename: fileInfo.fileName, scope: options.getScope() });

                        _endpoints = Loader.addResponse(_endpoints);
                        _endpoints = Loader.expandParams(_endpoints, swaggerVersion);
                        return _endpoints;
                    } catch (e) {
                        log(chalk.red('Error parsing ' + fileInfo.fileName));
                        log(chalk.red(e.toString()));
                        return {};
                    }
                }));

                log(endpoints.length + ' swagger definitions found...');

                var swagger = mergeEndpointsWithBase(baseObj, endpoints);
                log('swagger' + options.getFormat() + ' created!');
                return outputResult(swagger, options);
            });
        });
    });
}

module.exports = swaggerInline;