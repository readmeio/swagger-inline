const jsYaml = require('js-yaml');

const Loader = require('./loader');
const Extractor = require('./extractor');
const Options = require('./options');

function outputResult(object, options) {
  return new Promise(resolve => {
    const result = options.isJSON() ? JSON.stringify(object, null, 2) : jsYaml.dump(object);
    resolve(result);
  });
}

function mergeEndpointsWithBase(swaggerBase = {}, endpoints = []) {
  return endpoints.reduce((prev, current) => {
    const { method, route, ...operation } = current;
    if (!method || !route) {
      return prev;
    }

    /* eslint-disable no-param-reassign */
    if (!prev.paths) prev.paths = {};
    if (!prev.paths[route]) prev.paths[route] = {};

    prev.paths[route][method] = operation;
    /* eslint-enable no-param-reassign */

    return prev;
  }, swaggerBase);
}

function mergeSchemasWithBase(swaggerBase = {}, schemas = []) {
  return schemas.reduce((prev, current) => {
    const { name, ...schema } = current;
    if (!name) {
      return prev;
    }

    /* eslint-disable no-param-reassign */
    if (!prev.components) prev.components = {};
    if (!prev.components.schemas) prev.components.schemas = {};

    prev.components.schemas[name] = schema;
    /* eslint-enable no-param-reassign */

    return prev;
  }, swaggerBase);
}

function swaggerInline(globPatterns, providedOptions) {
  if (typeof globPatterns === 'undefined') {
    throw new TypeError('No files specified.');
  }

  const options = new Options(providedOptions);
  const log = options.getLogger();
  const base = options.getBase();

  if (!base) {
    throw new Error('No base specification provided!');
  }

  return Loader.resolvePaths(globPatterns, options).then(files => {
    return Loader.loadBase(base, options).then(baseObj => {
      const specVersion = parseInt(baseObj.swagger || baseObj.openapi, 10);

      if (Object.keys(baseObj).length === 0) {
        throw new Error(`The base specification either wasn't found, or it is not a Swagger or OpenAPI definition.`);
      }

      log(`${files.length} files matched...`);
      return Loader.loadFiles(files)
        .then(filesData => {
          const detectedFiles = filesData.map((fileData, index) => {
            return { fileData, fileName: files[index] };
          });

          let endpoints = [];
          let schemas = [];

          return Promise.all(
            detectedFiles.map(fileInfo => {
              try {
                let newEndpoints = Extractor.extractEndpointsFromCode(fileInfo.fileData, {
                  filename: fileInfo.fileName,
                  scope: options.getScope(),
                  ignoreErrors: options.getIgnoreErrors(),
                });

                newEndpoints = Loader.addResponse(newEndpoints);

                newEndpoints = Loader.expandParams(newEndpoints, specVersion);
                endpoints = endpoints.concat(newEndpoints);

                const schema = Extractor.extractSchemasFromCode(fileInfo.fileData, {
                  filename: fileInfo.fileName,
                  scope: options.getScope(),
                  ignoreErrors: options.getIgnoreErrors(),
                }).filter(s => Object.keys(s).length);

                schemas = schemas.concat(schema);
                return Promise.resolve();
              } catch (e) {
                return Promise.reject(new Error(`${e.toString()} \n at ${fileInfo.fileName}`));
              }
            })
          )
            .then(() => {
              log(`${endpoints.length} definitions found...`);
              log(`${schemas.length} schemas found...`);

              const baseWithEndpoints = mergeEndpointsWithBase(baseObj, endpoints);
              const swagger = mergeSchemasWithBase(baseWithEndpoints, schemas);

              return outputResult(swagger, options);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        })
        .catch(err => {
          return Promise.reject(err);
        });
    });
  });
}

module.exports = swaggerInline;
