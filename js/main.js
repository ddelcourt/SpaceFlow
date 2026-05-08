/**
 * ZigMap26 — Main Application Entry Point
 * Orchestrates all modules and initializes the application
 */

// Import configurations
import { DEFAULT_PARAMS } from './config/defaults.js';
import { SEGMENTS, STORAGE_KEY } from './config/constants.js';

// Import core classes
import { ZigzagLine } from './core/ZigzagLine.js';
import { Emitter } from './core/Emitter.js';
import { Camera } from './core/Camera.js';
import { getSpawnDistance, buildRibbonSides } from './core/utils.js';

// Import storage
import { loadFromLocalStorage, saveToLocalStorage, clearLocalStorage, downloadJSON, loadJSON } from './storage/localStorage.js';
import { initializeStateManager } from './storage/StateManager.js';

// Import rendering
import { attachToZM } from './rendering/SketchFactory.js';

// Import export
import { exportSVG } from './export/SVGExporter.js';
import { exportPNG } from './export/PNGExporter.js';
import { startVideoRecording, stopVideoRecording, isRecording as getVideoRecordingStatus } from './export/VideoRecorder.js';
import { exportDepthMap } from './export/DepthExporter.js';

// Import UI
import { initializeUI } from './ui/UIController.js';

// Import input
import { setupKeyboardHandlers } from './input/KeyboardHandler.js';
import { setupMouseHandlers } from './input/MouseHandler.js';

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL APPLICATION STATE
// ═══════════════════════════════════════════════════════════════════════════

// Create global ZigMap26 namespace
window.ZigMap26 = {
  // Parameters
  params: { ...DEFAULT_PARAMS },
  
  // Constants
  SEGMENTS,
  STORAGE_KEY,
  
  // State
  noiseOffset: 0,
  W: window.innerWidth,
  H: window.innerHeight,
  camera: null,
  p5Instance: null,
  p5InstanceRight: null,
  emitterInstance: null,
  sketchReady: false,
  regeneratingGeometry: false,
  
  // Utilities
  getSpawnDistance,
  buildRibbonSides,
  
  // Core classes
  ZigzagLine,
  Emitter,
  Camera,
  
  // Storage functions
  saveToLocalStorage: () => saveToLocalStorage(window.ZigMap26.params),
  loadFromLocalStorage: () => {
    const loaded = loadFromLocalStorage(DEFAULT_PARAMS);
    if (loaded) {
      Object.assign(window.ZigMap26.params, loaded);
      return true;
    }
    return false;
  },
  downloadJSON: (format) => downloadJSON(window.ZigMap26, format),
  loadJSON: (file) => loadJSON(file, (loadedData) => {
    // Clear localStorage to avoid loading ancient states
    clearLocalStorage();
    console.log('📂 Loading project file (localStorage cleared)');
    
    // Update params
    Object.assign(window.ZigMap26.params, loadedData.params);
    
    // Reset auto-trigger timer to prevent weird values
    if (window.ZigMap26.autoTriggerTimer) {
      window.ZigMap26.autoTriggerTimer.elapsed = 0;
      window.ZigMap26.autoTriggerTimer.pausedAt = 0;
      window.ZigMap26.autoTriggerTimer.paused = false;
    }

    // Reset state history so previous/next navigation starts fresh
    if (window.ZigMap26.stateHistory) {
      window.ZigMap26.stateHistory.stack = [];
      window.ZigMap26.stateHistory.currentIndex = -1;
    }

    // Cancel any active camera transition
    if (window.ZigMap26.camera && window.ZigMap26.camera.transition) {
      window.ZigMap26.camera.transition.isActive = false;
    }
    
    // Restore states if present (v2 format)
    if (loadedData.states && Array.isArray(loadedData.states)) {
      window.ZigMap26.stateManager.states = loadedData.states;
      window.ZigMap26.stateManager.activeStateId = loadedData.activeStateId;
      window.ZigMap26.stateManager.saveToStorage();
      
      // Clear shuffle pool so it regenerates with new state IDs
      if (window.ZigMap26.shufflePool) {
        window.ZigMap26.shufflePool = [];
      }
      
      // Update state UI
      if (window.ZigMap26.updateStatePanel) {
        window.ZigMap26.updateStatePanel();
      }
      
      // Load the first state INSTANTLY (no transitions) to match exact parameters from JSON
      if (loadedData.states.length > 0) {
        const firstState = loadedData.states[0];
        console.log('🎯 Loading first state instantly:', firstState.name);
        window.ZigMap26.stateManager.load(firstState.id, true); // instant = true
      }
      
      // Sync UI to reflect loaded params (including project-wide settings like ambientSpeedMaster)
      window.ZigMap26.syncUIFromParams();
    } else {
      // No states in project - sync camera from loaded params
      window.ZigMap26.camera.syncFromParams(window.ZigMap26.params);
      
      // Sync main UI
      window.ZigMap26.syncUIFromParams();
    }
  }),
  
  // Export functions
  exportSVG: () => exportSVG(window.ZigMap26),
  exportPNG: () => exportPNG(window.ZigMap26),
  exportDepthMap: () => exportDepthMap(window.ZigMap26),
  startVideoRecording: () => startVideoRecording(window.ZigMap26),
  stopVideoRecording: () => stopVideoRecording(window.ZigMap26),
  isVideoRecording: () => getVideoRecordingStatus(),
  
  // UI sync function (will be set by UIController)
  syncUIFromParams: null,
  
  // Canvas size update (will be set by SketchFactory)  
  updateCanvasSize: null,
  
  // Initialize sketches (will be set by SketchFactory)
  initializeSketches: null
};

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load preset from file
 * @param {string} presetName - Name of preset file (without .json extension)
 */
