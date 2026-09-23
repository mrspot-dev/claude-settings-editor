# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.8.1] — 2026-09-23

### Fixed
- A rejected entry in one of the new fields (not a number, invalid JSON) keeps its text and hint until that field's value changes. Before, editing any other new field or switching the language silently put the old value back and hid the hint. The hint now follows the interface language.
- The doctor reports nested keys that only act from managed settings, such as `sandbox.bwrapPath` or `sandbox.network.allowManagedDomainsOnly`, when they sit in a user or project file.
- Choosing auto mode in the setup wizard lifts a `permissions.disableAutoMode` lock, as the Auto Mode preset already did.
- The managed-file switch tells screen readers that it is disabled for a file named `managed-settings.json`, and it does nothing while no file is open.

## [1.8.0] — 2026-09-23

Managed tab and auto mode up front (design docs/specs/2026-09-23-v18-managed-tab-design.md).

### Added
- **Managed tab** for the 31 keys that only take effect from managed settings (`managed-settings.json`, `managed-settings.d/`, MDM or server-managed): lockdown switches, plugin and channel policy, login gateway and version bounds, policy helper and source behaviour, desktop and browser limits, contracted model pricing, sandbox binary paths. A banner says where these keys act and lists the system directories. A switch marks the open file as managed: automatic for `managed-settings.json`, by hand for a drop-in with another name. In a managed file the doctor no longer reports these keys as having no effect.
- **Fourteen keys in their subject tabs** that also work from the user file, each with a scope badge: `modelPicker`, `vimInsertModeRemaps`, `askUserQuestionTimeout`, `dialogExpiry`, `footerLinksRegexes`, `spellcheck`, `autoContinueAtUsageLimit`, `desktopSessionCleanupPeriodDays`, `feedbackDrafts`, `processWrapper`, `sshConfigs`, `pluginConfigs`, `skipAutoPermissionPrompt`, `useAutoModeDuringPlan`.
- **Auto Mode preset**, first and marked as recommended: `defaultMode: "auto"`, no allow or ask rules (auto mode sets broad allow rules aside, and ask rules would still prompt), the Safety First deny list. The setup wizard offers auto mode first. The Permissions tab groups the auto mode settings and says that `auto` only acts from `~/.claude/settings.json`; the doctor warns when it sits in `settings.local.json`.
- Fact sheets in the Memory tab and at `ultracode`.

### Changed
- All 45 new fields come from one list, so loading, saving, the known-key list, the search index and the self-check cannot drift apart for them.

### Removed
- The Auto Dream section of the Memory tab and the `/dream` tip: neither the settings reference nor the Claude Code changelog knows them. An imported `autoDreamEnabled` is still dropped with a notice.

## [1.7.0] — 2026-09-23

Explanation layer and env conflicts (design 2026-08-03, sections 3.3 and 3.6).

### Added
- Every setting in the General, Permissions, Sandbox, Display, Attribution and Advanced tabs has a collapsible "Details and facts" block: where the key applies, type, allowed values, default, environment variables that override it or can switch it off, the SchemaStore description (English, Apache-2.0) and a link to the Claude Code settings reference. Rendered as text only; nothing from the schema is parsed as markup.
- The Environment tab reports when a variable in the `env` block overrides a key set in the same file (for example `CLAUDE_CODE_EFFORT_LEVEL` over `effortLevel`) or can switch its feature off (for example `CLAUDE_CODE_DISABLE_FAST_MODE` against `fastMode`). An empty value, the documented way to cancel a shell export, is not reported, and a variable that only acts with a specific value (for example `ENABLE_CLAUDEAI_MCP_SERVERS` set to `false`) is reported only with that value.
- `SCHEMA_MAP` records these overrides per key, read from the settings reference's "Per-session overrides" line; CLI flags and variables ranked below the key are left out.

### Changed
- Fourteen setting descriptions rewritten to say what the setting does, in all six languages.

## [1.6.2] — 2026-09-23

Share and bundle keep unknown keys at home, and an explicit sandbox off switch survives.

