# SpaceFlow — Quick Reference

**Fast lookup for common tasks**

## Build Commands

```bash
# Update all manifests (presets + overlays)
./scripts/update-all

# Or in VS Code: ⇧⌘B (default build task)

# Update welcome page presets only
./scripts/welcome-updater

# Update overlay presets only
./scripts/overlay-updater
```

**When to run:** After adding/removing/renaming preset or overlay files

---

## File Locations

```
Entry Points:
  index.html              — Main app (editor with full UI)
  welcome.html            — Project selector
  player.html             — Display window (no UI, synced)
  display.html            — Minimal display window

Core JavaScript:
  js/main.js              — App initialization, sketch setup
  js/config/defaults.js   — Default parameter values
  js/config/constants.js  — System constants

Framework Modules:
  js/core/Camera.js       — Camera transitions and state
  js/core/Emitter.js      — Patch loader (currently zigzag)
  js/core/ZigzagLine.js   — Individual line behavior
  js/core/Projection.js   — 3D to 2D projection math
  js/core/colorUtils.js   — Palette and RNG utilities
  js/core/utils.js        — General helpers
  
Exporters:
  js/export/SVGExporter.js    — Vector export (CRITICAL)
  js/export/PNGExporter.js    — Raster export
  js/export/VideoRecorder.js  — Video recording
  js/export/DepthExporter.js  — Depth map export

Presets & Config:
  presets/*.json              — Project presets
  presets/manifest.json       — Auto-generated preset list
  config/overlayPresets.js    — Overlay definitions
  config/uiPresets.json       — UI panel configurations

Documentation:
  docs/English/SPACEFLOW-ARCHITECTURE.md — Master design doc
  docs/English/Documentation.md          — Technical reference
  docs/English/User-Manual.md            — Complete UI guide
  docs/context/                          — AI assistant context
```

---

## Keyboard Shortcuts

```
UI Control:
  Tab           — Hide/show control panel
  Enter         — Fullscreen toggle
  
Camera:
  R             — Reset camera position
  0             — Reset zoom to default (600 units)
  
Color Palettes:
  1, 2, 3, 4    — Select palette (with transition)
  
Export:
  P             — Export PNG
  S             — Export SVG
  D             — Export depth map
  Ctrl+S/⌘+S    — Save project JSON
  
Modulation Toggles:
  t             — Toggle random thickness
  m             — Toggle random speed
  
Stereoscopic:
  y             — Toggle stereoscopic mode
```

---

## Mouse Controls

```
Canvas Only (not on UI):
  Left-click + drag       — Orbit (rotate X/Y)
  Right-click + drag      — Pan (offset X/Y)
  Middle-click + drag     — Roll (rotate Z)
  Mouse wheel             — Zoom (camera distance)
```

---

## Testing SVG Export

**Critical test after ANY code change:**

```
1. Load a preset (e.g., Horizon26)
2. Press S (or click "Export" → "SVG")
3. Verify file downloads (e.g., ZM-YYYY-MM-DD_HH-MM-SS.svg)
4. Open in Illustrator or Inkscape
5. Check:
   - Vectors are paths (not rasterized)
   - Colors match screen
   - Background color correct
   - Paths are editable/ungroupable
   - No artifacts or corruption
```

**If SVG fails:** Stop all work, fix immediately, retest

---

## Adding a New Preset

```bash
# 1. Create JSON file
presets/MyNewPreset.json

# 2. Copy structure from existing preset (e.g., Init.json)

# 3. Update manifest
./scripts/update-all

# 4. Test: Open welcome.html, verify new preset appears

# 5. Load preset, verify all parameters correct
```

**Preset Structure:**
```json
{
  "name": "My New Preset",
  "description": "Brief description",
  "params": { /* all parameter values */ },
  "states": [
    {
      "name": "State 1",
      "params": { /* state-specific params */ }
    }
  ],
  "palettes": [ /* 4 palettes, 4 colors each */ ]
}
```

---

## Adding a New Overlay

```bash
# 1. Add PNG with transparency
assets/overlays/MyLogo.png

# 2. Update config
# Edit: config/overlayPresets.js
# Add entry to OVERLAY_PRESETS array

# 3. Update manifest
./scripts/update-all

# 4. Test: Open index.html, check overlay selector
```

---

## State Management Workflow

