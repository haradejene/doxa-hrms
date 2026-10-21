const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, requireModule) {
  const context = { exports: {}, require: requireModule };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText.replace(/React\.createElement/g, 'require("react").createElement');
  vm.runInNewContext(code, context);
  return context.exports;
}

for (const [file, name] of [['components/layout/header.tsx', 'Header'], ['components/layout/sidebar.tsx', 'Sidebar']]) {
  test(`${name} displays the verified local account, with no default admin identity`, () => {
    const component = load(file, module => {
      if (module === 'react') return React;
      if (module === 'next/navigation') return { usePathname: () => '/dashboard', useRouter: () => ({}) };
      if (module === 'lucide-react') return new Proxy({}, { get: () => () => null });
      if (module === 'next/link') return { __esModule: true, default: 'a' };
      if (module === 'next/image') return { __esModule: true, default: ({ priority, ...props }) => React.createElement('img', props) };
      return {};
    })[name];
    for (const user of [null, { id: 53, name: 'Verification Applicant', email: 'applicant@example.test', role: 'applicant' }, { id: 1, name: 'Local Administrator', email: 'local-admin@example.test', role: 'hr_admin' }]) {
      const html = renderToStaticMarkup(React.createElement(component, { user, pathname: '/dashboard', onMenuClick() {} }));
      assert.doesNotMatch(html, /HR Admin|admin@doxa\.com/);
      assert.ok(html.includes(user?.name || 'Account'));
      if (user) assert.ok(html.includes(user.email));
    }
  });
}

test('current account comes from auth/me and a failed lookup never falls back to an admin', async () => {
  for (const failure of [false, true]) {
    let value, effect, request;
    const expected = { id: 53, name: 'Verification Applicant', email: 'applicant@example.test', role: 'applicant' };
    const { useCurrentUser } = load('services/current-user.ts', module => {
      if (module === 'react') return { useState: initial => { value = initial; return [initial, next => { value = next; }]; }, useEffect: fn => { effect = fn; } };
      return { __esModule: true, default: { get: async path => { request = path; if (failure) throw new Error('unavailable'); return { data: expected }; } } };
    });
    assert.equal(useCurrentUser(), null);
    const cleanup = effect();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(request, '/api/auth/me');
    assert.equal(value, failure ? null : expected);
    cleanup();
  }
});
