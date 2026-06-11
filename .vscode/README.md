# VS Code Tasks

The project includes automated tasks that can be run from VS Code.

## Available Tasks

### Update All (Presets + Overlays) ⭐️

**Default Build Task** - Run with `⇧⌘B` (Mac) / `Ctrl+Shift+B` (Windows/Linux)

Master update script that runs all updaters in sequence:
- Updates preset lists from `presets/`
- Updates overlay lists from `assets/overlays/`

**How to run:**

1. **Keyboard Shortcut** (⇧⌘B / Ctrl+Shift+B):
   - Fastest way to run all updates

2. **Command Palette** (⇧⌘P / Ctrl+Shift+P):
   - Type: `Tasks: Run Build Task`
   - Or: `Tasks: Run Task` → `Update All (Presets + Overlays)`

3. **Terminal Menu**:
   - Menu: `Terminal > Run Build Task...`
   - Or: `Terminal > Run Task...` → `Update All (Presets + Overlays)`

---

### Update Welcome Page Presets

Scans `presets/` directory and updates `welcome.html` and `manifest.json`.

**How to run:**

1. **Command Palette** (⇧⌘P / Ctrl+Shift+P):
   - Type: `Tasks: Run Task`
   - Select: `Update Welcome Page Presets`

2. **Terminal Menu**:
   - Menu: `Terminal > Run Task...`
   - Select: `Update Welcome Page Presets`

---

### Update Overlay Presets

Scans `assets/overlays/` directory and updates `config/overlayPresets.js`.

**How to run:**

1. **Command Palette** (⇧⌘P / Ctrl+Shift+P):
   - Type: `Tasks: Run Task`
   - Select: `Update Overlay Presets`

2. **Terminal Menu**:
   - Menu: `Terminal > Run Task...`
   - Select: `Update Overlay Presets`

---

## Web Interface

Prefer a visual interface? Open `utilities/project-updater.html` in your browser for:
- One-click command display
- Copy-to-clipboard functionality  
- Visual status indicators

---

## Custom Keyboard Shortcuts

Want to assign your own shortcuts? 

1. Open: `Code > Settings > Keyboard Shortcuts` (⌘K ⌘S)
2. Search: `Tasks: Run Task`
3. Click the `+` icon to add a keybinding
4. In the popup, type your preferred shortcut
5. Enter the task label: `Update Welcome Page Presets`

---

The task output will appear in a new terminal panel showing the results.
