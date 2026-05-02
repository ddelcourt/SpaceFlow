// ═══════════════════════════════════════════════════════════════════════════
// ZIGMAP26 - State Manager Module
// Manage multiple states/states of the application
// ═══════════════════════════════════════════════════════════════════════════

import { triggerPaletteChange, getBackgroundColor } from '../core/colorUtils.js';

const STATES_STORAGE_KEY = 'ZigMap26_states';
const ACTIVE_STATE_KEY = 'ZigMap26_activeState';

/**
 * Initialize state manager
 * @param {Object} ZM - Main application object
 */
export function initializeStateManager(ZM) {
  ZM.stateManager = {
    states: loadStates(),
    activeStateId: loadActiveStateId(),
    
    // Core operations
    save: (name) => saveState(ZM, name),
    load: (id, instant) => loadState(ZM, id, instant),
    update: (id) => updateState(ZM, id),
    delete: (id) => deleteState(ZM, id),
    rename: (id, newName) => renameState(ZM, id, newName),
    duplicate: (id) => duplicateState(ZM, id),
    
    // Import/Export
    exportState: (id) => exportStateToFile(ZM, id),
    exportAll: () => exportAllStates(ZM),
    importState: (jsonData) => importStateFromData(ZM, jsonData),
    
    // Utilities
    getStateById: (id) => getStateById(ZM, id),
    getAllStates: () => ZM.stateManager.states,
    setActive: (id) => setActiveState(ZM, id),
    saveToStorage: () => saveStatesToStorage(ZM),
    
    // Auto-trigger
    loadRandomState: () => loadRandomState(ZM),
    updateAutoTriggerStatus: () => updateAutoTriggerStatus(ZM),
    navigateHistory: (direction) => navigateHistory(ZM, direction),
    navigateStates: (direction) => navigateStates(ZM, direction)
  };
  
  // Initialize auto-trigger timer
  ZM.autoTriggerTimer = {
    elapsed: 0,
    lastTriggerTime: 0,
    paused: false,
    pausedAt: 0
  };
  
  // Initialize shuffle pool for auto-trigger (ensures no repetition within cycle)
  ZM.shufflePool = [];
  
  // Initialize state history for previous/next navigation
  ZM.stateHistory = {
    stack: [],
    currentIndex: -1
  };
  
  // Initialize auto-trigger controls
  initializeAutoTriggerControls(ZM);
  
  // Create initial state if none exist
  if (ZM.stateManager.states.length === 0) {
    const initialState = captureCurrentState(ZM, 'Initial State');
    ZM.stateManager.states.push(initialState);
    ZM.stateManager.activeStateId = initialState.id;
    saveStatesToStorage(ZM);
  }
}

/**
 * Capture current application state
 * @param {Object} ZM - Main application object
 * @param {String} name - State name
 * @returns {Object} State object
 */
