# SpaceFlow — Working Knowledge & Conventions

**Implicit knowledge and practical wisdom for working with this codebase**

---

## Code Style & Conventions

### Naming Patterns

**Classes:**
- PascalCase: `Camera`, `Emitter`, `ZigzagLine`
- Descriptive: `PerformanceMonitor`, `StateManager`, `SVGExporter`

**Functions:**
- camelCase: `projectPoint()`, `getSpawnDistance()`, `buildRibbonSides()`
- Verb-first: action clearly stated

**Variables:**
- camelCase: `segmentLength`, `lineThickness`, `emitRate`
- Full words (no abbreviations except common ones: `fps`, `fov`, `pos`)

**Files:**
- PascalCase for classes: `Camera.js`, `Emitter.js`
- camelCase for utilities: `utils.js`, `colorUtils.js`
- kebab-case for HTML: `index.html`, `welcome.html`

**Constants:**
- SCREAMING_SNAKE_CASE: `DEFAULT_FOV`, `MAX_LINES`
- Defined in `js/config/constants.js`

### Module Pattern

**ES6 modules everywhere:**
```javascript
// Export
export class Camera { }
export function projectPoint() { }

// Import
import { Camera } from './core/Camera.js';
import { projectPoint } from './core/Projection.js';
```

**No CommonJS, no AMD** — pure ES6 modules

### Global Namespace

**Single global:** `window.SpaceFlow` or `window.ZM`
- Avoids pollution
- Everything accessible for console debugging
- Pattern: `window.SpaceFlow.exportSVG()`

**Properties exposed:**
```javascript
window.SpaceFlow = {
  params,           // Current parameters
  states,           // State snapshots
  camera,           // Camera instance
  emitterInstance,  // Current patch
  stateManager,     // State management
  exportSVG,        // Export functions
  exportPNG,
  // ... etc
};
```

---

## Code Organization Philosophy

### Separation of Concerns

**Framework vs Patch:**
- Framework: Never knows about zigzags specifically
- Patch: Only knows about its own geometry
- Interface: Clean contract between them

**Universal vs Specific:**
- Universal: Camera, colors, export (work with ANY patch)
- Specific: Emitter, ZigzagLine (zigzag implementation)

### Single Responsibility

**Each file has ONE job:**
- `Camera.js` → Camera state and transitions
- `Projection.js` → 3D to 2D math
- `colorUtils.js` → Color and palette utilities
- `SVGExporter.js` → SVG generation ONLY

**No "god objects"** — keep classes focused

### Pure Functions Preferred

**Projection calculations:**
```javascript
// Pure: no side effects, deterministic
export function projectPoint(x, y, z, options) {
  // Math only, returns result
  return { screenX, screenY };
}
```

**State management:**
```javascript
// Impure but necessary (manages global state)
class StateManager {
  saveState() { /* modifies this.states */ }
}
```

---

## Parameter Management

### Parameter Flow

```
defaults.js (initial values)
    ↓
localStorage (persistence)
    ↓
ZM.params (runtime state)
    ↓
UI controls (visual display)
    ↓
Emitter/Lines (rendering)
```

### Adding New Parameters

**Current workflow (pre-migration):**
1. Add to `js/config/defaults.js`
2. Add UI control in `index.html`
3. Wire in UI controller (event listeners)
4. Access in patch code via `ZM.params.newParam`

**Future workflow (post-migration):**
1. Add to patch `manifest.json`
2. Everything else auto-generated

### Parameter Naming

**Pattern:** `[category][Property]`
- `segment` + `Length` → `segmentLength`
- `emit` + `Rate` → `emitRate`
- `camera` + `Distance` → `cameraDistance`

**Avoid:**
- Abbreviations: `segLen` ❌ → `segmentLength` ✅
- Redundancy: `lineLineThickness` ❌ → `lineThickness` ✅

---

## State Management Patterns

### State Structure

```javascript
{
  name: "State Name",        // User-visible
  params: { /* all params */ }, // Complete snapshot
  timestamp: 1234567890      // Optional metadata
}
```

**ALWAYS include ALL parameters** — states are complete, not diffs

### State Loading Flow

```
User clicks state
    ↓
StateManager.loadState(index)
    ↓
Camera.startTransition(newCameraState)
    ↓
Color transition triggers for lines
    ↓
Parameters lerp over stateTransitionDuration
    ↓
UI updates to reflect new values
```

### Transition Timing

**Two independent timelines:**
- `colorTransitionDuration`: Palette changes
- `stateTransitionDuration`: Camera/geometry changes

**Easing:** Cubic ease-in-out for smooth feel

---

## Color System Philosophy

### Deterministic RNG

**Why seeded RNG?**
- Reproducibility: Same seed = same pattern
- State compatibility: Colors consistent across loads/exports
- Export accuracy: SVG matches screen exactly

