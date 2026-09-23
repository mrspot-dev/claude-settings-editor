// tools/build-schema-map.test.js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const gen = require('./build-schema-map.js');

const REF = `# Settings reference

## Model settings

### \`teammateMode\`

Choose where Claude Code shows teammates.

* **Scope**: [\`Any file\`](#scopes). Claude Code also reads a value left in \`~/.claude.json\`.
* **Type**: string, one of:
  * \`"in-process"\`: teammates run inside your main terminal pane
  * \`"auto"\`: split panes when possible
  * \`"tmux"\`: split panes using tmux
  * \`"iterm2"\`: iTerm2 native split panes, in Claude Code v2.1.186 or later
* **Default**: \`"in-process"\`

\`\`\`json settings.json theme={null}
{
  "teammateMode": "auto"
}
\`\`\`

### \`maxEffortLevel\`

Cap the effort level. Requires Claude Code v2.1.267 or later. Also \`CLAUDE_CODE_EFFORT_LEVEL\` applies.

* **Scope**: [\`Managed\`](#scopes)
* **Type**: string, one of \`"low"\`, \`"medium"\`, \`"high"\`, \`"xhigh"\`, or \`"max"\`. A \`"max"\` value sets no cap
* **Default**: unset, so no cap applies

### \`permissions.defaultMode\`

Nested key.

* **Scope**: [\`User or managed\`](#scopes)
* **Type**: string
* **Default**: \`"default"\`
`;

const SCHEMA = {
  properties: {
    $schema: { type: 'string' },
    teammateMode: { type: 'string', enum: ['auto', 'in-process', 'tmux', 'iterm2'], description: 'How teammates display. See https://x' },
    includeCoAuthoredBy: { type: 'boolean', description: 'DEPRECATED: use attribution instead.' },
    onlyInSchema: { type: 'number', default: 5, description: 'Only here.' },
  },
};

test('parseReference extracts scope, type, enum, default, since, env', () => {
  const f = gen.parseReference(REF);
  assert.deepEqual(Object.keys(f).sort(), ['maxEffortLevel', 'permissions.defaultMode', 'teammateMode']);
  assert.equal(f.teammateMode.scope, 'any');
  assert.equal(f.teammateMode.type, 'string');
  assert.deepEqual(f.teammateMode.enum, ['in-process', 'auto', 'tmux', 'iterm2']);
  assert.equal(f.teammateMode.default, '"in-process"');
  assert.equal(f.teammateMode.since, '');
  assert.equal(f.maxEffortLevel.scope, 'managed');
  assert.deepEqual(f.maxEffortLevel.enum, ['low', 'medium', 'high', 'xhigh', 'max']);
  assert.equal(f.maxEffortLevel.since, '2.1.267');
  assert.deepEqual(f.maxEffortLevel.env, ['CLAUDE_CODE_EFFORT_LEVEL']);
  assert.equal(f['permissions.defaultMode'].scope, 'user-managed');
});

test('buildMap merges schema text with reference facts and flags provenance', () => {
  const map = gen.buildMap(SCHEMA, gen.parseReference(REF), { schemaVersion: '2.1.219' });
  assert.equal(map.meta.schemaVersion, '2.1.219');
  assert.ok(!('$schema' in map.keys));
  const tm = map.keys.teammateMode;
  assert.equal(tm.inSchema, true); assert.equal(tm.inReference, true);
  assert.equal(tm.desc, 'How teammates display. See https://x');
  assert.deepEqual(tm.enum, ['in-process', 'auto', 'tmux', 'iterm2']); // reference wins
  assert.equal(map.keys.includeCoAuthoredBy.deprecated, true);
  assert.equal(map.keys.onlyInSchema.inReference, false);
  assert.equal(map.keys.onlyInSchema.default, '5');
  assert.equal(map.keys.onlyInSchema.scope, 'unknown');
  assert.equal(map.keys.maxEffortLevel.inSchema, false);
  assert.equal(map.keys.maxEffortLevel.desc, '');
});

