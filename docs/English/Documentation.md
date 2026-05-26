# Zigzag Emitter — Technical documentation
ddelcourt2026

Version 26 — Code architecture and implementation guide

Codebase structure, architecture patterns, and implementation details.

---

## Parameter Reference

Complete list of all configurable parameters in the `params` object:

| Parameter | Variable | Description |
|-----------|----------|-------------|
| **Geometry** |||
| Segment Length | `segmentLength` | Height of each zigzag segment in pixels |
| Line Thickness | `lineThickness` | Width of the ribbon in pixels |
| Emitter Rotation | `emitterRotation` | Z-axis rotation of the emitter in degrees |
| Geometry Scale | `geometryScale` | Uniform scale multiplier in percentage (100 = normal) |
| Fade Duration | `fadeDuration` | Fade-in/fade-out transition duration in seconds |
| **Color Palettes** |||
| Palettes | `palettes` | Array of 4 palettes, each containing 4 colors with RGB values and role |
| Active Palette Index | `activePaletteIndex` | Currently selected palette (0-3) |
| Color Transition Duration | `colorTransitionDuration` | Time in seconds for palette switch transitions |
| State Transition Duration | `stateTransitionDuration` | Time in seconds for geometry, behavior, camera, and modulation transitions |
| Color Slot Z-Offset | `colorSlotZOffset` | Z-axis separation multiplier per color slot to prevent z-fighting |
| **State Auto-Trigger** |||
| Auto-Trigger States | `autoTriggerStates` | Enable automatic state changes at specified intervals |
| Auto-Trigger Frequency | `autoTriggerFrequency` | Time in seconds between automatic state changes (5-240) |
| **Animation** |||
| Emit Rate | `emitRate` | Number of lines spawned per second |
| Speed | `speed` | Base movement speed of lines in pixels per second |
| Ambient Speed Master | `ambientSpeedMaster` | Global speed multiplier in percentage |
| **Modulation** |||
| Random Thickness | `randomThickness` | Enable thickness variation for each line |
| Random Speed | `randomSpeed` | Enable speed variation for each line |
| Thickness Range Min | `thicknessRangeMin` | Minimum thickness multiplier in percentage |
| Thickness Range Max | `thicknessRangeMax` | Maximum thickness multiplier in percentage |
| Speed Range Min | `speedRangeMin` | Minimum speed multiplier in percentage |
| Speed Range Max | `speedRangeMax` | Maximum speed multiplier in percentage |
| **Camera** |||
| Field of View | `fov` | Camera field of view in degrees |
| Near Clipping Plane | `near` | Near clipping distance (0.01) |
| Far Clipping Plane | `far` | Far clipping distance (5000) |
| Camera Rotation X | `cameraRotationX` | X-axis rotation (pitch) in radians |
| Camera Rotation Y | `cameraRotationY` | Y-axis rotation (yaw) in radians |
| Camera Distance | `cameraDistance` | Distance from origin (zoom) |
| Camera Offset X | `cameraOffsetX` | Horizontal pan offset |
| Camera Offset Y | `cameraOffsetY` | Vertical pan offset |
| **Stereoscopic** |||
| Stereoscopic Mode | `stereoscopicMode` | Enable dual-camera side-by-side stereo rendering |
| Eye Separation | `eyeSeparation` | Distance between left and right cameras |
| **Framebuffer** |||
| Framebuffer Mode | `framebufferMode` | Lock canvas to fixed resolution independent of window size |
| Framebuffer Preset | `framebufferPreset` | Resolution preset name (e.g., '1920x1080') |
| Framebuffer Width | `framebufferWidth` | Canvas width in pixels when framebuffer mode is active |
| Framebuffer Height | `framebufferHeight` | Canvas height in pixels when framebuffer mode is active |
| Canvas Border Visible | `canvasBorderVisible` | Show/hide canvas border |
| Canvas Border Color | `canvasBorderColor` | Border color in hex format (e.g., '#adff2f') |
| **Video Export** |||
| Video Duration | `videoDuration` | Recording length in seconds |
| Video FPS | `videoFPS` | Recording frame rate (frames per second) |
| Video Format | `videoFormat` | Video codec format (e.g., 'webm') |
| **Overlay Image** |||
| Overlay Image Source | `overlayImageSrc` | Source URL or data URL of the overlay image |
| Overlay Preset File | `overlayPresetFile` | Filename of selected preset overlay |
| Overlay Custom Filename | `overlayCustomFilename` | Name of custom uploaded overlay file |
| Overlay Custom Image Source | `overlayCustomImageSrc` | Source data URL of custom uploaded overlay |
| Overlay Visible | `overlayVisible` | Show/hide overlay on canvas |
| Overlay Auto-Fit | `overlayAutoFit` | Automatically fit overlay to canvas dimensions |
| Overlay Scale | `overlayScale` | Overlay size multiplier in percentage |
| Overlay Opacity | `overlayOpacity` | Overlay transparency in percentage (0-100) |
| Overlay X | `overlayX` | Horizontal position in percentage (0-100) |
| Overlay Y | `overlayY` | Vertical position in percentage (0-100) |

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [File Structure](#file-structure)
- [Core Concepts](#core-concepts)
- [Data Structures](#data-structures)
- [Class Reference](#class-reference)
- [Function Reference](#function-reference)
- [Rendering Pipeline](#rendering-pipeline)
- [Camera System](#camera-system)
 - [Overlay System](#overlay-system)
- [Export System](#export-system)
- [State Management](#state-management)
- [Event Handling](#event-handling)
- [Performance Considerations](#performance-considerations)
- [Extension Guide](#extension-guide)
- [Debugging](#debugging)

---

## Architecture Overview

The Zigzag Emitter follows a **modular ES6 architecture** with clear separation of concerns through dedicated files for each major component. The application is structured as follows:

```
┌─────────────────────────────────────────────┐
│           HTML Structure & CSS              │
│  (UI Controls, Layout, Visual Styling)      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          JavaScript Application             │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │     Main Entry Point (main.js)        │ │
│  │  • Initialization                     │ │
│  │  • First-time preset loading          │ │
│  │  • Module orchestration               │ │
│  └───────────────────────────────────────┘ │
│                    ↓                        │
│  ┌───────────────────────────────────────┐ │
│  │      Configuration Layer              │ │
│  │  • constants.js (System constants)    │ │
│  │  • defaults.js (Default parameters)   │ │
│  └───────────────────────────────────────┘ │
│                    ↓                        │
│  ┌───────────────────────────────────────┐ │
│  │      Core Classes                     │ │
│  │  • ZigzagLine (Line geometry)         │ │
│  │  • Emitter (Line management)          │ │
│  │  • Camera (Position & projection)     │ │
│  │  • Projection (Matrix transforms)     │ │
│  └───────────────────────────────────────┘ │
│                    ↓                        │
│  ┌───────────────────────────────────────┐ │
│  │      Rendering Layer                  │ │
│  │  • SketchFactory (p5.js instances)    │ │
│  └───────────────────────────────────────┘ │
│                    ↓                        │
│  ┌───────────────────────────────────────┐ │
│  │      Export System                    │ │
│  │  • PNGExporter (Composite canvas)     │ │
│  │  • SVGExporter (Vector export)        │ │
│  │  • DepthExporter (Depth maps)         │ │
│  │  • VideoRecorder (CCapture.js)        │ │
│  └───────────────────────────────────────┘ │
│                    ↓                        │
│  ┌───────────────────────────────────────┐ │
│  │      Storage & State Layer            │ │
│  │  • StateManager (Capture/restore)     │ │
│  │  • localStorage (Persistence)         │ │
│  └───────────────────────────────────────┘ │
│                    ↓                        │
│  ┌───────────────────────────────────────┐ │
│  │      Input Handlers                   │ │
│  │  • KeyboardHandler (Shortcuts)        │ │
│  │  • MouseHandler (Orbit controls)      │ │
│  └───────────────────────────────────────┘ │
│                    ↓                        │
│  ┌───────────────────────────────────────┐ │
│  │      UI Layer                         │ │
│  │  • UIController (Control wiring)      │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Design Patterns

1. **ES6 Module Pattern**: Each class/system in separate file with explicit imports
2. **Factory Pattern**: `SketchFactory.js` generates p5.js instances
3. **Observer Pattern**: UI controls update parameters object, triggering renders
4. **Singleton Pattern**: Single `Emitter` instance shared between stereo views
5. **Strategy Pattern**: Multiple exporters with common interface
6. **Bidirectional Data Sync**: Camera class syncs both to/from parameters

---

## Technology Stack

### Core Libraries

- **[p5.js](https://p5js.org/) v1.9.0**
  - Creative coding framework
  - Provides WebGL renderer and canvas management
  - Handles drawing, transformations, and perspective projection
  - Dynamic pixelDensity for high-resolution displays
  
- **[CCapture.js](https://github.com/spite/ccapture.js/) v1.1.0**
  - Frame-by-frame video capture
  - Deterministic rendering for consistent output
  - WebM and other format support

### Browser APIs

- **Canvas 2D API**: PNG export via `toDataURL()` with compositing
- **WebGL**: Hardware-accelerated 3D rendering via p5.js
- **LocalStorage**: Settings persistence with backward compatibility
- **File API**: JSON configuration import/export
- **Fullscreen API**: Fullscreen mode toggle
- **Fetch API**: Async loading of initial presets

### Language Features

- **ES6+ JavaScript**
  - ES6 Modules with import/export
  - Classes and constructors
  - Arrow functions
  - Async/await for preset loading
  - Destructuring assignment
  - Template literals
  - Spread operator
  - `const`/`let` block scoping

---

## File Structure

```
index.html                          (Main HTML entry point)
├── config/
│   ├── appInfo.json               (App metadata)
│   ├── keyboardShortcuts.json     (Keyboard mappings)
│   ├── uiPresets.json             (UI configuration)
│   ├── overlayPresets.js          (Overlay file list)
│   └── presets/
│       ├── manifest.json          (Preset registry)
│       └── zigmap_init.json       (First-time user preset)
├── css/
│   ├── main.css                   (Base styles)
│   ├── controls.css               (Control panel styling)
│   ├── canvas.css                 (Canvas container)
│   └── states.css                 (State management UI)
├── js/
│   ├── main.js                    (Entry point & initialization)
│   ├── config/
│   │   ├── constants.js           (System constants)
│   │   └── defaults.js            (Default parameters)
│   ├── core/
│   │   ├── ZigzagLine.js          (Line geometry & behavior)
│   │   ├── Emitter.js             (Line pool management)
│   │   ├── Camera.js              (Camera position & sync)
│   │   ├── Projection.js          (Projection matrix)
│   │   ├── colorUtils.js          (Color manipulation)
│   │   └── utils.js               (Math utilities)
│   ├── rendering/
│   │   └── SketchFactory.js       (p5.js sketch creation)
│   ├── export/
│   │   ├── PNGExporter.js         (PNG with overlay composite)
│   │   ├── SVGExporter.js         (Vector export)
│   │   ├── DepthExporter.js       (Depth map export)
│   │   └── VideoRecorder.js       (Video with overlay)
│   ├── storage/
│   │   ├── StateManager.js        (State capture/restore)
│   │   └── localStorage.js        (Persistence layer)
│   ├── input/
│   │   ├── KeyboardHandler.js     (Keyboard shortcuts)
│   │   └── MouseHandler.js        (Orbit controls)
│   └── ui/
│       └── UIController.js        (Control panel wiring)

---

## Core Concepts

### 1. Coordinate Systems

The application uses three coordinate systems:

#### Screen Space
- Origin: Top-left corner
- Units: Pixels
- Range: `[0, W)` × `[0, H)`
- Used for: Mouse input, UI elements

#### Canvas Space
- Origin: Center of canvas
- Units: Pixels
- Range: `[-W/2, W/2)` × `[-H/2, H/2)`
- Used for: 2D geometry generation, spawn boundaries

#### World Space
- Origin: Scene center (after transforms)
- Units: Arbitrary (scaled by `geometryScale`)
- Used for: 3D rendering, camera transforms
- Transformations applied: Translate, rotate, scale

### 2. Rendering Modes

#### Monoscopic (Default)
- Single canvas filling viewport
- Standard perspective rendering
- Dark grey border (1px)

#### Stereoscopic (VR Mode)
- Two side-by-side canvases (left/right eye)
- Each canvas: W/2 width
- Camera offset by `±eyeSeparation/2` along X-axis
- Green borders indicate stereo mode
- Synchronized animation via `sharedLastTime`

#### Framebuffer Mode
- Fixed resolution independent of window size
- Canvas scaled to fit viewport
- Enables pixel-perfect export
- Dark grey border around fixed canvas

### 3. Animation Loop

Frame-by-frame update cycle:

```
1. Clear background (black)
2. Update camera from mouse input
3. Calculate delta time (dt)
4. Update emitter (spawn new lines, move existing)
5. Apply camera transforms (translate, rotate, perspective)
6. Draw all zigzag lines
7. (If recording) Capture frame to video encoder
```

### 4. Geometry Generation

Zigzag patterns are generated as:

1. **Centerline**: Series of points forming zigzag path
2. **Ribbon offset**: Perpendicular offsets create thickness
3. **Miter joins**: Smooth connections at vertices
4. **End caps**: Flat vertical caps at start/end
5. **Mesh construction**: Quad strip from left/right sides

---

## Data Structures

### `params` Object

Central configuration object storing all adjustable parameters.

```javascript
const params = {
  // Geometry
  segmentLength: 120,        // Height of each zigzag segment (px)
  lineThickness: 12,         // Width of ribbon (px)
  emitterRotation: 0,        // Z-axis rotation (degrees)
  geometryScale: 100,        // Uniform scale (%)
  fadeDuration: 0.8,         // Fade-in/out duration (seconds)
  
  // Color Palettes
  palettes: [                // 4 palettes × 4 colors each
    [
      { rgb: [255, 255, 255], role: 'line' },
      { rgb: [200, 200, 255], role: 'line' },
      { rgb: [255, 200, 200], role: 'line' },
      { rgb: [200, 255, 200], role: 'none' }
    ],
    // ... palettes 2-4
  ],
  activePaletteIndex: 0,     // Currently selected palette (0-3)
  colorTransitionDuration: 3.0,  // Palette switch transition time (seconds)
  colorSlotZOffset: 100,     // Z-axis separation multiplier for color slots
  
  // Animation
  emitRate: 1.5,             // Lines spawned per second
  speed: 80,                 // Base movement speed (px/s)
  
  // Camera
  fov: 60,                   // Field of view (degrees)
  near: 0.01,                // Near clipping plane
  far: 5000,                // Far clipping plane
  cameraRotationX: -0.3,     // X-axis rotation (radians)
  cameraRotationY: 0,        // Y-axis rotation (radians)
  cameraDistance: 600,       // Distance from origin
  cameraOffsetX: 0,          // Pan offset X
  cameraOffsetY: 0,          // Pan offset Y
  
  // Modulation
  randomThickness: false,    // Enable thickness variation
  randomSpeed: false,        // Enable speed variation
  thicknessRangeMin: 10,     // Min thickness multiplier (%)
  thicknessRangeMax: 200,    // Max thickness multiplier (%)
  speedRangeMin: 50,         // Min speed multiplier (%)
  speedRangeMax: 150,        // Max speed multiplier (%)
  ambientSpeedMaster: 100,   // Global speed multiplier (%)
  
  // Rendering
  stereoscopicMode: false,   // Enable dual-camera stereo
  eyeSeparation: 30,         // Distance between cameras
  framebufferMode: false,    // Lock to fixed resolution
  framebufferPreset: '1920x1080',  // Resolution preset name
  framebufferWidth: 1920,    // Canvas width (px)
  framebufferHeight: 1080,   // Canvas height (px)
  
  // Export
  videoDuration: 10,         // Recording length (seconds)
  videoFPS: 30,              // Recording frame rate
  videoFormat: 'webm'        // Video codec
};
```

### `camera` Object

Camera state independent of `params` to avoid circular updates.

```javascript
const camera = {
  rotationX: -0.3,     // Pitch (radians)
  rotationY: 0,        // Yaw (radians)
  distance: 600,       // Zoom distance
  offsetX: 0,          // Pan X offset
  offsetY: 0,          // Pan Y offset
  isDragging: false,   // Left-click drag active
  isPanning: false,    // Right-click drag active
  lastMouseX: 0,       // Previous mouse X (for delta)
  lastMouseY: 0        // Previous mouse Y (for delta)
};
```

### Constants

```javascript
export const SEGMENTS = 16;                // Zigzag vertices per line
export const STORAGE_KEY = 'zigmap26Settings';  // LocalStorage key
```

### Global Application State (`window.SpaceFlow`)

All shared state lives in the `window.SpaceFlow` namespace, populated in `js/main.js`:

```javascript
window.SpaceFlow = {
  params: { ...DEFAULT_PARAMS },   // All adjustable parameters
  SEGMENTS,                         // Zigzag vertices per line
  STORAGE_KEY,                      // LocalStorage key
  noiseOffset: 0,                   // Perlin noise time offset
  W: window.innerWidth,             // Canvas logical width
  H: window.innerHeight,            // Canvas logical height
  camera: null,                     // Camera instance
  p5Instance: null,                 // Primary p5 sketch instance
  p5InstanceRight: null,            // Secondary (stereo right) instance
  emitterInstance: null,            // Shared Emitter object
  sketchReady: false,               // Whether sketch is initialized
  stateManager: null,               // StateManager instance
};
```

---

## Class Reference

### `ZigzagLine`

Represents a single animated zigzag ribbon.

#### Constructor

```javascript
constructor({ p, x, y, segmentLength, lineThickness, lineColor, colorSlotIndex, vy,
              canvasWidth, canvasHeight, params, getSpawnDistanceFn, buildRibbonSidesFn })
```

**Parameters:**
- `p` (p5): p5.js instance reference
- `x` (Number): Initial X position (canvas space)
- `y` (Number): Initial Y position (canvas space)
- `segmentLength` (Number): Height of each segment
- `lineThickness` (Number): Ribbon width
- `lineColor` (Array): RGB color array `[r, g, b]`
- `colorSlotIndex` (Number): Palette slot index (0–3) for Z-offset calculation
- `vy` (Number): Velocity in Y direction (px/s, negative = upward)
- `canvasWidth` (Number): Current canvas width in pixels
- `canvasHeight` (Number): Current canvas height in pixels
- `params` (Object): Reference to the global `params` object
- `getSpawnDistanceFn` (Function): Utility function to compute spawn bounds
- `buildRibbonSidesFn` (Function): Utility function to build ribbon geometry

**Properties:**
- `segments` (Number): Always 16
- `step` (Number): Diagonal step distance = `segmentLength / √2`
- `totalWidth` (Number): Total horizontal width = `segments × step`
- `alive` (Boolean): Whether line is still visible
- `age` (Number): Seconds since spawn
- `currentColor` (Array): Current RGB color `[r, g, b]`
- `startColor` (Array): Color at transition start
- `targetColor` (Array): Color at transition end
- `colorTransitionProgress` (Number): Transition progress (0-1)
- `isTransitioning` (Boolean): Whether actively transitioning
- `colorSlotIndex` (Number): Index (0-3) for Z-offset calculation
- `zOffset` (Number): Z-axis depth offset = `(colorSlotIndex - 2) × params.colorSlotZOffset`

##### `_buildVertices()`

Generates centerline points for the zigzag pattern.

**Returns:** `Array<{x, y}>` - Array of 2D points in local space

**Algorithm:**
1. Start at left edge: `x = -totalWidth / 2, y = 0`
2. For each segment:
   - Move right by `step`
   - Alternate moving up/down by `step`
3. Produces horizontal zigzag pattern

##### `update(dt)`

Updates position and checks if line should be culled.

**Parameters:**
- `dt` (Number): Delta time in seconds

**Logic:**
1. Increment age by `dt`
2. Move Y position by `vy × dt`
3. Convert to world space: `worldY = y - H/2`
4. Check if outside spawn boundaries, set `alive = false` if so

##### `_alpha()`

Calculates combined opacity from fade-in and fade-out.

**Returns:** `Number` - Alpha value in range [0, 1]

**Algorithm:**
1. **Fade-in**: `min(age / params.fadeDuration, 1)`
2. **Fade-out**: 
   - Calculate time remaining until line reaches the spawn boundary
   - `min(timeToBoundary / params.fadeDuration, 1)` where `timeToBoundary = distToBoundary / |vy|`
3. Return minimum of fade-in and fade-out

##### `draw(p)`

Renders the zigzag line as a filled shape.

**Parameters:**
- `p` (p5): p5.js instance

**Steps:**
1. Calculate alpha (0-255 range)
2. Build ribbon geometry via `buildRibbonSides()`
3. Push matrix (save transform state)
4. Translate to line's world position
5. Set fill color with alpha
6. Draw shape:
   - Vertex loop for left side
   - Reverse vertex loop for right side
   - Close shape to form polygon
7. Pop matrix (restore transform state)

---

### `Emitter`

Manages spawning and updating all zigzag lines.

#### Constructor

```javascript
constructor({ p, x, y, params, noiseOffsetGetter,
              canvasWidth, canvasHeight, getSpawnDistanceFn, buildRibbonSidesFn })
```

**Parameters:**
- `p` (p5): p5.js instance reference
- `x` (Number): Spawn position X (canvas space)
- `y` (Number): Spawn position Y (canvas space)
- `params` (Object): Reference to the global `params` object
- `noiseOffsetGetter` (Function): Returns current Perlin noise time offset
- `canvasWidth` (Number): Current canvas width in pixels
- `canvasHeight` (Number): Current canvas height in pixels
- `getSpawnDistanceFn` (Function): Utility function to compute spawn bounds
- `buildRibbonSidesFn` (Function): Utility function to build ribbon geometry

**Properties:**
- `lines` (Array): Collection of `ZigzagLine` instances
- `accumulator` (Number): Time buffer for emission timing

#### Methods

##### `update(dt)`

Updates all lines and spawns new ones based on emit rate.

**Parameters:**
- `dt` (Number): Delta time in seconds

**Algorithm:**
1. Add `dt` to accumulator
2. Calculate effective emit rate: `emitRate × (ambientSpeedMaster / 100)`
3. Calculate spawn interval: `1 / effectiveRate`
4. While accumulator ≥ interval:
   - Subtract interval from accumulator
   - Call `_emit()` to spawn new line
5. Update all existing lines
6. Filter out dead lines (`alive === false`)

##### `_emit()`

Spawns a single new zigzag line.

**Algorithm:**
1. **Thickness calculation:**
   - Start with `params.lineThickness`
   - If `randomThickness` enabled:
     - Sample Perlin noise: `noise(noiseOffset)`
     - Sample sine wave: `sin(noiseOffset × 2)`
     - Blend: `variation = noise × 0.7 + sine × 0.3`
     - Map to range: `[thicknessRangeMin%, thicknessRangeMax%]`
     - Multiply by base thickness

2. **Speed calculation:**
   - Start with `params.speed`
   - If `randomSpeed` enabled:
     - Similar noise + sine blending
     - Map to range: `[speedRangeMin%, speedRangeMax%]`
     - Multiply by base speed
   - Apply ambient master: `speed × ambientSpeedMaster / 100`

3. **Create line:**
   - Instantiate `ZigzagLine` with calculated values
   - Velocity is negative (upward movement)
   - Add to `lines` array

##### `draw(p)`

Renders all lines.

**Parameters:**
- `p` (p5): p5.js instance

**Implementation:**
```javascript
for (const line of this.lines) {
  line.draw(p);
}
```

---

## Function Reference

### Helper Functions

#### `getSpawnDistance()`

Calculates the half-width of the spawn field.

**Returns:** `Number` - Distance in pixels

**Formula:**
```javascript
const step = params.segmentLength / Math.SQRT2;
return (SEGMENTS × step) / 2;
```

**Purpose:** Determines when lines should be culled (bounds checking).

---

#### `buildRibbonSides(points, halfWidth)`

Converts a polyline into offset paths for ribbon rendering.

**Parameters:**
- `points` (Array): Centerline vertices `[{x, y}, ...]`
- `halfWidth` (Number): Half of desired ribbon thickness

**Returns:** `Object` - `{ leftSide: [{x,y}, ...], rightSide: [{x,y}, ...] }`

**Algorithm:**

**For endpoints (first/last):**
- Flat vertical caps
- `leftSide`: `{x: curr.x, y: curr.y + halfWidth}`
- `rightSide`: `{x: curr.x, y: curr.y - halfWidth}`

**For middle points:**
1. Get adjacent segments:
   - Previous: `(prev → curr)`
   - Next: `(curr → next)`
2. Calculate perpendicular vectors (normalized):
   - `perp1 = normalize([-dy1, dx1])`
   - `perp2 = normalize([-dy2, dx2])`
3. Average perpendiculars (miter direction):
   - `perp = normalize((perp1 + perp2) / 2)`
4. Offset point by `perp × halfWidth`

**Purpose:** Used by both canvas renderer and SVG export for consistent geometry.

---

### Sketch Lifecycle

#### `createSketch(ZM, eyeOffset, canvasId)` (`js/rendering/SketchFactory.js`)

Factory function that returns a p5.js sketch function.

**Parameters:**
- `ZM` (Object): The global `window.SpaceFlow` application state object
- `eyeOffset` (Number): X-axis camera offset for stereo (0 for mono, ±eyeSeparation for stereo)
- `canvasId` (String): DOM element ID to attach canvas (`'mono-canvas'`, `'left-canvas'`, `'right-canvas'`)

**Returns:** `Function` — p5.js sketch function (pass to `new p5(...)`)

**Structure:**

```javascript
return function(p) {
  let emitter;        // Local or shared emitter reference
  let lastTime;       // Frame timing
  
  p.setup = function() { /* ... */ };
  p.draw = function() { /* ... */ };
  p.mouseWheel = function(event) { /* ... */ };
  p.windowResized = function() { /* ... */ };
};
```

##### `p.setup()`

Initialization phase called once.

**Steps:**
1. Set pixel density to 1 (performance)
2. Create WebGL canvas: `createCanvas(W, H, WEBGL)`
3. Attach canvas to parent DOM element
4. Initialize or reference shared emitter
5. Set up mouse event handlers:
   - **contextmenu**: Prevent right-click menu
   - **mousePressed**: Detect left/right click, set camera states
   - **mouseReleased**: Clear dragging/panning flags
6. Apply framebuffer sizing if needed
7. Initialize `lastTime` for delta calculation

**Mouse Events:**

```javascript
cnv.mousePressed((event) => {
  if (p.mouseButton === p.LEFT) {
    camera.isDragging = true;
    camera.isPanning = false;
  } else if (p.mouseButton === p.RIGHT || p.mouseButton === p.CENTER) {
    camera.isPanning = true;
    camera.isDragging = false;
  }
  camera.lastMouseX = p.mouseX;
  camera.lastMouseY = p.mouseY;
  return false;  // Prevent default
});
```

##### `p.draw()`

Main rendering loop called every frame.

**Rendering Steps:**

1. **Clear frame:**
   ```javascript
   p.background(0);  // Black
   ```

2. **Camera controls (if active canvas):**
   - Calculate mouse delta: `dx = mouseX - lastMouseX`
   - If dragging (left button):
     - Update rotation: `rotationY += dx × 0.005`
     - Constrain pitch: `rotationX = constrain(rotationX + dy × 0.005, -π/2, π/2)`
   - If panning (right button):
     - Calculate sensitivity: `sens = max(0.5, distance / 500)`
     - Update offsets: `offsetX += dx × sens`
   - Save to params and localStorage

3. **Set perspective projection:**
   ```javascript
   p.perspective(
     fov × π / 180,           // Field of view (radians)
     W / H,                   // Aspect ratio
     max(0.01, params.near),  // Near clipping plane
     params.far               // Far clipping plane
   );
   ```

4. **Calculate delta time:**
   - **Normal**: `dt = (millis() - lastTime) / 1000`
   - **Recording**: `dt = 1 / fps` (fixed timestep)
   - **Stereo**: Primary calculates, secondary uses 0

5. **Apply camera transform:**
   ```javascript
   p.push();
   if (stereo) p.translate(cameraOffset, 0, 0);  // Eye separation
   p.translate(camera.offsetX, camera.offsetY, 0);  // Pan
   p.translate(0, 0, -camera.distance);             // Zoom
   p.rotateX(camera.rotationX);                     // Pitch
   p.rotateY(camera.rotationY);                     // Yaw
   p.rotateZ(emitterRotation × π / 180);            // Z rotation
   p.scale(geometryScale / 100);                    // Uniform scale
   ```

6. **Update simulation (primary only):**
   ```javascript
   if (!stereoscopicMode || isPrimary) {
     noiseOffset += dt × 4;
     emitter.update(dt);
   }
   ```

7. **Draw emitter:**
   ```javascript
   emitter.draw(p);
   ```

8. **Restore transform:**
   ```javascript
   p.pop();
   ```

##### `p.mouseWheel(event)`

Handles zoom via scroll wheel.

**Parameters:**
- `event` (Object): Mouse wheel event with `delta` property

**Logic:**
1. Check if controls panel should scroll instead
2. Update distance: `distance = clamp(distance + delta × 20, 50, 10000)`
3. Save to params and localStorage
4. Return `false` to prevent page scroll

##### `p.windowResized()`

Handles browser window resize.

**Implementation:**
```javascript
if (!isRecording) {
  updateCanvasSize();
}
```

**Note:** Ignores resize during recording to maintain consistent output.

---

### Initialization Functions

#### `initializeSketches()`

Creates or recreates p5.js instances based on current mode.

**Logic:**

1. **Cleanup:**
   - Remove existing p5 instances
   - Clear canvas wrapper HTML
   - Reset shared state

2. **Calculate dimensions:**
   - **Framebuffer mode**: Use `framebufferWidth/Height`
   - **Stereoscopic**: Each canvas gets `windowWidth / 2`
   - **Monoscopic**: Full `windowWidth`

3. **Stereoscopic setup:**
   - Create stereo container with left/right eye divs
   - Instantiate two p5 sketches:
     - Left: `cameraOffset = -eyeSeparation`
     - Right: `cameraOffset = +eyeSeparation`
   - Share single emitter between both

4. **Monoscopic setup:**
   - Create single canvas div
   - Instantiate one p5 sketch
   - `cameraOffset = 0`

5. **Post-processing:**
   - Call `updateCanvasSize()` for framebuffer mode
   - Slight delay (50ms) to ensure DOM update

---

#### `updateCanvasSize()`

Adjusts canvas resolution and scaling.

**Guards:**
- Skip if no p5 instance
- Skip if already updating (prevent recursion)

**Framebuffer Mode:**
1. Set dimensions to `framebufferWidth/Height`
2. Calculate scale to fit window: `min(windowW / canvasW, windowH / canvasH, 1)`
3. Resize canvas(es) to target resolution
4. Apply CSS scale transform if needed
5. Set wrapper size explicitly
6. Add framebuffer-mode class (dark grey border)

**Window-Fit Mode:**
1. Calculate dimensions:
   - Stereo: `W = windowWidth / 2`
   - Mono: `W = windowWidth`
   - `H = windowHeight`
2. Resize canvas(es) to fit window
3. Remove CSS transforms
4. Set wrapper to 100% size
5. Remove framebuffer-mode class

**Emitter Update:**
- Reposition emitter to canvas center: `(W/2, H/2 + getSpawnDistance())`

---

#### `loadInitialPreset()` **NEW**

Automatically loads a curated starter project for first-time users.

**File:** `js/main.js`

**Purpose:** Enhance onboarding by providing users with an example project instead of default blank settings.

**Implementation:**
```javascript
async function loadInitialPreset(ZM) {
  try {
    const response = await fetch('config/presets/zigmap_init.json');
    if (!response.ok) {
      console.warn('Initial preset not found');
      return false;
    }
    
    const preset = await response.json();
    
    // Validate preset structure
    if (!preset.params || !preset.states) {
      console.warn('Invalid preset structure');
      return false;
    }
    
    // Load parameters
    Object.assign(ZM.params, preset.params);
    
    // Load states
    if (preset.states && Array.isArray(preset.states)) {
      ZM.states = preset.states;
      ZM.currentStateIndex = 0;
    }
    
    // Save to localStorage for persistence
    saveParams(ZM);
    saveStates(ZM);
    
    // Sync UI
    syncUIFromParams(ZM);
    updateStateList(ZM);
    
    console.log('Initial preset loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading initial preset:', error);
    return false;
  }
}
```

**Trigger Logic (in `init()` function):**
```javascript
async function init() {
  // Initialize ZM object
  const ZM = {
    params: { ...getDefaultParams() },
    states: [],
    camera: new Camera(),
    // ...
  };
  
  // Check if first-time user (no localStorage data)
  const hasExistingData = localStorage.getItem('zigmap_params') !== null;
  
  if (!hasExistingData) {
    // First-time user: load preset
    await loadInitialPreset(ZM);
  } else {
    // Returning user: load saved settings
    loadParams(ZM);
    loadStates(ZM);
  }
  
  // Continue initialization...
  initUI(ZM);
  createSketches(ZM);
}
```

**First-Time Detection:**
- Checks for absence of `localStorage` key
- Single check on page load
- Subsequent visits use normal localStorage loading

**Preset File Format:**
```json
{
  "version": "2.0",
  "params": {
    "segmentLength": 30,
    "lineThickness": 12,
    "emitRate": 2.0,
    "speed": 100,
    "geometryScale": 120,
    "fadeDuration": 1.5,
    "palettes": [ ... ],
    "activePaletteIndex": 0,
    "stateTransitionDuration": 5.0,
    "colorTransitionDuration": 3.0,
    "autoTriggerStates": false,
    "autoTriggerFrequency": 30,
    "fov": 70,
    "stereoscopicMode": false,
    "cameraRotationX": -0.3,
    "cameraRotationY": 0,
    "cameraDistance": 600,
    // ... all parameters
  },
  "states": [
    {
      "name": "Welcome State",
      "params": { ... }
    },
    {
      "name": "Variation 1",
      "params": { ... }
    },
    {
      "name": "Variation 2",
      "params": { ... }
    }
  ]
}
```

**Benefits:**
- **Immediate Gratification**: Users see interesting animation immediately
- **Learning by Example**: States demonstrate parameter effects
- **Professional Appearance**: Curated settings vs. default blank canvas
- **Reduced Friction**: No setup required to start exploring

**Fallback Behavior:**
- If preset file not found: Uses default parameters
- If preset invalid: Logs warning, uses defaults
- If fetch fails: Silent fallback to defaults
- Always non-blocking (no error dialogs)

---

### State Management

**NEW IN v26:** Enhanced state system with transition duration controls and auto-trigger random state switching.

#### State Architecture

States capture complete snapshots of parameters and camera position for instant recall with smooth transitions.

**State Object Structure:**
```javascript
{
  name: "State Name",
  params: {
    // All parameters except project-wide settings
    segmentLength: 30,
    lineThickness: 12,
    emitRate: 1.5,
    speed: 80,
    cameraRotationX: 0.2,
    cameraRotationY: 0.5,
    cameraDistance: 800,
    // ... all other parameters
    
    // Project-wide (excluded from state capture):
    // - overlayImageSrc, overlayVisible, overlayScale, overlayOpacity, overlayX, overlayY
    // - stateTransitionDuration, colorTransitionDuration
    // - autoTriggerStates, autoTriggerFrequency
  }
}
```

#### Transition Duration Controls **NEW**

Two independent transition timers control smooth morphing between states:

1. **State Transition Duration** (0-30 seconds):
   - Controls: geometry, camera, modulations, speed, emit rate
   - Parameter: `stateTransitionDuration` (seconds)
   - Affects: All numeric parameters except colors
   
2. **Color Transition Duration** (0-30 seconds):
   - Controls: palette transitions
   - Parameter: `colorTransitionDuration` (seconds)
   - Affects: Color interpolation only

**Storage:** Both are **project-wide** settings (not saved per-state).

#### Auto-Trigger System **NEW**

Automatically switches between states using a shuffle pool algorithm to eliminate short-term repetition.

**Parameters:**
```javascript
autoTriggerStates: false,      // ☑️ Enable/disable
autoTriggerFrequency: 30,       // Seconds between switches (5-120)
```

**Implementation (js/storage/StateManager.js):**

**Shuffle Pool Algorithm:**
```javascript
function loadRandomState(ZM) {
  const states = ZM.stateManager.states;
  const activeId = ZM.stateManager.activeStateId;
  
  // If shuffle pool is empty, create a new shuffled pool
  if (!ZM.shufflePool || ZM.shufflePool.length === 0) {
    // Get all states except the currently active one
    const availableStates = states.filter(state => state.id !== activeId);
    
    // Shuffle using Fisher-Yates algorithm
    ZM.shufflePool = shuffleArray(availableStates);
    console.log(`New shuffle cycle: [${ZM.shufflePool.map(s => s.name).join(', ')}]`);
  }
  
  // Pop the next state from the shuffled pool
  const nextState = ZM.shufflePool.shift();
  
  // Load the next state
  return loadState(ZM, nextState.id);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

**Characteristics:**
- **Shuffle Pool System**: Creates randomized array of all available states
- **No Short-Term Repetition**: Each state visited exactly once per cycle before any repeat
- **Auto-Reshuffle**: Pool automatically refills and reshuffles when exhausted
- **Fisher-Yates Algorithm**: True random shuffle (unbiased distribution)
- **Excludes Current**: Current active state never included in pool
- **Requires 2+ States**: Automatically disabled if fewer than 2 states exist
- **Timer Reset**: Resets when manually switching states
- **Frequency Range**: 5-120 seconds (adjustable via slider)

**Example with 4 states (A, B, C, D):**
- Currently on state A
- Shuffle creates pool: [C, D, B] (random order)
- Auto-trigger visits: C → D → B
- Pool now empty, reshuffle creates: [A, D, C] (new random order)
- Continue: A → D → C → (reshuffle) → ...

#### `saveToLocalStorage()`

Persists current `params` to browser's localStorage.

**Implementation:**
```javascript
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
} catch(e) {
  console.warn('localStorage save failed:', e);
}
```

**Trigger:** Called after every parameter change.

---

#### `loadFromLocalStorage()`

Loads saved settings from localStorage.

**Returns:** `Boolean` - True if data was loaded

**Logic:**
1. Attempt to retrieve item by key
2. If not found, return false
3. Parse JSON string
4. Merge into `params` via `Object.assign()`
5. Apply backward compatibility defaults
6. Validate and fix problematic values
7. Return true

**Backward Compatibility (js/storage/localStorage.js):**
```javascript
export function ensureBackwardCompatibility(params) {
  // New overlay parameters
  if (params.overlayImageSrc === undefined) params.overlayImageSrc = null;
  if (params.overlayVisible === undefined) params.overlayVisible = false;
  if (params.overlayScale === undefined) params.overlayScale = 100;
  if (params.overlayOpacity === undefined) params.overlayOpacity = 100;
  if (params.overlayX === undefined) params.overlayX = 50;
  if (params.overlayY === undefined) params.overlayY = 50;
  
  // Legacy validation
  if (params.near < 0.01) params.near = 0.01;
  if (params.cameraDistance < 50) params.cameraDistance = 600;
  if (params.cameraOffsetX === undefined) params.cameraOffsetX = 0;
  if (params.cameraOffsetY === undefined) params.cameraOffsetY = 0;
}
```

**Trigger:** Called once on page load.

---

#### `syncUIFromParams()` **UPDATED**

Updates all UI controls to match current `params` values.

**Purpose:** Keeps UI in sync when params are loaded from file, localStorage, or state switch.

**Camera Sync (js/ui/UIController.js):**
```javascript
export function syncUIFromParams(ZM) {
  // ... sync all sliders, checkboxes, inputs, dropdowns...
  
  // Camera state uses syncFromParams for bidirectional sync
  ZM.camera.syncFromParams(ZM.params);
}
```

**Key Change:** Now uses `camera.syncFromParams()` instead of manual property assignment, ensuring consistent bidirectional synchronization.

7. **Canvas update:** Call `updateCanvasSize()` if needed

---

#### `wireSlider(ZM, sliderId, displayId, paramKey, decimals = 0, label = '')`
(`js/ui/UIController.js`)

Binds a slider to a parameter with automatic persistence.

**Parameters:**
- `ZM` (Object): Global application state object
- `sliderId` (String): HTML ID of range input
- `displayId` (String): HTML ID of value display span
- `paramKey` (String): Property name in `params` object
- `decimals` (Number): Decimal places for display
- `label` (String): Human-readable label for logging

**Setup:**
1. Get DOM elements
2. Set slider value from params
3. Set display text from params
4. Add input event listener:
   - Update param from slider
   - Update display text
   - Call `saveToLocalStorage()`

**Example:**
```javascript
wireSlider(ZM, 'thickness', 'thickness-val', 'lineThickness', 1, 'Thickness');
// Wires thickness slider, displays with 1 decimal place
```

---

### Export Functions

#### `downloadJSON()`

Exports current settings as JSON file.

**Implementation:**
1. Stringify params with indentation: `JSON.stringify(params, null, 2)`
2. Create Blob with type `application/json`
3. Create object URL
4. Create temporary `<a>` element
5. Set download filename with timestamp
6. Trigger click
7. Revoke object URL

**Filename format:** `zigzag-emitter-YYYY-MM-DDTHH-MM-SS.json`

---

#### `loadJSON(file)`

Imports settings from uploaded JSON file.

**Parameters:**
- `file` (File): JavaScript File object from input

**Implementation:**
1. Create FileReader
2. On load:
   - Parse JSON
   - Check if stereoscopic mode changed
   - If mode changed, call `initializeSketches()`
   - Call `syncUIFromParams()`
   - Save to localStorage
3. Read file as text

**Error handling:** Try-catch with alert on parse failure.

---

#### `exportPNG()`

Captures current canvas as PNG image.

**Implementation:**
1. Get active p5 instance's canvas element
2. Call `toDataURL('image/png')`
3. Create temporary `<a>` with data URL as href
4. Set download filename with timestamp
5. Trigger click

**Filename format:** `zigzag-emitter-YYYY-MM-DDTHH-MM-SS.png`

**Resolution:** Matches current canvas pixel dimensions.

---

#### `exportSVG()`

Exports current frame as vector SVG.

**Algorithm:**

1. **Setup:**
   - Get canvas dimensions
   - Calculate spawn distance
   - Create SVG header

2. **For each line in emitter:**
   - Build centerline vertices
   - Calculate alpha (for opacity)
   - Build ribbon sides via `buildRibbonSides()`
   - Generate path string:
     ```javascript
     M x,y L ... L ... Z  // Move, Lines, Close
     ```
   - Create `<path>` element with:
     - Fill color
     - Fill opacity (alpha)
     - No stroke

3. **Export:**
   - Close SVG tag
   - Create Blob of type `image/svg+xml`
   - Download via temporary link

**Benefits:**
- Resolution-independent
- Editable in vector software
- Small file size
- Precise geometry

---

#### `startVideoCapture()`

Begins frame-by-frame video recording.

**Setup:**
1. Calculate total frames: `duration × fps`
2. Configure CCapture:
   ```javascript
   capturer = new CCapture({
     format: params.videoFormat,
     framerate: params.videoFPS,
     verbose: false
   });
   ```
3. Start capture: `capturer.start()`
4. Set recording state flags
5. Update UI (progress bar, button state)

**Recording loop:**
- Frames are captured in `p.draw()` after rendering
- Fixed timestep ensures deterministic output
- Progress indicator updates each frame

---

#### `stopVideoCapture()`

Completes recording and saves file.

**Implementation:**
1. Stop capturer: `capturer.stop()`
2. Save file: `capturer.save()`
3. Reset recording state
4. Restore UI (hide progress, reset button)

**Note:** CCapture handles encoding and download automatically.

---

### UI Initialization

#### Collapsible Sections

**Implementation:**
```javascript
document.querySelectorAll('.section-header').forEach(header => {
  header.addEventListener('click', () => {
    header.classList.toggle('active');
    const content = header.nextElementSibling;
    content.classList.toggle('expanded');
  });
});
```

**Behavior:** Click section title to expand/collapse controls.

**Keyboard Shortcuts:** See User Manual for complete list. All shortcuts are handled by `js/input/KeyboardHandler.js` with mappings defined in `config/keyboardShortcuts.json`.

**Benefits:**
- Single source of truth for all shortcuts
- Easy to add/modify/remove shortcuts
- Consistent modifier key handling
- Self-documenting with descriptions
- No duplicPalette System

**Architecture:**
- **4 palettes** × **4 color slots** each
- Each color slot has: `rgb` (RGB array) and `role` ('line', 'background', or 'none')
- Lines randomly pick from colors with role='line' at spawn time
- Background uses first color with role='background', or black if none

**Palette switching:**
```javascript
// Triggered by keyboard shortcuts (1-2-3-4) or UI buttons
function triggerPaletteChange(newIndex) {
  params.activePaletteIndex = newIndex;
  
  // Trigger color transitions in all existing lines
  emitterInstance.lines.forEach(line => {
    const colorData = pickRandomLineColor();
    line.transitionToColor(colorData.color);
  });
  
  // Trigger background transition
  SketchFactory.backgroundTransition.start = SketchFactory.backgroundTransition.current;
  SketchFactory.backgroundTransition.target = getBackgroundColor();
  SketchFactory.backgroundTransition.progress = 0;
  SketchFactory.backgroundTransition.isTransitioning = true;
  
  syncUIFromParams();
  saveToLocalStorage();
}
```

**Color transition in ZigzagLine:**
```javascript
transitionToColor(newColor) {
  this.startColor = [...this.currentColor];
  this.targetColor = newColor;
  this.colorTransitionProgress = 0;
  this.isTransitioning = true;
}

update(dt) {
  // ... position updates
  
  // Color lerp during transition (cached to avoid 60fps recalculation)
  if (this.isTransitioning) {
    this.colorTransitionProgress += dt / params.colorTransitionDuration;
    
    if (this.colorTransitionProgress >= 1) {
      this.currentColor = [...this.targetColor];
      this.isTransitioning = false;
    } else {
      this.currentColor = lerpColor(
        this.startColor,
        this.targetColor,
        this.colorTransitionProgress
      );
    }
  }
}
```

**Z-offset for depth separation:**
Each color slot gets a distinct Z-axis offset to prevent WebGL z-fighting:
```javascript
// In ZigzagLine constructor
this.zOffset = (colorSlotIndex - 2) * params.colorSlotZOffset;
// colorSlotIndex: 0 → zOffset: -200 (at default multiplier 100)
// colorSlotIndex: 1 → zOffset: -100
// colorSlotIndex: 2 → zOffset: 0
// colorSlotIndex: 3 → zOffset: +100
```

**Storage:**
All palette data persists in localStorage and JSON exports with backward compatibility for older saves.

**Trigger:** Palette button/keyboard → all lines transition smoothly over 3 seconds
  });
});
```

**Trigger:** Click swatch → update `params.lineColor` → save.

---

#### Dual-Range Sliders

Used for Near/Far clipping and thickness/speed ranges.

**Constraint logic:**
```javascript
nearSlider.addEventListener('input', () => {
  if (nearSlider.value >= farSlider.value) {
    nearSlider.value = farSlider.value - 1;
  }
  // Update params & display
});

farSlider.addEventListener('input', () => {
  if (farSlider.value <= nearSlider.value) {
    farSlider.value = nearSlider.value + 1;
  }
  // Update params & display
});
```

**Purpose:** Prevents invalid ranges (min ≥ max).

---

#### FOV with Distance Compensation

**Implementation:**
```javascript
fovSlider.addEventListener('input', () => {
  const oldFOV = params.fov;
  const newFOV = parseFloat(fovSlider.value);
  
  // Calculate compensation ratio
  const oldFOVRad = oldFOV * Math.PI / 180;
  const newFOVRad = newFOV * Math.PI / 180;
  const ratio = Math.tan(oldFOVRad / 2) / Math.tan(newFOVRad / 2);
  
  // Apply to distance
  const oldDistance = camera.distance;
  const newDistance = clamp(oldDistance * ratio, 50, 10000);
  
  // Update state
  params.fov = newFOV;
  camera.distance = newDistance;
  params.cameraDistance = newDistance;
  
  // Log for debugging
  console.log(`FOV: ${oldFOV}° → ${newFOV}°, Distance: ${oldDistance} → ${newDistance}`);
  
  saveToLocalStorage();
});
```

**Theory:**
For constant apparent size:
```
newDistance = oldDistance × tan(oldFOV/2) / tan(newFOV/2)
```

**Effect:**
- Wider FOV → closer camera (maintains size)
- Narrower FOV → farther camera (maintains size)
- Only perspective distortion changes

---

## Rendering Pipeline

### Frame Rendering Sequence

```
┌─────────────────────────────────────┐
│  1. p.background(0)                 │
│     Clear canvas to black           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  2. Update camera from mouse        │
│     - Rotation (left drag)          │
│     - Pan (right drag)              │
│     - Zoom (wheel)                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  3. Set projection matrix           │
│     p.perspective(fov, aspect, ...)│
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  4. Calculate delta time            │
│     dt = (now - lastTime) / 1000    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  5. Push matrix (save state)        │
│     p.push()                        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  6. Apply camera transforms         │
│     - Stereo offset (if enabled)    │
│     - Pan offset                    │
│     - Zoom (translate Z)            │
│     - Orbit rotation (X, Y)         │
│     - Z-plane rotation              │
│     - Geometry scale                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  7. Update simulation (primary)     │
│     - noiseOffset += dt × 4         │
│     - emitter.update(dt)            │
│       - Spawn new lines             │
│       - Update positions            │
│       - Cull dead lines             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  8. Draw all lines                  │
│     emitter.draw(p)                 │
│     - For each line:                │
│       - Calculate alpha             │
│       - Build ribbon geometry       │
│       - Draw filled shape           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  9. Pop matrix (restore state)      │
│     p.pop()                         │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  10. Capture frame (if recording)   │
│      capturer.capture(canvas)       │
└─────────────────────────────────────┘
```

---

## Camera System

**NEW IN v26:** Bidirectional camera synchronization with `syncToParams()` and `syncFromParams()` methods.

### Camera Class

**File:** `js/core/Camera.js`

The Camera class manages 3D camera position, rotation, and smooth transitions for orbit controls.

**Properties:**
```javascript
class Camera {
  rotationX = 0;               // Pitch (radians)
  rotationY = 0;               // Yaw (radians)
  distance = 600;              // Zoom distance
  offsetX = 0;                 // Pan X
  offsetY = 0;                 // Pan Y
  
  targetRotationX = 0;         // Smooth transition targets
  targetRotationY = 0;
  targetDistance = 600;
  targetOffsetX = 0;
  targetOffsetY = 0;
}
```

**Methods:**

#### `syncToParams(params)`
Saves current camera state to parameters object:
```javascript
syncToParams(params) {
  params.cameraRotationX = this.rotationX;
  params.cameraRotationY = this.rotationY;
  params.cameraDistance = this.distance;
  params.cameraOffsetX = this.offsetX;
  params.cameraOffsetY = this.offsetY;
}
```

Called when: 
- Saving states
- Exporting projects
- Manual camera updates

#### `syncFromParams(params)` **NEW**
Loads camera state from parameters object:
```javascript
syncFromParams(params) {
  this.rotationX = params.cameraRotationX || 0;
  this.rotationY = params.cameraRotationY || 0;
  this.distance = Math.max(50, params.cameraDistance || 600);
  this.offsetX = params.cameraOffsetX || 0;
  this.offsetY = params.cameraOffsetY || 0;
  
  // Set targets to match (no transition)
  this.targetRotationX = this.rotationX;
  this.targetRotationY = this.rotationY;
  this.targetDistance = this.distance;
  this.targetOffsetX = this.offsetX;
  this.targetOffsetY = this.offsetY;
}
```

Called when:
- Loading projects (uses first state's camera)
- Restoring states (with smooth transitions)
- Syncing UI on page load

**Key Difference:**
- `syncToParams`: Camera → Params (save)
- `syncFromParams`: Params → Camera (load)

### Transform Hierarchy

Transforms are applied in this order (inside-out):

```
1. Geometry local space (zigzag vertices)
2. Line position (translate by line.x, line.y)
3. Geometry scale (params.geometryScale)
4. Z-plane rotation (params.emitterRotation)
5. Camera orbit (rotateY, rotateX)
6. Camera zoom (translate Z by -distance)
7. Camera pan (translate XY by offsets)
8. Stereo eye offset (translate X by ±eyeSeparation/2)
9. Projection (perspective with FOV)
```

### Coordinate Transform Example

Point at zigzag vertex `(vx, vy, 0)`:

```javascript
// 1. Line position
worldX = vx + (line.x - W/2)
worldY = vy + (line.y - H/2)
worldZ = 0

// 2. Scale
worldX *= scale / 100
worldY *= scale / 100

// 3. Z rotation
θ = emitterRotation × π/180
x' = worldX × cos(θ) - worldY × sin(θ)
y' = worldX × sin(θ) + worldY × cos(θ)

// 4. Orbit rotation
// Apply rotateX then rotateY matrices

// 5. Zoom + Pan
x'' = x' + offsetX
y'' = y' + offsetY
z'' = z' - distance

// 6. Stereo offset (if applicable)
x''' = x'' + cameraOffset

// 7. Projection
// Perspective divide by depth
```

### Mouse to Camera Mapping

**Rotation (left drag):**
```javascript
const sensitivity = 0.005;  // radians per pixel
rotationY += dx * sensitivity;
rotationX += dy * sensitivity;
rotationX = clamp(rotationX, -π/2, π/2);  // Limit pitch
```

**Panning (right drag):**
```javascript
const sensitivity = max(0.5, distance / 500);
offsetX += dx * sensitivity;
offsetY += dy * sensitivity;
```

**Sensitivity scales with distance** - farther camera = faster pan.

**Zoom (scroll):**
```javascript
const zoomSpeed = 20;  // pixels per scroll tick
distance += event.delta * zoomSpeed;
distance = clamp(distance, 50, 10000);
```

---

## Export System

### Export Comparison

| Feature | PNG | SVG | Depth Map | Video |
|---------|-----|-----|-----------|-------|
| **Type** | Raster | Vector | Greyscale Raster | Video stream |
| **Resolution** | Fixed (canvas) | Infinite | Fixed (canvas) | Fixed (canvas) |
| **Editability** | No | Yes (paths) | No | No |
| **File Size** | ~100KB - 2MB | ~10KB - 500KB | ~50KB - 1MB | ~5MB - 100MB+ |
| **Animation** | Single frame | Single frame | Single frame | Full animation |
| **Quality** | Lossy (resize) | Lossless | Lossless greyscale | Compressed |
| **Overlay Composite** | Yes | No | No | Yes |
| **Best Use** | Quick share | Design work | Post-processing | Presentation |

### PNG Export with Overlay Compositing

**NEW IN v26:** Automatic overlay image compositing with pixelDensity correction.

PNG exports now automatically composite the overlay image (if enabled) onto the p5.js canvas, accounting for high-resolution (Retina) displays.

**Implementation (js/export/PNGExporter.js):**

```javascript
export function createCompositeCanvas(ZM, sourceCanvas) {
  const { params } = ZM;
  
  // Get actual rendered dimensions
  const actualWidth = sourceCanvas.width;
  const actualHeight = sourceCanvas.height;
  const pixelDensity = actualWidth / params.W;  // e.g., 2.0 for Retina
  
  // Create composite canvas at actual pixel dimensions
  const composite = document.createElement('canvas');
  composite.width = actualWidth;
  composite.height = actualHeight;
  const ctx = composite.getContext('2d');
  
  // 1. Draw p5 canvas
  ctx.drawImage(sourceCanvas, 0, 0);
  
  // 2. Draw overlay if visible
  const overlayImg = document.getElementById('overlay-image');
  if (params.overlayVisible && overlayImg && overlayImg.src && overlayImg.complete) {
    // Calculate scaled dimensions with pixelDensity
    const scale = params.overlayScale / 100;
    const overlayWidth = overlayImg.naturalWidth * scale * pixelDensity;
    const overlayHeight = overlayImg.naturalHeight * scale * pixelDensity;
    
    // Calculate position (0-100% → pixel coordinates)
    const x = (params.overlayX / 100) * actualWidth - overlayWidth / 2;
    const y = (params.overlayY / 100) * actualHeight - overlayHeight / 2;
    
    // Apply opacity and composite
    ctx.globalAlpha = params.overlayOpacity / 100;
    ctx.drawImage(overlayImg, x, y, overlayWidth, overlayHeight);
    ctx.globalAlpha = 1.0;
  }
  
  return composite;
}

export function exportPNG(ZM) {
  const p5Instance = ZM.p5Instances[0];
  const composite = createCompositeCanvas(ZM, p5Instance.canvas);
  
  composite.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zigzag-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
```

**Key Features:**
- **PixelDensity Aware**: Correctly scales overlay for Retina/high-DPI displays
- **Transparent Overlay**: Respects opacity setting (0-100%)
- **Precise Positioning**: Position X/Y (0-100%) mapped to pixel coordinates
- **Scale Support**: Overlay scale (10-200%) applied correctly
- **Export Quality**: Uses actual rendered resolution (e.g., 3840px on 1920px Retina canvas)

### Video Export with Overlay Compositing

**Implementation (js/export/VideoRecorder.js):**

Video recording uses the same `createCompositeCanvas()` function to composite overlay on every frame:

```javascript
export function captureVideoFrame(ZM) {
  const { p5Instances, videoRecorder } = ZM;
  
  // Create composite canvas with overlay
  const composite = createCompositeCanvas(ZM, p5Instances[0].canvas);
  
  // Capture composite frame
  videoRecorder.capturer.capture(composite);
  videoRecorder.recordedFrames++;
  
  // Update progress
  const progress = (videoRecorder.recordedFrames / videoRecorder.totalFrames) * 100;
  updateProgressBar(progress);
  
  // Stop when complete
  if (videoRecorder.recordedFrames >= videoRecorder.totalFrames) {
    stopVideoRecording(ZM);
  }
}
```

**Process:**
1. Each frame: p5.js renders to canvas
2. Composite canvas created with overlay applied
3. CCapture.js captures composite frame
4. Overlay settings (position, scale, opacity) maintained throughout recording
5. Final video includes overlay on all frames

**Performance Consideration:**
- Overlay compositing adds ~1-2ms per frame
- Negligible impact on video recording speed
- No quality degradation

### Video Export Technical Details

**CCapture.js Integration:**

1. **Fixed Timestep:**
   ```javascript
   if (isRecording) {
     dt = 1 / params.videoFPS;  // e.g., 1/30 = 0.0333...
   }
   ```
   - Ensures consistent animation speed
   - Independent of actual render time
   - Guarantees deterministic output

2. **Frame Capture:**
   ```javascript
   if (isRecording) {
     capturer.capture(p5Instance.canvas);
     recordingFrameCount++;
     updateProgressBar();
     
     if (recordingFrameCount >= recordingTotalFrames) {
       stopVideoCapture();
     }
   }
   ```

3. **Encoding:**
   - Browser-dependent (WebM codec varies)
   - CCapture handles stream encoding
   - File downloads when complete

**Limitations:**
- Cannot interact during recording
- High resolution + long duration = slow process
- File size grows linearly with frames

---

### Depth Map Export Technical Details

**Architecture:**

**Architecture:**
1. Uses exact same camera projection math as SVG export
2. Projects all geometry to 2D screen space
3. Carries depth (Z) values through projection
4. Rasterizes polygons as greyscale based on depth
5. Guarantees pixel-perfect alignment with PNG export

**Implementation Flow:**

```javascript
function exportDepthMap() {
  // 1. Get live geometry
  const lines = emitterInstance.lines.filter(l => l._alpha() > 0);
  
  // 2. Pre-compute projection constants (matches SVG export)
  // Camera position model: pan/zoom as position offsets
  const fovRad = params.fov * Math.PI / 180;
  const defaultCameraZ = (H / 2) / Math.tan(fovRad / 2);
  const cameraX = -camera.offsetX;
  const cameraY = -camera.offsetY;
  const cameraZ = defaultCameraZ + camera.distance;
  
  // 3. Auto-range depth from actual geometry
  const { minDepth, maxDepth } = scanDepthRange(lines);
  
  // 4. Create offscreen canvas
  const offCanvas = document.createElement('canvas');
  offCanvas.width = W;
  offCanvas.height = H;
  const ctx = offCanvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, H);
  
  // 5. Project and rasterize each ribbon
  for (const line of lines) {
    const localVerts = line._buildVertices();
    const { leftSide, rightSide } = buildRibbonSides(localVerts, line.lineThickness / 2);
    
    // Project vertices (3D → 2D + depth)
    const leftProj = leftSide.map(pt => depthProjectVertex(line, pt.x, pt.y)).filter(Boolean);
    const rightProj = rightSide.map(pt => depthProjectVertex(line, pt.x, pt.y)).filter(Boolean);
    
    if (leftProj.length < 2 || rightProj.length < 2) continue;
    
    const poly = [...leftProj, ...[...rightProj].reverse()];
    rasteriseDepthPolygon(ctx, poly, minDepth, maxDepth, params.depthInvert, line._alpha());
  }\n  \n  // 6. Download as PNG\n  offCanvas.toBlob(blob => {\n    const url = URL.createObjectURL(blob);\n    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);\n    const a = document.createElement('a');\n    a.href = url;\n    a.download = `zigzag-depthmap-${ts}.png`;\n    a.click();\n    URL.revokeObjectURL(url);\n  }, 'image/png');\n}\n```\n\n**Auto-Ranging Algorithm:**\n\n```javascript\nfunction scanDepthRange(lines) {\n  let minD = Infinity;\n  let maxD = -Infinity;\n  \n  for (const line of lines) {\n    if (line._alpha() <= 0) continue;\n    for (const pt of line._buildVertices()) {\n      const p = depthProjectVertex(line, pt.x, pt.y);\n      if (!p) continue;  // Clipped\n      if (p.depth < minD) minD = p.depth;\n      if (p.depth > maxD) maxD = p.depth;\n    }\n  }\n  \n  // Nudge minDepth down 3% to ensure nearest geometry maps to pure white\n  const nudge = (maxD - minD) * 0.03;\n  return { minDepth: Math.max(0.01, minD - nudge), maxDepth: maxD };\n}\n```\n\n**Depth Encoding:**\n\n```javascript\nfunction rasteriseDepthPolygon(ctx, pts, minDepth, maxDepth, invert, alpha) {\n  // Average depth across polygon vertices\n  let depthSum = 0;\n  for (const p of pts) depthSum += p.depth;\n  const avgDepth = depthSum / pts.length;\n  \n  // Normalize to [0, 1]\n  let t = (avgDepth - minDepth) / (maxDepth - minDepth);\n  t = Math.max(0, Math.min(1, t));\n  \n  // Apply power curve for contrast enhancement\n  t = Math.pow(t, 0.6);  // Gamma 0.6 boosts midtones toward white\n  \n  // Encode as greyscale\n  const grey = Math.round((invert ? t : 1 - t) * 255);\n  \n  // Rasterize polygon\n  ctx.fillStyle = `rgba(${grey},${grey},${grey},${alpha.toFixed(4)})`;\n  ctx.beginPath();\n  ctx.moveTo(pts[0].sx, pts[0].sy);\n  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);\n  ctx.closePath();\n  ctx.fill();\n}\n```\n\n**Key Features:**\n- **Auto-ranging**: No manual near/far cutoff needed\n- **Power curve**: Gamma 0.6 enhances contrast in midtones\n- **Inversion**: Optional black = near, white = far\n- **Alignment**: Exact pixel correspondence with PNG export\n- **Performance**: CPU-based, works on all browsers\n\n---

## Overlay System

**NEW IN v26:** Static image overlay composited on top of canvas for branding, watermarks, or design elements.

### Architecture

The overlay system uses HTML image elements positioned absolutely over the canvas, then composited into PNG/video exports.

**HTML Structure (index.html):**
```html
<img id="overlay-image" alt="Overlay" style="position: absolute; z-index: 1000; pointer-events: none; display: none;">
```

**Key Attributes:**
- `position: absolute`: Positioned over canvas in 2D space
- `z-index: 1000`: Always on top layer
- `pointer-events: none`: Doesn't block mouse interaction with canvas
- `display: none`: Hidden by default

### Parameter Storage

Overlay settings are **project-wide** (not saved per-state):

```javascript
// js/config/defaults.js
overlayImageSrc: null,        // Image URL/data URI
overlayVisible: false,        // Toggle visibility
overlayScale: 100,           // Size (10-200%)
overlayOpacity: 100,         // Transparency (0-100%)
overlayX: 50,               // Horizontal position (0-100%)
overlayY: 50,               // Vertical position (0-100%)
```

### State Management Exclusion

**Implementation (js/storage/StateManager.js):**
```javascript
export function captureCurrentState(ZM) {
  const state = { ...ZM.params };
  
  // Remove project-wide settings
  delete state.overlayImageSrc;
  delete state.overlayVisible;
  delete state.overlayScale;
  delete state.overlayOpacity;
  delete state.overlayX;
  delete state.overlayY;
  
  return state;
}
```

Overlay settings persist across state switches, allowing consistent branding across all states.

### Image Loading

**Implementation (js/ui/UIController.js):**
```javascript
function setupOverlayControls(ZM) {
  const loadBtn = document.getElementById('load-overlay-btn');
  const overlayImg = document.getElementById('overlay-image');
  
  loadBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/svg+xml';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataURL = evt.target.result;
        
        // Set image source
        overlayImg.src = dataURL;
        ZM.params.overlayImageSrc = dataURL;
        ZM.params.overlayVisible = true;
        
        // Update UI
        document.getElementById('show-overlay').checked = true;
        updateOverlayVisibility(ZM);
        
        // Persist
        saveParams(ZM);
      };
      reader.readAsDataURL(file);
    };
    
    input.click();
  });
}
```

**Supported Formats:**
- PNG (recommended for transparency)
- JPEG (opaque backgrounds)
- SVG (vector graphics, rasterized in exports)

**Data Storage:**
- Image encoded as Base64 data URI
- Stored in `params.overlayImageSrc`
- Automatically saved to localStorage
- Included in project JSON exports

### Preset System **NEW**

**Architecture Overview:**

The preset system enables instant loading of pre-configured overlay images from the `assets/overlays/` folder, eliminating the need for users to manually load common logos or watermarks.

**Directory Structure:**
```
assets/overlays/
├── area-zero-white.json
├── mapping_white.json
├── ddest_white.json
├── ddest-no-box-white.json
├── promo-logo.json
└── zigmap-white.json
```

**JSON File Format:**
```json
{
  "id": "logo1",
  "filename": "logo1.png",
  "type": "image/png",
  "data": "data:image/png;base64,iVBORw0KG..."
}
```

**Field Descriptions:**
- `id`: Unique identifier (filename without extension)
- `filename`: Original image filename
- `type`: MIME type (image/png, image/jpeg, image/svg+xml)
- `data`: Base64-encoded data URI

**Loading Implementation (js/ui/UIController.js):**

```javascript
async function loadOverlayPresets(ZM) {
  const overlayFiles = [
    'area-zero-white.json',
    'mapping_white.json',
    'ddest_white.json',
    'ddest-no-box-white.json',
    'promo-logo.json',
    'zigmap-white.json'
  ];
  
  ZM.overlayPresets = [];
  
  for (const filename of overlayFiles) {
    try {
      const response = await fetch(`assets/overlays/${filename}`);
      if (!response.ok) {
        console.warn(`Overlay preset not found: ${filename}`);
        continue;
      }
      const preset = await response.json();
      ZM.overlayPresets.push(preset);
    } catch (err) {
      console.warn(`Failed to load overlay preset: ${filename}`, err);
    }
  }
  
  console.log(`Loaded ${ZM.overlayPresets.length} overlay presets`);
}
```

**UI Integration:**

```javascript
function setupOverlayControls(ZM) {
  await loadOverlayPresets(ZM);  // Load presets first
  
  const presetSelect = document.getElementById('overlay-preset');
  const loadCustomBtn = document.getElementById('load-overlay-btn');
  
  // Populate dropdown with presets
  ZM.overlayPresets.forEach((preset) => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.filename.replace('.json', '').replace(/_/g, ' ');
    presetSelect.appendChild(option);
  });
  
  // Add "Custom Image" option at end
  const customOption = document.createElement('option');
  customOption.value = 'custom';
  customOption.textContent = '-- Custom Image --';
  presetSelect.appendChild(customOption);
  
  // Handle preset selection
  presetSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      // Trigger custom file picker
      loadCustomBtn.click();
      return;
    }
    
    // Load preset from Base64 data
    const preset = ZM.overlayPresets.find(p => p.id === e.target.value);
    if (preset) {
      const overlayImg = document.getElementById('overlay-image');
      overlayImg.src = preset.data;
      ZM.params.overlayImageSrc = preset.data;
      ZM.params.overlayVisible = true;
      document.getElementById('show-overlay').checked = true;
      updateOverlayVisibility(ZM);
      saveParams(ZM);
    }
  });
}
```

**Converter Utility Tool:**

Location: `utilities/overlay-converter.html`

A standalone HTML tool for converting images to the Base64 JSON preset format:

**Features:**
- Native HTML5 drag & drop interface (no external dependencies)
- Batch conversion support
- Instant preview of selected images
- Automatic JSON file generation
- Supported formats: SVG, PNG, JPG, GIF

**Core Conversion Logic:**
```javascript
async function convertToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const json = {
        id: file.name.replace(/\.[^.]+$/, ''),  // Strip extension
        filename: file.name,
        type: file.type || 'image/png',
        data: e.target.result  // Base64 data URI
      };
      resolve(json);
    };
    reader.readAsDataURL(file);
  });
}

function downloadJSON(jsonObj, filename) {
  const blob = new Blob(
    [JSON.stringify(jsonObj, null, 2)], 
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Usage Workflow:**
1. Open `utilities/overlay-converter.html` in browser
2. Drag & drop image files or click to browse
3. Preview selected images in UI
4. Click "Convert All to Base64" button
5. Each image downloads as separate JSON file
6. Move JSON files to `assets/overlays/` folder
7. Add filenames to `overlayFiles` array in UIController.js
8. Reload app - new presets appear in dropdown

**Technical Benefits:**
- **No server required**: Base64 embedded directly in JSON
- **Fast loading**: All presets loadable in parallel on startup
- **Version control friendly**: JSON files tracked in git
- **Cross-platform**: Works identically on all operating systems
- **Offline capable**: No external image hosting dependencies
- **Type safety**: MIME type preserved in JSON for validation

**Performance Considerations:**
- Base64 encoding increases file size by ~33%
- Average logo (50KB PNG) → ~67KB JSON
- 6 presets (~400KB total) load in <100ms on typical connection
- Images cached in browser memory after first load
- No impact on runtime performance (loaded once at startup)

### Display Synchronization

**Position & Scale Update:**
```javascript
function updateOverlayPosition(ZM) {
  const overlayImg = document.getElementById('overlay-image');
  const { params } = ZM;
  
  // Calculate CSS position
  overlayImg.style.left = `${params.overlayX}%`;
  overlayImg.style.top = `${params.overlayY}%`;
  overlayImg.style.transform = `translate(-50%, -50%) scale(${params.overlayScale / 100})`;
  overlayImg.style.opacity = params.overlayOpacity / 100;
}
```

**CSS Transform Chain:**
1. `translate(-50%, -50%)`: Centers overlay on position point
2. `scale(${overlayScale / 100})`: Applies size scaling
3. `left/top`: Positions center point (0-100% of canvas)
4. `opacity`: Transparency (0-1)

### Export Compositing

See **Export System** section above for details on:
- PixelDensity correction
- Overlay positioning in exports
- Frame-by-frame video compositing

### UI Controls

**Overlay Control Panel:**
- **Show Overlay**: ☑️ Checkbox to toggle visibility
- **Load Image**: Button to import PNG/JPG/SVG
- **Scale** (10-200%): Resize overlay
- **Opacity** (0-100%): Transparency
- **Position X/Y** (0-100%): Place overlay anywhere
- **Clear Image**: Remove overlay and reset

### Workflow

**Typical Usage:**
1. Load overlay image (e.g., logo, watermark)
2. Adjust scale and position
3. Set opacity (e.g., 50% for subtle watermark)
4. Create multiple states with different animations
5. Export PNG/video - overlay included automatically

**Best Practices:**
- Use PNG with transparency for logos
- Set opacity 30-50% for subtle watermarks
- Position in corners (X/Y: 10% or 90%) for branding
- Center (X/Y: 50%) for main design elements
- Scale down (50-80%) for non-intrusive overlays

---

## Performance Considerations

### Optimization Strategies

1. **Pixel Density:**
   ```javascript
   p.pixelDensity(1);  // Force 1:1 ratio
   ```
   - Prevents high-DPI scaling (Retina displays)
   - Reduces pixel count by up to 4× on 2× displays

2. **Emit Rate:**
   - Each line = ~34 vertices (16 segments × 2 sides + caps)
   - 10 lines/sec @ 60fps = 600 lines active (assuming 60s lifetime)
   - ~20,400 vertices per frame
   - Lower emit rate = fewer active lines

3. **Canvas Culling:**
   - Lines outside spawn boundaries are removed
   - Reduces draw calls and memory

4. **Shared Emitter:**
   - Stereo mode shares single Emitter instance
   - Simulation runs once, rendered twice
   - Halves CPU cost of updates

5. **LocalStorage Throttling:**
   - Could debounce `saveToLocalStorage()` for high-frequency controls
   - Currently saves on every change (acceptable for most parameters)

### Performance Metrics

Typical performance on modern hardware:

| Scenario | FPS | Active Lines |
|----------|-----|--------------|
| Default (1.5/s rate) | 60 | ~90 |
| High (5/s rate) | 55-60 | ~300 |
| Extreme (10/s rate) | 45-55 | ~600 |
| Stereo (default) | 50-55 | ~90 (per eye) |

**Bottlenecks:**
- Vertex processing (WebGL)
- Shape drawing (p5.js)
- Ribbon geometry calculation

---

## Extension Guide

### Adding New Controls

**1. Add HTML:**
```html
<div class="control-group">
  <label>New Parameter</label>
  <div class="slider-row">
    <input type="range" id="new-param" min="0" max="100" value="50"/>
    <span class="value-display" id="new-param-val">50</span>
  </div>
</div>
```

**2. Add to `params`:**
```javascript
const params = {
  // ... existing params
  newParameter: 50
};
```

**3. Wire control:**
```javascript
wireSlider(ZM, 'new-param', 'new-param-val', 'newParameter');
```

**4. Use in code:**
```javascript
// Anywhere params is accessed
const value = params.newParameter;
```

**5. Add to `syncUIFromParams`:**
```javascript
{ id: 'new-param', key: 'newParameter' }
```

---

### Adding Custom Shapes
Customizing existing palettes:**
1. Select palette (1-4) via buttons or keyboard
2. Click color pickers to adjust RGB values
3. Set color roles via dropdowns (Line/Background/None)
4. Adjust **Color Depth Separation** slider (10-500) to control Z-offset multiplier

**Adding more palettes:**
Edit `js/config/defaults.js`:
```javascript
palettes: [
  // Add 5th palette
  [
    { rgb: [255, 128, 0], role: 'line' },
    { rgb: [0, 255, 128], role: 'line' },
    { rgb: [128, 0, 255], role: 'background' },
    { rgb: [255, 255, 0], role: 'none' }
  ]
],
```

Update `js/ui/UIController.js` to add 5th button to palette selector.

**Technical notes:**
- Color transitions use RGB linear interpolation (lerpColor)
- Z-offset formula: `(slotIndex - 2) × multiplier` centers at 0
- isTransitioning flags prevent unnecessary calculations after transitions complete
  
  update(dt) {
    // Update position, check bounds
    // Set this.alive = false when done
  }
  
  draw(p) {
    // Rendering logic
    p.push();
    p.translate(this.x - W/2, this.y - H/2, 0);
    // Draw your shape
    p.pop();
  }
}
```

**2. Modify emitter:**
```javascript
_emit() {
  // Optionally alternate or choose based on params
  if (params.shapeType === 'custom') {
    this.lines.push(new CustomShape({
      p: this.p,
      x: this.x,
      y: this.y,
      // Custom parameters
    }));
  } else {
    // Existing ZigzagLine
  }
}
```

---

### Adding Export Formats

**Example: JPEG export**

```javascript
function exportJPEG() {
  const canvas = p5Instance.canvas;
  const dataURL = canvas.toDataURL('image/jpeg', 0.9);  // 90% quality
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = `zigzag-emitter-${formatTimestamp()}.jpg`;
  a.click();
}
```

Wire to button in HTML.

---

### Custom Color Palettes

**1. Add swatches to HTML:**
```html
<div class="swatch" data-color="128,0,255" style="background:#8000ff"></div>
```

**2. Automatically picks up existing handler.**

**For advanced palettes:**
- Add color picker input: `<input type="color">`
- Convert hex to RGB: `hexToRgb(hex)`
- Update `params.lineColor`

---

## Debugging

### Console Logging

The application includes strategic console logs:

**Page load:**
```
Loaded from localStorage, camera.distance = 600
Setup complete - camera.distance: 600 isPrimary: true
```

**Mouse events:**
```
mousePressed - button: RIGHT, LEFT: LEFT, RIGHT: RIGHT
→ Right/Center button: panning mode
→ camera state: {isDragging: false, isPanning: true}
```

**Panning:**
```
camera.distance before calc: 600 params.cameraDistance: 600
PANNING: {dx: 5, dy: -3, sens: 1.2, distance: 600, offsetX: 6, offsetY: -3.6}
```

**FOV changes:**
```
FOV changed: 60.00° → 90.00°, Distance: 600.0 → 346.4 (ratio: 0.577)
```

**Zoom:**
```
mouseWheel: camera.distance = 720
```

---

### Common Issues

**Lines not appearing:**
- Check `emitRate` > 0
- Verify camera is not too far/close
- Check clipping planes (near/far)
- Ensure canvas dimensions are valid

**Panning not working:**
- Check console for `camera.distance` - should be ≥ 50
- Verify right-click context menu is prevented
- Check `camera.isPanning` state in logs

**Performance issues:**
- Reduce `emitRate`
- Disable random modulations
- Lower canvas resolution
- Check browser hardware acceleration

**Export failures:**
- PNG/SVG: Check browser download permissions
- Video: Ensure page is visible during recording
- Check browser console for errors

---

### Browser Dev Tools

**Useful inspections:**

1. **Console:** `console.log()` statements for state
2. **Network:** Check library loads (p5.js, CCapture.js)
3. **Performance:** Profile frame timing
4. **Application → Local Storage:** View `zigmap26Settings`
5. **Elements:** Inspect canvas dimensions and classes

---

## References

- **p5.js Documentation:** https://p5js.org/reference/
- **CCapture.js GitHub:** https://github.com/spite/ccapture.js/
- **WebGL Fundamentals:** https://webglfundamentals.org/
- **Perlin Noise:** https://en.wikipedia.org/wiki/Perlin_noise
- **Miter Joins:** https://en.wikipedia.org/wiki/Miter_joint

---

## License

[ MIT License — CC BY-NC-SA — ddelcourt 2026 ]

---

**Version:** 10.0  
**Last Updated:** March 7, 2026  
**Author:** [ddelcourt]  
**Project:** Mapping 2026

---

---

# SpaceFlow — Modular Architecture

## Overview

SpaceFlow is a complete modularization of the original ZigzagEmitter application. The monolithic HTML file has been transformed into a modern ES6 module-based architecture with proper separation of concerns.

## Project Structure

```
SpaceFlow/
├── index.html                    # Main HTML entry point
├── css/                          # Stylesheets
│   ├── main.css                  # Base styles and layout
│   ├── canvas.css                # Canvas rendering styles
│   └── controls.css              # UI control panel styles
├── js/
│   ├── main.js                   # Application orchestrator
│   ├── config/                   # Configuration modules
│   │   ├── defaults.js           # DEFAULT_PARAMS export
│   │   └── constants.js          # Application constants
│   ├── core/                     # Core rendering classes
│   │   ├── ZigzagLine.js         # Single zigzag ribbon object
│   │   ├── Emitter.js            # Line emission and lifecycle
│   │   ├── Camera.js             # Camera state management
│   │   ├── utils.js              # Shared utility functions
│   │   └── Projection.js         # 3D-to-2D projection math
│   ├── storage/                  # Persistence
│   │   └── localStorage.js       # Settings save/load
│   ├── rendering/                # p5.js integration
│   │   └── SketchFactory.js      # p5 sketch creation
│   ├── export/                   # Export functionality
│   │   ├── SVGExporter.js        # Vector graphic export
│   │   ├── PNGExporter.js        # Raster image export
│   │   ├── DepthExporter.js      # Depth map export
│   │   └── VideoRecorder.js      # CCapture.js integration
│   ├── ui/                       # User interface
│   │   └── UIController.js       # Control binding
│   └── input/                    # Input handling
│       ├── KeyboardHandler.js    # Keyboard shortcuts
│       └── MouseHandler.js       # Camera mouse controls
├── config/                       # JSON configurations
│   ├── keyboardShortcuts.json    # Centralized shortcuts
│   ├── uiPresets.json            # Framebuffer/color presets
│   └── appInfo.json              # Application metadata
├── docs/                         # Documentation
│   ├── User-Manual.md            # User guide (EN)
│   ├── User-Manual-fr.md         # User guide (FR)
│   ├── Documentation.md          # Technical docs (EN)
│   ├── Documentation-fr.md       # Technical docs (FR)
│   ├── Projection-Matrix-Guide.md      # Math guide (EN)
│   ├── Projection-Matrix-Guide-fr.md   # Math guide (FR)
│   └── markdown-viewer.html      # Documentation viewer
```

## Architecture Principles

### 1. **Separation of Concerns**
- **CSS Modules**: Styling separated into thematic files (main, canvas, controls)
- **JavaScript Modules**: Code organized by function (core, rendering, export, UI, input)
- **JSON Configs**: External configuration for keyboard shortcuts, presets, metadata

### 2. **Dependency Injection**
Core classes accept dependencies as parameters rather than using global variables:
```javascript
const line = new ZigzagLine(
  canvasWidth,
  canvasHeight,
  getSpawnDistanceFn,
  buildRibbonSidesFn
);
```

### 3. **ES6 Module System**
All JavaScript uses modern module syntax:
```javascript
import { ZigzagLine } from './core/ZigzagLine.js';
export function exportSVG(ZM) { /* ... */ }
```

### 4. **Global Namespace**
A single `window.SpaceFlow` object provides organized global access:
```javascript
window.SpaceFlow = {
  params,        // Application parameters
  camera,        // Camera state
  emitterInstance, // Main emitter reference
  exportSVG(),   // Export functions
  // ...
};
```

## Running the Application

### Development Server
```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

### File Server Requirements
ES6 modules require a web server (not `file://` protocol). Any HTTP server works:
- Python: `python3 -m http.server`
- Node.js: `npx http-server`
- VS Code: Live Server extension

## Key Features

### Core Rendering
- **WebGL 3D**: p5.js WEBGL renderer with camera controls
- **Zigzag Ribbons**: Procedurally generated zigzag geometry
- **Modulation**: Random thickness and speed variations
- **Stereoscopic Mode**: VR-ready dual-canvas rendering

### Export Capabilities
- **PNG**: Direct canvas export
- **SVG**: Vector export with exact projection math
- **Depth Map**: CPU-based depth rendering with auto-ranging
- **Video**: CCapture.js integration (WebM/MP4)

### Settings Persistence
- **localStorage**: Auto-save all parameters
- **JSON Export/Import**: Share configurations as files
- **Validation**: Critical parameter bounds checking

### Input Handling
- **Keyboard Shortcuts**: 20+ configurable shortcuts
- **Mouse Controls**: 
  - Left-drag: Rotate camera
  - Right-drag: Pan view
  - Scroll: Zoom
- **Framebuffer Mode**: Fixed resolution rendering

## Configuration Files

### `config/keyboardShortcuts.json`
Centralized keyboard shortcut definitions:
```json
[
  {
    "key": "p",
    "action": "exportPNG",
    "description": "Export PNG",
    "preventDefault": true
  }
]
```

### `config/uiPresets.json`
Framebuffer presets and color swatches:
```json
{
  "framebufferPresets": [
    { "name": "1920x1080", "width": 1920, "height": 1080 }
  ],
  "colorSwatches": [
    [255, 255, 255],
    [80, 200, 255]
  ]
}
```

### `config/appInfo.json`
Application metadata and documentation links:
```json
{
  "name": "ZigMap26",
  "version": "1.0.0",
  "documentation": { ... }
}
```

## Module Details

### Core Classes

#### `ZigzagLine`
```javascript
class ZigzagLine {
  constructor(canvasWidth, canvasHeight, getSpawnDistanceFn, buildRibbonSidesFn)
  update(dt)
  draw(p5Instance)
  _alpha()  // Fade in/out
  _buildVertices()  // Generate zigzag points
}
```

#### `Emitter`
```javascript
class Emitter {
  constructor(params, noiseOffsetGetter, canvasWidth, canvasHeight, utilFns)
  update(dt)
  draw(p5Instance)
  _emit()  // Create new line
}
```

#### `Camera`
```javascript
class Camera {
  constructor(params)
  syncToParams(params)
  reset()
  resetZoom()
}
```

### Projection System

The projection system uses identical mathematics for all exports (SVG, PNG, depth) to ensure pixel-perfect alignment:

1. **Rotation Order**: Z → Y → X (matches p5.js WEBGL)
2. **Camera Position Model**: Pan and zoom treated as camera position offsets
   - `camera_x = -pan_offset_x`
   - `camera_y = -pan_offset_y`
   - `camera_z = default_camera_z + zoom_distance`
3. **View Transform**: `view_pos = world_pos_rotated - camera_pos`
4. **Perspective**: `screen_x = view_x * (camera_z / -view_z) + width/2`

This model is clearer than applying translations in the middle of the transformation pipeline. When the user pans right, the camera effectively moves left (hence the negative sign).

See [docs/English/Projection-Matrix-Guide.md](docs/English/Projection-Matrix-Guide.md) for detailed mathematics.

## Migration from Original

The original monolithic `ZigzagEmitter_12.html` (2,334 lines) has been refactored into a modular architecture:
- 1 HTML file (330 lines)
- 3 CSS files (total ~400 lines)
- 15 JavaScript modules (total ~1,500 lines)
- Multiple JSON config files (total ~200 lines)

### Breaking Changes
- None for users (localStorage keys preserved)
- Developers must use HTTP server (not `file://`)

### Preserved Features
- All original functionality maintained
- Settings auto-load from localStorage
- Keyboard shortcuts unchanged
- Export formats identical

## Development

### Adding New Features

#### New Export Format
1. Create `js/export/NewExporter.js`
2. Export a function: `export function exportNew(ZM) { ... }`
3. Import in `main.js` and add to `window.SpaceFlow`
4. Wire to UI button in `UIController.js`

#### New Parameter
1. Add to `js/config/defaults.js` in `DEFAULT_PARAMS`
2. Add UI control in `index.html`
3. Wire slider/checkbox in `UIController.js`
4. Use via `ZM.params.newParameter`

#### New Keyboard Shortcut
1. Add entry to `config/keyboardShortcuts.json`
2. Add action handler in `KeyboardHandler.js::executeAction()`

## Browser Compatibility

- Chrome/Edge: full support
- Firefox: full support
- Safari: full support (ES6 modules)
- Mobile: limited (no right-click for pan)

## Dependencies

- **p5.js 1.9.0**: 3D rendering engine
- **CCapture.js 1.1.0**: Video recording
- Both loaded via CDN in `index.html`

## License

Same as original project.

## Contributing

When adding new modules:
1. Use ES6 `import`/`export` syntax
2. Pass dependencies via parameters (no globals except `window.SpaceFlow`)
3. Follow camelCase naming convention
4. Document complex functions with JSDoc comments
5. Test with HTTP server before committing

## Credits

**Original Monolithic Version**: ZigzagEmitter v1-12  
**Modular Architecture**: ZigMap26 v1.0  
**Refactoring Date**: March 9, 2026


---

# Original Technical Documentation

