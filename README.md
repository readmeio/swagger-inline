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

### `swaggerInline(inputGlob, options) => Promise => json | yaml`

```js
const swaggerInline = require('swagger-inline');

swaggerInline('src/**/*.js', {
    base: 'swaggerBase.json',
}).then((generatedSwagger) => {
    // Use generated swagger
});

// Multiple globs

swaggerInline(['src/**/*.js', 'test/**/*.js'], {
    base: 'swaggerBase.json',
}).then((generatedSwagger) => {
    /* ... */
});

```

#### **Cli**

### `swagger-inline <inputGlob> [--base] [--out]`

```bash
swagger-inline 'src/**/*.js' --base 'swaggerBase.json' # outputs built swagger.json
```

**Options:**
- `inputFiles`: Files to search for swagger comments.
- `base`: Base `swagger.json` or `swagger.yml` to build onto
- `format`: Output filename - `.json` or `.yaml` (default: `.json`)
- 'logger': Function called for logging.

## Example:

#### 1) Create a project

`swaggerBase.yml`

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
swagger-inline '*.js' --base 'swaggerBase.yml'
```

**Output:**

`swagger.yml`

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
