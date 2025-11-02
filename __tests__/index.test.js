import { describe, it, expect, expectTypeOf } from 'vitest';

import swaggerInline from '../src';

describe('Swagger Inline', () => {
  it('requires inputs', () => {
    expect(() => {
      return swaggerInline();
    }).toThrow('No files specified.');
  });

  // eslint-disable-next-line @vitest/expect-expect
  it('returns a promise', () => {
    const returned = swaggerInline('*.js', { base: `${__dirname}/__fixtures__/project` });

    expectTypeOf(returned.then).toBeFunction();
    expectTypeOf(returned.catch).toBeFunction();
  });

  it('throws an error if no base was supplied', () => {
    expect(() => {
      return swaggerInline('*.js');
    }).toThrow('No base specification provided!');
  });

  // eslint-disable-next-line @vitest/expect-expect
  it('resolves to a string', () => {
    return swaggerInline(`${__dirname}/__fixtures__/project/*.js`, { base: `${__dirname}/__fixtures__/project` }).then(
      res => {
        expectTypeOf(res).toBeString();
      },
    );
  });

  describe.each([
    ['OpenAPI', `${__dirname}/__fixtures__/project-openapi`, 'openapiBase'],
    ['Swagger', `${__dirname}/__fixtures__/project`, 'swaggerBase'],
  ])('%s', (c, projectDir, base) => {
    it('supports JSON', () => {
      return swaggerInline(`${projectDir}/*`, { base: `${projectDir}/${base}.json` }).then(json => {
        expect(JSON.parse(json)).toMatchSnapshot();
      });
    });

    it('supports YAML', () => {
      return swaggerInline(`${projectDir}/*`, { base: `${projectDir}/${base}.yaml` }).then(yaml => {
        expect(yaml).toMatchSnapshot();

        expect(() => {
          return JSON.parse(yaml);
        }).toThrow(/Unexpected token/);
      });
    });
  });
});
