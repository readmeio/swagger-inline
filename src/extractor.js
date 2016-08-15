const extractComments = require('multilang-extract-comments');
const jsYaml = require('js-yaml');

function pushLine(array, line) {
    if (line.trim()) {
        array.push(line);
        return true;
    }
    return false;
}

function buildEndpoint(route, yamlLines) {
    const endpoint = {};

    if (route) {
        const yamlObject = jsYaml.load(yamlLines.join('\n'));

        endpoint.method = route[1];
        endpoint.route = route[2];
        Object.assign(endpoint, yamlObject);
    }
    return endpoint;
}

class Extractor {
    static extractComments(code, options) {
        return extractComments(code, options);
    }

    static extractEndpoint(comment) {
        const lines = comment.split('\n');
        const yamlLines = [];
        let route = null;

        lines.some((line) => {
            if (route) {
                return !pushLine(yamlLines, line); // end when lines stop being pushed
            }
            route = route || line.match(this.ROUTE_REGEX);
            return false;
        });

        return buildEndpoint(route, yamlLines);
    }
}

Extractor.ROUTE_REGEX = /@api\s+\[(\w+)\]\s+(.*)$/m;

module.exports = Extractor;
