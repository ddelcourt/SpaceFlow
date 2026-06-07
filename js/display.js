/**
 * SpaceFlow — Display Window (Renderer Only)
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
import { triggerPaletteChange, initColorRNG } from './core/colorUtils.js';

// Import rendering
import { attachToZM } from './rendering/SketchFactory.js';

// Import state manager
import { initializeStateManager } from './storage/StateManager.js';

// Import window sync
import { initializeDisplaySync } from './sync/WindowSync.js';

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL APPLICATION STATE (Display Window)
// ═══════════════════════════════════════════════════════════════════════════

// Get display ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const displayId = urlParams.get('id') || 'display-unknown';

// Update document title with display ID
document.title = `SpaceFlow — ${displayId}`;

console.log(`🖥️ Display window ID: ${displayId}`);

// Create global SpaceFlow namespace
window.SpaceFlow = {
  // Display identification
  displayId: displayId,
  
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
  updateStatePanel: () => {}
  // showToast will be assigned after function definition
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
 * Update connection status UI
 */
function updateConnectionStatus(connected) {
  const statusEl = document.getElementById('connection-status');
  const textEl = document.getElementById('status-text');
  
  if (connected) {
    statusEl.classList.add('connected');
    textEl.textContent = `${window.SpaceFlow.displayId} — Connected`;
    
    // Hide status after 2 seconds
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 2000);
  } else {
    statusEl.classList.remove('connected');
    textEl.textContent = `${window.SpaceFlow.displayId} — Waiting...`;
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
 * Initialize text message overlay handling
 */
function initializeTextOverlay(ZM) {
  const displayElement = document.getElementById('text-overlay-display');
  
  // Update text overlay function
  ZM.updateTextOverlay = () => {
    if (!displayElement) return;
    
    if (ZM.params.textOverlayVisible && ZM.params.textOverlayMessage) {
      displayElement.textContent = ZM.params.textOverlayMessage;
      displayElement.style.fontSize = ZM.params.textOverlaySize + 'px';
      displayElement.style.color = ZM.params.textOverlayColor;
      displayElement.style.textAlign = ZM.params.textOverlayAlign;
      displayElement.style.fontWeight = ZM.params.textOverlayWeight;
      displayElement.style.lineHeight = '1';
      
      // Apply position
      displayElement.style.top = '';
      displayElement.style.bottom = '';
      if (ZM.params.textOverlayPosition === 'top') {
        displayElement.style.top = '10%';
        displayElement.style.transform = 'translate(-50%, 0)';
      } else if (ZM.params.textOverlayPosition === 'bottom') {
        displayElement.style.bottom = '10%';
        displayElement.style.top = 'auto';
        displayElement.style.transform = 'translate(-50%, 0)';
      } else {
        displayElement.style.top = '50%';
        displayElement.style.transform = 'translate(-50%, -50%)';
      }
      
      // Show with fade-in: first make visible at opacity 0, then transition to target
      displayElement.style.display = 'block';
      // Force reflow to ensure display:block is applied before opacity change
      displayElement.offsetHeight;
      // Now transition to target opacity
      displayElement.style.opacity = ZM.params.textOverlayFade / 100;
    } else {
      // Fade out: transition opacity to 0, then hide after transition completes
      displayElement.style.opacity = '0';
      
      // Wait for transition to complete before setting display:none
      const fadeDuration = ZM.params.textOverlayFadeDuration || 0.5;
      setTimeout(() => {
        // Double-check visibility hasn't changed during transition
        if (!ZM.params.textOverlayVisible) {
          displayElement.style.display = 'none';
        }
      }, fadeDuration * 1000 + 50); // Add 50ms buffer
    }
  };
  
  // Set initial transition duration
  if (displayElement) {
    const initialDuration = ZM.params.textOverlayFadeDuration || 0.5;
    displayElement.style.transition = `all ${initialDuration}s ease`;
  }
  
  // Initial render
  if (ZM.updateTextOverlay) {
    ZM.updateTextOverlay();
  }
  
  // Watch for text overlay param changes
  const originalAssign = Object.assign;
  Object.assign = function(target, ...sources) {
    const result = originalAssign.call(this, target, ...sources);
    
    if (target === ZM.params && sources.some(s => 
      s && ('textOverlayVisible' in s || 'textOverlayMessage' in s || 
            'textOverlayFade' in s || 'textOverlaySize' in s || 
            'textOverlayPosition' in s || 'textOverlayColor' in s || 
            'textOverlayAlign' in s || 'textOverlayWeight' in s ||
            'textOverlayFadeDuration' in s)
    )) {
      // Handle visibility changes with fade duration
      const visibilitySource = sources.find(s => s && 'textOverlayVisible' in s);
      if (visibilitySource && displayElement) {
        const duration = ZM.params.textOverlayFadeDuration || 0.5;
        displayElement.style.transition = `all ${duration}s ease`;
      }
      
      if (ZM.updateTextOverlay) {
        ZM.updateTextOverlay();
      }
    }
    
    return result;
  };
}

/**
 * Initialize display window
 */
async function init() {
  const ZM = window.SpaceFlow;
  
  console.log('🖥️ Initializing display window...');
  
  // Initialize camera with params (not ZM object)
  ZM.camera = new Camera(ZM.params);
  
  // Initialize state manager (needed for proper parameter interpretation)
  initializeStateManager(ZM);
  
  // Initialize overlay handling
  initializeOverlay(ZM);
  
  // Initialize text overlay handling
  initializeTextOverlay(ZM);
  
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
  
  // Setup mouse handlers for bidirectional control
  setupMouseHandlers();
  
  // Initialize sketches
  console.log('🎨 Initializing sketches...');
  ZM.initializeSketches();
  
  // Update overlay after sketches are initialized
  if (ZM.updateOverlay) {
    ZM.updateOverlay();
  }
  
  // Update text overlay after sketches are initialized
  if (ZM.updateTextOverlay) {
    ZM.updateTextOverlay();
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
    // Keys allowed to be forwarded to main window
    const forwardKeys = [
      'p', 'P',           // Export PNG
      's', 'S',           // Export SVG (or Ctrl+S/Cmd+S for save)
      'd', 'D',           // Export Depth
      'v', 'V',           // Video recording
      'r', 'R',           // Reset camera
      '0',                // Reset zoom
      'ArrowLeft',        // Previous state
      'ArrowRight',       // Next state
      ' ',                // Space bar (media control)
      '1', '2', '3', '4'  // Palette selection
    ];
    
    const shouldForward = forwardKeys.includes(e.key) || 
                         ((e.key === 's' || e.key === 'S') && (e.ctrlKey || e.metaKey));
    
    // Forward keyboard command to main window
    // Main window will process the command and broadcast the result to all displays
    if (shouldForward && window.SpaceFlow.windowSync && window.SpaceFlow.windowSync.channel) {
      window.SpaceFlow.windowSync.channel.postMessage({
        type: 'keyboard-command',
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        timestamp: Date.now()
      });
      e.preventDefault();
      return;
    }
    
    // F11 or 'f' or 'F' or Enter key: Toggle fullscreen (local only, not forwarded)
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

/**
 * Setup mouse handlers for bidirectional control
 * Display windows can control camera just like main window
 */
function setupMouseHandlers() {
  const container = document.getElementById('canvas-container');
  
  // Mouse state
  let isDragging = false;
  let isPanning = false;
  let isRotating = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  
  // Helper to forward mouse commands to main window
  function forwardMouseCommand(command) {
    if (window.SpaceFlow.windowSync && window.SpaceFlow.windowSync.channel) {
      window.SpaceFlow.windowSync.channel.postMessage({
        type: 'mouse-command',
        command: command,
        timestamp: Date.now()
      });
    }
  }
  
  // Mouse down
  container.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      // Left click: orbit
      isDragging = true;
      isPanning = false;
      isRotating = false;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      
      // Cancel transitions when starting manual control
      forwardMouseCommand({ action: 'cancel-transitions' });
    } else if (e.button === 1) {
      // Middle click: Z-rotation
      isRotating = true;
      isDragging = false;
      isPanning = false;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      
      forwardMouseCommand({ action: 'cancel-transitions' });
      e.preventDefault();
    } else if (e.button === 2) {
      // Right click: pan
      isPanning = true;
      isDragging = false;
      isRotating = false;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      
      forwardMouseCommand({ action: 'cancel-transitions' });
      e.preventDefault();
    }
  });
  
  // Mouse move
  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      
      forwardMouseCommand({
        action: 'orbit',
        dx: dx,
        dy: dy
      });
      
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    } else if (isPanning) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      
      forwardMouseCommand({
        action: 'pan',
        dx: dx,
        dy: dy
      });
      
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    } else if (isRotating) {
      const dx = e.clientX - lastMouseX;
      
      forwardMouseCommand({
        action: 'rotate',
        dx: dx
      });
      
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  });
  
  // Mouse up
  window.addEventListener('mouseup', () => {
    isDragging = false;
    isPanning = false;
    isRotating = false;
  });
  
  // Prevent context menu on right-click
  container.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  // Mouse wheel for zoom
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    forwardMouseCommand({
      action: 'zoom',
      delta: e.deltaY
    });
  }, { passive: false });
}

// ═══════════════════════════════════════════════════════════════════════════
// MINI-TOAST NOTIFICATION
// ═══════════════════════════════════════════════════════════════════════════

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
  if (window.SpaceFlow.windowSync) {
    window.SpaceFlow.windowSync.close();
  }
});
