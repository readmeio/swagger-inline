/* eslint-disable no-param-reassign */
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const jsYaml = require('js-yaml');
const glob = require('multi-glob').glob;

class Loader {
  static resolvePaths(filepaths, options) {
    const ignore = options ? options.getIgnore() : undefined;
    return new Promise(function(resolve, reject) {
      glob(filepaths, { ignore }, (err, files) => {
        return err === null ? resolve(files) : reject(err);
      });
    });
  }

  static findSwagger(directory = process.cwd(), options) {
    return new Promise((resolve, reject) => {
      fs.readdir(directory, (err, files) => {
        if (err) {
          reject(err);
        } else {
          const swaggerCandidates = files
            .filter(file => {
              return Loader.SWAGGER_TYPES_REGEX.test(file);
            })
            .map(file => {
              return path.join(directory, file);
            });

          const swaggerPromises = swaggerCandidates.map(filepath => {
            return Loader.loadData(filepath, options).then(data => {
              return data.swagger || data.openapi ? Promise.resolve(data) : Promise.reject();
            });
          });

          Promise.any(swaggerPromises)
            .then(loadedSwagger => {
              resolve(loadedSwagger);
            })
            .catch(() => {
              resolve({});
            });
        }
      });
    });
  }

  static loadFiles(filepaths) {
    return new Promise(resolve => {
      const loadPromises = Promise.map(
        filepaths,
        filepath => {
          return Loader.loadFile(filepath).reflect();
        },
        { concurrency: Loader.MAX_CONCURRENCY }
      );
      resolve(loadPromises);
    }).then(loadResults => {
      return loadResults.map(loadResult => {
        return loadResult.isFulfilled() ? loadResult.value() : loadResult.reason();
      });
    });
  }

  static loadFile(filepath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filepath, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  static loadData(filepath, options) {
    const extname = path.extname(filepath);
    const loadFunction = Loader.LOADER_METHODS[extname];

    if (!loadFunction) {
      throw new Error(`Did not recognize ${filepath}.`);
    }
    return Loader.LOADER_METHODS[extname](filepath, options);
  }

  static loadBase(base = '', options) {
    return new Promise(resolve => {
      fs.stat(base, (err, stat) => {
        if (!err && stat.isFile()) {
          this.loadData(base, options).then(baseData => {
            resolve(baseData);
          });
        } else if (!err && stat.isDirectory()) {
          this.findSwagger(base, options).then(baseData => {
            resolve(baseData);
          });
        } else {
          this.findSwagger(process.cwd(), options).then(baseData => {
            resolve(baseData);
          });
        }
      });
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
          '200': {
            description: 'Successful response',
          },
        };
      }
    });
    return endpoints;
  }

  static expandParams(endpoints = {}, swaggerVersion) {
    endpoints.forEach(endpoint => {
      if (endpoint && endpoint.parameters) {
        const requestBody = [];
        endpoint.parameters.forEach((param, i) => {
          if (typeof param === 'string') {
            param = Loader.expandParam(param, swaggerVersion);
            if (param.in === 'body' && swaggerVersion >= 3) {
              requestBody.push(param);
            } else {
              endpoint.parameters[i] = param;
            }
          }
        });

        // Remove the ones that weren't converted
        endpoint.parameters = endpoint.parameters.filter(n => typeof n === 'object');

        if (swaggerVersion >= 3 && Object.keys(requestBody).length) {
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

          endpoint.requestBody = {
            content: {
              'application/json': {
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

    const schema = {
      type: parsed[5].toLowerCase(),
    };

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

    if (parsed[4] || out.in === 'path') out.required = true;
    if (parsed[7]) out.description = parsed[7];

    // OAS 3.0 moves some schema stuff into its own thing
    if (swaggerVersion >= 3) {
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
Loader.SWAGGER_TYPES_REGEX = /\.json|\.yaml|\.yml/i;
Loader.MAX_CONCURRENCY = 500;

module.exports = Loader;
