# SpaceFlow — 360° Rendering Mode: GUI & Canvas Integration Strategy

**Author:** Technical Architecture Team  
**Date:** June 2026  
**Status:** Implementation Blueprint  
**Version:** 1.0

---

## Executive Summary

This document provides the **implementation strategy** for integrating 360° equirectangular rendering into SpaceFlow's existing GUI and canvas architecture **without breaking existing functionality**. 

**Key Design Principles:**
- ✅ **Additive, not destructive** — Add new features alongside existing ones
- ✅ **Backward compatible** — All existing presets/states continue to work
- ✅ **State preservation** — Animation continues smoothly when switching modes
- ✅ **Clear user feedback** — UI adapts to show/hide features based on mode

**Rendering Modes (After Implementation):**
1. **Perspective** — Standard 3D rendering (existing, default)
2. **Stereoscopic** — Side-by-side VR (existing)
3. **Equirectangular 360°** — NEW: Full sphere projection for VR/panoramic displays

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Integration Strategy](#2-integration-strategy)
3. [GUI Changes](#3-gui-changes)
4. [Canvas & Rendering Changes](#4-canvas--rendering-changes)
5. [State Management & Switching](#5-state-management--switching)
6. [Export Panel Integration](#6-export-panel-integration)
7. [Backward Compatibility](#7-backward-compatibility)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. Current Architecture Analysis

### 1.1 Current Rendering Modes

SpaceFlow currently supports **two rendering modes**:

| Mode | Canvas Setup | Use Case |
|------|--------------|----------|
| **Mono (Perspective)** | Single canvas, standard perspective projection | Default, desktop, exports (PNG/SVG/video) |
| **Stereoscopic** | Two canvases (left/right), offset cameras | VR headsets, side-by-side 3D |

**How Mode Switching Works Today:**

```javascript
// In js/rendering/SketchFactory.js - initializeSketches()

if (ZM.params.stereoscopicMode) {
  // STEREO: Create 2 canvases with eye separation
  ZM.W = Math.floor(window.innerWidth / 2);
  ZM.p5Instance = new p5(createSketch(ZM, -eyeSep / 100, 'left-canvas'));
  ZM.p5InstanceRight = new p5(createSketch(ZM, eyeSep / 100, 'right-canvas'));
} else {
  // MONO: Single canvas, center view
  ZM.W = window.innerWidth;
  ZM.p5Instance = new p5(createSketch(ZM, 0, 'mono-canvas'));
}
```

**Key Insight:** The system already handles dynamic canvas recreation and emitter preservation during mode switches. We can leverage this pattern for 360° mode.

---

### 1.2 Current GUI Structure

**Rendering Section (index.html lines 83-130):**

```html
<div class="section">
  <div class="section-header" data-section="rendering">
    <span class="section-title">Rendering</span>
  </div>
  <div class="section-content">
    <label><input type="checkbox" id="framebuffer-mode">Framebuffer Resolution</label>
    <label><input type="checkbox" id="stereoscopic-mode">Stereoscopic View (VR)</label>
    <label>Eye Separation</label>
    <input type="range" id="eye-separation" min="0" max="100" value="30"/>
  </div>
</div>
```

**Export Section (index.html lines 133-157):**

```html
<div class="section">
  <div class="section-header" data-section="export">
    <span class="section-title">Export</span>
  </div>
  <div class="section-content">
    <button id="export-png">Export PNG</button>
    <button id="export-svg">Export SVG</button>
    <button id="export-video">Export Video</button>
  </div>
</div>
```

---

### 1.3 Parameter System

**Parameters live in:** `js/config/defaults.js`

```javascript
export const DEFAULT_PARAMS = {
  // Existing rendering mode
  stereoscopicMode: false,
  eyeSeparation: 30,
  
  // Framebuffer
  framebufferMode: false,
  framebufferWidth: 1920,
  framebufferHeight: 1080,
  
  // Camera
  fov: 60,
  cameraDistance: 600,
  // ... etc
};
```

**How parameters are used:**
- Loaded from presets/states (JSON files)
- Modified by UI controls
- Saved to localStorage
- Passed to rendering engine

---

## 2. Integration Strategy

### 2.1 Add New Parameter: `renderMode`

**Instead of adding another checkbox**, we'll introduce a **single mode selector** that replaces the stereoscopic checkbox.

**New parameter in `defaults.js`:**

```javascript
export const DEFAULT_PARAMS = {
  // NEW: Unified rendering mode selector
  renderMode: 'perspective',  // 'perspective' | 'stereoscopic' | 'equirectangular'
  
  // KEEP: Mode-specific settings
  eyeSeparation: 30,  // For stereoscopic
  // (equirectangular has no specific settings - uses framebuffer resolution)
  
  // ... existing params ...
};
```

**Why this approach?**
- ✅ Clean: One parameter instead of multiple conflicting flags
- ✅ Scalable: Easy to add more modes in future (e.g., fisheye, cylindrical)
- ✅ Clear: Modes are mutually exclusive, not boolean combinations
- ✅ Backward compatible: Default is `'perspective'` (existing behavior)

---

### 2.2 Update Existing `stereoscopicMode` Parameter

**For backward compatibility with old presets:**

```javascript
// In main.js - when loading presets/states
if ('stereoscopicMode' in loadedParams) {
  // Convert old boolean to new renderMode string
  ZM.params.renderMode = loadedParams.stereoscopicMode ? 'stereoscopic' : 'perspective';
  delete loadedParams.stereoscopicMode; // Remove old param
}
```

---

## 3. GUI Changes

### 3.1 Replace Stereoscopic Checkbox with Mode Selector

**Current HTML (lines ~115-117):**

```html
<label><input type="checkbox" id="stereoscopic-mode">Stereoscopic View (VR)</label>
```

**New HTML (radio buttons or select dropdown):**

**Option A: Radio Buttons (Recommended - Visual, Clear)**

```html
<div class="control-group">
  <label style="font-weight:500;margin-bottom:6px;display:block;">Rendering Mode</label>
  <div style="display:flex;flex-direction:column;gap:6px;">
    <label style="font-weight:normal;cursor:pointer;">
      <input type="radio" name="render-mode" value="perspective" id="mode-perspective" checked>
      Perspective (Standard)
    </label>
    <label style="font-weight:normal;cursor:pointer;">
      <input type="radio" name="render-mode" value="stereoscopic" id="mode-stereoscopic">
      Stereoscopic (Side-by-Side VR)
    </label>
    <label style="font-weight:normal;cursor:pointer;">
      <input type="radio" name="render-mode" value="equirectangular" id="mode-equirectangular">
      360° Equirectangular
    </label>
  </div>
</div>

<!-- Eye Separation (only visible in stereoscopic mode) -->
<div class="control-group" id="eye-separation-group">
  <label>Eye Separation</label>
  <div class="slider-row">
    <input type="range" id="eye-separation" min="0" max="100" value="30"/>
    <span class="value-display" id="eye-separation-val">30</span>
  </div>
</div>
```

**Option B: Dropdown (Compact, if space is limited)**

```html
<div class="control-group">
  <label>Rendering Mode</label>
  <select id="render-mode-select" style="width:100%;background:#1a1a1a;border:1px solid #333;color:#ccc;padding:6px;border-radius:3px;font-size:0.85rem;">
    <option value="perspective">Perspective (Standard)</option>
    <option value="stereoscopic">Stereoscopic (VR)</option>
    <option value="equirectangular">360° Equirectangular</option>
  </select>
</div>
```

**Recommendation:** Use **Option A (Radio Buttons)** — more visual, matches existing UI style, clearer for users.

---

### 3.2 UI Controller Changes

**File:** `js/ui/UIController.js`

**Add event listener for mode selector:**

```javascript
// In initializeUI() function

function setupRenderingModeSelector(ZM) {
  const modeRadios = document.querySelectorAll('input[name="render-mode"]');
  const eyeSeparationGroup = document.getElementById('eye-separation-group');
  
  // Set initial state from params
  const currentMode = ZM.params.renderMode || 'perspective';
  document.getElementById(`mode-${currentMode}`).checked = true;
  
  // Show/hide eye separation based on mode
  eyeSeparationGroup.style.display = (currentMode === 'stereoscopic') ? 'block' : 'none';
  
  // Listen for mode changes
  modeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        const newMode = e.target.value;
        console.log(`🎬 Rendering mode changed: ${ZM.params.renderMode} → ${newMode}`);
        
        ZM.params.renderMode = newMode;
        
        // Show/hide mode-specific controls
        eyeSeparationGroup.style.display = (newMode === 'stereoscopic') ? 'block' : 'none';
        
        // Update export button states (SVG disabled in 360° mode)
        updateExportButtonStates(ZM);
        
        // Recreate canvases with new mode
        ZM.initializeSketches();
        
        // Save to localStorage
        ZM.saveToLocalStorage();
      }
    });
  });
}

// Call in initializeUI()
export function initializeUI(ZM) {
  setupRenderingModeSelector(ZM);
  // ... existing setup functions ...
}
```

---

## 4. Canvas & Rendering Changes

### 4.1 Extend `initializeSketches()` Function

**File:** `js/rendering/SketchFactory.js`

**Current logic:**

```javascript
if (ZM.params.stereoscopicMode) {
  // Stereo: 2 canvases
} else {
  // Mono: 1 canvas
}
```

**New logic:**

```javascript
export function initializeSketches(ZM) {
  // ... existing cleanup code ...
  
  const mode = ZM.params.renderMode || 'perspective';
  console.log('🎬 initializeSketches - renderMode:', mode);
  
  const wrapper = document.getElementById('canvas-wrapper');
  
  // ===== MODE SWITCHING =====
  
  if (mode === 'stereoscopic') {
    // === STEREOSCOPIC MODE (existing code) ===
    ZM.W = Math.floor(window.innerWidth / 2);
    ZM.H = window.innerHeight;
    
    wrapper.innerHTML = '';
    wrapper.classList.add('stereoscopic');
    
    // Create side-by-side canvases
    const container = document.createElement('div');
    container.className = 'stereo-container';
    
    ['left', 'right'].forEach(side => {
      const eye = document.createElement('div');
      eye.className = 'stereo-eye';
      eye.id = `${side}-eye-container`;
      const canvasDiv = document.createElement('div');
      canvasDiv.id = `${side}-canvas`;
      eye.appendChild(canvasDiv);
      container.appendChild(eye);
    });
    
    wrapper.appendChild(container);
    
    const eyeSep = ZM.params.eyeSeparation;
    ZM.p5Instance = new p5(createSketch(ZM, -eyeSep / 100, 'left-canvas'));
    ZM.p5InstanceRight = new p5(createSketch(ZM, eyeSep / 100, 'right-canvas'));
    
  } else if (mode === 'equirectangular') {
    // === EQUIRECTANGULAR 360° MODE (new) ===
    
    // Use framebuffer dimensions if enabled, otherwise window size
    if (ZM.params.framebufferMode) {
      ZM.W = ZM.params.framebufferWidth;
      ZM.H = ZM.params.framebufferHeight;
    } else {
      ZM.W = window.innerWidth;
      ZM.H = window.innerHeight;
    }
    
    // IMPORTANT: Enforce 2:1 aspect ratio for equirectangular
    // Warn user if aspect ratio is not 2:1
    const aspectRatio = ZM.W / ZM.H;
    if (Math.abs(aspectRatio - 2.0) > 0.1) {
      console.warn(`⚠️ Equirectangular mode works best with 2:1 aspect ratio`);
      console.warn(`   Current: ${ZM.W}x${ZM.H} (${aspectRatio.toFixed(2)}:1)`);
      console.warn(`   Recommended: ${ZM.H * 2}x${ZM.H} (2:1)`);
    }
    
    wrapper.innerHTML = '';
    wrapper.classList.remove('stereoscopic');
    wrapper.classList.add('equirectangular');
    
    const canvasDiv = document.createElement('div');
    canvasDiv.id = 'equirect-canvas';
    wrapper.appendChild(canvasDiv);
    
    // Create sketch with equirectangular shader enabled
    ZM.p5Instance = new p5(createSketch(ZM, 0, 'equirect-canvas', { useEquirectShader: true }));
    ZM.p5InstanceRight = null; // No second canvas
    
  } else {
    // === PERSPECTIVE MODE (existing mono code) ===
    ZM.W = window.innerWidth;
    ZM.H = window.innerHeight;
    
    wrapper.innerHTML = '';
    wrapper.classList.remove('stereoscopic', 'equirectangular');
    
    const canvasDiv = document.createElement('div');
    canvasDiv.id = 'mono-canvas';
    wrapper.appendChild(canvasDiv);
    
    ZM.p5Instance = new p5(createSketch(ZM, 0, 'mono-canvas'));
    ZM.p5InstanceRight = null;
  }
  
  // ... existing framebuffer sizing code ...
}
```

---

### 4.2 Modify `createSketch()` to Support Shader Mode

**Current signature:**

```javascript
export function createSketch(ZM, eyeOffset = 0, canvasId = 'left-canvas') {
  // ...
}
```

**New signature:**

```javascript
export function createSketch(ZM, eyeOffset = 0, canvasId = 'left-canvas', options = {}) {
  const { useEquirectShader = false } = options;
  
  return (p) => {
    let emitter = null;
    let equirectShader = null; // NEW: Shader instance
    
    p.setup = () => {
      // ... existing setup code ...
      
      // NEW: Load equirectangular shader if needed
      if (useEquirectShader) {
        console.log('🔧 Loading equirectangular shader...');
        equirectShader = loadEquirectShader(p);
        if (!equirectShader) {
          console.error('❌ Failed to load equirectangular shader - falling back to perspective');
        } else {
          console.log('✓ Equirectangular shader loaded');
        }
      }
      
      // ... rest of setup ...
    };
    
    p.draw = () => {
      // ... existing time/transition updates ...
      
      // Clear background
      p.background(...ZM.bgTransition.current);
      
      // === RENDERING LOGIC ===
      
      if (useEquirectShader && equirectShader) {
        // **360° EQUIRECTANGULAR RENDERING**
        renderEquirectangularFrame(p, ZM, emitter, equirectShader);
      } else {
        // **STANDARD PERSPECTIVE RENDERING** (existing code)
        renderPerspectiveFrame(p, ZM, emitter, eyeOffset);
      }
      
      // ... performance monitoring ...
    };
    
    return p;
  };
}
```

---

### 4.3 Create Rendering Functions

**Add to SketchFactory.js:**

```javascript
/**
 * Standard perspective rendering (existing logic)
 */
function renderPerspectiveFrame(p, ZM, emitter, eyeOffset) {
  // Setup camera with FOV
  const fovRad = ZM.fovTransition.current * (Math.PI / 180);
  const cameraZ = (ZM.H / 2) / Math.tan(fovRad / 2);
  const eyeOffsetX = eyeOffset * ZM.params.eyeSeparation;
  
  p.perspective(fovRad, ZM.W / ZM.H, ZM.params.near, ZM.params.far);
  p.camera(eyeOffsetX, 0, cameraZ, 0, 0, 0, 0, 1, 0);
  
  // Apply camera transforms
  p.translate(ZM.camera.offsetX, ZM.camera.offsetY, -ZM.camera.distance);
  p.rotateX(ZM.camera.rotationX);
  p.rotateY(ZM.camera.rotationY);
  p.rotateZ(ZM.emitterRotationTransition.current * Math.PI / 180);
  
  // Apply geometry scale
  const scaleVal = ZM.geometryScaleTransition.current / 100;
  p.scale(scaleVal);
  
  // Draw all lines
  emitter.lines.forEach(line => line.draw(p, ZM));
}

/**
 * Equirectangular 360° rendering (new)
 */
function renderEquirectangularFrame(p, ZM, emitter, shader) {
  // Activate the custom shader
  p.shader(shader);
  
  // Pass uniforms to shader
  shader.setUniform('uResolution', [ZM.W, ZM.H]);
  shader.setUniform('uAspectRatio', ZM.W / ZM.H);
  
  // Apply camera transforms (rotations only - shader handles projection)
  p.translate(ZM.camera.offsetX, ZM.camera.offsetY, -ZM.camera.distance);
  p.rotateX(ZM.camera.rotationX);
  p.rotateY(ZM.camera.rotationY);
  p.rotateZ(ZM.emitterRotationTransition.current * Math.PI / 180);
  
  // Apply geometry scale
  const scaleVal = ZM.geometryScaleTransition.current / 100;
  p.scale(scaleVal);
  
  // Draw all lines (shader applies equirectangular projection automatically)
  emitter.lines.forEach(line => line.draw(p, ZM));
  
  // Reset shader for UI overlays (if any)
  p.resetShader();
}
```

---

### 4.4 Shader Loading Function

**Add to SketchFactory.js:**

```javascript
/**
 * Load and compile equirectangular shader
 */
function loadEquirectShader(p) {
  // Shader source will be in separate files:
  // - js/shaders/equirectangular.vert
  // - js/shaders/equirectangular.frag
  
  // For now, inline (can be moved to external files later)
  const vertShader = `
    precision highp float;
    
    attribute vec3 aPosition;
    attribute vec4 aVertexColor;
    
    uniform mat4 uModelViewMatrix;
    uniform vec2 uResolution;
    
    varying vec4 vColor;
    
    const float PI = 3.14159265359;
    
    void main() {
      // Transform to view space
      vec4 viewPos = uModelViewMatrix * vec4(aPosition, 1.0);
      
      // Convert to spherical coordinates
      float r = length(viewPos.xyz);
      if (r < 0.001) {
        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
        vColor = aVertexColor;
        return;
      }
      
      float theta = atan(viewPos.x, viewPos.z);
      float phi = asin(clamp(viewPos.y / r, -1.0, 1.0));
      
      // Map to equirectangular UV
      float u = (theta + PI) / (2.0 * PI);
      float v = (phi + PI * 0.5) / PI;
      
      // Convert to clip space
      vec2 clipPos = vec2(u * 2.0 - 1.0, v * 2.0 - 1.0);
      
      gl_Position = vec4(clipPos, 0.0, 1.0);
      vColor = aVertexColor;
    }
  `;
  
  const fragShader = `
    precision mediump float;
    varying vec4 vColor;
    
    void main() {
      gl_FragColor = vColor;
    }
  `;
  
  try {
    return p.createShader(vertShader, fragShader);
  } catch (e) {
    console.error('Shader compilation failed:', e);
    return null;
  }
}
```

---

## 5. State Management & Switching

### 5.1 Emitter Preservation (Existing System Works!)

**The current system already handles emitter preservation when switching modes:**

```javascript
// From initializeSketches() - THIS ALREADY WORKS
if (ZM.emitterInstance) {
  console.log('Preserving emitter with', ZM.emitterInstance.lines.length, 'existing lines');
}
```

**What happens when switching modes:**

1. User clicks a different rendering mode
2. `initializeSketches()` is called
3. Existing p5 instances are removed (`p5Instance.remove()`)
4. **Emitter is NOT cleared** — `ZM.emitterInstance` persists
5. New canvas(es) created with new mode
6. New p5 sketch reuses existing emitter via `ZM.emitterInstance`
7. Animation continues seamlessly!

**Result:** ✅ No special code needed — existing system handles it perfectly.

---

### 5.2 Camera & Geometry Scaling

**Current behavior:** When switching between mono/stereo, the system scales emitter positions and camera offsets proportionally.

**For 360° mode:** Same logic applies! If canvas dimensions change, geometry scales automatically.

**Already implemented in `initializeSketches()`:**

```javascript
const scaleX = ZM.W / prevW;
const scaleY = ZM.H / prevH;

// Scale emitter
ZM.emitterInstance.x *= scaleX;
ZM.emitterInstance.y *= scaleY;

// Scale camera offsets
ZM.camera.offsetX *= scaleX;
ZM.camera.offsetY *= scaleY;
```

**Result:** ✅ Works for 360° mode automatically!

---

## 6. Export Panel Integration

### 6.1 Disable SVG in 360° Mode

**UI Feedback Strategy:**

```javascript
/**
 * Update export button states based on rendering mode
 */
function updateExportButtonStates(ZM) {
  const svgBtn = document.getElementById('export-svg');
  const mode = ZM.params.renderMode || 'perspective';
  
  if (mode === 'equirectangular') {
    // Disable SVG export in 360° mode
    svgBtn.disabled = true;
    svgBtn.style.opacity = '0.4';
    svgBtn.style.cursor = 'not-allowed';
    svgBtn.title = 'SVG export not available in 360° mode (use Perspective mode)';
  } else {
    // Enable SVG in perspective/stereoscopic modes
    svgBtn.disabled = false;
    svgBtn.style.opacity = '1';
    svgBtn.style.cursor = 'pointer';
    svgBtn.title = 'Export current frame as SVG';
  }
}

// Call this whenever renderMode changes
```

---

### 6.2 Add Mode Indicator to Export Panel

**Optional enhancement for user clarity:**

```html
<!-- Add below export buttons -->
<div id="export-mode-indicator" style="margin-top:10px;padding:8px;background:rgba(50,50,50,0.3);border-radius:3px;font-size:0.7rem;color:#999;text-align:center;">
  Mode: <span id="export-mode-text" style="color:#ccc;font-weight:500;">Perspective</span>
</div>
```

```javascript
// Update indicator when mode changes
function updateExportModeIndicator(ZM) {
  const indicator = document.getElementById('export-mode-text');
  if (!indicator) return;
  
  const modeLabels = {
    'perspective': 'Perspective',
    'stereoscopic': 'Stereoscopic VR',
    'equirectangular': '360° Equirectangular'
  };
  
  indicator.textContent = modeLabels[ZM.params.renderMode] || 'Unknown';
}
```

---

## 7. Backward Compatibility

### 7.1 Old Presets with `stereoscopicMode`

**Problem:** Existing presets use `stereoscopicMode: true/false`

**Solution:** Auto-convert when loading:

```javascript
// In main.js - loadJSON() callback
if ('stereoscopicMode' in loadedParams) {
  loadedParams.renderMode = loadedParams.stereoscopicMode ? 'stereoscopic' : 'perspective';
  delete loadedParams.stereoscopicMode;
  console.log('✓ Converted old stereoscopicMode parameter to renderMode');
}
```

---

### 7.2 New Presets Are Forward Compatible

**When saving a new state/preset:**

```json
{
  "projectName": "My360Scene",
  "params": {
    "renderMode": "equirectangular",
    "framebufferMode": true,
    "framebufferWidth": 4096,
    "framebufferHeight": 2048,
    ...
  }
}
```

**If loaded in an older SpaceFlow version (without 360° support):**
- `renderMode` parameter is ignored (unknown param)
- Falls back to default mono perspective rendering
- No crash, just renders in perspective mode

**Result:** ✅ Graceful degradation

---

## 8. Testing Strategy

### 8.1 Mode Switching Tests

**Test each transition:**

| From | To | Expected Behavior |
|------|-----|-------------------|
| Perspective → Stereoscopic | ✓ Split canvas, preserve animation |
| Perspective → 360° | ✓ Single canvas with shader, preserve animation |
| Stereoscopic → Perspective | ✓ Single canvas, preserve animation |
| Stereoscopic → 360° | ✓ Single canvas with shader, preserve animation |
| 360° → Perspective | ✓ Single canvas, standard rendering |
| 360° → Stereoscopic | ✓ Split canvas, preserve animation |

**For each test:**
1. Load a preset with animation running
2. Switch rendering mode via UI
3. Verify:
   - ✓ Animation continues smoothly (no restart)
   - ✓ No console errors
   - ✓ Geometry positions correct
   - ✓ Camera controls still work
   - ✓ Transitions (FOV, color, geometry) still animate

---

### 8.2 Export Tests

**Test matrix:**

| Mode | PNG | SVG | Video | Depth |
|------|-----|-----|-------|-------|
| Perspective | ✓ | ✓ | ✓ | ✓ |
| Stereoscopic | ✓ (2 files) | ✓ (2 files) | ✓ | ✓ |
| 360° Equirect | ✓ | ❌ (disabled) | ✓ | ✓ |

**For 360° PNG export:**
- Use default resolution (window size) or framebuffer mode
- Recommend 2:1 aspect ratio presets (3840×1920, 7680×3840)

---

### 8.3 Framebuffer Mode Tests

**Test 360° with custom resolutions:**

| Resolution | Aspect Ratio | Expected Behavior |
|------------|--------------|-------------------|
| 3840×1920 | 2:1 | ✓ Perfect (recommended) |
| 4096×2048 | 2:1 | ✓ Perfect |
| 1920×1080 | ~1.78:1 | ⚠️ Works but distorted (warn user) |
| 2048×2048 | 1:1 | ⚠️ Works but very distorted (warn user) |

---

## 9. Summary Checklist

**Before implementation begins, confirm:**

- [ ] **Parameter system**: Add `renderMode` to `defaults.js`
- [ ] **Backward compat**: Add conversion for old `stereoscopicMode` parameter
- [ ] **GUI**: Replace checkbox with radio buttons (3 modes)
- [ ] **UI Controller**: Add event listeners for mode selector
- [ ] **SketchFactory**: Extend `initializeSketches()` with 360° mode branch
- [ ] **SketchFactory**: Modify `createSketch()` to accept `useEquirectShader` option
- [ ] **SketchFactory**: Add `renderEquirectangularFrame()` function
- [ ] **SketchFactory**: Add `loadEquirectShader()` function
- [ ] **Shaders**: Create `js/shaders/equirectangular.vert` and `.frag` files
- [ ] **Export**: Update `updateExportButtonStates()` to disable SVG in 360°
- [ ] **CSS**: Add `.equirectangular` canvas wrapper styles (if needed)
- [ ] **Testing**: Test all mode transitions
- [ ] **Testing**: Test exports in all modes
- [ ] **Testing**: Test framebuffer mode with 360°
- [ ] **Documentation**: Update user manual with 360° mode instructions

---

## 10. Next Steps

**Phase 1: Core Integration** (Days 1-2)
1. Add `renderMode` parameter to defaults
2. Update GUI with radio buttons
3. Modify `initializeSketches()` logic
4. Test mode switching (without shader yet — use placeholder)

**Phase 2: Shader Implementation** (Days 3-5)
5. Create shader files
6. Implement `loadEquirectShader()`
7. Implement `renderEquirectangularFrame()`
8. Test equirectangular rendering visually

**Phase 3: Polish & Testing** (Days 6-7)
9. Update export button states
10. Add mode indicator to UI
11. Test all mode transitions
12. Test exports in all modes

**Phase 4: Documentation** (Day 8)
13. Update user manual
14. Add example presets for 360° mode
15. Create video tutorial (optional)

---

**Document Status:** Ready for review and implementation

**Next Review Date:** 2026-06-20

**Contact:** SpaceFlow Development Team

---

