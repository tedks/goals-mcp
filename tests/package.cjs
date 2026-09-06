/** Pack and exercise a clean consumer installation, without development deps. */
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { dirname, join, resolve } = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');

const directory = mkdtempSync(join(tmpdir(), 'goals-mcp-install-'));
// Windows cannot exec a .cmd file without a shell. Run npm's JS entry instead
// so paths with spaces or shell metacharacters remain ordinary arguments.
const npm = process.platform === 'win32' ? process.execPath : 'npm';
const npmArgs = process.platform === 'win32'
  ? [join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')] : [];
const runNpm = (args, options = {}) => execFileSync(npm, [...npmArgs, ...args], {
  encoding: 'utf8', timeout: 180000, ...options,
});
try {
  const [pack] = JSON.parse(runNpm(['pack', '--ignore-scripts', '--json', '--pack-destination', directory]));
  assert.ok(pack.files.some((file) => file.path === 'dist/mcp/stdio.js'));
  assert.ok(pack.files.some((file) => file.path === 'LICENSE'));
  assert.ok(pack.files.every((file) => /^(dist\/|src\/|docs\/|package.json$|README.md$|LICENSE$|CHANGELOG.md$|GOALS_DATA_SCHEMA.json$|SOURCE.json$|AGENTS.md$)/.test(file.path)), 'Unexpected package content');
  runNpm(['install', '--prefix', directory, '--ignore-scripts', '--omit=dev', '--no-audit', '--no-fund', join(directory, pack.filename)]);
  const installed = join(directory, 'node_modules/@tedks/goals-mcp');
  const manifest = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'));
  assert.deepEqual(Object.keys(manifest.dependencies).sort(), ['@modelcontextprotocol/sdk', 'zod']);
  const entry = join(installed, manifest.bin['goals-mcp']);
  assert.match(readFileSync(entry, 'utf8'), /^#!\/usr\/bin\/env node\n/);
  execFileSync(process.execPath, ['--test', resolve(__dirname, 'protocol.test.cjs')], {
    timeout: 60000, stdio: 'inherit', env: { ...process.env, GOALS_MCP_TEST_ENTRY: entry },
  });
  console.log('Packed MCP clean-install verification passed.');
} finally { rmSync(directory, { recursive: true, force: true }); }
