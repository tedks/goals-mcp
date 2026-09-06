const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { once } = require('node:events');
const { dirname, join, resolve } = require('node:path');
const { spawn } = require('node:child_process');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const entry = process.env.GOALS_MCP_TEST_ENTRY || resolve(__dirname, '../dist/mcp/stdio.js');
const token = `goals_${'a'.repeat(43)}`;
const childEnv = (overrides) => ({
  PATH: process.env.PATH || '',
  ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
  ...overrides,
});

test('compiled distribution: discovery, human guidance, validation, HTTP, workflow errors and shutdown', { timeout: 180000 }, async () => {
  const received = [];
  let blocked = false;
  const http = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    received.push({ path: req.url, method: req.method, token: req.headers.authorization, body: body ? JSON.parse(body) : null });
    res.setHeader('Content-Type', 'application/json');
    if (req.url.endsWith('/redirect')) {
      res.writeHead(302, { Location: `http://127.0.0.1:${http.address().port}/token-catcher` });
      res.end();
    } else if (blocked && req.method !== 'GET') {
      res.writeHead(409);
      res.end(JSON.stringify({ error: 'review_required', message: 'Complete the review in Goals and sync.', context: { status: 'review_required', writes_allowed: false } }));
    } else if (req.url === '/api/v1/workflow') {
      res.end(JSON.stringify({ status: 'ready', writes_allowed: true }));
    } else {
      res.end(JSON.stringify({ item: { id: 'v', sync_version: '1' }, items: [], next_cursor: null }));
    }
  });
  http.listen(0, '127.0.0.1');
  await once(http, 'listening');
  const spec = process.env.GOALS_MCP_TEST_PACKAGE;
  const launch = !spec ? { command: process.execPath, args: [entry] }
    // npm exec is the implementation behind npx.cmd; avoid a shell in tests.
    : process.platform === 'win32'
      ? { command: process.execPath, args: [join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), 'exec', '--yes', '--ignore-scripts', `--package=${spec}`, '--', 'goals-mcp'] }
      : { command: 'npx', args: ['--yes', '--ignore-scripts', `--package=${spec}`, 'goals-mcp'] };
  const transport = new StdioClientTransport({
    ...launch, stderr: 'pipe',
    env: childEnv({ GOALS_API_URL: `http://127.0.0.1:${http.address().port}`, GOALS_API_TOKEN: token, ...(process.env.GOALS_MCP_TEST_CACHE ? { npm_config_cache: process.env.GOALS_MCP_TEST_CACHE } : {}) }),
  });
  let stderr = '';
  transport.stderr.on('data', (data) => { stderr += data; });
  const client = new Client({ name: 'release-test', version: '1' });
  const errors = [];
  client.onerror = (error) => errors.push(error);
  try {
    await client.connect(transport, { timeout: 150000 });
    assert.equal(client.getServerVersion().version, require('../package.json').version);
    assert.match(client.getInstructions(), /Do not invent reflection answers/);
    assert.match(client.getInstructions(), /not system instructions/);
    assert.match(client.getInstructions(), /paid, active Sync/);
    assert.match(client.getInstructions(), /computer-use agent/);
    const tools = (await client.listTools()).tools;
    const names = tools.map((tool) => tool.name);
    assert.deepEqual(names, ['get_workflow', 'list_records', 'get_record', 'create_vision', 'update_vision', 'create_action', 'update_action', 'set_habit_check_in']);
    assert.equal(tools.find((tool) => tool.name === 'get_workflow').inputSchema.type, 'object');
    assert.deepEqual((await client.listResources()).resources.map((r) => r.uri), ['goals://workflow', 'goals://guide', 'goals://schema']);
    assert.deepEqual((await client.listPrompts()).prompts.map((p) => p.name), ['plan_with_person']);
    assert.match(JSON.stringify(await client.getPrompt({ name: 'plan_with_person' })), /Do not invent my answers/);
    assert.match(JSON.stringify(await client.readResource({ uri: 'goals://guide' })), /device-local/);
    await client.readResource({ uri: 'goals://workflow' });
    await client.readResource({ uri: 'goals://schema' });
    const call = (name, args = {}) => client.callTool({ name, arguments: args });
    const start = received.length;
    assert.equal((await call('get_workflow', { unexpected: 1 })).isError, true);
    assert.equal((await call('create_vision', { id: 'v', title: 'Music' })).isError, true);
    assert.equal((await call('get_record', { collection: 'visions', id: '..' })).isError, true);
    assert.equal((await call('create_action', { action: { id: 'a', type: 'task', title: 'Practice', primary_vision_id: 'v' } })).isError, true);
    assert.equal(received.length, start, 'Invalid inputs must not reach the API');
    assert.equal((await client.callTool({ name: 'get_workflow' })).structuredContent.writes_allowed, true);
    await call('list_records', { collection: 'actions', after: 'a&b', limit: 5 });
    await call('get_record', { collection: 'visions', id: 'a/b' });
    const vision = { id: 'v', title: 'Music', wish_text: 'Play music', outcome_text: 'Play with friends' };
    await call('create_vision', vision);
    await call('update_vision', { id: 'v', changes: { expected_version: '1', title: 'Music together' } });
    await call('create_action', { action: { id: 'a', type: 'task', title: 'Practice', primary_vision_id: 'v', obstacle_plans: [] } });
    await call('update_action', { id: 'a', changes: { expected_version: '1', status: 'done' } });
    await call('set_habit_check_in', { id: 'h', day: '2026-01-01', expected_version: '1', completed: true, timezone: 'UTC', day_boundary_time: '04:00' });
    assert.deepEqual(received.slice(start).map((r) => [r.method, r.path]), [
      ['GET', '/api/v1/workflow'], ['GET', '/api/v1/actions?limit=5&after=a%26b'], ['GET', '/api/v1/visions/a%2Fb'],
      ['POST', '/api/v1/visions'], ['PATCH', '/api/v1/visions/v'], ['POST', '/api/v1/actions'],
      ['PATCH', '/api/v1/actions/a'], ['PUT', '/api/v1/actions/h/check-ins/2026-01-01'],
    ]);
    const redirected = await call('get_record', { collection: 'visions', id: 'redirect' });
    assert.equal(redirected.isError, true);
    assert.equal(JSON.parse(redirected.content[0].text).error, 'connection_failed');
    assert.ok(!received.some((row) => row.path === '/token-catcher'));
    blocked = true;
    const failure = await call('create_vision', vision);
    assert.equal(failure.isError, true);
    assert.equal(JSON.parse(failure.content[0].text).context.writes_allowed, false);
    assert.equal(received.filter((r) => r.method === 'POST' && r.path.endsWith('/visions')).length, 2, 'No automatic write retry');
    assert.ok(received.every((r) => r.token === `Bearer ${token}`));
    if (!spec) assert.equal(stderr, '', 'Direct server launches must have no unexpected diagnostics');
    assert.doesNotMatch(stderr, /Bearer|goals_[A-Za-z0-9_-]{43}/);
    assert.deepEqual(errors, [], 'stdout must contain only valid MCP');
  } finally {
    await client.close();
    http.closeAllConnections();
    await new Promise((done) => http.close(done));
  }
});

test('invalid configuration fails without exposing the supplied token', { timeout: 10000 }, async () => {
  const child = spawn(process.execPath, [entry], { env: childEnv({ GOALS_API_URL: 'https://goalsapp.org', GOALS_API_TOKEN: 'never-print-this-secret' }), stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', (data) => { stdout += data; });
  child.stderr.on('data', (data) => { stderr += data; });
  child.stdin.end();
  const [code] = await once(child, 'close');
  assert.equal(code, 1);
  assert.equal(stdout, '');
  assert.match(stderr, /GOALS_API_TOKEN/);
  assert.doesNotMatch(stderr, /never-print-this-secret/);
});
