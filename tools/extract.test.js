'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const ex = require('./extract.js');

test('extractFunction returns a callable copy of a top-level function', () => {
  const lf = '<script>\n    function defaultSettings() {\n      return { a: 1 };\n    }\n    function other() { return 2; }\n</script>';
  assert.deepEqual(ex.extractFunction(lf, 'defaultSettings')(), { a: 1 });
  assert.equal(ex.extractFunction(lf, 'other')(), 2);
  assert.throws(() => ex.extractFunction(lf, 'missing'), /missing/);
});

test('extractSchemaMap parses the block between markers', () => {
  const lf = 'x\n      // @@SCHEMA_MAP_START (generated)\n      const SCHEMA_MAP = {"meta":{"schemaVersion":"2"},"keys":{"a":{"type":"string"}}};\n      // @@SCHEMA_MAP_END\ny';
  assert.equal(ex.extractSchemaMap(lf).meta.schemaVersion, '2');
});

test('extractT reads i18n lines in single and double quotes, with escapes', () => {
  const lf = "    const T = {\n      'a.b': { de: 'Hallo', en: 'Hi', es: 'Hola', fr: 'Salut', ja: 'や', pt: 'Oi' },\n      'a.c': { de: 'Los geht\\'s', en: 'Go', es: 'Vamos', fr: \"Qu'est-ce\", ja: '行', pt: 'Vai' },\n    };";
  const T = ex.extractT(lf);
  assert.equal(T['a.b'].de, 'Hallo');
  assert.equal(T['a.c'].de, "Los geht's");
  assert.equal(T['a.c'].fr, "Qu'est-ce");
  assert.equal(Object.keys(T).length, 2);
});

test('extractT parses every T line of the real HTML (prefix count equals parsed count)', () => {
  const { lf } = ex.loadHtml();
  const prefixCount = (lf.match(/^\s*'[^']+': \{ de: /gm) || []).length;
  assert.equal(Object.keys(ex.extractT(lf)).length, prefixCount);
});

test('the real HTML exposes defaultSettings and SCHEMA_MAP', () => {
  const { lf } = ex.loadHtml();
  const d = ex.extractFunction(lf, 'defaultSettings')();
  assert.ok('model' in d && 'permissions' in d);
  const map = ex.extractSchemaMap(lf);
  assert.ok(Object.keys(map.keys).length > 200);
  assert.ok(map.keys.teammateMode.inSchema);
});
