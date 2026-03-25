# Memory Tab & Skills Update — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dedicated Memory tab (Tab #15) covering Auto Memory, Auto Dream, Session Memory, and CLAUDE.md overview. Update the plugin list to rename project-kickstart → project-launch.

**Architecture:** Single-file HTML editor (`claude-settings-editor.html`). New tab follows the same Alpine.js `x-show="activeTab === 'memory'"` pattern. Memory tab is a hybrid: 2 real settings (`autoMemoryEnabled`, `autoMemoryDirectory`) + educational info-cards for Auto Dream, Session Memory, and CLAUDE.md. The tab is excluded from JSON Preview and header buttons (like companion-tools).

**Tech Stack:** HTML, Tailwind CSS (CDN), Alpine.js, i18n via `T` object + `t()`/`td()` helpers

---

## Task 1: Add Memory tab to sidebar tabs array

**Files:**
- Modify: `claude-settings-editor.html:4088-4089` (tabs array, before separator)

**Step 1: Add the tab entry**

Insert a new tab object before the `{ id: 'separator' }` line (line 4089). Use a brain/memory icon SVG. Tab id: `'memory'`.

```javascript
{ id: 'memory', label: 'Memory', desc: 'Auto Memory, Auto Dream und Session Memory', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>' },
```

**Step 2: Verify tab appears in sidebar**

Open in browser, check that "Memory" tab appears between "Advanced" and the separator line.

---

## Task 2: Exclude Memory tab from settings-specific UI elements

**Files:**
- Modify: `claude-settings-editor.html:327` (search bar exclusion)
- Modify: `claude-settings-editor.html:408` (header buttons exclusion)
- Modify: `claude-settings-editor.html:2487` (JSON preview footer exclusion)

**Step 1: Add 'memory' to all three exclusion arrays**

The Memory tab is a hybrid — it has 2 real settings BUT also a lot of info content. We keep the settings search bar visible but hide the Save/Export/Open buttons and JSON preview.

Update all three lines from:
```javascript
!['design-prompts','terminal-prompts','companion-tools'].includes(activeTab)
```
to:
```javascript
!['design-prompts','terminal-prompts','companion-tools','memory'].includes(activeTab)
```

**Step 2: Add Memory-specific search bar (optional)**

The Memory tab should have its own simplified header area. No search bar needed initially — the tab is small enough to scan visually.

---

## Task 3: Add i18n keys for the Memory tab

**Files:**
- Modify: `claude-settings-editor.html` (T object, around line 3200-3400)

**Step 1: Add all Memory tab i18n keys**

Add these keys to the `T` object in all 6 languages (de, en, es, fr, ja, pt):