```
Create State:
  1. Adjust parameters/camera to desired configuration
  2. Open "States" panel
  3. Click "Save" button
  4. State added to list with auto-generated name

Load State:
  - Click any state in list
  - Smooth transition (duration configurable)
  - Camera, colors, parameters all animate

Rename State:
  - Double-click state name in list
  - Or click ✎ button next to state

Reorder States:
  - Drag ⋮⋮ handle to reorder
  - Order persists across sessions

Delete State:
  - Select state
  - Click "Delete" button

Auto-Trigger:
  - Enable "Auto-Trigger" checkbox
  - Set frequency (5-120 seconds)
  - States cycle with shuffle algorithm

Export States:
  - Ctrl+S / ⌘+S to save entire project as JSON
  - Includes all states, palettes, current params
```

---

## Multi-Window Setup

```
Primary Window (Editor):
  1. Open index.html
  2. Full UI visible
  3. Make changes here

Secondary Window (Display):
  1. Open player.html or display.html
  2. Minimal/no UI
  3. Receives updates from primary
  4. Synced in real-time

Sync Behavior:
  - Parameter changes → instant sync
  - State loads → synchronized transition
  - Palette changes → synchronized transition
  - Camera movements → optional sync
```

---

## Common Parameters

```
Framework (Universal):
  cameraDistance           — Zoom level (default 600)
  cameraRotationX/Y        — Orbit angles (radians)
  fov                      — Field of view (degrees, default 60)
  activePaletteIndex       — Current palette (0-3)
  colorTransitionDuration  — Palette change time (0-30s)
  stateTransitionDuration  — State load time (0-30s)
  stereoscopicMode         — Dual-camera rendering (bool)
  framebufferMode          — Fixed resolution (bool)

Zigzag Patch:
  segmentLength            — Height per segment (10-200)
  lineThickness            — Ribbon width (1-100)
  emitRate                 — Lines per second (0.1-20)
  speed                    — Movement speed (10-500)
  geometryScale            — Uniform scale (10-300%)
  randomThickness          — Enable thickness variation
  randomSpeed              — Enable speed variation
```

---

## Project Structure Patterns

```
Universal Systems (Framework):
  - Camera, colors, export, sync, storage
  - Work with ANY patch
  - Never modified when adding new patches

Patch Systems (Pluggable):
  - Geometry generation, animation behavior
  - Patch-specific parameters
  - Future: loaded dynamically from manifest

Current Architecture:
  - Transitioning from monolithic to modular
  - See: SPACEFLOW-ARCHITECTURE.md
  - Migration plan: MIGRATION-STRATEGY.md (13 weeks)
```

---

## Troubleshooting

```
Issue: Preset not appearing in welcome.html
Fix: Run ./scripts/update-all to regenerate manifest

Issue: SVG export fails
Action: CRITICAL — stop work, check console errors
Check: js/export/SVGExporter.js, getGeometry() method

Issue: Multi-window sync not working
Check: BroadcastChannel support in browser
Check: Both windows using same channel name

Issue: Performance drops below 30fps
Check: Number of active lines (object pooling)
Check: Culling enabled for off-screen geometry
Check: Console for errors/warnings

Issue: State loads but parameters incorrect
Check: Parameter names match between state JSON and defaults.js
Check: localStorage might have stale data — clear and reload

Issue: Overlay not showing
Check: File path in overlayPresets.js correct
Check: PNG has transparency (alpha channel)
Check: Overlay visible toggle enabled
Check: Opacity > 0, scale > 0
```

---

## Git Workflow

```bash
# Before major refactoring
git checkout -b backup/pre-[change-name]
git tag v[version]-stable

# Development
git checkout -b feature/[feature-name]
# Make changes
# Test SVG export
git commit -m "descriptive message"

# After testing
git checkout main
git merge feature/[feature-name]
git push
```

**Never commit without testing SVG export**

---

## Performance Monitoring

```javascript
// In browser console:

// Get current FPS
ZM.performanceMonitor.currentFPS

// Get statistics
ZM.performanceMonitor.getStats()
// Returns: { avgFPS, minFPS, maxFPS, drops }

// Reset stats
ZM.performanceMonitor.reset()

// Check line count
ZM.emitter.lines.length
```

---

## Debug Console Commands

```javascript
// Global state
ZM.params          — Current parameters
ZM.states          — State snapshots array
ZM.palettes        — Color palette data
ZM.camera          — Camera instance

// Emitter
ZM.emitter.lines   — Active lines array
ZM.emitter.emit()  — Spawn new line

// Storage
localStorage.getItem('ZM.params')
localStorage.getItem('ZM.states')

// Export
ZM.exportPNG()
ZM.exportSVG()
ZM.exportDepthMap()

// Camera
ZM.camera.reset()
ZM.camera.startTransition(newState)
```

---

## Version History Patterns

```
v1.x  — Original ZigMap (monolithic)
v2.x  — ZigMap26 (improved features)
v26.x — SpaceFlow branding, architecture docs
v27.x — (Future) Full modular framework
```

Current: v26.3 (May 2026)
