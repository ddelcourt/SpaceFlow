/**
 * ZigMap26 — Display Window (Renderer Only)
 * Minimal version with no controls, syncs with primary window via BroadcastChannel
 */

// Import configurations
import { DEFAULT_PARAMS } from './config/defaults.js';
import { SEGMENTS, STORAGE_KEY } from './config/constants.js';

// Import core classes
import { ZigzagLine } from './core/ZigzagLine.js';
import { Emitter } from './core/Emitter.js';
import { Camera } from './core/Camera.js';
import { getSpawnDistance, buildRibbonSides } from './core/utils.js';
import { triggerPaletteChange } from './core/colorUtils.js';

// Import rendering
import { attachToZM } from './rendering/SketchFactory.js';

// Import state manager
import { initializeStateManager } from './storage/StateManager.js';

// Import window sync
import { initializeDisplaySync } from './sync/WindowSync.js';

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL APPLICATION STATE (Display Window)
// ═══════════════════════════════════════════════════════════════════════════

// Create global ZigMap26 namespace
window.ZigMap26 = {
  // Parameters (will be synced from primary window)
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
  
  // Display mode flag
  isDisplayMode: true,
  
  // Placeholder functions for display mode
  saveToLocalStorage: () => {}, // No saving in display mode
  syncUIFromParams: () => {}, // No UI controls in display mode
  updatePaletteUI: () => {},
  updateStatePanel: () => {},
  showToast: () => {} // No toast in display mode
};

// Add wrapper method to properly bind ZM context
window.ZigMap26.triggerPaletteChange = function() {
  triggerPaletteChange(window.ZigMap26);
};

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update connection status UI
 */
function updateConnectionStatus(connected) {
  const statusEl = document.getElementById('connection-status');
  const textEl = document.getElementById('status-text');
  
  if (connected) {
    statusEl.classList.add('connected');
    textEl.textContent = 'Connected';
    
    // Hide status after 2 seconds
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 2000);
  } else {
    statusEl.classList.remove('connected');
    textEl.textContent = 'Waiting for primary window...';
  }
}

/**
 * Initialize overlay handling
 */
function initializeOverlay(ZM) {
  const overlayImg = document.getElementById('overlay-image');
  
  // Update overlay function
  ZM.updateOverlay = () => {
    if (ZM.params.overlayVisible && ZM.params.overlayImageSrc) {
      overlayImg.src = ZM.params.overlayImageSrc;
      overlayImg.classList.add('visible');
      
      // Apply positioning and styling
      overlayImg.style.left = `${ZM.params.overlayX}%`;
      overlayImg.style.top = `${ZM.params.overlayY}%`;
      overlayImg.style.width = `${ZM.params.overlayScale}%`;
      overlayImg.style.opacity = ZM.params.overlayOpacity / 100;
      overlayImg.style.transform = `translate(-50%, -50%) rotate(${ZM.params.overlayRotation}deg)`;
      overlayImg.style.transformOrigin = 'center';
    } else {
      overlayImg.classList.remove('visible');
    }
  };
  
  // Watch for overlay param changes
  const originalAssign = Object.assign;
  Object.assign = function(target, ...sources) {
    const result = originalAssign.call(this, target, ...sources);
    
    if (target === ZM.params && sources.some(s => 
      s && ('overlayVisible' in s || 'overlayImageSrc' in s || 
            'overlayX' in s || 'overlayY' in s || 'overlayScale' in s || 
            'overlayOpacity' in s || 'overlayRotation' in s)
    )) {
      if (ZM.updateOverlay) {
        ZM.updateOverlay();
      }
    }
    
    return result;
  };
}

/**
 * Initialize display window
 */
