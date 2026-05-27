/**
 * SpaceFlow — Main Application Entry Point
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
import { initColorRNG, triggerPaletteChange } from './core/colorUtils.js';

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

// Import window sync
import { initializePrimarySync } from './sync/WindowSync.js';

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL APPLICATION STATE
// ═══════════════════════════════════════════════════════════════════════════

// Create global SpaceFlow namespace
window.SpaceFlow = {
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
  saveToLocalStorage: () => saveToLocalStorage(window.SpaceFlow.params, window.SpaceFlow._projectName),
  loadFromLocalStorage: () => {
    const data = loadFromLocalStorage(DEFAULT_PARAMS);
    if (data) {
      Object.assign(window.SpaceFlow.params, data.params);
      if (data.projectName) {
        window.SpaceFlow._projectName = data.projectName;
      }
      return true;
    }
    return false;
  },
  downloadJSON: (format, filename) => downloadJSON(window.SpaceFlow, format, filename),
  loadJSON: (file) => loadJSON(file, (loadedData) => {
    // Clear localStorage to avoid loading ancient states
    clearLocalStorage();
    console.log('📂 Loading project file (localStorage cleared)');
    console.log(`✓ Project loaded: ${loadedData.projectName || file.name}`);
    console.log('   File activePaletteIndex:', loadedData.params.activePaletteIndex);
    console.log('   Current ZM.params.activePaletteIndex:', window.SpaceFlow.params.activePaletteIndex);
    
    // Update params
    Object.assign(window.SpaceFlow.params, loadedData.params);
    console.log('   After Object.assign, activePaletteIndex:', window.SpaceFlow.params.activePaletteIndex);
    
    // Reset auto-trigger timer to prevent weird values
    if (window.SpaceFlow.autoTriggerTimer) {
      window.SpaceFlow.autoTriggerTimer.elapsed = 0;
      window.SpaceFlow.autoTriggerTimer.pausedAt = 0;
      window.SpaceFlow.autoTriggerTimer.paused = false;
    }

    // Reset state history so previous/next navigation starts fresh
    if (window.SpaceFlow.stateHistory) {
      window.SpaceFlow.stateHistory.stack = [];
      window.SpaceFlow.stateHistory.currentIndex = -1;
    }

    // Cancel any active camera transition
    if (window.SpaceFlow.camera && window.SpaceFlow.camera.transition) {
      window.SpaceFlow.camera.transition.isActive = false;
    }
    
    // Restore states if present (v2 format)
    if (loadedData.states && Array.isArray(loadedData.states)) {
      window.SpaceFlow.stateManager.states = loadedData.states;
      window.SpaceFlow.stateManager.activeStateId = loadedData.activeStateId;
      window.SpaceFlow.stateManager.saveToStorage();
      
      // Clear shuffle pool so it regenerates with new state IDs
      if (window.SpaceFlow.shufflePool) {
        window.SpaceFlow.shufflePool = [];
      }
      
      // Update state UI
      if (window.SpaceFlow.updateStatePanel) {
        window.SpaceFlow.updateStatePanel();
      }
      
      // Load the first state INSTANTLY (no transitions) to match exact parameters from JSON
      if (loadedData.states.length > 0) {
        const firstState = loadedData.states[0];
        console.log('🎯 Loading first state instantly:', firstState.name);
        window.SpaceFlow.stateManager.load(firstState.id, true); // instant = true
      }
      
      // Sync UI to reflect loaded params (including project-wide settings like ambientSpeedMaster)
      window.SpaceFlow.syncUIFromParams();
    } else {
      // No states in project - sync camera from loaded params
      window.SpaceFlow.camera.syncFromParams(window.SpaceFlow.params);
      
      // Sync main UI
      window.SpaceFlow.syncUIFromParams();
    }
    
    // Broadcast full state to display window after project load
    if (window.SpaceFlow.windowSync && window.SpaceFlow.windowSync.broadcastFullState) {
      window.SpaceFlow.windowSync.broadcastFullState();
    }
  }),
  
  // Export functions
  exportSVG: () => exportSVG(window.SpaceFlow),
  exportPNG: () => exportPNG(window.SpaceFlow),
  exportDepthMap: () => exportDepthMap(window.SpaceFlow),
  startVideoRecording: () => startVideoRecording(window.SpaceFlow),
  stopVideoRecording: () => stopVideoRecording(window.SpaceFlow),
  isVideoRecording: () => getVideoRecordingStatus(),
  
  // UI sync function (will be set by UIController)
  syncUIFromParams: null,
  
  // Canvas size update (will be set by SketchFactory)  
  updateCanvasSize: null,
  
  // Initialize sketches (will be set by SketchFactory)
  initializeSketches: null
};

// Add wrapper method to properly bind ZM context
// This ensures ONE function controls palette transitions across ALL windows (main + display)
window.SpaceFlow.triggerPaletteChange = function() {
  triggerPaletteChange(window.SpaceFlow);
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
    
    // Clean up project-wide settings from states (same as we do in StateManager)
    if (loadedData.states && Array.isArray(loadedData.states)) {
      loadedData.states.forEach(state => {
        if (state.params) {
          delete state.params.stateTransitionDuration;
          delete state.params.colorTransitionDuration;
          delete state.params.autoTriggerStates;
          delete state.params.autoTriggerFrequency;
          delete state.params.near;
          delete state.params.far;
          delete state.params.framebufferMode;
          delete state.params.framebufferPreset;
          delete state.params.framebufferWidth;
          delete state.params.framebufferHeight;
          delete state.params.stereoscopicMode;
          delete state.params.eyeSeparation;
          delete state.params.canvasBorderVisible;
          delete state.params.canvasBorderColor;
          delete state.params.videoDuration;
          delete state.params.videoFPS;
          delete state.params.videoFormat;
          delete state.params.depthInvert;
        }
      });
    }
    
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
    
    console.log(`✓ Preset loaded: ${presetName}`);
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
  const ZM = window.SpaceFlow;
  
  // Initialize camera
  ZM.camera = new Camera(ZM.params);
  
  // Initialize window sync for primary window
  initializePrimarySync(ZM);
  
  // Initialize preset manager FIRST (needed before loading presets)
  initializeStateManager(ZM);
  
  // Check for URL parameter preset
  const urlParams = new URLSearchParams(window.location.search);
  const presetParam = urlParams.get('preset');
  let hadSavedSettings = false;
  
  if (presetParam) {
    // Load preset from URL parameter (overrides localStorage)
    console.log(`Loading preset from URL: ${presetParam}`);
    ZM._projectName = `${presetParam}.json`;
    await loadPresetFile(ZM, presetParam);
    
    // Broadcast full state to display window after preset load
    if (ZM.windowSync && ZM.windowSync.broadcastFullState) {
      ZM.windowSync.broadcastFullState();
    }
    
    // Update project name display after UI is ready (poll for function availability)
    const updateProjectName = () => {
      if (ZM.updateProjectNameDisplay) {
        ZM.updateProjectNameDisplay(ZM._projectName);
      } else {
        setTimeout(updateProjectName, 50);
      }
    };
    updateProjectName();
  } else {
    // Load saved settings or initial preset
    hadSavedSettings = ZM.loadFromLocalStorage();
    
    // Initialize color RNG with seed from params
    initColorRNG(ZM.params.colorRandomSeed || 1);
    
    // Load initial preset for first-time users
    if (!hadSavedSettings) {
      ZM._projectName = 'Init.json';
      await loadInitialPreset(ZM);
      
      // Update project name display after UI is ready (poll for function availability)
      const updateProjectName = () => {
        if (ZM.updateProjectNameDisplay) {
          ZM.updateProjectNameDisplay(ZM._projectName);
        } else {
          setTimeout(updateProjectName, 50);
        }
      };
      updateProjectName();
    } else {
      // Had saved settings - display project name if available
      if (ZM._projectName) {
        const updateProjectName = () => {
          if (ZM.updateProjectNameDisplay) {
            ZM.updateProjectNameDisplay(ZM._projectName);
          } else {
            setTimeout(updateProjectName, 50);
          }
        };
        updateProjectName();
      }
      
      if (ZM.stateManager.activeStateId) {
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
  
  // Setup mini-toast offset when hovering right control panel
  const controlsRight = document.querySelector('.controls-right');
  if (controlsRight) {
    controlsRight.addEventListener('mouseenter', () => {
      document.body.classList.add('right-controls-hovered');
    });
    controlsRight.addEventListener('mouseleave', () => {
      document.body.classList.remove('right-controls-hovered');
    });
  }
  
  // Setup control panel visibility and top bar toggles
  const controlsLeft = document.querySelector('.controls');
  const controlsMiddle = document.querySelector('.controls-middle');
  const controlsStateParams = document.querySelector('.controls-state-params');
  const controlPanels = [controlsLeft, controlsMiddle, controlsStateParams, controlsRight];
  
  // Keep control panels fully visible and expanded for 10 seconds at startup
  controlPanels.forEach(panel => {
    if (panel) panel.classList.add('startup-visible');
  });
  
  setTimeout(() => {
    // After 10 seconds, remove startup-visible and collapse all panels
    controlPanels.forEach(panel => {
      if (panel) {
        panel.classList.remove('startup-visible');
        panel.classList.add('hidden');
      }
    });
    // Update top bar active states
    document.querySelectorAll('.controls-topbar-item').forEach(item => {
      item.classList.remove('active');
    });
  }, 10000);
  
  // Setup top bar toggle functionality
  document.querySelectorAll('.controls-topbar-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetClass = item.dataset.target;
      const targetPanel = document.querySelector(`.${targetClass}`);
      
      if (targetPanel) {
        const isHidden = targetPanel.classList.contains('hidden');
        targetPanel.classList.toggle('hidden');
        item.classList.toggle('active', isHidden); // active when visible
        
        // When showing a panel, briefly set it to full opacity
        if (isHidden) {
          targetPanel.classList.add('topbar-hovered');
          setTimeout(() => {
            targetPanel.classList.remove('topbar-hovered');
          }, 1500); // Keep full opacity for 1.5 seconds after opening
        }
      }
    });
  });
  
  // Initialize top bar active states (all visible at start)
  document.querySelectorAll('.controls-topbar-item').forEach(item => {
    item.classList.add('active');
  });
  
  // Setup top bar hover to show corresponding panel at full opacity
  document.querySelectorAll('.controls-topbar-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      const targetClass = item.dataset.target;
      const targetPanel = document.querySelector(`.${targetClass}`);
      if (targetPanel && !targetPanel.classList.contains('hidden')) {
        targetPanel.classList.add('topbar-hovered');
      }
    });
    
    item.addEventListener('mouseleave', () => {
      const targetClass = item.dataset.target;
      const targetPanel = document.querySelector(`.${targetClass}`);
      if (targetPanel) {
        targetPanel.classList.remove('topbar-hovered');
      }
    });
  });
  
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
  
  console.log('SpaceFlow initialized ✓');

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
window.SpaceFlow.toggleShortcutsToast = toggleShortcutsToast;

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
window.SpaceFlow.showToast = showMiniToast;

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
