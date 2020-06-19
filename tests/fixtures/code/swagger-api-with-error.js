
/**
 * @api [post] /pets
 * requestBody:
 *  required: true
 *  content:
 *      application/json:
 *          schema:
 *              type: object
 *              required:
 *                  - name
 *              properties:
 *                  name:
 *                      type: string
 *                      properties there should be an error
 */
router.post('/pets', () => {

});
