# SpaceFlow — Complete Architecture Strategy
**From Monolithic App to Modular Framework**

**Created:** May 24-25, 2026  
**Status:** Master Architecture Document  
**Version:** 1.0

---

## ⚠️ CRITICAL REQUIREMENT ⚠️

### SVG Export is NON-NEGOTIABLE

**THIS IS THE #1 PRIORITY FOR ANY ARCHITECTURAL CHANGE:**

🚨 **SVG export functionality must ALWAYS work**  
🚨 **ANY code update that breaks SVG export is UNACCEPTABLE**  
🚨 **EVERY architectural decision must preserve SVG export**

**Why This Matters:**
- SVG export is a **core professional feature**
- Resolution-independent vector graphics for print and editing
- Used in production workflows (Illustrator, Inkscape)
- Cannot be compromised under any circumstances

**Implementation Rule:**
- ❌ Breaking SVG export = BAD update (must be reverted)
- ✅ Preserving SVG export = GOOD update (can proceed)

---

## Executive Summary

**SpaceFlow** transforms ZigMap26 from a monolithic zigzag generator into a modular framework for real-time 3D generative art. This document defines the complete architecture for achieving this vision **while guaranteeing SVG export functionality is fully preserved**.

### Core Innovation

**Manifest-Driven Patch System**: Patches define their parameters once in a JSON manifest, and everything else (UI generation, storage, validation, state management) happens automatically at the framework level.

### Key Benefits

- 🔌 **Extensibility**: Load different visual algorithms as pluggable patches
- 🎨 **Reusability**: Camera, colors, export work with ANY patch
- 📋 **Simplicity**: Adding a parameter = one JSON entry
- 🎭 **States**: Complete snapshots work across different patches
- 🎛️ **Scalability**: UI adapts from 3 to 100+ parameters automatically
- 🚀 **Future-Ready**: Architecture supports future layer system for VJ workflows
- 🚨 **SVG Export Guarantee**: All export formats (including critical SVG) fully preserved

---

## Table of Contents

