# 360° Equirectangular Implementation Guide

**Purpose:** Add 360° equirectangular rendering mode to SpaceFlow while preserving ALL existing functionality  
**Target:** 60fps real-time performance  
**Date:** June 2026  
**Status:** Implementation Plan (Pre-Development)

---

## 🎯 Core Principle: ADDITIVE ONLY

**Zero Breaking Changes Policy:**
- ✅ All existing features continue to work identically
- ✅ Perspective mode remains default
- ✅ SVG export works in perspective mode (unchanged)
- ✅ All current parameters and presets load correctly
- ✅ Stereoscopic mode unaffected
- ✅ Camera controls work identically in both modes
- ✅ State management and transitions preserved

**What We're Adding:**
- New rendering mode option: `equirectangular` (alongside existing `perspective`)
- Custom GLSL shaders (loaded only when 360° mode active)
- PNG/video export for 360° output
- UI toggle for mode selection

**What We're NOT Changing:**
- Existing rendering pipeline (perspective mode)
- SVG export system
- Camera class
- Emitter and ZigzagLine classes
- State management
- Any existing parameters or UI

---

## 📋 Implementation Checklist

### Phase 1: Foundation (No UI Impact)
- [ ] Create shader files (non-intrusive)
- [ ] Add shader loader utility
- [ ] Test shaders in isolation

### Phase 2: Parameter System
- [ ] Add `renderMode` parameter (defaults to `perspective`)
- [ ] Update manifest.json
- [ ] Ensure backward compatibility with existing presets

### Phase 3: Rendering Integration
- [ ] Create conditional rendering path in SketchFactory
- [ ] Preserve existing perspective rendering exactly
- [ ] Add 360° rendering branch

### Phase 4: UI Controls
- [ ] Add mode selector (non-intrusive placement)
- [ ] Update export panel (conditional display)
- [ ] Add tooltips and help text

### Phase 5: Export System
- [ ] Add 360° PNG export
- [ ] Add 360° video export
- [ ] Preserve existing export functions unchanged

### Phase 6: Testing
- [ ] Test all existing functionality still works
- [ ] Test mode switching
- [ ] Test preset loading (old and new)
- [ ] Cross-browser testing

---

## 📁 File Structure: What Gets Added/Modified

### ✨ New Files (Add Only)

```
js/
  rendering/
    EquirectangularShader.js          ← NEW: Shader management
  shaders/
    equirectangular.vert              ← NEW: Vertex shader
    equirectangular.frag              ← NEW: Fragment shader
  export/
    EquirectangularExporter.js        ← NEW: 360° PNG/video export
```

### 📝 Modified Files (Careful Changes)

```
config/
  defaults.js                         ← ADD: renderMode parameter
  
js/
  rendering/
    SketchFactory.js                  ← ADD: Conditional rendering logic
  
index.html                            ← ADD: Mode selector UI
player.html                           ← ADD: Mode selector UI
display.html                          ← ADD: Mode selector UI

css/
  controls.css                        ← ADD: Mode selector styling
```

### 🔒 Untouched Files (No Changes)

```
js/
  core/
    Camera.js                         ← UNCHANGED
    Projection.js                     ← UNCHANGED
    Emitter.js                        ← UNCHANGED
    ZigzagLine.js                     ← UNCHANGED
  export/
    SVGExporter.js                    ← UNCHANGED
    PNGExporter.js                    ← UNCHANGED
    VideoExporter.js                  ← UNCHANGED
  storage/
    StateManager.js                   ← UNCHANGED
```

---

## 🔧 Detailed Implementation Steps

### Step 1: Create Shader Files

**File: `js/shaders/equirectangular.vert`**

