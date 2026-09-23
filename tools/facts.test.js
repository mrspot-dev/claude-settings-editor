// tools/facts.test.js — fact sheet data and env-conflict detection (spec 3.3, 3.6)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { lf } = require('./editor-harness.js');
const ex = require('./extract.js');

const MAP = {
  effortLevel: { scope: 'any', type: 'string', enum: ['low', 'medium', 'high', 'xhigh'], default: 'unset', since: '', overrides: [{ env: 'CLAUDE_CODE_EFFORT_LEVEL', kind: 'precedence' }], deprecated: false, desc: 'Persist effort.', inSchema: true, inReference: true },
  'attribution.sessionUrl': { scope: 'any', type: 'boolean', enum: [], default: 'true', since: '', overrides: [], deprecated: false, desc: '', inSchema: false, inReference: true },
  schemaOnly: { scope: 'unknown', type: 'string', enum: [], default: '', since: '', overrides: [], deprecated: false, desc: 'From SchemaStore.', inSchema: true, inReference: false },
  fastMode: { scope: 'any', type: 'boolean', enum: [], default: 'unset, so fast mode is off', since: '', overrides: [{ env: 'CLAUDE_CODE_DISABLE_FAST_MODE', kind: 'off' }], deprecated: false, desc: '', inSchema: true, inReference: true },
  autoCompactEnabled: { scope: 'any', type: 'boolean', enum: [], default: 'true', since: '', overrides: [{ env: 'DISABLE_AUTO_COMPACT', kind: 'off' }], deprecated: false, desc: '', inSchema: true, inReference: true },
  disableClaudeAiConnectors: { scope: 'any', type: 'boolean', enum: [], default: 'false', since: '', overrides: [{ env: 'ENABLE_CLAUDEAI_MCP_SERVERS', kind: 'off', when: 'false' }], deprecated: false, desc: '', inSchema: true, inReference: true },
};

test('factDefault keeps short value-like defaults and drops prose', () => {
  const factDefault = ex.extractFunction(lf, 'factDefault');
  assert.equal(factDefault('unset, so no cap applies'), 'unset');
  assert.equal(factDefault('true'), 'true');
  assert.equal(factDefault('false, so Claude Code fetches your connectors'), 'false');
  assert.equal(factDefault('"medium", or "small" when you\'re signed in on a Pro plan with Cla'), '');
  assert.equal(factDefault(''), '');
  assert.equal(factDefault(undefined), '');
});

test('keyFacts builds the fact sheet data, with a reference link only where the reference documents the key', () => {
  globalThis.factDefault = ex.extractFunction(lf, 'factDefault');
  const keyFacts = ex.extractFunction(lf, 'keyFacts');
  const f = keyFacts('effortLevel', MAP);
  assert.deepEqual(f, { key: 'effortLevel', scope: 'any', type: 'string', values: ['low', 'medium', 'high', 'xhigh'], default: 'unset', since: '', overrides: [{ env: 'CLAUDE_CODE_EFFORT_LEVEL', kind: 'precedence' }], deprecated: false, desc: 'Persist effort.', url: 'https://code.claude.com/docs/en/settings-reference#effortlevel' });
  assert.equal(keyFacts('attribution.sessionUrl', MAP).url, 'https://code.claude.com/docs/en/settings-reference#attribution-sessionurl');
  assert.equal(keyFacts('schemaOnly', MAP).url, '');
  assert.equal(keyFacts('nope', MAP), null);
  assert.equal(keyFacts('__proto__', MAP), null);
  assert.equal(keyFacts('constructor', MAP), null);
});

