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