**Implementation:**
```javascript
// mulberry32 PRNG
import { initColorRNG } from './core/colorUtils.js';

// Initialize with seed
const rng = initColorRNG(params.colorRandomSeed);

// Generate colors
const color = rng(); // Returns 0.0 - 1.0
```

### Palette Structure

```javascript
[
  [ // Palette 0
    { r: 255, g: 0, b: 0, role: 'line' },
    { r: 0, g: 255, b: 0, role: 'line' },
    { r: 0, g: 0, b: 255, role: 'background' },
    { r: 255, g: 255, b: 0, role: 'none' }
  ],
  [ /* Palette 1 */ ],
  [ /* Palette 2 */ ],
  [ /* Palette 3 */ ]
]
```

**Roles:**
- `line`: Available for line colors
- `background`: Canvas background
- `none`: Reserved/unused

---

## Export System Patterns

### Export Flow

```
User triggers export
    ↓
Get current frame state
    ↓
SVG: getGeometry() → build XML
PNG: Canvas snapshot
Video: Frame capture loop
Depth: Z-buffer render
    ↓
Generate file blob
    ↓
Trigger browser download
```

### SVG Export Critical Path

**MUST implement for every patch:**
```javascript
class MyPatch {
  getGeometry() {
    return {
      lines: [
        [{ x, y, z }, { x, y, z }, ...], // Array of point arrays
        ...
      ],
      colors: [
        { r, g, b, a },                  // Corresponding colors
        ...
      ]
    };
  }
}
```

**Framework handles:**
- Projection (3D → 2D)
- SVG XML generation
- Background color
- File download

---

## Performance Patterns

### Object Pooling

**For frequently created/destroyed objects:**
```javascript
class Emitter {
  constructor() {
    this.lines = [];      // Active lines
    this.maxLines = 200;  // Pool size
  }
  
  emit() {
    // Reuse if possible, create if needed
    if (this.lines.length < this.maxLines) {
      this.lines.push(new ZigzagLine());
    }
  }
  
  cullOldLines() {
    // Remove, don't reallocate
    this.lines = this.lines.filter(line => !line.isDead);
  }
}
```

**Avoid:**
- Creating new objects every frame
- Frequent array reallocations

### Culling Strategy

**Don't render off-screen geometry:**
```javascript
draw() {
  for (let line of this.lines) {
    // Check if visible before drawing
    if (line.z > camera.far || line.z < camera.near) continue;
    
    line.draw();
  }
}
```

### Performance Monitoring

**Always available:**
```javascript
window.SpaceFlow.performanceMonitor.currentFPS
window.SpaceFlow.performanceMonitor.getStats()
```

**Target:** 60fps on modern hardware

---

## Multi-Window Sync Patterns

### BroadcastChannel Usage

**Primary window (editor):**
```javascript
const channel = new BroadcastChannel('spaceflow-sync');

// Send updates
function updateParameter(key, value) {
  params[key] = value;
  channel.postMessage({ type: 'paramUpdate', key, value });
}
```

**Secondary windows (player/display):**
```javascript
const channel = new BroadcastChannel('spaceflow-sync');

// Receive updates
channel.onmessage = (event) => {
  if (event.data.type === 'paramUpdate') {
    params[event.data.key] = event.data.value;
  }
};
```

**Messages:**
- `paramUpdate`: Single parameter changed
- `stateLoad`: Complete state loading
- `paletteChange`: Palette switch

---

## Testing Patterns

### Manual Testing Checklist

**After ANY code change:**
1. ✅ Page loads without errors
2. ✅ Camera controls work (orbit, pan, zoom)
3. ✅ States can be saved and loaded
4. ✅ Palette switching works (keys 1-4)
5. ✅ **SVG export works** (CRITICAL)
6. ✅ PNG export works
7. ✅ Performance at 60fps
8. ✅ Multi-window sync (if modified)

### SVG Export Verification

**Detailed test:**
1. Load preset (e.g., Horizon26)
2. Adjust camera to interesting angle
3. Press `S` key or click SVG export
4. File downloads: `ZM-[timestamp].svg`
5. Open in Illustrator or Inkscape
6. Verify:
   - Vectors are paths (not images)
   - Colors match screen
   - Background color correct
   - Paths are editable
   - No visual artifacts
   - Proper grouping/layering

**If fails:** STOP, fix, retest

### Console Smoke Test

```javascript
// Quick verification in console
window.SpaceFlow.exportSVG();  // Should download SVG
window.SpaceFlow.params;       // Should show all parameters
window.SpaceFlow.camera;       // Should show camera instance
window.SpaceFlow.emitterInstance.lines.length; // Line count
```

---

## Common Pitfalls & Solutions

### Pitfall: localStorage Corruption

**Symptom:** App loads with broken state, console errors

**Solution:**
```javascript
// Clear localStorage
localStorage.clear();
// Reload page
location.reload();
```

