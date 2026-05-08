# Scripts

Project automation scripts for maintaining configuration files.

## update-all

**🚀 Master update script** - Runs all updaters in sequence.

Self-contained bash script that orchestrates all update operations.

**Usage:**

```bash
./scripts/update-all
```

**Function:**
- Runs `welcome-updater` to update preset lists
- Runs `overlay-updater` to update overlay lists
- Provides consolidated output with emoji indicators

**When to run:**
- After adding/removing/renaming any preset or overlay files
- Before committing configuration changes
- As a general "sync all" command

**VS Code Integration:**

Run from VS Code using the default build task:
- **Keyboard Shortcut:** `⇧⌘B` (Mac) / `Ctrl+Shift+B` (Windows/Linux)
- **Command Palette:** `⇧⌘P` → `Tasks: Run Build Task`
- **Or manually:** `Tasks: Run Task` → `Update All (Presets + Overlays)`

---

## welcome-updater

Updates `welcome.html` preset list from `config/presets/` directory.

Self-contained bash script with embedded Python implementation.

**Usage:**

```bash
./scripts/welcome-updater
```

**Function:**
- Scans `config/presets/` for all `.json` files
- Generates `config/presets/manifest.json`
- Updates `welcome.html` between marker comments
- Sorts presets: init files first, then alphabetically
- Generates Editor and Player links for each preset

**Dynamic Loading:**

The welcome page includes a "Refresh" button that reloads the preset list from `manifest.json` without page reload. After adding new presets:

1. Run `./scripts/welcome-updater` to update manifest
2. Click "Refresh" button on welcome page

**When to run:**
- After adding a new preset
- After deleting a preset
- After renaming a preset file

**VS Code Integration:**

Run the script directly from VS Code:
1. Open Command Palette: ⇧⌘P (Mac) / Ctrl+Shift+P (Windows/Linux)
2. Type: `Tasks: Run Task`
3. Select: `Update Welcome Page Presets`

---

## overlay-updater

Updates `config/overlayPresets.js` from `assets/overlays/` directory.

Self-contained bash script with embedded Python implementation.

**Usage:**

```bash
./scripts/overlay-updater
```

**Function:**
- Scans `assets/overlays/` for all `.json` files
- Updates the `OVERLAY_FILES` array in `config/overlayPresets.js`
- Sorts overlay files alphabetically
- Maintains existing file structure and comments

**When to run:**
- After adding a new overlay file
- After deleting an overlay file
- After renaming an overlay file

**VS Code Integration:**

Run the script directly from VS Code:
1. Open Command Palette: ⇧⌘P (Mac) / Ctrl+Shift+P (Windows/Linux)
2. Type: `Tasks: Run Task`
3. Select: `Update Overlay Presets`

---

## Web Interface

For a visual interface to run these scripts, open:

**`utilities/project-updater.html`**

Features:
- One-click command display
- Copy-to-clipboard functionality
- Visual status indicators
- Instructions for VS Code integration

---

See `.vscode/README.md` for more details on VS Code task integration.
