# ZigMap26 Transition System Architecture

## Table of Contents
1. [Overview](#overview)
2. [Transition Types](#transition-types)
3. [Color Transition System](#color-transition-system)
4. [State Transition System](#state-transition-system)
5. [Multi-Window Synchronization](#multi-window-synchronization)
6. [Duration Parameters](#duration-parameters)
7. [Code Flow](#code-flow)
8. [Technical Details](#technical-details)

---

## Overview

ZigMap26 implements a sophisticated dual-transition system that allows smooth animated changes between:
- **Color palettes** (per-line color transitions + background)
- **State parameters** (camera, FOV, geometry scale, emitter rotation)

The system is designed with **perfect synchronization** across multiple windows, ensuring that primary editor and secondary display windows show identical animations with frame-perfect timing.

### Design Philosophy

1. **Decentralized Animation**: Each line animates its own color transition independently
2. **Shared Timing**: All transitions read from shared `ZM.params` for consistent timing
3. **Per-Frame Updates**: Transitions update in the animation loop (60fps)
4. **Clean Architecture**: Separate transition objects for each animatable property

---

## Transition Types

### 1. Color Transitions
**Duration**: `colorTransitionDuration` (0-30 seconds)
**Controls**: Palette changes (keys 1, 2, 3, 4)
**Scope**: Per-line + background

### 2. State Transitions
**Duration**: `stateTransitionDuration` (0-30 seconds)
**Controls**: State loading (ArrowLeft, ArrowRight, preset load)
**Scope**: Camera, FOV, geometry scale, emitter rotation

---

## Color Transition System

### Architecture

Color transitions use a **distributed per-line** approach where each `ZigzagLine` instance manages its own color animation:

```
triggerPaletteChange()
  ↓
For each line:
  line.transitionToColor(newColor)
    ↓
  line.startColor = currentColor
  line.targetColor = newColor
  line.colorTransitionProgress = 0.0
  line.isTransitioning = true
    ↓
Animation loop (60fps):
  if (isTransitioning):
    progress += dt / params.colorTransitionDuration
    currentColor = lerp(startColor, targetColor, progress)
```

### Key Components

#### 1. **ZigzagLine Class** (`js/core/ZigzagLine.js`)

Each line instance contains:
```javascript
{
  currentColor: [r, g, b],          // Cached display color
  startColor: [r, g, b],            // Start of transition
  targetColor: [r, g, b],           // Target of transition
  colorTransitionProgress: 0.0-1.0, // Animation progress
  isTransitioning: boolean,         // Animation active flag
  params: reference to ZM.params    // Shared timing source
}
```

**Transition Trigger** (`transitionToColor()`):
```javascript
transitionToColor(newColor, newColorSlotIndex) {
  this.startColor = [...this.currentColor];  // Remember where we started
  this.targetColor = [...newColor];
  this.colorTransitionProgress = 0.0;
  this.isTransitioning = true;
}
```

**Per-Frame Update** (`update(dt)`):
```javascript
if (this.isTransitioning) {
  this.colorTransitionProgress += dt / this.params.colorTransitionDuration;
  
  if (this.colorTransitionProgress >= 1.0) {
    // Transition complete
    this.colorTransitionProgress = 1.0;
    this.currentColor = [...this.targetColor];
    this.isTransitioning = false;
  } else {
    // Interpolate color
    this.currentColor = lerpColor(
      this.startColor, 
      this.targetColor, 
      this.colorTransitionProgress
    );
  }
}
```

#### 2. **Background Transition** (`js/rendering/SketchFactory.js`)

Background color uses a **centralized** transition object:
```javascript
ZM.bgTransition = {
  current: [r, g, b],   // Current display color
  start: [r, g, b],     // Transition start
  target: [r, g, b],    // Transition target
  progress: 0.0-1.0,    // Animation progress
  isTransitioning: boolean
}
```

**Trigger** (`triggerPaletteChange()`):
```javascript
const newBg = getBackgroundColor(ZM.params);
ZM.bgTransition.start = [...ZM.bgTransition.current];
ZM.bgTransition.target = newBg;
ZM.bgTransition.progress = 0.0;
ZM.bgTransition.isTransitioning = true;
```

**Animation** (primary canvas only):
```javascript
if (ZM.bgTransition.isTransitioning) {
  ZM.bgTransition.progress += dt / ZM.params.colorTransitionDuration;
  
  if (ZM.bgTransition.progress >= 1.0) {
    ZM.bgTransition.progress = 1.0;
    ZM.bgTransition.current = [...ZM.bgTransition.target];
    ZM.bgTransition.isTransitioning = false;
  } else {
    ZM.bgTransition.current = lerpColor(
      ZM.bgTransition.start,
      ZM.bgTransition.target,
      ZM.bgTransition.progress
    );
  }
}
```

#### 3. **Trigger Function** (`js/core/colorUtils.js`)

```javascript
export function triggerPaletteChange(ZM) {
  // Transition all existing lines
  if (ZM.emitterInstance && ZM.emitterInstance.lines) {
    for (const line of ZM.emitterInstance.lines) {
      const newColor = getColorForSlot(ZM.params, line.colorSlotIndex);
      line.transitionToColor(newColor, line.colorSlotIndex);
    }
  }
  
  // Transition background
  if (ZM.bgTransition) {
    const newBg = getBackgroundColor(ZM.params);
    ZM.bgTransition.start = [...ZM.bgTransition.current];
    ZM.bgTransition.target = newBg;
    ZM.bgTransition.progress = 0.0;
    ZM.bgTransition.isTransitioning = true;
  }
}
```

### Why This Design Works

1. **No Broadcast Needed**: Each line reads `this.params.colorTransitionDuration` directly
2. **Automatic Sync**: All windows share the same parameter object structure
3. **Memory Efficient**: No central tracking of thousands of transitions
4. **Frame-Perfect**: Lines in different windows progress identically (same dt, same duration)
5. **Clean Logic**: Each line is self-contained

### Color Interpolation

Uses linear RGB interpolation (`lerpColor()`):
```javascript
function lerpColor(c1, c2, t) {
  return [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t
  ];
}
```

---

## State Transition System

### Architecture

State transitions use **centralized transition objects** managed at the application level:

```
loadState() / navigateHistory()
  ↓
restoreState(state, instant=false)
  ↓
Setup transitions:
  - camera.transitionTo(...)
  - fovTransition.setup(...)
  - geometryScaleTransition.setup(...)
  - emitterRotationTransition.setup(...)
  ↓
broadcastStateLoad(state, instant)
  ↓
Display windows call restoreState()
  ↓
Animation loop (ALL windows):
  Update all transition objects
```

### Transition Objects

#### 1. **Camera Transition** (`ZM.camera.transition`)

```javascript
ZM.camera.transition = {
  isActive: boolean,
  duration: milliseconds,
  progress: 0.0-1.0,
  // Start positions
  startRotationX, startRotationY,
  startDistance, startOffsetX, startOffsetY,
  // Target positions
  targetRotationX, targetRotationY,
  targetDistance, targetOffsetX, targetOffsetY
}
```

**Setup** (`camera.transitionTo()`):
```javascript
transitionTo(rotX, rotY, dist, offX, offY) {
  this.transition.startRotationX = this.rotationX;
  this.transition.startRotationY = this.rotationY;
  // ... store all start values
  
  this.transition.targetRotationX = rotX;
  this.transition.targetRotationY = rotY;
  // ... store all target values
  
  this.transition.progress = 0.0;
  this.transition.duration = ZM.params.stateTransitionDuration * 1000;
  this.transition.isActive = true;
}
```

**Animation**:
```javascript
if (ZM.camera.transition.isActive) {
  ZM.camera.updateTransition(dt);
  // Sync to params for consistency
  ZM.params.cameraRotationX = ZM.camera.rotationX;
  ZM.params.cameraRotationY = ZM.camera.rotationY;
  // ... sync all camera params
}
```

#### 2. **FOV Transition** (`ZM.fovTransition`)

```javascript
ZM.fovTransition = {
  current: number,
  start: number,
  target: number,
  progress: 0.0-1.0,
  duration: milliseconds,
  isTransitioning: boolean
}
```

**Setup** (`restoreState()`):
```javascript
ZM.fovTransition.start = ZM.fovTransition.current;
ZM.fovTransition.target = state.params.fov;
ZM.fovTransition.progress = 0.0;
ZM.fovTransition.duration = ZM.params.stateTransitionDuration;
ZM.fovTransition.isTransitioning = true;
```

**Animation** (ease-in-out cubic):
```javascript
if (ZM.fovTransition.isTransitioning) {
  ZM.fovTransition.progress += dt / ZM.fovTransition.duration;
  
  if (ZM.fovTransition.progress >= 1.0) {
    ZM.fovTransition.current = ZM.fovTransition.target;
    ZM.fovTransition.isTransitioning = false;
  } else {
    // Cubic easing
    const t = ZM.fovTransition.progress < 0.5
      ? 4 * p * p * p
      : 1 - Math.pow(-2 * p + 2, 3) / 2;
    ZM.fovTransition.current = start + (target - start) * t;
  }
}
```

#### 3. **Geometry Scale Transition** (`ZM.geometryScaleTransition`)

Same structure as FOV transition, controls `segmentLength` parameter.

#### 4. **Emitter Rotation Transition** (`ZM.emitterRotationTransition`)

Same structure as FOV transition, controls `emitterRotation` parameter.

### Easing Functions

State transitions use **ease-in-out cubic** for smooth, natural motion:
```javascript
const easeInOutCubic = (t) => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
```

---

## Multi-Window Synchronization

### Synchronization Strategy

ZigMap26 uses a **broadcast-once, animate-locally** approach:

1. **Main window** loads state → sets up transitions → broadcasts `state-load` message
2. **Display windows** receive message → call same `restoreState()` → set up identical transitions
3. **All windows** animate transitions independently using shared durations

### Why This Works

```
Main Window:                  Display Windows:
├─ restoreState()            ├─ restoreState()
├─ camera.transitionTo()     ├─ camera.transitionTo()
├─ fovTransition.setup()     ├─ fovTransition.setup()
└─ broadcast("state-load")   └─ receive("state-load")
       │                            │
       └────────────────────────────┘
                    │
            Same Parameters
            Same Durations
            Same Start/Target Values
                    │
            ┌───────┴───────┐
            │               │
    Animation Loop    Animation Loop
    progress += dt    progress += dt
    lerp(s, t, p)     lerp(s, t, p)
```

### Key Synchronization Points

#### 1. **Initial Connection** (`full-sync`)

When display window connects:
```javascript
// Main window sends everything
{
  type: 'full-sync',
  params: ZM.params,  // Includes colorTransitionDuration
  camera: { ... },
  fovTransition: { current, target, progress, ... },
  geometryScaleTransition: { ... },
  bgTransition: { ... }
}
```

#### 2. **State Changes** (`state-load`)

When state is loaded:
```javascript
// Main window broadcasts once
{
  type: 'state-load',
  state: fullStateObject,
  instant: boolean
}

// Display windows call restoreState(state, instant)
// Results in identical transition setup
```

#### 3. **Real-Time Slider Changes** (`delta-sync`)

When user drags sliders:
```javascript
// Throttled broadcasts (~60fps)
{
  type: 'delta-sync',
  changes: {
    colorTransitionDuration: 15.0,
    // ... other params
  }
}

// Display windows update ZM.params
Object.assign(ZM.params, changes);
```

### Critical Design Decision: Slider Broadcasting

**Problem**: If sliders only broadcast on mouse release, display windows can have stale values.

**Solution**: Broadcast during drag (`input` event) **in addition to** on release:

```javascript
slider.addEventListener('input', () => {
  // Update local params immediately
  ZM.params[paramKey] = parseFloat(slider.value);
  
  // Broadcast to display windows (throttled by WindowSync)
  if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
    ZM.windowSync.broadcastParamChanges({ 
      [paramKey]: ZM.params[paramKey] 
    });
  }
});
```

This ensures that if user:
1. Drags Color Transition slider to 15 seconds
2. Presses palette key (1, 2, 3, 4) **before releasing mouse**
3. All windows use 15 seconds for the transition

---

## Duration Parameters

### Color Transition Duration

**Parameter**: `colorTransitionDuration` (seconds)
**Range**: 0 - 30 seconds
**Default**: 3 seconds
**Scope**: Project-wide (preserved during state loads)

**Used by**:
- ZigzagLine color transitions
- Background color transitions

**Code location**:
```javascript
// Per-line animation
this.colorTransitionProgress += dt / this.params.colorTransitionDuration;

// Background animation
ZM.bgTransition.progress += dt / ZM.params.colorTransitionDuration;
```

### State Transition Duration

**Parameter**: `stateTransitionDuration` (seconds)
**Range**: 0 - 30 seconds
**Default**: 30 seconds
**Scope**: Project-wide (preserved during state loads)

**Used by**:
- Camera transitions
- FOV transitions
- Geometry scale transitions
- Emitter rotation transitions

**Code location**:
```javascript
// Camera
this.transition.duration = ZM.params.stateTransitionDuration * 1000; // ms

// FOV
ZM.fovTransition.duration = ZM.params.stateTransitionDuration;

// Geometry
ZM.geometryScaleTransition.duration = ZM.params.stateTransitionDuration;

// Emitter Rotation
ZM.emitterRotationTransition.duration = ZM.params.stateTransitionDuration;
```

### Project-Wide Settings

Both duration parameters are marked as "project-wide" and are **preserved** when loading states:

```javascript
// In restoreState()
const preservedSettings = {
  stateTransitionDuration: ZM.params.stateTransitionDuration,
  colorTransitionDuration: ZM.params.colorTransitionDuration,
  // ... other project-wide settings
};

// Apply state params
Object.assign(ZM.params, state.params);

// Restore preserved settings
Object.assign(ZM.params, preservedSettings);
```

This ensures consistent transition timing across all state changes in a project.

---

## Code Flow

### Color Transition Flow

```
User Action: Press palette key (1, 2, 3, 4)
  ↓
KeyboardHandler.js: executeAction('loadPalette', index)
  ↓
UIController.js: selectPalette(index)
  ↓
Update ZM.params.activePaletteIndex
  ↓
triggerPaletteChange(ZM)
  ↓
For each line: line.transitionToColor(newColor)
  ↓
Background: bgTransition.start → target
  ↓
broadcastParamChanges({ activePaletteIndex, palettes })
  ↓
Display Windows: Receive delta-sync
  ↓
Display: Update params → triggerPaletteChange()
  ↓
Animation Loop (ALL windows):
  ├─ Lines: progress += dt / colorTransitionDuration
  ├─ Lines: currentColor = lerp(start, target, progress)
  └─ Background: bgTransition animates
```

### State Transition Flow

```
User Action: ArrowLeft/ArrowRight or load state
  ↓
StateManager.js: navigateHistory(direction) / loadState(id)
  ↓
restoreState(ZM, state, instant=false)
  ↓
Setup transitions:
  ├─ camera.transitionTo(...)
  ├─ fovTransition: start → target, progress = 0
  ├─ geometryScaleTransition: start → target, progress = 0
  └─ emitterRotationTransition: start → target, progress = 0
  ↓
broadcastStateLoad(state, instant=false)
  ↓
Display Windows: Receive state-load
  ↓
Display: restoreState(state, instant)
  ↓
Display: Setup identical transitions
  ↓
Animation Loop (ALL windows):
  ├─ camera.updateTransition(dt)
  ├─ fovTransition.progress += dt / duration
  ├─ geometryScaleTransition.progress += dt / duration
  └─ emitterRotationTransition.progress += dt / duration
```

### Real-Time Slider Flow

```
User Action: Drag Color Transition slider
  ↓
UIController.js: slider 'input' event
  ↓
ZM.params.colorTransitionDuration = newValue
  ↓
broadcastParamChanges({ colorTransitionDuration: newValue })
  ↓
WindowSync.js: Throttle broadcast (~60fps)
  ↓
Display Windows: Receive delta-sync
  ↓
Display: Object.assign(ZM.params, changes)
  ↓
Display: ZM.params.colorTransitionDuration = newValue
  ↓
Next Frame: All lines read updated value
  ↓
progress += dt / this.params.colorTransitionDuration
```

---

## Technical Details

### Delta Time (dt)

All transitions use frame-independent timing:

```javascript
// In SketchFactory.js draw()
const now = Date.now();
const dt = (now - lastFrameTime) / 1000.0; // Convert to seconds
lastFrameTime = now;

// Progress calculation (normalized to 0-1)
progress += dt / durationInSeconds;
```

This ensures:
- **60fps**: dt ≈ 0.0167 seconds
- **30fps**: dt ≈ 0.0333 seconds
- **Consistent animation speed** regardless of frame rate

### Memory Management

**Per-line color transitions**:
- Each line stores 3 color arrays (12 floats)
- No central tracking required
- Lines are garbage collected when they leave viewport
- Memory scales with visible line count (~100-500 lines)

**State transitions**:
- Fixed number of transition objects (4)
- Single allocation, reused for all state changes
- No per-frame allocations

### Performance Considerations

1. **Conditional Updates**: Only update if `isTransitioning === true`
2. **Early Exit**: Stop checking when `progress >= 1.0`
3. **Cached Lerp**: Store interpolated values, don't recalculate every frame
4. **Throttled Broadcasts**: WindowSync throttles to 16ms (~60fps max)

### Display Window Optimization

Display windows skip certain operations:
- No UI updates (`syncUIWithoutRestart()`)
- No localStorage saves
- No export operations

But they **fully participate** in all transitions:
```javascript
// In SketchFactory.js
// Update transitions (in ALL canvases including display windows)
if (ZM.camera.transition.isActive) { ... }
if (ZM.fovTransition.isTransitioning) { ... }
if (ZM.geometryScaleTransition.isTransitioning) { ... }
```

---

## Summary

The ZigMap26 transition system achieves **perfect multi-window synchronization** through:

1. **Shared Parameters**: All windows read from identically structured `ZM.params`
2. **Distributed Animation**: Lines animate themselves using shared timing
3. **Centralized State Transitions**: Single broadcast → identical setup in all windows
4. **Real-Time Sync**: Slider changes broadcast during drag for instant synchronization
5. **Frame-Independent Timing**: Delta time ensures consistent speed across all displays

This architecture is:
- ✅ **Simple**: Each component knows only what it needs
- ✅ **Efficient**: Minimal broadcasting, no redundant calculations
- ✅ **Scalable**: Works with any number of display windows
- ✅ **Maintainable**: Single source of truth for transition logic
- ✅ **Robust**: Guaranteed synchronization through identical code paths

The key insight: **Don't broadcast animation frames, broadcast setup commands and animate locally**.