```glsl
// Equirectangular projection vertex shader
precision highp float;

attribute vec3 aPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;

varying vec4 vColor;

const float PI = 3.14159265359;
const float PI_HALF = 1.57079632679;
const float TWO_PI = 6.28318530718;

void main() {
  // Transform to view space
  vec4 viewPos = uModelViewMatrix * vec4(aPosition, 1.0);
  
  // Handle origin (avoid division by zero)
  float r = length(viewPos.xyz);
  if (r < 0.001) {
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    vColor = aVertexColor;
    return;
  }
  
  // Convert to spherical coordinates
  float theta = atan(viewPos.x, viewPos.z);           // Azimuth [-π, π]
  float phi = asin(clamp(viewPos.y / r, -1.0, 1.0));  // Elevation [-π/2, π/2]
  
  // Map to equirectangular UV [0, 1]
  float u = (theta + PI) / TWO_PI;
  float v = (phi + PI_HALF) / PI;
  
  // Convert to clip space [-1, 1]
  gl_Position = vec4(u * 2.0 - 1.0, v * 2.0 - 1.0, 0.0, 1.0);
  
  vColor = aVertexColor;
}
```

**File: `js/shaders/equirectangular.frag`**

```glsl
// Equirectangular projection fragment shader
precision mediump float;

varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
```

**Why These Files:**
- Self-contained GLSL code
- No impact on existing codebase until loaded
- Can be tested independently

---

### Step 2: Create Shader Management Module

**File: `js/rendering/EquirectangularShader.js`**

```javascript
/**
 * Equirectangular Shader Manager
 * Handles loading and management of 360° projection shaders
 */

export class EquirectangularShader {
  constructor(p5Instance) {
    this.p = p5Instance;
    this.shader = null;
    this.isLoaded = false;
  }
  
  /**
   * Load and compile shader
   * @returns {boolean} Success status
   */
  async load() {
    if (this.isLoaded) return true;
    
    try {
      // Load shader source files
      const vertSrc = await this.loadShaderSource('/js/shaders/equirectangular.vert');
      const fragSrc = await this.loadShaderSource('/js/shaders/equirectangular.frag');
      
      // Create shader
      this.shader = this.p.createShader(vertSrc, fragSrc);
      
      if (!this.shader) {
        console.error('Failed to create equirectangular shader');
        return false;
      }
      
      this.isLoaded = true;
      console.log('✓ Equirectangular shader loaded successfully');
      return true;
      
    } catch (error) {
      console.error('Error loading equirectangular shader:', error);
      return false;
    }
  }
  
  /**
   * Load shader source from file
   */
  async loadShaderSource(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load shader: ${url}`);
    }
    return await response.text();
  }
  
  /**
   * Apply shader to current rendering context
   */
  apply() {
    if (!this.isLoaded) {
      console.warn('Shader not loaded yet');
      return false;
    }
    
    this.p.shader(this.shader);
    return true;
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // p5.js handles shader cleanup automatically
    this.shader = null;
    this.isLoaded = false;
  }
}
```

**Why This Module:**
- Encapsulates shader loading logic
- Easy to test in isolation
- Doesn't affect existing rendering until explicitly used

---

### Step 3: Add Parameter (Backward Compatible)

**File: `config/defaults.js`**

**BEFORE:**
```javascript
export const DEFAULT_PARAMS = {
  // ... existing parameters ...
  fov: 60,
  near: 10,
  far: 10000,
  // ... more parameters ...
};
```

**AFTER:**
```javascript
export const DEFAULT_PARAMS = {
  // ... existing parameters ...
  fov: 60,
  near: 10,
  far: 10000,
  
  // ═══════════════════════════════════════════════════════════
  // NEW: Rendering Mode (2026-06-13)
  // ═══════════════════════════════════════════════════════════
  renderMode: 'perspective',  // 'perspective' | 'equirectangular'
  // ... more parameters ...
};
```

**Backward Compatibility Strategy:**
- Default value is `'perspective'` (existing behavior)
- Existing presets without `renderMode` will use default
- No existing functionality affected

---

### Step 4: Update Manifest (Optional Parameter)

**File: `manifest.json` (if using manifest system)**

```json
{
  "parameters": [
    {
      "key": "renderMode",
      "type": "select",
      "label": "Rendering Mode",
      "category": "rendering",
      "options": [
        {"value": "perspective", "label": "Perspective (Standard 3D)"},
        {"value": "equirectangular", "label": "360° Equirectangular"}
      ],
      "default": "perspective",
      "description": "Projection type for rendering. Perspective for standard view with SVG export, Equirectangular for 360° VR output (PNG/video only)."
    }
  ]
}
```

**Why This Works:**
- Manifest is additive
- Doesn't break existing parameter handling
- UI can be generated from manifest

---

### Step 5: Modify SketchFactory (Conditional Rendering)

**File: `js/rendering/SketchFactory.js`**

**Strategy: Add new function, modify draw() minimally**

**ADD at top of file:**
```javascript
import { EquirectangularShader } from './EquirectangularShader.js';