test('renderBlock escapes closing tags and injectBlock replaces between markers', () => {
  const map = { meta: { schemaVersion: '1' }, keys: { a: { desc: 'x </script> y' } } };
  const block = gen.renderBlock(map);
  assert.ok(block.startsWith(gen.START));
  assert.ok(block.trimEnd().endsWith(gen.END));
  assert.ok(!block.includes('</script>'));
  assert.ok(block.includes('<\\/script>'));
  const html = 'a\r\n      ' + gen.START + '\r\n      const SCHEMA_MAP = {};\r\n      ' + gen.END + '\r\nb\r\n';
  const out = gen.injectBlock(html, block);
  assert.ok(out.includes('"schemaVersion":"1"'));
  assert.ok(!out.includes('const SCHEMA_MAP = {};'));
  assert.ok(out.startsWith('a\r\n'), 'keeps CRLF');
  assert.ok(!/[^\r]\n/.test(out), 'no bare LF left');
  assert.throws(() => gen.injectBlock('no markers here', block), /marker/);
});

test('schemaVersionOf picks the highest v2.x.y marker', () => {
  assert.equal(gen.schemaVersionOf('added in v2.1.111 and v2.1.219, before v2.1.9'), '2.1.219');
  assert.equal(gen.schemaVersionOf('none'), '');
});

test('enum is only harvested from closed sets, not from example values', () => {
  const md = `# Settings reference

### \`language\`

Pick a language.

* **Scope**: [\`Any file\`](#scopes)
* **Type**: string, any language name, such as \`"japanese"\`, \`"spanish"\`
* **Default**: unset

### \`pair\`

Two choices.

* **Scope**: [\`Any file\`](#scopes)
* **Type**: string, either \`"a"\` or \`"b"\`
* **Default**: \`"a"\`
`;
  const f = gen.parseReference(md);
  assert.deepEqual(f.language.enum, []);
  assert.deepEqual(f.pair.enum, ['a', 'b']);
});

test('a closed set inside an object type belongs to the nested field, not to the key', () => {
  const md = `# Settings reference

### \`modelSettings\`

Save an effort level per model.

* **Scope**: [\`Any file\`](#scopes)
* **Type**: object mapping a model name to an object with an \`effortLevel\` field, one of \`"low"\`, \`"medium"\`
* **Default**: unset
`;
  const f = gen.parseReference(md);
  assert.equal(f.modelSettings.type, 'object');
  assert.deepEqual(f.modelSettings.enum, []);
});

test('a leading Removed/Deprecated warning marks the key deprecated; a later mention does not', () => {
  const md = `# Settings reference

### \`taskOutputMaxChars\`

<Warning>
  Removed in v2.1.277, together with the \`TaskOutput\` tool it sized. Setting it has no effect on current versions.
</Warning>

Through v2.1.276, you set this key to the number of characters.

### \`voiceEnabled\`

<Warning>
  Deprecated since v2.1.92, when the voice object replaced it. Claude Code still reads it.
</Warning>

* **Scope**: [\`Any file\`](#scopes)
* **Type**: Boolean

### \`fastMode\`

Enable fast mode. The older opus-only setting was removed in v2.1.100.

<Warning>
  Fast mode bills to usage credits.
</Warning>

* **Scope**: [\`Any file\`](#scopes)
* **Type**: Boolean
`;
  const f = gen.parseReference(md);
  assert.equal(f.taskOutputMaxChars.deprecated, true);
  assert.equal(f.voiceEnabled.deprecated, true);
  assert.equal(f.fastMode.deprecated, false);
  const map = gen.buildMap({ properties: {} }, f, {});
  assert.equal(map.keys.taskOutputMaxChars.deprecated, true);
  assert.equal(map.keys.fastMode.deprecated, false);
});