test('envConflicts: a set key plus its override variable in env is a conflict; an empty value or an unset key is not', () => {
  const envConflicts = ex.extractFunction(lf, 'envConflicts');
  assert.deepEqual(envConflicts({ effortLevel: 'high', env: { CLAUDE_CODE_EFFORT_LEVEL: 'low' } }, MAP),
    [{ key: 'effortLevel', env: 'CLAUDE_CODE_EFFORT_LEVEL', kind: 'precedence', envValue: 'low' }]);
  assert.deepEqual(envConflicts({ fastMode: true, autoCompactEnabled: true, env: { CLAUDE_CODE_DISABLE_FAST_MODE: '1', DISABLE_AUTO_COMPACT: '1' } }, MAP),
    [{ key: 'fastMode', env: 'CLAUDE_CODE_DISABLE_FAST_MODE', kind: 'off', envValue: '1' },
     { key: 'autoCompactEnabled', env: 'DISABLE_AUTO_COMPACT', kind: 'off', envValue: '1' }]);
  assert.deepEqual(envConflicts({ effortLevel: 'high', env: { CLAUDE_CODE_EFFORT_LEVEL: '' } }, MAP), []);
  assert.deepEqual(envConflicts({ env: { CLAUDE_CODE_EFFORT_LEVEL: 'low' } }, MAP), []);
  assert.deepEqual(envConflicts({ effortLevel: 'high' }, MAP), []);
  assert.deepEqual(envConflicts({ attribution: { sessionUrl: false }, env: {} }, MAP), []);
  assert.deepEqual(envConflicts(null, MAP), []);
  // a variable with a trigger value acts only with exactly that value
  assert.deepEqual(envConflicts({ disableClaudeAiConnectors: false, env: { ENABLE_CLAUDEAI_MCP_SERVERS: 'true' } }, MAP), []);
  assert.deepEqual(envConflicts({ disableClaudeAiConnectors: false, env: { ENABLE_CLAUDEAI_MCP_SERVERS: 'false' } }, MAP),
    [{ key: 'disableClaudeAiConnectors', env: 'ENABLE_CLAUDEAI_MCP_SERVERS', kind: 'off', envValue: 'false' }]);
});

test('validateSettings reports env conflicts in the Environment tab, also for keys the editor has no field for', () => {
  const { editor } = require('./editor-harness.js');
  const app = editor();
  app.loadJson(JSON.stringify({
    effortLevel: 'high', fastMode: true, autoCompactEnabled: true, promptCacheTtl: '1h',
    env: { CLAUDE_CODE_EFFORT_LEVEL: 'low', CLAUDE_CODE_DISABLE_FAST_MODE: '1', DISABLE_AUTO_COMPACT: '1', ENABLE_PROMPT_CACHING_1H: '1' },
  }));
  app.validateSettings();
  const env = app.validationErrors.filter(e => e.tab === 'env' && e.severity === 'info').map(e => e.message).sort();
  assert.deepEqual(env, [
    'CLAUDE_CODE_DISABLE_FAST_MODE=1doctor.envOfffastMode',
    'CLAUDE_CODE_EFFORT_LEVEL=lowdoctor.envWinseffortLevel',
    'DISABLE_AUTO_COMPACT=1doctor.envOffautoCompactEnabled',
  ]);
  const app2 = editor();
  app2.loadJson(JSON.stringify({ effortLevel: 'high', env: { CLAUDE_CODE_EFFORT_LEVEL: '' } }));
  app2.validateSettings();
  assert.equal(app2.validationErrors.filter(e => e.tab === 'env').length, 0);
});

test('factsView turns keyFacts into translated rows; unknown keys give null', () => {
  const { editor } = require('./editor-harness.js');
  const app = editor();
  const v = app.factsView('effortLevel');
  assert.equal(v.summary, 'facts.summary');
  const labels = v.rows.map(r => r[0]);
  assert.ok(labels.includes('facts.scope') && labels.includes('facts.values') && labels.includes('facts.envOverride'), labels.join(','));
  assert.deepEqual(v.rows.find(r => r[0] === 'facts.envOverride'), ['facts.envOverride', 'CLAUDE_CODE_EFFORT_LEVEL — facts.envWins']);
  assert.equal(v.rows.find(r => r[0] === 'facts.default')[1], 'facts.unset');
  assert.equal(v.url, 'https://code.claude.com/docs/en/settings-reference#effortlevel');
  assert.deepEqual(app.factsView('disableClaudeAiConnectors').rows.find(r => r[0] === 'facts.envOverride'), ['facts.envOverride', 'ENABLE_CLAUDEAI_MCP_SERVERS=false — facts.envOff']);
  assert.equal(app.factsView('definitelyNotAKey'), null);
});

test('renderFacts never parses markup: only textContent, no HTML sinks', () => {
  const src = lf.match(/^    function renderFacts\([\s\S]*?\n    \}/m);
  assert.ok(src, 'renderFacts not found');
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(src[0]), 'renderFacts uses an HTML sink');
  assert.ok(/textContent/.test(src[0]));
});

