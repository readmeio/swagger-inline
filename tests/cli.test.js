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

describe('Cli', () => {
  it('is a function', () => {
    expect(typeof cli).toBe('function');
  });

  it('should exit process with non-zero code', () => {
    const workDir = path.resolve(__dirname, '../');
    const cmd = `node src/index tests/fixtures/code/swagger-api-with-error.js --base tests/fixtures/project/swaggerBase.json`;
    return runCommand(cmd, workDir).then(result => {
      expect(result.code).not.toBe(0);
    });
  });

  it('should exit process with zero code', () => {
    const workDir = path.resolve(__dirname, '../');
    const cmd = `node src/index tests/fixtures/code/swagger-api.js --base tests/fixtures/project/swaggerBase.json`;
    return runCommand(cmd, workDir).then(result => {
      expect(result.code).toBe(0);
    });
  });
});
