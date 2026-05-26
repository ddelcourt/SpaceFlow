/**
 * SpaceFlow Player — Minimal player mode for distribution
 * Load and display ZigMap26 presets without editor controls
 */

// Import configurations
import { DEFAULT_PARAMS } from './config/defaults.js';
import { SEGMENTS } from './config/constants.js';

// Import core classes
import { ZigzagLine } from './core/ZigzagLine.js';
import { Emitter } from './core/Emitter.js';
import { Camera } from './core/Camera.js';
import { getSpawnDistance, buildRibbonSides } from './core/utils.js';

// Import storage (we only need loading, not saving)
import { initializeStateManager } from './storage/StateManager.js';

// Import rendering
import { attachToZM } from './rendering/SketchFactory.js';

// Import input handlers
import { setupMouseHandlers } from './input/MouseHandler.js';

// Import export functions
import { exportPNG } from './export/PNGExporter.js';
import { exportSVG } from './export/SVGExporter.js';

// Import keyboard handler (for play/pause controls)
// Note: Using custom keyboard handler for player-specific overlay controls

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL APPLICATION STATE
// ═══════════════════════════════════════════════════════════════════════════

window.SpaceFlow = {
  // Parameters
  params: { 
    ...DEFAULT_PARAMS
  },
  
  // Constants
  SEGMENTS,
  
  // State
  noiseOffset: 0,
  W: window.innerWidth,
  H: window.innerHeight,
  camera: null,
  p5Instance: null,
  p5InstanceRight: null,
  emitterInstance: null,
  
  // Utilities
  getSpawnDistance,
  buildRibbonSides,
  
  // Core classes
  ZigzagLine,
  Emitter,
  Camera,
  
  // Player mode flag
  isPlayerMode: true,
  
  // Export functions (enabled in player mode)
  exportPNG: () => exportPNG(window.SpaceFlow),
  exportSVG: () => exportSVG(window.SpaceFlow),
  
  // Placeholder functions for player mode
  saveToLocalStorage: () => {}, // No saving in player mode
  syncUIFromParams: () => {}, // No UI controls in player mode
  updatePaletteUI: () => {},
  updateStatePanel: () => {}
  // showToast will be assigned after function definition
};

// ═══════════════════════════════════════════════════════════════════════════
// CANVAS BORDER CONTROL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Apply canvas border visibility and color
 * @param {boolean} visible - Whether border should be visible
 * @param {string} color - Border color (default green)
 */
function applyCanvasBorder(visible, color = '#adff2f') {
  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) return;
  wrapper.style.setProperty('--canvas-border-color', color);
  wrapper.classList.toggle('canvas-border-hidden', !visible);
}

// ═══════════════════════════════════════════════════════════════════════════
// PRESET LOADING FROM URL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load preset from URL parameter
 * @param {string} presetName - Name of preset file (without .json extension)
 */