### Fixed
- **Share URL and settings bundle carried keys the settings reference does not know.** Since 1.4 both leave out `env`, but unknown top-level keys went along untouched, and such a key can hold a token as easily as `env` can. They are now left out as well, and the notice names them. Keys the reference documents but the editor has no field for (for example `autoCompactEnabled`) are still shared.
- **An explicit `"sandbox": { "enabled": false }` was dropped on save.** It is not the same as a missing key: in a project or local file it switches off a sandbox that a lower layer turns on. A `false` read from the file is now written back. Turning the sandbox off in the editor after it was on still removes the key, as before.

### Removed
- `fileScope`, a leftover of the removed file scope badge: it was set in three places and read nowhere.

## [1.6.1] — 2026-09-23

Security-relevant round-trip fix for `permissions`, `sandbox` and `statusLine`.

### Fixed
- **Sub-keys the editor has no control for were dropped on save.** The editor rebuilt `permissions`, `sandbox` and `statusLine` from the few fields it edits, so every other sub-key disappeared: among them `permissions.blockReadsOutsideWorkingDirectories`, `sandbox.failIfUnavailable`, `sandbox.network.deniedDomains`, `sandbox.network.strictAllowlist`, `sandbox.filesystem.allowManagedReadPathsOnly`, `sandbox.credentials` and `sandbox.excludedCommands`. A saved file could end up with a weaker sandbox than the one it was opened with. The export now starts from the imported object and only overlays the fields the editor edits; turning a field off in the editor still removes it.
- `sandbox.mode` (`restrict`/`monitor`) is gone. No Claude Code version reads it; the editor invented it in 1.2. An imported value is dropped with a notice, and the file is marked unsaved.

### Added
- `tools/roundtrip.test.js`: every nested key the settings reference documents goes through load and save and must come out unchanged; runs `loadJson`/`cleanJson` in Node without a browser.

## [1.6.0] — 2026-09-23

Attribution round trip and safer doctor fixes for deprecated keys.

### Fixed
- **`attribution` was lost on save.** Empty `commit`/`pr` strings (the documented way to hide attribution) and `sessionUrl` were dropped on export, so a file that hid attribution came back without the block and Claude Code added the co-author trailer again. Hidden parts, `sessionUrl` and unknown sub-keys now survive the round trip. The bug dates back to the first version.
- The doctor fix for deprecated keys no longer deletes keys that Claude Code still reads without keeping their effect: `disableArtifact: true` becomes `enableArtifact: false`, and `includeCoAuthoredBy: false` becomes `attribution` with empty `commit` and `pr` (unless `attribution` already sets one of them). Keys without effect are still removed.
- The deprecated-key message no longer claims the schema as its source, since most such keys now come from the settings reference.

