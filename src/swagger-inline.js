const Promise = require('bluebird');
const fs = require('fs-extra');
const jsYaml = require('js-yaml');
const _ = require('lodash');
const chalk = require('chalk');

const Loader = require('./loader');
const Extractor = require('./extractor');
const Options = require('./options');

function outputResult(object, options) {
  return new Promise(resolve => {
    const result = options.isJSON() ? JSON.stringify(object, null, 2) : jsYaml.dump(object);
    const outPath = options.getOut();
    if (outPath) {
      fs.outputFile(outPath, result, err => {
        if (err) {
          options.getLogger()(`Failed to write swagger to ${outPath}`);
        }
        resolve(result);
      });
    } else {
      resolve(result);
    }
  });
}

function mergeEndpointsWithBase(swaggerBase = {}, endpoints = []) {
  return endpoints.reduce((prev, current) => {
    const method = current.method;
    const route = current.route;
    const descriptor = _.omit(current, ['method', 'route']);

    if (!method || !route) {
      return prev;
    }

    return _.set(prev, ['paths', route, method], descriptor);
  }, swaggerBase);
}

function mergeSchemasWithBase(swaggerBase = {}, schemas = []) {
  return schemas.reduce((prev, current) => {
    const name = current.name;
    const descriptor = _.omit(current, ['name']);

    if (!name) {
      return prev;
    }

    return _.set(prev, ['components', 'schemas', name], descriptor);
  }, swaggerBase);
}

function swaggerInline(globPatterns, providedOptions) {
  if (typeof globPatterns === 'undefined') {
    throw new TypeError('No files specificied');
  }

  const options = new Options(providedOptions);
  const log = options.getOut() ? options.getLogger() : () => {};

  return Loader.resolvePaths(globPatterns, options).then(files => {
    const base = options.getBase();

    return Loader.loadBase(base, options).then(baseObj => {
      const swaggerVersion = parseInt(baseObj.swagger || baseObj.openapi, 10);

      if (Object.keys(baseObj).length === 0) {
        log(chalk.yellow('No base swagger provided/found!'));
      }

      log(`${files.length} files matched...`);
      return Loader.loadFiles(files).then(filesData => {
        const successfulFiles = filesData
          .map((fileData, index) => {
            return { fileData, fileName: files[index] };
          })
          .filter(fileInfo => {
            return typeof fileInfo.fileData === 'string';
          });

        let endpoints = [];
        let schemas = [];

        successfulFiles.forEach(fileInfo => {
          try {
            let newEndpoints = Extractor.extractEndpointsFromCode(fileInfo.fileData, {
              filename: fileInfo.fileName,
              scope: options.getScope(),
            });

            newEndpoints = Loader.addResponse(newEndpoints);

            newEndpoints = Loader.expandParams(newEndpoints, swaggerVersion);
            endpoints = _.concat(endpoints, newEndpoints);

            const scheme = Extractor.extractSchemasFromCode(fileInfo.fileData, {
              filename: fileInfo.fileName,
              scope: options.getScope(),
            });
            _.remove(scheme, s => {
              return _.isEmpty(s);
            });
            schemas = _.concat(schemas, scheme);
          } catch (e) {
            log(chalk.red(`Error parsing ${fileInfo.fileName}`));
            log(chalk.red(e.toString()));
          }
        });

        log(`${endpoints.length} swagger definitions found...`);
        log(`${schemas.length} swagger schemas found...`);

        const baseObjWithEndpoints = mergeEndpointsWithBase(baseObj, endpoints);
        const swagger = mergeSchemasWithBase(baseObjWithEndpoints, schemas);
        log(`swagger${options.getFormat()} created!`);
        return outputResult(swagger, options);
      });
    });
  });
}

module.exports = swaggerInline;
