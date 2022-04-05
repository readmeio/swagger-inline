const cli = require('../src/cli');
const path = require('path');
const exec = require('child_process').exec;

function runCommand(cmd, cwd) {
  return new Promise(resolve => {
    exec(cmd, { cwd }, (error, stdout, stderr) => {
      resolve({
        code: error && error.code ? error.code : 0,
        error,
        stdout,
        stderr,
      });
    });
  });
}

describe('CLI', () => {
  it('is a function', () => {
    expect(typeof cli).toBe('function');
  });

  it('should exit process with non-zero code on a failure', () => {
    const workDir = path.resolve(__dirname, '../');
    const cmd = `node bin/swagger-inline __tests__/__fixtures__/code/swagger-api-with-error.js --base __tests__/__fixtures__/project/swaggerBase.json`;
    return runCommand(cmd, workDir).then(result => {
      expect(result.code).not.toBe(0);
      expect(result.error.message).toMatch(
        'Error: YAMLException: can not read an implicit mapping pair; a colon is missed (12:57)'
      );
    });
  });

  it('should exit process with zero code', () => {
    const workDir = path.resolve(__dirname, '../');
    const cmd = `node bin/swagger-inline __tests__/__fixtures__/code/swagger-api.js --base __tests__/__fixtures__/project/swaggerBase.json`;
    return runCommand(cmd, workDir).then(result => {
      expect(result.code).toBe(0);

      const stdout = JSON.parse(result.stdout);
      expect(stdout.swagger).toBe('2.0');
      expect(Object.keys(stdout.paths)).toHaveLength(2);
    });
  });

  it("shouldn't throw errors on directories that have markdown", () => {
    const workDir = path.resolve(__dirname, '../');
    const cmd = `node bin/swagger-inline __tests__/__fixtures__/project-openapi --base __tests__/__fixtures__/project-openapi/openapiBase.json`;
    return runCommand(cmd, workDir).then(result => {
      expect(result.code).toBe(0);

      const stdout = JSON.parse(result.stdout);
      expect(stdout.openapi).toBe('3.0.3');
      expect(Object.keys(stdout.paths)).toHaveLength(2);
    });
  });

  it("should update the tile and version when specified via the CLI", () => {
    const workDir = path.resolve(__dirname, '../');
    const cmd = `node bin/swagger-inline __tests__/__fixtures__/project-openapi --base __tests__/__fixtures__/project-openapi/openapiBase.json --title testTitle --apiVersion 2.0`;
    return runCommand(cmd, workDir).then(result => {
      expect(result.code).toBe(0);

      const stdout = JSON.parse(result.stdout);
      expect(stdout.info.title).toBe('testTitle');
      expect(stdout.info.version).toBe('2.0');
    });
  });
});
