# SpaceFlow — Console Commands Reference

**Browser Console Commands and Global API**

This document lists all console commands and global functions available for debugging, automation, and advanced control of SpaceFlow.

---

## Table of Contents

0. [Understanding SpaceFlow: Framework vs Patch](#understanding-spaceflow-framework-vs-patch)
1. [Performance Monitoring](#performance-monitoring)
2. [Global Namespace](#global-namespace)
3. [Export Functions](#export-functions)
4. [State Management](#state-management)
5. [Storage Functions](#storage-functions)
6. [Camera Control](#camera-control)
7. [Color System](#color-system)
8. [Parameter Access](#parameter-access)
9. [Advanced Operations](#advanced-operations)

---

## Understanding SpaceFlow: Framework vs Patch

**SpaceFlow is a framework**, not just an application. It provides universal systems that work with any visual algorithm (patch).

### Framework (Universal)

These systems are **always available** regardless of which patch is loaded:

- 🎥 **Camera System** — 3D navigation, orbit controls, projection
- 🎨 **Color System** — 4 palettes with 4 colors each, smooth transitions
- 💾 **Storage System** — localStorage, JSON import/export
- 📊 **State Management** — Save/load complete snapshots, history navigation
- 📤 **Export System** — SVG, PNG, depth maps, video recording
- 🔗 **Window Sync** — Multi-window coordination
- 🖼️ **Overlay System** — Logo/branding positioning
- 🏛️ **UI Shell** — Control panel generation and layout

### Patch (Current: Zigzag Emitter)

The **visual algorithm** that generates graphics. Currently loaded patch:

- **Name:** Zigzag Emitter
- **Purpose:** Animated 3D ribbon patterns
- **Patch-specific parameters:** `segmentLength`, `lineThickness`, `emitRate`, `speed`, modulation settings
- **Patch-specific objects:** `window.SpaceFlow.emitterInstance`, `lines` array

### Key Concept

💡 **Framework commands** (camera, colors, export, states) will work with ANY future patch.  
💡 **Patch commands** (emitterInstance, lines) are specific to the Zigzag patch.

When reading this documentation:
- ✅ **Framework operations** are future-proof
- ⚠️ **Patch operations** may not exist in other patches

---

## Performance Monitoring

### `showPerformanceStats()`

Displays detailed performance metrics in the console.

**Usage:**
```javascript
showPerformanceStats()
```

**Output:**
```
═════════════════════════════════════════
PERFORMANCE STATS (last 60 frames)
═════════════════════════════════════════
FPS:
  Current: 60.0
  Average: 59.8
  Min: 58.2
  Max: 60.0

Frame Time:
  Average: 16.72ms
  Max: 17.21ms
  Target: 16.67ms (60fps)

Rendering:
  Active Lines: 87
  Draw Calls/Frame: 87
  Update Calls/Frame: 0
═════════════════════════════════════════
```

**When to use:**
- Diagnosing performance issues
- Identifying frame rate drops
- Monitoring rendering load
- Verifying optimization results

---

## Global Namespace

All functionality is accessible via the global `window.SpaceFlow` object (alias: `ZM`).

```javascript
const ZM = window.SpaceFlow;
```

### Framework Properties (Universal)

These are **always available** regardless of loaded patch:

```javascript
// View current parameters (framework + patch)
console.log(window.SpaceFlow.params);

// Check camera state (framework)
console.log(window.SpaceFlow.camera);

// Check canvas dimensions (framework)
console.log(window.SpaceFlow.W, window.SpaceFlow.H);

// State manager (framework)
console.log(window.SpaceFlow.stateManager);

// p5.js instance (framework)
console.log(window.SpaceFlow.p5Instance);
```

### Patch-Specific Properties (Zigzag)

These are **specific to the Zigzag Emitter patch**:

```javascript
// Zigzag emitter instance (patch-specific)
console.log(window.SpaceFlow.emitterInstance);

// Count active lines (patch-specific)
console.log(window.SpaceFlow.emitterInstance.lines.length);

// Noise offset for animation (patch-specific)
console.log(window.SpaceFlow.noiseOffset);
```

⚠️ **Note:** Patch-specific properties may not exist if a different patch is loaded in the future.

---

## Export Functions

### `window.SpaceFlow.exportSVG()`

Exports current frame as SVG vector graphics.

**Usage:**
```javascript
window.SpaceFlow.exportSVG()
```

**Features:**
- Resolution-independent vector format
- Editable in Illustrator, Inkscape, etc.
- Includes full geometry with camera transforms
- Maintains color and z-ordering

---

### `window.SpaceFlow.exportPNG()`

Exports current frame as PNG raster image.

**Usage:**
```javascript
window.SpaceFlow.exportPNG()
```

**Features:**
- Includes overlay image if active
- Supports stereoscopic export (side-by-side)
- Canvas resolution dependent
- Framebuffer mode support

---

### `window.SpaceFlow.exportDepthMap()`

Exports depth map (Z-buffer visualization).

**Usage:**
```javascript
window.SpaceFlow.exportDepthMap()
```

**Output:**
- Grayscale PNG where brightness = distance from camera
- Black = nearest, White = farthest
- Auto-ranging for optimal contrast

---

### `window.SpaceFlow.startVideoRecording()`

Begins video capture.

**Usage:**
```javascript
window.SpaceFlow.startVideoRecording()
```

**Settings:**
- Duration: `window.SpaceFlow.params.videoDuration` (seconds)
- FPS: `window.SpaceFlow.params.videoFPS`
- Format: `window.SpaceFlow.params.videoFormat` (`'webm'`)

---

### `window.SpaceFlow.stopVideoRecording()`

Stops video capture early.

**Usage:**
```javascript
window.SpaceFlow.stopVideoRecording()
```

---

### `window.SpaceFlow.isVideoRecording()`

Check if video recording is active.

**Usage:**
```javascript
if (window.SpaceFlow.isVideoRecording()) {
  console.log('Recording in progress...');
}
```

---

## State Management

### `window.SpaceFlow.stateManager`

Access the state management system.

#### Save Current State

```javascript
// Save current parameters as a new state
window.SpaceFlow.stateManager.save('My State Name')
```

#### Load State

```javascript
// Load state by ID (with transition)
window.SpaceFlow.stateManager.load('state-id-1234')

// Load state instantly (no transition)
window.SpaceFlow.stateManager.load('state-id-1234', true)
```

#### Update State

```javascript
// Update existing state with current parameters
window.SpaceFlow.stateManager.update('state-id-1234')
```

#### Delete State

```javascript
window.SpaceFlow.stateManager.delete('state-id-1234')
```

#### Rename State

```javascript
window.SpaceFlow.stateManager.rename('state-id-1234', 'New Name')
```

#### List All States

```javascript
const states = window.SpaceFlow.stateManager.getAllStates()
console.table(states.map(s => ({ id: s.id, name: s.name })))
```

#### Load Random State

```javascript
// Loads a random state (excluding current)
window.SpaceFlow.stateManager.loadRandomState()
```

#### Navigate State History

```javascript
// Go to previous state in history
window.SpaceFlow.stateManager.navigateHistory(-1)

// Go to next state in history
window.SpaceFlow.stateManager.navigateHistory(1)
```

#### Export State

```javascript
// Export single state to JSON file
window.SpaceFlow.stateManager.exportState('state-id-1234')

// Export all states to JSON file
window.SpaceFlow.stateManager.exportAll()
```

---

## Storage Functions

### `window.SpaceFlow.saveToLocalStorage()`

Saves current parameters to browser localStorage.

**Usage:**
```javascript
window.SpaceFlow.saveToLocalStorage()
```

**Saved data:**
- All parameters from `window.SpaceFlow.params`
- Project name
- Active palette index

---

### `window.SpaceFlow.loadFromLocalStorage()`

Loads parameters from browser localStorage.

**Usage:**
```javascript
if (window.SpaceFlow.loadFromLocalStorage()) {
  console.log('Settings loaded from localStorage');
} else {
  console.log('No saved settings found');
}
```

---

### `window.SpaceFlow.downloadJSON()`

Downloads current project as JSON file.

**Usage:**
```javascript
// Standard format (v2)
window.SpaceFlow.downloadJSON()

// Legacy format (v1)
window.SpaceFlow.downloadJSON('legacy')

// Custom filename
window.SpaceFlow.downloadJSON('standard', 'my-project.json')
```

**File includes:**
- All parameters
- All saved states
- Active state ID
- Project metadata

---

### `window.SpaceFlow.loadJSON(file)`

Loads project from JSON file.

**Usage:**
```javascript
// Typically triggered via file input
// But can be called programmatically with a File object
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', (e) => {
  window.SpaceFlow.loadJSON(e.target.files[0]);
});
```

---

## Camera Control

### Camera Object

Access via `window.SpaceFlow.camera`

```javascript
const cam = window.SpaceFlow.camera;

// Current camera state
console.log('Rotation X:', cam.rotationX);
console.log('Rotation Y:', cam.rotationY);
console.log('Distance:', cam.distance);
console.log('Offset:', cam.offsetX, cam.offsetY);
```

### Reset Camera

```javascript
// Reset to default position
window.SpaceFlow.camera.rotationX = 0;
window.SpaceFlow.camera.rotationY = 0;
window.SpaceFlow.camera.distance = 600;
window.SpaceFlow.camera.offsetX = 0;
window.SpaceFlow.camera.offsetY = 0;
window.SpaceFlow.camera.syncToParams(window.SpaceFlow.params);
```

### Animate Camera Transition

```javascript
// Transition to new camera position over time
window.SpaceFlow.camera.transitionTo({
  rotationX: -0.5,
  rotationY: 0.3,
  distance: 800,
  offsetX: 0,
  offsetY: 0
});
```

---

## Color System

### Trigger Palette Change

```javascript
// Switch to palette by index (0-3)
window.SpaceFlow.params.activePaletteIndex = 2;
window.SpaceFlow.triggerPaletteChange();
```

### Access Palettes

```javascript
// View all palettes
console.log(window.SpaceFlow.params.palettes);

// Get active palette
const activePalette = window.SpaceFlow.params.palettes[
  window.SpaceFlow.params.activePaletteIndex
];
console.log('Active palette:', activePalette);
```

### Modify Colors

```javascript
// Change a color in palette 0, slot 0
window.SpaceFlow.params.palettes[0][0].rgb = [255, 100, 50];

// Trigger palette transition to see changes
window.SpaceFlow.triggerPaletteChange();
```

---

## Parameter Access

### View All Parameters

```javascript
// Log entire parameter object (framework + patch parameters)
console.log(window.SpaceFlow.params);

// Pretty print as JSON
console.log(JSON.stringify(window.SpaceFlow.params, null, 2));
```

### Modify Framework Parameters (Universal)

```javascript
const ZM = window.SpaceFlow;

// Camera (framework)
ZM.params.fov = 75;
ZM.params.cameraDistance = 800;
ZM.params.cameraRotationX = 0.5;

// Animation (framework)
ZM.params.ambientSpeedMaster = 80;  // Global time scale

// Colors (framework)
ZM.params.activePaletteIndex = 2;
ZM.params.colorTransitionDuration = 3.0;

// After modifying params, sync UI
if (ZM.syncUIFromParams) {
  ZM.syncUIFromParams();
}
```

### Modify Patch Parameters (Zigzag-Specific)

```javascript
const ZM = window.SpaceFlow;

// Geometry (patch)
ZM.params.segmentLength = 150;
ZM.params.lineThickness = 30;
ZM.params.geometryScale = 120;

// Animation (patch)
ZM.params.emitRate = 2.5;
ZM.params.speed = 100;

// After modifying params, sync UI
if (ZM.syncUIFromParams) {
  ZM.syncUIFromParams();
}
```

⚠️ **Note:** Patch parameters are specific to the Zigzag Emitter. Future patches will have different parameters.

### Query Canvas State

```javascript
const ZM = window.SpaceFlow;

// Canvas dimensions
console.log('Width:', ZM.W, 'Height:', ZM.H);

// Rendering mode
console.log('Stereo mode:', ZM.params.stereoscopicMode);
console.log('Framebuffer mode:', ZM.params.framebufferMode);

// Frame info
console.log('Sketch ready:', ZM.sketchReady);
console.log('p5 instance:', !!ZM.p5Instance);
```

---

## Advanced Operations

### Access p5.js Instance (Framework)

```javascript
// Access the p5.js rendering instance
const p = window.SpaceFlow.p5Instance;

if (p) {
  console.log('Canvas:', p.width, 'x', p.height);
  console.log('Frame count:', p.frameCount);
  console.log('Frame rate:', p.frameRate());
}
```

### Manual Reinitialization (Framework)

```javascript
// Force complete reinitialization
if (window.SpaceFlow.reinitialize) {
  window.SpaceFlow.reinitialize();
}
```

---

## Patch-Specific Operations (Zigzag)

⚠️ **These commands are specific to the Zigzag Emitter patch and may not work with other patches.**

### Access Emitter

```javascript
const emitter = window.SpaceFlow.emitterInstance;

if (emitter) {
  // Count active lines
  console.log('Active lines:', emitter.lines.length);
  
  // Get emission rate
  console.log('Emit rate:', emitter.params.emitRate);
  
  // Access individual lines
  emitter.lines.forEach((line, i) => {
    console.log(`Line ${i}:`, {
      x: line.x,
      y: line.y,
      thickness: line.lineThickness,
      color: line.currentColor,
      age: line.age
    });
  });
}
```

### Force Geometry Regeneration

```javascript
// Clear all lines and restart emission (Zigzag-specific)
const ZM = window.SpaceFlow;
if (ZM.emitterInstance) {
  ZM.emitterInstance.lines = [];
}
```

### Inspect p5.js Instance

```javascript
// Access p5 drawing context
const p = window.SpaceFlow.p5Instance;

if (p) {
  console.log('Frame count:', p.frameCount);
  console.log('Frame rate:', p.frameRate());
  console.log('Canvas:', p.canvas);
}
```

### Manual Sketch Reinitialization

```javascript
// Reinitialize sketches (advanced)
window.SpaceFlow.initializeSketches();
```

### Access Core Classes

```javascript
// Create custom zigzag line
const ZM = window.SpaceFlow;
const line = new ZM.ZigzagLine({
  p: ZM.p5Instance,
  x: ZM.W / 2,
  y: ZM.H / 2,
  segmentLength: 120,
  lineThickness: 24,
  lineColor: [255, 255, 255],
  colorSlotIndex: 0,
  vy: -80,
  canvasWidth: ZM.W,
  canvasHeight: ZM.H,
  params: ZM.params,
  getSpawnDistanceFn: ZM.getSpawnDistance,
  buildRibbonSidesFn: ZM.buildRibbonSides
});

// Add to emitter
ZM.emitterInstance.lines.push(line);
```

---

## Utility Commands

### Clear localStorage

```javascript
localStorage.removeItem('zigmap26Settings');
localStorage.removeItem('ZigMap26_states');
localStorage.removeItem('ZigMap26_activeState');
console.log('localStorage cleared');
```

### Check Browser Support

```javascript
// Check WebGL support
console.log('WebGL support:', !!window.WebGLRenderingContext);

// Check canvas support
const testCanvas = document.createElement('canvas');
console.log('Canvas support:', !!testCanvas.getContext('2d'));

// Check p5.js loaded
console.log('p5.js loaded:', typeof p5 !== 'undefined');
```

### Monitor Noise Offset

```javascript
// View noise offset (animation time)
console.log('Noise offset:', window.SpaceFlow.noiseOffset);

// Reset noise offset (restarts noise sequence)
window.SpaceFlow.noiseOffset = 0;
```

---

## Debugging Tips

### 1. Inspect Current State (Framework + Patch)

```javascript
const ZM = window.SpaceFlow;
console.group('Current Application State');
// Framework
console.log('Canvas:', ZM.W, 'x', ZM.H);
console.log('Camera distance:', ZM.camera.distance);
console.log('FOV:', ZM.params.fov);
console.log('Palette:', ZM.params.activePaletteIndex);
// Patch (Zigzag)
if (ZM.emitterInstance) {
  console.log('Active lines:', ZM.emitterInstance.lines.length);
}
console.groupEnd();
```

### 2. Monitor Frame Rate

```javascript
setInterval(() => {
  showPerformanceStats();
}, 5000); // Show stats every 5 seconds
```

### 3. Log Parameter Changes

```javascript
// Watch a specific parameter
const originalValue = window.SpaceFlow.params.emitRate;
Object.defineProperty(window.SpaceFlow.params, 'emitRate', {
  get() { return originalValue; },
  set(val) {
    console.log('emitRate changed:', originalValue, '→', val);
    originalValue = val;
  }
});
```

### 4. Batch Operations

```javascript
// Example: Create 10 states with different speeds
for (let i = 1; i <= 10; i++) {
  window.SpaceFlow.params.speed = i * 20;
  window.SpaceFlow.stateManager.save(`Speed ${i * 20}`);
}
```

---

## Quick Reference

### Framework Commands (Universal)

These work with **any patch**:

| Command | Description |
|---------|-------------|
| `showPerformanceStats()` | Display performance metrics |
| `window.SpaceFlow` | Global application namespace |
| `window.SpaceFlow.exportSVG()` | Export vector graphics |
| `window.SpaceFlow.exportPNG()` | Export raster image |
| `window.SpaceFlow.exportDepthMap()` | Export depth map |
| `window.SpaceFlow.startVideoRecording()` | Start video capture |
| `window.SpaceFlow.stateManager.save(name)` | Save current state |
| `window.SpaceFlow.stateManager.load(id)` | Load state by ID |
| `window.SpaceFlow.stateManager.loadRandomState()` | Load random state |
| `window.SpaceFlow.downloadJSON()` | Download project file |
| `window.SpaceFlow.saveToLocalStorage()` | Save to browser storage |
| `window.SpaceFlow.loadFromLocalStorage()` | Load from browser storage |
| `window.SpaceFlow.camera` | Access camera object |
| `window.SpaceFlow.params` | Access all parameters |
| `window.SpaceFlow.p5Instance` | Access p5.js instance |

### Patch Commands (Zigzag-Specific)

These are **specific to the Zigzag Emitter patch**:

| Command | Description |
|---------|-------------|
| `window.SpaceFlow.emitterInstance` | Access Zigzag emitter |
| `window.SpaceFlow.emitterInstance.lines` | Array of active lines |
| `window.SpaceFlow.noiseOffset` | Animation noise offset |

---

## See Also

- [User Manual](User-Manual.md) — UI controls and keyboard shortcuts
- [SpaceFlow Architecture](SPACEFLOW-ARCHITECTURE.md) — Framework design and patch system
- [Technical Documentation](Documentation.md) — Implementation details
- [Preset JSON Format](Preset-JSON-Format.md) — File format specification

---

**Last Updated:** May 28, 2026
