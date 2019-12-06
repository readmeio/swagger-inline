# swagger-inline

Node module for extracting Swagger/OpenAPI endpoints from inline comments.

[![Build](https://github.com/readmeio/swagger-inline/workflows/Node%20CI/badge.svg)](https://github.com/readmeio/swagger-inline)

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)

**Too complicated?** Try the `oas` command line tool, which automates all of this! https://github.com/readmeio/oas

## Install

```
npm install --save-dev swagger-inline
```

## Usage

### CLI
```
swagger-inline [--base] [--format] <inputGlobs ...>
```

#### Example

```bash
swagger-inline "./*.js" --base 'swaggerBase.json' > api.json
```

#### Options
The `inputGlobs` argument is a list of files, or globs, to search for Swagger/OAS comments.

- `base`: Base specification to extend. ***Required**
- `format`: Output filetype: `.json` or `.yaml` (default: `.json`)
- `scope`: Matches the scope field defined in each API. For example, if `--scope public` is supplied, all operations will be generated, if `--scope private`, only those operations that have a `scope: private` declaration will be included.

### Library

```
swaggerInline([inputGlobs...], options) => Promise => json | yaml
```

#### Example

```js
const swaggerInline = require('swagger-inline');

swaggerInline(['src/**/*.js', 'test/**/*.js'], {
    base: 'swaggerBase.json',
}).then((generatedSwagger) => {
    /* ... */
});
```

#### Available options
- `base`: Base specification to extend. ***Required**
- `format`: Output filetype: `.json` or `.yaml` (default: `.json`)
- `ignore`: An array of globs for files to ignore. (default: `['node_modules/**/*', 'bower_modules/**/*']`,
- `logger`: Function called for logging. (default: empty closure)
- `metadata`: Add additional annotations to the Swagger file, prefixed with `x-si`.
- `scope`: Matches the scope field defined in each API. For example, if `--scope public` is supplied, all operations will be generated, if `--scope private`, only those operations that have a `scope: private` declaration will be included.

## Example

#### 1) Create a project

`swaggerBase.yaml`

```yaml
swagger: "2.0"
host: "petstore.swagger.io"
basePath: "/api"
schemes: ['http']
 ```

`api.js`

```js

/**
 * @api [get] /pets
 * description: "Returns all pets from the system that the user has access to"
 * responses:
 *   "200":
 *     description: "A list of pets."
 *     schema:
 *       type: "String"
 */

api.route('/pets', function() {
    /* Pet code 😺 */
});

/**
 * @schema Pet
 * required:
 *   - id
 *   - name
 * properties:
 *   id:
 *     type: integer
 *     format: int64
 *   name:
 *     type: string
 *   tag:
 *     type: string
 */

// some schema related function

```

#### 2) Run Command

```bash
swagger-inline './*.js' --base './swaggerBase.yaml'
```

**Output:**

```yaml
swagger: '2.0'
host: petstore.swagger.io
basePath: /api
schemes:
  - http
paths:
  /pets:
    get:
      description: Returns all pets from the system that the user has access to
      responses:
        '200':
          description: A list of pets.
          schema:
            type: String
components:
  schemes:
    Pet:
      required:
        - id
        - name
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        tag:
          type: string
```

## Contributing
### Build
```bash
npm run build # single build
npm start # build + watch
```

### Test

```bash
npm test # single run
npm run test-watch # test + watch
```
