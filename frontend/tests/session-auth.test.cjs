const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, context) {
  context.exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, context);
  return context.exports;
}

function client(cookie = '', token = null) {
  const calls = [];
  let options, request;
  const axios = {
    create(value) {
      options = value;
      return { interceptors: { request: { use(fn) { request = fn; } }, response: { use() {} } } };
    },
    async get(...args) { calls.push(args); },
  };
  load('../services/api.ts', {
    require(name) { return name === 'axios' ? { default: axios } : { clearLocalAuth() {} }; },
    localStorage: { getItem() { return token; } }, document: { cookie },
  });
  return { calls, options, request };
}

test('session API uses same-origin cookies and Axios CSRF headers without a local token', async () => {
  const api = client('XSRF-TOKEN=encrypted-token');
  assert.equal(api.options.baseURL, '');
  assert.equal(api.options.withCredentials, true);
  assert.equal(api.options.withXSRFToken, undefined);
  const request = await api.request({ method: 'post', headers: {} });
  assert.equal(request.headers.Authorization, undefined);
  assert.equal(api.calls.length, 0);
});

test('session mutations bootstrap the CSRF cookie when absent', async () => {
  for (const method of ['post', 'put', 'patch', 'delete']) {
    const api = client();
    await api.request({ method, headers: {} });
    assert.equal(api.calls.length, 1);
    assert.equal(api.calls[0][0], '/sanctum/csrf-cookie');
    assert.equal(api.calls[0][1].withCredentials, true);
  }
});

test('read requests do not bootstrap CSRF and password-login bearer tokens remain supported', async () => {
  const api = client('', 'existing-personal-token');
  const request = await api.request({ method: 'get', headers: {} });
  assert.equal(request.headers.Authorization, 'Bearer existing-personal-token');
  assert.equal(api.calls.length, 0);
});

test('browser storage is optional for session-based API authentication', async () => {
  let request;
  load('../services/api.ts', {
    require(name) {
      return name === 'axios' ? { default: { create: () => ({ interceptors: {
        request: { use(fn) { request = fn; } }, response: { use() {} },
      } }) } } : { clearLocalAuth() {} };
    },
    localStorage: { getItem() { throw new Error('storage blocked'); } }, document: { cookie: 'XSRF-TOKEN=token' },
  });
  const config = await request({ method: 'get', headers: {} });
  assert.equal(config.headers.Authorization, undefined);
});

function gate({ status = 200, token, cookie = 'doxa_hrms_session=encrypted', failure = false } = {}) {
  const calls = [];
  const { middleware } = load('../middleware.ts', {
    require() { return { NextResponse: { next: () => 'next', redirect: (url) => url.pathname } }; },
    process: { env: { HRM_BACKEND_URL: 'http://private-backend:8000' } },
    Headers, URL, AbortSignal,
    async fetch(url, options) {
      calls.push({ url, options });
      if (failure) throw new Error('backend unavailable');
      return { ok: status >= 200 && status < 300 };
    },
  });
  return {
    calls,
    run(path = '/dashboard') {
      return middleware({
        url: `https://hrm.example.test${path}`,
        nextUrl: { pathname: path, origin: 'https://hrm.example.test' },
        cookies: { get: () => token ? { value: token } : undefined },
        headers: { get: () => cookie },
      });
    },
  };
}

test('dashboard accepts a server-verified Laravel session without a JS authentication token', async () => {
  const auth = gate();
  assert.equal(await auth.run(), 'next');
  assert.equal(auth.calls[0].url, 'http://private-backend:8000/api/auth/me');
  const options = auth.calls[0].options;
  assert.equal(options.headers.get('Cookie'), 'doxa_hrms_session=encrypted');
  assert.equal(options.headers.get('Origin'), 'https://hrm.example.test');
  assert.equal(options.headers.get('Authorization'), null);
  assert.equal(options.cache, 'no-store');
  assert.equal(options.redirect, 'error');
});

test('unverified cookies and bearer tokens do not grant dashboard access', async () => {
  const auth = gate({ status: 401, token: 'forged' });
  assert.equal(await auth.run(), '/login');
  assert.equal(auth.calls[0].options.headers.get('Authorization'), 'Bearer forged');
});

test('existing password bearer authentication still reaches the dashboard', async () => {
  const auth = gate({ token: 'existing-personal-token', cookie: 'auth_token=existing-personal-token' });
  assert.equal(await auth.run(), 'next');
  assert.equal(auth.calls[0].options.headers.get('Authorization'), 'Bearer existing-personal-token');
});

test('backend failure denies dashboard access', async () => {
  assert.equal(await gate({ failure: true }).run(), '/login');
});

test('login redirects verified users but public pages need no authentication check', async () => {
  const auth = gate();
  assert.equal(await auth.run('/login'), '/dashboard');
  assert.equal(await auth.run('/careers'), 'next');
  assert.equal(auth.calls.length, 1);
  assert.equal(await gate({ status: 401 }).run('/login'), 'next');
});