test('every x-facts key literal exists in SCHEMA_MAP, and the sandbox path groups have a dynamic one', () => {
  const map = ex.extractSchemaMap(lf).keys;
  const keys = [...lf.matchAll(/x-facts="'([^']+)'"/g)].map(m => m[1]);
  assert.equal(keys.length, 57, 'static x-facts count'); // v1.8: +3 Memory tab, +1 ultracode
  for (const k of keys) assert.ok(map[k], 'unknown x-facts key ' + k);
  assert.ok(/x-facts="'sandbox\.filesystem\.' \+ list\.key"/.test(lf), 'dynamic sandbox path groups');
});

test('the fourteen rewritten descriptions are in place in all six languages', () => {
  const T = ex.extractT(lf);
  const expectDe = {
    'adv.plansDirDesc': 'Ordner, in dem Claude im Plan-Modus seine Plandateien ablegt, relativ zum Projekt.',
    'perm.allowDescLong': 'Diese Aktionen führt Claude ohne Rückfrage aus.',
    'adv.cleanupDescLong': 'Nach so vielen Tagen löscht Claude Code Sitzungsverläufe und andere App-Daten. Standard: 30.',
  };
  for (const [k, de] of Object.entries(expectDe)) assert.equal(T[k].de, de);
  const keys = ['adv.plansDirDesc', 'display.reducedMotionDesc', 'display.statusLineDesc', 'display.turnDurationDesc', 'general.themeDesc', 'perm.defaultModeDesc', 'perm.askDescLong', 'general.languageDesc', 'adv.loginDescLong', 'perm.allowDescLong', 'perm.additionalDirsDesc', 'adv.cleanupDescLong', 'display.spinnerTipsDesc', 'perm.denyDescLong'];
  for (const k of keys) {
    for (const l of ['de', 'en', 'es', 'fr', 'ja', 'pt']) assert.ok(T[k][l] && T[k][l].length >= 20, k + ' ' + l);
    assert.ok(T[k].de.length <= 95, k + ' de too long: ' + T[k].de.length);
    for (const l of ['en', 'es', 'fr', 'ja', 'pt']) assert.ok(T[k][l].length <= 100, k + ' ' + l + ' too long: ' + T[k][l].length);
  }
});

test('factsView: a boolean with default unset shows no default row, one with a real default does', () => {
  const { editor } = require('./editor-harness.js');
  const app = editor();
  const rows = (k) => app.factsView(k).rows.map(r => r[0]);
  assert.ok(!rows('ultracode').includes('facts.default'), 'ultracode: unset does not mean off for every boolean');
  assert.deepEqual(app.factsView('autoMemoryEnabled').rows.find(r => r[0] === 'facts.default'), ['facts.default', 'true']);
});

test('factsView: a deprecated key carries the notice, a current one does not', () => {
  const { editor } = require('./editor-harness.js');
  const app = editor();
  assert.equal(app.factsView('voiceEnabled').deprecated, 'facts.deprecated');
  assert.equal(app.factsView('voice').deprecated, '');
});

test('factsView: a key the reference does not document has no docs link', () => {
  const { editor } = require('./editor-harness.js');
  const app = editor();
  assert.equal(SCHEMA_MAP.keys.skippedPlugins.inReference, false);
  assert.equal(app.factsView('skippedPlugins').url, '');
  assert.ok(app.factsView('autoMemoryEnabled').url.endsWith('#automemoryenabled'));
});

test('the Memory tab shows fact sheets and no Auto Dream; ultracode has its fact sheet', () => {
  for (const k of ['autoMemoryEnabled', 'autoMemoryDirectory', 'cleanupPeriodDays', 'ultracode']) assert.ok(lf.includes('x-facts="\'' + k + '\'"'), k);
  assert.ok(!/memory\.dream|setting-auto-dream|healthTip3/.test(lf));
  const T = ex.extractT(lf);
  assert.ok(!/Dream/.test(T['memory.desc'].de + T['memory.historyTip'].en));
  assert.ok(lf.includes("'autoDreamEnabled'"), 'the legacy key stays listed for the import notice');
});
