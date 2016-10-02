# swagger-inline

Node module for extracting swagger endpoints from inline comments.

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

#### **Cli**

### `swagger-inline <inputGlobs ...> [--base] [--format] [--out]`

```bash
swagger-inline 'src/**/*.js' --base 'swaggerBase.json' # outputs built swagger.json
```

**Options:**
- `inputGlobs`: Files/globs to search for swagger comments.
- `base`: Base swagger to extend. (default: auto-detect)
- `out`: Name of file to output the generated swagger file (default: results returned, no file saved).
- `format`: Output filetype - `.json` or `.yaml` (default: `.json`)
- `logger`: Function called for logging.
- `metadata`: Add additional annotations to the Swagger file, prefixed with "x-si"

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
```

#### 2) Run Command

```bash
swagger-inline './*.js' --base './swaggerBase.yaml'
```

**Output:**

`swagger.yaml`

```yaml
swagger: "2.0"
host: "petstore.swagger.io"
basePath: "/api"
schemes: ['http']
/pets:
  get:
    description: Returns all pets from the system that the user has access to
    responses:
      '200':
        description: A list of pets.
        schema:
          type: "String"
```
