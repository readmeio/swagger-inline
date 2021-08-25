# swagger-inline

Generate an OpenAPI/Swagger definition from inline comments.

[![npm](https://img.shields.io/npm/v/swagger-inline)](https://npm.im/swagger-inline) [![Build](https://github.com/readmeio/swagger-inline/workflows/CI/badge.svg)](https://github.com/readmeio/swagger-inline)

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)

* [Installation](#installation)
* [Usage](#usage)
  * [CLI](#cli)
  * [Library](#library)
* [Examples](#examples)

## Installation

```
npm install swagger-inline --save-dev
```

## Usage
### CLI
```
npx swagger-inline [--base] [--format] <inputGlobs ...>
```

#### Example

```bash
npx swagger-inline "./*.js" --base 'swaggerBase.json' > api.json
```

#### Options
The `inputGlobs` argument is a list of files, or globs, to search for Swagger/OAS comments.

- `base`: Base API specification to extend. ***Required**
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
- `ignoreErrors`: Ignore errors due to image files or unknown file types when parsing files. (default: `false`)

## Examples
### Standard usage
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
 * bodyContentType: "application/json"
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
  schemas:
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

### Scoped compilations
With the `--scope` parameter, you can compile your files based on a specific target that you define within your inline comments. For example, we have an API with a `GET /pets` and `POST /pets` but only the `GET` operation is public. We can add `scope: public` to our `GET` operation documentation to tell `swagger-inline` what scope it's set under.

```js
/**
 * @api [get] /pets
 * scope: public
 * description: "Returns all pets from the system that the user has access to"
 * responses:
 *   "200":
 *     description: "A list of pets."
 *     schema:
 *       type: "String"
 */

/**
 * @api [post] /pets
 * description: "Creates a new pet
 * responses:
 *   "200":
 *     description: "The created pet."
 */
 ```

Now when you run `swagger-inline`, you can supply `--scope public` and only the `GET /pets` operation will be picked up. Omit `--scope public` and everything will be picked up.
