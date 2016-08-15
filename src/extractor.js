const extractComments = require('multilang-extract-comments');
const jsYaml = require('js-yaml');

function pushLine(array, line) {
    if (line.trim()) {
        array.push(line);
        return true;
    }
    return false;
}

class Extractor {
    static extractComments(code, options) {
        return extractComments(code, options);
    }

    static extractEndpoint(comment) {
        const lines = comment.split('\n');
        const yamlLines = [];
        let endpoint = {};
        let method = null;

        lines.some((line) => {
            if (method) {
                return !pushLine(yamlLines, line); // end when lines stop being pushed
            }
            method = method || line.match(this.ROUTE_REGEX);
        });

        if (method) {
            const yamlObject = jsYaml.load(yamlLines.join('\n'));

            endpoint.method = method[1];
            endpoint.route = method[2];
            endpoint = Object.assign({}, endpoint, yamlObject);
        }

        return endpoint;
    }
}

Extractor.ROUTE_REGEX = /@api\s+\[(\w+)\]\s+(.*)$/m;

module.exports = Extractor;
