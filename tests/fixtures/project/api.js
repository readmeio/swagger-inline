/*
 * @api [get] /pets
 *    description: "Returns all pets from the system that the user has access to"
 *    operationId: "findPets"
 *    produces:
 *      - "application/json"
 *      - "application/xml"
 *      - "text/xml"
 *      - "text/html"
 *    parameters:
 *      -
 *        name: "tags"
 *        in: "query"
 *        description: "tags to filter by"
 *        required: false
 *        type: "array"
 *        items:
 *          type: "string"
 *        collectionFormat: "csv"
 *      -
 *        name: "limit"
 *        in: "query"
 *        description: "maximum number of results to return"
 *        required: false
 *        type: "integer"
 *        format: "int32"
 *    responses:
 *      "200":
 *        description: "pet response"
 *        schema:
 *          type: "array"
 *          items:
 *            $ref: "#/definitions/Pet"
 *      default:
 *        description: "unexpected error"
 *        schema:
 *          $ref: "#/definitions/ErrorModel"
 */

router.get('/pets', () => {

});

/*
 * @api [post] /pets
 *    description: "Creates a new pet in the store.  Duplicates are allowed"
 *    operationId: "addPet"
 *    produces:
 *      - "application/json"
 *    parameters:
 *      -
 *        name: "pet"
 *        in: "body"
 *        description: "Pet to add to the store"
 *        required: true
 *        schema:
 *          $ref: "#/definitions/NewPet"
 *    responses:
 *      "200":
 *        description: "pet response"
 *        schema:
 *          $ref: "#/definitions/Pet"
 *      default:
 *        description: "unexpected error"
 *        schema:
 *          $ref: "#/definitions/ErrorModel"
 */

router.post('/pets', () => {

});

/*
 * @api [get] /pets/{id}
 *    description: "Returns a user based on a single ID, if the user does not have access to the pet"
 *    operationId: "findPetById"
 *    produces:
 *      - "application/json"
 *      - "application/xml"
 *      - "text/xml"
 *      - "text/html"
 *    parameters:
 *      -
 *        name: "id"
 *        in: "path"
 *        description: "ID of pet to fetch"
 *        required: true
 *        type: "integer"
 *        format: "int64"
 *    responses:
 *      "200":
 *        description: "pet response"
 *        schema:
 *          $ref: "#/definitions/Pet"
 *      default:
 *        description: "unexpected error"
 *        schema:
 *          $ref: "#/definitions/ErrorModel"
 */

router.get('/pets/{id}', () => {

});

/*
 * @api [delete] /pets/{id}
 *    description: "deletes a single pet based on the ID supplied"
 *    operationId: "deletePet"
 *    parameters:
 *      -
 *        name: "id"
 *        in: "path"
 *        description: "ID of pet to delete"
 *        required: true
 *        type: "integer"
 *        format: "int64"
 *    responses:
 *      "204":
 *        description: "pet deleted"
 *      default:
 *        description: "unexpected error"
 *        schema:
 *          $ref: "#/definitions/ErrorModel"
 */

 router.delete('/pets/{id}', () => {

 });
