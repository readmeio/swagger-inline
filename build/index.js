#! /usr/bin/env node
"use strict";

var cli = require("./cli");
var swaggerInline = require("./swagger-inline");

if (require.main === module) {
    cli(process.argv);
} else {
    module.exports = swaggerInline;
}