```javascript
// Tab
'memory.title': { de: 'Memory', en: 'Memory', ... },
'memory.desc': { de: 'Auto Memory, Auto Dream und Session Memory verwalten', en: 'Manage Auto Memory, Auto Dream, and Session Memory', ... },

// Auto Memory section
'memory.autoMemoryTitle': { de: 'Auto Memory', en: 'Auto Memory', ... },
'memory.autoMemoryDesc': { de: 'Claude notiert sich automatisch Patterns, Build-Commands und Debugging-Insights während der Arbeit.', en: 'Claude automatically records patterns, build commands, and debugging insights while working.', ... },
'memory.enabledLabel': { de: 'Auto Memory aktiviert', en: 'Auto Memory enabled', ... },
'memory.enabledDesc': { de: 'Claude schreibt automatisch Notizen über Projekt-Patterns und Erkenntnisse.', en: 'Claude automatically writes notes about project patterns and insights.', ... },
'memory.directoryLabel': { de: 'Memory-Verzeichnis', en: 'Memory directory', ... },
'memory.directoryDesc': { de: 'Benutzerdefinierter Pfad für Auto Memory Dateien. Standard: ~/.claude/projects/<project>/memory/', en: 'Custom path for auto memory files. Default: ~/.claude/projects/<project>/memory/', ... },
'memory.directoryPlaceholder': { de: '~/my-memory-dir', en: '~/my-memory-dir', ... },
'memory.envOverrideTitle': { de: 'Environment Variable', en: 'Environment Variable', ... },
'memory.envOverrideDesc': { de: 'CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 überschreibt alle Settings (für CI/CD Pipelines).', en: 'CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 overrides all settings (for CI/CD pipelines).', ... },
'memory.whatIsSaved': { de: 'Was wird gespeichert?', en: 'What gets saved?', ... },
'memory.savedItem1': { de: 'Debugging-Insights und Fehlerlösungen', en: 'Debugging insights and error solutions', ... },
'memory.savedItem2': { de: 'Build-Commands und Test-Konventionen', en: 'Build commands and test conventions', ... },
'memory.savedItem3': { de: 'Architektur-Notizen und Datei-Beziehungen', en: 'Architecture notes and file relationships', ... },
'memory.savedItem4': { de: 'Coding-Preferences und Korrekturen', en: 'Coding preferences and corrections', ... },

// Auto Dream section
'memory.dreamTitle': { de: 'Auto Dream', en: 'Auto Dream', ... },
'memory.dreamDesc': { de: 'Periodische Konsolidierung — wie REM-Schlaf für Claudes Memory. Entfernt Widersprüche, mergt Duplikate, konvertiert relative Daten.', en: 'Periodic consolidation — like REM sleep for Claude\'s memory. Removes contradictions, merges duplicates, converts relative dates.', ... },
'memory.dreamExperimental': { de: 'Experimentell — noch nicht offiziell dokumentiert', en: 'Experimental — not yet officially documented', ... },
'memory.dreamTriggerTitle': { de: 'Trigger-Bedingungen', en: 'Trigger conditions', ... },
'memory.dreamTrigger1': { de: '24 Stunden seit letzter Konsolidierung', en: '24 hours since last consolidation', ... },
'memory.dreamTrigger2': { de: 'Mehr als 5 Sessions seit letzter Konsolidierung', en: 'More than 5 sessions since last consolidation', ... },
'memory.dreamTriggerBoth': { de: 'Beide Bedingungen müssen erfüllt sein.', en: 'Both conditions must be met.', ... },
'memory.dreamPhasesTitle': { de: '4 Phasen', en: '4 Phases', ... },
'memory.dreamPhase1': { de: 'Orient — Memory-Verzeichnis scannen', en: 'Orient — scan memory directory', ... },
'memory.dreamPhase2': { de: 'Gather — Signal aus Session-Transkripten', en: 'Gather — signal from session transcripts', ... },
'memory.dreamPhase3': { de: 'Consolidate — Mergen, Prunen, Daten absolutieren', en: 'Consolidate — merge, prune, convert dates', ... },
'memory.dreamPhase4': { de: 'Index — MEMORY.md unter 200 Zeilen halten', en: 'Index — keep MEMORY.md under 200 lines', ... },
'memory.dreamManualTitle': { de: 'Manuell triggern', en: 'Trigger manually', ... },
'memory.dreamManualDesc': { de: 'Tippe /dream oder "consolidate my memory files" in Claude Code.', en: 'Type /dream or "consolidate my memory files" in Claude Code.', ... },
'memory.dreamSafety': { de: 'Sicherheit: Read-only auf Code, Lock-File verhindert parallele Runs, läuft im Hintergrund.', en: 'Safety: read-only on code, lock file prevents parallel runs, runs in background.', ... },

// Session Memory section
'memory.sessionTitle': { de: 'Session Memory', en: 'Session Memory', ... },
'memory.sessionDesc': { de: 'Automatische Zusammenfassungen im Hintergrund — macht /compact instant.', en: 'Automatic background summaries — makes /compact instant.', ... },
'memory.sessionCadence': { de: 'Erste Extraktion nach ~10.000 Tokens, dann alle ~5.000 Tokens oder 3 Tool-Calls.', en: 'First extraction after ~10,000 tokens, then every ~5,000 tokens or 3 tool calls.', ... },
'memory.sessionPath': { de: 'Speicherort', en: 'Storage path', ... },
'memory.sessionAvailability': { de: 'Nur über Anthropic API verfügbar (nicht Bedrock/Vertex/Foundry).', en: 'Only available via Anthropic API (not Bedrock/Vertex/Foundry).', ... },

// CLAUDE.md section
'memory.claudeMdTitle': { de: 'CLAUDE.md Übersicht', en: 'CLAUDE.md Overview', ... },
'memory.claudeMdDesc': { de: 'Deine manuellen Instruktionen — höchste Priorität im Context Window.', en: 'Your manual instructions — highest priority in the context window.', ... },
'memory.hierarchyTitle': { de: 'Memory-Hierarchie (Priorität)', en: 'Memory hierarchy (priority)', ... },
'memory.hierarchy1': { de: 'CLAUDE.md — Deine Regeln (höchste Priorität)', en: 'CLAUDE.md — your rules (highest priority)', ... },
'memory.hierarchy2': { de: '.claude/rules/ — Pfad-spezifische Regeln', en: '.claude/rules/ — path-specific rules', ... },
'memory.hierarchy3': { de: 'Auto Memory — Claudes Notizen (MEMORY.md)', en: 'Auto Memory — Claude\'s notes (MEMORY.md)', ... },
'memory.hierarchy4': { de: 'Session Memory — Gesprächskontinuität', en: 'Session Memory — conversation continuity', ... },
'memory.builderLink': { de: '→ CLAUDE.md Builder öffnen', en: '→ Open CLAUDE.md Builder', ... },

// Health Tips section
'memory.healthTitle': { de: 'Memory Health Tipps', en: 'Memory Health Tips', ... },
'memory.healthTip1': { de: 'MEMORY.md unter 200 Zeilen halten — darüber wird abgeschnitten', en: 'Keep MEMORY.md under 200 lines — content above is truncated', ... },
'memory.healthTip2': { de: 'Relative Daten vermeiden ("gestern" → konkretes Datum)', en: 'Avoid relative dates ("yesterday" → specific date)', ... },
'memory.healthTip3': { de: 'Nach großen Refactors: /dream manuell triggern', en: 'After major refactors: trigger /dream manually', ... },
'memory.healthTip4': { de: 'CI/CD: CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 setzen', en: 'CI/CD: set CLAUDE_CODE_DISABLE_AUTO_MEMORY=1', ... },
'memory.healthTip5': { de: '/memory öffnet das Memory-Dashboard in Claude Code', en: '/memory opens the memory dashboard in Claude Code', ... },
```