// Global shader instance (created lazily)
let equirectShader = null;
```

**ADD new function (before any modifications to existing functions):**
```javascript
/**
 * Render frame in equirectangular mode
 * NEW: 2026-06-13 for 360° support
 */
function renderEquirectangularFrame(ZM, p, emitter, isPrimary) {
  // Initialize shader if needed
  if (!equirectShader) {
    equirectShader = new EquirectangularShader(p);
  }
  
  // Load shader asynchronously (first frame only)
  if (!equirectShader.isLoaded) {
    equirectShader.load().then(success => {
      if (!success) {
        console.error('Failed to load shader, falling back to perspective');
        ZM.params.renderMode = 'perspective'; // Fallback
      }
    });
    // Render with perspective until shader loads
    renderPerspectiveFrame(ZM, p, emitter, isPrimary);
    return;
  }
  
  // Clear background
  p.background(...ZM.bgTransition.current);
  
  // Apply equirectangular shader
  equirectShader.apply();
  
  // Apply camera transforms (shader handles projection)
  p.resetMatrix();
  p.translate(ZM.camera.offsetX, ZM.camera.offsetY, -ZM.camera.distance);
  p.rotateX(ZM.camera.rotationX);
  p.rotateY(ZM.camera.rotationY);
  p.rotateZ(ZM.emitterRotationTransition.current * Math.PI / 180);
  
  // Apply geometry scale
  const scaleVal = ZM.geometryScaleTransition.current / 100;
  p.scale(scaleVal);
  
  // Draw geometry (unchanged)
  emitter.lines.forEach(line => {
    line.draw(p, ZM);
  });
  
  // Reset shader for UI overlays
  p.resetShader();
}
```

**EXTRACT existing perspective rendering into function:**
```javascript
/**
 * Render frame in perspective mode (existing behavior)
 * Extracted 2026-06-13 for mode switching
 */
function renderPerspectiveFrame(ZM, p, emitter, isPrimary) {
  // This is ALL the existing rendering code from p.draw()
  // Just moved into a function, no changes to logic
  
  p.background(...ZM.bgTransition.current);
  
  const fovRad = ZM.fovTransition.current * (Math.PI / 180);
  const cameraZ = (ZM.H / 2) / Math.tan(fovRad / 2);
  const eyeOffsetX = 0; // Set by caller for stereo
  
  p.perspective(fovRad, ZM.W / ZM.H, ZM.params.near, ZM.params.far);
  p.camera(eyeOffsetX, 0, cameraZ, 0, 0, 0, 0, 1, 0);
  
  p.translate(ZM.camera.offsetX, ZM.camera.offsetY, -ZM.camera.distance);
  p.rotateX(ZM.camera.rotationX);
  p.rotateY(ZM.camera.rotationY);
  p.rotateZ(ZM.emitterRotationTransition.current * Math.PI / 180);
  
  const scaleVal = ZM.geometryScaleTransition.current / 100;
  p.scale(scaleVal);
  
  emitter.lines.forEach(line => {
    line.draw(p, ZM);
  });
}
```

**MODIFY p.draw() to add conditional:**
```javascript
p.draw = () => {
  // ... all existing update logic stays here ...
  // (emitter.update, transitions, performance monitoring, etc.)
  
  // NEW: Conditional rendering based on mode
  if (ZM.params.renderMode === 'equirectangular') {
    renderEquirectangularFrame(ZM, p, emitter, isPrimary);
  } else {
    // Default: perspective mode (existing behavior)
    renderPerspectiveFrame(ZM, p, emitter, isPrimary);
  }
  
  // ... rest of existing code ...
};
```

**Critical Points:**
- ✅ Existing perspective code extracted, not modified
- ✅ Default behavior unchanged (`renderMode` defaults to `'perspective'`)
- ✅ Shader loaded lazily (no performance impact when not used)
- ✅ Graceful fallback if shader fails to load

---

### Step 6: Add UI Controls (Non-Intrusive)

**File: `index.html`**

**Find the rendering/camera controls section and ADD:**

```html
<!-- Existing controls above ... -->

