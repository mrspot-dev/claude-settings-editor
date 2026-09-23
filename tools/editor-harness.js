// tools/editor-harness.js — runs the editor's real methods (loadJson, cleanJson, validateSettings, …) in Node.
// Every top-level helper the methods call must be listed in FUNCS; a missing one throws only when called,
// so a test fails at the behaviour it checks rather than at load time.
'use strict';
const ex = require('./extract.js');
const { lf } = ex.loadHtml();

const FUNCS = ['defaultSettings', 'attributionFromFile', 'attributionToFile', 'overlayOwned', 'deprecatedKeyFix',
  'opus55EffortHint', 'levenshtein', 'nearestKey', 'doctorFindings', 'keyFacts', 'factDefault', 'envConflicts',
  'extraFields', 'extraTopKeys', 'getPath', 'setPath', 'deletePath', 'readExtras', 'applyExtras', 'extraToggleNext',
  'parseExtraInput', 'extraDisplay', 'autoModeIgnoredHere'];

globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.SCHEMA_MAP = ex.extractSchemaMap(lf);
for (const fn of FUNCS) {
  try { globalThis[fn] = ex.extractFunction(lf, fn); } catch (e) { globalThis[fn] = () => { throw e; }; }
}
const makeEditor = ex.extractFunction(lf, 'settingsEditor');

function editor() {
  const app = makeEditor();
  app.settings = globalThis.defaultSettings();
  app.notes = [];
  app.notify = (m) => app.notes.push(m);
  app.t = (k) => k;
  return app;
}

module.exports = { lf, editor };