async function loadPresetFromURL(presetName) {
  try {
    // Show loading indicator
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    if (dropzoneOverlay) dropzoneOverlay.classList.add('hidden');
    
    const response = await fetch(`config/presets/${presetName}.json`);
    if (!response.ok) {
      throw new Error(`Preset "${presetName}" not found`);
    }
    
    const jsonData = await response.json();
    
    console.log(`✓ Loaded preset: ${presetName}.json`);
    
    // Load the preset
    loadPreset(jsonData);
    
  } catch (err) {
    console.error('❌ Failed to load preset from URL:', err);
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    showError('Failed to load preset: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DROPZONE & FILE LOADING
// ═══════════════════════════════════════════════════════════════════════════

// DOM elements (will be initialized after DOM is ready)
let dropzoneOverlay, fileInput, fileSelectBtn, loadingIndicator, errorDisplay, errorMessage, errorRetryBtn;

/**
 * Initialize dropzone event listeners
 */
function initializeDropzone() {
  // Get DOM elements
  dropzoneOverlay = document.getElementById('dropzone-overlay');
  fileInput = document.getElementById('file-input');
  fileSelectBtn = document.getElementById('file-select-btn');
  loadingIndicator = document.getElementById('loading-indicator');
  errorDisplay = document.getElementById('error-display');
  errorMessage = document.getElementById('error-message');
  errorRetryBtn = document.getElementById('error-retry-btn');
  
  // Check if all elements exist
  if (!dropzoneOverlay || !fileInput || !fileSelectBtn) {
    console.error('❌ Failed to initialize dropzone: missing DOM elements');
    console.error('dropzoneOverlay:', dropzoneOverlay);
    console.error('fileInput:', fileInput);
    console.error('fileSelectBtn:', fileSelectBtn);
    return;
  }
  
  console.log('✓ Dropzone elements found, attaching listeners...');
  
  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Highlight dropzone when dragging over
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzoneOverlay.addEventListener(eventName, () => {
      dropzoneOverlay.classList.add('dragging');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropzoneOverlay.addEventListener(eventName, () => {
      dropzoneOverlay.classList.remove('dragging');
    }, false);
  });
  
  // Handle drop
  dropzoneOverlay.addEventListener('drop', handleDrop, false);
  
  // File select button
  fileSelectBtn.addEventListener('click', () => {
    console.log('📁 File select button clicked');
    fileInput.click();
  });
  
  // File input change
  fileInput.addEventListener('change', (e) => {
    console.log('📁 File input changed');
    const file = e.target.files[0];
    if (file) {
      console.log('📁 File selected:', file.name);
      loadJSONFile(file);
    }
  });
  
  // Error retry button
  if (errorRetryBtn) {
    errorRetryBtn.addEventListener('click', () => {
      errorDisplay.style.display = 'none';
      dropzoneOverlay.classList.remove('hidden');
    });
  }
  
  console.log('✓ Dropzone initialized successfully');
}

/**
 * Handle dropped files
 */
function handleDrop(e) {
  console.log('📁 File dropped!');
  const dt = e.dataTransfer;
  const files = dt.files;
  
  if (files.length > 0) {
    const file = files[0];
    console.log('📁 Dropped file:', file.name, 'Type:', file.type);
    
    // Check if it's a JSON file
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      loadJSONFile(file);
    } else {
      showError('Invalid file type. Please drop a .json file created with SpaceFlow Editor.');
    }
  }
}

/**
 * Load and parse JSON file
 */
function loadJSONFile(file) {
  console.log('📥 Loading JSON file:', file.name);
  
  // Show loading indicator
  if (loadingIndicator) loadingIndicator.style.display = 'flex';
  if (dropzoneOverlay) dropzoneOverlay.classList.add('hidden');
  
  const reader = new FileReader();
  
  reader.onload = (event) => {
    try {
      const jsonData = JSON.parse(event.target.result);
      
      // Validate JSON structure
      if (!jsonData.params) {
        throw new Error('Invalid SpaceFlow preset file. Missing params object.');
      }
      
      // Load the preset
      loadPreset(jsonData);
      
    } catch (err) {
      console.error('❌ Error parsing JSON:', err);
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      showError(`Failed to load preset: ${err.message}`);
    }
  };
  
  reader.onerror = () => {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    showError('Failed to read file. Please try again.');
  };
  
  reader.readAsText(file);
}

/**
 * Load preset data and initialize visualization
 */
function loadPreset(jsonData) {
  const ZM = window.SpaceFlow;
  
  try {
    // Check if preset has states
    if (jsonData.states && Array.isArray(jsonData.states) && jsonData.states.length > 0) {
      // Load top-level params first (contains project-wide settings)
      if (jsonData.params) {
        Object.assign(ZM.params, jsonData.params);
      }
      
      // Snapshot project-wide settings before merging first state params
      // (state params from older saves may include these and would override them)
      const projectWide = {
        near: ZM.params.near,
        far: ZM.params.far,
        framebufferMode: ZM.params.framebufferMode,
        framebufferPreset: ZM.params.framebufferPreset,
        framebufferWidth: ZM.params.framebufferWidth,
        framebufferHeight: ZM.params.framebufferHeight,
        stereoscopicMode: ZM.params.stereoscopicMode,
        eyeSeparation: ZM.params.eyeSeparation,
        canvasBorderVisible: ZM.params.canvasBorderVisible,
        canvasBorderColor: ZM.params.canvasBorderColor,
      };

      // Then load the first state's params (overrides state-specific settings)
      const firstState = jsonData.states[0];
      Object.assign(ZM.params, firstState.params);

      // Restore project-wide settings so state params cannot clobber them
      Object.assign(ZM.params, projectWide);
      
      // Apply camera from first state if present
      if (firstState.camera) {
        ZM.params.cameraRotationX = firstState.camera.rotationX;
        ZM.params.cameraRotationY = firstState.camera.rotationY;
        ZM.params.cameraDistance = firstState.camera.distance;
        ZM.params.cameraOffsetX = firstState.camera.offsetX;
        ZM.params.cameraOffsetY = firstState.camera.offsetY;
      }
    } else {
      // No states - use top-level params
      Object.assign(ZM.params, jsonData.params);
    }
    
    // Apply canvas border from params
    const borderVisible = ZM.params.canvasBorderVisible === true;
    applyCanvasBorder(borderVisible, ZM.params.canvasBorderColor || '#adff2f');
    
    // Initialize visualization if not already initialized
    if (!ZM.p5Instance) {
      initializeVisualization(jsonData);
    } else {
      // Already initialized, just update
      updateVisualization(jsonData);
    }
    
    // Hide loading indicator and dropzone after successful load
    setTimeout(() => {
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      if (dropzoneOverlay) dropzoneOverlay.style.display = 'none';
      console.log('✅ Visualization should now be visible');
    }, 500);
    
  } catch (err) {
    console.error('❌ Error loading preset:', err);
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    showError(`Failed to initialize visualization: ${err.message}`);
  }
}

/**
 * Initialize the visualization for the first time
 */
function initializeVisualization(jsonData) {
  const ZM = window.SpaceFlow;
  
  // Initialize camera with params (not ZM object)
  ZM.camera = new Camera(ZM.params);
  
  // Initialize state manager
  initializeStateManager(ZM);
  
  // Load overlay preset files list if present (just filenames, not base64 data)
  if (jsonData.overlayPresetFiles && Array.isArray(jsonData.overlayPresetFiles)) {
    ZM.overlayPresetFiles = jsonData.overlayPresetFiles;
    console.log(`✓ Found ${ZM.overlayPresetFiles.length} overlay presets available`);
  } else {
    ZM.overlayPresets = [];
  }
  
  // Restore states if present
  if (jsonData.states && Array.isArray(jsonData.states)) {
    ZM.stateManager.states = jsonData.states;
    ZM.stateManager.activeStateId = jsonData.activeStateId;
    
    // Load the first state WITHOUT transitions (instant jump) using state manager
    if (jsonData.states.length > 0) {
      const firstState = jsonData.states[0];
      
      // Use state manager to properly load the first state (with instant=true)
      // This ensures the state is added to history and transitions work correctly
      ZM.stateManager.load(firstState.id, true);
      
      console.log('📷 Camera loaded from first state:', firstState.name);
      console.log('  - distance:', ZM.camera.distance);
      console.log('  - rotationX:', ZM.camera.rotationX);
      console.log('  - rotationY:', ZM.camera.rotationY);
      console.log('  - offsetX:', ZM.camera.offsetX);
      console.log('  - offsetY:', ZM.camera.offsetY);
      console.log('  - geometryScale:', ZM.params.geometryScale);
    }
  } else {
    // No states - sync camera from params
    ZM.camera.syncFromParams(ZM.params);
  }
  
  // Attach rendering (creates p5.js sketch)
  attachToZM(ZM);
  
  // Setup mouse handlers for orbit control
  setupMouseHandlers(ZM);
  
  // Setup keyboard handlers for play/pause controls
  setupKeyboardHandlers(ZM);
  
  // Setup window resize handler
  setupResizeHandler(ZM);
  
  // Initialize sketches
  console.log('🎨 About to initialize sketches...');
  if (ZM.initializeSketches) {
    ZM.initializeSketches();
    console.log('✓ Sketches initialized, p5Instance:', ZM.p5Instance ? 'created' : 'null');
  } else {
    console.error('❌ initializeSketches function not found on ZM object');
  }
  
  // Auto-start auto-trigger if enabled and states exist
  if (ZM.params.autoTriggerStates && ZM.stateManager.states.length > 1) {
    console.log('🎬 Auto-trigger enabled, starting playback...');
    
    // Initialize auto-trigger timer
    if (!ZM.autoTriggerTimer) {
      ZM.autoTriggerTimer = {
        elapsed: 0,
        paused: false,
        pausedAt: null
      };
    }
  }
  
  // Display overlay if present
  const overlayImg = document.getElementById('overlay-image');
  if (overlayImg) {
    // Load overlay from preset file if specified
    if (ZM.params.overlayPresetFile) {
      loadOverlayFromFile(ZM, ZM.params.overlayPresetFile, overlayImg);
    } else {
      // Use existing overlayImageSrc (custom upload or already loaded)
      updateOverlayDisplay(ZM, overlayImg);
    }
  }
  
  console.log('✓ ZigMap26 Player initialized');
  console.log(`✓ Loaded ${ZM.stateManager.states.length} states`);
}

/**
 * Update visualization with new preset data
 */
function updateVisualization(jsonData) {
  const ZM = window.SpaceFlow;
  
  // Restore states if present
  if (jsonData.states && Array.isArray(jsonData.states)) {
    ZM.stateManager.states = jsonData.states;
    ZM.stateManager.activeStateId = jsonData.activeStateId;
    
    // Load the first state
    if (jsonData.states.length > 0) {
      const firstState = jsonData.states[0];
      ZM.stateManager.load(firstState.id);
    }
  } else {
    // No states - sync camera from loaded params
    ZM.camera.syncFromParams(ZM.params);
  }
  
  // Auto-start auto-trigger if enabled
  if (ZM.params.autoTriggerStates && ZM.stateManager.states.length > 1) {
    if (!ZM.autoTriggerTimer) {
      ZM.autoTriggerTimer = {
        elapsed: 0,
        paused: false,
        pausedAt: null
      };
    }
    ZM.autoTriggerTimer.elapsed = 0;
    ZM.autoTriggerTimer.paused = false;
  }
  
  // Update overlay display
  const overlayImg = document.getElementById('overlay-image');
  if (overlayImg) {
    updateOverlayDisplay(ZM, overlayImg);
  }
  
  console.log('✓ Preset updated');
}

/**
 * Setup keyboard handlers for player controls
 */
function setupKeyboardHandlers(ZM) {
  console.log('⌨️  Setting up keyboard handlers');
  console.log('  - StateManager available:', !!ZM.stateManager);
  console.log('  - navigateStates available:', !!(ZM.stateManager && ZM.stateManager.navigateStates));
  console.log('  - States count:', ZM.stateManager ? ZM.stateManager.states.length : 0);
  
  // Setup overlay image element
  const overlayImg = document.getElementById('overlay-image');
  
  // Setup fullscreen button
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  // Helper: is the Fullscreen API available on this device?
  const canFullscreen = !!(
    document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen
  );

  // Helper: enter fullscreen cross-browser
  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    return Promise.reject(new Error('Fullscreen not supported'));
  };

  // Helper: exit fullscreen cross-browser
  const exitFullscreen = () => {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  };

  // Helper: current fullscreen element cross-browser
  const getFullscreenElement = () =>
    document.fullscreenElement || document.webkitFullscreenElement || null;

  // Hide the button entirely on iOS (fullscreen API not supported; use PWA standalone instead)
  if (!canFullscreen) {
    if (fullscreenBtn) fullscreenBtn.style.display = 'none';
  }

  // Also hide if already running as PWA standalone (no browser chrome to escape)
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    if (fullscreenBtn) fullscreenBtn.style.display = 'none';
  }

  if (fullscreenBtn && canFullscreen) {
    fullscreenBtn.addEventListener('click', () => {
      if (!getFullscreenElement()) {
        enterFullscreen().catch(err => {
          console.log('Fullscreen request failed:', err);
        });
      } else {
        exitFullscreen();
      }
    });
  }
  
  // Setup cursor auto-hide in fullscreen
  let cursorTimeout = null;
  const hideCursor = () => {
    if (document.fullscreenElement) {
      document.body.classList.add('hide-cursor');
    }
  };
  
  const showCursor = () => {
    // In player mode, don't show cursor on interaction - keep it hidden in fullscreen
    // The cursor should stay hidden throughout the fullscreen experience
    return;
  };
  
  // We don't need mouse event listeners in player since cursor stays hidden
  // document.addEventListener('mousemove', showCursor);
  // document.addEventListener('mousedown', showCursor);
  
  // Handle fullscreen change events (standard + webkit)
  const onFullscreenChange = () => {
    if (getFullscreenElement()) {
      document.body.classList.add('hide-cursor');
    } else {
      if (cursorTimeout) {
        clearTimeout(cursorTimeout);
        cursorTimeout = null;
      }
      document.body.classList.remove('hide-cursor');
    }
  };
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  
  window.addEventListener('keydown', (e) => {
    // Skip if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    // Enter: Toggle fullscreen
    if (e.code === 'Enter') {
      e.preventDefault();
      if (!getFullscreenElement()) {
        enterFullscreen().catch(err => {
          console.log('Fullscreen request failed:', err);
        });
      } else {
        exitFullscreen();
      }
    }
    
    // Spacebar: Play/Pause
    if (e.code === 'Space') {
      e.preventDefault();
      if (ZM.autoTriggerTimer) {
        ZM.autoTriggerTimer.paused = !ZM.autoTriggerTimer.paused;
        console.log('Auto-trigger', ZM.autoTriggerTimer.paused ? 'paused' : 'playing');
      }
    }
    
    // Arrow keys: Next/Previous state (cycle through all states)
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      if (ZM.stateManager && ZM.stateManager.navigateStates) {
        console.log('⬅️  Previous state');
        ZM.stateManager.navigateStates(-1);
      } else {
        console.warn('State manager not available for navigation');
      }
    }
    
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      if (ZM.stateManager && ZM.stateManager.navigateStates) {
        console.log('➡️  Next state');
        ZM.stateManager.navigateStates(1);
      } else {
        console.warn('State manager not available for navigation');
      }
    }
    
    // Overlay controls: 0-9 keys
    // Key 0: Toggle overlay on/off
    if (e.key === '0') {
      e.preventDefault();
      ZM.params.overlayVisible = !ZM.params.overlayVisible;
      updateOverlayDisplay(ZM, overlayImg);
      console.log('🖼️  Overlay', ZM.params.overlayVisible ? 'visible' : 'hidden');
    }
    
    // Keys 1-9: Load overlay from presets list
    if (e.key >= '1' && e.key <= '9') {
      e.preventDefault();
      const index = parseInt(e.key) - 1;
      
      if (ZM.overlayPresetFiles && index < ZM.overlayPresetFiles.length) {
        const filename = ZM.overlayPresetFiles[index];
        loadOverlayFromFile(ZM, filename, overlayImg);
        console.log(`🖼️  Loading overlay ${index + 1}: ${filename}`);
      } else {
        console.log(`No overlay preset at index ${index + 1}`);
      }
    }
    
    // Export shortcuts:
    // P: Export PNG
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (ZM.exportPNG) {
        console.log('📸 Exporting PNG...');
        ZM.exportPNG();
      }
    }
    
    // S: Export SVG
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      if (ZM.exportSVG) {
        console.log('📐 Exporting SVG...');
        ZM.exportSVG();
      }
    }

    // I: Toggle keyboard shortcuts info toast
    if (e.key === 'i' || e.key === 'I') {
      e.preventDefault();
      toggleShortcutsToast();
    }
  });
}

