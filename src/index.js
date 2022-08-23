const path = require('path');

const jsYaml = require('js-yaml');

const Extractor = require('./extractor');
const Loader = require('./loader');
const Options = require('./options');

function outputResult(object, options) {
  return new Promise(resolve => {
    const result = options.isJSON() ? JSON.stringify(object, null, 2) : jsYaml.dump(object);
    resolve(result);
  });
}

function sortObj(obj, compare) {
  const sorted = compare ? Object.keys(obj).sort(compare) : Object.keys(obj).sort();
  return sorted.reduce(function (result, key) {
    // eslint-disable-next-line no-param-reassign
    result[key] = obj[key];
    return result;
  }, {});
}

function mergeEndpointsWithBase(swaggerBase = {}, endpoints = []) {
  // To ensure consistent sorting of HTTP methods let's universally enforce the following order.
  const methodPriority = new Map();
  ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'].forEach((x, i) => methodPriority.set(x, i));

  return endpoints.reduce((prev, current) => {
    const { method, route, ...operation } = current;
    if (!method || !route) {
      return prev;
    }

    /* eslint-disable no-param-reassign */
    if (!prev.paths) prev.paths = {};
    if (!prev.paths[route]) prev.paths[route] = {};

    prev.paths[route][method] = operation;

    // Resort everything to be alphabetical.
    prev.paths = sortObj(prev.paths);
    prev.paths[route] = sortObj(prev.paths[route], (a, b) => {
      return methodPriority.get(a) - methodPriority.get(b);
    });
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
    prev.components.schemas = sortObj(prev.components.schemas);
    /* eslint-enable no-param-reassign */

    return prev;
  }, swaggerBase);
}

function updateTitleAndVersion(baseObj, options) {
  const info = baseObj.info ? baseObj.info : {};
  if (options.getTitle()) {
    info.title = options.getTitle();
  }
  if (options.getApiVersion()) {
    info.version = options.getApiVersion();
  }
  return info;
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
        throw new Error("The base specification either wasn't found, or it is not a Swagger or OpenAPI definition.");
      }

      log(`${files.length} files matched...`);

      baseObj.info = updateTitleAndVersion(baseObj, options); // eslint-disable-line no-param-reassign

      return Loader.loadPattern(options.getPattern()).then(pattern => {
        if (pattern) {
          options.setPattern(pattern);
        } else {
          // if there is no valid pattern specifed reset the pattern attribute to it's default to prevent error.
          options.setPattern(Options.DEFAULTS.pattern);
        }

        return Loader.loadFiles(files)
          .then(filesData => {
            const detectedFiles = filesData.map((fileData, index) => {
              return { fileData, fileName: files[index] };
            });

            let endpoints = [];
            let schemas = [];

            return Promise.all(
              detectedFiles.map(fileInfo => {
                let newEndpoints;
                try {
                  newEndpoints = Extractor.extractEndpointsFromCode(fileInfo.fileData, {
                    filename: fileInfo.fileName,
                    scope: options.getScope(),
                    ignoreErrors: options.getIgnoreErrors(),
                    pattern: options.getPattern(),
                  });
                } catch (err) {
                  // If the file that we failed to parse is a text file, let's just ignore it.
                  if (['.json', '.md', '.txt'].includes(path.extname(fileInfo.fileName))) {
                    return Promise.resolve();
                  } else if (/Cannot find language definition/.test(err.message)) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error(`${err.toString()} \n at ${fileInfo.fileName}`));
                }

                try {
                  newEndpoints = Loader.addResponse(newEndpoints);

                  newEndpoints = Loader.expandParams(newEndpoints, specVersion);
                  endpoints = endpoints.concat(newEndpoints);

                  const schema = Extractor.extractSchemasFromCode(fileInfo.fileData, {
                    filename: fileInfo.fileName,
                    scope: options.getScope(),
                    ignoreErrors: options.getIgnoreErrors(),
                    pattern: options.getPattern(),
                  }).filter(s => Object.keys(s).length);

                  schemas = schemas.concat(schema);
                  return Promise.resolve();
                } catch (err) {
                  return Promise.reject(new Error(`${err.toString()} \n at ${fileInfo.fileName}`));
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
  });
}

module.exports = swaggerInline;