**Note:** es/fr/ja/pt translations follow the same pattern. Use the existing i18n style from the codebase.

---

## Task 4: Add settings fields for Auto Memory

**Files:**
- Modify: `claude-settings-editor.html` (settings object in `defaultSettings()`)
- Modify: `claude-settings-editor.html` (`cleanJson()` export)
- Modify: `claude-settings-editor.html` (`loadJson()` import)

**Step 1: Add to defaultSettings()**

Find `defaultSettings()` function, add:
```javascript
autoMemoryEnabled: true,
autoMemoryDirectory: '',
```

**Step 2: Add to cleanJson()**

Export `autoMemoryEnabled` when `false` (non-default), and `autoMemoryDirectory` when non-empty:
```javascript
if (s.autoMemoryEnabled === false) o.autoMemoryEnabled = false;
if (s.autoMemoryDirectory) o.autoMemoryDirectory = s.autoMemoryDirectory;
```

**Step 3: Add to loadJson()**

Import both fields:
```javascript
if (j.autoMemoryEnabled !== undefined) this.settings.autoMemoryEnabled = j.autoMemoryEnabled;
if (j.autoMemoryDirectory) this.settings.autoMemoryDirectory = j.autoMemoryDirectory;
```

---

## Task 5: Build the Memory tab HTML

**Files:**
- Modify: `claude-settings-editor.html` (insert after companion-tools tab content, before closing `</main>`)

**Step 1: Add Memory tab content section**

Insert the tab HTML with all 5 sections. Color accent: **violet** (to distinguish from other tabs). Structure mirrors companion-tools tab (info-cards + some interactive elements).

The tab content should be inserted right after the companion-tools tab `</div>` (around line 2486).

