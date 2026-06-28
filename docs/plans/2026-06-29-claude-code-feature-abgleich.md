# Claude Settings Editor — Feature-Abgleich & Umsetzungsplan

**Datum:** 2026-06-29
**Editor-Stand:** v1.2 (claude-settings-editor.html, 6377 Zeilen, letzter Commit ~April 2026)
**Methode:** Baseline-Recon (Code-Inventur) + deep-research-Workflow (5-Winkel-Web-Fanout)

---

## 0. Quellenlage & Konfidenz

Die Such-Phase der deep-research lieferte belegte Claims aus offiziellen Quellen
(`docs.claude.com`, `code.claude.com`, GitHub `anthropics/claude-code` CHANGELOG,
`support.claude.com`). Die **adversariale Verifikations-Phase fiel komplett aus**
(serverseitige Rate-Limits auf allen Verify-Votes). Folge:

- **Hohe Konfidenz** (durch Environment-Kontext der laufenden Session unabhängig bestätigt):
  Modell-Generation (Fable 5, Opus 4.8, Sonnet 4.6, Haiku 4.5, opusplan).
- **Mittlere Konfidenz** (offizielle Quelle, aber unverifiziert): neue Settings-Keys,
  Hook-Handler-Typen, `/config`-Befehl, JSON-Schema-Existenz.
- **Niedrige Konfidenz** (verifizieren vor Umsetzung): exakte defaultMode-Werte,
  `tui`-Setting, vollständige Hook-Event-Liste, MCP-Paketnamen.

> **Regel für die Umsetzung:** Jede zu ändernde Faktengruppe vor dem Edit einmal
> gegen die offizielle Doku/CHANGELOG gegenprüfen (1 gezielter Fetch pro Gruppe),
> sobald Quota wieder frei ist. Nicht blind aus diesem Report patchen.

---

## 1. Strategische Frage: Lohnt sich das Tool noch?

**Neuer Wettbewerber: das offizielle `/config`-Interface.**
Claude Code besitzt inzwischen ein eingebautes, tab-basiertes Settings-Interface
(`/config`) plus eine nicht-interaktive Variante `/config key=value` (ab v2.1.181)
und `/config --help` mit Shorthand-Keys (v2.1.183). Das überlappt funktional mit
dem HTML-Editor.

**Bewertung: Das Tool bleibt sinnvoll — aber die Positionierung muss sich verschieben.**

Was `/config` *nicht* leistet und der HTML-Editor weiterhin differenziert liefert:
- Mehrsprachige (6 Sprachen) **didaktische Erklärung** jedes Settings — `/config` ist funktional, nicht erklärend.
- Kuratierter **Plugin-/MCP-/Skill-Katalog** mit Beschreibungen, Availability-Badges, Setup-Hinweisen.
- **Design Prompts, Terminal Prompts, Companion Tools, CLAUDE.md Builder** — kein Settings-Editing, sondern Wissens-/Workflow-Hub.
- **Diff-View, Templates, Share-URL, Setup-Wizard, Validierung mit Erklärungen.**

