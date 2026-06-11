# SpaceFlow

ddelcourt2026 / March 2026

---

## Overview

**SpaceFlow** is a modular framework for real-time 3D generative art with camera controls, stereoscopic viewing, state management, and vector export.

**Current patch:** Zigzag Emitter — animated ribbon patterns in 3D space.

SpaceFlow is designed as a universal framework that can load different visual algorithms (patches) while providing consistent camera, color, export, and state management systems.

---

## Table of contents

- [Quick start](#quick-start)
- [Basic controls](#basic-controls)
- [Core concepts](#core-concepts)
- [Complete UI reference](#complete-ui-reference)
- [Export](#export)
- [Project management](#project-management)
- [Best practices](#best-practices)
- [Technical reference](#technical-reference)

---

## Quick start

1. Open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge)
2. A starter project loads automatically with example states
3. Use left-click + drag to rotate the camera
4. Use right-click + drag to pan the camera
5. Scroll the mouse wheel to zoom
6. Press Tab to hide or show the control panel
7. Press Enter for fullscreen mode

---

## Basic controls

### Mouse

| Action | Control |
|--------|-----------|
| Rotate camera (orbit) | Left-click + drag |
| Pan camera (2D offset) | Right-click + drag |
| Z-rotation (roll) | Middle-click + drag horizontally |
| Zoom | Mouse wheel |

Camera controls are active only when the cursor is on the canvas. In stereoscopic mode, controls apply to the canvas that was clicked. Scroll sensitivity is proportional to camera distance.

**Camera control details:**
- **Orbit control** (left-click + drag): Rotates the camera around the scene center (X/Y axes)
- **Pan control** (right-click + drag): Moves the camera view in 2D space without changing the orbit angle
- **Z-rotation control** (middle-click + drag): Rolls the entire scene around the Z-axis, creating a rotation effect
- **Zoom control** (mouse wheel): Changes the camera distance from the scene center

### Keyboard

| Key | Action | Key | Action |
|-----|--------|-----|--------|
| Tab | Hide/show UI panel | Enter | Fullscreen |
| P | Export PNG | S | Export SVG |
| D | Export depth map | Ctrl+S (⌘+S) | Save project JSON |
| R | Reset camera position | 0 | Reset zoom (600 units) |
| 1–4 | Select color palette | t | Toggle random thickness |
| m | Toggle random speed | y | Toggle stereoscopic mode |

---

## Core concepts

### States

States are complete snapshots of configuration (parameters, colors, camera position).

**Basic usage:**
1. Open States panel
2. Click any state to load it with smooth transition
3. Click Save to create a new state
4. Click Update to overwrite the selected state
5. Click Delete to remove a state
6. Double-click on a state name to rename it (or use the rename button ✎)
7. **Drag and drop** states to reorder them (drag handle on left side)

**State order:**
- **Drag-and-drop**: Click and drag the ⋮⋮ handle to reorder states
- Order persists across sessions via localStorage
- When loading a preset JSON, the first state in the list loads automatically
- When refreshing the page, the last active state loads automatically

**Auto-trigger:**
Enable Auto-Trigger to automatically cycle through states. Frequency slider (5–120 seconds) defines the interval. A shuffle algorithm ensures each state is visited once before repetition.

**Transitions:**
- State Transition (0–30 s): duration for parameter changes
- Color Transition (0–30 s): duration for color palette changes

### Colors

Four distinct palettes, each with four color slots. Press 1, 2, 3, or 4 to switch palettes instantly.

**Color configuration:**
- Click color picker to set RGB values
- Set role for each slot: Line / Background / None
- Multiple slots can have the same role
- Lines randomly select from available Line colors at generation

When switching palettes, all existing lines and the background transition smoothly via RGB interpolation.

**Color depth separation:**
Controls Z-axis spacing between lines of different colors to reduce overlap (z-fighting). Formula: each slot offset = `(slotIndex - 2) × multiplier`.

### Overlays

Static images overlaid on the animation. Included in PNG and video exports. Excluded from SVG exports.

**Preset overlays:**
1. Open Overlay section
2. Select from Preset dropdown (loads from `assets/overlays/`)
3. Enable Show Overlay checkbox

**Custom images:**
1. Click Load Custom Image
2. Select PNG, JPG, or SVG file
3. Adjust Scale, Opacity, Position sliders

Supported formats: PNG (recommended for transparency), JPG, SVG.

---

## Complete UI reference

### UI section

**Hide controls** (Tab): hides the control panel. Press again to show.

**Fullscreen** (Enter): activates browser fullscreen mode. Press Escape to exit.

---

### Project section

**Save** (Ctrl+S / ⌘+S): downloads current parameters to a timestamped `.json` file. All parameters and camera position are included.

**Load**: opens file picker to load a previously saved `.json` configuration. All parameters are applied immediately and persisted to localStorage.

**localStorage behavior:**
- Parameters are automatically saved to localStorage on every change
- State list order and active state persist across sessions
- **URL preset loading**:
  - First visit with `?preset=Name` → loads that preset
  - Return visit with same preset URL → uses your localStorage data (customizations preserved)
  - Visit with **different** preset URL → loads the new preset (replaces localStorage)
  - Refresh without URL param → loads your localStorage data and last active state

---

### States section

- **State list**: displays all saved states
- **Save**: saves current configuration as a new state
- **Update**: overwrites selected state with current configuration
- **Delete**: removes selected state
- **Rename**: double-click on state name to edit

**State Transition** (0–30 s): duration of transition between states.

**Color Transition** (0–30 s): duration of color palette transitions.

**Auto-Trigger**: automatically alternates between states. Frequency slider (5–120 s) defines interval. Shuffle algorithm ensures each state is visited once before repetition.

---

### Camera section

**Stereoscopic view (VR)** — default: off  
Divides view into left and right eye perspectives, side by side. Green borders indicate active mode. Each eye occupies half the window width.

**Eye separation** — range: 0–100, default: 30, units: world space  
Distance between left and right camera positions. Higher values accentuate 3D effect. Active only in stereoscopic mode.

**Framebuffer resolution** — default: off  
Locks canvas to specific pixel resolution instead of window size. Gray border indicates active mode. Canvas scales down to fit window if necessary.

**Preset** — type: dropdown, default: 1920×1080  
Quick selection of common resolutions:

| Preset | Resolution |
|------------|------------|
| HD Horizontal | 1920×1080 |
| HD Vertical | 1080×1920 |
| HD Small Square | 1080×1080 |
| HD Large Square | 1920×1920 |
| 4K Horizontal | 3840×2160 |
| 4K Vertical | 2160×3840 |
| 4K Small Square | 2160×2160 |
| 4K Large Square | 3840×3840 |
| Web banner | 3500×1500 |
| Instagram post | 1080×1440 |
| Custom | — |

Active only in framebuffer mode.

**Resolution (Width × Height)** — default: 1920×1080, minimum: 320×240  
Manual entry of pixel dimensions. Changing these values sets preset to "Custom".

**Field of view** — range: 0.01–180°, default: 60°  
Low values (30–40°) produce architectural rendering. High values (90–120°) accentuate perspective.

**Clipping planes** — near: 0.01–500, far: 500–20,000, default: 0.01 / 20,000  
Defines visible portion of 3D space. Adjust if geometry appears clipped at extreme zoom levels.

---

### Display Window (Multi-display synchronization)

**Open Display Window** button (located in Project section)  
Opens secondary fullscreen windows for multi-monitor presentations. The display windows mirror the main window's animation in real-time, synchronized via intelligent parameter broadcasting. You can open multiple display windows by clicking the button multiple times—each receives a unique sequential ID (display-1, display-2, display-3, etc.).

**Dual synchronization strategy:**

The system uses two different broadcasting approaches for optimal performance:

1. **State transitions** (efficient):
   - When loading states or changing parameters via UI, the main window broadcasts transition commands
   - Display windows receive the commands and execute identical smooth transitions locally
   - Camera position, FOV, geometry scale, and emitter rotation all transition in perfect sync
   - Result: Frame-perfect synchronized animations with minimal bandwidth (1 command per transition)
   - Examples: Loading a new state, navigating state history, transitioning camera/geometry

2. **Manual camera control** (real-time):
   - During mouse drag, pan, zoom, or Z-rotation, the main window broadcasts camera position updates at 60fps
   - Display windows snap instantly to match the manual control movements
   - Manual control overrides any ongoing transitions for immediate responsiveness
   - Result: Responsive real-time following during live performance or interaction
   - Examples: Dragging to orbit camera, middle-click drag for Z-rotation, mouse wheel zoom

**How it works:**
- The main window broadcasts parameter changes and commands to display windows via the BroadcastChannel API
- Each window runs its own independent generative code using the synchronized parameters
- Both windows generate their animations independently based on the same state values

**Important: Synchronized transitions vs. generative variation**

The system achieves **frame-perfect transition synchronization** while maintaining **independent generative execution**:

**What IS perfectly synchronized:**
- **Camera transitions**: Rotation, distance, panning all interpolate identically across displays
- **Geometry transitions**: Scale changes animate in perfect sync
- **FOV transitions**: Field of view changes match frame-by-frame
- **Color transitions**: Palette changes happen simultaneously
- **State parameters**: All settings stay perfectly synchronized

**What varies by design:**
- **Line generation**: Each window creates new lines independently with its own timing
- **Random variations**: Thickness, speed, and color selection use independent random seeds
- **Rendering timing**: Browser frame cycles may differ slightly

The main display and secondary display will show **identical camera views and transitions** but with **unique line patterns**. This is intentional and provides:

1. **Transition synchronization**: When states change, all displays smoothly animate together to the new camera/geometry configuration

2. **Parameter-based generative sync**: The system syncs the *rules and parameters* (colors, geometry, camera, emit rate, etc.), not the individual lines. Each window generates its own unique variation following the same rules.

3. **Independent animation pipelines**: Each window runs its own WebGL rendering with independent random generation, creating visual variety while maintaining synchronized structure.

**Why this approach is more efficient than image streaming:**

- **Lower bandwidth**: Broadcasting compact parameter updates and transition commands (bytes) is far more efficient than streaming high-resolution video frames (megabytes per second)
- **Better performance**: Each window renders natively at its own resolution and refresh rate, avoiding video compression artifacts
- **Hardware acceleration**: Each window uses full GPU acceleration for WebGL rendering, maintaining smooth 60fps performance
- **Scalability**: Multiple display windows can connect without exponentially increasing data transfer
- **Resolution independence**: Each display can run at its optimal resolution without downscaling streamed content
- **Frame-perfect transitions**: Dedicated transition commands ensure synchronized smooth animations across all displays
- **Intelligent synchronization**: State transitions use single commands while manual control uses 60fps updates — optimal for each use case

**Bidirectional keyboard control**

Display windows support **remote keyboard control**, allowing you to operate the entire system from any display window. This is ideal for live performances where you watch the projector output instead of the control window.

**Supported keys from display windows:**
- **Arrow keys** (← →): Navigate state history (previous/next state)
- **Space bar**: Play/pause auto-trigger
- **Number keys** (1–4): Select color palettes
- **Export keys**: P (PNG), S (SVG), D (Depth), V (Video), Ctrl+S/⌘+S (Save project)
- **Camera keys**: R (Reset camera), 0 (Reset zoom)

**How it works:**
1. Press a key in any display window
2. Command is sent to the main window via BroadcastChannel
3. Main window processes the command (e.g., loads next state)
4. Main window broadcasts the result to all displays
5. All displays (including the one that sent the command) sync to the new state

The main window always remains the single source of truth, ensuring consistent behavior across all displays.

This generative synchronization approach is ideal for live installations, multi-projector setups, and performance contexts where smooth, high-quality rendering across multiple displays is essential.

---

### Geometry section

**Geometry height** — range: 10–240, default: 120, units: pixels

**Line thickness** — range: 1–60, default: 8, units: pixels  
Width of zigzag ribbon. Thick lines may overlap; thin lines produce more delicate patterns.

**Geometry scale** — range: 100–400%, default: 100%  
Global scaling of space. Does not affect canvas size.

---

### Behavior section

**Emit rate** — range: 0.1–10, default: 1.5, units: lines per second  
Frequency of new line creation. High values densify the screen; low values space out the animation.

**Speed** — range: 10–500, default: 80, units: pixels per second  
Movement speed of lines in space.

---

### Modulations section

**Random thickness** (t) — default: off  
Applies random variation to each line's thickness.

**Thickness range** — range: 10%–400%, default: 10%–200%  
Minimum and maximum variation when random thickness is enabled.

**Random speed** (m) — default: off  
Applies random variation to each line's speed.

**Speed range** — range: 10%–400%, default: 30%–200%  
Minimum and maximum variation when random speed is enabled.

---

### Colors section

**Color palettes**  
Four distinct palettes, each with four color slots. Keys 1, 2, 3, 4 toggle between palettes.

**Color customization**  
Each slot has a color picker (RGB) and a role:
- **Line**: color of zigzag ribbons (random selection at generation)
- **Background**: canvas background color
- **None**: slot disabled

Multiple slots can have the same role.

**Color depth separation** — range: 10–500, default: 100  
Controls Z-axis spacing between lines of different colors. Higher values reduce visual overlap (z-fighting). Formula: each slot offset = `(slotIndex - 2) × multiplier`.

**Color random seed** — range: 1–9999, default: 1  
Seed for deterministic color selection. All windows with the same seed will pick identical colors for new lines. Change this value to get different random color patterns while maintaining synchronization across display windows.

**Color transitions**  
When changing palettes, all existing lines and background transition smoothly over configured duration via RGB linear interpolation.

---

### Overlay section

**Show overlay**  
Checkbox to toggle overlay image visibility. Image remains loaded when hidden.

**Preset dropdown**  
Pre-configured overlays from `assets/overlays/` folder. Instant loading of Base64-encoded images. Select "-- Custom Image --" to load your own file.

**Load custom image**  
Opens file picker to import image. Supported formats: PNG, JPG, SVG. Image encoded as Base64 temporarily. Automatically enables Show Overlay checkbox. Overrides preset selection.

**Scale** — range: 10%–200%, default: 100%  
Resizes overlay image.

**Opacity** — range: 0%–100%, default: 100%  
Controls overlay transparency.

**Position X / Y** — range: 0%–100%, default: 50% / 50%  
Places overlay anywhere on screen. 0%, 0% = top-left; 100%, 100% = bottom-right; 50%, 50% = centered.

**Export behavior**  
Overlays are included in PNG, video, and depth map exports. Excluded from SVG exports (vector only). To export without overlay: uncheck Show Overlay before exporting.

---

### Export section

**Export PNG** (P) — format: `.png`  
Direct canvas capture with transparency. Dimensions match current canvas (or framebuffer dimensions if enabled).

**Export SVG** (S) — format: `.svg`  
Vector version of current image, line by line with exact projection. Infinite scaling without quality loss.

**Export depth map** (D) — format: `.png` grayscale  
Encodes Z depth as brightness: close = white, far = black.

**Video recording** — format: `.webm` (recommended) or `.gif`  
Frame-by-frame capture for smooth, deterministic rendering. Start/stop from Export section UI. Red indicator displays during recording. File automatically exports when stopped.

⚠️ **Note:** MP4 export is not available in browsers. Export as WebM and convert using **Shutter Encoder** if needed (see Troubleshooting).

---

## Export

### Export formats

| Format | Type | Use case | Scalability |
|--------|------|-------------|-------------|
| PNG | Raster | Web, social media | Fixed dimensions |
| SVG | Vector | Print, design, editing | Infinite |
| Depth map | Raster | VFX, compositing, 3D | Fixed dimensions |
| Video | Temporal | Animation, presentation | Video resolution |

### Quick export

**Current frame:**
- P: export PNG image (includes overlay)
- S: export SVG vector file
- D: export depth map

**Video recording:**
1. Click Start Recording button in Export section
2. Click Stop Recording button (optional, auto-stops at configured duration)
3. Video downloads automatically with overlay included

---

## Project management

### Save project

1. Click Save button in Project section (or press Ctrl+S / ⌘+S)
2. Project JSON file downloads with timestamp
3. Contains all states, settings, and camera positions

### Load project

1. Click Load button in Project section
2. Select saved JSON file
3. Project restores immediately

Parameters are automatically saved to localStorage on every change. At first launch, starter project with example states loads from `presets/Init.json`.

---

## Best practices

### Performance

- Reduce emit rate to improve performance on slower systems
- High-resolution framebuffer mode (4K) demands more GPU
- Stereoscopic mode performs two simultaneous renders; reduce resolution if slowdown occurs
- Hide UI panel (Tab) for maximum performance

### Composition

- Position key elements off-center
- Use camera rotation to reveal spatial layers
- Bright colors on dark backgrounds produce high contrast
- Adjust Color Depth Separation to prevent z-fighting

### VR viewing

- Start with separation of 30 and adjust according to screen distance
- Avoid excessive separation to limit eye strain

### Recording

- Set all parameters before starting recording
- Close other applications to free up resources
- Short recordings (10–30 seconds) are easier to manage

### Social media export

- Instagram: 1080×1440 preset
- Web banner: 3500×1500 preset
- Twitter/X: 1920×1080 for video posts

---

## Technical reference

### Console Commands

For advanced control, debugging, and automation, see:
- **[Console Commands Reference](docs/English/Console-Commands.md)** — Complete list of browser console commands and global API functions

### Project structure

```
/
├── index.html              Main application file
├── css/                    Style sheets
├── js/                     JavaScript modules
│   ├── main.js            Entry point
│   ├── core/              Framework core (Camera, Projection, utils)
│   │                      + Current patch: Zigzag (Emitter, ZigzagLine)
│   ├── ui/                UI controllers
│   ├── storage/           State and localStorage management
│   ├── input/             Mouse and keyboard handlers
│   ├── export/            PNG, SVG, depth map, video exporters
│   ├── rendering/         SketchFactory (p5.js integration)
│   └── config/            Constants and defaults
├── config/                Configuration files
│   ├── appInfo.json       App metadata
│   ├── keyboardShortcuts.json  Keyboard mappings
│   ├── uiPresets.json     UI configuration
│   ├── overlayPresets.js  Overlay file list
│   └── presets/           Preset configurations
│       ├── manifest.json  Preset registry
│       └── Init.json          Default starter project
├── assets/overlays/       Base64-encoded overlay presets
└── utilities/             Overlay converter tool
```

### Development

Vanilla JavaScript (ES6 modules) with p5.js for WebGL rendering.

**Main dependencies:**
- p5.js v1.9.0 (WebGL mode)
- CCapture.js v1.1.0 (video capture)

**Architecture:**
- **Framework-first design**: Universal systems (camera, colors, export, storage) independent of visual algorithm
- **Patch system**: Current implementation is the Zigzag Emitter patch
- **Modular ES6**: Separate files for each component
- **State management**: Complete snapshots via localStorage
- **CPU-based projection**: Enables SVG and depth map exports

**See also:**
- **[SpaceFlow Architecture](docs/English/SPACEFLOW-ARCHITECTURE.md)** — Complete framework design and decoupling strategy
- **[Patch System](docs/English/PATCH-SYSTEM.md)** — How patches integrate with the framework

### Troubleshooting

**Lines not appearing**  
Check that emit rate > 0. Adjust camera distance with scroll wheel.

**Clipping issues**  
Adjust near/far clipping planes in Camera section at extreme zoom levels.

**Panning not working**  
Camera distance must be ≥ 50. Zoom out if necessary.

**Settings not saving**  
Verify browser localStorage permissions are enabled.

**Video file too large**  
Reduce duration, frame rate, or resolution in Export section.

**Want MP4 instead of WebM?**  
Browsers cannot export MP4 directly due to codec licensing. Export as WebM, then convert using:
- **Shutter Encoder** (recommended): https://github.com/paulpacifico/shutter-encoder — Professional open-source converter with GPU acceleration
- **ffmpeg**: `ffmpeg -i input.webm output.mp4`
- **HandBrake**: https://handbrake.fr/
- **Online**: CloudConvert, FreeConvert

**Choppy animation**  
Lower emit rate or close other programs. Disable random thickness/speed if lag persists.

**Overlay not showing**  
Check Show Overlay checkbox. Verify opacity > 0%. Ensure image loaded successfully.

**State renaming fails**  
Double-click directly on state name text. Avoid triggering keyboard shortcuts during rename.

**Keyboard shortcuts not working**  
Ensure state rename mode is not active. Shortcuts disabled while editing state names.

### Version history

**v26 (current)**
- State management system: save/load multiple states with smooth transitions
- Separate color transition duration control
- Auto-trigger state switching with shuffle algorithm
- Camera positions saved per state
- Overlay image system: import PNG/JPG/SVG, adjustable scale/opacity/position
- Overlay presets from `assets/overlays/` folder with Base64 encoding
- Automatic overlay compositing in PNG and video exports
- PixelDensity correction for high-resolution displays
- First-time user experience: auto-loads starter project with example states
- Project loading uses first state and synchronizes camera controls
- Modular ES6 architecture with separate class files
- H key for hiding controls
- Keyboard shortcuts disabled during state renaming

**Earlier versions (v12 and below)**
- Depth map export with auto-ranging
- CPU-based projection for depth maps
- Centralized keyboard shortcuts system
- FOV compensation for camera distance
- Mouse-based camera controls (orbit, pan, zoom)
- Stereoscopic viewing mode
- Framebuffer resolution control
- Random thickness/speed modulations
- SVG/PNG/video export capabilities
- LocalStorage persistence

### Browser compatibility

- Chrome/Edge: full support
- Firefox: full support
- Safari: full support
- Mobile browsers: limited (no mouse controls)

Minimum requirements: WebGL support, ES6 JavaScript, Canvas 2D API, file download support.

### Credits and license

- p5.js (v1.9.0) - Creative coding framework
- CCapture.js (v1.1.0) - Frame capture for video export
- ddelcourt2026 / Developed for TheSpaceLab / Mapping 2026

MIT License — CC BY-NC-SA — ddelcourt 2026

