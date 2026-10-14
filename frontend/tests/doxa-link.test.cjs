const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function mount(file, props, api) {
  const states = [], effects = [], destinations = [];
  let cursor = 0, tree, component;
  const react = {
    createElement(type, props, ...children) { return { type, props: props || {}, children: children.flat(Infinity) }; },
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], v => { states[i] = v; }]; },
    useEffect(fn) { const i = cursor++; if (!(i in states)) { states[i] = true; effects.push(fn); } },
  };
  const context = { exports: {}, URLSearchParams, React: react,
    window: { location: { assign: value => destinations.push(value) } },
    require(name) { if (name === 'react') return react; if (name === '@/services/api') return { __esModule: true, default: api }; return { __esModule: true, default: 'a' }; },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText.replace(/React\.createElement/g, 'require("react").createElement'), context);
  component = context.exports.default;
  function render() { cursor = 0; tree = component(props); return tree; }
  function visit(node) { return node && typeof node === 'object' ? [node, ...node.children.flatMap(visit)] : []; }
  function nodes() { return visit(tree); }
  function text(node = tree) { return node && typeof node === 'object' ? node.children.map(text).join(' ') : String(node ?? ''); }
  render();
  return { render, nodes, text, destinations, async settle() { effects.splice(0).forEach(fn => fn()); await new Promise(resolve => setImmediate(resolve)); render(); } };
}
const detail = 'components/DoxaIdentity.tsx';
const confirmation = 'app/(dashboard)/employees/doxa-link/[id]/page.tsx';

test('link button is restricted to active HR admins and shows pending state', async () => {
  for (const role of ['applicant', 'management', 'hr_admin']) {
    let resolve;
    const app = mount(detail, { employeeId: 12 }, { get: async () => ({ data: { role, is_active: true } }), post: () => new Promise(r => { resolve = r; }) });
    await app.settle();
    const button = app.nodes().find(n => n.type === 'button');
    assert.equal(Boolean(button), role === 'hr_admin');
    if (button) {
      const pending = button.props.onClick(); app.render();
      assert.match(app.text(), /Opening Doxa/);
      assert.equal(app.nodes().find(n => n.type === 'button').props.disabled, true);
      resolve({ data: { authorization_url: 'https://iam.test/authorize?prompt=login' } }); await pending;
      assert.equal(app.destinations[0], 'https://iam.test/authorize?prompt=login');
    }
  }
});

test('linked detail displays exact identity and offers no relinking', async () => {
  const app = mount(detail, { employeeId: 12, identities: [{ issuer: 'https://iam.test', subject: 'ExactSubject' }] }, { get: async () => ({ data: { role: 'hr_admin', is_active: true } }) });
  await app.settle();
  assert.match(app.text(), /Linked.*https:\/\/iam.test.*ExactSubject/);
  assert.equal(app.nodes().filter(n => n.type === 'button').length, 0);
});

test('confirmation shows verified profile, submits no identity or target, and supports cancel', async () => {
  for (const action of ['confirm', 'cancel']) {
    const calls = [];
    const app = mount(confirmation, { params: { id: 'opaque' } }, {
      get: async () => ({ data: { employee_name: 'Local Employee', access_token: 'PRIVATE-ACCESS', identity: { name: 'Doxa Person', email: 'person@test', issuer: 'https://iam.test', subject: 'ExactSubject', id_token: 'PRIVATE-ID' } } }),
      post: async (...args) => { calls.push(args); return { data: { destination: '/employees/12' } }; },
    });
    await app.settle();
    assert.match(app.text(), /Local Employee.*Doxa Person.*https:\/\/iam.test.*ExactSubject/);
    const buttons = app.nodes().filter(n => n.type === 'button');
    const pending = buttons[action === 'confirm' ? 0 : 1].props.onClick();
    app.render();
    assert.equal(app.nodes().filter(n => n.type === 'button').every(n => n.props.disabled), true);
    await pending;
    assert.equal(calls[0][0], `/auth/doxa/link/opaque/${action}`);
    assert.equal(JSON.stringify(calls[0][1]), '{}');
    assert.equal(app.destinations[0], '/employees/12');
    assert.doesNotMatch(app.text(), /access_token|refresh_token|id_token|code_verifier|PRIVATE-/);
  }
});

test('conflict prevents further confirmation and provides recovery', async () => {
  const app = mount(confirmation, { params: { id: 'opaque' } }, {
    get: async () => ({ data: { employee_name: 'Local', identity: { issuer: 'issuer', subject: 'subject' } } }),
    post: async () => { throw new Error('conflict'); },
  });
  await app.settle();
  await app.nodes().find(n => n.type === 'button').props.onClick(); app.render();
  assert.match(app.text(), /already be linked/);
  assert.equal(app.nodes().filter(n => n.type === 'button').length, 0);
  assert.equal(app.destinations.length, 0);
});

test('callback rejection displays recovery without requesting a confirmation', async () => {
  const app = mount(confirmation, { params: { id: 'error' } }, { get() { throw new Error('must not fetch'); } });
  await app.settle();
  assert.match(app.text(), /Doxa linking was rejected/);
  assert.equal(app.nodes().filter(n => n.type === 'button').length, 0);
});

test('initiation failure is visible and releases the pending button', async () => {
  const app = mount(detail, { employeeId: 12 }, {
    get: async () => ({ data: { role: 'hr_admin', is_active: true } }),
    post: async () => { throw new Error('PRIVATE-CODE'); },
  });
  await app.settle();
  await app.nodes().find(n => n.type === 'button').props.onClick(); app.render();
  assert.match(app.text(), /Unable to start linking/);
  assert.doesNotMatch(app.text(), /PRIVATE-CODE/);
  assert.equal(app.nodes().find(n => n.type === 'button').props.disabled, false);
});
