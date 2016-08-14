const extractComments = require('multilang-extract-comments');

class Extractor {
    static extractComments(code) {
        return extractComments(code);
    }
}

module.exports = Extractor;
