// tools/automode.test.js — the Auto Mode preset, wizard option and permissions group (spec 4.3)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { lf, editor } = require('./editor-harness.js');
const T = require('./extract.js').extractT(lf);

test('the Auto Mode preset sets auto, empties allow and ask, and takes the Safety First deny list', () => {
  const app = editor();
  app.settings.permissions.allow = ['Bash(*)'];
  app.settings.permissions.ask = ['Bash(git push *)'];
  app.settings.permissions.disableAutoMode = 'disable';
  app._applyPermPresetData('pp-auto');
  const p = app.settings.permissions;
  assert.equal(p.defaultMode, 'auto');
  assert.equal(p.disableAutoMode, '', 'no lock that contradicts the chosen mode');
  assert.equal(JSON.parse(app.cleanJson()).permissions.disableAutoMode, undefined);
  assert.deepEqual([p.allow, p.ask], [[], []]);
  assert.deepEqual(p.deny, safetyDenyRules());
  assert.deepEqual(JSON.parse(app.cleanJson()).permissions.defaultMode, 'auto');
});

test('Safety First keeps its deny list, now from the shared function', () => {
  const app = editor();
  app._applyPermPresetData('pp-safety');
  assert.equal(app.settings.permissions.defaultMode, 'acceptEdits');
  assert.deepEqual(app.settings.permissions.deny, safetyDenyRules());
  assert.equal(safetyDenyRules().length, 29);
  assert.ok(safetyDenyRules().includes('Bash(rm -rf *)') && safetyDenyRules().includes('Read(~/.ssh/*)'));
  assert.notEqual(safetyDenyRules(), safetyDenyRules(), 'a fresh array each call, so presets never share one');
});

test('Auto Mode is the first, recommended preset and wizard option, with texts in six languages', () => {
  const app = editor();
  assert.equal(app.permPresets[0].id, 'pp-auto');
  assert.equal(app.permPresets[0].recommended, true);
  assert.ok(lf.includes("{id:'auto',labelKey:'wizard.permAuto',descKey:'wizard.permAutoDesc',rec:true}"));
  for (const k of ['data.preset.pp-auto.name', 'data.preset.pp-auto.desc', 'perm.recommended', 'perm.autoWhere', 'perm.autoGroup', 'perm.autoRulesLink', 'wizard.permAuto', 'wizard.permAutoDesc']) assert.ok(T[k], k);
});

test('the permissions tab groups auto mode: heading, classifier, disable switch, generic fields, rules link, then bypass', () => {
  const at = (s) => { const i = lf.indexOf(s); assert.ok(i > 0, s); return i; };
  const order = ['id="setting-automode-group"', 'id="setting-classify-all-shell"', 'id="setting-perm-disable-auto"', "extraFieldsFor('permissions', 'automode')", "jumpToSetting('advanced', 'setting-auto-mode')", 'id="setting-perm-bypass"'].map(at);
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.equal(lf.split('id="setting-perm-disable-auto"').length, 2, 'moved, not copied');
  assert.ok(lf.includes('id="setting-auto-mode"'), 'the link target exists');
});

test('the defaultMode select shows where auto takes effect', () => {
  assert.ok(lf.includes('x-show="settings.permissions.defaultMode === \'auto\'" class="text-xs text-amber-300 mt-2" x-text="t(\'perm.autoWhere\')"'));
});