/**
 * Load overlay from preset file in assets/overlays/
 */
async function loadOverlayFromFile(ZM, filename, overlayImg) {
  try {
    const response = await fetch(`assets/overlays/${filename}`);
    if (response.ok) {
      const data = await response.json();
      if (data.base64) {
        ZM.params.overlayImageSrc = data.base64;
        ZM.params.overlayPresetFile = filename;
        ZM.params.overlayVisible = true;
        updateOverlayDisplay(ZM, overlayImg);
        const displayName = filename.replace('.json', '').replace(/_/g, ' ');
        console.log(`✓ Loaded overlay: ${displayName}`);
      }
    } else {
      console.error(`Failed to load overlay: ${filename}`);
    }
  } catch (err) {
    console.error(`Error loading overlay from ${filename}:`, err);
  }
}

/**
 * Update overlay image display
 */
function updateOverlayDisplay(ZM, overlayImg) {
  if (!overlayImg) return;
  
  if (ZM.params.overlayVisible && ZM.params.overlayImageSrc) {
    overlayImg.style.display = 'block';
    overlayImg.src = ZM.params.overlayImageSrc;
    
    // Apply overlay parameters
    const scale = ZM.params.overlayScale || 100;
    const opacity = ZM.params.overlayOpacity || 100;
    const x = ZM.params.overlayX || 50;
    const y = ZM.params.overlayY || 50;
    
    overlayImg.style.transform = `translate(-50%, -50%) scale(${scale / 100})`;
    overlayImg.style.opacity = opacity / 100;
    overlayImg.style.left = `${x}%`;
    overlayImg.style.top = `${y}%`;
  } else {
    overlayImg.style.display = 'none';
  }
}

