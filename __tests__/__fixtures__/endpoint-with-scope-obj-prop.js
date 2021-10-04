// This demonstrates the issue discovered in https://github.com/readmeio/swagger-inline/issues/215.

/**
 * @api [put] /path/scope
 *  requestBody:
 *    required: true
 *    content:
 *      application/json:
 *        schema:
 *          type: object
 *          required:
 *            - par3
 *          additionalProperties: false
 *          properties:
 *            par3:
 *              type: array
 *              items:
 *                type: object
 *                required:
 *                  - prop1
 *                  - prop2
 *                  - prop3
 *                additionalProperties: false
 *                properties:
 *                  prop1:
 *                    type: string
 *                  prop2:
 *                    type: string
 *                  prop3:
 *                    type: string
 *                  scope:
 *                    type: array
 *                    items:
 *                      type: string
 */
 router.put('/path/scope', () => {

});

/**
 * @api [post] /path/scope
 *  requestBody:
 *    required: true
 *    content:
 *      application/json:
 *        schema:
 *          type: array
 *          items:
 *            type: object
 *            required:
 *              - prop1
 *              - prop2
 *              - prop3
 *            additionalProperties: false
 *            properties:
 *              prop1:
 *                type: string
 *              prop2:
 *                type: string
 *              prop3:
 *                type: string
 *              scope:
 *                type: array
 *                items:
 *                  type: string
 */
router.post('/path/scope', () => {

});

/**
 * @api [patch] /path/scope
 *  scope: patchScope
 *  requestBody:
 *    required: true
 *    content:
 *      application/json:
 *        schema:
 *          type: array
 *          items:
 *            type: object
 *            required:
 *              - prop1
 *              - prop2
 *              - prop3
 *            additionalProperties: false
 *            properties:
 *              prop1:
 *                type: string
 *              prop2:
 *                type: string
 *              prop3:
 *                type: string
 *              scope:
 *                type: array
 *                items:
 *                  type: string
 */
router.patch('/path/scope', () => {

});
