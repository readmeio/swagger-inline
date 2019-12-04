const extractComments = require("multilang-extract-comments");
const jsYaml = require("js-yaml");

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
        const yamlObject = jsYaml.load(yamlLines.join("\n"));

        endpoint.method = route[1];
        endpoint.route = route[2];
        if (route[3]) {
            endpoint.summary = route[3];
        }
        Object.assign(endpoint, yamlObject);
    }
    return endpoint;
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

    static extractComments(code, options) {
        return extractComments(code, options);
    }

    static extractEndpoint(comment, options) {
        const lines = comment.split("\n");
        const yamlLines = [];
        let route = null;
        let scopeMatched = false;

        lines.some(line => {
            if (route) {
                if (options && options.scope) {
                    if (
                        line.trim().indexOf("scope:") === 0 &&
                        line.indexOf(options.scope) >= 0
                    ) {
                        scopeMatched = true;
                        return false;
                    }
                } else {
                    scopeMatched = true;
                }
                if (line.trim().indexOf("scope:") === 0) {
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
}

Extractor.ROUTE_REGEX = /@(?:oas|api)\s+\[(\w+)\]\s+(.*?)(?:\s+(.*))?$/m;

module.exports = Extractor;
