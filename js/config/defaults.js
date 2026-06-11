// ═══════════════════════════════════════════════════════════════════════════
// SPACEFLOW - Default Parameters
// Default runtime parameters for the application
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_PARAMS = {
  // Geometry
  segmentLength: 120,
  lineThickness: 24,
  emitterRotation: 0,
  geometryScale: 100,
  fadeDuration: 1.0,

  // Color Palettes
  palettes: [
    [ // Palette 0 - Monochrome
      { rgb: [255, 255, 255], role: 'line' },
      { rgb: [0, 0, 0], role: 'background' },
      { rgb: [180, 180, 180], role: 'line' },
      { rgb: [60, 60, 60], role: 'none' }
    ],
    [ // Palette 1 - Warm
      { rgb: [255, 140, 60], role: 'line' },
      { rgb: [20, 10, 5], role: 'background' },
      { rgb: [255, 90, 120], role: 'line' },
      { rgb: [200, 180, 50], role: 'line' }
    ],
    [ // Palette 2 - Cool
      { rgb: [120, 200, 255], role: 'line' },
      { rgb: [5, 10, 20], role: 'background' },
      { rgb: [80, 255, 180], role: 'line' },
      { rgb: [160, 120, 255], role: 'none' }
    ],
    [ // Palette 3 - Vibrant
      { rgb: [255, 60, 200], role: 'line' },
      { rgb: [10, 20, 10], role: 'background' },
      { rgb: [60, 255, 100], role: 'line' },
      { rgb: [255, 220, 60], role: 'line' }
    ]
  ],
  activePaletteIndex: 0,
  colorTransitionDuration: 3,
  stateTransitionDuration: 180, // Transition time for geometry, behavior, camera, modulations
  colorSlotZOffset: 100, // Z-offset multiplier per color slot (prevents z-fighting)
  colorRandomSeed: 1, // Seed for deterministic color selection (1-9999)
  
  // State Auto-Trigger
  autoTriggerStates: false,
  autoTriggerFrequency: 30, // seconds (5-240)

  // Animation
  emitRate: 1.5,
  speed: 80,
  ambientSpeedMaster: 100,

  // Modulation
  randomThickness: false,
  randomSpeed: false,
  thicknessRangeMin: 10,
  thicknessRangeMax: 200,
  speedRangeMin: 50,
  speedRangeMax: 150,

  // Camera
  fov: 60,
  near: 0.01,
  far: 5000,
  cameraRotationX: -0.3,
  cameraRotationY: 0,
  cameraDistance: 600,
  cameraOffsetX: 0,
  cameraOffsetY: 0,

  // Stereoscopic
  stereoscopicMode: false,
  eyeSeparation: 30,

  // Framebuffer
  framebufferMode: false,
  framebufferPreset: '1920x1080',
  framebufferWidth: 1920,
  framebufferHeight: 1080,
  canvasBorderVisible: false,
  canvasBorderColor: '#adff2f',

  // Video Export
  videoDuration: 10,
  videoFPS: 30,
  videoFormat: 'webm',

  // Depth Map
  depthInvert: false,

  // Overlay Image
  overlayImageSrc: null,
  overlayPresetFile: null,
  overlayCustomFilename: null,
  overlayCustomImageSrc: null,
  overlayVisible: false,
  overlayAutoFit: false,
  overlayScale: 100,
  overlayOpacity: 100,
  overlayX: 50,
  overlayY: 50,
  
  // Text Message Overlay
  textOverlayMessage: '',
  textOverlayVisible: false,
  textOverlayFade: 100,
  textOverlaySize: 48,  // Font size in pixels (40-200)
  textOverlayPosition: 'center',  // Position: 'top', 'center', or 'bottom'
  textOverlayColor: '#ffffff',  // Text color (hex)
  textOverlayAlign: 'center',  // Alignment: 'left', 'center', or 'right'
  textOverlayWeight: '500',  // Font weight: variable 100-900 (default 500 medium)
  textOverlayFadeDuration: 0.5  // Fade transition duration in seconds (0.1-3.0)
};
