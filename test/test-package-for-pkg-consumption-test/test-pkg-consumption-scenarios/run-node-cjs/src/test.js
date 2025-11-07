const { doSomething } = require('@patricktree/test-package-for-pkg-consumption-test');

const result = doSomething();
if (!result === 'some-result') {
  throw new Error(`got wrong result`);
}
