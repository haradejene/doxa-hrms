const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadCleanup(localStorage) {
  const cookies = [];
  const context = {
    exports: {},
    localStorage,
    document: {
      set cookie(value) {
        cookies.push(value);
      },
    },
  };
  const source = fs.readFileSync(
    require.resolve("../services/auth-storage.ts"),
    "utf8",
  );
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    context,
  );
  return { cleanup: context.exports.clearLocalAuth, cookies };
}

test("logout/401 cleanup removes credentials and profile but preserves preferences", () => {
  const storage = new Map([
    ["auth_token", "secret"],
    ["user", "profile"],
    ["pref_tz", "UTC"],
  ]);
  const { cleanup, cookies } = loadCleanup({
    removeItem: (key) => storage.delete(key),
  });
  cleanup();
  cleanup();
  assert.deepEqual([...storage], [["pref_tz", "UTC"]]);
  assert.deepEqual(cookies.slice(0, 2), [
    "auth_token=; path=/; max-age=0",
    "user=; path=/; max-age=0",
  ]);
});

test("cookies are expired even when browser storage is unavailable", () => {
  const { cleanup, cookies } = loadCleanup({
    removeItem() {
      throw new Error("Storage blocked");
    },
  });
  assert.throws(cleanup, /Storage blocked/);
  assert.equal(cookies.length, 2);
});