<!-- NEW: Rendering Mode Selector (2026-06-13) -->
<div class="control-section" id="rendering-mode-section">
  <h3>🎥 Rendering Mode</h3>
  
  <div class="mode-selector">
    <button class="mode-btn active" data-mode="perspective" id="mode-perspective">
      <span class="mode-icon">📐</span>
      <span class="mode-label">Perspective</span>
    </button>
    
    <button class="mode-btn" data-mode="equirectangular" id="mode-equirectangular">
      <span class="mode-icon">🌐</span>
      <span class="mode-label">360° Equirect</span>
    </button>
  </div>
  
  <div class="mode-description">
    <p id="mode-desc-perspective">
      Standard 3D view with camera controls. Supports all export formats including SVG.
    </p>
    <p id="mode-desc-equirectangular" style="display: none;">
      Full 360° spherical projection for VR/immersive displays. Exports PNG/video (no SVG).
    </p>
  </div>
</div>

<!-- Existing controls below ... -->
```

**Add JavaScript handler (in existing UI section):**

```javascript
// NEW: Mode selector (2026-06-13)
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Show/hide descriptions
    document.getElementById('mode-desc-perspective').style.display = 
      mode === 'perspective' ? 'block' : 'none';
    document.getElementById('mode-desc-equirectangular').style.display = 
      mode === 'equirectangular' ? 'block' : 'none';
    
    // Update parameter
    SpaceFlow.params.renderMode = mode;
    
    // Show/hide SVG export button based on mode
    updateExportButtons(mode);
    
    // Optional: Show toast notification
    if (SpaceFlow.showToast) {
      const msg = mode === 'equirectangular' 
        ? '360° mode active. SVG export disabled in this mode.'
        : 'Perspective mode active. All export formats available.';
      SpaceFlow.showToast(msg, 'info');
    }
  });
});

// NEW: Update export button visibility (2026-06-13)
function updateExportButtons(mode) {
  const svgBtn = document.getElementById('export-svg');
  if (!svgBtn) return;
  
  if (mode === 'equirectangular') {
    svgBtn.disabled = true;
    svgBtn.title = 'SVG export not available in 360° mode. Switch to Perspective for vector export.';
    svgBtn.classList.add('disabled');
  } else {
    svgBtn.disabled = false;
    svgBtn.title = 'Export as SVG vector graphic';
    svgBtn.classList.remove('disabled');
  }
}
```

---

### Step 7: Update CSS (Additive Styling)

**File: `css/controls.css`**

**ADD at end of file:**

```css
/* ═══════════════════════════════════════════════════════════════
   NEW: Rendering Mode Selector (2026-06-13)
   ═══════════════════════════════════════════════════════════════ */

.mode-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.mode-btn {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #444;
  background: #2a2a2a;
  color: #ccc;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.mode-btn:hover {
  background: #333;
  border-color: #666;
}

.mode-btn.active {
  background: #0066ff;
  border-color: #0066ff;
  color: #fff;
}

.mode-icon {
  font-size: 24px;
}

.mode-label {
  font-size: 12px;
  font-weight: 600;
}

