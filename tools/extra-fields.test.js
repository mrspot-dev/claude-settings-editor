// tools/extra-fields.test.js — the generic field list of v1.8 and its pure helpers (spec docs/specs/2026-09-23-v18-managed-tab-design.md)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
require('./editor-harness.js');

const F = (key) => extraFields().find(f => f.key === key);

test('the list holds the 45 keys of the spec, each once, each known to SCHEMA_MAP', () => {
  const keys = extraFields().map(f => f.key);
  assert.equal(keys.length, 45);
  assert.equal(new Set(keys).size, 45);
  assert.deepEqual(keys.filter(k => !SCHEMA_MAP.keys[k]), []);
  assert.equal(extraFields().filter(f => f.tab === 'managed').length, 31);
  assert.deepEqual(extraFields().filter(f => f.tab === 'managed').map(f => SCHEMA_MAP.keys[f.key].scope).filter(s => s !== 'managed'), []);
});

test('controls fit the reference types', () => {
  for (const f of extraFields()) {
    const i = SCHEMA_MAP.keys[f.key];
    if (f.control === 'toggle') assert.equal(i.type, 'boolean', f.key);
    if (f.control === 'select') assert.ok((f.options || i.enum).length > 0, f.key);
    if (f.control === 'number') assert.ok(['number', 'integer'].includes(i.type), f.key);
    if (f.control === 'text' || f.control === 'textarea') assert.equal(i.type, 'string', f.key);
  }
});

