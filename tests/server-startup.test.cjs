const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const handler = require('../api/index.js');

test('production API starts with require(ESM) disabled and protects private routes', async () => {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).app, 'Fina Pyme');
    for (const path of ['/api/admin/users/test/password', '/api/ai/chat']) {
      const response = await fetch(base + path, { method: 'POST' });
      assert.equal(response.status, 401);
    }
    const missing = await fetch(`${base}/api/not-a-route`);
    assert.equal(missing.status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