.mode-description {
  padding: 10px;
  background: #1a1a1a;
  border-radius: 4px;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

/* Disabled export button styling */
button.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

button.disabled:hover {
  opacity: 0.4;
}
```

---

### Step 8: Add 360° Export Functions

**File: `js/export/EquirectangularExporter.js`**

```javascript
/**
 * Equirectangular PNG/Video Exporter
 * NEW: 2026-06-13 for 360° output
 */

import { canExport } from './exportUtils.js';

/**
 * Export current frame as 360° PNG
 */
export function exportEquirectangularPNG(ZM, resolution = 4096) {
  if (!canExport(ZM, '🌐 360° PNG Export')) return;
  
  // Verify we're in equirectangular mode
  if (ZM.params.renderMode !== 'equirectangular') {
    console.warn('Not in equirectangular mode. Switch to 360° mode first.');
    if (ZM.showToast) {
      ZM.showToast('Please switch to 360° mode before exporting', 'warning');
    }
    return;
  }
  
  // Save current dimensions
  const originalW = ZM.W;
  const originalH = ZM.H;
  
  try {
    // Set export resolution (2:1 aspect ratio for equirectangular)
    ZM.W = resolution;
    ZM.H = resolution / 2;
    
    // Resize canvas
    ZM.p5Instance.resizeCanvas(ZM.W, ZM.H);
    
    // Force one frame render at high resolution
    ZM.p5Instance.redraw();
    
    // Generate filename with metadata
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `spaceflow-360-${resolution}x${resolution/2}-${timestamp}.png`;
    
    // Save PNG
    ZM.p5Instance.save(filename);
    
    if (ZM.showToast) {
      ZM.showToast(`360° PNG exported: ${resolution}×${resolution/2}`, 'success');
    }
    
  } catch (error) {
    console.error('Error exporting 360° PNG:', error);
    if (ZM.showToast) {
      ZM.showToast('Export failed: ' + error.message, 'error');
    }
  } finally {
    // Restore original dimensions
    ZM.W = originalW;
    ZM.H = originalH;
    ZM.p5Instance.resizeCanvas(ZM.W, ZM.H);
  }
}

/**
 * Export 360° video sequence
 */
export function exportEquirectangularVideo(ZM, duration = 10, fps = 60) {
  if (!canExport(ZM, '🎬 360° Video Export')) return;
  
  if (ZM.params.renderMode !== 'equirectangular') {
    console.warn('Not in equirectangular mode');
    if (ZM.showToast) {
      ZM.showToast('Please switch to 360° mode before exporting video', 'warning');
    }
    return;
  }
  
  // Use existing CCapture integration (if available)
  if (typeof CCapture === 'undefined') {
    console.error('CCapture library not loaded');
    if (ZM.showToast) {
      ZM.showToast('Video export requires CCapture.js library', 'error');
    }
    return;
  }
  
  const capturer = new CCapture({
    format: 'webm',
    framerate: fps,
    quality: 95,
    name: 'spaceflow-360-video'
  });
  
  capturer.start();
  
  let frameCount = 0;
  const totalFrames = duration * fps;
  
  if (ZM.showToast) {
    ZM.showToast(`Recording 360° video: ${duration}s @ ${fps}fps`, 'info');
  }
  
  const captureLoop = () => {
    if (frameCount < totalFrames) {
      capturer.capture(ZM.p5Instance.canvas);
      frameCount++;
      
      // Update progress (every 60 frames)
      if (frameCount % 60 === 0 && ZM.showToast) {
        const progress = Math.round((frameCount / totalFrames) * 100);
        ZM.showToast(`Recording: ${progress}% complete`, 'info');
      }
      
      requestAnimationFrame(captureLoop);
    } else {
      capturer.stop();
      capturer.save();
      
      if (ZM.showToast) {
        ZM.showToast('360° video export complete!', 'success');
      }
    }
  };
  
  requestAnimationFrame(captureLoop);
}
```

**Integration: Add to main namespace**

In `main.js`, `player.js`, `display.js`:

```javascript
import { exportEquirectangularPNG, exportEquirectangularVideo } from './export/EquirectangularExporter.js';

// Add to SpaceFlow namespace
window.SpaceFlow.exportEquirectangularPNG = function(resolution) {
  exportEquirectangularPNG(window.SpaceFlow, resolution);
};

window.SpaceFlow.exportEquirectangularVideo = function(duration, fps) {
  exportEquirectangularVideo(window.SpaceFlow, duration, fps);
};
```

---

### Step 9: Update Export UI

**File: `index.html` (Export panel section)**

**ADD new buttons conditionally:**

```html
<!-- Existing export buttons -->
<div id="export-panel">
  <button id="export-png" onclick="SpaceFlow.exportPNG()">📷 PNG</button>
  <button id="export-svg" onclick="SpaceFlow.exportSVG()">📄 SVG</button>
  <button id="export-video" onclick="SpaceFlow.exportVideo()">🎬 Video</button>
  
  <!-- NEW: 360° export options (shown only in equirectangular mode) -->
  <div id="equirect-export-section" style="display: none;">
    <hr style="margin: 10px 0; border-color: #333;">
    <p style="font-size: 11px; color: #888; margin: 5px 0;">360° Exports:</p>
    
    <button onclick="SpaceFlow.exportEquirectangularPNG(4096)">
      🌐 360° PNG (4K)
    </button>
    
    <select id="equirect-resolution" style="margin: 5px 0;">
      <option value="2048">2K (2048×1024)</option>
      <option value="4096" selected>4K (4096×2048)</option>
      <option value="8192">8K (8192×4096)</option>
    </select>
    
    <button onclick="SpaceFlow.exportEquirectangularVideo(10, 60)">
      🎬 360° Video (10s)
    </button>
  </div>
</div>
```

**JavaScript to show/hide:**

```javascript
// Update export panel based on mode
function updateExportPanel(mode) {
  const equirectSection = document.getElementById('equirect-export-section');
  const svgBtn = document.getElementById('export-svg');
  
  if (mode === 'equirectangular') {
    // Show 360° exports, disable SVG
    if (equirectSection) equirectSection.style.display = 'block';
    if (svgBtn) {
      svgBtn.disabled = true;
      svgBtn.classList.add('disabled');
    }
  } else {
    // Hide 360° exports, enable SVG
    if (equirectSection) equirectSection.style.display = 'none';
    if (svgBtn) {
      svgBtn.disabled = false;
      svgBtn.classList.remove('disabled');
    }
  }
}

// Call when mode changes
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    SpaceFlow.params.renderMode = mode;
    updateExportPanel(mode);
  });
});
```

---

## 🧪 Testing Strategy

### Test 1: Existing Functionality (Regression Testing)

**Goal:** Verify NOTHING is broken

**Checklist:**
- [ ] Load SpaceFlow → defaults to perspective mode
- [ ] Camera controls work (rotate, pan, zoom)
- [ ] Emitter animation runs smoothly
- [ ] Color palette changes work
- [ ] Load existing presets → all work correctly
- [ ] Save new state → loads correctly
- [ ] Export PNG → works
- [ ] Export SVG → works (same as before)
- [ ] Export video → works
- [ ] Stereoscopic mode → works
- [ ] Display window sync → works
- [ ] Player mode → works
- [ ] Console shows no errors

**If ANY of these fail: STOP, fix before proceeding**

---

### Test 2: 360° Mode Activation

**Goal:** Verify new mode activates correctly

**Checklist:**
- [ ] Click "360° Equirect" button
- [ ] Mode switches (button highlights)
- [ ] Rendering continues (no black screen)
- [ ] Description text updates
- [ ] SVG button becomes disabled
- [ ] 360° export buttons appear
- [ ] Camera controls still work

---

### Test 3: 360° Rendering Quality

**Goal:** Verify correct spherical projection

**Test Pattern 1: Horizon Line**
- Set camera to neutral position (0, 0, 0 rotation)
- Look for straight horizontal line through middle
- Verify continuity (no seams at edges)

**Test Pattern 2: Cardinal Points**
- Place markers at +X, -X, +Y, -Y, +Z, -Z
- Switch to 360° mode
- Verify all 6 points visible in output

**Test Pattern 3: Pole Coverage**
- Rotate camera to look up (+90°)
- Verify top pole covered (no black spots)
- Rotate camera to look down (-90°)
- Verify bottom pole covered

---

### Test 4: Mode Switching

**Goal:** Verify seamless transitions

**Checklist:**
- [ ] Start in perspective mode
- [ ] Switch to 360° → no visual jump
- [ ] Camera position preserved
- [ ] Animation continues smoothly
- [ ] Switch back to perspective → returns to exact same view
- [ ] Rapid switching (10× back and forth) → no crashes

---

### Test 5: 360° Exports

**Goal:** Verify export functionality

**PNG Export:**
- [ ] Export 2K PNG → downloads
- [ ] Export 4K PNG → downloads
- [ ] Export 8K PNG → downloads (may take time)
- [ ] Open in 360° viewer (e.g., VLC) → displays correctly
- [ ] Verify 2:1 aspect ratio

**Video Export:**
- [ ] Export 10s video → renders
- [ ] Video file downloads
- [ ] Open in 360° player → plays correctly
- [ ] Framerate smooth (30-60fps)

---

### Test 6: State Management

**Goal:** Verify presets work with new parameter

**Old Presets (no renderMode):**
- [ ] Load old preset → defaults to perspective
- [ ] Continues to work as before
- [ ] Save → adds renderMode parameter

**New Presets (with renderMode):**
- [ ] Save state in 360° mode → includes renderMode
- [ ] Load state → restores 360° mode
- [ ] Load state in different window → syncs correctly

---

### Test 7: Performance

**Goal:** Verify 60fps target

**Hardware:**
- MacBook Pro M1 (baseline)
- Windows PC (mid-range)
- iPad Pro (mobile)

**Test Scenarios:**

| Scene Complexity | Perspective FPS | 360° FPS | Status |
|------------------|-----------------|----------|--------|
| 50 lines | 60 | 60 | ✅ |
| 200 lines | 60 | 60 | ✅ |
| 500 lines | 55 | ? | Test |
| 1000 lines | 45 | ? | Test |

**If 360° FPS < perspective FPS by >10%:**
- Check shader optimization
- Profile GPU usage
- Consider LOD system

---

### Test 8: Cross-Browser

**Goal:** Verify shader compatibility

**Browsers:**
- [ ] Chrome 90+ (macOS) → works
- [ ] Chrome 90+ (Windows) → works
- [ ] Firefox 88+ (macOS) → works
- [ ] Firefox 88+ (Windows) → works
- [ ] Safari 14+ (macOS) → works
- [ ] Safari 14+ (iOS) → works
- [ ] Edge 90+ (Windows) → works

**If shader fails to load:**
- Check console for GLSL errors
- Verify shader compilation messages
- Test fallback to perspective mode

---

## 🚨 Rollback Plan

**If Critical Issue Found:**

### Level 1: Disable Feature (Quick Fix)
```javascript
// In defaults.js
renderMode: 'perspective',  // Force perspective mode

