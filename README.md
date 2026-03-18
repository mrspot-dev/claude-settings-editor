# Claude Settings Editor

A visual GUI editor for Claude Code `settings.json` files. Single standalone HTML file — no build step, no server, no dependencies to install. Just open and edit.

![HTML](https://img.shields.io/badge/HTML-single%20file-orange)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-CDN-06B6D4)
![Alpine.js](https://img.shields.io/badge/Alpine.js-3.14-8BC0D0)
![License](https://img.shields.io/badge/license-MIT-green)

## Quick Start

1. Download `claude-settings-editor.html`
2. Open in any Chromium browser (Chrome, Edge, Arc)
3. Click **Open** or **Auto-Detect** to load your `settings.json`
4. Edit visually, then **Save** back to disk

> Uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) for direct read/write. Works best in Chromium-based browsers.

## Features

### Core
- **12 Tabs** covering every `settings.json` option with German explanations
- **Live JSON Preview** — see the output as you edit
- **File System Access API** — open and save `settings.json` directly (no copy-paste)
- **Auto-Detect** — point to your home or project folder, finds `.claude/settings.json` automatically
- **File Scope Indicator** — shows whether you're editing a Global or Project config
- **Templates** — built-in presets + save/load your own custom templates
- **Import/Export Bundles** — backup settings + templates + spinner packs as a single JSON file
- **Share via URL** — Base64-encoded settings in the URL hash for easy sharing

### Tabs

| Tab | What it covers |
|-----|----------------|
| General | Model, effort level, output style, language, thinking mode |
| Permissions | Allow/Ask/Deny rules, default mode, presets, conflict detection |
| Skills & Plugins | Toggle plugins with categories, search, availability badges |
| Hooks | Event-based automation (PreToolUse, PostToolUse, SessionStart, etc.) |
| MCP Servers | stdio/http/sse config, env vars, headers, quick-add presets, status check |
| Sandbox | Filesystem allow/deny paths, network domains |
| Environment | Custom environment variables |
| Display & UI | Spinner verbs, status line, motion preferences |
| Attribution | Commit and PR attribution strings |
| Advanced | API key helper, plans directory, cleanup period, available models |
| Design Prompts | 30 curated design styles with AI prompts and color palettes |
| Terminal Prompts | 26 prompts in 9 categories + CLAUDE.md Builder |

### Editing Tools
- **Drag & Drop** — reorder permission rules, hook groups, sandbox paths by dragging
- **Settings Validation** — real-time warnings for invalid values, missing fields, duplicates
- **Permission Conflict Detection** — warns when Allow and Deny rules overlap
- **Settings Diff View** — compare current settings against defaults or a custom template
- **Global Search** — find any setting across all tabs (`/` shortcut)
- **Undo/Redo** — 50-step history (`Ctrl+Z` / `Ctrl+Y`)
- **MCP Server Status Check** — test button to verify HTTP/SSE server connectivity

### Permission Presets

| Preset | Mode | Description |
|--------|------|-------------|
| Safety First | acceptEdits | Broad allow list + comprehensive deny rules |
| Produktiv | acceptEdits | Common dev tools allowed, minimal deny |
| Nur Lesen | plan | Read/Glob/Grep only, no writes |
| Lockdown | allowPrompt | Minimal rights, maximum deny list |
| Full Send | acceptAll | Everything allowed, only destructive ops denied |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save file |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo |
| `Ctrl+1-9` | Switch tabs |
| `Ctrl+Shift+P` | Toggle JSON preview |
| `/` | Focus global search |
| `?` | Show shortcuts overlay |
| `Esc` | Close modals |

### Design
- System-adaptive dark theme (off-black `#0A0A0F` base with amber `#F59E0B` accent)
- Glassmorphism panels with noise texture overlay
- Staggered tab transition animations
- Collapsible sidebar with icon-only mode
- Responsive layout with mobile-friendly header

## Tech Stack

- **[Tailwind CSS](https://tailwindcss.com/)** via CDN — utility-first styling
- **[Alpine.js](https://alpinejs.dev/)** — reactive state without a build step
- **JetBrains Mono** + **Space Grotesk** + **Inter** — font stack
- **File System Access API** — native browser file read/write

Zero dependencies. No `node_modules`. No `package.json`. Just one HTML file.

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome / Edge / Arc | Full (File System Access API) |
| Firefox | Partial (fallback file input, no direct save) |
| Safari | Partial (fallback file input, no direct save) |

## License

MIT
