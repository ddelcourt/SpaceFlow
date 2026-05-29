# SpaceFlow — Architecture Decisions

**Context:** Key design decisions and their rationale

## Core Architecture: Framework + Patches

**Decision:** Separate universal systems from patch-specific code

**Rationale:**
- Reusability: Camera, colors, export work with ANY visual algorithm
- Extensibility: Add new patches without rewriting framework
- Maintainability: Clear separation of concerns
- Scalability: Framework handles UI, storage, sync automatically

**Universal Systems (Framework):**
- Camera System — 3D navigation, projection matrix
- Color Palette System — 4×4 palettes with transitions
- Export System — PNG, SVG, Video, depth maps
- Storage System — localStorage, JSON presets, state snapshots
- Window Sync — Multi-window coordination
- Overlay System — Logo/branding positioning

**Patch Systems (Pluggable):**
- Geometry generation
- Animation/behavior logic
- Patch-specific parameters
- Visual algorithm implementation

## Manifest-Driven Parameters

**Decision:** Define parameters once in JSON manifest, auto-generate everything else

**Rationale:**
- Single source of truth eliminates sync bugs
- Adding parameter = one JSON entry
- UI generation, storage, validation all automatic
- Reduces boilerplate by 80%+
- Makes framework truly extensible

**Manifest Structure:**
```json
{
  "id": "zigzag-emitter",
  "name": "Zigzag Emitter",
  "version": "26.3",
  "parameters": [
    {
      "key": "segmentLength",
      "type": "slider",
      "label": "Segment Length",
      "min": 10, "max": 200, "default": 50,
      "category": "geometry"
    }
  ]
}
```

## State Management Design

**Decision:** States are complete snapshots, not diffs

**Rationale:**
- Predictable: Loading a state always produces same result
- Portable: States can be shared, backed up, versioned
- Transition-friendly: Easy to interpolate between complete states
- Debug-friendly: Can inspect entire configuration at once

**State Contents:**
- All patch parameters
- Camera position and settings
- Active color palette index
- Framebuffer/stereoscopic settings
- Overlay configuration

## Color System: Deterministic RNG

**Decision:** Use seeded PRNG (mulberry32) for color selection

**Rationale:**
- Reproducibility: Same seed = same colors
- State compatibility: Colors consistent across loads
- Export reliability: PNG/SVG match screen exactly
- Performance: Fast, no external dependencies

**Implementation:**
- Each line gets color from seeded RNG
- Seed stored in params, saved with states
- RNG reset when palette changes or state loads

## Transition System: Dual Timelines

**Decision:** Separate durations for color vs parameter transitions

**Rationale:**
- Flexibility: Color changes can be instant, state loads gradual (or vice versa)
- User control: Different aesthetic needs for different transition types
- Performance: Can optimize separately

**Timelines:**
- `colorTransitionDuration`: 0-30s for palette changes
- `stateTransitionDuration`: 0-30s for camera/geometry changes

## Export System: Resolution Independence

**Decision:** SVG export uses geometry directly, not canvas rasterization

**Rationale:**
- **Professional requirement:** Print shops need vectors
- **Scalability:** Infinite resolution without file size penalty
- **Editability:** Can open in Illustrator/Inkscape for post-processing
- **Precision:** Mathematical accuracy, no anti-aliasing artifacts

**Critical Implementation:**
- Patches MUST implement `getGeometry()` method
- Returns arrays of points and colors
- Framework handles projection and SVG generation
- **Non-negotiable:** If SVG breaks, everything stops until fixed

## Projection System: Modular Matrix Math

**Decision:** Separate projection calculations from rendering code

**Rationale:**
- Reusability: Same math for canvas, SVG, depth map
- Testability: Pure functions, easy to verify
- Performance: Can optimize projection separately
- Clarity: Projection logic documented in one place

**Key Functions:**
- `projectPoint(x, y, z, options)` — 3D to 2D transformation
- `projectVertex(line, localX, localY)` — Line-relative projection
- `calculateDefaultCameraZ()` — Perspective setup

## Storage Strategy: localStorage + JSON

**Decision:** Dual storage: localStorage for session, JSON for sharing

**Rationale:**
- localStorage: Automatic persistence, no user action needed
- JSON: Portable, shareable, version-controllable
- Hybrid: Best of both worlds

**Storage Keys:**
- `ZM.params` — Current parameter values
- `ZM.states` — State snapshots array
- `ZM.lastActiveStateIndex` — Resume on reload

## Multi-Window Sync: BroadcastChannel

**Decision:** Use BroadcastChannel API for window communication

**Rationale:**
- Native browser API: No external dependencies
- Real-time: Low latency for live performance
- Bi-directional: Any window can broadcast
- Simple: Fire-and-forget messaging

**Sync Behavior:**
- Primary window (editor): Full UI, sends updates
- Secondary windows (player/display): Receive-only, minimal UI
- State loads, palette changes, parameter updates all sync

## UI Layout: Collapsible Category Panels

**Decision:** Organize parameters in expandable/collapsible sections

**Rationale:**
- Scalability: Works with 5 or 50 parameters
- Discoverability: Categories make features findable
- Focus: Collapse unused sections to reduce visual clutter
- Workflow: Expand only what you're currently adjusting

**Categories:**
- Geometry
- Animation
- Modulation
- Color Palettes
- Camera
- States
- Export
- System

## Migration Strategy: Zero-Disruption

**Decision:** Refactor incrementally while maintaining backward compatibility

**Rationale:**
- Risk mitigation: Working system always available
- User experience: No sudden breaking changes
- Development workflow: Can pause/resume at phase boundaries
- Testing: Continuous validation, no "big bang" deployment

**Phases:**
1. Foundation (core classes)
2. Code extraction (isolate patch logic)
3. Interface implementation (patch API)
4. Dynamic UI (manifest-driven controls)
5. Patch loading (pluggable system)
6. Finalization (polish, optimization)

**Gate:** SVG export tested after EVERY phase

## Performance: 60fps Target

**Decision:** Optimize for smooth 60fps animation

**Rationale:**
- Visual quality: Smooth motion critical for generative art
- VJ use case: Live performance demands consistent framerate
- User experience: Responsive camera controls
- Future-proof: Handles more complex patches

**Strategies:**
- Object pooling for lines (avoid GC pressure)
- Culling: Don't draw off-screen geometry
- Batch rendering: Single pass per frame
- Performance monitor: Real-time FPS display

## Browser Support: Modern Browsers

**Decision:** Target Chrome, Firefox, Safari, Edge (last 2 versions)

**Rationale:**
- ES6 modules: Clean architecture
- Canvas API: Core rendering
- BroadcastChannel: Multi-window sync
- File API: Export system
- Pragmatic: 95%+ coverage without transpilation overhead

**No polyfills needed:**
- Target audience uses modern browsers
- Creative tools typically cutting-edge
- Reduces bundle size and complexity
