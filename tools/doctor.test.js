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

test('embedded SCHEMA_MAP facts: fastMode is not deprecated, language has no enum', () => {
  const map = ex.extractSchemaMap(lf);
  assert.equal(map.keys.fastMode.deprecated, false);
  assert.equal(map.keys.includeCoAuthoredBy.deprecated, true);
  assert.deepEqual(map.keys.language.enum, []);
  assert.deepEqual(map.keys.minimumVersion.enum, []);
});


test('the doctor raises nothing but the mcpServers hint on a document made of every editor key', () => {
  const map = ex.extractSchemaMap(lf).keys;
  const known = [...lf.match(/const knownKeys = new Set\(\[([\s\S]*?)\]\)/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  const sample = (info) => info.enum && info.enum.length ? info.enum[0] : ({ string: 'x', boolean: true, number: 1, integer: 1, object: {}, array: [] })[info.type || 'string'];
  const doc = {};
  for (const k of known) doc[k] = map[k] ? sample(map[k]) : {};
  const findings = doctorFindings(doc, map, { skipEnum: ['effortLevel', 'maxEffortLevel', 'editorMode', 'theme', 'teammateMode', 'autoUpdatesChannel', 'outputStyle'], hints: { mcpServers: true } });
  assert.deepEqual(findings.filter(f => f.kind !== 'hint' && f.kind !== 'managed'), [], JSON.stringify(findings));
});

test('opus55EffortHint: a top-level effortLevel without an Opus 5.5 entry yields a modelSettings fix', () => {
  const hint = ex.extractFunction(lf, 'opus55EffortHint');
  assert.deepEqual(hint({ effortLevel: 'high' }), { type: 'modelSetting', key: 'claude-opus-5-5', effortLevel: 'high' });
  assert.deepEqual(hint({ effortLevel: 'xhigh', modelSettings: { 'claude-opus-5': { effortLevel: 'low' } } }), { type: 'modelSetting', key: 'claude-opus-5-5', effortLevel: 'xhigh' });
  assert.equal(hint({ effortLevel: 'high', modelSettings: { 'claude-opus-5-5': { maxEffortLevel: 'high' } } }), null);
  assert.equal(hint({}), null);
  assert.equal(hint({ modelSettings: {} }), null);
});

test('voice: the editor writes the voice object, never the deprecated voiceEnabled', () => {
  const known = [...lf.match(/const knownKeys = new Set\(\[([\s\S]*?)\]\)/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.ok(known.includes('voice'));
  assert.ok(!known.includes('voiceEnabled'));
  assert.ok(known.includes('bashEditDiffEnabled'));
});

test('attribution: hidden parts, sessionUrl and unknown sub-keys survive the round trip', () => {
  const from = ex.extractFunction(lf, 'attributionFromFile');
  const to = ex.extractFunction(lf, 'attributionToFile');
  const trip = a => to(from(a));
  assert.deepEqual(trip({ commit: '', pr: '', sessionUrl: false }), { commit: '', pr: '', sessionUrl: false });
  assert.deepEqual(trip({ commit: 'X', pr: '' }), { commit: 'X', pr: '' });
  assert.deepEqual(trip({ commit: '', future: 1 }), { future: 1, commit: '' });
  assert.deepEqual(trip({ sessionUrl: true }), null);
  assert.equal(trip(undefined), null);
  assert.equal(trip({}), null);
  const st = from({ commit: '' });
  assert.equal(st.hideCommit, true);
  assert.equal(st.commit, '');
  assert.ok(/attributionFromFile\(data\.attribution\)/.test(lf) && /attributionToFile\(s\.attribution\)/.test(lf), 'loadJson and cleanJson use the helpers');
});

test('deprecatedKeyFix keeps the effect of keys Claude Code still reads', () => {
  const fix = ex.extractFunction(lf, 'deprecatedKeyFix');
  assert.deepEqual(fix({ disableArtifact: true, model: 'opus' }, 'disableArtifact'), { model: 'opus', enableArtifact: false });
  assert.deepEqual(fix({ disableArtifact: false }, 'disableArtifact'), {});
  assert.deepEqual(fix({ includeCoAuthoredBy: false }, 'includeCoAuthoredBy'), { attribution: { commit: '', pr: '' } });
  assert.deepEqual(fix({ includeCoAuthoredBy: false, attribution: { commit: 'X' } }, 'includeCoAuthoredBy'), { attribution: { commit: 'X' } });
  assert.deepEqual(fix({ includeCoAuthoredBy: false, attribution: { sessionUrl: false } }, 'includeCoAuthoredBy'), { attribution: { sessionUrl: false, commit: '', pr: '' } });
  assert.deepEqual(fix({ includeCoAuthoredBy: true }, 'includeCoAuthoredBy'), {});
  assert.deepEqual(fix({ taskOutputMaxChars: 5 }, 'taskOutputMaxChars'), {});
});

test('embedded SCHEMA_MAP: overrides parsed from the reference', () => {
  const map = ex.extractSchemaMap(lf).keys;
  assert.deepEqual(map.effortLevel.overrides, [{ env: 'CLAUDE_CODE_EFFORT_LEVEL', kind: 'precedence' }]);
  assert.deepEqual(map.fastMode.overrides, [{ env: 'CLAUDE_CODE_DISABLE_FAST_MODE', kind: 'off' }]);
  assert.deepEqual(map.promptCacheTtl.overrides.map(o => o.env), ['FORCE_PROMPT_CACHING_5M', 'CLAUDE_CODE_PROMPT_CACHE_TTL']);
  assert.deepEqual(map.disableClaudeAiConnectors.overrides, [{ env: 'ENABLE_CLAUDEAI_MCP_SERVERS', kind: 'off', when: 'false' }]);
  const withWhen = Object.keys(map).filter(k => (map[k].overrides || []).some(o => o.when !== undefined));
  assert.equal(withWhen.length, 6, 'keys with a trigger value: ' + withWhen.join(', '));
  const withEnv = Object.keys(map).filter(k => map[k].overrides && map[k].overrides.length);
  assert.ok(withEnv.length >= 28, 'only ' + withEnv.length + ' keys carry overrides');
  for (const k of Object.keys(map)) assert.ok(Array.isArray(map[k].overrides), k + ' has no overrides array');
});