```html
<div x-show="activeTab === 'memory'" class="tab-content space-y-6" role="tabpanel">

  <!-- ── Section 1: Auto Memory ── -->
  <div class="settings-group space-y-4" id="setting-auto-memory">
    <div class="flex items-center gap-3 mb-2">
      <div class="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
        <svg class="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
      </div>
      <div>
        <h3 class="font-display font-semibold text-sm text-fg" x-text="t('memory.autoMemoryTitle')"></h3>
        <p class="text-xs text-fg-dim" x-text="t('memory.autoMemoryDesc')"></p>
      </div>
    </div>

    <!-- Toggle: autoMemoryEnabled -->
    <div class="flex items-center justify-between py-3 px-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
      <div>
        <span class="setting-label" x-text="t('memory.enabledLabel')"></span>
        <p class="text-xs text-fg-dim mt-0.5" x-text="t('memory.enabledDesc')"></p>
      </div>
      <div class="toggle-switch" :class="settings.autoMemoryEnabled ? 'active' : ''" @click="settings.autoMemoryEnabled = !settings.autoMemoryEnabled; markUnsaved()" @keydown.enter="settings.autoMemoryEnabled = !settings.autoMemoryEnabled; markUnsaved()" tabindex="0" role="switch" :aria-checked="settings.autoMemoryEnabled.toString()">
        <div class="toggle-knob"></div>
      </div>
    </div>

    <!-- Input: autoMemoryDirectory -->
    <div class="py-3 px-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
      <span class="setting-label" x-text="t('memory.directoryLabel')"></span>
      <p class="text-xs text-fg-dim mt-0.5 mb-2" x-text="t('memory.directoryDesc')"></p>
      <input type="text" class="setting-input w-full" x-model="settings.autoMemoryDirectory" @input="markUnsaved()" :placeholder="t('memory.directoryPlaceholder')">
    </div>

    <!-- Info: Environment Override -->
    <div class="flex items-start gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
      <svg class="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <div>
        <p class="text-xs font-semibold text-violet-300" x-text="t('memory.envOverrideTitle')"></p>
        <p class="text-xs text-fg-dim mt-0.5" x-text="t('memory.envOverrideDesc')"></p>
        <code class="text-[10px] font-mono mt-1.5 inline-block px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] text-violet-300/80 select-all">CLAUDE_CODE_DISABLE_AUTO_MEMORY=1</code>
      </div>
    </div>

    <!-- Collapsible: What gets saved -->
    <details class="rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
      <summary class="px-4 py-3 cursor-pointer text-xs font-semibold text-fg-dim hover:text-fg transition-colors" x-text="t('memory.whatIsSaved')"></summary>
      <ul class="px-4 pb-3 text-xs text-fg-dim space-y-1.5 ml-4 list-disc">
        <li x-text="t('memory.savedItem1')"></li>
        <li x-text="t('memory.savedItem2')"></li>
        <li x-text="t('memory.savedItem3')"></li>
        <li x-text="t('memory.savedItem4')"></li>
      </ul>
    </details>
  </div>

  <!-- ── Section 2: Auto Dream ── -->
  <div class="settings-group space-y-4" id="setting-auto-dream">
    <div class="flex items-center gap-3 mb-2">
      <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
        <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <h3 class="font-display font-semibold text-sm text-fg" x-text="t('memory.dreamTitle')"></h3>
          <span class="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-400/15 text-indigo-300 border border-indigo-400/20" x-text="t('memory.dreamExperimental')"></span>
        </div>
        <p class="text-xs text-fg-dim mt-0.5" x-text="t('memory.dreamDesc')"></p>
      </div>
    </div>

    <!-- Trigger Conditions -->
    <div class="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
      <p class="text-xs font-semibold text-fg mb-3" x-text="t('memory.dreamTriggerTitle')"></p>
      <div class="flex gap-3 mb-2">
        <div class="flex-1 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-center">
          <div class="text-2xl font-display font-bold text-indigo-400">24h</div>
          <p class="text-[10px] text-fg-dim mt-1" x-text="t('memory.dreamTrigger1')"></p>
        </div>
        <div class="flex items-center text-fg-dim text-lg font-bold">+</div>
        <div class="flex-1 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-center">
          <div class="text-2xl font-display font-bold text-indigo-400">5+</div>
          <p class="text-[10px] text-fg-dim mt-1" x-text="t('memory.dreamTrigger2')"></p>
        </div>
      </div>
      <p class="text-[10px] text-fg-dim text-center italic" x-text="t('memory.dreamTriggerBoth')"></p>
    </div>

    <!-- 4 Phases -->
    <div class="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
      <p class="text-xs font-semibold text-fg mb-3" x-text="t('memory.dreamPhasesTitle')"></p>
      <div class="space-y-2">
        <div class="flex items-center gap-3"><span class="w-6 h-6 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span><span class="text-xs text-fg-dim" x-text="t('memory.dreamPhase1')"></span></div>
        <div class="flex items-center gap-3"><span class="w-6 h-6 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span><span class="text-xs text-fg-dim" x-text="t('memory.dreamPhase2')"></span></div>
        <div class="flex items-center gap-3"><span class="w-6 h-6 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span><span class="text-xs text-fg-dim" x-text="t('memory.dreamPhase3')"></span></div>
        <div class="flex items-center gap-3"><span class="w-6 h-6 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">4</span><span class="text-xs text-fg-dim" x-text="t('memory.dreamPhase4')"></span></div>
      </div>
    </div>

    <!-- Manual Trigger + Safety -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
        <p class="text-xs font-semibold text-indigo-300 mb-1" x-text="t('memory.dreamManualTitle')"></p>
        <p class="text-[11px] text-fg-dim" x-text="t('memory.dreamManualDesc')"></p>
      </div>
      <div class="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
        <p class="text-xs font-semibold text-emerald-300 mb-1">Safety</p>
        <p class="text-[11px] text-fg-dim" x-text="t('memory.dreamSafety')"></p>
      </div>
    </div>
  </div>

  <!-- ── Section 3: Session Memory ── -->
  <div class="settings-group space-y-4" id="setting-session-memory">
    <div class="flex items-center gap-3 mb-2">
      <div class="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
        <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
      </div>
      <div>
        <h3 class="font-display font-semibold text-sm text-fg" x-text="t('memory.sessionTitle')"></h3>
        <p class="text-xs text-fg-dim" x-text="t('memory.sessionDesc')"></p>
      </div>
    </div>

    <div class="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] space-y-3">
      <p class="text-xs text-fg-dim" x-text="t('memory.sessionCadence')"></p>
      <div>
        <p class="text-[10px] font-semibold text-fg-dim mb-1" x-text="t('memory.sessionPath')"></p>
        <code class="text-[10px] font-mono px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.05)] text-sky-300/80 block select-all">~/.claude/projects/&lt;project&gt;/&lt;session&gt;/session-memory/summary.md</code>
      </div>
    </div>

    <!-- Availability Warning -->
    <div class="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
      <svg class="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
      <p class="text-xs text-fg-dim" x-text="t('memory.sessionAvailability')"></p>
    </div>
  </div>

  <!-- ── Section 4: CLAUDE.md Overview ── -->
  <div class="settings-group space-y-4" id="setting-claudemd-overview">
    <div class="flex items-center gap-3 mb-2">
      <div class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
        <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      </div>
      <div>
        <h3 class="font-display font-semibold text-sm text-fg" x-text="t('memory.claudeMdTitle')"></h3>
        <p class="text-xs text-fg-dim" x-text="t('memory.claudeMdDesc')"></p>
      </div>
    </div>

    <!-- Priority Hierarchy -->
    <div class="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
      <p class="text-xs font-semibold text-fg mb-3" x-text="t('memory.hierarchyTitle')"></p>
      <div class="space-y-2">
        <div class="flex items-center gap-3"><span class="w-5 h-5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0">1</span><span class="text-xs text-fg-dim" x-text="t('memory.hierarchy1')"></span></div>
        <div class="flex items-center gap-3"><span class="w-5 h-5 rounded bg-amber-500/15 text-amber-400/80 text-[9px] font-bold flex items-center justify-center flex-shrink-0">2</span><span class="text-xs text-fg-dim" x-text="t('memory.hierarchy2')"></span></div>
        <div class="flex items-center gap-3"><span class="w-5 h-5 rounded bg-violet-500/15 text-violet-400/80 text-[9px] font-bold flex items-center justify-center flex-shrink-0">3</span><span class="text-xs text-fg-dim" x-text="t('memory.hierarchy3')"></span></div>
        <div class="flex items-center gap-3"><span class="w-5 h-5 rounded bg-sky-500/15 text-sky-400/80 text-[9px] font-bold flex items-center justify-center flex-shrink-0">4</span><span class="text-xs text-fg-dim" x-text="t('memory.hierarchy4')"></span></div>
      </div>
    </div>

    <!-- Link to CLAUDE.md Builder -->
    <button @click="activeTab = 'terminal-prompts'" class="w-full p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/30 transition-colors text-left">
      <span class="text-xs font-semibold text-amber-300" x-text="t('memory.builderLink')"></span>
    </button>
  </div>

  <!-- ── Section 5: Health Tips ── -->
  <details class="settings-group overflow-hidden" id="setting-memory-health">
    <summary class="flex items-center gap-3 cursor-pointer p-4 -m-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors rounded-2xl">
      <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <h3 class="font-display font-semibold text-sm text-fg" x-text="t('memory.healthTitle')"></h3>
    </summary>
    <ul class="mt-4 space-y-2.5 text-xs text-fg-dim">
      <li class="flex items-start gap-2"><span class="text-emerald-400 mt-0.5">•</span><span x-text="t('memory.healthTip1')"></span></li>
      <li class="flex items-start gap-2"><span class="text-emerald-400 mt-0.5">•</span><span x-text="t('memory.healthTip2')"></span></li>
      <li class="flex items-start gap-2"><span class="text-emerald-400 mt-0.5">•</span><span x-text="t('memory.healthTip3')"></span></li>
      <li class="flex items-start gap-2"><span class="text-emerald-400 mt-0.5">•</span><span x-text="t('memory.healthTip4')"></span></li>
      <li class="flex items-start gap-2"><span class="text-emerald-400 mt-0.5">•</span><span x-text="t('memory.healthTip5')"></span></li>
    </ul>
  </details>

</div>
```