**Konsequenz:** Vom „einzigen Weg, settings zu schreiben" zum **„lernenden, kuratierenden Frontend + Referenz"** umpositionieren. `/config` nicht ignorieren, sondern erwähnen (z.B. Hinweis-Box „so wendest du das im Terminal an"). Kein Grund, das Tool einzustellen.

---

## 2. Gap-Analyse (priorisiert)

### P0 — Modelle veralten das Tool sichtbar (höchste Konfidenz)

Editor kennt: Opus 4.6, Sonnet 4.6, Haiku 4.5, opusplan.
Aktuell (Juni 2026):

| Modell | Voll-ID | Alias | Status im Editor |
|--------|---------|-------|------------------|
| Fable 5 (Mythos-class) | `claude-fable-5` | `fable` (v2.1.170+) | **fehlt** |
| Opus 4.8 | `claude-opus-4-8` | `opus` löst hierauf auf | **fehlt** |
| Opus 4.7 | `claude-opus-4-7` | — | **fehlt** |
| Sonnet 4.6 | `claude-sonnet-4-6` | `sonnet` | vorhanden |
| Opus 4.6 | `claude-opus-4-6` | — | vorhanden (nicht mehr Top-Tier) |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | `haiku` | vorhanden |
| — | — | `best` (= Fable 5, sonst Opus) | **fehlt** |
| 1M-Context-Varianten | — | `sonnet[1m]`, `opus[1m]` | **fehlt** |

Zu tun:
- Modell-Dropdown + Beschreibungen aktualisieren (Fable 5 als neuer Top-Tier, Opus 4.8, Opus 4.7).
- `validModels`-Allowlist erweitern: `claude-fable-5`, `claude-opus-4-8`, `claude-opus-4-7`, `fable`, `best`.
- Default-Beschreibung anpassen (Opus 4.6 ist nicht mehr „strongest").
- i18n für alle 6 Sprachen nachziehen.

### P1 — Neue Settings-Keys (mittlere Konfidenz, hoher Nutzen)

| Key | Typ | Quelle/Version | Editor |
|-----|-----|----------------|--------|
| `fallbackModel` | array (bis 3 geordnet) | model-config, v2.1.166 | **fehlt** |
| `enforceAvailableModels` | boolean | model-config, v2.1.175 | **fehlt** |
| `autoMode.classifyAllShell` | boolean | CHANGELOG v2.1.193 | **fehlt** |
| `strictKnownMarketplaces` | bool/managed | settings-docs | **fehlt** |
| `blockedMarketplaces` | array | settings-docs | **fehlt** |
| `pluginSuggestionMarketplaces` | array | settings-docs | **fehlt** |

(`availableModels`, `modelOverrides`, `effortLevel`, `extraKnownMarketplaces` sind bereits da.)

### P1 — Hook-Handler-Typ `mcp_tool` fehlt

Editor kennt: `command`, `http`, `prompt`, `agent`.
Dokumentiert sind **fünf**: + `mcp_tool` (Felder: `server`, `tool`, `input`).
→ Handler-Typ ergänzen inkl. dynamischem Formular.

### P2 — Hook-Events gegen Doku abgleichen (verifizieren!)

Editor hat 24 Events; Doku listet ~31. Möglicher Abgleich:
- **Evtl. fehlend:** `Setup`, `UserPromptExpansion`, `PostToolBatch`, `PermissionDenied`, `MessageDisplay`.
- **Editor-Events mit Verifizierungsbedarf:** `Elicitation`/`ElicitationResult`, `TeammateIdle`, `InstructionsLoaded` — prüfen, ob real oder in v1.x spekulativ ergänzt.
→ Vor Änderung die offizielle Hooks-Reference (`code.claude.com/docs/en/hooks`) als Single Source ziehen und die Liste 1:1 angleichen.

### P2 — Permission-Modi bereinigen (verifizieren!)

Editor: `default, acceptEdits, plan, bypassPermissions, dontAsk, auto`.
Quellen widersprüchlich (eine nennt `auto/manual/bypass`). `dontAsk` und `manual`
sind unklar. → defaultMode-Werte gegen offizielle settings-Reference verifizieren,
dann Dropdown + Validierungs-Allowlist korrigieren.

### P2 — MCP-Presets prüfen (verifizieren!)

`@anthropic-ai/mcp-server-slack`, `-linear`, `-playwright` — Paketnamen sind
unsicher (möglicherweise in v1.1 geraten). → Reale Paketnamen/Transports prüfen.
Veraltete `@modelcontextprotocol/server-*`-Pakete ebenfalls gegenchecken (einige
wurden umbenannt/archiviert).

### P3 — Strategisch: Gegen offizielle JSON-Schema abgleichen

Es existiert (laut GitHub-Issue 11795) ein getracktes Schema unter
`json.schemastore.org/claude-code-settings.json`. Das ist die **nachhaltigste
Lösung gegen künftiges Veralten**: statt Keys von Hand zu pflegen, das Schema als
Referenz/Validierungsquelle nutzen.
- Minimal: einmalig importieren, fehlende Keys daraus ableiten.
- Ausbaustufe: optionaler „Schema-Sync"-Knopf, der das Schema lädt und unbekannte
  Keys meldet.

### P3 — `/config`-Hinweis integrieren

Info-Box, dass settings auch via `/config` (TUI) bzw. `/config key=value` gesetzt
werden können — positioniert den Editor ehrlich neben dem offiziellen Weg.

### P3 — `tui`-Setting (niedrige Konfidenz)

Claim: `tui`-Setting ab v2.1.110, aber undokumentiert. → Nur aufnehmen, wenn in
offizieller Doku/Schema belegt; sonst weglassen.

---

## 3. Umsetzungsplan (für Folge-Session)

**Reihenfolge nach Impact/Konfidenz. Jede Gruppe beginnt mit einem Verify-Fetch.**

1. **P0 Modelle** (1 Verify-Fetch model-config + support-article → Edit Dropdown,
   `validModels`, Beschreibungen, i18n ×6). Höchster sichtbarer Nutzen, geringstes Risiko.
2. **P1 Settings-Keys** (`fallbackModel`, `enforceAvailableModels`,
   `autoMode.classifyAllShell`, Marketplace-Trio) — je in `defaultSettings()`,
   `knownKeys`, `loadJson()`, `cleanJson()`, UI-Control, Search-Index, Validierung, i18n.
3. **P1 Hook-Handler `mcp_tool`** — Handler-Typ + dynamisches Formular + i18n.
4. **P2 Hook-Events & Permission-Modi** (1 Verify-Fetch hooks + settings → Listen
   angleichen, spekulative Einträge entfernen).
5. **P2 MCP-Presets** (Paketnamen verifizieren, korrigieren).
6. **P3 Schema-Sync + `/config`-Hinweis + Version-Bump v1.3 + README + Obsidian-Note.**

**Success-Kriterium je Schritt:** geänderte Werte mit offizieller Quelle belegt;
Roundtrip-Test (settings.json laden → exportieren → keine Datenverluste); Build/Render-Smoke.

**Aufwandsschätzung:** P0 klein (~1 Tab), P1 mittel (4 Stellen je Key, ×6 i18n),
P2 mittel (Recherche-lastig), P3 groß (Schema-Sync ist ein Feature). MVP = P0+P1.

---

## 4. Offene Verifikationspunkte (vor Umsetzung klären)

- [ ] Exakte `defaultMode`-Werte (auto/manual/bypass vs. default/plan/acceptEdits/…)
- [ ] Vollständige & korrekte Hook-Event-Liste (Doku ist Single Source)
- [ ] Reale MCP-Paketnamen (Anthropic-Namespace?)
- [ ] `tui`-Setting real & dokumentiert?
- [ ] Exakte Marketplace-Key-Namen + Typen
- [ ] JSON-Schema-URL erreichbar & brauchbar als Referenz?

---

## 5. Runde 1 — Detail-Design (P0 Modelle)

**Scope-Entscheidung (Brainstorming 2026-06-29):** Nur P0. Dropdown
**alias-zentriert + Versions-Hinweis** (zukunftssicher). Keine 1M-Varianten,
keine versionierten Pins, keine P1-Keys. Surgical: nur modell-bezogene Strings.

### Schritt 0 — Verifikation (zuerst, bei freier Quota)
1 gezielter Fetch: `code.claude.com/docs/en/model-config` +
`support.claude.com` Model-Configuration-Artikel. Bestätigen:
- Alias-Liste (`fable`, `best`, `opus`, `sonnet`, `haiku`, `opusplan`)
- `opus` → Opus 4.8, `fable` → `claude-fable-5`, `best` → Fable 5 (sonst Opus)
- aktuelle Voll-IDs (`claude-fable-5`, `claude-opus-4-8`, `claude-opus-4-7`)

Erst nach Bestätigung Code anfassen. Bei Abweichung Design nachziehen.

### Code-Änderungen (`claude-settings-editor.html`)
1. **Modell-Dropdown** (General-Tab) → alias-zentriert:
   - `best` → Fable 5 (sonst neuestes Opus)
   - `fable` → Claude Fable 5 (Mythos-class, stärkstes Reasoning)
   - `opus` → derzeit Opus 4.8
   - `sonnet` → Sonnet 4.6 (schnell, ausgewogen)
   - `haiku` → Haiku 4.5 (schnellstes, günstigstes)
   - `opusplan` → Opus plant, Sonnet baut
   - Versions-Hinweis im Subtext/Label.
2. **`validModels`-Allowlist** (`validateSettings()`, ~Z. 5804): ergänzen um
   `fable`, `best`, `claude-fable-5`, `claude-opus-4-8`, `claude-opus-4-7`.
   Bestehende Einträge behalten (Rückwärtskompatibilität alter settings.json).
3. **Default-/Placeholder-Beschreibung:** „Opus 4.6 (strongest)" → Fable 5 /
   Opus 4.8 als Top-Tier korrigieren.
4. **i18n ×6** (`const T`, ~Z. 3259): alle Modell-Strings in de/en/es/fr/ja/pt.
   Umlaute korrekt (ä/ö/ü/ß, nie ae/oe/ue).
5. **Search-Registry:** Modell-Keywords aktualisieren (opus 4.8, fable).

### Success-Kriterien
- Bestehende settings.json mit `"model": "opus"` oder gepinnter Voll-ID lädt
  ohne Validierungswarnung.
- Roundtrip: laden → exportieren → kein Datenverlust.
- Dropdown zeigt Fable 5 + best mit Versions-Hinweis.
- Render-Smoke in 2 Sprachen (de + en).
- Version-Bump v1.2 → v1.3.

### Aufwand
Klein — ein Tab + i18n, eine Sitzung. Auf eigenem Branch bauen (nicht direkt main).
