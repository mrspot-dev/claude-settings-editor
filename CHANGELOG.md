# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
