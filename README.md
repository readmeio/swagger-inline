# swagger-inline

Node module for extracting swagger endpoints from inline comments.

[![Build](https://github.com/readmeio/swagger-inline/workflows/Node%20CI/badge.svg)](https://github.com/readmeio/swagger-inline)

[![](https://d3vv6lp55qjaqc.cloudfront.net/items/1M3C3j0I0s0j3T362344/Untitled-2.png)](https://readme.io)

**Too complicated?** Try the `oas` command line tool, which automates all of this! https://github.com/readmeio/oas

## Install

```
npm install --save-dev swagger-inline
```

## Build
```bash
npm run build # single build
npm start # build + watch
```

## Test

```bash
npm test # single run
npm run test-watch # test + watch
```

## Usage

#### **Javascript**

### `swaggerInline([inputGlobs...], options) => Promise => json | yaml`

```js
const swaggerInline = require('swagger-inline');

swaggerInline(['src/**/*.js', 'test/**/*.js'], {
    base: 'swaggerBase.json',
}).then((generatedSwagger) => {
    /* ... */
});

```

#### **CLI**

### `swagger-inline [--base] [--format] [--out] <inputGlobs ...>`

```bash
swagger-inline --base 'swaggerBase.json' # outputs built swagger.json 'src/**/*.js'
```

**Options:**
- `inputGlobs`: Files/globs to search for swagger comments.
- `base`: Base swagger to extend. (default: auto-detect)
- `out`: Name of file to output the generated swagger file (default: results returned, no file saved).
- `format`: Output filetype - `.json` or `.yaml` (default: `.json`)
- `logger`: Function called for logging.
- `metadata`: Add additional annotations to the Swagger file, prefixed with "x-si"
- `ignore`: globs of files to ignore (by default, `['node_modules/**/*', ...etc]`,
- `scope`: matches the scope field defined in each api (for example, `--scope public`... if not provided, all APIs' doc will be generated )

## Example:

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

/*
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

/*
* @schema Pet',
* required:',
*   - id',
*   - name',
* properties:',
*   id:',
*     type: integer'
*     format: int64'
*   name:',
*     type: string',
*   tag:',
*     type: string',
*/

//some scheme related function

```

#### 2) Run Command

```bash
swagger-inline './*.js' --base './swaggerBase.yaml'
```

**Output:**

`swagger.yaml`

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
          format: int6
        name:
          type: string
        tag:
          type: string
```