test('on: true exactly where the reference default of a boolean is true', () => {
  for (const f of extraFields().filter(x => x.control === 'toggle')) {
    assert.equal(!!f.on, /^`?true\b/.test(String(SCHEMA_MAP.keys[f.key].default)), f.key);
  }
});

test('extraTopKeys leaves out nested keys', () => {
  const top = extraTopKeys();
  assert.equal(top.length, 41);
  assert.ok(top.includes('claudeMd') && !top.some(k => k.includes('.')));
});

test('getPath, setPath and deletePath; deletePath prunes parents it empties and keeps siblings', () => {
  const o = { sandbox: { enabled: true, network: { allowManagedDomainsOnly: true } } };
  assert.equal(getPath(o, 'sandbox.network.allowManagedDomainsOnly'), true);
  assert.equal(getPath(o, 'sandbox.filesystem.x'), undefined);
  assert.equal(getPath({ a: ['x'] }, 'a.0'), undefined);
  setPath(o, 'sandbox.filesystem.allowManagedReadPathsOnly', true);
  assert.deepEqual(o.sandbox.filesystem, { allowManagedReadPathsOnly: true });
  deletePath(o, 'sandbox.network.allowManagedDomainsOnly');
  assert.deepEqual(o, { sandbox: { enabled: true, filesystem: { allowManagedReadPathsOnly: true } } });
  deletePath(o, 'sandbox.filesystem.allowManagedReadPathsOnly');
  assert.deepEqual(o, { sandbox: { enabled: true } });
  const only = { sandbox: { bwrapPath: '/usr/bin/bwrap' } };
  deletePath(only, 'sandbox.bwrapPath');
  assert.deepEqual(only, {});
  deletePath(only, 'sandbox.network.x');
  assert.deepEqual(only, {});
});

test('readExtras copies only present paths, applyExtras writes set fields and removes unset nested ones', () => {
  const fields = [F('claudeMd'), F('sandbox.bwrapPath'), F('channelsEnabled')];
  const data = { claudeMd: 'Be nice.', sandbox: { enabled: true, bwrapPath: '/opt/bwrap' }, channelsEnabled: false };
  const extras = readExtras(data, fields);
  assert.deepEqual(extras, { claudeMd: 'Be nice.', 'sandbox.bwrapPath': '/opt/bwrap', channelsEnabled: false });
  data.sandbox.bwrapPath = 'changed';
  assert.equal(extras['sandbox.bwrapPath'], '/opt/bwrap', 'a copy, not a reference');
  const out = { sandbox: { enabled: true, bwrapPath: '/old' } };
  applyExtras(out, { claudeMd: 'x' }, fields);
  assert.deepEqual(out, { sandbox: { enabled: true }, claudeMd: 'x' });
});

test('extraToggleNext writes only deviations from the default', () => {
  const off = F('channelsEnabled'), on = F('autoContinueAtUsageLimit');
  assert.equal(extraToggleNext(off, undefined), true);
  assert.equal(extraToggleNext(off, true), undefined);
  assert.equal(extraToggleNext(off, false), true, 'a loaded explicit false turns on');
  assert.equal(extraToggleNext(on, undefined), false);
  assert.equal(extraToggleNext(on, false), undefined);
  assert.equal(extraToggleNext(on, true), false);
});

test('parseExtraInput per control; empty input unsets, bad input reports an error', () => {
  assert.deepEqual(parseExtraInput(F('sshHostAllowlist'), ' a.example \n\n*.corp\n'), { value: ['a.example', '*.corp'] });
  assert.deepEqual(parseExtraInput(F('sshHostAllowlist'), ' \n'), { value: undefined });
  assert.deepEqual(parseExtraInput(F('claudeMd'), '  # Rules\n- one\n'), { value: '  # Rules\n- one\n' });
  assert.deepEqual(parseExtraInput(F('claudeMd'), '   '), { value: undefined });
  assert.deepEqual(parseExtraInput(F('desktopSessionCleanupPeriodDays'), '14'), { value: 14 });
  assert.deepEqual(parseExtraInput(F('desktopSessionCleanupPeriodDays'), 'zwei'), { error: 'number' });
  assert.deepEqual(parseExtraInput(F('strictPluginOnlyCustomization'), 'true'), { value: true });
  assert.deepEqual(parseExtraInput(F('strictPluginOnlyCustomization'), '["skills", "hooks"]'), { value: ['skills', 'hooks'] });
  assert.deepEqual(parseExtraInput(F('policyHelper'), '{ path: 1 }'), { error: 'json' });
  assert.deepEqual(parseExtraInput(F('pluginTrustMessage'), '  Ask IT first.  '), { value: 'Ask IT first.' });
  assert.deepEqual(parseExtraInput(F('dialogExpiry'), ''), { value: undefined });
});

test('extraDisplay renders what parseExtraInput reads back', () => {
  for (const [key, value] of [['sshHostAllowlist', ['a', 'b']], ['policyHelper', { path: '/x', timeoutMs: 5 }], ['desktopSessionCleanupPeriodDays', 7], ['claudeMd', '# x\n'], ['strictPluginOnlyCustomization', true]]) {
    const f = F(key);
    assert.deepEqual(parseExtraInput(f, extraDisplay(f, value)), { value }, key);
  }
  assert.equal(extraDisplay(F('claudeMd'), undefined), '');
  assert.equal(extraDisplay(F('sshHostAllowlist'), [{ host: 1 }]), '[\n  {\n    "host": 1\n  }\n]', 'a list of objects shows as JSON');
});

const { lf, editor } = require('./editor-harness.js');

test('extraFieldsFor splits the list by tab and group; every managed group is rendered', () => {
  const app = editor();
  assert.equal(app.extraFieldsFor('managed').length, 31);
  assert.equal(app.managedGroups.reduce((n, g) => n + app.extraFieldsFor('managed', g).length, 0), 31);
  assert.deepEqual(app.extraFieldsFor('general', 'more').map(f => f.key), ['modelPicker', 'vimInsertModeRemaps']);
  assert.equal(app.extraFieldsFor('permissions', 'automode').length, 2);
});

test('setExtra sets and unsets without delete on the reactive object', () => {
  const app = editor();
  const before = app.settings.extras;
  app.setExtra('claudeMd', 'x');
  assert.notEqual(app.settings.extras, before, 'a new object, so Alpine sees the change');
  assert.deepEqual(app.settings.extras, { claudeMd: 'x' });
  app.setExtra('claudeMd', undefined);
  assert.deepEqual(app.settings.extras, {});
  assert.equal(app.unsaved, true);
});

test('undo and redo restore generic fields', () => {
  const app = editor();
  app.$nextTick = (fn) => fn(); // Alpine magic, absent in Node
  app.pushHistory();
  app.setExtra('claudeMd', 'x');
  app.pushHistory();
  app.undo();
  assert.deepEqual(app.settings.extras, {});
  app.redo();
  assert.deepEqual(app.settings.extras, { claudeMd: 'x' });
});

test('toggleManagedFile marks the open file, and a file named managed-settings.json stays managed', () => {
  const app = editor();
  app.fileName = '50-security.json';
  assert.equal(app.managedFile, false);
  app.toggleManagedFile();
  assert.equal(app.managedFile, true);
  app.fileName = 'settings.json';
  assert.equal(app.managedFile, false, 'the mark belongs to the file it was set for');
  app.fileName = 'managed-settings.json';
  app.toggleManagedFile();
  assert.equal(app.managedFile, true);
});

test('the Managed tab exists with a description, and the search finds generic fields', () => {
  const app = editor();
  assert.ok(app.tabs.some(t => t.id === 'managed'));
  assert.equal(app.tabDesc('managed'), 'tab.managed.desc');
  app.searchQuery = 'claudemd';
  app.updateSearchResults();
  assert.ok(app.searchResults.some(r => r.id === 'extra-claudeMd' && r.tab === 'managed'));
  assert.equal(app.settingsRegistry.filter(r => r.id.startsWith('extra-')).length, 45);
});

test('the Managed tab and every subject tab with "more" fields render their block', () => {
  assert.ok(lf.includes("extraFieldsFor('managed', g)"));
  for (const tab of new Set(extraFields().filter(f => f.group === 'more').map(f => f.tab))) assert.ok(lf.includes(`extraFieldsFor('${tab}', 'more')`), tab);
});

test('every generic field has its curated sentence in six languages, at most 100 characters', () => {
  const T = require('./extract.js').extractT(lf);
  const long = [];
  for (const f of extraFields()) {
    const e = T['extra.' + f.key];
    assert.ok(e, 'missing extra.' + f.key);
    for (const lang of ['de', 'en', 'es', 'fr', 'ja', 'pt']) if (e[lang].length > 100) long.push(f.key + '/' + lang + ' ' + e[lang].length);
  }
  assert.deepEqual(long, []);
});
