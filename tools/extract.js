// tools/extract.js — pulls testable pieces out of the single-file app without a browser
'use strict';
const fs = require('fs');
const path = require('path');
const HTML = path.join(__dirname, '..', 'claude-settings-editor.html');

function loadHtml() {
  const html = fs.readFileSync(HTML, 'utf8');
  return { html, lf: html.replace(/\r\n/g, '\n') };
}

// A top-level function in the script is indented by 4 spaces and closes with "    }" on its own line,
// or is a one-liner "    function name(...) { ... }".
function extractFunction(lf, name) {
  const re = new RegExp('^    function ' + name + '\\([^)]*\\) \\{(?:[^\\n]*\\}[ \\t]*$|[\\s\\S]*?\\n    \\})', 'm');
  const m = lf.match(re);
  if (!m) throw new Error('function ' + name + ' not found (missing)');
  return new Function(m[0] + '\nreturn ' + name + ';')();
}

function extractSchemaMap(lf) {
  const m = lf.match(/\/\/ @@SCHEMA_MAP_START[^\n]*\n[ \t]*const SCHEMA_MAP = ([\s\S]*?);\n[ \t]*\/\/ @@SCHEMA_MAP_END/);
  if (!m) throw new Error('SCHEMA_MAP block not found');
  return JSON.parse(m[1].replace(/<\\\//g, '</'));
}

// Each language value is a JS string literal in single OR double quotes (11 existing lines use
// fr: "…d'environnement" to avoid escaping the apostrophe); both forms must parse.
function extractT(lf) {
  const T = {};
  const V = `('(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*")`;
  const re = new RegExp(`^\\s*'([^']+)': \\{ de: ${V}, en: ${V}, es: ${V}, fr: ${V}, ja: ${V}, pt: ${V} \\},?$`, 'gm');
  const unq = (s) => s.slice(1, -1).replace(/\\(['"\\])/g, '$1');
  let m;
  while ((m = re.exec(lf))) T[m[1]] = { de: unq(m[2]), en: unq(m[3]), es: unq(m[4]), fr: unq(m[5]), ja: unq(m[6]), pt: unq(m[7]) };
  return T;
}

module.exports = { HTML, loadHtml, extractFunction, extractSchemaMap, extractT };