---

## Task 6: Add Memory tab to Search Registry

**Files:**
- Modify: `claude-settings-editor.html` (settingsRegistry array)

**Step 1: Add search entries for Memory tab**

```javascript
{ tab: 'memory', label: 'search.autoMemory', desc: 'search.autoMemory.desc', keywords: ['memory', 'auto', 'speicher', 'notizen', 'remember'], id: 'setting-auto-memory' },
{ tab: 'memory', label: 'search.autoDream', desc: 'search.autoDream.desc', keywords: ['dream', 'traum', 'consolidate', 'konsolidierung', 'rem', 'sleep'], id: 'setting-auto-dream' },
{ tab: 'memory', label: 'search.sessionMemory', desc: 'search.sessionMemory.desc', keywords: ['session', 'compact', 'summary', 'zusammenfassung'], id: 'setting-session-memory' },
{ tab: 'memory', label: 'search.claudeMd', desc: 'search.claudeMd.desc', keywords: ['claude.md', 'instructions', 'regeln', 'rules', 'hierarchy'], id: 'setting-claudemd-overview' },
```

Add corresponding i18n keys for search labels/descriptions.

---

## Task 7: Update project-kickstart → project-launch in Plugin List

**Files:**
- Modify: `claude-settings-editor.html:4202` (plugin entry)
- Modify: `claude-settings-editor.html` (i18n keys for project-kickstart)

