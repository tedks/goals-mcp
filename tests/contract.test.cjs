const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { AGENT_GUIDE } = require('../dist/mcp/server.js');
const manifest = require('../package.json');
const lock = require('../npm-shrinkwrap.json');
const read = (path) => readFileSync(resolve(__dirname, '..', path), 'utf8').replaceAll('\r\n', '\n');

test('public instructions, install URLs and dependency lock match this release', () => {
  assert.equal(read('docs/AGENTS.md'), '# Collaborating with a person through Goals\n\n' + AGENT_GUIDE.replaceAll('\r\n', '\n').replaceAll('\n', '\n\n') + '\n');
  assert.equal(read('CHANGELOG.md').match(/^## ([^\n]+)/m)?.[1], manifest.version);
  assert.equal(JSON.parse(read('SOURCE.json')).version, manifest.version);
  assert.equal(lock.name, manifest.name);
  assert.equal(lock.packages[''].name, manifest.name);
  assert.equal(lock.version, manifest.version);
  assert.equal(lock.packages[''].version, manifest.version);
  assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies);
  const expected = `https://github.com/tedks/goals-mcp/releases/download/v${manifest.version}/tedks-goals-mcp-${manifest.version}.tgz`;
  for (const path of ['README.md', 'docs/agent-setup.md']) {
    const urls = read(path).match(/https:\/\/github\.com\/tedks\/goals-mcp\/releases\/download\/v[^/\s"]+\/tedks-goals-mcp-[^\s"]+\.tgz/g) || [];
    assert.ok(urls.length, `No install URL in ${path}`);
    assert.ok(urls.every((url) => url === expected), `Stale install URL in ${path}`);
  }
});