/**
 * Show error message
 */
function showError(message) {
  console.error('❌ Player error:', message);
  if (errorMessage) errorMessage.textContent = message;
  if (errorDisplay) errorDisplay.style.display = 'flex';
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Setup window resize handler
 */
function setupResizeHandler(ZM) {
  window.addEventListener('resize', () => {
    if (ZM.p5Instance) {
      if (ZM.params.framebufferMode) {
        // In framebuffer mode, re-run updateCanvasSize to recalculate the fit scale
        if (ZM.updateCanvasSize) ZM.updateCanvasSize();
      } else {
        // Update dimensions to match new window size
        if (ZM.params.stereoscopicMode) {
          ZM.W = Math.floor(window.innerWidth / 2);
          ZM.H = window.innerHeight;
        } else {
          ZM.W = window.innerWidth;
          ZM.H = window.innerHeight;
        }

        ZM.p5Instance.resizeCanvas(ZM.W, ZM.H);
        if (ZM.p5InstanceRight) {
          ZM.p5InstanceRight.resizeCanvas(ZM.W, ZM.H);
        }
      }

      // Update overlay if visible
      const overlayImg = document.getElementById('overlay-image');
      if (overlayImg && ZM.params.overlayVisible) {
        updateOverlayDisplay(ZM, overlayImg);
      }
    }
  });
}

/**
 * Show the startup keyboard shortcuts toast for 7 seconds.
 * The toast can be dismissed early with the OK button.
 */
/**
 * Show the startup keyboard shortcuts toast.
 * @param {boolean} [withCountdown=true] - If true, auto-dismisses after 25s. If false, stays until dismissed.
 */
function showShortcutsToast(withCountdown = true) {
  const toast = document.getElementById('shortcuts-toast');
  if (!toast) return;

  const okBtn = document.getElementById('shortcuts-toast-ok');
  const timerBar = toast.querySelector('.shortcuts-toast-timer-bar');
  let timer = null;

  const dismiss = () => {
    if (timer) clearTimeout(timer);
    toast.classList.add('hidden');
  };

  // Remove previous OK listener by replacing the button with a clone
  if (okBtn) {
    const fresh = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(fresh, okBtn);
    fresh.addEventListener('click', dismiss);
  }

  // Reset and show
  toast.classList.remove('hidden');

  if (withCountdown) {
    // Re-trigger the CSS animation by removing and re-adding the bar
    if (timerBar) {
      timerBar.style.display = 'block';
      timerBar.style.animation = 'none';
      timerBar.offsetWidth; // reflow
      timerBar.style.animation = '';
    }
    timer = setTimeout(dismiss, 25000);
  } else {
    // No countdown — hide the timer bar
    if (timerBar) timerBar.style.display = 'none';
  }
}

/**
 * Show a mini-toast notification (for state changes, etc.)
 * @param {string} message - The message to display
 * @param {string} type - Optional type (not used in mini-toast)
 * @param {number} duration - Duration in milliseconds
 * @param {HTMLElement} node - Optional custom node to display
 */
function showMiniToast(message, type = '', duration = 4400, node = null) {
  let container = document.getElementById('mini-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'mini-toast-container';
    document.body.appendChild(container);
  }

  const el = document.createElement('div');
  el.className = 'mini-toast' + (type ? ' ' + type : '');
  if (message) {
    const text = document.createElement('span');
    text.textContent = message;
    el.appendChild(text);
  }
  if (node) el.appendChild(node);
  container.appendChild(el);

  setTimeout(() => {
    // Cancel the CSS entry animation (its 'forwards' fill would block opacity changes)
    el.style.animation = 'none';
    el.style.opacity = '1'; // pin current value before transitioning
    el.offsetHeight; // force reflow
    // Phase 1: fade out
    el.style.transition = 'opacity 0.35s ease-out';
    el.style.opacity = '0';
    el.addEventListener('transitionend', () => {
      // Phase 2: collapse height so remaining toasts slide up smoothly
      const h = el.offsetHeight;
      el.style.height = h + 'px';
      el.style.overflow = 'hidden';
      el.offsetHeight; // force reflow
      el.style.transition = 'height 0.3s ease-in-out, padding 0.3s ease-in-out, margin 0.3s ease-in-out';
      el.style.height = '0';
      el.style.paddingTop = '0';
      el.style.paddingBottom = '0';
      el.style.marginBottom = '-8px';
      el.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'height') el.remove();
      }, { once: true });
    }, { once: true });
  }, duration);
}

// Assign showToast to the ZM object
window.SpaceFlow.showToast = showMiniToast;

/**
 * Toggle the shortcuts toast (no countdown).
 */
function toggleShortcutsToast() {
  const toast = document.getElementById('shortcuts-toast');
  if (!toast) return;
  if (toast.classList.contains('hidden')) {
    showShortcutsToast(false);
  } else {
    toast.classList.add('hidden');
  }
}

/**
 * Initialize the player when DOM is ready
 */
function initPlayer() {
  console.log('🎨 Initializing ZigMap26 Player...');
  
  // Show keyboard shortcuts toast on startup
  showShortcutsToast();

  // Initialize dropzone
  initializeDropzone();
  
  // Check for URL parameter preset
  const urlParams = new URLSearchParams(window.location.search);
  const presetParam = urlParams.get('preset');
  
  if (presetParam) {
    console.log(`📦 Loading preset from URL: ${presetParam}`);
    loadPresetFromURL(presetParam);
  } else {
    console.log('✅ ZigMap26 Player ready');
    console.log('📁 Drop a .json preset file to start');
  }
}

// Wait for DOM to be ready (modules are deferred, but be explicit)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlayer);
} else {
  // DOM already loaded
  initPlayer();
}
