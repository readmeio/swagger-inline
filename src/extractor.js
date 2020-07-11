const extractComments = require('multilang-extract-comments');
const jsYaml = require('js-yaml');

function pushLine(array, line) {
  if (line.trim()) {
    array.push(line);
    return true;
  }
  return false;
}

function loadYamlWithPrettyErrors(prettyObject, yamlLines) {
  try {
    return jsYaml.load(yamlLines.join('\n'));
  } catch (e) {
    e.message = `YAML Exception in '${prettyObject}':\n${e.message}`;
    throw e;
  }
}

function buildEndpoint(route, yamlLines) {
  const endpoint = {};

  if (route) {
    const yamlObject = loadYamlWithPrettyErrors(`${route[1]} ${route[2]}`, yamlLines);

    endpoint.method = route[1];
    endpoint.route = route[2];
    if (route[3]) {
      endpoint.summary = route[3];
    }
    Object.assign(endpoint, yamlObject);
  }
  return endpoint;
}

function buildSchema(schema, yamlLines) {
  const scheme = {};

  if (schema) {
    const yamlObject = loadYamlWithPrettyErrors(`Schema: ${schema[1]}`, yamlLines);

    scheme.name = schema[1];
    Object.assign(scheme, yamlObject);
  }
  return scheme;
}

class Extractor {
  static extractEndpointsFromCode(code, options) {
    const comments = this.extractComments(code, options);

    return Object.keys(comments)
      .map(commentKey => {
        const comment = comments[commentKey];
        return this.extractEndpoint(comment.content, options);
      })
      .filter(endpoint => {
        return endpoint.method && endpoint.route;
      });
  }

  static extractSchemasFromCode(code, options) {
    const comments = this.extractComments(code, options);

    return Object.keys(comments).map(commentKey => {
      const comment = comments[commentKey];
      return this.extractSchemas(comment.content, options);
    });
  }

  static extractComments(code, options) {
    try {
      return extractComments(code, options);
    } catch (e) {
      if(options.ignoreErrors) {
        return {};
      }
      throw e;
    }
  }

  static extractEndpoint(comment, options) {
    const lines = comment.split('\n');
    const yamlLines = [];
    let route = null;
    let scopeMatched = false;

    lines.some(line => {
      if (route) {
        if (options && options.scope) {
          if (line.trim().indexOf('scope:') === 0 && line.indexOf(options.scope) >= 0) {
            scopeMatched = true;
            return false;
          }
        } else {
          scopeMatched = true;
        }
        if (line.trim().indexOf('scope:') === 0) {
          return false;
        }
        pushLine(yamlLines, line);
        // eslint-disable-next-line consistent-return
        return;
      }
      route = route || line.match(this.ROUTE_REGEX);
      return false;
    });

    if (!scopeMatched) {
      route = null;
    }

    return buildEndpoint(route, yamlLines);
  }

  static extractSchemas(comment, options) {
    const lines = comment.split('\n');
    const yamlLines = [];
    let route = null;
    let scopeMatched = false;

    lines.forEach(line => {
      if (route) {
        if (options && options.scope) {
          if (line.trim().indexOf('scope:') === 0 && line.indexOf(options.scope) >= 0) {
            scopeMatched = true;
            return;
          }
        } else {
          scopeMatched = true;
        }
        if (line.trim().indexOf('scope:') === 0) {
          return;
        }
        pushLine(yamlLines, line);
        return;
      }
      route = route || line.match(this.SCHEMA_REGEX);
    });

    if (!scopeMatched) {
      route = null;
    }

    return buildSchema(route, yamlLines);
  }
}

// eslint-disable-next-line unicorn/no-unsafe-regex
Extractor.ROUTE_REGEX = /@(?:oas|api)\s+\[(\w+)\]\s+(.*?)(?:\s+(.*))?$/m;
Extractor.SCHEMA_REGEX = /@schema\s+(.*)$/m;

module.exports = Extractor;
