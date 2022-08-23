/* eslint-disable default-param-last */
/* eslint-disable no-param-reassign */
const fs = require('fs').promises;
const path = require('path');

const globby = require('globby');
const jsYaml = require('js-yaml');
const any = require('promise.any');

class Loader {
  static resolvePaths(filepaths, options) {
    const ignore = options ? options.getIgnore() : [];

    return globby(filepaths, { ignore });
  }

  static findSwagger(directory = process.cwd(), options) {
    return fs
      .readdir(directory)
      .then(files => {
        const candidates = files.filter(file => Loader.TYPES_REGEX.test(file)).map(file => path.join(directory, file));
        const promises = candidates.map(filepath => {
          return Loader.loadData(filepath, options).then(data => {
            return data.swagger || data.openapi ? Promise.resolve(data) : Promise.reject();
          });
        });

        return any(promises).catch(Promise.reject);
      })
      .catch(Promise.reject);
  }

  static loadFiles(filepaths) {
    return Promise.all(filepaths.map(filepath => Loader.loadFile(filepath))).catch(err => Promise.reject(err));
  }

  static loadFile(file) {
    return fs.readFile(file, 'utf8');
  }

  static loadData(filepath, options) {
    const extname = path.extname(filepath);
    const loadFunction = Loader.LOADER_METHODS[extname];

    if (!loadFunction) {
      throw new Error(`Did not recognize ${filepath}.`);
    }

    return Loader.LOADER_METHODS[extname](filepath, options);
  }

  static loadPattern(filepath) {
    return Loader.loadFile(filepath)
      .then(pattern => {
        return JSON.parse(pattern);
      })
      .catch(() => {
        // Return null if we have any problems, potential for more rubust error handling.
        return null;
      });
  }

  static loadBase(base = '', options) {
    return fs
      .stat(base)
      .then(stat => {
        if (stat.isFile()) {
          return this.loadData(base, options).catch(err => Promise.reject(err));
        } else if (stat.isDirectory()) {
          return this.findSwagger(base, options).catch(err => Promise.reject(err));
        }

        return this.findSwagger(process.cwd(), options).catch(err => Promise.reject(err));
      })
      .catch(() => {
        // Return an empty object if we have any problems.
        return {};
      });
  }

  static loadYAML(filepath, options) {
    return Loader.loadFile(filepath).then(data => Loader.addMetadata(jsYaml.load(data), filepath, options));
  }

  static loadJSON(filepath, options) {
    return Loader.loadFile(filepath).then(data => Loader.addMetadata(JSON.parse(data), filepath, options));
  }

  static addMetadata(data, filepath, options) {
    if (options && options.getMetadata()) {
      data['x-si-base'] = filepath;
    }
    return data;
  }

  static addResponse(endpoints = {}) {
    // If there's no response, add a default one
    endpoints.forEach(endpoint => {
      if (!endpoint.responses || !Object.keys(endpoint.responses).length) {
        endpoint.responses = {
          200: {
            description: 'Successful response',
          },
        };
      }
    });
    return endpoints;
  }

  static expandParams(endpoints = {}, specVersion) {
    endpoints.forEach(endpoint => {
      if (endpoint && endpoint.parameters) {
        const requestBody = [];
        endpoint.parameters.forEach((param, i) => {
          if (typeof param === 'string') {
            param = Loader.expandParam(param, specVersion);
            if (param.in === 'body' && specVersion >= 3) {
              requestBody.push(param);
            } else {
              endpoint.parameters[i] = param;
            }
          }
        });

        // Remove the ones that weren't converted
        endpoint.parameters = endpoint.parameters.filter(n => typeof n === 'object');

        if (specVersion >= 3 && Object.keys(requestBody).length) {
          const properties = {};
          let required = [];
          let base = false;

          requestBody.forEach(prop => {
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

          let schema;
          if (!base) {
            schema = {
              type: 'object',
              required,
              properties,
            };
          } else {
            schema = base.schema;
          }

          let bodyContentType = 'application/json';
          if (endpoint.bodyContentType) {
            bodyContentType = endpoint.bodyContentType;
          }

          endpoint.requestBody = {
            content: {
              [bodyContentType]: {
                schema,
              },
            },
          };

          if (base) {
            endpoint.requestBody.required = base.required;
            endpoint.requestBody.description = base.description;
          }
        }

        // Remove any params that couldn't be parsed
        endpoint.parameters = endpoint.parameters.filter(n => n !== false);
      }
    });
    return endpoints;
  }

  static expandParam(param = '', swaggerVersion) {
    let hasRef = false;
    // eslint-disable-next-line unicorn/no-unsafe-regex
    const parsed = param.match(/(?:\((.*)\))?\s*([\w._-]*)(?:=([^{*]*))?([*])?\s*{(.*?)(?::(.*))?}\s*(.*)?/);

    if (!parsed || !parsed[1] || !parsed[5]) return false;

    if (parsed && !parsed[2]) {
      if (swaggerVersion >= 3 && parsed[1] === 'body') {
        parsed[2] = '__base__';
      } else {
        return false;
      }
    }

    let out = {
      in: parsed[1],
      name: parsed[2],
    };

    const schema = {};

    if (parsed[5].toLowerCase() === 'ref') {
      let ref = parsed[6];

      // Determines if the ref points to a url or local file.
      // This should be reliable enough because JSON Pointers don't normally contain the '.' character

      const isURLOrFile = ref.includes('.');
      if (!ref.startsWith('#/') && !isURLOrFile) {
        ref = swaggerVersion >= 3 ? `#/components/${ref}` : `#/definitions/${ref}`;
      }
      schema.$ref = ref;
      hasRef = true;
    } else {
      schema.type = parsed[5].toLowerCase();

      if (parsed[3]) schema.default = parsed[3].trim();
      if (parsed[6]) schema.format = parsed[6];

      // Format defaults
      // (Currently only supports ints and bools; we probably should find a library
      // to do this safer)

      if (schema.type === 'integer' && schema.default) {
        try {
          schema.default = parseInt(schema.default, 10);
        } catch (e) {
          // noop
        }
      }

      if (schema.type === 'boolean' && schema.default) {
        schema.default = schema.default === 'true';
      }
    }

    if (parsed[4] || out.in === 'path') out.required = true;
    if (parsed[7]) out.description = parsed[7];

    // OAS 3.0 moves some schema stuff into its own thing
    if (swaggerVersion >= 3 || hasRef) {
      out.schema = schema;
    } else {
      out = Object.assign(out, schema);
    }

    return out;
  }
}

Loader.LOADER_METHODS = {
  '.yaml': Loader.loadYAML,
  '.yml': Loader.loadYAML,
  '.json': Loader.loadJSON,
};
Loader.TYPES_REGEX = /\.json|\.yaml|\.yml/i;

module.exports = Loader;
