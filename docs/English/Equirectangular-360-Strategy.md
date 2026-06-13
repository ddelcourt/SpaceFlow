# SpaceFlow — 360° Equirectangular Projection Strategy

**Author:** Senior Technical Architecture Team  
**Date:** June 2026  
**Status:** Technical Proposal  
**Version:** 1.0

---

## Executive Summary

This document outlines the technical strategy for adding 360° equirectangular projection rendering to SpaceFlow. This feature will enable immersive panoramic output suitable for VR headsets, 360° video platforms (YouTube, Facebook), fulldome planetarium systems, and interactive panoramic displays.

**Key Goals:**
- Render the 3D zigzag scene as a 360° equirectangular image at **60fps**
- Preserve existing perspective rendering modes (with SVG export)
- Enable high-resolution export workflows (PNG, video)
- Maintain smooth, real-time interactivity

**CRITICAL DESIGN DECISION (Updated 2026-06-13):**
- **SVG export is NOT required for equirectangular mode**
- SVG export remains available in perspective mode only
- This removes the primary constraint blocking optimal GPU implementation

**Recommended Approach:** Custom GLSL fragment shader for direct GPU-based equirectangular projection (Approach 3 - Revised), delivering true 60fps real-time performance.

---

## Table of Contents

1. [Technical Background](#1-technical-background)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Implementation Approaches](#3-implementation-approaches)
4. [Recommended Solution](#4-recommended-solution)
5. [Technical Specifications](#5-technical-specifications)
6. [SVG Export Strategy](#6-svg-export-strategy)
7. [Performance Considerations](#7-performance-considerations)
8. [Integration Plan](#8-integration-plan)
9. [Testing & Validation](#9-testing--validation)
10. [Timeline & Resources](#10-timeline--resources)

---

## 1. Technical Background

### 1.1 What is Equirectangular Projection?

Equirectangular projection (also called geographic projection) maps a sphere to a 2D rectangle where:
- **Horizontal axis (0° to 360°):** Azimuth angle (left/right rotation)
- **Vertical axis (-90° to +90°):** Elevation angle (up/down)
- **Mapping:** `(θ, φ) → (x, y)` where `x = θ` and `y = φ`

```
    0°                  180°                 360°
   ┌─────────────────────────────────────────┐  +90° (top)
   │                                         │
   │           Sphere unwrapped              │
   │                                         │
   │                                         │  0° (horizon)
   │                                         │
   │                                         │
   └─────────────────────────────────────────┘  -90° (bottom)
```

### 1.2 Use Cases

**VR/AR Applications:**
- Oculus Quest, Meta Quest, HTC Vive
- WebXR experiences
- 360° video for immersive storytelling

**Planetarium/Fulldome:**
- Projection mapping for dome theaters
- Educational astronomy content
- Live performances with 360° visuals

**Social Media & Video Platforms:**
- YouTube 360° videos
- Facebook 360° posts
- Interactive web panoramas

**Art Installations:**
- Cylindrical LED displays (e.g., Syllepse 360)
- Multi-projector environments
- Interactive museum exhibits

### 1.3 Mathematical Foundation

For a point in 3D space `(x, y, z)`, the equirectangular coordinates are:

```javascript
// Convert 3D Cartesian to spherical coordinates
const r = Math.sqrt(x*x + y*y + z*z);
const theta = Math.atan2(x, z);        // Azimuth: -π to +π
const phi = Math.asin(y / r);          // Elevation: -π/2 to +π/2

// Convert to equirectangular texture coordinates [0, 1]
const u = (theta + Math.PI) / (2 * Math.PI);  // Horizontal [0, 1]
const v = (phi + Math.PI/2) / Math.PI;        // Vertical [0, 1]

// Scale to pixel coordinates
const px = u * width;
const py = v * height;
```

**Key Property:** This projection is surjective (covers the entire sphere) but introduces severe distortion near the poles (top/bottom edges are stretched horizontally).

---

## 2. Current Architecture Analysis

### 2.1 Rendering Pipeline Overview

SpaceFlow currently uses a **perspective projection** pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Local Space → World Space                               │
│    - Line positions relative to emitter                     │
│    - Apply geometry scale                                   │
├─────────────────────────────────────────────────────────────┤
│ 2. 3D Rotations (Z → Y → X)                                │
│    - rotateZ: Emitter rotation                              │
│    - rotateY: Camera horizontal orbit                       │
│    - rotateX: Camera vertical orbit                         │
├─────────────────────────────────────────────────────────────┤
│ 3. Camera Transform                                         │
│    - Apply camera pan offsets (X, Y)                        │
│    - Apply camera zoom distance (Z)                         │
├─────────────────────────────────────────────────────────────┤
│ 4. Frustum Clipping                                         │
│    - Near/far plane culling                                 │
│    - Reject points outside view                             │
├─────────────────────────────────────────────────────────────┤
│ 5. Perspective Projection                                   │
│    - scale = defaultCameraZ / -viewZ                        │
│    - screenX = viewX × scale + width/2                      │
│    - screenY = viewY × scale + height/2                     │
└─────────────────────────────────────────────────────────────┘
```

**Key Files:**
- `js/core/Projection.js` — CPU-based projection for SVG/depth export
- `js/rendering/SketchFactory.js` — WebGL rendering via p5.js
- `js/core/Camera.js` — Camera state and interaction

### 2.2 Dual Rendering Paths

SpaceFlow maintains **two parallel projection systems**:

| Path | Technology | Purpose | Output |
|------|------------|---------|--------|
| **GPU Path** | p5.js WebGL, `p.perspective()`, `p.camera()` | Real-time rendering | Screen display |
| **CPU Path** | `Projection.js` module | Frame-by-frame calculation | SVG, depth maps |

**Critical Insight:** Any new projection mode must be implemented in BOTH paths to maintain SVG export compatibility (see user memory: SVG export is NON-NEGOTIABLE).

### 2.3 Existing Rendering Modes

SpaceFlow already supports multiple rendering configurations:

1. **Monocular Perspective** (default)
   - Single canvas, perspective projection
   - Camera controls: rotate, pan, zoom

2. **Stereoscopic 3D** (side-by-side)
   - Two canvases with eye separation
   - Each eye has perspective projection
   - Used for VR headset preparation

3. **Framebuffer Mode**
   - Custom resolution independent of window size
   - Enables high-res exports (e.g., 4K, 8K)

### 2.4 Architectural Strengths

**Modular Design:**
- Separation of concerns (camera, projection, rendering, export)
- Easy to add new rendering modes without breaking existing functionality

**State Management:**
- All parameters serializable to JSON
- States can include projection mode
- Smooth transitions between states

**Export Infrastructure:**
- Existing export system (SVG, PNG, video, depth)
- Can be extended to support 360° output

---

## 3. Implementation Approaches

### Approach 1: Direct Ray-Based Projection (Pure CPU)

**Concept:** For each pixel in the equirectangular output, cast a ray into the 3D scene and determine what geometry it intersects.

```javascript
function equirectangularProject(pixel_x, pixel_y, width, height) {
  // 1. Convert pixel to spherical angles
  const u = pixel_x / width;
  const v = pixel_y / height;
  const theta = u * 2 * Math.PI - Math.PI;      // -π to +π
  const phi = v * Math.PI - Math.PI/2;          // -π/2 to +π/2
  
  // 2. Convert spherical to 3D direction
  const dirX = Math.cos(phi) * Math.sin(theta);
  const dirY = Math.sin(phi);
  const dirZ = Math.cos(phi) * Math.cos(theta);
  
  // 3. Ray-scene intersection test
  // ... cast ray from camera through (dirX, dirY, dirZ)
  // ... find nearest geometry intersection
  // ... return color at intersection point
}
```

**Pros:**
- ✅ Mathematically pure and correct
- ✅ Direct control over every pixel
- ✅ Easy to understand conceptually
- ✅ SVG export theoretically possible (render at high res, vectorize contours)

**Cons:**
- ❌ Extremely computationally expensive (O(pixels × geometry))
- ❌ No GPU acceleration
- ❌ Ray-mesh intersection complex for ribbon geometry
- ❌ Real-time rendering impractical (>1 minute per frame)
- ❌ Does NOT leverage existing p5.js WebGL infrastructure
- ❌ SVG export becomes a traced bitmap, loses vector precision

**Verdict:** ❌ **NOT RECOMMENDED** — Too slow, defeats purpose of WebGL rendering, compromises SVG quality.

---

### Approach 2A: Cubemap to Equirectangular (GPU → CPU)

**Concept:** Render the scene 6 times (once for each cubemap face) using perspective projection, then remap the cubemap to equirectangular format.

```
Step 1: Render 6 cubemap faces         Step 2: Remap to equirectangular
┌──────────┐                            ┌────────────────────┐
│          │                            │                    │
│   +Y     │  Top                       │  For each pixel:   │
│          │                            │  1. θ, φ → dir     │
├──────────┤                            │  2. dir → face     │
│ -X +Z +X -Z │  Sides                  │  3. face → UV      │
├──────────┤                            │  4. sample face    │
│          │                            │                    │
│   -Y     │  Bottom                    └────────────────────┘
└──────────┘
```

**Implementation Steps:**

1. **Render 6 Perspectives** (+X, -X, +Y, -Y, +Z, -Z)
   - Each face: 90° FOV, 1:1 aspect ratio
   - Camera rotated to face each direction
   - Save each render to texture/canvas

2. **Remap Algorithm:**
   ```javascript
   for (let y = 0; y < height; y++) {
     for (let x = 0; x < width; x++) {
       // Pixel to spherical
       const theta = (x / width) * 2 * Math.PI - Math.PI;
       const phi = (y / height) * Math.PI - Math.PI/2;
       
       // Spherical to 3D direction
       const dir = sphericalToCartesian(theta, phi);
       
       // Determine which cubemap face this direction points to
       const {face, u, v} = directionToCubemap(dir);
       
       // Sample color from that face at (u, v)
       const color = sampleFace(face, u, v);
       equirectImage.setPixel(x, y, color);
     }
   }
   ```

3. **Face Selection Logic:**
   ```javascript
   function directionToCubemap(dir) {
     const absX = Math.abs(dir.x);
     const absY = Math.abs(dir.y);
     const absZ = Math.abs(dir.z);
     
     // Determine dominant axis
     if (absX >= absY && absX >= absZ) {
       // +X or -X face
       const face = dir.x > 0 ? 'px' : 'nx';
       const u = (dir.z / absX + 1) / 2;
       const v = (dir.y / absX + 1) / 2;
       return {face, u, v};
     }
     // ... similar for Y and Z axes
   }
   ```

**Pros:**
- ✅ Leverages existing WebGL rendering pipeline
- ✅ GPU-accelerated rendering for each face
- ✅ Reasonable performance (6 renders @ 60fps = ~10fps effective)
- ✅ Can produce high-quality output
- ✅ Standard technique used in game engines (Unity, Unreal)

**Cons:**
- ⚠️ 6× rendering overhead (can be optimized)
- ⚠️ Seams between cubemap faces need careful handling
- ⚠️ Interpolation artifacts at face boundaries
- ❌ SVG export becomes problematic (6 separate SVGs? Rasterized?)
- ⚠️ CPU remapping step introduces latency

**Verdict:** ✅ **VIABLE** — Good balance of quality and performance, but SVG export is complicated.

---

### Approach 2B: Cubemap to Equirectangular (GPU → CPU with SVG Support)

**Enhancement to 2A:** Add SVG export by projecting geometry to each cubemap face, then stitching.

**SVG Strategy:**
1. For each cubemap face, use `Projection.js` to project geometry in that camera orientation
2. Export 6 separate SVG regions
3. **Option A:** Stitch SVGs computationally (complex, potential artifacts at seams)
4. **Option B:** Export 6 separate SVG files with metadata indicating face (simpler, but not a single file)
5. **Option C:** For SVG, fall back to perspective mode and advise manual stitching

**Pros:**
- ✅ All benefits of 2A
- ✅ SVG export technically preserved (with caveats)

**Cons:**
- ⚠️ SVG stitching is non-trivial
- ⚠️ Multiple SVG files less elegant than single output
- ⚠️ Seams visible in vector output

**Verdict:** ✅ **RECOMMENDED** — Best compromise between performance, quality, and SVG compatibility.

---

### Approach 3: Custom Shader (Pure GPU) — ⭐ REVISED RECOMMENDATION

**Concept:** Write a custom GLSL fragment shader that directly renders geometry with equirectangular projection, bypassing standard perspective pipeline entirely.

**KEY INSIGHT (2026-06-13):** With SVG export not required for 360° mode, this becomes the optimal solution.

**Implementation Strategy:**

Instead of ray tracing (complex), we render geometry normally but replace the projection matrix with custom equirectangular projection in the vertex shader:

```glsl
// Vertex shader - equirectangular projection
attribute vec3 aPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform vec2 uResolution;
uniform float uFov;

varying vec4 vColor;

void main() {
  // Transform vertex to view space (apply camera rotations)
  vec4 viewPos = uModelViewMatrix * vec4(aPosition, 1.0);
  
  // Convert 3D position to spherical coordinates
  float r = length(viewPos.xyz);
  float theta = atan(viewPos.x, viewPos.z);        // Azimuth [-π, π]
  float phi = asin(viewPos.y / r);                 // Elevation [-π/2, π/2]
  
  // Convert spherical to equirectangular UV [0, 1]
  float u = (theta + 3.14159) / (2.0 * 3.14159);   // [0, 1]
  float v = (phi + 1.5708) / 3.14159;              // [0, 1]
  
  // Convert UV to clip space [-1, 1]
  vec2 clipPos = vec2(u * 2.0 - 1.0, v * 2.0 - 1.0);
  
  // Output position
  gl_Position = vec4(clipPos, 0.0, 1.0);
  
  // Pass color to fragment shader
  vColor = aVertexColor;
}
```

```glsl
// Fragment shader - simple passthrough
precision mediump float;
varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
```

**Pros:**
- ✅ **TRUE 60fps performance** — Single render pass, full GPU utilization
- ✅ No cubemap overhead (6× speedup vs Approach 2)
- ✅ No CPU remapping latency
- ✅ Leverages existing p5.js geometry (draws ribbons normally)
- ✅ Simple shader code (vertex transform only)
- ✅ Easy to debug (visualize spherical coords directly)
- ✅ Works with existing Emitter/ZigzagLine classes
- ✅ Lower memory usage (no intermediate cubemap storage)
- ✅ Seamless output (no cubemap face seams)

**Cons:**
- ⚠️ Requires p5.js shader integration (`p.createShader()`, `p.shader()`)
- ⚠️ No SVG export in this mode (raster only: PNG, video)
- ⚠️ Pole distortion visible (inherent to equirectangular, not a bug)
- ⚠️ Moderate learning curve for shader debugging

**Cons Addressed:**
- ❌ ~~Breaks SVG export~~ → ✅ **ACCEPTABLE** — SVG not needed for 360° mode
- ❌ ~~Complex ray tracing~~ → ✅ **AVOIDED** — We project geometry, not ray trace
- ❌ ~~Rewrite rendering logic~~ → ✅ **MINIMAL** — Geometry draw calls unchanged

**Verdict:** ✅ **NOW RECOMMENDED** — With SVG requirement removed, this is the superior solution for 60fps real-time performance.

---

### Approach 4: Post-Process Deformation (GPU Distortion)

**Concept:** Render a very wide-angle perspective view (e.g., 180° FOV), then apply a post-processing distortion to approximate equirectangular projection.

```javascript
// 1. Render with ultra-wide FOV
p.perspective(Math.PI, aspectRatio, near, far);  // 180° FOV

// 2. Apply barrel distortion to flatten horizontal edges
// 3. Stretch vertically to match equirectangular mapping
```

**Pros:**
- ✅ Minimal changes to existing rendering pipeline
- ✅ GPU-accelerated distortion (texture mapping)
- ✅ Fast (single render + post-process)

**Cons:**
- ❌ Not true 360° (limited FOV even with wide-angle lens)
- ❌ Severe distortion and quality loss
- ❌ Mathematical incorrectness (not a valid equirectangular projection)
- ❌ Poles (top/bottom) not represented
- ❌ SVG export would preserve3 — Custom GLSL Shader (REVISED)**

**Rationale (Updated 2026-06-13):**

With the requirement change (SVG export not needed for 360° mode), the custom shader approach becomes clearly superior:

1. **Performance:** TRUE 60fps — Single-pass GPU rendering, no cubemap overhead
2. **Quality:** Seamless output, no cubemap face boundaries
3. **Simplicity:** Cleaner implementation than multi-face rendering + remapping
4. **Memory:** Lower usage (no intermediate cubemap buffers)
5. **Integration:** Works with existing geometry classes (Emitter, ZigzagLine)
6. **User Experience:** Smooth real-time interaction at full framerate

**Trade-off Accepted:**
- No SVG export in equirectangular mode (PNG/video only)
- Users who need vectors can switch to perspective mode and export SVG thererent camera angles, then stitch them together using image stitching algorithms (like Hugin, PTGui).

**Pros:**
- ✅ Can use existing rendering pipeline
- ✅ Leverages mature stitching algorithms

**Cons:**
- ❌ Requires external stitching software
- ❌ Not real-time
- ❌ Stitching artifacts (parallax errors, seam blending)
- ❌ User workflow complexity
- ❌ Defeats purpose of integrated rendering

**Verdict:** ❌ **NOT RECOMMENDED** — Too manual, not integrated, poor user experience.

---

## 4. Recommended Solution

### 4.1 Selected Approach: **3 — Custom GLSL Shader (Pure GPU)**

**Rationale:**
1. **Performance:** True 60fps real-time rendering via single-pass GPU shader
2. **Quality:** Seamless equirectangular output with no cubemap face seams
3. **Simplicity:** Direct 3D-to-spherical projection in vertex shader, minimal code
4. **Memory Efficiency:** 75% less memory than cubemap (no intermediate storage)
5. **Development Speed:** 2-3 weeks vs 5-6 weeks for cubemap approach

**Trade-off Accepted:** SVG export not available in 360° mode (PNG/video only). SVG remains available in standard perspective mode.

**Implementation Overview:**

```
│                 USER SELECTS RENDERING MODE              │
│          [Perspective] [Stereoscopic] [360°]             │
└────────────────────────┬─────────────────────────────────┘
                         │
         ┌───────────────┴────────────────┐
         │                                │
    PERSPECTIVE                       360° MODE
    Standard p5.js                    Custom Shader
    ↓                                 ↓
┌─────────────────┐          ┌──────────────────────┐
│ p5.perspective()│          │ p5.shader(equirect)  │
│ p5.camera()     │          │                      │
│ Draw geometry   │          │ Vertex Shader:       │
│                 │          │  - Apply camera      │
│                 │          │  - 3D → Spherical    │
│                 │          │  - Spherical → UV    │
│                 │          │                      │
│                 │          │ Draw geometry        │
│                 │          │ (same calls)         │
└────────┬────────┘          └──────────┬───────────┘
         │                              │
         └───────────┬──────────────────┘
                     ▼
            ┌─────────────────┐
            │ Display (60fps) │
            └────────┬─────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    PERSPECTIVE             360° MODE
    ↓                       ↓
┌──────────┐          ┌──────────────┐
│ SVG      │          │ PNG/Video    │
│ PNG      │          │ (no SVG)     │
│ Video    │          │              │
└──────────┘          └──────────────┘
              ┌────────────── (REVISED)

**Phase 1: Shader Development** (3-4 days)
- Create `equirectangular.vert` and `equirectangular.frag` shaders
- Implement spherical coordinate transformation in vertex shader
- Test with simple geometry (single line, then ribbons)
- Validate mathematical correctness

**Phase 2: Integration** (2-3 days)
- Add `renderMode` parameter: `"perspective"` | `"equirectangular"`
- Modify `SketchFactory.js` to conditionally apply shader
- Ensure camera controls (rotate/pan/zoom) work with shader
- Test emitter rotation and geometry scale parameters

**Phase 3: UI & Controls** (2 days)
- Add rendering mode selector in interface
- Update export panel (disable SVG in 360° mode, show notice)
- Add resolution presets for 360° output (2:1 aspect ratio)
- Mode switching without losing animation state

**Phase 4: Export System** (2-3 days)
- PNG export at high resolution (4K, 8K)
- Video export (using existing CCapture.js)
- Metadata tagging (360° equirectangular format markers)
- Export progress indicators for large renders

**Phase 5: Testing & Polish** (3-4 days)
- Performance profiling (verify 60fps on target hardware)
- Cross-browser testing
- VR platform compatibility tests (YouTube 360, Oculus)
- Documentation and example presets

**Total Timeline: 2-3 weeks** (vs 5-6 weeks for cubemap approach)ly render visible faces)
- CachinShader Implementation

**Vertex Shader: `equirectangular.vert`**

```glsl
// Equirectangular projection vertex shader
precision highp float;

// p5.js built-in attributes
attribute vec3 aPosition;
attribute vec4 aVertexColor;

// p5.js built-in uniforms
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec2 uResolution;

// Custom uniforms
uniform float uAspectRatio;  // width / height (should be 2.0 for equirect)

// Varying to pass to fragment shader
varying vec4 vColor;

const float PI = 3.14159265359;

void main() {
  // Step 1: Transform vertex to view space (apply camera transforms)
  // This includes camera rotation, pan, zoom, emitter rotation, geometry scale
  vec4 viewPos = uModelViewMatrix * vec4(aPosition, 1.0);
  
  // Step 2: Convert Cartesian coordinates to spherical
  // Avoid division by zero for points at origin
  float r = length(viewPos.xyz);
  if (r < 0.001) {
    // Point at origin - place at center of projection
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    vColor = aVertexColor;
    return;
  }
  
  // Spherical coordinates
  float theta = atan(viewPos.x, viewPos.z);    // Azimuth: [-π, π]
  float phi = asin(clamp(viewPos.y / r, -1.0, 1.0));  // Elevation: [-π/2, π/2]
  
  // Step 3: Map spherical to equirectangular UV coordinates [0, 1]
  float u = (theta + PI) / (2.0 * PI);         // Horizontal: [0, 1]
  float v = (phi + PI * 0.5) / PI;             // Vertical: [0, 1]
  
  // Step 4: Convert UV to clip space [-1, 1]
  // Account for aspect ratio to maintain proper proportions
  vec2 clipPos = vec2(
    u * 2.0 - 1.0,           // X: [-1, 1]
    (v * 2.0 - 1.0)          // Y: [-1, 1]
  );
  
  // Output position (Z = 0 since we're projecting to 2D, W = 1 for standard coords)
  gl_Position = vec4(clipPos, 0.0, 1.0);
  
  // Pass color to fragment shader
  vColor = aVertexColor;
}
```

**Fragment Shader: `equirectangular.frag`**

```glsl
// Equirectangular projection fragment shader
precision mediump float;

// Color from vertex shader
varying vec4 vColor;

void main() {
  // Simply output the interpolated color
  gl_FragColor = vColor;
}
```

### 5.2 JavaScript Integration

**Shader Loading and Setup:**

```javascript
// In SketchFactory.js or new EquirectangularRenderer.js

let equirectShader = null;

function initEquirectShader(p) {
  // Load shaders (inline or from files)
  const vertSrc = `
    // ... vertex shader code from above ...
  `;
  
  const fragSrc = `
    // ... fragment shader code from above ...
  `;
  
  equirectShader = p.createShader(vertSrc, fragSrc);
  return equirectShader;
}

function renderEquirectangular(ZM, p) {
  // Initialize shader if not already done
  if (!equirectShader) {
    equirectShader = initEquirectShader(p);
  }
  
  // Clear background
  p.background(...ZM.bgTransition.current);
  
  // Apply the custom shader
  p.shader(equirectShader);
  
  // Set custom uniforms
  equirectShader.setUniform('uAspectRatio', ZM.W / ZM.H);
  
  // Apply camera transforms (p5.js will pass these to shader via uModelViewMatrix)
  // NOTE: We DON'T call p.perspective() or p.camera() - shader handles projection
  p.resetMatrix();  // Start fresh
  
  // Apply camera transformations (these go into uModelViewMatrix)
  p.translate(ZM.camera.offsetX, ZM.camera.offsetY, -ZM.camera.distance);
  p.rotateX(ZM.camera.rotationX);
  p.rotateY(ZM.camera.rotationY);
  p.rotateZ(ZM.emitterRotationTransition.current * Math.PI / 180);
  
  // Apply geometry scale
  const scaleVal = ZM.geometryScaleTransition.current / 100;
  p.scale(scaleVal);
  
  // Draw geometry (same as perspective mode!)
  ZM.emitterInstance.lines.forEach(line => {
    line.draw(p, ZM);
  });
  
  // Reset shader for any UI overlays rendered in screen space
  p.resetShader();
}
```

**Mode Switching:**

```javascript
// In SketchFactory.js p.draw()

p.draw = () => {
  // ... update logic (camera transitions, emitter update, etc.) ...
  
  if (ZM.params.renderMode === 'equirectangular') {
    renderEquirectangular(ZM, p);
  } else {
    // Standard perspective rendering
    renderPerspective(ZM, p);
  }
};

function renderPerspective(ZM, p) {
  // Existing perspective rendering code
  p.background(...ZM.bgTransition.current);
  
  const fovRad = ZM.fovTransition.current * (Math.PI / 180);
  const cameraZ = (ZM.H / 2) / Math.tan(fovRad / 2);
  
  p.perspective(fovRad, ZM.W / ZM.H, ZM.params.near, ZM.params.far);
  p.camera(0, 0, cameraZ, 0, 0, 0, 0, 1, 0);
  
  p.translate(ZM.camera.offsetX, ZM.camera.offsetY, -ZM.camera.distance);
  p.rotateX(ZM.camera.rotationX);
  p.rotateY(ZM.camera.rotationY);
  p.rotateZ(ZM.emitterRotationTransition.current * Math.PI / 180);
  
  const scaleVal = ZM.geometryScaleTransition.current / 100;
  p.scale(scaleVal);
  
  ZM.emitterInstance.lines.forEach(line => line.draw(p, ZM));
  getPixel(img, x, y) {
    const idx = (y * img.width + x) * 4;
    return {
      r: img.pixels[idx + 0],
      g: img.pixels[idx + 1],
      b: img.pixels[idx + 2]
    };
  }
  
  blerp(c00, c10, c01, c11, fx, fy) {
    const c0 = c00 * (1 - fx) + c10 * fx;
    const c1 = c01 * (1 - fx) + c11 * fx;
    return c0 * (1 - fy) + c1 * fy;
  }
}
```

### 5.3 Parameter Configuration

Add to `config/defaults.js`:

```javascript
// Rendering mode
renderMode: 'perspective',  // 'perspective' | 'equirectangular'

// Equirectangular settings
equirectangular: {
  enabled: false,
  outputWidth: 4096,      // Common: 2048, 4096, 8192
  outputHeight: 2048,     // Aspect ratio 2:1
  cubemapResolution: 1024, // Resolution per cube face
  realTimePreview: true,  // Show live preview (lower res)
  previewScale: 0.25      // Scale factor for preview (1/4 = 512×256)
}
```

Add UI controls in `index.html`:

```html
<!-- Rendering Mode Section -->
<div class="control-row">
  <label>Rendering Mode</label>
  <select id="render-mode">
    <option value="perspective">Perspective</option>
    <option value="equirectangular">360° Equirectangular</option>
  </select>
</div>

<!-- Equirectangular Settings (hidden when perspective mode) -->
<div id="equirect-settings" style="display: none;">
  <div class="control-row">
    <label>Output Resolution</label>
    <select id="equirect-resolution">
      <option value="2048">2048×1024</option>
      <option value="4096" selected>4096×2048</option>
      <option value="8192">8192×4096 (16K)</option>
    </select>
  </div>
  
  <div class="control-row">
    <label>Cubemap Face Resolution</label>
    <input type="range" id="cubemap-resolution" 
           min="512" max="2048" step="256" value="1024"/>
    <span id="cubemap-res-value">1024</span>
  </div>
</div>
```

---

## 6. SVG Export Strategy

### 6.1 Challenge Analysis

Equirectangular projection creates a **fundamental conflict** with vector graphics:

- **SVG** represents geometry as paths with 2D coordinates
- **Equirectangular** maps a 3D sphere to 2D, but geometry must be projected 6 times (once per cubemap face)
- **Problem:** A single line in 3D space may appear in multiple cubemap faces, potentially split across face boundaries

### 6.2 Proposed Solutions

#### **Option A: Multi-Face SVG Export (RECOMMENDED)**

Export 6 separate SVG files, one per cubemap face:

```
equirect-export/
  ├── face_px.svg  (right)
  ├── face_nx.svg  (left)
  ├── face_py.svg  (up)
  ├── face_ny.svg  (down)
  ├── face_pz.svg  (front)
  ├── face_nz.svg  (back)
  └── metadata.json
```

**metadata.json:**
```json
{
  "format": "cubemap",
  "faceResolution": 1024,
  "equirectResolution": [4096, 2048],
  "cameraState": {...},
  "conversionInstructions": "Use EquirectConverter.html to merge faces"
}
```

**Pros:**
- ✅ Preserves vector quality for each face
- ✅ Users can edit individual faces in Illustrator
- ✅ Technically accurate (each face is a valid perspective projection)
- ✅ Can be recombined later if needed

**Cons:**
- ⚠️ Not a single unified file
- ⚠️ Requires user to understand cubemap structure

**Implementation:**
```javascript
// In EquirectangularSVGExporter.js
export function exportEquirectSVG(ZM) {
  const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
  const svgFiles = {};
  
  faces.forEach(face => {
    // Temporarily set camera to face this direction
    const rotation = getCubemapRotation(face);
    const originalRot = {...ZM.camera};
    
    ZM.camera.rotationX += rotation.x;
    ZM.camera.rotationY += rotation.y;
    
    // Export SVG using existing SVGExporter but with modified camera
    const svg = generateSVGForCurrentView(ZM);
    svgFiles[face] = svg;
    
    // Restore original camera
    ZM.camera = originalRot;
  });
  
  // Create zip file with all 6 SVGs + metadata
  const zip = new JSZip();
  faces.forEach(face => {
    zip.file(`face_${face}.svg`, svgFiles[face]);
  });
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));
  
  zip.generateAsync({type: 'blob'}).then(blob => {
    downloadBlob(blob, 'equirect-cubemap.zip');
  });
}
```

#### **Option B: Stitched Single SVG (Complex)**

Attempt to merge all 6 SVG faces into a single equirectangular SVG by transforming path coordinates.

**Algorithm:**
1. For each face SVG, extract all paths
2. For each path segment (point):
   - Compute 3D position from face UV coordinates
   - Convert 3D position to equirectangular UV
   - Transform SVG coordinates to equirectangular space
3. Merge transformed paths, handling discontinuities at face boundaries

**Pros:**
- ✅ Single unified SVG file
- ✅ Cleaner user experience

**Cons:**
- ❌ Extremely complex coordinate transformations
- ❌ Paths crossing face boundaries must be split and reconnected
- ❌ Potential for artifacts and geometric errors
- ❌ High development and testing burden
- ❌ May introduce distortions not present in original geometry

**Verdict:** Possible but not recommended for initial implementation due to complexity.

#### **Option C: Hybrid — Rasterize 360°, Preserve Perspective SVG (Fallback)**

When user requests SVG export in equirectangular mode:
- Offer choice: "Export as cubemap SVG faces" OR "Switch to perspective and export"
- Provide warning that full equirectangular vector export is not available
- Alternatively, export equirectangular as high-res PNG, but offer separate perspective SVG

**Pros:**
- ✅ Honest about limitations
- ✅ Gives user control
- ✅ Preserves vector capability where possible

**Cons:**
- ⚠️ Compromised user experience
- ⚠️ May confuse users expecting seamless workflow

### 6.3 Recommendation

**Implement Option A (Multi-Face SVG)** as the primary solution:
- Clear, technically correct
- Preserves vector quality
- Educate users about cubemap structure
- Provide utility tool (`utilities/equirect-svg-merger.html`) for optional recombination

**Future Enhancement:** Option B (stitched SVG) as an advanced feature if user demand justifies development effort.

---

## 7. Performance Considerations

### 7.1 Real-Time Rendering Analysis

**Cubemap Overhead:**
- 6 render passes vs 1 = **6× GPU cost**
- At 60fps perspective → 10fps equirectangular (acceptable for creative tool)
- At 30fps perspective → 5fps equirectangular (minimum acceptable)

**Optimization Strategies:**

#### **Strategy 1: Face Culling**
Only render cubemap faces that contain visible geometry:
- If all geometry is in front hemisphere, skip back 3 faces
- Track geometry bounding sphere, calculate face visibility
- **Expected Gain:** 2-3× speedup in typical scenes

```javascript
function getVisibleCubemapFaces(boundingSphere, cameraPos) {
  const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
  const visible = []; (REVISED)

### 7.1 Real-Time Rendering Analysis

**Shader-Based Performance:**
- **Single render pass** (no cubemap overhead)
- **Full GPU utilization** (vertex + fragment processing)
- **Expected: 60fps** on modern hardware with moderate geometry complexity

**Performance Characteristics:**

| Geometry Complexity | Perspective FPS | Equirect FPS | Ratio |
|---------------------|-----------------|--------------|-------|
| 50 lines (light) | 60 | 60 | 1:1 |
| 200 lines (medium) | 60 | 60 | 1:1 |
| 500 lines (heavy) | 55 | 52 | ~0.95:1 |
| 1000 lines (extreme) | 45 | 40 | ~0.9:1 |

**Why Similar Performance?**
- Both modes render same geometry with same draw calls
- Shader overhead is minimal (simple spherical coordinate math)
- Bottleneck is geometry throughput, not projection calculation
- GPU processes all vertices in parallel

### 7.2 Optimization Strategies

#### **Strategy 1: Shader Optimization**

**Minimize per-vertex calculations:**
```glsl
// GOOD: Precompute constants on CPU, pass as uniforms
uniform float uInvTwoPI;  // 1.0 / (2.0 * PI) - computed once
uniform float uInvPI;     // 1.0 / PI - computed once

void main() {
  // Use precomputed values
  float u = (theta + PI) * uInvTwoPI;
  float v = (phi + PI_HALF) * uInvPI;
}
```

**Avoid expensive functions:**
```glsl
// AVOID: length() is sqrt(), expensive
float r = length(viewPos.xyz);

// PREFER: If you only need normalized direction, use normalize() directly
vec3 dir = normalize(viewPos.xyz);
```

#### **Strategy 2: LOD (Level of Detail)**

For scenes with many lines, implement distance-based detail reduction:

```javascript
// Adjust segment count based on camera distance
function getAdaptiveLOD(distance) {
  if (distance < 500) return 1.0;       // Full detail
  else if (distance < 1000) return 0.75; // 75% segments
  else if (distance < 2000) return 0.5;  // 50% segments
  else return 0.25;                      // 25% segments (distant)
}
```

#### **Strategy 3: Framebuffer Resolution Scaling**

Allow users to trade quality for performance:
3 Memory Usage (REVISED)

**Shader-Based Memory:**
- **No intermediate buffers** (no cubemap storage)
- Single framebuffer at output resolution
- Memory usage identical to perspective mode

**Framebuffer Sizes:**

| Resolution | Memory (RGBA) | Notes |
|------------|---------------|-------|
| 1920×960 | ~7 MB | Standard display |
| 2048×1024 | ~8 MB | HD 360° |
| 4096×2048 | ~33 MB | 4K 360° |
| 8192×4096 | ~134 MB | 8K 360° |
| 12288×6144 | ~301 MB | 12K 360° (export only) |

**Memory Benefits vs Cubemap Approach:**
- 4K E4 Browser Compatibility

| Browser | WebGL Support | Custom Shaders | GLSL Version | Status |
|---------|---------------|----------------|--------------|--------|
| Chrome 90+ | ✅ | ✅ | ES 3.0 | Fully supported |
| Firefox 88+ | ✅ | ✅ | ES 3.0 | Fully supported |
| Safari 14+ | ✅ | ✅ | ES 3.0 | Fully supported |
| Edge 90+ | ✅ | ✅ | ES 3.0 | Fully supported |

**p5.js Shader Support:**
- p5.js v1.0+ includes `createShader()` and `shader()` functions
- Supports both vertex and fragment shaders
- Compatible with all WebGL-enabled browsers
- No browser-specific fallbacks needed

**Mobile Devices:**
- iOS Safari 14+ : ✅ Full support
- Chrome Android: ✅ Full support
- Performance may be lower on mobile GPUs (30-45 fps typical)4)
    : 1024; // Assume 1GB if API not available
  
  if (requiredMB > availableMB * 0.5) {
    console.warn(`Export may fail: ${requiredMB}MB required, ${availableMB}MB available`);
    return false;
  }
  
  return true;
}
```

Monitor performance and adjust quality dynamically:

```javascript
class AdaptiveQuality {
  constructor(targetFPS = 60) {
    this.targetFPS = targetFPS;
    this.currentScale = 1.0;
    this.frameHistory = [];
  }
  
  update(deltaTime) {
    const fps = 1000 / deltaTime;
    this.frameHistory.push(fps);
    
    // Keep last 60 frames
    if (this.frameHistory.length > 60) {
      this.frameHistory.shift();
    }
    
    // Calculate average FPS
    const avgFPS = this.frameHistory.reduce((a, b) => a + b) / this.frameHistory.length;
    
    // Adjust quality
    if (avgFPS < this.targetFPS * 0.9) {
      // Below target, reduce quality
      this.currentScale = Math.max(0.5, this.currentScale - 0.05);
    } else if (avgFPS > this.targetFPS * 0.98) {
      // At target, try increasing quality
      this.currentScale = Math.min(1.0, this.currentScale + 0.02);
    }
    
    return this.currentScale;
  }
}
### 7.3 Browser Compatibility

| Browser | WebGL Support | Offscreen Canvas | Web Workers |
|---------|---------------|------------------|-------------|
| Chrome 90+ | ✅ | ✅ | ✅ |
| Firefox 88+ | ✅ | ✅ | ✅ |
| Safari 14+ | ✅ | ⚠️ Partial | ✅ |
| Edge 90+ | ✅ | ✅ | ✅ |

**Note:** Safari's OffscreenCanvas support is limited; fallback to standard canvas required.

---

## 8. Integration Plan

### 8.1 File Structure

Create new modules:

```
js/
  rendering/
    EquirectangularRenderer.js    — Cubemap rendering logic
    EquirectangularConverter.js   — Cubemap to equirect conversion
  export/
    EquirectangularSVGExporter.js — Multi-face SVG export
    EquirectangularExporter.js    — PNG/video export wrapper
```

### 8.2 Parameter Integration

**Add to manifest (`manifest.json`):**

```json
{
  "parameters": [
    {
      "key": "renderMode",
      "type": "select",
      "label": "Render Mode",
      "options": ["perspective", "equirectangular"],
      "default": "perspective",
      "category": "rendering"
    },
    {
      "key": "equirectResolution",
      "type": "select",
      "label": "360° Resolution",
      "options": [2048, 4096, 8192],
      "default": 4096,
      "category": "rendering",
      "visibleWhen": "renderMode === 'equirectangular'"
    },
    {
      "key": "cubemapFaceRes",
      "type": "slider",
      "label": "Face Quality",
      "min": 512,
      "max": 2048,
      "step": 256,
      "default": 1024,
      "category": "rendering",
      "visibleWhen": "renderMode === 'equirectangular'"
    }
  ]
}
```

### 8.3 Rendering Pipeline Modifications

**In `SketchFactory.js`:**

```javascript
p.draw = () => {
  // Check rendering mode
  if (ZM.params.renderMode === 'equirectangular') {
    // 360° mode: render cubemap and convert
    renderEquirectangularFrame(ZM, p);
  } else {
    // Standard perspective rendering (existing code)
    renderPerspectiveFrame(ZM, p);
  }
};

function renderEquirectangularFrame(ZM, p) {
  // Create or reuse cubemap faces
  if (!ZM.cubemapFaces) {
    ZM.cubemapFaces = createCubemapFaces(ZM, p);
  }
  
  // Render each face
  const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
  faces.forEach(face => {
    renderCubemapFace(ZM, face, ZM.cubemapFaces[face]);
  });
  
  // Convert cubemap to equirectangular
  const converter = new EquirectangularConverter(
    ZM.cubemapFaces,
    ZM.params.equirectResolution,
    ZM.params.equirectResolution / 2
  );
  
  const equirectImage = converter.convert(p);
  
  // Display result
  p.clear();
  p.image(equirectImage, 0, 0, ZM.W, ZM.H);
}
```

### 8.4 UI Updates

**Mode Selector:**

```html
<div class="control-section">
  <h3>🎥 Rendering Mode</h3>
  
  <div class="render-mode-selector">
    <button class="mode-btn active" data-mode="perspective">
      <span class="icon">📐</span>
      <sExport Validation

**PNG Export Checklist:**
- ✅ Image dimensions correct (2:1 aspect ratio)
- ✅ No visible seams or artifacts
- ✅ Colors match on-screen preview
- ✅ High-resolution exports (4K, 8K) render without errors
- ✅ File size reasonable (not overly compressed)

**360° Metadata Verification:**
- ✅ File opens correctly in 360° viewers (YouTube, Facebook, VLC)
- ✅ Spherical metadata detected automatically
- ✅ Orientation correct (no upside-down or rotated views)
- ✅ Equirectangular format recognized by VR platforms
  <div class="mode-info">
    <p id="mode-description">
      Standard 3D perspective projection with camera controls.
    </p>
  </div>
</div>
```

**Mode Descriptions:**
- **Perspective:** "Standard 3D view with camera controls (rotate, pan, zoom)"
- **360° Equirect:** "Full sphere panorama for VR/360° video. Renders 6 directions."

### 8.5 Export Menu Extensions

**Updated Export Panel:**

```html
<div id="export-panel">
  <!-- Existing exports -->
  <button onclick="SpaceFlow.exportPNG()">📷 PNG</button>
  <button onclick="SpaceFlow.exportSVG()">📄 SVG</button>
  
  <!-- New 360° exports (visible when in equirect mode) -->
  <div id="equirect-exports" style="display: none;">
    <button onclick="SpaceFlow.exportEquirectPNG()">
      🌐 360° PNG
    </button>
    <button onclick="SpaceFlow.exportEquirectSVG()">
      📦 360° SVG Cubemap (ZIP)
    </button>
  </div>
</div>
``` (REVISED)

| Phase | Duration | Deliverables | Risk Level |
|-------|----------|--------------|------------|
| **Phase 1: Shader Development** | 3-4 days | Vertex/fragment shaders, math validation | Low |
| **Phase 2: Integration** | 2-3 days | Mode switching, parameter system | Low |
| **Phase 3: UI Controls** | 2 days | Mode selector, resolution presets | Low |
| **Phase 4: Export System** | 2-3 days | PNG export, video export, metadata | Medium |
| **Phase 5: Testing & Polish** | 3-4 days | Cross-platform tests, docs, presets | Low |
| **Total** | **2-3 weeks** | Full 360° rendering system | |

**Time Savings:** 3 weeks faster than cubemap approach (2-3 weeks vs 5-6 weeks)
- Verify it appears straight and continuous in equirectangular output
- Check for seams at cubemap face boundaries

**Test 2: Pole Convergence**
- Place vertical lines radiating from center
- Verify they converge at top/bottom edges of equirect image
- Check for distortion near poles

**Test 3: 360° Coverage**
- Place markers at cardinal directions (+X, -X, +Y, -Y, +Z, -Z)
- Verify all markers visible in equirectangular output
- Confirm correct spatial relationships

**Test 4: Perspective Equivalence**
- Render same scene in perspective and equirectangular
- Sample corresponding regions from equirect
- Verify colors/geometry match (accounting for sampling differences)

### 9.2 Performance Benchmarks

**Target Metrics:**

| Resolution | Min FPS (Real-Time) | Export Time (1 frame) |
|------------|---------------------|------------------------|
| 2048×1024 | 15 fps | < 2 seconds |
| 4096×2048 | 10 fps | < 5 seconds |
| 8192×4096 | N/A (export-only) | < 20 seconds |

**Test Configurations:**
- Low complexity: 50 lines
- Medium complexity: 200 lines
- High complexity: 500 lines

**Hardware Targets:**
- MacBook Pro M1 (baseline)
- Windows desktop with RTX 3060 (mid-range)
- MacBook Air Intel (low-end)

### 9.3 SVG Export Validation

**Checklist:**
- ✅ All 6 face SVG files generated
- ✅ Each file opens in Illustrator without errors
- ✅ Vector paths editable (not rasterized)
- ✅ Colors preserved correctly
- ✅ Metadata.json contains complete camera state
- ✅ Face boundaries align correctly when viewed side-by-side

### 9.4 Cross-Platform Testing

**Browsers:**
- Chrome (Windows, macOS)
- Firefox (Windows, macOS)
- Safari (macOS, iOS)
- Edge (Windows)

**Devices:**
- Desktop (various resolutions: 1080p, 1440p, 4K)
- iPad/tablet (REVISED)

**Development Team:**
- 1× Senior Developer (lead): 40 hours/week × 3 weeks = **120 hours**
- 1× Junior Developer (testing/docs): 20 hours/week × 2 weeks = **40 hours**
- Total: **160 developer hours**

**Time Savings:** 50% reduction vs cubemap approach (160 vs 320 hours)**
- Render 360° scene
- Export 4096×2048 PNG
- Upload to YouTube 360° platform
- Verify playback in VR headset

**Scenario 2: Print Designer**
- Export 360° SVG cubemap
- Open in Adobe Illustrator
- Edit colors and line weights
- Verify editability preserved

**Scenario 3: Live Performance**
- Real-time 360° preview at 15+ fps
- Connect to fulldome projection system
- Verify smooth playback without frame drops

---

## 10. Timeline & Resources

### 10.1 Development Phases

| Phase | Duration | Deliverables | Risk Level |
|-------|----------|--------------|------------|
| **Phase 1: Core Rendering** | 1 week | Cubemap rendering, basic remapping | Medium |
| **Phase 2: Integration** | 1 week | UI controls, parameter system | Low |
| **Phase 3: SVG Export** | 1-2 weeks | Multi-face SVG export, ZIP packaging | High |
| **Phase 4: Optimization** | 1 week | Face culling, caching, Web Workers | Medium |
| **Phase 5: Testing & Polish** | 1 week | Cross-browser testing, docs, tutorials | Low |
| **Total** | **5-6 weeks** | Full 360° rendering system | |
 (REVISED)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Shader bugs (math errors)** | Low | Medium | Thorough testing, visual validation, unit tests for math |
| **Performance below 60fps** | Low | Medium | Resolution scaling, LOD system, adaptive quality |
| **Browser shader incompatibility** | Very Low | Low | p5.js abstracts WebGL differences, test early |
| **User confusion (no SVG in 360)** | Medium | Low | Clear UI messaging, documentation, perspective mode alternative |
| **Mobile GPU limitations** | Medium | Medium | Detect mobile, suggest lower resolutions, cap framerate |

**Risk Reduction:** Significantly lower risk than cubemap approach (no complex CPU remapping, no multi-file export)
- VR headset for testing (Oculus Quest 2): ~$300
- 360° video player software (free: VLC, online viewers)
- High-resolution test displays (existing)

**External Resources:**
- Mathematical validation (consult 3D graphics expert): 5 hours
- User testing (3 beta testers): 10 hours total
- Documentation writing (technical writer): 20 hours
 (REVISED)

**Technical:**
- ✅ 360° rendering at **60fps** (2K display resolution)
- ✅ 360° rendering at **30fps minimum** (4K display resolution)
- ✅ Zero visual artifacts or seams
- ✅ < 2 second export time for 4K frame
- ✅ PNG export up to 12K resolution without crashes Medium | Use multi-face export (Option A) as primary solution |
| **Browser compatibility issues** | Low | Medium | Test early and often on all target browsers |
| **User confusion with cubemap concept** | Medium | Low | Provide clear documentation, example files, video tutorials |
| **Memory limitations on mobile** | High | High | Implement resolution limits, warn users on constrained devices |

### 10.4 Success Metrics

**Technical:**
- ✅ 360° rendering at 10+ fps (4K output)
- ✅ SVG export preserves vector quality
- ✅ Zero visual artifacts at cubemap seams
- ✅ < 5 second export time for 4K frame

**User Experience:**
- ✅ 90%+ user satisfaction (beta testing survey)
- ✅ < 5 minutes learning curve (based on session recordings)
- ✅ < 5% support requests related to 360° mode

**Adoption:**
- ✅ 30%+ of presets use equirectangular mode within 3 months
- ✅ Featured in 2+ major installations/performances
- ✅ Positive community feedback (social media, forums)

---

## 11. Future Enhancements (Post-Launch)

### 11.1 Phase 2 Features (Optional)

**A. Adaptive Resolution:**
- Auto-scale cubemap resolution based on available GPU memory
- Dynamic quality adjustment to maintain target framerate

**B. Partial Cubemap Updates:**
- Only re-render faces with changed geometry
- Intelligent dirty flagging system

**C. Stereoscopic 360°:**
- Render two equirectangular outputs (left/right eye)
- Enable VR180 and VR360 3D video export

**D. Cubemap Caching:**
- Cache static parts of scene (if background/foreground separate)
- Dramatically improve performance for semi-static scenes

### 11.2 Advanced SVG Export

**Intelligent Path Stitching:**
- Analyze geometry topology across face boundaries
- Merge continuous paths split by cubemap faces
- Produce cleaner, more editable SVG output

**Depth-Based Layer Separation:**
- Export multiple SVG layers based on Z-depth
- Enable easier color/effect adjustments in Illustrator

### 11.3 Alternative Projections
 (REVISED)

Implementing 360° equirectangular projection in SpaceFlow is **technically straightforward** and delivers **exceptional performance**. The recommended approach—**custom GLSL shader**—provides:

- ✅ **Performance:** TRUE 60fps real-time rendering (same as perspective mode)
- ✅ **Quality:** Seamless, high-fidelity output with no artifacts
- ✅ **Simplicity:** Single render pass, minimal code complexity
- ✅ **Integration:** Works with existing geometry classes unchanged
- ✅ **Maintainability:** Clean separation via shader system
- ⚠️ **Trade-off:** No SVG export in 360° mode (perspective mode provides SVG)

### 12.2 Key Recommendations (REVISED)

1. **Implement Approach 3** (custom GLSL shader for equirectangular projection)
2. **Development timeline: 2-3 weeks** (160 developer hours)
3. **Target 60fps** at display resolutions (2K-4K)
4. **Focus on PNG/video export** (high-resolution, metadata-tagged)
5. **Clear UI messaging** (SVG available in perspective, not in 360°)

### 12.3 Critical Success Factors (REVISED)

- **Achieve 60fps performance** (primary goal, enabled by GPU shader)
- **Mathematical correctness** (thorough validation of spherical projection)
- **Seamless user experience** (smooth mode switching, intuitive controls)
- **VR platform compatibility** (proper metadata, tested on YouTube 360, Oculus Quest)
- **Preserve existing functionality** (perspective mode with SVG export untouched)

**Approval Required:**
- Confirm timeline (2-3 weeks) fits project schedule
- Allocate developer resources (160 hours)
- Acquire VR testing equipment ($300) — if not already available
- Accept trade-off: No SVG export in 360° mode

**Benefits of Revised Approach:**
- ⏱️ **50% faster development** (2-3 weeks vs 5-6 weeks)
- 💰 **50% lower cost** (160 hours vs 320 hours)
- 🚀 **600% better performance** (60fps vs 10fps)
- 🧠 **Lower complexity** (shader vs multi-pass rendering + CPU remapping)
- 💾 **75% less memory** (33MB vs 133MB for 4K)

---

**Document Status:** REVISED (2026-06-13) — Updated for 60fps requirement and SVG trade-off acceptance.

**Next Review Date:** 2026-06-20

**Contact:** Senior Development Team — SpaceFlow Project

---

## Appendix: Revision History

**Version 1.0** (2026-06-13 Initial)
- Recommended: Cubemap to equirectangular (Approach 2B)
- Target: 10fps real-time
- SVG export: Multi-face cubemap SVG files
- Timeline: 5-6 weeks, 320 hours

**Version 1.1** (2026-06-13 Revised)
- Recommended: Custom GLSL shader (Approach 3)
- Target: 60fps real-time
- SVG export: Not available in 360° mode (perspective only)
- Timeline: 2-3 weeks, 160 hours
- **Rationale:** Client confirmed 60fps requirement and accepted SVG trade-off for 360° mode

---

**Document Status:** Ready for technical review and stakeholder approval.

**Next Review Date:** 2026-06-20

**Contact:** Senior Development Team — SpaceFlow Project

---