async function init() {
  const ZM = window.ZigMap26;
  
  console.log('🖥️ Initializing display window...');
  
  // Initialize camera with params (not ZM object)
  ZM.camera = new Camera(ZM.params);
  
  // Initialize state manager (needed for proper parameter interpretation)
  initializeStateManager(ZM);
  
  // Initialize overlay handling
  initializeOverlay(ZM);
  
  // Initialize window sync (wait for initial state from primary)
  // Note: Don't await yet, we'll handle it after sketches are ready
  const syncPromise = initializeDisplaySync(ZM).catch(err => {
    console.error('❌ Failed to sync with primary window:', err);
    updateConnectionStatus(false);
    throw err;
  });
  
  // Attach rendering functions (creates ZM.initializeSketches method)
  attachToZM(ZM);
  
  // Setup window resize handler
  setupResizeHandler(ZM);
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Initialize sketches
  console.log('🎨 Initializing sketches...');
  ZM.initializeSketches();
  
  // Update overlay after sketches are initialized
  if (ZM.updateOverlay) {
    ZM.updateOverlay();
  }
  
  // Now wait for sync to complete and trigger palette change
  try {
    await syncPromise;
    console.log('✓ Display window synced with primary');
    updateConnectionStatus(true);
    
    // Wait for sketches to be fully ready before triggering palette change
    const waitForReady = () => new Promise(resolve => {
      if (ZM.sketchReady) {
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (ZM.sketchReady) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);
      }
    });
    
    await waitForReady();
    
    // Now that sketches are ready, trigger palette change to apply initial colors
    if (ZM.triggerPaletteChange) {
      ZM.triggerPaletteChange();
    }
  } catch (err) {
    console.error('❌ Sync error:', err);
    // Continue anyway - display window can still work, just might not be in sync
  }
  
  console.log('✓ Display window ready');
}

/**
 * Setup window resize handler
 */
function setupResizeHandler(ZM) {
  window.addEventListener('resize', () => {
    ZM.W = window.innerWidth;
    ZM.H = window.innerHeight;
    
    if (ZM.p5Instance) {
      ZM.p5Instance.resizeCanvas(ZM.W, ZM.H);
    }
    
    if (ZM.p5InstanceRight) {
      ZM.p5InstanceRight.resizeCanvas(ZM.W, ZM.H);
    }
    
    if (ZM.updateOverlay) {
      ZM.updateOverlay();
    }
  });
}

/**
 * Setup keyboard shortcuts for display window
 */
function setupKeyboardShortcuts() {
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

  // Toggle fullscreen function
  const toggleFullscreen = () => {
    if (!getFullscreenElement()) {
      enterFullscreen().then(() => {
        console.log('🖥️ Entered fullscreen mode');
      }).catch(err => {
        console.error('Failed to enter fullscreen:', err);
      });
    } else {
      exitFullscreen();
      console.log('🪟 Exited fullscreen mode');
    }
  };

  // Hide fullscreen button if not supported
  if (!canFullscreen && fullscreenBtn) {
    fullscreenBtn.style.display = 'none';
  }

  // Hide if already running as PWA standalone
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    if (fullscreenBtn) fullscreenBtn.style.display = 'none';
  }

  // Fullscreen button click handler
  if (fullscreenBtn && canFullscreen) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    // F11 or 'f' or 'F' or Enter key: Toggle fullscreen
    if (e.key === 'F11' || e.key === 'f' || e.key === 'F' || e.key === 'Enter') {
      e.preventDefault();
      toggleFullscreen();
    }
    
    // ESC key: Exit fullscreen (browser default, but let's log it)
    if (e.key === 'Escape' && getFullscreenElement()) {
      console.log('🪟 Exiting fullscreen mode (ESC pressed)');
    }
  });

  // Setup cursor auto-hide in fullscreen
  let cursorTimeout = null;
  const hideCursor = () => {
    if (getFullscreenElement()) {
      document.body.classList.add('hide-cursor');
    }
  };
  
  const showCursor = () => {
    document.body.classList.remove('hide-cursor');
    clearTimeout(cursorTimeout);
    if (getFullscreenElement()) {
      cursorTimeout = setTimeout(hideCursor, 2000); // Hide after 2 seconds of inactivity
    }
  };

  // Track mouse movement in fullscreen
  document.addEventListener('mousemove', showCursor);
  document.addEventListener('mousedown', showCursor);

  // Handle fullscreen change events
  const onFullscreenChange = () => {
    if (getFullscreenElement()) {
      console.log('🖥️ Fullscreen mode active');
      cursorTimeout = setTimeout(hideCursor, 2000);
    } else {
      console.log('🪟 Fullscreen mode exited');
      document.body.classList.remove('hide-cursor');
      clearTimeout(cursorTimeout);
    }
  };

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
}

// ═══════════════════════════════════════════════════════════════════════════
// START APPLICATION
// ═══════════════════════════════════════════════════════════════════════════

// Wait for p5.js to load
if (typeof p5 !== 'undefined') {
  init();
} else {
  window.addEventListener('load', init);
}

// Cleanup on window close
window.addEventListener('beforeunload', () => {
  if (window.ZigMap26.windowSync) {
    window.ZigMap26.windowSync.close();
  }
});
