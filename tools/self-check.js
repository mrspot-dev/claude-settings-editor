#!/usr/bin/env node
// tools/self-check.js — the doctor applied to the editor itself (spec 3.4): the four places per key,
// knownKeys against SCHEMA_MAP, i18n completeness, groups without a description, transliteration suspects.
// umlaut-guard:allow — the transliteration check below has to spell out the ae/oe/ue pattern it hunts for.
'use strict';
const ex = require('./extract.js');

const EDITOR_ONLY_KEYS = ['mcpServers']; // deliberately editable here, explained in the MCP tab, not an official settings.json key
const DYNAMIC_PREFIXES = ['data.', 'design.', 'terminal.', 'builder.'];

function section(lf, startRe, endRe) {
  const s = lf.search(startRe); if (s < 0) return '';
  const rest = lf.slice(s); const e = rest.search(endRe);
  return e < 0 ? rest : rest.slice(0, e);
}

function selfCheck(lf) {
  const hard = [], soft = [];
  const defaults = ex.extractFunction(lf, 'defaultSettings')();
  const defaultKeys = Object.keys(defaults);
  const load = section(lf, /^\s*loadJson\(text\) \{/m, /^\s*cleanJson\(/m);
  const clean = section(lf, /^\s*cleanJson\(settingsOverride\) \{/m, /^\s*\},\s*$/m);
  const knownBlock = (load.match(/const knownKeys = new Set\(\[([\s\S]*?)\]\)/) || ['', ''])[1];
  const known = [...knownBlock.matchAll(/'([^']+)'/g)].map(m => m[1]);
  for (const key of defaultKeys) {
    if (!new RegExp('data\\.' + key + '\\b').test(load)) hard.push(`${key}: not read in loadJson`);
    if (!new RegExp('\\b(?:s|out)\\.' + key + '\\b').test(clean)) hard.push(`${key}: not written in cleanJson`);
    if (!known.includes(key)) hard.push(`${key}: missing in knownKeys`);
  }
  for (const key of known) if (!defaultKeys.includes(key)) hard.push(`${key}: in knownKeys but not in defaultSettings`);
  const map = ex.extractSchemaMap(lf);
  for (const key of known) if (!map.keys[key] && !EDITOR_ONLY_KEYS.includes(key)) hard.push(`${key}: in knownKeys but unknown to SCHEMA_MAP (not an official key?)`);
  const T = ex.extractT(lf);
  const rawLines = lf.match(/^\s*'[^']+': \{ de: /gm) || [];
  if (rawLines.length !== Object.keys(T).length) hard.push(`i18n: ${rawLines.length - Object.keys(T).length} T lines do not carry all six languages`);
  const used = new Set([...lf.matchAll(/\bt(?:d)?\((?:this\.)?'([a-zA-Z0-9_.]+)'/g)].map(m => m[1]));
  // td('data.template.' + tpl.id + '.name', tpl.name) leaves the literal head 'data.template.' in the source.
  // A key literal ending in a dot is always such a head (no real T key ends in one), so it is not a missing key.
  const isDynamicHead = (k) => k.endsWith('.') && DYNAMIC_PREFIXES.some(p => k.startsWith(p));
  for (const k of used) if (!T[k] && !isDynamicHead(k)) hard.push(`i18n: ${k} used but not defined in T`);
  for (const [k, v] of Object.entries(T)) if (/\b[a-zäöüß]*(ae|oe|ue)[a-zäöüß]*\b/i.test(v.de) && !/[äöüÄÖÜ]/.test(v.de)) soft.push(`i18n: ${k} de looks transliterated (no Umlaut, has ae/oe/ue): ${v.de.slice(0, 40)}`);
  const groups = [...lf.matchAll(/<div id="(setting-[^"]+)" class="settings-group"[\s\S]*?(?=<div id="setting-|<\/script>|$)/g)];
  for (const g of groups) if (!/class="setting-desc"/.test(g[0])) soft.push(`${g[1]}: settings-group without setting-desc`);
  return { hard, soft, stats: { defaultKeys: defaultKeys.length, knownKeys: known.length, tKeys: Object.keys(T).length, mapKeys: Object.keys(map.keys).length, groups: groups.length } };
}

module.exports = { selfCheck, EDITOR_ONLY_KEYS };
if (require.main === module) {
  const r = selfCheck(ex.loadHtml().lf);
  console.log('stats', r.stats);
  for (const h of r.hard) console.log('HARD ', h);
  for (const s of r.soft) console.log('soft ', s);
  console.log(`${r.hard.length} hard, ${r.soft.length} soft`);
  process.exit(r.hard.length ? 1 : 0);
}
