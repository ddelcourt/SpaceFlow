# SpaceFlow — Critical Features & Priorities

**Features that must ALWAYS work**

## 🚨 Priority 1: SVG Export (NON-NEGOTIABLE)

**Why it matters:**
- Professional workflow requirement
- Print shops need vectors
- Resolution-independent graphics
- Editable in Illustrator/Inkscape
- Small file sizes with infinite detail
- Mathematical precision (no anti-aliasing)

**Implementation:**
- `SVGExporter.js` converts geometry to SVG paths
- Patches MUST implement `getGeometry()` method
- Returns `{lines: [...], colors: [...]}` structure
- Framework handles projection and SVG XML generation

**Testing Protocol:**
1. Load any preset
2. Press `S` or click "SVG" button
3. Verify file downloads
4. Open in Illustrator/Inkscape
5. Verify vectors are clean, colors correct, paths editable

**If SVG breaks:**
1. STOP all work immediately
2. Identify breaking change
3. Fix or revert
4. Test again before proceeding

**Rule:** No commit without verified SVG export

---

## Priority 2: State Management

**Why it matters:**
- Core workflow for users
- Save/load configurations
- Auto-trigger for performances
- Preset system foundation

**Features:**
- Save complete snapshots (camera + colors + parameters)
- Load with smooth transitions
- Drag-and-drop reordering
- Double-click to rename
- Auto-trigger cycling (5-120s intervals)
- Shuffle algorithm (no immediate repeats)

**Storage:**
- localStorage for automatic persistence
- JSON export for sharing
- First state in preset loads on page load
- Last active state remembered across sessions

**Testing:**
1. Create new state
2. Modify parameters
3. Load previous state
4. Verify smooth transition
5. Export JSON, reload, verify identical

---

## Priority 3: Camera System

**Why it matters:**
- 3D navigation is core interaction
- All visual output depends on correct projection
- Multi-window sync requires camera coordination

**Controls:**
- Orbit: Left-click + drag (X/Y rotation)
- Pan: Right-click + drag (offset X/Y)
- Roll: Middle-click + drag (Z rotation)
- Zoom: Mouse wheel (distance)
- Reset: R key, 0 key for default zoom

**Features:**
- Smooth transitions when loading states
- Independent control per canvas (stereoscopic mode)
- Framebuffer mode: rendering resolution independent of window size

**Projection:**
- Perspective projection with FOV control
- Near/far clipping planes
- Matrix calculations in `Projection.js`
- Same math for canvas and SVG export

---

## Priority 4: Color Palette System

**Why it matters:**
- Visual identity of each preset
- Artistic control over aesthetics
- Transitions create visual interest

**Features:**
- 4 palettes with 4 colors each
- Color roles: `line`, `background`, `none`
- Deterministic RNG (seeded) for consistent selection
- Per-line color transitions (0-30s duration)
- Background transitions synchronized
- Keyboard shortcuts: 1, 2, 3, 4

**Implementation:**
- `colorUtils.js` — mulberry32 PRNG
- Each line transitions independently
- Shared timing from `params.colorTransitionDuration`

---

## Priority 5: Multi-Window Sync

**Why it matters:**
- Projection mapping use case
- Live performance with separate display
- Editor + display windows need frame-perfect sync

**Implementation:**
- BroadcastChannel API for real-time communication
- `WindowSync.js` handles messaging
- Primary window: Full UI, sends updates
- Secondary windows: Receive-only, minimal UI

**Sync Events:**
- Parameter changes
- State loads
- Palette changes
- Camera movements (optional)

**Testing:**
1. Open `index.html` (primary)
2. Open `player.html` or `display.html` (secondary)
3. Change parameters in primary
4. Verify instant update in secondary
5. Load state, verify synchronized transition

---

## Priority 6: Export System

**Why it matters:**
- Output for social media, print, archival
- Multiple formats for different workflows
- High-quality captures essential

**Formats:**
- **PNG:** Rasterized canvas capture, respects framebuffer resolution
- **SVG:** Vector export (priority 1)
- **Video:** WebM or other codec, configurable FPS/duration
- **Depth Map:** Grayscale Z-depth for compositing

**Features:**
- Framebuffer mode for fixed resolution
- Stereoscopic mode captures both eyes
- Background color control
- Timestamp in filenames

**Keyboard Shortcuts:**
- P: PNG export
- S: SVG export
- D: Depth map export
- Video: UI button only (recording)

---

## Priority 7: Preset System

**Why it matters:**
- Curated starting points for users
- Demonstration of capabilities
- Easy sharing of configurations

**Structure:**
```
presets/
  Init.json               — Default starter
  Horizon26.json          — Example presets
  FashionLedShow.json
  ...
  manifest.json           — Auto-generated list
```

**Workflow:**
1. Create/modify preset JSON
2. Run `./scripts/update-all` (⇧⌘B)
3. Manifest updates automatically
4. `welcome.html` displays new presets

**Preset Contents:**
- All parameters (framework + patch)
- Multiple states with names
- Color palettes (4×4 array)
- Camera positions
- Metadata (name, description, author)

---

## Priority 8: Overlay System

**Why it matters:**
- Branding for client projects
- Logo placement for social media
- Professional polish for outputs

**Features:**
- PNG overlay with transparency
- Position control (percentage-based)
- Scale and opacity sliders
- Auto-fit to canvas
- Presets + custom upload

**Implementation:**
- `overlayPresets.js` defines available overlays
- `assets/overlays/` stores preset PNG files
- Canvas overlay drawn per-frame
- Exported in PNG/Video, excluded from SVG

**Testing:**
1. Load overlay preset or upload custom
2. Adjust position/scale/opacity
3. Verify canvas display
4. Export PNG, verify overlay included
5. Export SVG, verify overlay excluded

---

## Priority 9: Performance

**Why it matters:**
- 60fps essential for smooth visuals
- Live performance demands consistency
- Responsive camera controls

**Target:**
- 60fps on modern hardware (2020+)
- Graceful degradation on slower systems
- Real-time FPS monitor in UI

**Strategies:**
- Object pooling for lines (reduce GC)
- Culling: Don't draw off-screen geometry
- Efficient projection calculations
- Minimal per-frame allocations

**Monitoring:**
- `PerformanceMonitor.js` tracks FPS
- UI displays current framerate
- Warns if drops below 30fps

---

## Priority 10: Documentation

**Why it matters:**
- Complex system requires clear documentation
- Users need guidance for features
- Developers need architecture understanding
- Future maintenance depends on documentation

**Documentation Files:**
- `README.md` — Quick start, basic controls
- `User-Manual.md` — Complete UI reference
- `Documentation.md` — Technical reference
- `SPACEFLOW-ARCHITECTURE.md` — Design vision
- `PATCH-SYSTEM.md` — Patch interface spec
- `MIGRATION-STRATEGY.md` — Implementation roadmap
- `Transition-System-Architecture.md` — Transition details
- `Projection-Matrix-Guide.md` — Math documentation

**Bilingual:**
- English primary
- French translations (fr suffix)

**Maintenance:**
- Update docs when adding features
- Keep code examples current
- Verify accuracy after refactoring
