# SpaceFlow / ZigMap26 — Project Overview

**Created:** May 29, 2026  
**Project Path:** Can be moved/renamed — this context travels with the workspace  
**Version:** 26.3

## Project Identity

**Name:** SpaceFlow (formerly ZigMap26)  
**Author:** ddelcourt  
**Year:** 2026  
**Type:** Interactive 3D generative art framework  
**Stack:** Vanilla JavaScript + p5.js  
**License:** MIT

## What It Is

**SpaceFlow** is a modular framework for real-time 3D generative art with:
- Camera controls (orbit, pan, zoom, roll)
- Color palette system (4×4 palettes with transitions)
- Export system (PNG, SVG, Video, depth maps)
- State management (snapshots with auto-trigger cycling)
- Multi-window sync (for projection mapping)
- Overlay system (logos, branding)
- Pluggable "patches" (visual algorithms)

**Current Patch:** Zigzag Emitter — animated 3D ribbon patterns

## Project Evolution

### Phase 1: ZigMap26 (Original)
- Monolithic zigzag generator
- All code tightly coupled
- Hard-coded UI and parameters
- Single visual algorithm

### Phase 2: SpaceFlow Framework (Current/In Progress)
- Modular architecture with pluggable patches
- Manifest-driven parameter system
- Auto-generated UI from JSON manifests
- Universal systems (camera, color, export) work with any patch
- Patch-specific systems (geometry, behavior) are pluggable

## Use Cases

**Creative Tool:**
- Live visual performances (VJ tool)
- Social media content generation
- Print graphics (SVG export)
- Projection mapping installations

**Future Vision:**
- Framework for ANY generative algorithm
- Community-contributed patches
- Multi-layer composition system
- Real-time performance tool

## Critical Feature: SVG Export

**🚨 SVG EXPORT IS NON-NEGOTIABLE — #1 PRIORITY**

- Resolution-independent vector graphics
- Professional workflow (Illustrator, Inkscape)
- Print-ready quality
- MUST work after every code change
- Testing SVG export is mandatory before any commit

## Quick Start

1. Open `index.html` in browser
2. Control panel loads automatically
3. Mouse: rotate (left), pan (right), zoom (wheel)
4. Keyboard: Tab (hide UI), Enter (fullscreen), P (PNG), S (SVG)
5. States panel: save/load configuration snapshots

## File Organization

```
index.html              — Main app entry
welcome.html            — Project selector with presets
player.html             — Display-only window (no UI)
display.html            — Minimal display window

js/
  main.js               — App initialization
  config/               — Constants, defaults
  core/                 — Camera, Emitter, ZigzagLine, Projection, utils
  export/               — PNG, SVG, Video, Depth exporters
  input/                — Keyboard, Mouse handlers
  rendering/            — Sketch factory
  storage/              — localStorage, StateManager
  sync/                 — WindowSync (multi-window)
  ui/                   — UI controllers (needs refactoring)

config/
  presets/              — JSON preset files
  overlayPresets.js     — Overlay configuration
  uiPresets.json        — UI panel presets

scripts/
  update-all            — Master update script (⇧⌘B)
  welcome-updater       — Updates preset manifest
  overlay-updater       — Updates overlay manifest

docs/
  English/              — Complete documentation
  French/               — French translations
  context/              — AI assistant context (this directory)
```

## Documentation

- `README.md` — User guide and controls
- `docs/English/SPACEFLOW-ARCHITECTURE.md` — Master architecture document
- `docs/English/PATCH-SYSTEM.md` — Patch interface specification
- `docs/English/MIGRATION-STRATEGY.md` — Implementation roadmap
- `docs/English/Documentation.md` — Technical reference
- `docs/English/User-Manual.md` — Complete UI guide

## Key Concepts

**States:** Complete configuration snapshots (camera + colors + parameters)  
**Patches:** Pluggable visual algorithms with manifest-defined parameters  
**Palettes:** 4 color sets with 4 colors each, deterministic RNG selection  
**Transitions:** Smooth animations between states (color + parameter)  
**Framebuffer Mode:** Fixed resolution rendering independent of window size  
**Stereoscopic Mode:** Side-by-side dual-camera rendering  
**Overlay System:** Logo/branding with position and opacity control

## Build/Update Workflow

**After adding/removing presets or overlays:**
```bash
./scripts/update-all
```

**Or in VS Code:** `⇧⌘B` (default build task)

This updates manifest files that drive the welcome page and overlay selector.

## Status: May 2026

- ✅ Core framework complete and stable
- ✅ 12+ presets with diverse visual styles
- ✅ All export formats working (SVG verified)
- ✅ Multi-window sync operational
- ✅ State management with auto-trigger
- 🚧 Migration to full SpaceFlow architecture (13-week plan documented)
- 🔮 Future: Dynamic UI generation from manifests
- 🔮 Future: Pluggable patch loading system
- 🔮 Future: Multi-layer composition for VJ workflows