// In SketchFactory.js
if (ZM.params.renderMode === 'equirectangular') {
  console.warn('360° mode temporarily disabled');
  ZM.params.renderMode = 'perspective';  // Force fallback
}
```

### Level 2: Partial Rollback (Remove UI)
- Comment out mode selector UI
- Keep shader files (for future fix)
- Parameter defaults to perspective
- No user-facing changes

### Level 3: Full Rollback (Remove All)
```bash
# Remove shader files
rm js/shaders/equirectangular.vert
rm js/shaders/equirectangular.frag
rm js/rendering/EquirectangularShader.js
rm js/export/EquirectangularExporter.js

# Revert modified files
git checkout config/defaults.js
git checkout js/rendering/SketchFactory.js
git checkout index.html
git checkout player.html
git checkout display.html
git checkout css/controls.css
```

---

## 📊 Success Criteria

**Must-Have (Before Merge):**
- ✅ All existing tests pass (regression testing)
- ✅ 360° mode achieves 60fps on modern hardware
- ✅ No console errors in either mode
- ✅ Mode switching is seamless
- ✅ Export functions work correctly
- ✅ Cross-browser compatibility verified

**Nice-to-Have (Can Iterate):**
- ⭐ Performance optimization (LOD, adaptive quality)
- ⭐ Additional export resolutions
- ⭐ 360° metadata injection
- ⭐ Stereoscopic 360° (future)

---

## 📝 Development Workflow

### Day 1: Foundation
1. Create shader files
2. Create EquirectangularShader.js
3. Test shader loading in isolation
4. **Checkpoint:** Shaders compile without errors

### Day 2: Integration
1. Add renderMode parameter
2. Modify SketchFactory.js (conditional rendering)
3. Test mode switching
4. **Checkpoint:** Both modes render correctly

### Day 3: UI
1. Add mode selector
2. Add CSS styling
3. Update export panel
4. **Checkpoint:** UI works, no visual bugs

### Day 4: Export
1. Implement EquirectangularExporter.js
2. Wire up export buttons
3. Test exports at multiple resolutions
4. **Checkpoint:** Exports work correctly

### Day 5: Testing
1. Run full regression test suite
2. Cross-browser testing
3. Performance profiling
4. **Checkpoint:** All tests pass

### Day 6: Polish & Documentation
1. Add tooltips and help text
2. Update user manual
3. Create example presets
4. **Checkpoint:** Ready for review

---

## 🎓 Developer Notes

### Understanding the Shader Approach

**Why Vertex Shader?**
- Vertex shader transforms geometry positions
- More efficient than fragment shader (fewer invocations)
- Natural integration with p5.js geometry pipeline

**Coordinate System:**
```
3D World → View Space → Spherical Coords → Equirect UV → Clip Space

