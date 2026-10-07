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

test('Vercel without private Firebase credentials explains the server setup requirement', async () => {
  const previousVercel = process.env.VERCEL;
  const previousCredential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  process.env.VERCEL = '1';
  delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/users/test/password`, {
      method: 'POST', headers: { Authorization: 'Bearer invalid-token' }
    });
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /credenciales privadas de Firebase/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (previousVercel === undefined) delete process.env.VERCEL; else process.env.VERCEL = previousVercel;
    if (previousCredential === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON; else process.env.FIREBASE_SERVICE_ACCOUNT_JSON = previousCredential;
  }
});
