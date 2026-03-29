#!/usr/bin/env python3
"""
Claude Settings Editor — Auto-Detect Launcher
Finds settings.json files, lets the user pick one, and opens the editor with it pre-loaded.
"""

import json
import base64
import os
import sys
import webbrowser
from pathlib import Path

# ─── Settings file locations ───
def get_settings_paths():
    """Return all known settings.json paths with their scope labels."""
    home = Path.home()
    cwd = Path.cwd()
    paths = []

    # User-level (global)
    user_path = home / ".claude" / "settings.json"
    if user_path.exists():
        paths.append(("User (global)", user_path))

    # Project-level (shared, committed to git)
    project_path = cwd / ".claude" / "settings.json"
    if project_path.exists():
        paths.append(("Project (shared)", project_path))

    # Local-level (gitignored)
    local_path = cwd / ".claude" / "settings.local.json"
    if local_path.exists():
        paths.append(("Local (gitignored)", local_path))

    # Also check parent directories for project settings
    parent = cwd.parent
    for _ in range(3):  # Check up to 3 levels up
        p = parent / ".claude" / "settings.json"
        if p.exists() and p != project_path:
            paths.append((f"Project ({parent.name})", p))
        p_local = parent / ".claude" / "settings.local.json"
        if p_local.exists() and p_local != local_path:
            paths.append((f"Local ({parent.name})", p_local))
        parent = parent.parent

    return paths


def encode_settings(json_str):
    """Encode JSON string to base64 (matching the editor's shareViaUrl format)."""
    encoded_bytes = json_str.encode("utf-8")
    return base64.b64encode(encoded_bytes).decode("ascii")


def get_editor_path():
    """Find the editor HTML file relative to this script."""
    script_dir = Path(__file__).parent
    editor = script_dir / "claude-settings-editor.html"
    if editor.exists():
        return editor
    # Fallback: check current directory
    editor = Path.cwd() / "claude-settings-editor.html"
    if editor.exists():
        return editor
    return None


def main():
    print()
    print("  Claude Settings Editor — Auto-Detect")
    print("  " + "=" * 40)
    print()

    # Find settings files
    paths = get_settings_paths()

    if not paths:
        print("  No settings.json files found.")
        print()
        print(f"  Looked in:")
        print(f"    ~/.claude/settings.json")
        print(f"    .claude/settings.json")
        print(f"    .claude/settings.local.json")
        print()

        # Offer to open editor empty
        answer = input("  Open editor without settings? [Y/n] ").strip().lower()
        if answer in ("", "y", "yes", "j", "ja"):
            editor = get_editor_path()
            if editor:
                webbrowser.open(editor.as_uri())
                print(f"  Opened: {editor.name}")
            else:
                print("  Error: claude-settings-editor.html not found.")
        return

    # Scope explanations
    SCOPE_INFO = {
        "User": "Persoenliche Settings, gelten fuer ALLE Projekte (Model, Plugins, Theme...)",
        "Project": "Projekt-Settings, werden ins Git committed. Das ganze Team bekommt diese.",
        "Local": "Persoenliche Projekt-Settings, NICHT committed (.gitignored). Fuer API-Keys etc.",
    }

    # Show found files
    print(f"  Found {len(paths)} settings file{'s' if len(paths) > 1 else ''}:")
    print()
    for i, (scope, path) in enumerate(paths, 1):
        size = path.stat().st_size
        scope_key = scope.split()[0]
        info = SCOPE_INFO.get(scope_key, "")
        print(f"    [{i}] {scope}")
        if info:
            print(f"        {info}")
        print(f"        {path}")
        print(f"        {size:,} bytes")
        print()

    print("  Prioritaet: Local > Project > User > Defaults")
    print("  Arrays (allow/deny) werden zusammengefuehrt, nicht ueberschrieben.")
    print()

    # Auto-select if only one
    if len(paths) == 1:
        selected = 0
        print(f"  Auto-selecting: {paths[0][0]}")
    else:
        try:
            choice = input(f"  Select [1-{len(paths)}]: ").strip()
            selected = int(choice) - 1
            if selected < 0 or selected >= len(paths):
                print("  Invalid selection.")
                return
        except (ValueError, EOFError):
            print("  Cancelled.")
            return

    scope, path = paths[selected]

    # Read and encode
    try:
        content = path.read_text(encoding="utf-8")
        # Validate JSON
        data = json.loads(content)
        key_count = len(data)
        # Re-serialize (clean formatting)
        clean_json = json.dumps(data, indent=2, ensure_ascii=False)
        encoded = encode_settings(clean_json)
    except json.JSONDecodeError as e:
        print(f"  Error: Invalid JSON in {path}")
        print(f"  {e}")
        return
    except Exception as e:
        print(f"  Error reading {path}: {e}")
        return

    # Find editor
    editor = get_editor_path()
    if not editor:
        print("  Error: claude-settings-editor.html not found.")
        print("  Place this script next to the editor HTML file.")
        return

    # Build URL with hash — add auto=1 to skip confirm dialog
    file_url = editor.as_uri()
    full_url = f"{file_url}#settings={encoded}&auto=1&scope={scope.split()[0].lower()}&file={path.name}"

    # Open in browser
    webbrowser.open(full_url)

    print()
    print(f"  Opened editor with {scope} settings")
    print(f"  {key_count} keys loaded from {path.name}")
    print()
    print("  Tip: Save changes via the editor's Save button (Ctrl+S)")
    print("       then copy the file back to the original location.")
    print()


if __name__ == "__main__":
    main()
