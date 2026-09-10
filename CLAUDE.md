# Claude Settings Editor

GUI-Editor für Claude Code `settings.json`-Dateien. Erklärt jede Einstellung auf Deutsch (UI ist mehrsprachig), erlaubt visuelles Bearbeiten statt Roh-JSON und schreibt die Datei direkt über die File System Access API zurück.

## Stack & Struktur
- **Single-File-App**: `claude-settings-editor.html` — kein Build, kein Server, kein `package.json`. Tailwind CSS via CDN, Alpine.js 3.14 (Reaktivität), JetBrains Mono + DM Sans.
- `open-editor.py` / `open-editor.bat` — Companion-Script, findet User-/Project-/Local-`settings.json` automatisch und öffnet den Editor pre-loaded (Priorität: Local > Project > User > Defaults).
- `docs/plans/` — Design-/Feature-Abgleich-Dokumente (kein Code).
- `logo.svg`, `README.md`.

## Kommandos
- **Öffnen (manuell):** `claude-settings-editor.html` in einem Chromium-Browser öffnen (File System Access API braucht Chromium — Firefox/Safari nicht voll unterstützt).
- **Öffnen (Auto-Detect):** `python open-editor.py`
- Kein Build/Test/Lint-Tooling vorhanden — Änderungen direkt im Browser verifizieren (Live-Reload durch Neuladen der HTML-Datei).
- **Tests:** `node --test tools/*.test.js` (Node 26, node:test)
- **Selbst-Check:** `node tools/self-check.js` (Exit 1 bei harten Befunden — vor jedem Commit)
- **Schema-Extrakt erneuern:** `node tools/build-schema-map.js --fetch` (schreibt SCHEMA_MAP in die HTML; `tools/sources/settings-reference.md` bleibt gitignored)

## Constraints & Gotchas
- **16 Tabs, 6 Sprachen (de, en, es, fr, ja, pt):** jedes neue User-facing Text-Element braucht einen Key im `T`-Objekt in **allen** 6 Sprachen — nicht nur Deutsch.
- **Jedes neue Setting braucht 4 Stellen:** `defaultSettings()`, `cleanJson()`, `loadJson()`, `knownKeys` — sonst wird es beim Export/Import silent gedroppt (bereits mehrfach passiert, z. B. `env`-Vars, `cleanupPeriodDays`).
- **Boolean-Export-Falle:** Settings mit Default `false` (z. B. `spinnerTipsEnabled`, `showTurnDuration`) müssen bei `true` exportiert werden, nicht invertiert — war ein wiederkehrender Bug.
- **Alpine.js-Reaktivität:** kein `delete`-Operator auf reaktiven Objekten verwenden — Object-Reassign-Pattern nutzen, sonst bricht die Reaktivität.
- **Roundtrip-Sicherheit:** unbekannte/fremde Properties aus importierten `settings.json`-Dateien werden über `_extraProps` erhalten, nicht verworfen — beim Ändern der Import/Export-Logik darauf achten.
- **Permission-Mode-Werte sind Breaking-Change-anfällig:** Claude Code hat `allowPrompt`→`default`, `acceptAll`→`bypassPermissions` umbenannt — bei neuen Claude-Code-Releases aktiv auf weitere Wert-Änderungen prüfen (nicht raten, gegen offizielles JSON-Schema `json.schemastore.org/claude-code-settings.json` verifizieren).
- **Model-Liste/-Beschreibungen veralten schnell** (Claude-Releases sind schneller als der Editor) — vor jedem Feature-Update aktiv nach aktuellen Modell-IDs/Aliasen recherchieren, nicht aus altem Wissen übernehmen.
- Bei größeren Feature-Batches hat sich das Muster HIVE-Schwarm (Recherche/Bau parallel) + abschließende SENTINEL/Code-Review-Runde bewährt.
- **Schema hinkt dem Changelog hinterher** (09/2026: Schema 2.1.219, Changelog 2.1.267): neue Keys wie `maxEffortLevel`/`modelSettings` stehen nur im Changelog (`raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md`) — beide Quellen diffen, nicht nur das Schema.
- **Erfundene Keys nicht stillschweigend behalten:** `legacyKeys` in `loadJson()` listet Schlüssel, die der Editor früher schrieb, Claude Code aber nie las (`releaseChannel`, `fileSuggestions`, `autoDreamEnabled`, `teamateMode`). Sie werden beim Import mit Hinweis verworfen statt über `_extraProps` zurückgeschrieben; Wert-Migrationen (Typo, Groß-/Kleinschreibung) direkt daneben.
- **Datei ist durchgehend CRLF** — Patch-Skripte erst normalisieren (LF), am Ende zurück; `grep -c` zählt Zeilen, nicht Vorkommen (`grep -o | wc -l`).
- **Neue Keys:** zusätzlich zu den 4 Stellen muss der Key in SCHEMA_MAP existieren (sonst schlägt self-check an) — erfundene Keys fallen damit auf.

Status & offene Aufgaben: siehe Obsidian-Note 01 - PROJECTS/In Progress/claude-settings-editor.md