async function loadPresetFile(ZM, presetName = 'zigmap_init') {
  try {
    const response = await fetch(`config/presets/${presetName}.json`);
    if (!response.ok) {
      console.warn(`Preset "${presetName}" not found, using defaults`);
      return false;
    }
    
    const loadedData = await response.json();
    
    // Restore states if present
    if (loadedData.states && Array.isArray(loadedData.states)) {
      ZM.stateManager.states = loadedData.states;
      ZM.stateManager.activeStateId = loadedData.activeStateId;
      ZM.stateManager.saveToStorage();
      
      // Load top-level params first (contains project-wide settings)
      if (loadedData.params) {
        Object.assign(ZM.params, loadedData.params);
      }
      
      // Then load the first state's params (overrides state-specific settings)
      if (loadedData.states.length > 0) {
        const firstState = loadedData.states[0];
        // Apply first state's params immediately
        Object.assign(ZM.params, firstState.params);
        // Store for later use after UI initialization
        ZM._initialStateId = firstState.id;
      }
      
      // Update state panel UI will be called after UI initialization
    } else {
      // No states - use top-level params
      Object.assign(ZM.params, loadedData.params);
    }
    
    // Sync camera from loaded params
    if (ZM.camera) {
      ZM.camera.syncFromParams(ZM.params);
    }
    
    // Save to localStorage so this only happens once
    ZM.saveToLocalStorage();
    
    console.log(`✓ Loaded preset from config/presets/${presetName}.json`);
    return true;
  } catch (err) {
    console.warn(`Could not load preset "${presetName}":`, err);
    return false;
  }
}

/**
 * Load initial preset for first-time users (alias for backwards compatibility)
 */
async function loadInitialPreset(ZM) {
  return loadPresetFile(ZM, 'zigmap_init');
}