function captureCurrentState(ZM, name) {
  // Deep clone all parameters
  const params = JSON.parse(JSON.stringify(ZM.params));
  
  // Exclude project-wide settings from state capture
  delete params.stateTransitionDuration;
  delete params.colorTransitionDuration;
  delete params.autoTriggerStates;
  delete params.autoTriggerFrequency;
  delete params.ambientSpeedMaster;
  
  // Exclude overlay settings (these are project-wide, not state-specific)
  delete params.overlayImageSrc;
  delete params.overlayVisible;
  delete params.overlayScale;
  delete params.overlayOpacity;
  delete params.overlayX;
  delete params.overlayY;
  
  // Exclude rendering/camera settings (only FOV is state-specific)
  delete params.near;
  delete params.far;
  delete params.framebufferMode;
  delete params.framebufferPreset;
  delete params.framebufferWidth;
  delete params.framebufferHeight;
  delete params.stereoscopicMode;
  delete params.eyeSeparation;
  
  // Exclude export settings (project-wide)
  delete params.videoDuration;
  delete params.videoFPS;
  delete params.videoFormat;
  delete params.depthInvert;
  
  // Exclude camera parameters (stored separately in camera object)
  delete params.cameraRotationX;
  delete params.cameraRotationY;
  delete params.cameraDistance;
  delete params.cameraOffsetX;
  delete params.cameraOffsetY;
  
  // Verify palettes are captured correctly
  if (!params.palettes || params.palettes.length !== 4) {
    console.error('Warning: Palettes not properly captured', params.palettes);
  }
  
  // Verify activePaletteIndex is captured
  if (params.activePaletteIndex === undefined) {
    console.error('Warning: activePaletteIndex not captured, using default 0');
    params.activePaletteIndex = 0;
  }
  
  // Capture camera state
  const camera = {
    rotationX: ZM.camera.rotationX,
    rotationY: ZM.camera.rotationY,
    distance: ZM.camera.distance,
    offsetX: ZM.camera.offsetX,
    offsetY: ZM.camera.offsetY
  };
  
  // Create state object
  const state = {
    id: `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name || `State ${Date.now()}`,
    timestamp: Date.now(),
    params: params,
    camera: camera,
    metadata: {
      version: '1.0'
    }
  };
  
  console.log('State captured:', state.name, 'Active palette:', params.activePaletteIndex);
  
  return state;
}

/**
 * Restore state state with smooth transitions
 * @param {Object} ZM - Main application object
 * @param {Object} state - State to restore
 */
function restoreState(ZM, state, instant = false) {
  console.log('Restoring state:', state.name, 'Palettes:', state.params.palettes, instant ? '(instant)' : '(with transitions)');
  
  // Cancel any pending auto-update to prevent overwriting the loaded state
  if (ZM.cancelStateAutoUpdate) {
    ZM.cancelStateAutoUpdate();
  }
  
  // Store old values for transition
  const oldParams = JSON.parse(JSON.stringify(ZM.params));
  const oldCamera = {
    rotationX: ZM.camera.rotationX,
    rotationY: ZM.camera.rotationY,
    distance: ZM.camera.distance,
    offsetX: ZM.camera.offsetX,
    offsetY: ZM.camera.offsetY
  };
  
  // Deep clone state params to avoid reference issues
  const restoredParams = JSON.parse(JSON.stringify(state.params));
  
  console.log('Restored params active palette:', restoredParams.activePaletteIndex);
  console.log('Restored params palettes:', restoredParams.palettes?.length);
  
  // Note: We intentionally DO NOT clear the emitter when geometry changes
  // This allows smooth transitions where old lines fade out naturally
  // while new lines are created with the updated geometry parameters
  // This creates a beautiful blending effect during state transitions
  
  // Preserve project-wide settings
  const preservedSettings = {
    stateTransitionDuration: ZM.params.stateTransitionDuration,
    colorTransitionDuration: ZM.params.colorTransitionDuration,
    autoTriggerStates: ZM.params.autoTriggerStates,
    autoTriggerFrequency: ZM.params.autoTriggerFrequency,
    ambientSpeedMaster: ZM.params.ambientSpeedMaster,
    // Overlay settings
    overlayImageSrc: ZM.params.overlayImageSrc,
    overlayPresetFile: ZM.params.overlayPresetFile,
    overlayVisible: ZM.params.overlayVisible,
    overlayScale: ZM.params.overlayScale,
    overlayOpacity: ZM.params.overlayOpacity,
    overlayX: ZM.params.overlayX,
    overlayY: ZM.params.overlayY,
    // Rendering/camera settings (only FOV is state-specific)
    near: ZM.params.near,
    far: ZM.params.far,
    framebufferMode: ZM.params.framebufferMode,
    framebufferPreset: ZM.params.framebufferPreset,
    framebufferWidth: ZM.params.framebufferWidth,
    framebufferHeight: ZM.params.framebufferHeight,
    stereoscopicMode: ZM.params.stereoscopicMode,
    eyeSeparation: ZM.params.eyeSeparation,
    // Export settings
    videoDuration: ZM.params.videoDuration,
    videoFPS: ZM.params.videoFPS,
    videoFormat: ZM.params.videoFormat,
    depthInvert: ZM.params.depthInvert
  };
  
  // Update params with deep cloned values
  Object.assign(ZM.params, restoredParams);
  
  // Restore preserved project-wide settings
  Object.assign(ZM.params, preservedSettings);
  
  console.log('ZM.params after assign, active palette:', ZM.params.activePaletteIndex);
  console.log('ZM.params.palettes:', ZM.params.palettes?.length);
  
  // Verify activePaletteIndex was restored correctly
  if (ZM.params.activePaletteIndex !== restoredParams.activePaletteIndex) {
    console.error('ERROR: activePaletteIndex got overwritten!', {
      expected: restoredParams.activePaletteIndex,
      actual: ZM.params.activePaletteIndex
    });
  }
  
  // Trigger camera transition (or instant if specified)
  if (state.camera && ZM.camera) {
    if (instant) {
      // Instant mode: directly set camera values
      ZM.camera.rotationX = state.camera.rotationX;
      ZM.camera.rotationY = state.camera.rotationY;
      ZM.camera.distance = state.camera.distance;
      ZM.camera.offsetX = state.camera.offsetX || 0;
      ZM.camera.offsetY = state.camera.offsetY || 0;
      ZM.camera.transition.isActive = false;
      ZM.camera.transition.progress = 1.0;
    } else {
      // Normal mode: use transitions
      ZM.camera.transitionTo(
        state.camera.rotationX,
        state.camera.rotationY,
        state.camera.distance,
        state.camera.offsetX,
        state.camera.offsetY
      );
    }
  }
  
  // Trigger FOV transition (only if sketch has been initialized)
  if (ZM.fovTransition && state.params.fov !== undefined) {
    if (instant) {
      // Instant mode: directly set FOV
      ZM.fovTransition.current = state.params.fov;
      ZM.fovTransition.start = state.params.fov;
      ZM.fovTransition.target = state.params.fov;
      ZM.fovTransition.progress = 1.0;
      ZM.fovTransition.isTransitioning = false;
    } else {
      // Normal mode: use transitions
      ZM.fovTransition.start = ZM.fovTransition.current;
      ZM.fovTransition.target = state.params.fov;
      ZM.fovTransition.progress = 0.0;
      ZM.fovTransition.duration = ZM.params.stateTransitionDuration;
      ZM.fovTransition.isTransitioning = true;
    }
  } else if (!ZM.fovTransition && state.params.fov !== undefined) {
    // Sketches not initialized yet - directly set FOV
    ZM.params.fov = state.params.fov;
  }
  
  // Trigger emitter rotation transition (only if sketch has been initialized)
  if (ZM.emitterRotationTransition && state.params.emitterRotation !== undefined) {
    if (instant) {
      // Instant mode: directly set rotation
      ZM.emitterRotationTransition.current = state.params.emitterRotation;
      ZM.emitterRotationTransition.start = state.params.emitterRotation;
      ZM.emitterRotationTransition.target = state.params.emitterRotation;
      ZM.emitterRotationTransition.progress = 1.0;
      ZM.emitterRotationTransition.isTransitioning = false;
    } else {
      // Normal mode: use transitions
      ZM.emitterRotationTransition.start = ZM.emitterRotationTransition.current;
      ZM.emitterRotationTransition.target = state.params.emitterRotation;
      ZM.emitterRotationTransition.progress = 0.0;
      ZM.emitterRotationTransition.duration = ZM.params.stateTransitionDuration;
      ZM.emitterRotationTransition.isTransitioning = true;
    }
  } else if (!ZM.emitterRotationTransition && state.params.emitterRotation !== undefined) {
    // Sketches not initialized yet - directly set rotation
    ZM.params.emitterRotation = state.params.emitterRotation;
  }
  
  // Trigger geometry scale transition (only if sketch has been initialized)
  if (ZM.geometryScaleTransition && state.params.geometryScale !== undefined) {
    if (instant) {
      // Instant mode: directly set scale
      ZM.geometryScaleTransition.current = state.params.geometryScale;
      ZM.geometryScaleTransition.start = state.params.geometryScale;
      ZM.geometryScaleTransition.target = state.params.geometryScale;
      ZM.geometryScaleTransition.progress = 1.0;
      ZM.geometryScaleTransition.isTransitioning = false;
    } else {
      // Normal mode: use transitions
      ZM.geometryScaleTransition.start = ZM.geometryScaleTransition.current;
      ZM.geometryScaleTransition.target = state.params.geometryScale;
      ZM.geometryScaleTransition.progress = 0.0;
      ZM.geometryScaleTransition.duration = ZM.params.stateTransitionDuration;
      ZM.geometryScaleTransition.isTransitioning = true;
    }
  } else if (!ZM.geometryScaleTransition && state.params.geometryScale !== undefined) {
    // Sketches not initialized yet - directly set scale
    ZM.params.geometryScale = state.params.geometryScale;
  }
  
  // Always apply the state's palette — both to ensure new lines use the correct
  // colors AND to transition existing lines to the restored palette.
  if (instant) {
    // Instant mode: snap background directly, then trigger palette so lines update
    if (ZM.bgTransition) {
      const newBg = getBackgroundColor(ZM.params);
      ZM.bgTransition.current = [...newBg];
      ZM.bgTransition.start = [...newBg];
      ZM.bgTransition.target = [...newBg];
      ZM.bgTransition.progress = 1.0;
      ZM.bgTransition.isTransitioning = false;
    }
    triggerPaletteChange(ZM);
  } else {
    // Normal mode: smooth palette transition
    triggerPaletteChange(ZM);
  }
  
  // Update all UI elements WITHOUT triggering events
  syncUIWithoutRestart(ZM);
  
  // Save to main localStorage
  ZM.saveToLocalStorage();
  
  // Reset auto-trigger timer to prevent immediate re-triggering
  if (ZM.autoTriggerTimer) {
    ZM.autoTriggerTimer.elapsed = 0;
  }
  
  console.log('State restored with camera transition');
}

/**
 * Sync UI without restarting sketches or resetting transitions
 * @param {Object} ZM - Main application object
 */
function syncUIWithoutRestart(ZM) {
  // Mapping of slider IDs to parameter keys with decimal precision
  const sliderMap = {
    'thickness': { param: 'lineThickness', decimals: 1 },
    'emit-rate': { param: 'emitRate', decimals: 1 },
    'speed': { param: 'speed', decimals: 0 },
    'emitter-rotation': { param: 'emitterRotation', decimals: 0 },
    'geometry-scale': { param: 'geometryScale', decimals: 0 },
    'fade-duration': { param: 'fadeDuration', decimals: 1 },
    'color-slot-z-offset': { param: 'colorSlotZOffset', decimals: 0 },
    'video-duration': { param: 'videoDuration', decimals: 0 },
    'video-fps': { param: 'videoFPS', decimals: 0 },
    'eye-separation': { param: 'eyeSeparation', decimals: 0 },
    'fov': { param: 'fov', decimals: 2 },
    'near': { param: 'near', decimals: 2 },
    'far': { param: 'far', decimals: 0 },
    'state-transition-duration': { param: 'stateTransitionDuration', decimals: 1 },
    'color-transition-duration': { param: 'colorTransitionDuration', decimals: 1 },
    'auto-trigger-frequency': { param: 'autoTriggerFrequency', decimals: 0 },
    'overlay-scale': { param: 'overlayScale', decimals: 0 },
    'overlay-opacity': { param: 'overlayOpacity', decimals: 0 },
    'overlay-x': { param: 'overlayX', decimals: 0 },
    'overlay-y': { param: 'overlayY', decimals: 0 }
  };
  
  // Update all sliders
  Object.entries(sliderMap).forEach(([sliderId, config]) => {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(sliderId + '-val');
    
    if (slider && ZM.params[config.param] !== undefined) {
      slider.value = ZM.params[config.param];
      if (display) {
        display.textContent = config.decimals > 0 ? 
          ZM.params[config.param].toFixed(config.decimals) : 
          Math.round(ZM.params[config.param]);
      }
    }
  });
  
  // Update range sliders (thickness-range, speed-range)
  updateRangeSlider('thickness-range', ZM.params.thicknessRangeMin, ZM.params.thicknessRangeMax, '%');
  updateRangeSlider('speed-range', ZM.params.speedRangeMin, ZM.params.speedRangeMax, '%');
  
  // Update checkboxes
  const checkboxMap = {
    'random-thickness': 'randomThickness',
    'random-speed': 'randomSpeed',
    'depth-invert': 'depthInvert',
    'stereoscopic-mode': 'stereoscopicMode',
    'framebuffer-mode': 'framebufferMode',
    'auto-trigger-states': 'autoTriggerStates',
    'overlay-visible': 'overlayVisible'
  };
  
  Object.entries(checkboxMap).forEach(([checkboxId, paramKey]) => {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox && ZM.params[paramKey] !== undefined) {
      checkbox.checked = ZM.params[paramKey];
    }
  });
  
  // Update framebuffer preset dropdown
  const fbPreset = document.getElementById('framebuffer-preset');
  if (fbPreset && ZM.params.framebufferPreset) {
    fbPreset.value = ZM.params.framebufferPreset;
  }
  
  // Update framebuffer dimensions
  const fbWidth = document.getElementById('framebuffer-width');
  const fbHeight = document.getElementById('framebuffer-height');
  if (fbWidth) fbWidth.value = ZM.params.framebufferWidth;
  if (fbHeight) fbHeight.value = ZM.params.framebufferHeight;
  
  // Update eye separation control state (enable/disable based on stereoscopic mode)
  const eyeSeparationSlider = document.getElementById('eye-separation');
  const eyeSeparationDisplay = document.getElementById('eye-separation-val');
  if (eyeSeparationSlider) {
    eyeSeparationSlider.disabled = !ZM.params.stereoscopicMode;
  }
  if (eyeSeparationDisplay) {
    if (ZM.params.stereoscopicMode) {
      eyeSeparationDisplay.classList.remove('disabled');
    } else {
      eyeSeparationDisplay.classList.add('disabled');
    }
  }
  
  // Update palette UI
  if (ZM.updatePaletteUI) {
    ZM.updatePaletteUI();
  }
  
  // Update overlay image
  if (ZM.updateOverlay) {
    ZM.updateOverlay();
  }
  
  // Update active palette button
  document.querySelectorAll('.palette-btn').forEach(btn => {
    const paletteIndex = parseInt(btn.dataset.palette);
    const shouldBeActive = paletteIndex === ZM.params.activePaletteIndex;
    btn.classList.toggle('active', shouldBeActive);
    if (shouldBeActive) {
      console.log(`✓ Palette button ${paletteIndex} set as active`);
    }
  });
  
  // Update camera controls display
  updateCameraDisplays(ZM);
}

/**
 * Update range slider display
 */
function updateRangeSlider(baseId, minVal, maxVal, suffix = '') {
  const minSlider = document.getElementById(`${baseId}-min`);
  const maxSlider = document.getElementById(`${baseId}-max`);
  const minDisplay = document.getElementById(`${baseId}-min-val`);
  const maxDisplay = document.getElementById(`${baseId}-max-val`);
  
  if (minSlider && minVal !== undefined) {
    minSlider.value = minVal;
  }
  if (maxSlider && maxVal !== undefined) {
    maxSlider.value = maxVal;
  }
  if (minDisplay && minVal !== undefined) {
    minDisplay.textContent = minVal + suffix;
  }
  if (maxDisplay && maxVal !== undefined) {
    maxDisplay.textContent = maxVal + suffix;
  }
}

/**
 * Update camera control displays
 * @param {Object} ZM - Main application object
 */
function updateCameraDisplays(ZM) {
  // Update any camera-related displays
  const rotXDisplay = document.getElementById('camera-rotation-x-val');
  const rotYDisplay = document.getElementById('camera-rotation-y-val');
  const distDisplay = document.getElementById('camera-distance-val');
  
  if (rotXDisplay) rotXDisplay.textContent = ZM.camera.rotationX.toFixed(2);
  if (rotYDisplay) rotYDisplay.textContent = ZM.camera.rotationY.toFixed(2);
  if (distDisplay) distDisplay.textContent = Math.round(ZM.camera.distance);
}

/**
 * Save new state
 * @param {Object} ZM - Main application object
 * @param {String} name - State name
 * @returns {Object} Created state
 */
function saveState(ZM, name) {
  const state = captureCurrentState(ZM, name);
  ZM.stateManager.states.push(state);
  ZM.stateManager.activeStateId = state.id;
  saveStatesToStorage(ZM);
  
  // Save current params to main localStorage (this state is now active)
  ZM.saveToLocalStorage();
  
  // Update UI if state panel exists
  if (ZM.updateStatePanel) {
    ZM.updateStatePanel();
  }
  
  // Update auto-trigger status (number of states changed)
  updateAutoTriggerStatus(ZM);
  
  return state;
}

/**
 * Load state by ID
 * @param {Object} ZM - Main application object
 * @param {String} id - State ID
 * @returns {Boolean} Success status
 */
function loadState(ZM, id, instant = false, toastPrefix = 'State: ') {
  const state = getStateById(ZM, id);
  if (!state) {
    console.warn('State not found:', id);
    return false;
  }
  
  restoreState(ZM, state, instant);
  ZM.stateManager.activeStateId = id;
  saveActiveStateId(id);

  if (ZM.showToast) {
    if (ZM.buildPaletteSwatchNode) {
      const wrapper = document.createElement('span');
      wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;flex:1;';
      const nameSpan = document.createElement('span');
      nameSpan.textContent = toastPrefix + state.name;
      wrapper.appendChild(nameSpan);
      const swatchNode = ZM.buildPaletteSwatchNode(ZM.params.activePaletteIndex);
      swatchNode.style.marginLeft = 'auto';
      wrapper.appendChild(swatchNode);
      ZM.showToast('', '', 4400, wrapper);
    } else {
      ZM.showToast(toastPrefix + state.name);
    }
  }

  // Add to history (unless we're navigating through history)
  if (!ZM.stateHistory.isNavigating) {
    // Remove any forward history if we're not at the end
    if (ZM.stateHistory.currentIndex < ZM.stateHistory.stack.length - 1) {
      ZM.stateHistory.stack = ZM.stateHistory.stack.slice(0, ZM.stateHistory.currentIndex + 1);
    }
    
    // Add current state to history
    ZM.stateHistory.stack.push(id);
    ZM.stateHistory.currentIndex = ZM.stateHistory.stack.length - 1;
    
    // Limit history to last 50 states
    if (ZM.stateHistory.stack.length > 50) {
      ZM.stateHistory.stack.shift();
      ZM.stateHistory.currentIndex--;
    }
  }
  
  // Update UI if state panel exists
  if (ZM.updateStatePanel) {
    ZM.updateStatePanel();
  }
  
  // Update auto-trigger status (next state name may have changed)
  updateAutoTriggerStatus(ZM);
  
  return true;
}

/**
 * Update state with current state
 * @param {Object} ZM - Main application object
 * @param {String} id - State ID to update
 * @returns {Boolean} Success status
 */
function updateState(ZM, id) {
  const stateIndex = ZM.stateManager.states.findIndex(p => p.id === id);
  if (stateIndex === -1) {
    console.warn('State not found:', id);
    return false;
  }
  
  const existingState = ZM.stateManager.states[stateIndex];
  
  // Capture current state
  const updatedState = captureCurrentState(ZM, existingState.name);
  
  console.log(`📝 Updating state "${existingState.name}":`, {
    activePaletteIndex: updatedState.params.activePaletteIndex,
    palettesCount: updatedState.params.palettes?.length
  });
  
  // Keep the original ID and creation timestamp
  updatedState.id = existingState.id;
  updatedState.timestamp = Date.now(); // Update timestamp to show it was modified
  
  // Replace the state
  ZM.stateManager.states[stateIndex] = updatedState;
  
  saveStatesToStorage(ZM);
  
  // If this is the active state, also update main localStorage to keep params in sync
  if (id === ZM.stateManager.activeStateId) {
    console.log('Updated active state - syncing main localStorage');
    ZM.saveToLocalStorage();
  }
  
  // Update UI if state panel exists
  if (ZM.updateStatePanel) {
    ZM.updateStatePanel();
  }
  
  console.log('State updated:', updatedState.name);
  
  return true;
}

/**
 * Delete state
 * @param {Object} ZM - Main application object
 * @param {String} id - State ID
 * @returns {Boolean} Success status
 */
function deleteState(ZM, id) {
  const index = ZM.stateManager.states.findIndex(p => p.id === id);
  if (index === -1) {
    console.warn('State not found:', id);
    return false;
  }
  
  // Don't allow deleting the last state
  if (ZM.stateManager.states.length === 1) {
    if (ZM.showToast) ZM.showToast('Cannot delete the last state');
    return false;
  }
  
  ZM.stateManager.states.splice(index, 1);
  
  // If deleted state was active, switch to first state
  if (ZM.stateManager.activeStateId === id) {
    loadState(ZM, ZM.stateManager.states[0].id);
  }
  
  saveStatesToStorage(ZM);
  
  // Update UI if state panel exists
  if (ZM.updateStatePanel) {
    ZM.updateStatePanel();
  }
  
  // Update auto-trigger status (number of states changed)
  updateAutoTriggerStatus(ZM);
  
  return true;
}

/**
 * Rename state
 * @param {Object} ZM - Main application object
 * @param {String} id - State ID
 * @param {String} newName - New name
 * @returns {Boolean} Success status
 */
function renameState(ZM, id, newName) {
  const state = getStateById(ZM, id);
  if (!state) {
    console.warn('State not found:', id);
    return false;
  }
  
  state.name = newName;
  saveStatesToStorage(ZM);
  
  // Update UI if state panel exists
  if (ZM.updateStatePanel) {
    ZM.updateStatePanel();
  }
  
  return true;
}

/**
 * Duplicate state
 * @param {Object} ZM - Main application object
 * @param {String} id - State ID to duplicate
 * @returns {Object|null} New state or null if failed
 */
function duplicateState(ZM, id) {
  const state = getStateById(ZM, id);
  if (!state) {
    console.warn('State not found:', id);
    return null;
  }
  
  const newState = {
    ...JSON.parse(JSON.stringify(state)),
    id: `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${state.name} (Copy)`,
    timestamp: Date.now()
  };
  
  ZM.stateManager.states.push(newState);
  saveStatesToStorage(ZM);
  
  // Update UI if state panel exists
  if (ZM.updateStatePanel) {
    ZM.updateStatePanel();
  }
  
  // Update auto-trigger status (number of states changed)
  updateAutoTriggerStatus(ZM);
  
  return newState;
}

/**
 * Export state to JSON file
 * @param {Object} ZM - Main application object
 * @param {String} id - State ID
 */
function exportStateToFile(ZM, id) {
  const state = getStateById(ZM, id);
  if (!state) {
    console.warn('State not found:', id);
    return;
  }
  
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zigmap26-state-${state.name.replace(/[^a-z0-9]/gi, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export all states to JSON file
 * @param {Object} ZM - Main application object
 */
function exportAllStates(ZM) {
  const data = {
    version: '1.0',
    states: ZM.stateManager.states,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zigmap26-states-bank-${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import state from JSON data
 * @param {Object} ZM - Main application object
 * @param {Object} jsonData - State data
 * @returns {Boolean} Success status
 */
function importStateFromData(ZM, jsonData) {
  try {
    // Check if it's a single state or state bank
    if (jsonData.states && Array.isArray(jsonData.states)) {
      // State bank
      jsonData.states.forEach(state => {
        // Generate new ID to avoid conflicts
        state.id = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Remove project-wide settings if they exist in imported state
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
          // Remove export settings (project-wide)
          delete state.params.videoDuration;
          delete state.params.videoFPS;
          delete state.params.videoFormat;
          delete state.params.depthInvert;
        }
        ZM.stateManager.states.push(state);
      });
    } else if (jsonData.id && jsonData.params) {
      // Single state
      jsonData.id = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // Remove project-wide settings if they exist in imported state
      delete jsonData.params.stateTransitionDuration;
      delete jsonData.params.colorTransitionDuration;
      delete jsonData.params.autoTriggerStates;
      delete jsonData.params.autoTriggerFrequency;
      delete jsonData.params.near;
      delete jsonData.params.far;
      delete jsonData.params.framebufferMode;
      delete jsonData.params.framebufferPreset;
      delete jsonData.params.framebufferWidth;
      delete jsonData.params.framebufferHeight;
      delete jsonData.params.stereoscopicMode;
      delete jsonData.params.eyeSeparation;
      // Remove export settings (project-wide)
      delete jsonData.params.videoDuration;
      delete jsonData.params.videoFPS;
      delete jsonData.params.videoFormat;
      delete jsonData.params.depthInvert;
      ZM.stateManager.states.push(jsonData);
    } else {
      console.error('Invalid state format');
      return false;
    }
    
    saveStatesToStorage(ZM);
    
    // Update UI if state panel exists
    if (ZM.updateStatePanel) {
      ZM.updateStatePanel();
    }
    
    return true;
  } catch (err) {
    console.error('Failed to import state:', err);
    return false;
  }
}

/**
 * Get state by ID
 * @param {Object} ZM - Main application object
 * @param {String} id - State ID
 * @returns {Object|null} State or null
 */
function getStateById(ZM, id) {
  return ZM.stateManager.states.find(p => p.id === id) || null;
}

/**
 * Set active state (without loading)
 * @param {Object} ZM - Main application object
 * @param {String} id - State ID
 */
function setActiveState(ZM, id) {
  ZM.stateManager.activeStateId = id;
  saveActiveStateId(id);
}

/**
 * Load states from localStorage
 * @returns {Array} Array of states
 */
function loadStates() {
  try {
    const stored = localStorage.getItem(STATES_STORAGE_KEY);
    if (!stored) return [];
    const states = JSON.parse(stored);
    
    // Clean up project-wide settings from states (for backward compatibility)
    states.forEach(state => {
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
      }
    });
    
    return states;
  } catch (e) {
    console.warn('Failed to load states:', e);
    return [];
  }
}

/**
 * Save states to localStorage
 * @param {Object} ZM - Main application object
 */
function saveStatesToStorage(ZM) {
  try {
    localStorage.setItem(STATES_STORAGE_KEY, JSON.stringify(ZM.stateManager.states));
  } catch (e) {
    console.warn('Failed to save states:', e);
  }
}

/**
 * Load active state ID
 * @returns {String|null} Active state ID or null
 */
function loadActiveStateId() {
  try {
    return localStorage.getItem(ACTIVE_STATE_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Save active state ID
 * @param {String} id - State ID
 */
function saveActiveStateId(id) {
  try {
    localStorage.setItem(ACTIVE_STATE_KEY, id);
  } catch (e) {
    console.warn('Failed to save active state ID:', e);
  }
}

/**
 * Navigate through state history
 * @param {Object} ZM - Main application object
 * @param {number} direction - -1 for previous, +1 for next
 * @returns {Boolean} Success status
 */
function navigateHistory(ZM, direction) {
  const newIndex = ZM.stateHistory.currentIndex + direction;
  
  // Check bounds
  if (newIndex < 0 || newIndex >= ZM.stateHistory.stack.length) {
    console.log('[History] Cannot navigate - at', direction < 0 ? 'beginning' : 'end', 'of history');
    return false;
  }
  
  // Get state ID from history
  const stateId = ZM.stateHistory.stack[newIndex];
  const state = getStateById(ZM, stateId);
  
  if (!state) {
    console.warn('[History] State not found:', stateId);
    return false;
  }
  
  // Mark as navigating to prevent adding to history
  ZM.stateHistory.isNavigating = true;
  ZM.stateHistory.currentIndex = newIndex;
  
  // Load the state
  restoreState(ZM, state);
  ZM.stateManager.activeStateId = stateId;
  saveActiveStateId(stateId);

  if (ZM.showToast) {
    const prefix = direction < 0 ? '⏮ ' : '⏭ ';
    if (ZM.buildPaletteSwatchNode) {
      const wrapper = document.createElement('span');
      wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;flex:1;';
      const nameSpan = document.createElement('span');
      nameSpan.textContent = prefix + state.name;
      wrapper.appendChild(nameSpan);
      const swatchNode = ZM.buildPaletteSwatchNode(ZM.params.activePaletteIndex);
      swatchNode.style.marginLeft = 'auto';
      wrapper.appendChild(swatchNode);
      ZM.showToast('', '', 4400, wrapper);
    } else {
      ZM.showToast(prefix + state.name);
    }
  }

  // Update UI
  if (ZM.updateStatePanel) {
    ZM.updateStatePanel();
  }
  
  updateAutoTriggerStatus(ZM);
  
  // Reset navigation flag
  ZM.stateHistory.isNavigating = false;
  
  console.log('[History] Navigated to', direction < 0 ? 'previous' : 'next', 'state:', state.name, `(${newIndex + 1}/${ZM.stateHistory.stack.length})`);
  
  return true;
}

/**
 * Navigate through states sequentially (for player mode)
 * @param {Object} ZM - Main application object
 * @param {number} direction - Direction to navigate (-1 for previous, 1 for next)
 * @returns {boolean} Success
 */
function navigateStates(ZM, direction) {
  const states = ZM.stateManager.states;
  
  // Need at least 2 states to navigate
  if (states.length < 2) {
    console.log('[Navigate] Need at least 2 states to navigate');
    return false;
  }
  
  // Find current state index
  const currentIndex = states.findIndex(s => s.id === ZM.stateManager.activeStateId);
  if (currentIndex === -1) {
    console.warn('[Navigate] Current state not found in states array');
    return false;
  }
  
  // Calculate new index with wrapping
  let newIndex = currentIndex + direction;
  if (newIndex < 0) {
    newIndex = states.length - 1; // Wrap to end
  } else if (newIndex >= states.length) {
    newIndex = 0; // Wrap to beginning
  }
  
  const nextState = states[newIndex];
  
  // Load the state
  const success = loadState(ZM, nextState.id);
  
  console.log('[Navigate] Navigated to', direction < 0 ? 'previous' : 'next', 'state:', nextState.name, `(${newIndex + 1}/${states.length})`);
  
  return success;
}

/**
 * Shuffle an array using Fisher-Yates algorithm (true random shuffle)
 * @param {Array} array - Array to shuffle (modifies in place)
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array]; // Create copy to avoid mutating original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Initialize auto-trigger media player controls
 * @param {Object} ZM - Main application object
 */
function initializeAutoTriggerControls(ZM) {
  // Play/Pause button
  const playPauseBtn = document.getElementById('auto-trigger-play-pause');
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      // If auto-trigger is disabled, enable it and start playing
      if (!ZM.params.autoTriggerStates) {
        ZM.params.autoTriggerStates = true;
        const checkbox = document.getElementById('auto-trigger-states');
        if (checkbox) checkbox.checked = true;
        ZM.autoTriggerTimer.paused = false;
        ZM.saveToLocalStorage();
        console.log('[Auto-Trigger] Enabled and started');
        if (ZM.showToast) ZM.showToast('▶ States Player');
      } else {
        // Toggle pause state
        if (ZM.autoTriggerTimer.paused) {
          // Resume: unpause and continue from where we left off
          ZM.autoTriggerTimer.paused = false;
          console.log('[Auto-Trigger] Resumed');
        } else {
          // Pause: save current elapsed time
          ZM.autoTriggerTimer.paused = true;
          ZM.autoTriggerTimer.pausedAt = ZM.autoTriggerTimer.elapsed;
          console.log('[Auto-Trigger] Paused at', ZM.autoTriggerTimer.pausedAt.toFixed(1), 'seconds');
        }
      }
      updateAutoTriggerStatus(ZM);
      if (ZM.showToast) ZM.showToast(ZM.autoTriggerTimer.paused ? '⏸ States Player' : '▶ States Player');
    });
  }
  
  // Previous button
  const previousBtn = document.getElementById('auto-trigger-previous');
  if (previousBtn) {
    previousBtn.addEventListener('click', () => {
      navigateHistory(ZM, -1);
    });
  }
  
  // Reset button
  const resetBtn = document.getElementById('auto-trigger-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      ZM.autoTriggerTimer.elapsed = 0;
      ZM.autoTriggerTimer.pausedAt = 0;
      console.log('[Auto-Trigger] Timer reset');
      updateAutoTriggerStatus(ZM);
      if (ZM.showToast) ZM.showToast('Timer Reset');
    });
  }
  
  // Skip button
  const skipBtn = document.getElementById('auto-trigger-skip');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      // Reset timer and trigger immediately
      ZM.autoTriggerTimer.elapsed = 0;
      ZM.autoTriggerTimer.pausedAt = 0;
      ZM.stateManager.loadRandomState();
      console.log('[Auto-Trigger] Skipped to next state');
      updateAutoTriggerStatus(ZM);
    });
  }
  
  // Progress bar scrubbing (click and drag)
  const progressBarContainer = document.getElementById('progress-bar-container');
  if (progressBarContainer) {
    let isDragging = false;
    
    const scrubToPosition = (e) => {
      const rect = progressBarContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const newElapsed = percentage * ZM.params.autoTriggerFrequency;
      
      ZM.autoTriggerTimer.elapsed = newElapsed;
      if (ZM.autoTriggerTimer.paused) {
        ZM.autoTriggerTimer.pausedAt = newElapsed;
      }
      
      console.log('[Auto-Trigger] Scrubbed to', newElapsed.toFixed(1), 'seconds');
      updateAutoTriggerStatus(ZM);
    };
    
    progressBarContainer.addEventListener('mousedown', (e) => {
      isDragging = true;
      progressBarContainer.style.cursor = 'grabbing';
      scrubToPosition(e);
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        scrubToPosition(e);
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        progressBarContainer.style.cursor = 'pointer';
      }
    });
    
    // Make it clear the bar is interactive
    progressBarContainer.style.cursor = 'pointer';
  }
}

/**
 * Load next state from shuffle pool (ensures all states visited before repetition)
 * SHUFFLE ALGORITHM: Creates a shuffled pool of all available states, then visits each once.
 * NO REPETITION: Each state is guaranteed to be visited once per cycle.
 * AUTO-REFRESH: When pool is exhausted, automatically creates a new shuffled pool.
 * 
 * @param {Object} ZM - Main application object
 * @returns {Boolean} Success status
 */
function loadRandomState(ZM) {
  const states = ZM.stateManager.states;
  const activeId = ZM.stateManager.activeStateId;
  
  // Need at least 2 states for meaningful shuffling
  if (states.length < 2) {
    console.warn('[Auto-Trigger] Need at least 2 states for shuffle selection');
    return false;
  }
  
  // If shuffle pool is empty or undefined, create a new shuffled pool
  if (!ZM.shufflePool || ZM.shufflePool.length === 0) {
    // Get all states except the currently active one
    const availableStates = states.filter(state => state.id !== activeId);
    
    if (availableStates.length === 0) {
      console.warn('[Auto-Trigger] No available states after filtering');
      return false;
    }
    
    // Shuffle the available states into a random order
    ZM.shufflePool = shuffleArray(availableStates);
    
    console.log(`[Auto-Trigger] New shuffle cycle created: [${ZM.shufflePool.map(s => `"${s.name}"`).join(', ')}]`);
  }
  
  // Pop the next state from the shuffled pool
  const nextState = ZM.shufflePool.shift(); // Remove and return first element
  
  // Find current state name for logging
  const currentState = states.find(s => s.id === activeId);
  const currentName = currentState ? currentState.name : 'Unknown';
  
  // Debug logging
  console.log(`[Auto-Trigger] Shuffle Selection:
    Current: "${currentName}"
    Selected: "${nextState.name}"
    Remaining in cycle: [${ZM.shufflePool.map(s => `"${s.name}"`).join(', ')}]
    ${ZM.shufflePool.length === 0 ? '(Cycle complete - will shuffle on next trigger)' : ''}`);
  
  // Load the next state (this updates activeStateId for next call)
  const success = loadState(ZM, nextState.id, false, '⏭ ');
  
  // If pool is now empty, it will auto-refill on next call
  // This ensures all states are visited before any repeat
  
  return success;
}

/**
 * Update auto-trigger status display (countdown and next state)
 * @param {Object} ZM - Main application object
 */
function updateAutoTriggerStatus(ZM) {
  // Skip UI updates in player mode (no DOM elements to update)
  if (ZM.isPlayerMode) return;
  
  const statusDiv = document.getElementById('auto-trigger-status');
  const currentStateNameDisplay = document.getElementById('current-state-name');
  const countdownDisplay = document.getElementById('countdown-display');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressBarThumb = document.getElementById('progress-bar-thumb');
  const nextStateNameDisplay = document.getElementById('next-state-name');
  const playPauseBtn = document.getElementById('auto-trigger-play-pause');
  const previousBtn = document.getElementById('auto-trigger-previous');
  
  if (!statusDiv || !currentStateNameDisplay || !countdownDisplay || !progressBarFill || !nextStateNameDisplay) return;
  
  // Show status display when there are 2+ states (regardless of auto-trigger enabled state)
  if (ZM.stateManager.states.length > 1) {
    statusDiv.style.display = 'block';
    
    // Update current state name
    const currentState = ZM.stateManager.states.find(s => s.id === ZM.stateManager.activeStateId);
    if (currentState) {
      currentStateNameDisplay.textContent = currentState.name;
    }
    
    // Only calculate/update timer if auto-trigger is actually enabled
    if (ZM.params.autoTriggerStates) {
      // Calculate remaining time (respecting pause state)
      const elapsed = ZM.autoTriggerTimer.paused ? ZM.autoTriggerTimer.pausedAt : ZM.autoTriggerTimer.elapsed;
      const frequency = ZM.params.autoTriggerFrequency;
      const remaining = Math.max(0, frequency - elapsed);
      const progress = (elapsed / frequency) * 100;
      
      // Update countdown display
      countdownDisplay.textContent = `${Math.ceil(remaining)}s`;
      
      // Update progress bar (frozen when paused)
      progressBarFill.style.width = `${Math.min(100, progress)}%`;
      
      // Update playhead thumb position
      if (progressBarThumb) {
        progressBarThumb.style.left = `${Math.min(100, progress)}%`;
      }
    } else {
      // Auto-trigger disabled - show idle state
      countdownDisplay.textContent = `${ZM.params.autoTriggerFrequency}s`;
      progressBarFill.style.width = '0%';
      if (progressBarThumb) {
        progressBarThumb.style.left = '0%';
      }
    }
    
    // Update next state name
    if (ZM.shufflePool && ZM.shufflePool.length > 0) {
      // Show the next state in the shuffle pool
      nextStateNameDisplay.textContent = ZM.shufflePool[0].name;
    } else {
      // Pool is empty, will create new shuffle - show "Random State"
      nextStateNameDisplay.textContent = 'Random State';
    }
    
    // Update play/pause button state
    if (playPauseBtn) {
      if (!ZM.params.autoTriggerStates) {
        // Auto-trigger disabled - show play icon to enable it
        playPauseBtn.textContent = '▶';
        playPauseBtn.classList.add('paused');
      } else if (ZM.autoTriggerTimer.paused) {
        // Auto-trigger enabled but paused - show play icon
        playPauseBtn.textContent = '▶';
        playPauseBtn.classList.add('paused');
      } else {
        // Auto-trigger enabled and running - show pause icon
        playPauseBtn.textContent = '⏸';
        playPauseBtn.classList.remove('paused');
      }
    }
    
    // Update previous button state (disable if at beginning of history)
    if (previousBtn) {
      if (ZM.stateHistory.currentIndex <= 0) {
        previousBtn.disabled = true;
        previousBtn.style.opacity = '0.3';
        previousBtn.style.cursor = 'not-allowed';
      } else {
        previousBtn.disabled = false;
        previousBtn.style.opacity = '1';
        previousBtn.style.cursor = 'pointer';
      }
    }
  } else {
    statusDiv.style.display = 'none';
  }
}

