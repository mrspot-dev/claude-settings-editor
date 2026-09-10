# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