**Prevention:** Validate data before saving

### Pitfall: State Transition Stutter

**Symptom:** Jerky camera movement when loading states

**Solution:** Use ease-in-out, not linear
```javascript
// In Camera.js
easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}
```

### Pitfall: Color RNG Not Reset

**Symptom:** Colors differ between loads

**Solution:** Reset RNG when state loads
```javascript
import { initColorRNG } from './core/colorUtils.js';

function loadState(state) {
  Object.assign(params, state.params);
  colorRNG = initColorRNG(params.colorRandomSeed); // RESET
  // ...
}
```

### Pitfall: SVG Export Breaks After Refactor

**Symptom:** SVG export downloads but file is corrupt/empty

**Root cause:** `getGeometry()` returns wrong structure

**Solution:** Verify return format exactly matches spec
```javascript
{
  lines: [ [point, point, ...], ... ],  // Array of arrays
  colors: [ {r, g, b, a}, ... ]         // Parallel array
}
```

### Pitfall: Performance Degradation

**Symptom:** FPS drops over time

**Likely causes:**
1. Memory leak (lines not culled)
2. Too many objects created
3. Inefficient loops

**Debug:**
```javascript
console.log(window.SpaceFlow.emitterInstance.lines.length);
// Should stabilize, not grow indefinitely
```

**Solution:** Check culling logic, object pooling

---

## Git Workflow Best Practices

### Branch Naming

```
main              — Stable, tested code
feature/xyz       — New features
fix/bug-name      — Bug fixes
refactor/system   — Code improvements
backup/pre-change — Safety snapshots
```

### Commit Messages

**Pattern:** `<type>: <brief description>`

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `refactor:` Code restructure (no behavior change)
- `perf:` Performance improvement
- `test:` Testing additions/changes

**Examples:**
```
feat: add stereoscopic rendering mode
fix: SVG export colors incorrect for background
docs: update PATCH-SYSTEM.md with manifest spec
refactor: extract projection math to Projection.js
perf: implement object pooling for lines
```

### Before Committing

**Checklist:**
- [ ] Code runs without errors
- [ ] SVG export tested and works
- [ ] No console warnings
- [ ] Performance acceptable (>30fps minimum)
- [ ] Changes documented (if needed)
- [ ] Commit message clear

---

## File Size Guidelines

**Keep files manageable:**
- Classes: 200-500 lines ideal
- Utilities: < 200 lines
- If > 500 lines, consider splitting

**Example:**
- `Camera.js`: ~150 lines ✅
- `Projection.js`: ~100 lines ✅
- `main.js`: ~600 lines (refactor candidate) ⚠️

---

## Documentation Maintenance

### When to Update Docs

**Always update when:**
- Adding new parameter
- Changing keyboard shortcut
- Adding export format
- Changing API

**Update these files:**
- `README.md` — If user-facing
- `Documentation.md` — If parameter/technical
- `User-Manual.md` — If UI/workflow
- `docs/context/quick-reference.md` — If common task

### Documentation Style

**Be concise but complete:**
- Short paragraphs (3-5 sentences)
- Use tables for parameter lists
- Include code examples
- Add diagrams where helpful (Mermaid)

**Avoid:**
- Walls of text
- Redundancy (link instead of repeating)
- Outdated info (update or remove)

---

## Future-Proofing Patterns

### Write Framework-Agnostic Code

**Good (framework layer):**
```javascript
// Works with any patch
function exportSVG(geometryData) {
  const { lines, colors } = geometryData;
  // Generate SVG...
}
```

**Bad (patch-specific in framework):**
```javascript
// Coupled to zigzag
function exportSVG() {
  const lines = emitter.zigzagLines; // ❌
  // ...
}
```

### Use Interfaces, Not Implementations

**Think in terms of contracts:**
```javascript
// Patch MUST provide
interface Patch {
  setup(config)
  update(dt, params)
  draw(p, camera, params)
  getGeometry()        // For SVG export
}
```

### Composition Over Inheritance

**Prefer:**
```javascript
class Emitter {
  constructor() {
    this.camera = new Camera();     // Composition
    this.colorSystem = new Colors(); // Composition
  }
}
```

**Over:**
```javascript
class Emitter extends Camera { } // Inheritance (tight coupling)
```

---

## Summary: Core Principles

1. **SVG Export is Sacred** — Never break it
2. **Framework vs Patch** — Keep separation clean
3. **Pure Functions** — Where possible
4. **Deterministic** — Same input = same output
5. **Performance Matters** — 60fps target
6. **Document as You Go** — Don't defer
7. **Test Before Commit** — Especially SVG
8. **Convention Over Configuration** — Follow patterns
9. **Simplicity** — Solve real problems, not imaginary ones
10. **Future-Proof** — Think modularly

---

**This knowledge will help any developer (human or AI) work effectively with SpaceFlow.**
