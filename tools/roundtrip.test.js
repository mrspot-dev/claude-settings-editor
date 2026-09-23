// tools/roundtrip.test.js — loadJson -> cleanJson must never drop what the editor does not edit
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { editor } = require('./editor-harness.js');
const trip = (doc) => { const app = editor(); app.loadJson(JSON.stringify(doc)); return { app, out: JSON.parse(app.cleanJson()) }; };

const setPath = (o, path, v) => { const p = path.split('.'); let c = o; for (const k of p.slice(0, -1)) c = c[k] = c[k] || {}; c[p[p.length - 1]] = v; };
const getPath = (o, path) => path.split('.').reduce((c, k) => (c == null ? undefined : c[k]), o);

test('every nested key of the settings reference survives load and save', () => {
  const map = SCHEMA_MAP.keys;
  const nested = Object.keys(map).filter(k => k.includes('.'));
  // leaves only: a key that is the prefix of another key is an object container
  const leaves = nested.filter(k => !nested.some(o => o !== k && o.startsWith(k + '.')));
  const sample = (k) => {
    const i = map[k];
    if (i.enum && i.enum.length) return i.enum.find(v => v !== 'default') || i.enum[0];
    // a boolean at its default may legitimately be omitted on export, so test the other value
    if (i.type === 'boolean') return !/^`?true\b/.test(String(i.default));
    return ({ boolean: true, number: 7, integer: 7, array: ['x'], object: { a: 1 }, string: 'x' })[i.type] ?? 'x';
  };
  const doc = {};
  for (const k of leaves) setPath(doc, k, sample(k));
  const { out } = trip(doc);
  const lost = leaves.filter(k => JSON.stringify(getPath(out, k)) !== JSON.stringify(getPath(doc, k)));
  assert.deepEqual(lost, [], 'dropped or changed on save: ' + lost.join(', '));
});

test('unknown sub-keys of permissions, sandbox and statusLine are kept', () => {
  const doc = {
    permissions: { allow: ['Bash(ls)'], blockReadsOutsideWorkingDirectories: true, futureFlag: 1 },
    sandbox: { enabled: true, failIfUnavailable: true, network: { deniedDomains: ['evil.example'], allowedDomains: ['a.b'] }, filesystem: { denyRead: ['~/.ssh'], disabled: false } },
    statusLine: { type: 'command', command: 'x.sh', padding: 2 },
  };
  assert.deepEqual(trip(doc).out, doc);
});

test('editing an owned field still removes it while unknown siblings stay', () => {
  const { app } = trip({ permissions: { allow: ['Bash(ls)'], blockReadsOutsideWorkingDirectories: true }, sandbox: { enabled: true, failIfUnavailable: true } });
  app.settings.permissions.allow = [];
  app.settings.sandbox.enabled = false;
  assert.deepEqual(JSON.parse(app.cleanJson()), { permissions: { blockReadsOutsideWorkingDirectories: true }, sandbox: { failIfUnavailable: true } });
});

test('sandbox.mode was never a Claude Code setting: dropped on import with a notice', () => {
  const { app, out } = trip({ sandbox: { enabled: true, mode: 'monitor' } });
  assert.deepEqual(out, { sandbox: { enabled: true } });
  assert.equal(app.unsaved, true);
  assert.ok(app.notes.some(n => n.includes('sandbox.mode')), app.notes.join(' | '));
});

test('a reset forgets the imported extras', () => {
  const { app } = trip({ sandbox: { enabled: true, failIfUnavailable: true } });
  app.resetSettingsSilent();
  assert.deepEqual(JSON.parse(app.cleanJson()), {});
});

test('an explicit sandbox.enabled: false survives, it can override a lower layer', () => {
  assert.deepEqual(trip({ sandbox: { enabled: false } }).out, { sandbox: { enabled: false } });
});

test('share and bundle leave out env and keys unknown to the reference, but keep known extras', () => {
  const { app } = trip({ model: 'opus', autoCompactEnabled: false, myToken: 'abc', env: { X: '1' } });
  const { doc, note } = app._shareableDoc();
  assert.deepEqual(doc, { model: 'opus', autoCompactEnabled: false });
  assert.ok(note.includes('notify.envStripped') && note.includes('myToken'), note);
});

test('share of a clean document carries no note', () => {
  assert.equal(trip({ model: 'opus' }).app._shareableDoc().note, '');
});