**Step 1: Update plugin entry**

Change line 4202 from:
```javascript
{ id: 'project-kickstart@local-skills', name: 'Project Kickstart', desc: '...', skills: ['/project-kickstart'], provides: '...', availability: 'ready' },
```
to:
```javascript
{ id: 'project-launch@local-skills', name: 'Project Launch', desc: 'Strukturierter 6-Phasen Projektstart — von Idee bis Implementierungsplan', skills: ['/project-launch'], provides: 'Ideen-Validierung, Scope-Definition, Stack-Wahl (Angular/Tauri/HTML), Obsidian-Note, CLAUDE.md, Implementierungsplan', availability: 'ready' },
```

**Step 2: Update i18n keys**

Rename all `data.plugin.project-kickstart.*` keys to `data.plugin.project-launch.*` and update the translations to reflect the new v2 scope (6 phases, idea validation, 3 stacks).

---

## Task 8: Add Wizard step for Memory tab (optional)

The Setup Wizard currently has 6 steps. Adding Memory here would be nice but is not critical — Auto Memory is on by default. Skip for now to keep scope tight.

---

## Task 9: Verify and test

**Step 1: Open in browser**

Open `claude-settings-editor.html` in Chromium/Chrome.

**Step 2: Verify Memory tab**

- [ ] Memory tab visible in sidebar with brain icon
- [ ] All 5 sections render correctly
- [ ] Auto Memory toggle works and updates settings
- [ ] Auto Memory directory input works
- [ ] Info cards (Dream, Session Memory, CLAUDE.md) display correctly
- [ ] Health tips collapsible works
- [ ] CLAUDE.md Builder link navigates to terminal-prompts tab
- [ ] Experimental badge visible on Auto Dream section
- [ ] Tab excluded from JSON Preview / Save/Export buttons

**Step 3: Verify Skills update**

- [ ] "Project Launch" shows in Local/Custom plugin category
- [ ] Skills badge shows `/project-launch`
- [ ] Old `project-kickstart` reference is gone

**Step 4: Verify i18n**

- [ ] Switch to English — all memory strings translated
- [ ] Switch to Japanese — all strings translated
- [ ] Global search finds "memory", "dream", "session"

**Step 5: Verify roundtrip**

- [ ] Load existing settings.json → autoMemoryEnabled imports correctly
- [ ] Toggle off → export → `autoMemoryEnabled: false` present
- [ ] Set directory → export → `autoMemoryDirectory` present
- [ ] Undo/redo works for memory settings