### Added
- Attribution tab: a "hide" checkbox for the commit and the PR text (an empty field still means Claude Code's default text), and a switch for the claude.ai session link in commits (`attribution.sessionUrl`).

### Changed
- README tab overview: removed the release channel (gone since 1.3.2), added the Bash edit diff and the new attribution options.

## [1.5.0] — 2026-09-23

Claude Opus 5.5 and Fable 5.1 (Claude Code 2.1.280), plus the rest of the changelog since 2.1.267.

### Added
- Doctor hint with one-click fix: a top-level `effortLevel` no longer applies to Opus 5.5 when it sits in the user settings file (2.1.280). The fix copies the level into `modelSettings["claude-opus-5-5"]`. The browser can't tell which file is open, so the hint is an info finding worded conditionally.
- `bashEditDiffEnabled` (2.1.269) in the Advanced tab as a three-way choice: unset (auto and bypass mode only), on in every mode, off.
- Environment suggestions `ANTHROPIC_DEFAULT_OPUS_MODEL` and `ANTHROPIC_DEFAULT_FABLE_MODEL`.
- `claude-opus-5-5` and `claude-mythos-5-1` accepted as model IDs.

### Changed
- Model texts in all six languages: `opus` and the account default resolve to Opus 5.5 on every plan, including Pro and Team Standard; Opus 5.5 defaults to effort `medium`; `fable` resolves to Fable 5 in Claude apps gateway sessions.
- Fast mode description corrected: same model and quality, only faster output at a higher price (Opus 5.5: $8/$40 per MTok), runs on Opus 5.5, Opus 5 and Opus 4.8, on subscription plans only through usage credits. The old text claimed less detail.
- Voice now writes the `voice` object. An imported `voiceEnabled` (deprecated since 2.1.92) is moved into `voice.enabled` with a notice; `voice.enabled` wins when both are set, and `mode`/`autoSubmit` survive the round trip.
- `SCHEMA_MAP` regenerated (234 keys, reference of 2026-09-22).

### Fixed
- The generator now recognises keys the reference marks as removed or deprecated through a leading warning block. Seven keys are flagged instead of one, among them `taskOutputMaxChars` (removed in 2.1.277), `teammateDefaultModel` and `voiceEnabled`. Only a warning that opens the section counts, so a later mention can't flag a key.

## [1.4] — 2026-09-10

Data layer and doctor (design 2026-08-03, part A).

### Added
- Embedded `SCHEMA_MAP`: facts for every official settings key — scope, type, allowed values, default, minimum version, environment variable — generated by `tools/build-schema-map.js` from the SchemaStore schema (Apache-2.0, descriptions embedded) and the Claude Code settings reference (facts only). Stand shown in the Advanced tab.
- Settings doctor: unknown keys with a "did you mean" suggestion, deprecated keys, wrong types, values outside the allowed set, keys that only take effect from managed settings, and a hint for `mcpServers`. Every finding offers a one-click fix; nothing is changed automatically.
- The validation banner lists up to three findings for the active tab with their fix links; further findings appear once the first ones are resolved.
- Sync button: fetches the current schema on click, reports new and removed keys, shows failures as failures.
- `tools/self-check.js`: checks the editor itself — every key wired through all four places, `knownKeys` against `SCHEMA_MAP`, i18n completeness, groups without description, transliteration suspects.

### Fixed
- Share URL and bundle export no longer include the `env` block and refuse `settings.local.json`.
- `env` was emitted twice in the export path.

## [1.3.3] — 2026-09-10

Effort keys that the Claude Code changelog (2.1.251 / 2.1.267) introduced after the SchemaStore schema (2.1.219) was last updated.

### Added
- `maxEffortLevel` — caps the effort of every session on every provider; lower levels stay available, `max` means no cap
- `modelSettings` — per-model `effortLevel` and `maxEffortLevel`, the object Claude Code writes when you confirm a level with `/effort`; rows with two selects per model
- `ultracode` — start sessions at `xhigh` with ultracode on
- Validation for the cap enum and for each `modelSettings` entry; search entries for both groups
- Effort description now states that `max` is session-only and that a `modelSettings` entry beats the global level

## [1.3.2] — 2026-09-10

Alignment with the official settings schema (schemastore, state 2.1.219) and the Claude Code docs (2.1.267).

### Fixed
- `teamateMode` typo (10 occurrences) — the exported key never matched the real `teammateMode`, so the setting was silently ignored
- `fileSuggestions` (plural, with `enable`/`exclude`) was invented; replaced by the real `fileSuggestion` `{ type: "command", command }` with a single script input
- Output styles: `verbose`, `formal` and `casual` never existed; the real built-ins are `Proactive`, `Concise` (2.1.237+), `Explanatory` and `Learning`, capitalised as documented. Lowercase legacy values are migrated on import.
- `releaseChannel` and `autoDreamEnabled` removed — neither exists in Claude Code (`autoUpdatesChannel` is the real update-channel key and was already present)
- Obsolete keys found in an imported file are dropped with a notice instead of being round-tripped; the file is marked unsaved so the next save writes the cleaned version

### Added
- Model list: Fable 5.1 (`fable` alias resolves to it since 2.1.257), `claude-fable-5-1`, `fable[1m]`, `opusplan[1m]`
- Permission modes `manual` (alias of `default` since 2.1.200) and `delegate` (agent team leads, experimental)
- `teammateMode`: `iterm2` option, explicit "default (in-process)" entry instead of a hard-coded `auto`
- Hook event `DirectoryAdded`
- Note in the MCP tab that `mcpServers` lives in `.mcp.json` / `~/.claude.json`, not in `settings.json`

## [1.3.1] — 2026-08-03

### Fixed
- Version line was hard-coded to v1.2 and never read the maintained i18n key
- Opus 5 added to model descriptions and `validModels`
- Favicon from `logo.svg`

## [1.3] — 2026-07-14

### Changed
- Model list rebuilt: Fable 5, Opus 4.8, Opus 4.7, Sonnet 5, Haiku 4.5, plus the aliases `best`, `fable`, `default` and the `[1m]` variants
- Hook event list aligned with the 30 official events
- MCP presets corrected — `github`, `slack` and `linear` are remote HTTP servers, `postgres`/`sqlite` now use `@bytebase/dbhub`, Playwright uses `@playwright/mcp`, `puppeteer` removed. Three previously listed packages never existed.
- Effort level: added `xhigh` as a fourth step; `high` remains the default

### Added
- Settings keys `fallbackModel`, `enforceAvailableModels`, `autoMode.classifyAllShell` and the marketplace trio (`strictKnownMarketplaces`, `blockedMarketplaces`, `pluginSuggestionMarketplaces`)
- Hook handler type `mcp_tool` (server / tool / input)
- Fable in the setup wizard
- Hint box pointing to the built-in `/config` command

### Fixed
- Alpine silently refuses to run handlers containing `try` statements in attribute expressions. Moving them into methods also repaired the `extraKnownMarketplaces` editor, broken since 1.1.
- Removed a dead `x-bind:lang` on `<html>` that threw a ReferenceError on every load

## [1.2] — 2026-03-30

### Added
- Seven General settings: `fastMode`, `voiceEnabled`, `editorMode`, `theme`, `releaseChannel`, `fileSuggestions`, `modelOverrides`
- Hook system: 13 new events (25 total), handler types `prompt` and `agent`, fields `if` and `shell`
- Sandbox `mode` and `allowRead`, `permissions.disableAutoMode`, `allowedEnvVars` for HTTP/SSE MCP servers
- Companion script `open-editor.py` / `open-editor.bat` — finds user, project and local `settings.json` and opens the editor preloaded
- Privacy & Telemetry section and Memory History (`cleanupPeriodDays`)

### Security
- Prototype pollution guard on import
- Origin check for auto-import from the URL hash
- SRI hashes for the Alpine.js CDN scripts

### Fixed
- Boolean roundtrip: `spinnerTipsEnabled` and `showTurnDuration` were exported inverted
- Environment variables were silently dropped during export

## [1.1] — 2026-03-29

### Added
- Settings `autoDreamEnabled`, `skipDangerousModePermissionPrompt`, `extraKnownMarketplaces`
- Four MCP quick-add presets (14 total)
- Around 38 plugin entries, bringing the list past 80

### Changed
- Model descriptions updated to the Claude 4.6 generation

## [1.0] — 2026-03-25

First public version.

- 15 tabs covering general settings, permissions, skills and plugins, hooks, MCP servers, sandbox, environment, display, attribution, advanced, memory, terminal prompts, companion tools, design prompts and a CLAUDE.md builder
- Six languages (de, en, es, fr, ja, pt)
- Reads and writes `settings.json` directly through the File System Access API
- Live JSON preview, diff view, undo/redo, global search, guided setup wizard
- Real-time validation and permission conflict detection
- Drag and drop for permission rules, hook groups and path lists
- Import and export of bundles containing settings, templates and spinner packs

[1.3]: https://github.com/mrspot-dev/claude-settings-editor/releases/tag/v1.3
[1.2]: https://github.com/mrspot-dev/claude-settings-editor/releases/tag/v1.2
[1.1]: https://github.com/mrspot-dev/claude-settings-editor/releases/tag/v1.1
[1.0]: https://github.com/mrspot-dev/claude-settings-editor/releases/tag/v1.0
