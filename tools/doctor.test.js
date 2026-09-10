// tools/doctor.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const ex = require('./extract.js');
const { lf } = ex.loadHtml();
const levenshtein = ex.extractFunction(lf, 'levenshtein');
const nearestKey = ex.extractFunction(lf, 'nearestKey');
const doctorFindings = ex.extractFunction(lf, 'doctorFindings');

// extractFunction compiles each function in its own `new Function` scope, so the free references
// between them (nearestKey -> levenshtein, doctorFindings -> nearestKey) resolve against the global.
globalThis.levenshtein = levenshtein;
globalThis.nearestKey = nearestKey;

const MAP = {
  teammateMode: { type: 'string', enum: ['in-process', 'auto', 'tmux', 'iterm2'], scope: 'any', deprecated: false },
  includeCoAuthoredBy: { type: 'boolean', enum: [], scope: 'any', deprecated: true },
  cleanupPeriodDays: { type: 'number', enum: [], scope: 'any', deprecated: false },
  claudeMd: { type: 'string', enum: [], scope: 'managed', deprecated: false },
  effortLevel: { type: 'string', enum: ['low', 'medium', 'high', 'xhigh'], scope: 'any', deprecated: false },
  'permissions.defaultMode': { type: 'string', enum: ['default'], scope: 'any', deprecated: false },
};

test('levenshtein and nearestKey', () => {
  assert.equal(levenshtein('teamateMode', 'teammateMode'), 1);
  assert.equal(levenshtein('', 'abc'), 3);
  assert.equal(nearestKey('teamateMode', Object.keys(MAP)), 'teammateMode');
  assert.equal(nearestKey('TeammateMode', Object.keys(MAP)), 'teammateMode');
  assert.equal(nearestKey('foo', Object.keys(MAP)), '');
  assert.equal(nearestKey('mode', Object.keys(MAP)), '', 'short keys need a tight distance');
});

test('unknown key with suggestion, unknown key without', () => {
  const f = doctorFindings({ teamateMode: 'tmux', totallyNew: 1 }, MAP, { skipEnum: [], hints: {} });
  assert.deepEqual(f.map(x => [x.key, x.kind, x.suggestion]), [['teamateMode', 'unknown', 'teammateMode'], ['totallyNew', 'unknown', '']]);
});

test('deprecated, type and enum findings; skipEnum honoured', () => {
  const f = doctorFindings({ includeCoAuthoredBy: true, cleanupPeriodDays: '30', teammateMode: 'screen', effortLevel: 'ultra' }, MAP, { skipEnum: ['effortLevel'], hints: {} });
  const kinds = Object.fromEntries(f.map(x => [x.key + ':' + x.kind, x]));
  assert.ok(kinds['includeCoAuthoredBy:deprecated']);
  assert.equal(kinds['cleanupPeriodDays:type'].actual, 'string');
  assert.equal(kinds['cleanupPeriodDays:type'].expected, 'number');
  assert.equal(kinds['teammateMode:enum'].expected, 'in-process, auto, tmux, iterm2');
  assert.ok(!kinds['effortLevel:enum'], 'editor rule covers effortLevel');
});

test('integer accepts a JSON number; managed-only key is reported; hint keys are not unknown', () => {
  const map = { ...MAP, n: { type: 'integer', enum: [], scope: 'any', deprecated: false } };
  const f = doctorFindings({ n: 3, claudeMd: 'x', mcpServers: {} }, map, { skipEnum: [], hints: { mcpServers: true } });
  assert.deepEqual(f.map(x => x.key + ':' + x.kind), ['claudeMd:managed', 'mcpServers:hint']);
});

test('prototype keys are ignored', () => {
  const doc = JSON.parse('{"__proto__": {"x": 1}, "constructor": 1}');
  assert.deepEqual(doctorFindings(doc, MAP, { skipEnum: [], hints: {} }), []);
});

test('diffSchemaKeys compares remote top-level keys with embedded inSchema keys', () => {
  const diffSchemaKeys = ex.extractFunction(lf, 'diffSchemaKeys');
  const map = { a: { inSchema: true }, b: { inSchema: true }, c: { inSchema: false }, 'x.y': { inSchema: true } };
  const r = diffSchemaKeys(['a', 'd', '__proto__', 'constructor', '$schema'], map);
  assert.deepEqual(r, { added: ['d'], removed: ['b'] });
});