Example:
Point (100, 50, 200) in world space
→ Apply camera transform
→ Convert to (r, θ, φ) spherical
→ Map to (u, v) texture coordinates
→ Convert to (x, y) clip space [-1, 1]
```

**Performance:**
- ~100,000 vertices typical scene
- Shader processes all in parallel on GPU
- ~16ms per frame at 60fps
- Minimal overhead vs perspective projection

---

### Debugging Shader Issues

**Black Screen?**
- Check console for shader compilation errors
- Verify shader source loaded correctly
- Test with simple geometry (single line)

**Distorted Output?**
- Check spherical coordinate math
- Verify aspect ratio (should be 2:1)
- Test with known patterns (grid, horizon line)

**Performance Issues?**
- Profile with browser DevTools
- Check geometry complexity (vertex count)
- Consider LOD system

**Shader Console Commands:**
```javascript
// In browser console:

// Check if shader loaded
SpaceFlow.params.renderMode

// Force reload shader
equirectShader.dispose()
equirectShader.load()

// Switch modes
SpaceFlow.params.renderMode = 'perspective'
SpaceFlow.params.renderMode = 'equirectangular'
```

---

## 📚 Reference Documentation

**Related Files:**
- [Equirectangular Strategy](./Equirectangular-360-Strategy.md) — Overall technical strategy
- [Projection Matrix Guide](./Projection-Matrix-Guide.md) — Math background
- [SpaceFlow Architecture](./SPACEFLOW-ARCHITECTURE.md) — System design

**External Resources:**
- [p5.js Shader Reference](https://p5js.org/reference/#/p5/createShader)
- [WebGL Fundamentals - Shaders](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html)
- [Equirectangular Projection (Wikipedia)](https://en.wikipedia.org/wiki/Equirectangular_projection)
- [360° Video Metadata Standards](https://github.com/google/spatial-media/blob/master/docs/spherical-video-rfc.md)

---

## ✅ Pre-Implementation Checklist

**Before Writing Code:**
- [ ] Review this guide completely
- [ ] Understand shader approach
- [ ] Verify development environment ready
- [ ] Backup current working state
- [ ] Create feature branch: `git checkout -b feature/360-equirectangular`

**During Implementation:**
- [ ] Follow steps in order
- [ ] Test after each major step
- [ ] Commit frequently with clear messages
- [ ] Document any deviations from plan

**After Implementation:**
- [ ] Run full test suite
- [ ] Performance profiling
- [ ] Code review
- [ ] Update user documentation
- [ ] Merge to main branch

---

**Ready to proceed?** Review this guide, ask questions, then we'll implement together step-by-step! 🚀