test('parseOverrides: env variables from the per-session overrides line, with their relation to the key', () => {
  const p = gen.parseOverrides;
  assert.deepEqual(p("* **Per-session overrides**: `--effort` takes precedence over this key for one session, and [`CLAUDE_CODE_EFFORT_LEVEL`](/docs/en/env-vars) takes precedence over both"),
    [{ env: 'CLAUDE_CODE_EFFORT_LEVEL', kind: 'precedence' }]);
  assert.deepEqual(p("* **Per-session overrides**: [`CLAUDE_CODE_DISABLE_FAST_MODE`](/docs/en/env-vars) turns fast mode off for one session, and this key can't turn it back on"),
    [{ env: 'CLAUDE_CODE_DISABLE_FAST_MODE', kind: 'off' }]);
  assert.deepEqual(p("* **Per-session overrides**: [`FORCE_PROMPT_CACHING_5M`](/docs/en/env-vars) takes precedence over everything else, then [`CLAUDE_CODE_PROMPT_CACHE_TTL`](/docs/en/env-vars), then this key, and last [`ENABLE_PROMPT_CACHING_1H`](/docs/en/env-vars)"),
    [{ env: 'FORCE_PROMPT_CACHING_5M', kind: 'precedence' }, { env: 'CLAUDE_CODE_PROMPT_CACHE_TTL', kind: 'precedence' }]);
  assert.deepEqual(p("* **Per-session overrides**: `--advisor` takes precedence over this key for one session. [`CLAUDE_CODE_DISABLE_ADVISOR_TOOL`](/docs/en/env-vars) turns the advisor off, and this key can't turn it back on"),
    [{ env: 'CLAUDE_CODE_DISABLE_ADVISOR_TOOL', kind: 'off' }]);
  assert.deepEqual(p("* **Per-session overrides**: [`CLAUDE_CODE_NO_FLICKER`](/docs/en/env-vars) and [`CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN`](/docs/en/env-vars) take precedence over this key for one session: `CLAUDE_CODE_NO_FLICKER=1` turns fullscreen on, and `CLAUDE_CODE_NO_FLICKER=0` or `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1` turns it off; when both are set, Claude Code turns it off"),
    [{ env: 'CLAUDE_CODE_NO_FLICKER', kind: 'precedence' }, { env: 'CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN', kind: 'precedence' }]);
  assert.deepEqual(p("* **Per-session overrides**: `--model` takes precedence over [`ANTHROPIC_MODEL`](/docs/en/env-vars), and both take precedence over this key for one session, including over a managed `model`; an [`availableModels`](#availablemodels) list still applies to the pick"),
    [{ env: 'ANTHROPIC_MODEL', kind: 'precedence' }]);
  assert.deepEqual(p("* **Per-session overrides**: [`CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL`](/docs/en/env-vars) set to `1` skips the install for one session even when this key is `true`"),
    [{ env: 'CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL', kind: 'off', when: '1' }]);
  assert.deepEqual(p("* **Per-session overrides**: [`ENABLE_CLAUDEAI_MCP_SERVERS`](/docs/en/env-vars) set to `false` turns connectors off for one session; whichever of the two turns them off, the other can't turn them back on"),
    [{ env: 'ENABLE_CLAUDEAI_MCP_SERVERS', kind: 'off', when: 'false' }]);
  assert.deepEqual(p("* **Per-session overrides**: `--agent` takes precedence over this key for one session"), []);
  assert.deepEqual(p(''), []);
});

test('parseReference and buildMap carry overrides', () => {
  const md = `# Settings reference

### \`fastMode\`

Enable fast mode.

* **Scope**: [\`Any file\`](#scopes)
* **Type**: Boolean
* **Default**: unset
* **Per-session overrides**: [\`CLAUDE_CODE_DISABLE_FAST_MODE\`](/docs/en/env-vars) turns fast mode off for one session, and this key can't turn it back on
`;
  const f = gen.parseReference(md);
  assert.deepEqual(f.fastMode.overrides, [{ env: 'CLAUDE_CODE_DISABLE_FAST_MODE', kind: 'off' }]);
  const map = gen.buildMap({ properties: { other: { type: 'string' } } }, f, {});
  assert.deepEqual(map.keys.fastMode.overrides, [{ env: 'CLAUDE_CODE_DISABLE_FAST_MODE', kind: 'off' }]);
  assert.deepEqual(map.keys.other.overrides, []);
});