### Part I: Vision & Architecture
1. [Vision](#1-vision)
2. [Three-Layer Architecture](#2-three-layer-architecture)
3. [Property Hierarchy](#3-property-hierarchy)

### Part II: Core Systems
4. [Universal Systems](#4-universal-systems)
5. [Patch System](#5-patch-system)
6. [State Management](#6-state-management)

### Part III: Dynamic Parameters
7. [Parameter Manifest](#7-parameter-manifest)
8. [Parameter Types](#8-parameter-types)
9. [Dynamic UI Generation](#9-dynamic-ui-generation)

### Part IV: User Interface
10. [UI Layout Strategy](#10-ui-layout-strategy)
11. [Visual Hierarchy](#11-visual-hierarchy)
12. [Advanced UI Features](#12-advanced-ui-features)

### Part V: Implementation
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [File Structure](#14-file-structure)
15. [Migration Strategy](#15-migration-strategy)
16. [Code Examples](#16-code-examples)

---

# Part I: Vision & Architecture

## 1. Vision

### The Transformation

```
ZigMap26 (Current)          SpaceFlow (Future)
===================         ==================
Monolithic app         →    Modular framework
Zigzag-specific        →    Patch-agnostic
Hard-coded UI          →    Auto-generated UI
Manual parameter wiring →   Manifest-driven
Single algorithm       →    Pluggable patches
```

### What SpaceFlow Provides (Framework)

- **Camera System**: 3D navigation, projection, transitions
- **Color Palette System**: 4×4 palettes, transitions, deterministic RNG
- **Export System**: PNG, SVG, Video, depth maps
- **Storage System**: localStorage, JSON presets, state management
- **Window Sync**: Multi-window coordination for displays
- **UI Shell**: Dynamic parameter generation, adaptive layouts
- **Overlay System**: Branding, logo positioning

### What Patches Provide (Pluggable)

- **Visual Algorithm**: Geometry generation, animation logic
- **Parameters**: Patch-specific controls (size, speed, count, etc.)
- **Behavior**: Update logic, physics, emission patterns
- **Manifest**: Parameter definitions, categories, metadata

### Use Cases

**Today:**
- Creative tool for zigzag patterns
- Live performance visuals
- Export for social media, print

**Tomorrow:**
- Framework for ANY generative algorithm
- Particle systems, fractals, fluid dynamics
- Community-contributed patches
- VJ tool with layered patches (future)

---

## 2. Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  SPACEFLOW FRAMEWORK                     │
│                  (Universal Systems)                     │
│                                                          │
│  Camera System • Color Palette System • Export System   │
│  Storage System • Window Sync • UI Shell • Overlay      │
└─────────────────────────────────────────────────────────┘
                           ↕
        ┌──────────────────────────────────────┐
        │        PATCH INTERFACE (API)         │
        │     (Contract between layers)        │
        │                                      │
        │  • setup(config)                     │
        │  • update(dt, params)                │
        │  • draw(p, camera, params)           │
        │  • getManifest()                     │
        │  • getGeometry()                     │
        │  • onParameterChange(key, value)     │
        │  • onResize(width, height)           │
        │  • destroy()                         │
        └──────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                    PATCH MODULES                         │
│               (Pluggable Algorithms)                     │
│                                                          │
│  📦 zigzag/                                              │
│     ├── ZigzagEmitterPatch.js (implements interface)    │
│     ├── Emitter.js (emission logic)                     │
│     ├── ZigzagLine.js (geometry + animation)            │
│     └── manifest.json (parameter definitions)           │
│                                                          │
│  📦 particles/ (future)                                  │
│  📦 fractals/ (future)                                   │
│  📦 fluid/ (future)                                      │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### Layer 1: Framework (Universal)
- Provides services used by all patches
- Manages application lifecycle
- Handles UI shell generation
- Coordinates storage and sync
- **Manages State Management system** (save/load/transition)
- **Controls state player and auto-trigger**
- **Orchestrates parameter interpolation during transitions**

#### Layer 2: Patch Interface (Contract)
- Defines what framework expects from patches
- Defines what patches can expect from framework
- Ensures patches are interchangeable
- Enables future extensibility

#### Layer 3: Patches (Implementations)
- Self-contained visual algorithms
- Define their own parameters via manifest
- Implement standard interface methods
- Can be developed independently
- **Manage internal animation state** (particles, buffers, physics)
- **React to parameter values** (which may be mid-transition)
- **Do NOT control state transitions** (framework handles)

---

## 3. Property Hierarchy

### Complete Hierarchy

```
SpaceFlow Application
├── Framework Configuration
│   ├── Current Patch Name
│   ├── Active State ID
│   └── UI Layout Mode
│
├── Universal Properties (Framework-level)
│   ├── 🎥 Camera
│   │   ├── fov, near, far
│   │   ├── distance, rotationX, rotationY, rotationZ
│   │   └── offsetX, offsetY
│   │
│   ├── 🎨 Colors
│   │   ├── palettes[4][4] (4 palettes, 4 colors each)
│   │   ├── activePaletteIndex
│   │   └── colorTransitionDuration
│   │
│   ├── ⚡ Animation (Global)
│   │   ├── ambientSpeedMaster
│   │   ├── stateTransitionDuration
│   │   ├── autoTriggerStates
│   │   └── autoTriggerFrequency
│   │
│   ├── 📤 Export
│   │   ├── framebufferMode, width, height, preset
│   │   ├── canvasBorderVisible, canvasBorderColor
│   │   └── videoDuration, videoFPS, videoFormat
│   │
│   └── 🖼️ Overlay
│       ├── visible, source (preset/custom)
│       ├── scale, opacity, x, y
│       └── autoFit
│
└── Patch Properties (Patch-specific)
    ├── 📐 Geometry (example: Zigzag patch)
    │   ├── segmentLength
    │   ├── lineThickness
    │   ├── emitterRotation
    │   ├── geometryScale
    │   └── colorSlotZOffset
    │
    ├── 🎬 Behavior
    │   ├── emitRate
    │   ├── speed
    │   └── direction (if applicable)
    │
    ├── 📊 Modulation
    │   ├── randomThickness, thicknessRangeMin/Max
    │   └── randomSpeed, speedRangeMin/Max
    │
    └── 🎛️ [Custom Categories]
        └── (defined by patch manifest)
```

### Property Organization Rules

1. **Universal Properties** exist in ALL patches (camera, colors, export)
2. **Patch Properties** are specific to the loaded patch
3. **Categories** group related parameters (geometry, behavior, etc.)
4. **Subcategories** allow deeper nesting within categories
5. **Scope** determines if property is "universal" or "patch"

---

# Part II: Core Systems

## 4. Universal Systems

### 🎥 Camera System

**Purpose**: 3D navigation shared by all patches

**Properties:**
```javascript
{
  fov: 60,                    // Field of view (degrees)
  near: 0.01,                 // Near clipping plane
  far: 5000,                  // Far clipping plane
  distance: 600,              // Distance from origin
  rotationX: 0.5,             // Pitch (radians)
  rotationY: 0.3,             // Yaw (radians)
  rotationZ: 0,               // Roll (radians)
  offsetX: 0,                 // Pan horizontal
  offsetY: 0,                 // Pan vertical
  projection: 'perspective'   // 'perspective' or 'orthographic'
}
```

**Why Universal:**
- All 3D patches need camera controls
- Consistent navigation across patches
- State transitions include camera animation

**Framework Responsibilities:**
- Provide camera object to patches via `draw(p, camera, params)`
- Handle smooth camera transitions
- Manage stereoscopic mode (dual cameras)

**Patch Responsibilities:**
- Read camera properties (read-only)
- Do NOT modify camera directly

---

### 🎨 Color Palette System

**Purpose**: Consistent color management across all patches

**Properties:**
```javascript
{
  palettes: [                    // 4 palettes
    [                            // Palette 1: 4 colors
      { r: 255, g: 255, b: 255, role: "line" },
      { r: 200, g: 200, b: 200, role: "line" },
      { r: 150, g: 150, b: 150, role: "line" },
      { r: 0, g: 0, b: 0, role: "background" }
    ],
    // ... 3 more palettes
  ],
  activePaletteIndex: 0,         // Currently selected palette (0-3)
  colorTransitionDuration: 3.0   // Palette switch animation time (seconds)
}
```

**Why Universal:**
- Provides visual consistency
- Keyboard shortcuts (1-4) to switch palettes work everywhere
- State changes include color transitions

**Framework Responsibilities:**
- Manage 4 palettes with 4 colors each
- Provide color selection API to patches
- Handle smooth color transitions

**Patch Responsibilities:**
- Request colors from framework: `SpaceFlow.colorSystem.getColor(slotIndex)`
- Handle per-line color transitions internally (patch animation)
- Do NOT manipulate palettes directly

---

### ⚡ Animation (Global)

**Purpose**: Master controls affecting all patches

**Properties:**
```javascript
{
  ambientSpeedMaster: 100,          // Global speed multiplier (%)
  stateTransitionDuration: 3.0,     // State change animation time (seconds)
  autoTriggerStates: false,         // Auto-cycle through states
  autoTriggerFrequency: 30          // Time between state changes (seconds)
}
```

**Why Universal:**
- Master speed affects all animation
- State transitions apply to all properties
- Auto-trigger is application-level behavior

---

### 📤 Export System

**Purpose**: Generate outputs from any patch

**Properties:**
```javascript
{
  framebufferMode: false,           // Lock to fixed resolution
  framebufferWidth: 1920,
  framebufferHeight: 1080,
  framebufferPreset: "1920x1080",
  canvasBorderVisible: false,
  canvasBorderColor: "#adff2f",
  videoDuration: 10,                // Video recording length (seconds)
  videoFPS: 60,
  videoFormat: "webm"               // "webm" or "gif"
}
```

**Framebuffer Mode:**
When `framebufferMode` is enabled, the canvas renders at the specified fixed resolution (`framebufferWidth` × `framebufferHeight`) regardless of window size. This setting affects:
- PNG exports (captures at framebuffer resolution)
- Video exports (records at framebuffer resolution)
- SVG exports (not affected, resolution-independent)
- Depth map exports (uses framebuffer resolution)

**Why Universal:**
- All patches need export capabilities
- Resolution settings apply at canvas level
- Video recording is framework-level

---

#### Export Pipeline Architecture

SpaceFlow provides **four export formats**, each using a different pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│                    EXPORT PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌────────────────────┐   │
│  │   PNG    │───▶│  Canvas  │───▶│  Direct capture    │   │
│  │  Export  │    │ Renderer │    │  (screenshot)      │   │
│  └──────────┘    └──────────┘    └────────────────────┘   │
│       ↓                                                     │
│  Framebuffer-aware, includes overlay                       │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌────────────────────┐   │
│  │  Video   │───▶│  Canvas  │───▶│  Frame-by-frame    │   │
│  │  Export  │    │ Renderer │    │  capture (CCapture)│   │
│  └──────────┘    └──────────┘    └────────────────────┘   │
│       ↓                                                     │
│  Framebuffer-aware, time-based recording, includes overlay │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌────────────────────┐   │
│  │   SVG    │───▶│ Geometry │───▶│  Vector generation │   │
│  │  Export  │    │  API     │    │  (resolution-free) │   │
│  └──────────┘    └──────────┘    └────────────────────┘   │
│       ↓                                                     │
│  Calls patch.getGeometry() → processes vertices            │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌────────────────────┐   │
│  │  Depth   │───▶│ Geometry │───▶│  Grayscale render  │   │
│  │   Map    │    │  API     │    │  based on Z-depth  │   │
│  └──────────┘    └──────────┘    └────────────────────┘   │
│       ↓                                                     │
│  Calls patch.getGeometry() → projects & rasterizes         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### 1. PNG Export (Canvas-Based)

**Method**: Direct canvas capture

**Process:**
1. Framework captures current canvas pixels
2. Applies overlay if enabled (composite operation)
3. Converts to PNG via `canvas.toDataURL()`
4. Triggers download

**Patch Requirements:**
- ✅ None — works automatically with any rendering
- ✅ Patches just need to implement `draw()`

**Characteristics:**
- Resolution-dependent
- Includes overlays
- Fast and simple
- Perfect pixel accuracy of what's on screen
- **Framebuffer-aware**: Respects fixed resolution settings when framebuffer mode is enabled

**Framework Implementation:**
```javascript
// In PNGExporter.js
function exportPNG(framework) {
  const canvas = framework.getCanvas();
  const overlay = framework.getOverlay();
  
  // Composite canvas + overlay
  const composited = compositeWithOverlay(canvas, overlay);
  
  // Convert to PNG
  const dataURL = composited.toDataURL('image/png');
  downloadFile(dataURL, `spaceflow-${timestamp()}.png`);
}
```

**Status**: ✅ Works with ANY patch automatically

---

#### 2. Video Export (Canvas-Based)

**Method**: Frame-by-frame canvas capture using CCapture.js

**Process:**
1. Framework starts recording loop
2. For each frame:
   - Render patch via `draw()`
   - Capture canvas pixels
   - Apply overlay
   - Add frame to video encoder
3. After duration completes, encode and download

**Patch Requirements:**
- ✅ None — works automatically
- ✅ Patches implement time-based animation in `update(dt)`

**Characteristics:**
- Time-based recording
- Includes overlays
- Configurable FPS and duration
- WebM or GIF output
- **Framebuffer-aware**: Respects fixed resolution settings when framebuffer mode is enabled

**Framework Implementation:**
```javascript
// In VideoRecorder.js
function startRecording(framework, duration, fps) {
  const capturer = new CCapture({
    format: framework.params.videoFormat,
    framerate: fps
  });
  
  capturer.start();
  
  let elapsed = 0;
  const frameInterval = 1 / fps;
  
  const recordLoop = () => {
    framework.patch.update(frameInterval);
    framework.patch.draw(framework.p, framework.camera, framework.params);
    
    // Apply overlay
    if (framework.overlay.visible) {
      framework.drawOverlay();
    }
    
    capturer.capture(framework.canvas);
    elapsed += frameInterval;
    
    if (elapsed < duration) {
      requestAnimationFrame(recordLoop);
    } else {
      capturer.stop();
      capturer.save();
    }
  };
  
  recordLoop();
}
```

**Status**: ✅ Works with ANY patch automatically

---

#### 3. SVG Export (Geometry-Based) 🚨 ABSOLUTELY CRITICAL — NON-NEGOTIABLE 🚨

**Method**: Vector generation from 3D geometry

**⚠️ WHY SVG EXPORT IS ABSOLUTELY CRITICAL AND MUST NEVER BE BROKEN:**

**Professional Requirements:**
- **Resolution-independent** — Scale infinitely without quality loss (ESSENTIAL for print)
- **Editable** — Open in Illustrator, Inkscape, etc. (REQUIRED for production workflows)
- **Precise** — Exact mathematical representations (CRITICAL for accuracy)
- **Small files** — Efficient for sharing and archiving
- **Print-ready** — Professional output quality (NON-NEGOTIABLE)

**Business Impact:**
- Used in professional creative workflows
- Core feature users depend on
- Competitive advantage over raster-only tools
- Cannot be temporarily unavailable during migration

**MANDATE:** Any architectural change that compromises SVG export is unacceptable and must be redesigned.

**Process:**
1. Framework calls `patch.getGeometry()`
2. Patch returns array of geometric primitives (lines, ribbons, shapes)
3. Framework projects 3D coordinates → 2D screen space
4. Framework generates SVG elements (`<polygon>`, `<path>`, etc.)
5. Framework applies colors, opacity, transformations
6. Download as `.svg` file

**Patch Requirements:**
- ✅ Implement `getGeometry()` method
- ✅ Return geometry in standardized format (see below)
- ✅ Include vertex positions, colors, opacity

**Critical Implementation Details:**

**getGeometry() Contract:**
```javascript
class ZigzagPatch {
  getGeometry() {
    return {
      type: 'ribbons',           // Type hint for framework
      units: 'world',             // Coordinate space
      items: [
        {
          type: 'ribbon',
          vertices: [             // Centerline vertices in 3D
            { x: 100, y: 200, z: 50 },
            { x: 150, y: 180, z: 45 },
            // ... more vertices
          ],
          thickness: 24,          // Width of ribbon
          color: { r: 255, g: 200, b: 100 },
          opacity: 0.95,
          zOffset: 0              // Layering depth
        },
        // ... more ribbons
      ],
      metadata: {
        bounds: { minX, maxX, minY, maxY, minZ, maxZ },
        count: 150,
        patch: 'zigzag-emitter-v1'
      }
    };
  }
}
```

**Geometry Format Specification:**

**Supported Primitive Types:**
- `ribbon` — Thick line with width (centerline + thickness)
- `polygon` — Closed shape with vertices
- `polyline` — Open path
- `circle` — Center + radius
- `ellipse` — Center + radii + rotation

**Ribbon Format (most common):**
```javascript
{
  type: 'ribbon',
  vertices: [           // Centerline in 3D world space
    { x, y, z },
    // ... 
  ],
  thickness: number,    // Width of ribbon in world units
  color: { r, g, b },   // RGB values (0-255)
  opacity: number,      // 0.0 - 1.0
  zOffset: number       // Z-layer for rendering order
}
```

**Framework SVG Generation:**
```javascript
// In SVGExporter.js
function exportSVG(framework) {
  // 1. Get geometry from patch
  const geometry = framework.patch.getGeometry();
  
  // 2. Create SVG document
  const svg = createSVGElement('svg', {
    width: framework.W,
    height: framework.H,
    viewBox: `0 0 ${framework.W} ${framework.H}`
  });
  
  // 3. Add background
  addBackground(svg, framework.getBackgroundColor());
  
  // 4. Process each geometric item
  geometry.items.forEach(item => {
    if (item.type === 'ribbon') {
      // Build ribbon sides from centerline
      const { leftSide, rightSide } = expandRibbon(
        item.vertices,
        item.thickness / 2
      );
      
      // Project 3D → 2D
      const leftProjected = leftSide.map(v => 
        project3Dto2D(v, framework.camera)
      );
      const rightProjected = rightSide.map(v => 
        project3Dto2D(v, framework.camera)
      );
      
      // Create SVG polygon
      const polygon = createSVGElement('polygon', {
        points: [...leftProjected, ...rightProjected.reverse()]
          .map(p => `${p.x},${p.y}`).join(' '),
        fill: `rgb(${item.color.r},${item.color.g},${item.color.b})`,
        'fill-opacity': item.opacity,
        stroke: 'none'
      });
      
      svg.appendChild(polygon);
    }
    // Handle other primitive types...
  });
  
  // 5. Download
  downloadSVG(svg, `spaceflow-${timestamp()}.svg`);
}
```

**Projection Pipeline (Framework Provides):**
```javascript
function project3Dto2D(vertex, camera) {
  // 1. Apply geometry scale
  let { x, y, z } = scaleVertex(vertex, params.geometryScale);
  
  // 2. Apply rotations (emitter + camera)
  ({ x, y, z } = rotateZ(x, y, z, params.emitterRotation));
  ({ x, y, z } = rotateY(x, y, z, camera.rotationY));
  ({ x, y, z } = rotateX(x, y, z, camera.rotationX));
  
  // 3. Transform to camera space
  const viewX = x - camera.offsetX;
  const viewY = y - camera.offsetY;
  const viewZ = z - camera.distance;
  
  // 4. Frustum culling
  if (viewZ >= -camera.near || viewZ <= -camera.far) {
    return null; // Outside view
  }
  
  // 5. Perspective projection
  const fovScale = (canvasHeight / 2) / Math.tan(camera.fov / 2);
  const scale = fovScale / -viewZ;
  const screenX = viewX * scale + canvasWidth / 2;
  const screenY = viewY * scale + canvasHeight / 2;
  
  return { x: screenX, y: screenY };
}
```

**Migration Strategy for Zigzag Patch:**
```javascript
// Current: Direct access to emitter.lines
function exportSVG(ZM) {
  ZM.emitterInstance.lines.forEach(line => {
    const verts = line._buildVertices();
    // ... process
  });
}

// Future: Patch provides geometry
class ZigzagPatch {
  getGeometry() {
    return {
      type: 'ribbons',
      items: this.emitter.lines
        .filter(line => line._alpha() > 0)
        .map(line => ({
          type: 'ribbon',
          vertices: line._buildVertices(),
          thickness: line.lineThickness,
          color: { r: line.currentColor[0], g: line.currentColor[1], b: line.currentColor[2] },
          opacity: line._alpha(),
          zOffset: line.zOffset
        }))
    };
  }
}
```

**Status**: ✅ Fully preserves current SVG functionality  
**Requirement**: Patches MUST implement `getGeometry()`  
**Priority**: 🚨 HIGHEST — This functionality is NON-NEGOTIABLE  
**Testing**: MUST verify SVG export works after every change  
**Guarantee**: SVG export quality and features CANNOT be reduced

---

#### 4. Depth Map Export (Geometry-Based)

**Method**: Grayscale rendering based on Z-depth

**Process:**
1. Framework calls `patch.getGeometry()`
2. Framework projects geometry to screen space
3. Framework scans for min/max depth values
4. Framework rasterizes polygons as grayscale (near=white, far=black)
5. Download as PNG

**Patch Requirements:**
- ✅ Same `getGeometry()` as SVG export
- ✅ Z-coordinates must be meaningful

**Characteristics:**
- Used for displacement mapping
- Useful for 3D reconstruction
- Matches SVG export perspective exactly

**Status**: ✅ Works automatically if `getGeometry()` implemented

---

#### Export System Summary

| Format | Method | Patch Requirement | Overlay | Resolution | Framebuffer-Aware | Current Status | Priority |
|--------|--------|------------------|---------|------------|-------------------|----------------|----------|
| **PNG** | Canvas capture | None (automatic) | ✅ Yes | Fixed | ✅ Yes | ✅ Works always | Normal |
| **Video** | Canvas recording | None (automatic) | ✅ Yes | Fixed | ✅ Yes | ✅ Works always | Normal |
| **SVG** | Geometry API | `getGeometry()` | ❌ No | Infinite | N/A | ⚠️ Requires implementation | 🚨 **CRITICAL** |
| **Depth** | Geometry API | `getGeometry()` | ❌ No | Fixed | ✅ Yes | ⚠️ Requires implementation | High |

**Key Insight:**
- Canvas-based exports (PNG, Video) work with **ANY** patch automatically
- **Both PNG and Video respect framebuffer mode** for fixed-resolution exports
- Geometry-based exports (SVG, Depth) require patches to implement `getGeometry()`
- Framework handles ALL projection math and file generation
- Patches only provide raw 3D geometry in world space

**🚨 ABSOLUTE GUARANTEE — SVG EXPORT:**
✅ SVG export functionality is **fully preserved** in SpaceFlow architecture  
✅ **ZERO** loss of features, quality, or capability  
✅ Actually becomes MORE powerful (any patch can export SVG)  
✅ Cleaner separation: patches define geometry, framework handles export  
✅ **MUST work in every phase of migration**  
✅ **ANY breaking change is unacceptable and must be reverted immediately**  

**Implementation Commitment:**
- SVG export will be the **first system tested** in every phase
- Migration cannot proceed to next phase if SVG export is broken
- Rollback procedures ready if SVG export fails
- SVG export quality is verified pixel-perfect against current implementation

---

### 🖼️ Overlay System

**Purpose**: Add branding/logos over rendered output

**Properties:**
```javascript
{
  visible: false,
  source: "preset",                 // "preset" or "custom"
  presetFile: "Logo.json",
  customFilename: "",
  customImageSrc: "",               // Base64 data URL
  autoFit: true,
  scale: 100,                       // Size (%)
  opacity: 100,                     // Transparency (%)
  x: 50,                            // Horizontal position (%)
  y: 50                             // Vertical position (%)
}
```

**Why Universal:**
- Overlay applies to final composited output
- Independent of patch rendering
- Same overlay system works with all patches

---

## 5. Patch System

### Patch Interface Contract

Every patch **MUST** implement these methods:

```javascript
export class PatchInterface {
  /**
   * Called once when patch is loaded
   * @param {Object} config - { p5Instance, width, height, params }
   */
  setup(config) {}
  
  /**
   * Called every frame to update state
   * @param {Number} dt - Delta time in seconds
   * @param {Object} params - Current parameter values
   */
  update(dt, params) {}
  
  /**
   * Called every frame to render
   * @param {p5} p - p5.js instance
   * @param {Camera} camera - Current camera state
   * @param {Object} params - Current parameter values
   */
  draw(p, camera, params) {}
  
  /**
   * Returns patch metadata and parameter definitions
   * @returns {Object} Manifest with name, version, parameters
   */
  getManifest() {
    return {
      name: "Patch Name",
      version: "1.0.0",
      description: "What this patch does",
      author: "Your name",
      parameters: [ /* parameter definitions */ ],
      categories: [ /* category definitions */ ]
    }
  }
  
  /**
   * Returns geometry for export (SVG, depth map)
   * @returns {Object} { lines: [...], metadata: {...} }
   */
  getGeometry() {
    return {
      lines: [],
      metadata: {}
    }
  }
  
  /**
   * Called when a parameter changes (optional optimization)
   * @param {String} key - Parameter key
   * @param {*} value - New value
   */
  onParameterChange(key, value) {}
  
  /**
   * Called when canvas is resized
   * @param {Number} width - New width
   * @param {Number} height - New height
   */
  onResize(width, height) {}
  
  /**
   * Called when patch is about to be unloaded
   * Use for cleanup (stop animations, free memory)
   */
  destroy() {}
}
```

### What Patches Get From Framework

1. **Camera State** — Position, rotation, FOV (via `draw()` parameter)
2. **Color API** — Access to current palette colors
3. **Canvas Dimensions** — Width, height, pixel density
4. **Time Delta** — Consistent dt for frame-independent animation
5. **Parameter Values** — Current values from UI/states (may be mid-transition, interpolated by framework)
6. **Export Requests** — Framework calls `getGeometry()` when exporting

### What Patches Provide To Framework

1. **Manifest** — Parameter definitions, categories, metadata
2. **Rendering** — Via `draw(p, camera, params)` method
3. **Animation** — Via `update(dt, params)` method
4. **Geometry** — For export via `getGeometry()`
5. **Lifecycle Hooks** — Setup, resize, destroy

### Forbidden Dependencies

Patches **MUST NOT**:
- ❌ Access global namespace directly (no `ZigMap26` or `SpaceFlow` global)
- ❌ Modify camera parameters (read-only)
- ❌ Manipulate window sync
- ❌ Change color palettes directly
- ❌ Access DOM (framework manages UI)
- ❌ Manage application states (framework handles State Management system)
- ❌ Control state transitions (framework orchestrates)

Patches **CAN**:
- ✅ Create internal classes/utilities
- ✅ Use p5.js drawing functions
- ✅ Access their own parameters (read-only)
- ✅ Manage internal animation state (particle positions, line buffers, physics, etc.)
- ✅ React smoothly to parameter changes
- ✅ Import shared utilities

---

## 6. State Management

**🏛️ STATE MANAGEMENT IS FRAMEWORK-LEVEL**

The **Framework** (not patches) manages the entire State Management system:
- Saving states (capturing all parameters)
- Loading states (restoring parameters)
- States list UI (display, reorder, rename)
- States player (auto-trigger, transitions)
- Orchestrating transitions between states
- Parameter value interpolation during transitions

**Patches only:**
- Receive current parameter values (which may be mid-transition)
- React to parameter changes smoothly
- Manage their internal animation state (particles, buffers, etc.)
- Do NOT control when/how states change

### What is a State?

A **State** is a complete snapshot of SpaceFlow at a moment in time:
- All parameter values (universal + patch-specific)
- Camera position and settings
- Active color palette
- Patch identification
- Metadata (name, description, timestamp)

### Why States Matter

States enable:
- 🎬 **Live Performance**: Switch between looks instantly
- 🎨 **Creative Exploration**: Save experiments, compare variations
- 🔄 **Auto-Transitions**: Cycle through states with smooth animations
- 📦 **Presets**: Share configurations with others
- ⏱️ **Timeline**: Navigate history (undo/redo)
- 🎯 **Reproducibility**: Exact recreation of a moment

### State JSON Structure

```json
{
  "id": "state-001",
  "name": "Smooth Ambient",
  "description": "Gentle flowing ribbons with soft colors",
  "timestamp": "2026-05-24T10:30:00Z",
  "version": "1.0.0",
  
  "patch": {
    "name": "zigzag",
    "version": "1.0.0"
  },
  
  "universal": {
    "camera": {
      "fov": 60,
      "distance": 600,
      "rotationX": 0.5,
      "rotationY": 0.3,
      "offsetX": 0,
      "offsetY": 0
    },
    "colors": {
      "activePaletteIndex": 0,
      "transitionDuration": 3.0,
      "palettes": [ /* 4 palettes */ ]
    },
    "animation": {
      "ambientSpeedMaster": 100,
      "stateTransitionDuration": 3.0
    },
    "export": { /* export settings */ },
    "overlay": { /* overlay settings */ }
  },
  
  "patch": {
    "geometry": {
      "segmentLength": 50,
      "lineThickness": 20,
      "geometryScale": 100
    },
    "behavior": {
      "emitRate": 2.0,
      "speed": 100
    },
    "modulation": {
      "randomThickness": false,
      "randomSpeed": false
    }
  }
}
```

### State Transitions

**Framework Responsibility:**
The framework orchestrates all state transitions:
1. User triggers state change (click, auto-trigger, keyboard)
2. Framework loads target state parameters
3. Framework interpolates values over transition duration
4. Framework passes interpolated values to patch via `update(dt, params)`
5. Patch renders based on current parameter values

**Patch Responsibility:**
Patches simply respond to the parameter values they receive:
- Parameters might be mid-transition (interpolated values)
- Patch doesn't know or care if a state transition is happening
- Patch just renders using current values

Different property types transition differently:

#### ✅ Smooth Transitions (Interpolated)
- Camera: Position, rotation, FOV smoothly interpolate
- Geometry: Size, scale smoothly interpolate
- Behavior: Speed, rate smoothly interpolate
- Modulation: Range values smoothly interpolate

**Formula:** `newValue = lerp(oldValue, targetValue, easing(progress))`

**Easing Options:**
- `linear` — Constant speed
- `ease-in-out` — Slow start and end (default)
- `ease-in` — Slow start, fast end
- `ease-out` — Fast start, slow end

#### ⚡ Instant Transitions (No Interpolation)
- Export: Framebuffer mode
- Overlay: Image source
- Behavior: Direction (discrete choices)
- Modulation: Boolean flags

#### 🎨 Special: Color Transitions
Colors use their own duration (`colorTransitionDuration`):

```javascript
colorProgress = elapsed / colorTransitionDuration;
newColor = lerpColor(oldColor, targetColor, colorProgress);
```

**📋 Summary: Who Does What in State Transitions**

| Responsibility | Framework | Patch |
|----------------|-----------|-------|
| Save state | ✅ Yes (captures all params) | ❌ No |
| Load state | ✅ Yes (restores params) | ❌ No |
| Trigger transition | ✅ Yes (user/auto-trigger) | ❌ No |
| Interpolate values | ✅ Yes (lerp between states) | ❌ No |
| States UI/player | ✅ Yes (list, rename, reorder) | ❌ No |
| Receive parameters | ❌ No | ✅ Yes (via `update(dt, params)`) |
| Render visuals | ❌ No | ✅ Yes (using current params) |
| Manage internal state | ❌ No | ✅ Yes (particles, buffers, physics) |

**Key Point:** Patches are **stateless** from the application's perspective. They receive parameters and render. They don't know or care about the State Management system.

### Cross-Patch States

**Question:** What happens when loading a **Zigzag state** while **Particle patch** is active?

**Answer:** Graceful degradation

```javascript
function loadState(state, currentPatch) {
  // Always load universal properties
  applyUniversalProperties(state.universal);
  
  if (state.patch.name === currentPatch.name) {
    // Same patch: Load everything
    applyPatchProperties(state.patch);
  } else {
    // Different patch: Load only universal
    console.warn(`State was created with ${state.patch.name}, patch properties ignored.`);
  }
}
```

**Result:**
- ✅ Camera position transfers
- ✅ Color palette transfers
- ✅ Export settings transfer
- ❌ Patch-specific params ignored
- 💬 User gets warning about compatibility

---

# Part III: Dynamic Parameters

## 7. Parameter Manifest

### The Problem

**Current (ZigMap26):**
- Add parameter to `defaults.js`
- Create HTML control in `index.html`
- Wire event handler in `UIController.js`
- Update storage logic
- Test everything

**Result:** Adding 1 parameter = touching 4+ files

### The Solution

**Future (SpaceFlow):**
- Add parameter to `manifest.json`
- Everything else automatic

**Result:** Adding 1 parameter = 1 JSON entry

### Complete Manifest Structure

```json
{
  "name": "Zigzag Emitter",
  "version": "1.0.0",
  "description": "Animated zigzag ribbons in 3D space",
  "author": "ddelcourt",
  "category": "generative",
  "tags": ["3d", "ribbons", "animated"],
  
  "parameters": [
    {
      "key": "segmentLength",
      "label": "Segment Length",
      "description": "Height of each zigzag segment",
      "type": "slider",
      "scope": "patch",
      "category": "geometry",
      "subcategory": "shape",
      "min": 5,
      "max": 200,
      "default": 50,
      "step": 1,
      "unit": "px",
      "transition": {
        "interpolate": true,
        "easing": "ease-in-out",
        "triggerRegeneration": true
      },
      "validationRules": {
        "min": 5,
        "max": 200
      }
    },
    {
      "key": "randomThickness",
      "label": "Random Thickness",
      "description": "Enable thickness variation per line",
      "type": "checkbox",
      "scope": "patch",
      "category": "modulation",
      "default": false,
      "enablesParameters": ["thicknessRangeMin", "thicknessRangeMax"]
    },
    {
      "key": "thicknessRangeMin",
      "label": "Min Thickness",
      "type": "slider",
      "scope": "patch",
      "category": "modulation",
      "min": 10,
      "max": 100,
      "default": 50,
      "step": 1,
      "unit": "%",
      "dependsOn": "randomThickness",
      "visibleWhen": { "randomThickness": true }
    }
  ],
  
  "categories": [
    {
      "id": "geometry",
      "label": "Geometry",
      "icon": "📐",
      "scope": "patch",
      "order": 1,
      "collapsible": true,
      "defaultCollapsed": false,
      "transitionable": true,
      "subcategories": [
        { "id": "shape", "label": "Shape", "order": 1 },
        { "id": "transform", "label": "Transform", "order": 2 }
      ]
    },
    {
      "id": "behavior",
      "label": "Behavior",
      "icon": "🎬",
      "scope": "patch",
      "order": 2,
      "transitionable": true
    }
  ]
}
```

### Required Fields

Every parameter MUST have:
- `key` — Unique identifier
- `label` — Human-readable name
- `type` — Control type
- `default` — Default value
- `category` — UI grouping
- `scope` — "universal" or "patch"

### Optional Fields

- `description` — Tooltip text
- `unit` — Display unit (px, %, degrees)
- `min`, `max`, `step` — For numeric types
- `options` — For dropdown/radio
- `validationRules` — Custom validation
- `dependsOn` — Parent parameter
- `visibleWhen` — Conditional visibility
- `enablesParameters` — Child parameters
- `transition` — How to animate changes

---

## 8. Parameter Types

### 1. Slider (Numeric Range)

**Use case:** Numeric value with min/max bounds

```json
{
  "key": "speed",
  "label": "Speed",
  "type": "slider",
  "min": 10,
  "max": 500,
  "default": 100,
  "step": 1,
  "unit": "px/s"
}
```

**Generates:**
```html
<div class="param-control">
  <label>
    Speed
    <span class="param-value">100 px/s</span>
  </label>
  <input type="range" min="10" max="500" value="100" step="1">
</div>
```

---

### 2. Checkbox (Boolean Toggle)

**Use case:** On/off switches

```json
{
  "key": "randomSpeed",
  "label": "Random Speed",
  "type": "checkbox",
  "default": false,
  "enablesParameters": ["speedRangeMin", "speedRangeMax"]
}
```

**Generates:**
```html
<div class="param-control">
  <label>
    <input type="checkbox">
    Random Speed
  </label>
</div>
```

---

### 3. Dropdown (Select One)

**Use case:** Choosing from predefined options

```json
{
  "key": "blendMode",
  "label": "Blend Mode",
  "type": "dropdown",
  "default": "normal",
  "options": [
    { "value": "normal", "label": "Normal" },
    { "value": "add", "label": "Additive" },
    { "value": "multiply", "label": "Multiply" }
  ]
}
```

---

### 4. Number Input (Precise Values)

**Use case:** Large ranges, precise decimals

```json
{
  "key": "particleCount",
  "label": "Particle Count",
  "type": "number",
  "min": 1,
  "max": 100000,
  "default": 1000,
  "step": 100
}
```

---

### 5. Radio Buttons (Select One, Visible)

**Use case:** Small set of mutually exclusive options

```json
{
  "key": "direction",
  "label": "Direction",
  "type": "radio",
  "default": "up",
  "options": [
    { "value": "up", "label": "↑ Up" },
    { "value": "down", "label": "↓ Down" }
  ]
}
```

---

### 6. Range (Min/Max Pair)

**Use case:** Define a range with both endpoints

```json
{
  "key": "sizeRange",
  "label": "Size Range",
  "type": "range",
  "min": 1,
  "max": 100,
  "default": { "min": 20, "max": 80 },
  "step": 1,
  "unit": "px"
}
```

---

### 7. Color Picker

**Use case:** Custom colors (beyond palette system)

```json
{
  "key": "accentColor",
  "label": "Accent Color",
  "type": "color",
  "default": "#ff0000"
}
```

---

### 8. Text Input

**Use case:** Labels, expressions, custom formulas

```json
{
  "key": "equationX",
  "label": "X Equation",
  "type": "text",
  "default": "cos(t) * 100",
  "placeholder": "Enter math expression"
}
```

---

### 9. Button (Trigger Action)

**Use case:** Execute patch-specific actions

```json
{
  "key": "regenerate",
  "label": "Regenerate All",
  "type": "button",
  "action": "regenerateGeometry",
  "icon": "🔄"
}
```

---

### 10. Separator (Visual Grouping)

**Use case:** Add visual breaks

```json
{
  "type": "separator",
  "label": "Advanced Settings"
}
```

---

## 9. Dynamic UI Generation

### The Pipeline

```
1. Patch loaded
      ↓
2. Framework reads manifest.json
      ↓
3. ParameterManager validates & stores defaults
      ↓
4. DynamicUI generates HTML controls
      ↓
5. User interacts with control
      ↓
6. Event listener captures change
      ↓
7. ParameterManager validates new value
      ↓
8. SpaceFlow.params updated
      ↓
9. Patch.onParameterChange() called
      ↓
10. UI synced (value displays updated)
      ↓
11. StateManager auto-saves (if enabled)
      ↓
12. WindowSync broadcasts to displays
      ↓
13. Export includes parameter in JSON
```

### DynamicUI Class (Simplified)

```javascript
export class DynamicUI {
  constructor(containerElement) {
    this.container = containerElement;
    this.controls = new Map();
  }
  
  /**
   * Generate UI from patch manifest
   */
  generate(manifest, currentValues) {
    this.clear();
    
    // Group parameters by category
    const paramsByCategory = this._groupByCategory(manifest.parameters);
    
    // Create category sections
    for (const category of manifest.categories) {
      const params = paramsByCategory.get(category.id) || [];
      const section = this._createCategorySection(category);
      
      for (const param of params) {
        const control = this._createControl(param, currentValues);
        section.appendChild(control);
        this.controls.set(param.key, control);
      }
      
      this.container.appendChild(section);
    }
    
    this._setupEventListeners();
  }
  
  /**
   * Create control based on parameter type
   */
  _createControl(param, currentValues) {
    const value = currentValues[param.key] ?? param.default;
    
    switch (param.type) {
      case 'slider':
        return this._createSlider(param, value);
      case 'checkbox':
        return this._createCheckbox(param, value);
      case 'dropdown':
        return this._createDropdown(param, value);
      // ... other types
    }
  }
}
```

### Key Features

1. **Automatic Generation**: UI creates itself from manifest
2. **Validation**: Built-in range checking, type validation
3. **Dependencies**: Show/hide parameters based on conditions
4. **Search**: Find parameters quickly (for complex patches)
5. **Persistence**: Auto-save on changes
6. **Sync**: Multi-window coordination

---

# Part IV: User Interface

## 10. UI Layout Strategy

### The Challenge

SpaceFlow must work with:
- **Simple patches**: 3 parameters (Solid Color)
- **Moderate patches**: 25 parameters (Zigzag)
- **Complex patches**: 50+ parameters (Advanced Particle System)

**One size does NOT fit all.**

### Solution: Adaptive Layout

UI automatically adapts based on parameter count:

```javascript
function determineLayoutMode(parameterCount) {
  if (parameterCount < 15) return 'simple';
  if (parameterCount < 40) return 'moderate';
  return 'complex';
}
```

---

### 🟢 Simple Mode (< 15 parameters)

**Layout:** Single column, all expanded

```
┌─────────────────────────┐
│ SPACEFLOW            [×]│
├─────────────────────────┤
│                         │
│ CAMERA 🎥               │
│ FOV          [60    ]   │
│ Distance     [600   ]   │
│                         │
│ COLORS 🎨               │
│ Palette 1  [■][■][■][■]│
│                         │
│ ─────────────────────── │
│                         │
│ PATCH: Simple Effect    │
│ Size         [50    ]   │
│ Opacity      [100%  ]   │
│                         │
└─────────────────────────┘
```

**Characteristics:**
- No collapsing needed
- All controls visible
- Minimal scrolling
- Clean and simple

---

### 🟡 Moderate Mode (15-40 parameters)

**Layout:** Split panel (Universal | Patch)

```
┌──────────────────────────────────────────────────────┐
│ SPACEFLOW                                         [×]│
├────────────────────┬─────────────────────────────────┤
│ UNIVERSAL          │ PATCH: Zigzag Emitter           │
│                    │                                 │
│ ▼ CAMERA 🎥        │ ▼ GEOMETRY 📐                   │
│   FOV     [60  ]   │   Segment Length  [50       ]   │
│   Dist    [600 ]   │   Thickness       [20       ]   │
│                    │                                 │
│ ▼ COLORS 🎨        │ ▼ BEHAVIOR 🎬                   │
│   Pal [1▼]        │   Emit Rate       [2.0      ]   │
│                    │   Speed           [100      ]   │
│                    │                                 │
│ ▶ EXPORT 📤        │ ▶ MODULATION 📊 — 6 params      │
│                    │                                 │
└────────────────────┴─────────────────────────────────┘
```

**Characteristics:**
- Clear separation: universal | patch
- Both visible simultaneously
- Collapsible non-essential sections
- Most-used controls always visible

---

### 🔴 Complex Mode (40+ parameters)

**Layout:** Tabbed with search + filter

```
┌───────────────────────────────────────────────────────┐
│ SPACEFLOW                                          [×]│
├───────────────────────────────────────────────────────┤
│ [🌍 Universal] [🔧 Patch] [💾 States] [📤 Export]     │
├───────────────────────────────────────────────────────┤
│ 🔍 Search parameters...                        [Clear]│
│ Filter: [All ▼] [Essential] [Advanced]               │
├───────────────────────────────────────────────────────┤
│                                                       │
│ ▼ PARTICLES ✨ — Essential                            │
│   Count              [1000      ] ⭐                   │
│   Size               [5         ] ⭐                   │
│                                                       │
│ ▼ PHYSICS ⚛️ — Essential                              │
│   Gravity            [10        ] ⭐                   │
│   Friction           [0.95      ]                     │
│                                                       │
│ ▶ FORCES 💨 — 8 parameters                            │
│ ▶ RENDERING 🎨 — Advanced — 12 parameters             │
│ ▶ NOISE 🌊 — Advanced — 8 parameters                  │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**Characteristics:**
- Tabbed interface reduces clutter
- Search for quick parameter location
- Essential vs Advanced filtering
- Favorite/starred parameters (⭐)
- Parameter count shown when collapsed

---

## 11. Visual Hierarchy

### Scope Indicators

```
🌍 Universal — Blue accent
   Controls that work across all patches

🔧 Patch — Orange accent
   Controls specific to current patch
```

### Category Icons

```
Universal:
🎥 Camera
🎨 Colors
⚡ Animation
📤 Export
🖼️ Overlay

Patch (examples):
📐 Geometry
🎬 Behavior
📊 Modulation
✨ Particles
⚛️ Physics
💨 Forces
🎛️ [Custom]
```

### Parameter Importance

```
⭐ Essential — Starred, always visible
📌 Pinned — User-pinned to top
🔒 Locked — Read-only
⚠️ Invalid — Out-of-range
🔗 Linked — Controlled by expression
```

### Indentation for Dependencies

```
Random Thickness       [✓]
└─ Thickness Min       [50%  ]  ← Indented, shows dependency
└─ Thickness Max       [150% ]  ← Indented, shows dependency
```

---

## 12. Advanced UI Features

### 1. Search & Filter

For patches with 30+ parameters:

```
User types "speed" in search:
  → Finds: Global Speed, Speed, Speed Min, Speed Max
  → Highlights matches
  → Collapses non-matching categories
```

### 2. Favorites System

```
Click ☆ → ⭐ to favorite

Favorites always appear at top:
┌─────────────────────────────┐
│ FAVORITES ⭐                 │
│ • Speed                     │
│ • Emit Rate                 │
│ • Camera Distance           │
└─────────────────────────────┘
```

### 3. Parameter Presets

Quick preset buttons at category level:

```
▼ BEHAVIOR 🎬
   Presets: [Slow] [Medium] [Fast]
   
   Emit Rate       [2.0    ]
   Speed           [100    ]
```

Clicking [Fast] sets multiple parameters at once.

### 4. Compare Mode

Compare two states side-by-side:

```
┌──────────────────┬──────────────────┐
│ State A          │ State B          │
├──────────────────┼──────────────────┤
│ Speed: 100       │ Speed: 200       │ ← Different
│ Emit: 2.0        │ Emit: 2.0        │
│ Thickness: 20    │ Thickness: 35    │ ← Different
└──────────────────┴──────────────────┘
```

### 5. Keyboard Navigation

```
Tab       — Next parameter
Shift+Tab — Previous parameter
↑/↓       — Increment/decrement value
Enter     — Edit text field
Esc       — Cancel edit
Space     — Toggle checkbox
/         — Focus search
?         — Show shortcuts
```

### 6. Parameter History

```
[Undo ↶] [Redo ↷]

Recent changes:
• Speed: 100 → 150 (2 sec ago)
• Emit Rate: 2.0 → 4.0 (10 sec ago)
```

---

# Part V: Implementation

## 13. Implementation Roadmap

### Phase 0: Preparation (Weeks 1-2)
**Goal:** Set up foundation without breaking anything

✅ **Actions:**
1. Create patch directory structure (`js/patches/`)
2. Write `PatchInterface.js` base class
3. Document current dependencies
4. Create abstraction layer (`SpaceFlow.patchAPI`)

**Deliverables:**
- Directory structure in place
- Interface specification document
- Dependency audit complete
- No breaking changes to existing code

---

### Phase 1: Extract Zigzag Patch (Weeks 3-4)
**Goal:** Move zigzag code to patch directory (still works the same)

✅ **Actions:**
1. Copy `Emitter.js` → `js/patches/zigzag/Emitter.js`
2. Copy `ZigzagLine.js` → `js/patches/zigzag/ZigzagLine.js`
3. Create `ZigzagEmitterPatch.js` wrapper
4. Create `manifest.json` with parameter definitions
5. Update imports in `main.js`

**Deliverables:**
- Zigzag patch in new location
- Manifest.json created
- All functionality working
- Tests pass

---

### Phase 2: Implement Patch Interface (Weeks 5-6)
**Goal:** Zigzag patch implements standard interface

✅ **Actions:**
1. Refactor `Emitter`/`ZigzagLine` to remove global dependencies
2. Create `ZigzagEmitterPatch` class implementing interface
3. Update `SketchFactory` to use patch instance
4. Pass dependencies via constructor

**Deliverables:**
- Zigzag patch fully implements interface
- No direct global access
- Dependency injection working
- Clean separation achieved

---

### Phase 3: Dynamic UI Generation (Weeks 7-8)
**Goal:** UI builds itself from patch manifest

✅ **Actions:**
1. Create `DynamicUI` class
2. Read manifest, generate HTML controls
3. Wire up event listeners
4. Separate universal UI from patch UI
5. Refactor `UIController`

**Deliverables:**
- DynamicUI class working
- Manifest-driven UI generation
- All controls functional
- State save/load works

---

### Phase 4: Patch Loading System (Weeks 9-10)
**Goal:** Load patches dynamically at runtime

✅ **Actions:**
1. Create `PatchLoader` class
2. Implement patch registry
3. Add patch switching UI
4. Handle smooth transitions between patches
5. Test with multiple patches

**Deliverables:**
- PatchLoader working
- Can switch patches dynamically
- State preservation across switches
- Error handling robust

---

### Phase 5: Polish & Test (Weeks 11-12)
**Goal:** Production-ready

✅ **Actions:**
1. Full regression testing
2. Performance benchmarking
3. Update all documentation
4. Create patch developer guide
5. Example patches

**Deliverables:**
- All tests passing
- Performance acceptable
- Documentation complete
- Developer guide ready

---

### Phase 6: Rename to SpaceFlow (Week 13)
**Goal:** Complete transformation

✅ **Actions:**
1. Global search/replace `ZigMap26` → `SpaceFlow`
2. Update `manifest.json`, `appInfo.json`
3. Update all documentation
4. Update branding (optional)

**Deliverables:**
- Rename complete
- All references updated
- Documentation current
- Ready for release

---

## 14. File Structure

### Current (ZigMap26)

```
js/
  ├── main.js
  ├── core/
  │   ├── Emitter.js             ← Patch-specific
  │   ├── ZigzagLine.js          ← Patch-specific
  │   ├── Camera.js              ← Universal
  │   ├── colorUtils.js          ← Universal
  │   └── Projection.js          ← Universal
  ├── config/
  │   ├── defaults.js            ← Mixed
  │   └── constants.js           ← Mixed
  └── [other systems]
```

### Future (SpaceFlow)

```
js/
  ├── main.js                     # Framework entry point
  │
  ├── framework/                  # NEW: Framework code
  │   ├── SpaceFlow.js            # Main framework class
  │   ├── ParameterManager.js     # Parameter system
  │   ├── DynamicUI.js            # UI generation
  │   └── PatchLoader.js          # Patch loading
  │
  ├── core/                       # Universal systems ONLY
  │   ├── Camera.js
  │   ├── colorUtils.js
  │   ├── Projection.js
  │   └── utils.js
  │
  ├── patches/                    # NEW: Patch system
  │   ├── PatchInterface.js       # Base interface
  │   ├── PatchLoader.js          # Loading system
  │   │
  │   └── zigzag/                 # Zigzag patch
  │       ├── ZigzagEmitterPatch.js
  │       ├── Emitter.js
  │       ├── ZigzagLine.js
  │       ├── manifest.json       # Parameter definitions
  │       └── README.md
  │
  ├── config/                     # Framework config
  │   ├── frameworkDefaults.js    # Universal params only
  │   └── constants.js            # Universal constants
  │
  ├── export/                     # Universal
  ├── input/                      # Universal
  ├── storage/                    # Universal
  ├── sync/                       # Universal
  │
  └── ui/                         # Framework UI
      └── UIController.js         # Manages universal + dynamic UI
```

---

## 15. Migration Strategy

### Backward Compatibility

**Dual API Support During Transition:**

```javascript
// OLD WAY (still works in Phases 0-2)
const thickness = ZigMap26.params.lineThickness;

// NEW WAY (works immediately)
const thickness = SpaceFlow.patchAPI.getParam('lineThickness');

// FUTURE (Phase 4+)
const thickness = params.lineThickness; // Passed to patch methods
```

### Export Functionality Preservation

**🚨 CRITICAL REQUIREMENT — HIGHEST PRIORITY:**

All export formats must continue working throughout migration, with **SVG export being absolutely non-negotiable and must NEVER be broken under any circumstances.**

**SVG Export Priority:**
- SVG export is **more important** than any architectural improvement
- If a change breaks SVG export, the change is **unacceptable**
- Migration phases cannot proceed without working SVG export
- This is **not negotiable** under any circumstances

**PNG & Video (Canvas-Based):**
- ✅ **No changes required** — work automatically with any patch
- ✅ Continue capturing canvas pixels as today
- ✅ **Framebuffer-aware** — respect fixed resolution settings when enabled
- ✅ Zero risk during migration

**SVG & Depth Map (Geometry-Based):**
- ⚠️ **Requires patch cooperation** — must implement `getGeometry()`
- ✅ **Framework handles all complexity** (projection, SVG generation)
- ✅ **Same quality and features** as current implementation

**Migration Steps for SVG Export:**

**Phase 1: Extract SVG Logic to Universal System**
```javascript
// Move from main.js to export/SVGExporter.js
class SVGExporter {
  export(geometry, camera, params) {
    // All projection math stays here
    // All SVG generation stays here
    // Framework-level, patch-agnostic
  }
}
```

**Phase 2: Create getGeometry() Interface**
```javascript
// Add to ZigzagLine and Emitter classes
class Emitter {
  getGeometry() {
    return {
      type: 'ribbons',
      items: this.lines
        .filter(line => line._alpha() > 0)
        .map(line => ({
          type: 'ribbon',
          vertices: line._buildVertices(),
          thickness: line.lineThickness,
          color: { 
            r: line.currentColor[0], 
            g: line.currentColor[1], 
            b: line.currentColor[2] 
          },
          opacity: line._alpha(),
          zOffset: line.zOffset
        }))
    };
  }
}
```

**Phase 3: Refactor Export Call**
```javascript
// OLD (current)
function exportSVG(ZM) {
  ZM.emitterInstance.lines.forEach(line => {
    // Direct access to internal state
  });
}

// NEW (SpaceFlow)
function exportSVG(framework) {
  const geometry = framework.patch.getGeometry();
  // Process standardized geometry
}
```

**🚨 MANDATORY SVG EXPORT TESTING CHECKLIST (CANNOT SKIP):**
- [ ] Export SVG from zigzag patch — **MUST WORK**
- [ ] Verify pixel-perfect match with current exports — **MANDATORY**
- [ ] Test with different camera angles — **REQUIRED**
- [ ] Test with multiple color palettes — **REQUIRED**
- [ ] Test with framebuffer mode enabled — **REQUIRED**
- [ ] Verify file size is comparable — **REQUIRED**
- [ ] Test in vector editor (Illustrator/Inkscape) — **MUST OPEN AND EDIT CORRECTLY**
- [ ] Compare quality side-by-side with current version — **MUST BE IDENTICAL**
- [ ] Verify all colors, opacity, and layering are correct — **ZERO DEFECTS ALLOWED**

**Failure Criteria:**
- If ANY checkbox fails, the migration phase FAILS
- The change must be reverted or fixed before proceeding
- SVG export is GO/NO-GO for every phase

### State File Migration

**Automatic Conversion:**

```javascript
function migrateState(oldState) {
  // Detect old format
  if (oldState.params && !oldState.universal) {
    // Convert to new structured format
    const newState = {
      ...oldState,
      universal: categorizeUniversal(oldState.params),
      patch: categorizePatch(oldState.params)
    };
    
    // Keep old params for backward compat (temporary)
    newState.params = oldState.params;
    
    return newState;
  }
  
  // Already new format
  return oldState;
}
```

### Rollback Plan

If issues arise:
1. Keep old code in `_legacy/` folder
2. Feature flags for new vs old systems
3. Can revert per-system (UI, storage, etc.)
4. Comprehensive test suite catches regressions
5. **🚨 SVG EXPORT MUST NEVER BREAK — ABSOLUTE HIGHEST PRIORITY 🚨**

**SVG Export Protection:**
- Immediate rollback if SVG export breaks
- SVG export system has dedicated backup
- Can run old SVG export alongside new code if needed
- Zero tolerance for SVG export failures
- **Broken SVG export = CRITICAL BUG = Immediate fix required**

---

## 16. Code Examples

### Example: Simple Particle Patch

**Directory Structure:**
```
patches/particles/
  ├── ParticleSystemPatch.js
  ├── Particle.js
  ├── manifest.json
  └── README.md
```

**manifest.json:**
```json
{
  "name": "Particle System",
  "version": "1.0.0",
  "description": "Simple particle system with physics",
  "author": "SpaceFlow Team",
  
  "parameters": [
    {
      "key": "particleCount",
      "label": "Particle Count",
      "type": "slider",
      "scope": "patch",
      "category": "particles",
      "min": 10,
      "max": 1000,
      "default": 100,
      "step": 10
    },
    {
      "key": "particleSize",
      "label": "Particle Size",
      "type": "slider",
      "scope": "patch",
      "category": "particles",
      "min": 1,
      "max": 20,
      "default": 5,
      "step": 0.5,
      "unit": "px"
    },
    {
      "key": "gravity",
      "label": "Gravity",
      "type": "slider",
      "scope": "patch",
      "category": "physics",
      "min": -100,
      "max": 100,
      "default": 10,
      "step": 1,
      "unit": "px/s²"
    }
  ],
  
  "categories": [
    {
      "id": "particles",
      "label": "Particles",
      "icon": "✨",
      "scope": "patch",
      "order": 1
    },
    {
      "id": "physics",
      "label": "Physics",
      "icon": "⚛️",
      "scope": "patch",
      "order": 2
    }
  ]
}
```

**ParticleSystemPatch.js:**
```javascript
import { PatchInterface } from '../PatchInterface.js';
import { Particle } from './Particle.js';

export class ParticleSystemPatch extends PatchInterface {
  constructor() {
    super();
    this.particles = [];
  }
  
  setup({ p5Instance, width, height, params }) {
    this.p = p5Instance;
    this.width = width;
    this.height = height;
    
    // Create initial particles
    for (let i = 0; i < params.particleCount; i++) {
      this.particles.push(new Particle(
        this.p.random(width),
        this.p.random(height),
        params.particleSize
      ));
    }
  }
  
  update(dt, params) {
    // Apply gravity
    const gravityForce = params.gravity * dt;
    
    // Update each particle
    for (const particle of this.particles) {
      particle.applyForce(0, gravityForce);
      particle.update(dt);
      particle.wrap(this.width, this.height);
    }
    
    // Adjust particle count if changed
    while (this.particles.length < params.particleCount) {
      this.particles.push(new Particle(
        this.p.random(this.width),
        this.p.random(this.height),
        params.particleSize
      ));
    }
    while (this.particles.length > params.particleCount) {
      this.particles.pop();
    }
  }
  
  draw(p, camera, params) {
    // Get color from framework
    const color = SpaceFlow.colorSystem.getColor(0);
    
    p.fill(color.r, color.g, color.b);
    p.noStroke();
    
    for (const particle of this.particles) {
      particle.draw(p, params.particleSize);
    }
  }
  
  getManifest() {
    // Return the manifest (could also load from manifest.json)
    return require('./manifest.json');
  }
  
  getGeometry() {
    return {
      particles: this.particles.map(p => ({
        x: p.x,
        y: p.y,
        size: p.size
      })),
      metadata: {
        count: this.particles.length
      }
    };
  }
  
  onParameterChange(key, value) {
    // Optional: React to specific parameter changes
    if (key === 'particleCount') {
      console.log('Particle count changed to:', value);
    }
  }
  
  destroy() {
    // Cleanup
    this.particles = [];
  }
}
```

**Usage:**
```javascript
// Framework loads patch
const patch = await PatchLoader.load('particles');

// Framework reads manifest
const manifest = patch.getManifest();

// Framework generates UI automatically
dynamicUI.generate(manifest, SpaceFlow.params);

// User adjusts "Particle Count" slider
// → Event captured
// → Parameter validated
// → patch.onParameterChange('particleCount', 500) called
// → UI updated
// → State auto-saved
```

---

## Conclusion

This architecture transforms SpaceFlow from a monolithic application into a **modular, extensible framework** while maintaining backward compatibility and providing a clear migration path.

### Key Achievements

✅ **Separation of Concerns**: Framework vs patches clearly defined  
✅ **Single Source of Truth**: Manifest defines everything  
✅ **Automatic UI**: No manual coding required  
✅ **Scalable**: Works from 3 to 100+ parameters  
✅ **States**: Complete snapshots work across patches  
✅ **Future-Ready**: Architecture supports layers/VJ mode  
✅ **Export Preservation**: All export formats (PNG, Video, SVG, Depth) fully preserved

### Export System Guarantee

**🚨 CRITICAL SUCCESS FACTOR:**

Export functionality is **non-negotiable** and must work flawlessly.

**SVG EXPORT IS THE MOST CRITICAL EXPORT FORMAT AND MUST ALWAYS WORK.**

| Export Type | Status | Guarantee | Priority |
|-------------|--------|-----------|----------|
| **PNG** | ✅ Automatic | Works with ANY patch immediately | Normal |
| **Video** | ✅ Automatic | Works with ANY patch immediately | Normal |
| **SVG** | ✅ Preserved | Requires `getGeometry()` implementation | 🚨 **CRITICAL** |
| **Depth Map** | ✅ Preserved | Requires `getGeometry()` implementation | High |

**🚨 SVG EXPORT SPECIFICALLY (ABSOLUTE REQUIREMENTS):**
- ✅ Same projection math (pixel-perfect) — **MANDATORY**
- ✅ Same quality and features — **NO DEGRADATION ALLOWED**
- ✅ Resolution-independent vectors — **MUST PRESERVE**
- ✅ Editable in vector software — **REQUIRED FOR PROFESSIONAL USE**
- ✅ Clean separation: patches provide geometry, framework handles export
- ✅ More powerful: ANY patch can export SVG
- ✅ **ZERO tolerance for broken SVG export**
- ✅ **Testing required after EVERY code change**
- ✅ **This is NON-NEGOTIABLE**

### Next Steps

1. **Review & Refine**: Discuss any concerns or modifications
2. **Begin Phase 0**: Set up directory structure, interfaces
3. **🚨 CRITICAL: Migrate Export System First**: Ensure SVG works BEFORE anything else
4. **Verify SVG Export**: Test extensively, compare with current version
5. **Prototype**: Build a simple test patch to validate architecture
6. **Test SVG Again**: Every phase must verify SVG export still works
7. **Iterate**: Adjust based on real-world usage (but NEVER break SVG export)

---

**The future of SpaceFlow is modular, extensible, and beautiful.** ✨

---

*Document Status: Complete & Ready for Implementation*  
*Last Updated: May 25, 2026*  
*Export Pipeline: Fully Documented & Preserved*