async function init() {
  const ZM = window.ZigMap26;
  
  // Initialize camera
  ZM.camera = new Camera(ZM.params);
  
  // Initialize preset manager FIRST (needed before loading presets)
  initializeStateManager(ZM);
  
  // Check for URL parameter preset
  const urlParams = new URLSearchParams(window.location.search);
  const presetParam = urlParams.get('preset');
  let hadSavedSettings = false;
  
  if (presetParam) {
    // Load preset from URL parameter (overrides localStorage)
    console.log(`Loading preset from URL: ${presetParam}`);
    await loadPresetFile(ZM, presetParam);
  } else {
    // Load saved settings or initial preset
    hadSavedSettings = ZM.loadFromLocalStorage();
    
    // Load initial preset for first-time users
    if (!hadSavedSettings) {
      await loadInitialPreset(ZM);
    } else if (ZM.stateManager.activeStateId) {
      // If we loaded from localStorage and there's an active state,
      // ensure params match the active state (not stale localStorage params)
      console.log('🔄 Syncing params with active state:', ZM.stateManager.activeStateId);
      const activeState = ZM.stateManager.getStateById(ZM.stateManager.activeStateId);
      if (activeState) {
        // Preserve camera params (they're not stored in state.params, but in state.camera)
        const preservedCameraParams = {
          cameraRotationX: ZM.params.cameraRotationX,
          cameraRotationY: ZM.params.cameraRotationY,
          cameraDistance: ZM.params.cameraDistance,
          cameraOffsetX: ZM.params.cameraOffsetX,
          cameraOffsetY: ZM.params.cameraOffsetY
        };
        
        // Restore state params to ensure palettes are in sync
        Object.assign(ZM.params, JSON.parse(JSON.stringify(activeState.params)));
        
        // Restore preserved camera params (use state's camera if available, otherwise localStorage)
        if (activeState.camera) {
          ZM.params.cameraRotationX = activeState.camera.rotationX;
          ZM.params.cameraRotationY = activeState.camera.rotationY;
          ZM.params.cameraDistance = activeState.camera.distance;
          ZM.params.cameraOffsetX = activeState.camera.offsetX || 0;
          ZM.params.cameraOffsetY = activeState.camera.offsetY || 0;
          // Sync camera object to match state
          ZM.camera.syncFromParams(ZM.params);
        } else {
          // Fallback to localStorage camera params if state doesn't have camera data
          Object.assign(ZM.params, preservedCameraParams);
        }
        
        // Save back to localStorage to update stale data
        ZM.saveToLocalStorage();
      }
    }
  }
  
  // Attach rendering functions
  attachToZM(ZM);
  
  // Initialize UI
  initializeUI(ZM);
  // Re-assign after UIController overrides it — mini-toast is the canonical ZM.showToast
  ZM.showToast = showMiniToast;

  // Initialize auto-trigger status display
  if (ZM.stateManager && ZM.stateManager.updateAutoTriggerStatus) {
    ZM.stateManager.updateAutoTriggerStatus();
  }
  
  // Initialize sketches
  ZM.initializeSketches();
  
  // Update overlay positioning after sketches are initialized (important for stereo mode)
  if (ZM.updateOverlay) {
    ZM.updateOverlay();
  }
  
  // Load initial state if we loaded the preset
  if (!hadSavedSettings && ZM._initialStateId && ZM.stateManager.load) {
    // Update state panel UI first
    if (ZM.updateStatePanel) {
      ZM.updateStatePanel();
    }
    // Then load the first state INSTANTLY (no transition on first load)
    ZM.stateManager.load(ZM._initialStateId, true); // instant = true
    delete ZM._initialStateId;
  } else if (!hadSavedSettings && ZM.syncUIFromParams) {
    // Sync UI if we loaded a preset without states
    ZM.syncUIFromParams();
  } else if (hadSavedSettings) {
    // When loading from localStorage, trigger the active state to ensure proper initialization
    if (ZM.stateManager.activeStateId && ZM.stateManager.load) {
      // Update state panel UI first
      if (ZM.updateStatePanel) {
        ZM.updateStatePanel();
      }
      // Load the active state INSTANTLY to trigger all visual updates
      console.log('🎯 Triggering active state on load:', ZM.stateManager.activeStateId);
      ZM.stateManager.load(ZM.stateManager.activeStateId, true); // instant = true
    } else if (ZM.syncUIFromParams) {
      // Fallback: sync UI if there's no active state
      ZM.syncUIFromParams();
    }
  }
  
  // Setup input handlers
  setupKeyboardHandlers(ZM);
  setupMouseHandlers(ZM);
  
  // Setup cursor auto-hide in fullscreen
  let cursorTimeout = null;
  const hideCursor = () => {
    if (document.fullscreenElement) {
      document.body.classList.add('hide-cursor');
    }
  };
  
  const showCursor = () => {
    document.body.classList.remove('hide-cursor');
    if (cursorTimeout) {
      clearTimeout(cursorTimeout);
    }
    if (document.fullscreenElement) {
      cursorTimeout = setTimeout(hideCursor, 1000);
    }
  };
  
  document.addEventListener('mousemove', showCursor);
  document.addEventListener('mousedown', showCursor);
  
  // Handle fullscreen change events
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      // Entered fullscreen - ensure cursor is visible first, then start hide timer
      document.body.classList.remove('hide-cursor');
      if (cursorTimeout) {
        clearTimeout(cursorTimeout);
      }
      cursorTimeout = setTimeout(hideCursor, 1000);
    } else {
      // Exited fullscreen - clear timer and show cursor
      if (cursorTimeout) {
        clearTimeout(cursorTimeout);
        cursorTimeout = null;
      }
      document.body.classList.remove('hide-cursor');
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    // Always update canvas size - updateCanvasSize() handles both framebuffer and non-framebuffer modes
    if (ZM.updateCanvasSize) ZM.updateCanvasSize();
  });
  
  console.log('ZigMap26 initialized ✓');

  // Show keyboard shortcuts toast on startup
  showShortcutsToast(true);

  // Shortcut Keys button in Documentation panel
  const shortcutsBtn = document.getElementById('doc-shortcuts-btn');
  if (shortcutsBtn) shortcutsBtn.addEventListener('click', toggleShortcutsToast);
}

/**
 * Show the startup keyboard shortcuts toast.
 * @param {boolean} [withCountdown=true] - If true, auto-dismisses after 25s.
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

  // Replace OK button to clear any previous listener
  if (okBtn) {
    const fresh = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(fresh, okBtn);
    fresh.addEventListener('click', dismiss);
  }

  toast.classList.remove('hidden');

  if (withCountdown) {
    if (timerBar) {
      timerBar.style.display = 'block';
      timerBar.style.animation = 'none';
      timerBar.offsetWidth; // reflow
      timerBar.style.animation = '';
    }
    timer = setTimeout(dismiss, 25000);
  } else {
    if (timerBar) timerBar.style.display = 'none';
  }
}

function toggleShortcutsToast() {
  const toast = document.getElementById('shortcuts-toast');
  if (!toast) return;
  if (toast.classList.contains('hidden')) {
    showShortcutsToast(false);
  } else {
    toast.classList.add('hidden');
  }
}

// Expose on ZM so KeyboardHandler can call it
window.ZigMap26.toggleShortcutsToast = toggleShortcutsToast;

/**
 * Show a mini notification toast at the bottom of the screen.
 * @param {string} message
 * @param {'success'|'error'|'info'|''} [type='']
 * @param {number} [duration=4400]
 * @param {Node|null} [node=null] Optional DOM node appended after the message text
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

// Expose showToast on ZM
window.ZigMap26.showToast = showMiniToast;

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
