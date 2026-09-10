'use strict';
// umlaut-guard:allow — the i18n fixture below deliberately contains the transliterated word
// "Schluessel" as the negative sample the transliteration check has to flag.
const test = require('node:test');
const assert = require('node:assert/strict');
const sc = require('./self-check.js');
const ex = require('./extract.js');

function mini({ defaults = "model: '', foo: true", load = 'if (data.model) s.model = data.model; if (data.foo !== undefined) s.foo = data.foo;', clean = 'if (s.model) out.model = s.model; if (s.foo) out.foo = true;', known = "'model', 'foo'", mapKeys = '"model":{},"foo":{}', t = "'a.x': { de: 'Schlüssel', en: 'Key', es: 'Clave', fr: 'Clé', ja: 'キー', pt: 'Chave' }," , groups = '<div id="setting-model" class="settings-group"><p class="setting-desc" x-text="t(\'a.x\')"></p></div>' } = {}) {
  return `<html>${groups}<script>
    function defaultSettings() {
      return { ${defaults} };
    }
      // @@SCHEMA_MAP_START
      const SCHEMA_MAP = {"meta":{},"keys":{${mapKeys}}};
      // @@SCHEMA_MAP_END
    const T = {
      ${t}
    };
        loadJson(text) { const data = JSON.parse(text); const s = this.settings; ${load}
            const knownKeys = new Set([
              ${known}
            ]);
        },
        cleanJson(settingsOverride) {
          const s = settingsOverride || this.settings; const out = {};
          const nested = { a: 1 };
          ${clean}
          return out;
        },
        afterwards() { return 'must not be scanned as cleanJson'; },
</script></html>`;
}

test('clean mini file has no hard findings', () => {
  const r = sc.selfCheck(mini());
  assert.deepEqual(r.hard, []);
});

test('a default key missing from loadJson, cleanJson or knownKeys is a hard finding', () => {
  const r = sc.selfCheck(mini({ known: "'model'" }));
  assert.ok(r.hard.some(h => h.includes('foo') && h.includes('knownKeys')));
  const r2 = sc.selfCheck(mini({ clean: 'if (s.model) out.model = s.model;' }));
  assert.ok(r2.hard.some(h => h.includes('foo') && h.includes('cleanJson')));
});

test('a knownKeys entry unknown to SCHEMA_MAP is hard unless allowlisted', () => {
  const r = sc.selfCheck(mini({ mapKeys: '"model":{}' }));
  assert.ok(r.hard.some(h => h.includes('foo') && h.includes('SCHEMA_MAP')));
  const r2 = sc.selfCheck(mini({ defaults: "model: '', mcpServers: {}", load: 'if (data.model) s.model = data.model; if (data.mcpServers) s.mcpServers = data.mcpServers;', clean: 'if (s.model) out.model = s.model; if (s.mcpServers) out.mcpServers = s.mcpServers;', known: "'model', 'mcpServers'", mapKeys: '"model":{}' }));
  assert.deepEqual(r2.hard, []);
});

test('i18n gaps and used-but-missing keys are hard; transliteration suspects are soft', () => {
  const r = sc.selfCheck(mini({ t: "'a.x': { de: 'Schluessel', en: 'Key', es: 'Clave', fr: 'Cle', ja: 'キー', pt: 'Chave' },\n      'a.y': { de: 'Nur', en: 'Only', es: 'Solo', fr: 'Seul', ja: 'のみ', pt: 'Só' }," }));
  assert.ok(r.soft.some(s => s.includes('a.x') && s.includes('Umlaut')));
  const r2 = sc.selfCheck(mini({ groups: '<div id="setting-model" class="settings-group"><p class="setting-desc" x-text="t(\'nope.key\')"></p></div>' }));
  assert.ok(r2.hard.some(h => h.includes('nope.key')));
});

test('a settings-group without setting-desc is a soft finding', () => {
  const r = sc.selfCheck(mini({ groups: '<div id="setting-model" class="settings-group"><label class="setting-label"></label></div>' }));
  assert.ok(r.soft.some(s => s.includes('setting-model') && s.includes('setting-desc')));
});

test('the real editor passes with zero hard findings', () => {
  const r = sc.selfCheck(ex.loadHtml().lf);
  assert.deepEqual(r.hard, []);
  assert.ok(r.stats.defaultKeys > 40);
});
