/**
 * UIController — Binds UI controls to parameters
 */

import { triggerPaletteChange, getBackgroundColor, initColorRNG } from '../core/colorUtils.js';
import { OVERLAY_FILES, OVERLAY_FOLDER } from '../../config/overlayPresets.js';
import { openDisplayWindow } from '../sync/WindowSync.js';
import { exportAllStatesAsFiles } from '../storage/localStorage.js';

// Debounce timer for auto-updating active state
let stateAutoUpdateTimer = null;

// Clipboard for palette copy/paste
let copiedPalette = null;

/**
 * Cancel any pending state auto-update
 */
function cancelStateAutoUpdate() {
  if (stateAutoUpdateTimer) {
    clearTimeout(stateAutoUpdateTimer);
    stateAutoUpdateTimer = null;
  }
}

/**
 * Auto-update active state after changes (debounced)
 */
function scheduleStateAutoUpdate(ZM) {
  if (!ZM.stateManager?.activeStateId) {
    return;
  }
  
  // Clear existing timer
  if (stateAutoUpdateTimer) {
    clearTimeout(stateAutoUpdateTimer);
  }
  
  // Schedule update after 500ms of no changes
  stateAutoUpdateTimer = setTimeout(() => {
    ZM.stateManager.update(ZM.stateManager.activeStateId);
    stateAutoUpdateTimer = null;
  }, 500);
}

export function initializeUI(ZM) {
  // Load JSON configs for UI presets
  loadUIConfigs().then(() => {
    initializeAllControls(ZM);
    setupExportButtons(ZM);
    setupStatePanel(ZM);
    setupCollapsibleSections();
    setupLanguageFilter();
    setupDocumentationButtons();
    
    // Load overlay presets asynchronously
    loadOverlayPresets(ZM);
  });
  
  // Store sync function
  ZM.syncUIFromParams = () => syncUIFromParams(ZM);
  ZM.updatePaletteUI = () => updatePaletteUI(ZM);
  ZM.updateStatePanel = () => updateStatePanel(ZM);
  ZM.showToast = (message, type) => showToast(message, type);
  ZM.buildPaletteSwatchNode = (paletteIndex) => buildPaletteSwatchNode(ZM, paletteIndex);
  ZM.cancelStateAutoUpdate = cancelStateAutoUpdate; // Expose to other modules
  ZM.rebuildOverlayDropdown = () => rebuildOverlayDropdown(ZM);
  ZM.updateOverlayDropdownSelection = () => updateOverlayDropdownSelection(ZM);
  ZM.updateProjectNameDisplay = (fileName) => updateProjectNameDisplay(fileName);
}

/**
 * Load UI configuration files
 */
async function loadUIConfigs() {
  try {
    const [keyboardShortcuts, uiPresets, appInfo] = await Promise.all([
      fetch('config/keyboardShortcuts.json').then(r => r.json()),
      fetch('config/uiPresets.json').then(r => r.json()),
      fetch('config/appInfo.json').then(r => r.json())
    ]);
    
    window.SpaceFlow.config = { keyboardShortcuts, uiPresets, appInfo };
  } catch (err) {
    // Failed to load UI configs
  }
}

/**
 * Initialize all UI controls
 */
function initializeAllControls(ZM) {
  // Standard sliders
  wireSlider(ZM, 'thickness', 'thickness-val', 'lineThickness', 1, 'Thickness');
  wireSlider(ZM, 'emit-rate', 'emit-rate-val', 'emitRate', 1, 'Emit Rate');
  wireSlider(ZM, 'speed', 'speed-val', 'speed', 0, 'Speed');
  wireSlider(ZM, 'emitter-rotation', 'emitter-rotation-val', 'emitterRotation', 0, 'Emitter Rotation');
  wireSlider(ZM, 'geometry-scale', 'geometry-scale-val', 'geometryScale', 0, 'Geometry Scale');
  wireSlider(ZM, 'fade-duration', 'fade-duration-val', 'fadeDuration', 0, 'Fade Duration');
  wireSlider(ZM, 'color-slot-z-offset', 'color-slot-z-offset-val', 'colorSlotZOffset', 0, 'Color Slot Z Offset');
  wireSlider(ZM, 'ambient-speed-master', 'ambient-speed-master-val', 'ambientSpeedMaster', 0, 'Ambient Speed');
  wireSlider(ZM, 'video-duration', 'video-duration-val', 'videoDuration', 0, 'Video Duration');
  wireSlider(ZM, 'video-fps', 'video-fps-val', 'videoFPS', 0, 'Video FPS');
  wireSlider(ZM, 'eye-separation', 'eye-separation-val', 'eyeSeparation', 0, 'Eye Separation');
  wireSlider(ZM, 'state-transition-duration', 'state-transition-duration-val', 'stateTransitionDuration', 1, 'State Transition');
  wireSlider(ZM, 'color-transition-duration', 'color-transition-duration-val', 'colorTransitionDuration', 1, 'Color Transition');
  
  // Color Random Seed (with RNG reinitialization)
  setupColorRandomSeedControl(ZM);
  
  wireSlider(ZM, 'auto-trigger-frequency', 'auto-trigger-frequency-val', 'autoTriggerFrequency', 0, 'Auto-Trigger Frequency');
  wireSlider(ZM, 'overlay-scale', 'overlay-scale-val', 'overlayScale', 0, 'Overlay Scale');
  wireSlider(ZM, 'overlay-opacity', 'overlay-opacity-val', 'overlayOpacity', 0, 'Overlay Opacity');
  wireSlider(ZM, 'overlay-x', 'overlay-x-val', 'overlayX', 0, 'Overlay X');
  wireSlider(ZM, 'overlay-y', 'overlay-y-val', 'overlayY', 0, 'Overlay Y');
  
  // FOV with distance compensation
  setupFOVControl(ZM);
  
  // Near/Far clipping planes
  setupClippingPlanes(ZM);
  
  // Thickness range
  setupRangeControl(ZM, 'thickness-range', 'thicknessRange', '%');
  
  // Speed range
  setupRangeControl(ZM, 'speed-range', 'speedRange', '%');
  
  // Checkboxes
  wireCheckbox(ZM, 'random-thickness', 'randomThickness', 'Random Thickness');
  wireCheckbox(ZM, 'random-speed', 'randomSpeed', 'Random Speed');
  wireCheckbox(ZM, 'depth-invert', 'depthInvert', 'Depth Map Invert');
  wireCheckbox(ZM, 'auto-trigger-states', 'autoTriggerStates', 'Auto-Trigger States');
  
  // Stereoscopic controls
  setupStereoscopicControls(ZM);
  
  // Framebuffer controls
  setupFramebufferControls(ZM);
  
  // Palette UI
  setupPaletteUI(ZM);
  
  // Video format buttons
  setupVideoFormatButtons(ZM);
  
  // Overlay controls
  setupOverlayControls(ZM);
  
  // Text message overlay controls
  setupTextOverlayControls(ZM);
  
  // File save/load
  setupFileSaveLoad(ZM);
  
  // UI buttons
  setupUIButtons(ZM);
}

/**
 * Wire a simple slider to a parameter
 */
function wireSlider(ZM, sliderId, displayId, paramKey, decimals = 0, label = '') {
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(displayId);
  
  if (!slider || !display) return;
  
  slider.value = ZM.params[paramKey];
  display.textContent = decimals > 0 ? 
    ZM.params[paramKey].toFixed(decimals) : 
    ZM.params[paramKey];
  
  slider.addEventListener('input', () => {
    const oldValue = ZM.params[paramKey];
    ZM.params[paramKey] = parseFloat(slider.value);
    display.textContent = decimals > 0 ? 
      ZM.params[paramKey].toFixed(decimals) : 
      ZM.params[paramKey];
    
    // Cancel emitter rotation transition if user manually adjusts it
    if (paramKey === 'emitterRotation' && ZM.emitterRotationTransition) {
      ZM.emitterRotationTransition.isTransitioning = false;
      ZM.emitterRotationTransition.current = ZM.params[paramKey];
    }
    
    // Cancel geometry scale transition if user manually adjusts it
    if (paramKey === 'geometryScale' && ZM.geometryScaleTransition) {
      ZM.geometryScaleTransition.isTransitioning = false;
      ZM.geometryScaleTransition.current = ZM.params[paramKey];
    }
    
    // Update auto-trigger status when frequency changes
    if (paramKey === 'autoTriggerFrequency' && ZM.stateManager && ZM.stateManager.updateAutoTriggerStatus) {
      ZM.stateManager.updateAutoTriggerStatus();
    }
    
    // Update existing line base speeds when speed parameter changes
    if (paramKey === 'speed' && ZM.emitterInstance && ZM.emitterInstance.lines && oldValue !== 0) {
      const speedRatio = ZM.params[paramKey] / oldValue;
      for (const line of ZM.emitterInstance.lines) {
        line.baseVy *= speedRatio;
      }
    }
    // ambientSpeedMaster is applied dynamically in line.update(), no adjustment needed
    
    ZM.saveToLocalStorage();
    
    // Broadcast param changes during slider drag (in addition to pointerup)
    // This ensures display windows stay in sync even if palette changes before releasing mouse
    if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
      ZM.windowSync.broadcastParamChanges({ [paramKey]: ZM.params[paramKey] });
    }
  });

  if (label) {
    slider.addEventListener('pointerup', () => {
      if (ZM.showToast) {
        const val = decimals > 0 ? ZM.params[paramKey].toFixed(decimals) : ZM.params[paramKey];
        ZM.showToast(`${label}: ${val}`);
      }
    });
  }
  
  // Broadcast param change to display window on mouse up (already broadcasted during input)
  slider.addEventListener('pointerup', () => {
    if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
      ZM.windowSync.broadcastParamChanges({ [paramKey]: ZM.params[paramKey] });
    }
  });
}

/**
 * Wire a checkbox to a parameter
 */
function wireCheckbox(ZM, checkboxId, paramKey, label) {
  const checkbox = document.getElementById(checkboxId);
  if (!checkbox) return;
  
  // Force-sync checkbox state from params (overrides browser form restoration)
  checkbox.checked = ZM.params[paramKey];
  
  // Also sync after a brief delay to ensure browser autofill is overridden
  setTimeout(() => {
    checkbox.checked = ZM.params[paramKey];
  }, 0);
  
  checkbox.addEventListener('change', (e) => {
    ZM.params[paramKey] = e.target.checked;
    ZM.saveToLocalStorage();
    
    if (label && ZM.showToast) {
      ZM.showToast(label + (e.target.checked ? ' — ON' : ' — OFF'));
    }
    
    // Broadcast param change to display window
    if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
      ZM.windowSync.broadcastParamChanges({ [paramKey]: ZM.params[paramKey] });
    }

    // Special handling for auto-trigger states checkbox
    if (checkboxId === 'auto-trigger-states') {
      // Reset timer when toggled
      if (ZM.autoTriggerTimer) {
        ZM.autoTriggerTimer.elapsed = 0;
      }
      // Update status display immediately
      if (ZM.stateManager && ZM.stateManager.updateAutoTriggerStatus) {
        ZM.stateManager.updateAutoTriggerStatus();
      }
    }
  });
}

/**
 * Setup FOV control with distance compensation
 */
function setupFOVControl(ZM) {
  const slider = document.getElementById('fov');
  const display = document.getElementById('fov-val');
  
  if (!slider || !display) return;
  
  slider.value = ZM.params.fov;
  display.textContent = ZM.params.fov.toFixed(2);
  
  slider.addEventListener('input', () => {
    // Cancel any active FOV transition
    if (ZM.fovTransition && ZM.fovTransition.isTransitioning) {
      ZM.fovTransition.isTransitioning = false;
    }
    
    // Cancel any active camera transition when FOV changes
    if (ZM.camera.transition.isActive) {
      ZM.camera.transition.isActive = false;
    }
    
    const oldFOV = ZM.params.fov;
    const newFOV = parseFloat(slider.value);
    const oldFOVRad = oldFOV * Math.PI / 180;
    const newFOVRad = newFOV * Math.PI / 180;
    const ratio = Math.tan(oldFOVRad / 2) / Math.tan(newFOVRad / 2);
    const newDist = Math.max(50, Math.min(10000, ZM.camera.distance * ratio));
    
    ZM.params.fov = newFOV;
    ZM.fovTransition.current = newFOV;
    ZM.camera.distance = newDist;
    ZM.params.cameraDistance = newDist;
    display.textContent = newFOV.toFixed(2);
    ZM.saveToLocalStorage();
  });

  slider.addEventListener('pointerup', () => {
    if (ZM.showToast) ZM.showToast(`FOV: ${ZM.params.fov.toFixed(2)}`);
    
    // Broadcast FOV and compensated camera distance to display window
    if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
      ZM.windowSync.broadcastParamChanges({ 
        fov: ZM.params.fov,
        cameraDistance: ZM.params.cameraDistance
      });
    }
  });
}

/**
 * Setup color random seed control (reinitializes RNG on change)
 */
function setupColorRandomSeedControl(ZM) {
  const slider = document.getElementById('color-random-seed');
  const display = document.getElementById('color-random-seed-val');
  
  if (!slider || !display) return;
  
  slider.value = ZM.params.colorRandomSeed || 1;
  display.textContent = ZM.params.colorRandomSeed || 1;
  
  slider.addEventListener('input', () => {
    const newSeed = parseInt(slider.value);
    ZM.params.colorRandomSeed = newSeed;
    display.textContent = newSeed;
    
    // Reinitialize RNG with new seed
    initColorRNG(newSeed);
    
    ZM.saveToLocalStorage();
  });
  
  slider.addEventListener('pointerup', () => {
    if (ZM.showToast) ZM.showToast(`Color Seed: ${ZM.params.colorRandomSeed}`);
    
    // Broadcast seed change to display windows
    if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
      ZM.windowSync.broadcastParamChanges({ 
        colorRandomSeed: ZM.params.colorRandomSeed
      });
    }
  });
}

/**
 * Setup clipping planes controls
 */
function setupClippingPlanes(ZM) {
  const nearSlider = document.getElementById('near');
  const farSlider = document.getElementById('far');
  const nearDisplay = document.getElementById('near-val');
  const farDisplay = document.getElementById('far-val');
  
  if (!nearSlider || !farSlider) return;
  
  nearSlider.value = ZM.params.near;
  farSlider.value = ZM.params.far;
  nearDisplay.textContent = ZM.params.near.toFixed(2);
  farDisplay.textContent = ZM.params.far;
  
  nearSlider.addEventListener('input', () => {
    ZM.params.near = Math.max(0.01, parseFloat(nearSlider.value));
    nearDisplay.textContent = ZM.params.near.toFixed(2);
    ZM.saveToLocalStorage();
  });
  nearSlider.addEventListener('pointerup', () => {
    if (ZM.showToast) ZM.showToast(`Near: ${ZM.params.near.toFixed(2)}`);
  });
  
  farSlider.addEventListener('input', () => {
    ZM.params.far = parseFloat(farSlider.value);
    farDisplay.textContent = ZM.params.far;
    ZM.saveToLocalStorage();
  });
  farSlider.addEventListener('pointerup', () => {
    if (ZM.showToast) ZM.showToast(`Far: ${ZM.params.far}`);
  });
}

/**
 * Setup range control (min/max sliders)
 */
function setupRangeControl(ZM, baseId, paramBase, suffix = '') {
  const minSlider = document.getElementById(`${baseId}-min`);
  const maxSlider = document.getElementById(`${baseId}-max`);
  const minDisplay = document.getElementById(`${baseId}-min-val`);
  const maxDisplay = document.getElementById(`${baseId}-max-val`);
  
  if (!minSlider || !maxSlider) return;
  
  const minKey = `${paramBase}Min`;
  const maxKey = `${paramBase}Max`;
  
  minSlider.value = ZM.params[minKey];
  maxSlider.value = ZM.params[maxKey];
  minDisplay.textContent = ZM.params[minKey] + suffix;
  maxDisplay.textContent = ZM.params[maxKey] + suffix;
  
  minSlider.addEventListener('input', () => {
    if (+minSlider.value > +maxSlider.value) {
      minSlider.value = maxSlider.value;
    }
    ZM.params[minKey] = +minSlider.value;
    minDisplay.textContent = minSlider.value + suffix;
    ZM.saveToLocalStorage();
  });
  minSlider.addEventListener('pointerup', () => {
    if (ZM.showToast) ZM.showToast(`${baseId} min: ${ZM.params[minKey]}${suffix}`);
    
    // Broadcast range param change to display window
    if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
      ZM.windowSync.broadcastParamChanges({ [minKey]: ZM.params[minKey] });
    }
  });
  
  maxSlider.addEventListener('input', () => {
    if (+maxSlider.value < +minSlider.value) {
      maxSlider.value = minSlider.value;
    }
    ZM.params[maxKey] = +maxSlider.value;
    maxDisplay.textContent = maxSlider.value + suffix;
    ZM.saveToLocalStorage();
  });
  maxSlider.addEventListener('pointerup', () => {
    if (ZM.showToast) ZM.showToast(`${baseId} max: ${ZM.params[maxKey]}${suffix}`);
    
    // Broadcast range param change to display window
    if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
      ZM.windowSync.broadcastParamChanges({ [maxKey]: ZM.params[maxKey] });
    }
  });
}

/**
 * Setup stereoscopic mode controls
 */
function setupStereoscopicControls(ZM) {
  const checkbox = document.getElementById('stereoscopic-mode');
  const eyeSeparationSlider = document.getElementById('eye-separation');
  const eyeSeparationDisplay = document.getElementById('eye-separation-val');
  
  if (!checkbox) return;
  
  // Function to update eye separation control state
  const updateEyeSeparationState = (enabled) => {
    if (eyeSeparationSlider) {
      eyeSeparationSlider.disabled = !enabled;
    }
    if (eyeSeparationDisplay) {
      if (enabled) {
        eyeSeparationDisplay.classList.remove('disabled');
      } else {
        eyeSeparationDisplay.classList.add('disabled');
      }
    }
  };
  
  checkbox.checked = ZM.params.stereoscopicMode;
  updateEyeSeparationState(ZM.params.stereoscopicMode);
  
  checkbox.addEventListener('change', (e) => {
    ZM.params.stereoscopicMode = e.target.checked;
    updateEyeSeparationState(e.target.checked);
    ZM.initializeSketches();
    if (ZM.params.framebufferMode) {
      setTimeout(() => ZM.updateCanvasSize(), 100);
    }
    
    // Update overlay visibility for correct mode (with small delay to ensure DOM is ready)
    setTimeout(() => {
      if (ZM.updateOverlay) {
        ZM.updateOverlay();
      }
    }, 50);
    
    ZM.saveToLocalStorage();
    if (ZM.showToast) ZM.showToast('Stereoscopic View (VR)' + (e.target.checked ? ' — ON' : ' — OFF'));
  });
}

/**
 * Setup framebuffer resolution controls
 */
function setupFramebufferControls(ZM) {
  const modeCheckbox = document.getElementById('framebuffer-mode');
  const presetSelect = document.getElementById('framebuffer-preset');
  const widthInput = document.getElementById('framebuffer-width');
  const heightInput = document.getElementById('framebuffer-height');
  
  if (!modeCheckbox) return;
  
  // Populate preset dropdown from config
  if (presetSelect && window.SpaceFlow.config?.uiPresets?.framebufferPresets) {
    const presets = window.SpaceFlow.config.uiPresets.framebufferPresets;
    presetSelect.innerHTML = ''; // Clear existing options
    
    // Add all presets from config
    Object.entries(presets).forEach(([key, preset]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = preset.label;
      presetSelect.appendChild(option);
    });
    
    // Add custom option at the end
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Custom Dimensions';
    presetSelect.appendChild(customOption);
  }
  
  // Mode checkbox
  modeCheckbox.checked = ZM.params.framebufferMode;
  modeCheckbox.addEventListener('change', (e) => {
    ZM.params.framebufferMode = e.target.checked;
    ZM.updateCanvasSize();
    ZM.saveToLocalStorage();
    if (ZM.showToast) {
      const dimStr = e.target.checked ? ` — ON (${ZM.params.framebufferWidth}×${ZM.params.framebufferHeight})` : ' — OFF';
      ZM.showToast('Framebuffer Resolution' + dimStr);
    }
  });
  
  // Preset selector
  if (presetSelect) {
    presetSelect.value = ZM.params.framebufferPreset;
    presetSelect.addEventListener('change', (e) => {
      ZM.params.framebufferPreset = e.target.value;
      if (e.target.value !== 'custom') {
        const [w, h] = e.target.value.split('x').map(Number);
        ZM.params.framebufferWidth = w;
        ZM.params.framebufferHeight = h;
        widthInput.value = w;
        heightInput.value = h;
        
        // Automatically enable framebuffer mode when preset is selected
        if (!ZM.params.framebufferMode) {
          ZM.params.framebufferMode = true;
          if (modeCheckbox) modeCheckbox.checked = true;
        }
        
        ZM.updateCanvasSize();
        if (ZM.showToast) ZM.showToast(`Framebuffer: ${w}×${h}`);
      }
      ZM.saveToLocalStorage();
    });
  }
  
  // Width/height inputs
  if (widthInput) {
    widthInput.value = ZM.params.framebufferWidth;
    widthInput.addEventListener('input', (e) => {
      ZM.params.framebufferWidth = Math.max(8, parseInt(e.target.value) || 1920);
      if (ZM.params.framebufferMode) ZM.updateCanvasSize();
      ZM.params.framebufferPreset = getPresetForDimensions(
        ZM.params.framebufferWidth, 
        ZM.params.framebufferHeight
      );
      presetSelect.value = ZM.params.framebufferPreset;
      ZM.saveToLocalStorage();
    });
    widthInput.addEventListener('change', () => {
      if (ZM.showToast) ZM.showToast(`Framebuffer: ${ZM.params.framebufferWidth}×${ZM.params.framebufferHeight}`);
    });
  }
  
  if (heightInput) {
    heightInput.value = ZM.params.framebufferHeight;
    heightInput.addEventListener('input', (e) => {
      ZM.params.framebufferHeight = Math.max(8, parseInt(e.target.value) || 1080);
      if (ZM.params.framebufferMode) ZM.updateCanvasSize();
      ZM.params.framebufferPreset = getPresetForDimensions(
        ZM.params.framebufferWidth, 
        ZM.params.framebufferHeight
      );
      presetSelect.value = ZM.params.framebufferPreset;
      ZM.saveToLocalStorage();
    });
    heightInput.addEventListener('change', () => {
      if (ZM.showToast) ZM.showToast(`Framebuffer: ${ZM.params.framebufferWidth}×${ZM.params.framebufferHeight}`);
    });
  }

  // Canvas border visibility toggle
  const borderVisibleCheckbox = document.getElementById('canvas-border-visible');

  const updateBorderVisibility = (visible) => {
    applyCanvasBorder(visible);
  };

  if (borderVisibleCheckbox) {
    borderVisibleCheckbox.checked = ZM.params.canvasBorderVisible === true;
    borderVisibleCheckbox.addEventListener('change', (e) => {
      ZM.params.canvasBorderVisible = e.target.checked;
      updateBorderVisibility(e.target.checked);
      ZM.saveToLocalStorage();
    });
  }

  // Apply initial state
  updateBorderVisibility(ZM.params.canvasBorderVisible === true);
}

/**
 * Apply canvas border: sets CSS custom property and toggles a class for visibility.
 * Always uses the default green color (#adff2f).
 */
function applyCanvasBorder(visible, color = '#adff2f') {
  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) return;
  
  wrapper.style.setProperty('--canvas-border-color', color);
  wrapper.classList.toggle('canvas-border-hidden', !visible);
}

/**
 * Get preset name for dimensions
 */
function getPresetForDimensions(w, h) {
  const presets = {
    '1920x1080': [1920, 1080],
    '1080x1920': [1080, 1920],
    '1080x1080': [1080, 1080],
    '1920x1920': [1920, 1920],
    '3840x2160': [3840, 2160],
    '2160x3840': [2160, 3840],
    '2160x2160': [2160, 2160],
    '3840x3840': [3840, 3840],
    '3500x1500': [3500, 1500],
    '1080x1440': [1080, 1440]
  };
  
  for (const [key, [pw, ph]] of Object.entries(presets)) {
    if (pw === w && ph === h) return key;
  }
  return 'custom';
}

/**
 * Build a swatches DOM node for the active palette (or a given palette index).
 * Used by both palette selector buttons and color/role change notifications.
 */
function buildPaletteSwatchNode(ZM, paletteIndex) {
  const swatches = document.createElement('span');
  swatches.style.cssText = 'display:inline-flex;gap:4px;margin-left:8px;vertical-align:middle;';
  const palette = ZM.params.palettes[paletteIndex];
  palette.forEach(slot => {
    const s = document.createElement('span');
    const [r, g, b] = slot.rgb;
    const border = slot.role === 'background'
      ? '2px solid rgba(200,200,200,0.6)'
      : '1px solid rgba(255,255,255,0.15)';
    s.style.cssText = `position:relative;display:inline-block;width:14px;height:14px;border-radius:3px;background:rgb(${r},${g},${b});border:${border};flex-shrink:0;`;
    if (slot.role === 'none') {
      const dim = document.createElement('span');
      dim.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.75);border-radius:2px;';
      s.appendChild(dim);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 14 14');
      svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
      [['2','2','12','12'],['12','2','2','12']].forEach(([x1,y1,x2,y2]) => {
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', x1); l.setAttribute('y1', y1);
        l.setAttribute('x2', x2); l.setAttribute('y2', y2);
        l.setAttribute('stroke', 'rgba(255,255,255,0.75)');
        l.setAttribute('stroke-width', '1.5');
        l.setAttribute('stroke-linecap', 'round');
        svg.appendChild(l);
      });
      s.appendChild(svg);
    }
    swatches.appendChild(s);
  });
  return swatches;
}

/**
 * Setup palette UI controls
 */
function setupPaletteUI(ZM) {
  // Initialize UI from current params
  updatePaletteUI(ZM);
  
  // Palette selector buttons
  document.querySelectorAll('.palette-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const paletteIndex = parseInt(btn.dataset.palette);
      
      // Update active button
      document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update params and trigger color transitions
      ZM.params.activePaletteIndex = paletteIndex;
      updatePaletteUI(ZM);
      
      // Broadcast BEFORE triggering so all windows transition simultaneously
      if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
        ZM.windowSync.broadcastParamChanges({ 
          activePaletteIndex: ZM.params.activePaletteIndex
        });
      }
      
      if (ZM.triggerPaletteChange) {
        ZM.triggerPaletteChange();
      }
      ZM.saveToLocalStorage();
      if (ZM.showToast) {
        ZM.showToast(`Palette ${paletteIndex + 1}`, '', 4400, buildPaletteSwatchNode(ZM, paletteIndex));
      }

      // Auto-update active state (debounced)
      scheduleStateAutoUpdate(ZM);
    });
  });
  
  // Color pickers
  document.querySelectorAll('.color-picker').forEach(picker => {
    picker.addEventListener('input', () => {
      const slotIndex = parseInt(picker.dataset.slot);
      const hex = picker.value;
      const rgb = hexToRgb(hex);
      
      ZM.params.palettes[ZM.params.activePaletteIndex][slotIndex].rgb = rgb;
      
      // Broadcast IMMEDIATELY so all windows trigger palette change simultaneously
      if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
        ZM.windowSync.broadcastParamChanges({ 
          palettes: ZM.params.palettes,
          activePaletteIndex: ZM.params.activePaletteIndex
        });
      }
      
      if (ZM.triggerPaletteChange) {
        ZM.triggerPaletteChange();
      }
      ZM.saveToLocalStorage();
      
      if (ZM.showToast) {
        const idx = ZM.params.activePaletteIndex;
        ZM.showToast(`Palette ${idx + 1}`, '', 4400, buildPaletteSwatchNode(ZM, idx));
      }

      // Auto-update active state (debounced)
      scheduleStateAutoUpdate(ZM);
    });
  });
  
  // Role selectors
  document.querySelectorAll('.color-role').forEach(select => {
    select.addEventListener('change', () => {
      const slotIndex = parseInt(select.dataset.slot);
      const newRole = select.value;
      const activePalette = ZM.params.palettes[ZM.params.activePaletteIndex];
      
      // Enforce background exclusivity
      if (newRole === 'background') {
        activePalette.forEach((color, idx) => {
          if (idx !== slotIndex && color.role === 'background') {
            color.role = 'none';
          }
        });
        updatePaletteUI(ZM); // Refresh all dropdowns
      }
      
      activePalette[slotIndex].role = newRole;
      
      // Broadcast BEFORE triggering so all windows transition simultaneously
      if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
        ZM.windowSync.broadcastParamChanges({ 
          palettes: ZM.params.palettes,
          activePaletteIndex: ZM.params.activePaletteIndex
        });
      }
      
      if (ZM.triggerPaletteChange) {
        ZM.triggerPaletteChange();
      }
      ZM.saveToLocalStorage();

      if (ZM.showToast) {
        const idx = ZM.params.activePaletteIndex;
        ZM.showToast(`Palette ${idx + 1}`, '', 4400, buildPaletteSwatchNode(ZM, idx));
      }
      
      // Auto-update active state (debounced)
      scheduleStateAutoUpdate(ZM);
    });
  });
  
  // Copy/Paste palette buttons
  setupPaletteCopyPaste(ZM);
}

/**
 * Setup palette copy/paste functionality
 */
function setupPaletteCopyPaste(ZM) {
  const copyBtn = document.getElementById('copy-palette-btn');
  const pasteBtn = document.getElementById('paste-palette-btn');
  
  if (!copyBtn || !pasteBtn) {
    
    return;
  }
  
  // Copy button
  copyBtn.addEventListener('click', () => {
    const activePaletteIndex = ZM.params.activePaletteIndex;
    const activePalette = ZM.params.palettes[activePaletteIndex];
    
    // Deep copy the palette
    copiedPalette = JSON.parse(JSON.stringify(activePalette));
    
    // Enable paste button
    pasteBtn.disabled = false;
    
    // Show toast with swatch
    if (ZM.showToast) {
      ZM.showToast(
        `Copied Palette ${activePaletteIndex + 1}`, 
        '', 
        3000, 
        buildPaletteSwatchNode(ZM, activePaletteIndex)
      );
    }
    
    
  });
  
  // Paste button
  pasteBtn.addEventListener('click', () => {
    if (!copiedPalette) {
      
      return;
    }
    
    const activePaletteIndex = ZM.params.activePaletteIndex;
    
    // Deep copy to current palette
    ZM.params.palettes[activePaletteIndex] = JSON.parse(JSON.stringify(copiedPalette));
    
    // Update UI
    updatePaletteUI(ZM);
    
    // Broadcast BEFORE triggering so all windows transition simultaneously
    if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
      ZM.windowSync.broadcastParamChanges({ 
        palettes: ZM.params.palettes,
        activePaletteIndex: ZM.params.activePaletteIndex
      });
    }
    
    // Trigger color transitions
    if (ZM.triggerPaletteChange) {
      ZM.triggerPaletteChange();
    }
    
    // Save to localStorage
    ZM.saveToLocalStorage();
    
    // Show toast with swatch
    if (ZM.showToast) {
      ZM.showToast(
        `Pasted to Palette ${activePaletteIndex + 1}`, 
        '', 
        3000, 
        buildPaletteSwatchNode(ZM, activePaletteIndex)
      );
    }
    
    
    
    // Auto-update active state (debounced)
    scheduleStateAutoUpdate(ZM);
  });
}

/**
 * Update palette UI from current params
 */
function updatePaletteUI(ZM) {
  const activePaletteIndex = ZM.params.activePaletteIndex;
  const activePalette = ZM.params.palettes[activePaletteIndex];
  
  
  
  activePalette.forEach((color, idx) => {
    // Update color picker
    const picker = document.querySelector(`.color-picker[data-slot="${idx}"]`);
    if (picker) {
      picker.value = rgbToHex(color.rgb);
    }
    
    // Update role dropdown
    const roleSelect = document.querySelector(`.color-role[data-slot="${idx}"]`);
    if (roleSelect) {
      roleSelect.value = color.role;
    }
  });
}

/**
 * Convert RGB array to hex string
 */
function rgbToHex(rgb) {
  return '#' + rgb.map(c => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Convert hex string to RGB array
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

/**
 * Setup video format buttons
 */
function setupVideoFormatButtons(ZM) {
  document.querySelectorAll('[data-format]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-format]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ZM.params.videoFormat = btn.dataset.format;
      ZM.saveToLocalStorage();
      if (ZM.showToast) ZM.showToast(`Video Format: ${btn.dataset.format.toUpperCase()}`);
    });
  });
}

/**
 * Setup file save/load buttons
 */
function setupFileSaveLoad(ZM) {
  const saveBtn = document.getElementById('save-json');
  const loadBtn = document.getElementById('load-json');
  const loadInput = document.getElementById('load-json-input');
  const displayWindowBtn = document.getElementById('open-display-window');
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      
      
      // Determine filename
      let filename = null;
      if (ZM._projectName) {
        // Use loaded preset name (remove .json extension if present)
        filename = ZM._projectName.replace(/\.json$/i, '');
      } else {
        // Prompt user for filename
        const userInput = prompt('Enter project name:', 'SpaceFlow');
        if (userInput) {
          filename = userInput.trim();
          // Store the new project name
          ZM._projectName = `${filename}.json`;
          if (ZM.updateProjectNameDisplay) {
            ZM.updateProjectNameDisplay(ZM._projectName);
          }
        } else {
          // User cancelled - use fallback
          filename = 'SpaceFlow';
          ZM._projectName = 'SpaceFlow.json';
          if (ZM.updateProjectNameDisplay) {
            ZM.updateProjectNameDisplay(ZM._projectName);
          }
        }
      }
      
      // Always save as full project (format='project')
      ZM.downloadJSON('project', filename);
      if (ZM.showToast) ZM.showToast('✓ Project saved', 'success');
    });
  }
  
  if (loadBtn && loadInput) {
    // Load button now opens preset loader modal
    loadBtn.addEventListener('click', () => {
      if (ZM.showPresetLoaderModal) {
        ZM.showPresetLoaderModal();
      } else {
        // Fallback to file picker if modal not available
        loadInput.click();
      }
    });
    
    // File input change handler (used by "Load from File" button in modal)
    loadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        ZM.loadJSON(file);
        if (ZM.updateProjectNameDisplay) {
          ZM.updateProjectNameDisplay(file.name);
        }
      }
    });
  }
  
  // Display window button
  if (displayWindowBtn) {
    displayWindowBtn.addEventListener('click', () => {
      const displayWindow = openDisplayWindow();
      if (displayWindow && ZM.showToast) {
        ZM.showToast('🖥️ Display window opened', 'success');
      } else if (!displayWindow && ZM.showToast) {
        ZM.showToast('❌ Failed to open display window (popup blocked?)', 'error');
      }
    });
  }
}

/**
 * Setup UI control buttons
 */
function setupUIButtons(ZM) {
  // Listen for fullscreen changes to transition background
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      document.body.classList.add('fullscreen');
    } else {
      document.body.classList.remove('fullscreen');
    }
  });
}

/**
 * Load and populate overlay presets
 */
async function loadOverlayPresets(ZM) {
  const presetSelect = document.getElementById('overlay-preset');
  if (!presetSelect) return;
  
  try {
    // Load each overlay file from config
    const overlays = [];
    for (const file of OVERLAY_FILES) {
      try {
        const response = await fetch(OVERLAY_FOLDER + file);
        if (response.ok) {
          const data = await response.json();
          overlays.push({
            file: file,
            name: file.replace('.json', '').replace(/_/g, ' '),
            data: data
          });
        }
      } catch (err) {
        
      }
    }
    
    // Store overlays in ZM for later use
    ZM.overlayPresets = overlays;
    
    // Build the dropdown
    rebuildOverlayDropdown(ZM);
    
    
  } catch (err) {
    
  }
}

/**
 * Rebuild overlay dropdown with current state
 * Called when: initial load, custom image uploaded, or state changes
 */
function rebuildOverlayDropdown(ZM) {
  const presetSelect = document.getElementById('overlay-preset');
  if (!presetSelect) return;
  
  // Start with "None" option
  presetSelect.innerHTML = '<option value="none">None</option>';
  
  // Add preset overlays
  if (ZM.overlayPresets) {
    ZM.overlayPresets.forEach((overlay, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = overlay.name;
      option.dataset.overlayData = JSON.stringify(overlay.data);
      presetSelect.appendChild(option);
    });
  }
  
  // Add custom image option if one exists (persists even when preset is selected)
  if (ZM.params.overlayCustomFilename && ZM.params.overlayCustomImageSrc) {
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = `Custom: ${ZM.params.overlayCustomFilename}`;
    presetSelect.appendChild(customOption);
  }
  
  // Add "Upload Image" option at the end
  const uploadOption = document.createElement('option');
  uploadOption.value = 'upload';
  uploadOption.textContent = '-- Upload Image --';
  presetSelect.appendChild(uploadOption);
  
  // Set current selection
  updateOverlayDropdownSelection(ZM);
}

/**
 * Update dropdown selection to match current state
 */
function updateOverlayDropdownSelection(ZM) {
  const presetSelect = document.getElementById('overlay-preset');
  if (!presetSelect) return;
  
  if (!ZM.params.overlayVisible || !ZM.params.overlayImageSrc) {
    // No overlay - select "None"
    presetSelect.value = 'none';
  } else if (ZM.params.overlayPresetFile && ZM.overlayPresets) {
    // Find the preset index by file name
    const presetIndex = ZM.overlayPresets.findIndex(p => p.file === ZM.params.overlayPresetFile);
    if (presetIndex >= 0) {
      presetSelect.value = presetIndex;
    } else {
      presetSelect.value = '';
    }
  } else if (ZM.params.overlayCustomFilename) {
    // Custom image
    presetSelect.value = 'custom';
  } else {
    // Unknown state
    presetSelect.value = '';
  }
}

/**
 * Setup overlay image controls
 */
function setupOverlayControls(ZM) {
  const overlayImgMono = document.getElementById('overlay-image');
  const overlayImgLeft = document.getElementById('overlay-image-left');
  const overlayImgRight = document.getElementById('overlay-image-right');
  const presetSelect = document.getElementById('overlay-preset');
  const loadInput = document.getElementById('load-overlay-input');
  const autoFitBtn = document.getElementById('overlay-auto-fit');
  const scaleSlider = document.getElementById('overlay-scale');
  const opacitySlider = document.getElementById('overlay-opacity');
  const xSlider = document.getElementById('overlay-x');
  const ySlider = document.getElementById('overlay-y');
  
  // Update overlay image display
  function updateOverlay() {
    const isStereo = ZM.params.stereoscopicMode;
    const overlays = isStereo ? [overlayImgLeft, overlayImgRight] : [overlayImgMono];
    const hideOverlays = isStereo ? [overlayImgMono] : [overlayImgLeft, overlayImgRight];
    
    // Hide overlays not in use for current mode
    hideOverlays.forEach(img => {
      if (img) img.style.display = 'none';
    });
    
    // Reparent overlays based on mode
    if (isStereo) {
      // Move left overlay into left eye container
      const leftEye = document.getElementById('left-eye-container');
      const rightEye = document.getElementById('right-eye-container');
      
      if (leftEye && overlayImgLeft && overlayImgLeft.parentElement !== leftEye) {
        leftEye.appendChild(overlayImgLeft);
      }
      if (rightEye && overlayImgRight && overlayImgRight.parentElement !== rightEye) {
        rightEye.appendChild(overlayImgRight);
      }
    } else {
      // Move mono overlay to canvas-wrapper (not canvas-container)
      // This makes the overlay positioned relative to the actual canvas, not the window
      const canvasWrapper = document.getElementById('canvas-wrapper');
      if (canvasWrapper && overlayImgMono && overlayImgMono.parentElement !== canvasWrapper) {
        canvasWrapper.appendChild(overlayImgMono);
      }
    }
    
    if (ZM.params.overlayVisible && ZM.params.overlayImageSrc) {
      overlays.forEach(overlayImg => {
        if (!overlayImg) return;
        
        overlayImg.style.display = 'block';
        overlayImg.src = ZM.params.overlayImageSrc;
        
        // Wait for image to load to get natural dimensions
        const applyStyles = () => {
          // Set explicit width/height to natural dimensions to prevent browser auto-sizing
          if (overlayImg.naturalWidth && overlayImg.naturalHeight) {
            overlayImg.style.width = `${overlayImg.naturalWidth}px`;
            overlayImg.style.height = `${overlayImg.naturalHeight}px`;
          }
          
          // Clear size constraints
          overlayImg.style.maxWidth = 'none';
          overlayImg.style.maxHeight = 'none';
          overlayImg.style.minWidth = '0';
          overlayImg.style.minHeight = '0';
          overlayImg.style.objectFit = 'none';
          
          // Apply positioning and scaling
          // Scale is doubled because we're now using explicit pixel dimensions
          overlayImg.style.left = `${ZM.params.overlayX}%`;
          overlayImg.style.top = `${ZM.params.overlayY}%`;
          overlayImg.style.transform = `translate(-50%, -50%) scale(${ZM.params.overlayScale / 50})`;
          overlayImg.style.opacity = ZM.params.overlayOpacity / 100;
        };
        
        if (overlayImg.complete && overlayImg.naturalWidth) {
          applyStyles();
        } else {
          overlayImg.onload = applyStyles;
        }
      });
    } else {
      overlays.forEach(overlayImg => {
        if (overlayImg) overlayImg.style.display = 'none';
      });
    }
  }
  
  // Calculate auto-fit scale (one-time calculation)
  function calculateAutoFitScale() {
    // Get the reference overlay based on current mode
    const overlayImg = ZM.params.stereoscopicMode ? overlayImgLeft : overlayImgMono;
    
    if (!overlayImg || !overlayImg.naturalWidth || !overlayImg.naturalHeight) {
      showToast('No overlay image loaded', 'error');
      return;
    }
    
    // Get the actual displayed canvas size (including CSS scaling)
    let canvas;
    if (ZM.params.stereoscopicMode) {
      // In stereo mode, get the left canvas
      canvas = ZM.p5Instance?.canvas;
    } else {
      // In mono mode, get the main canvas
      canvas = ZM.p5Instance?.canvas;
    }
    
    if (!canvas) {
      showToast('Canvas not found', 'error');
      return;
    }
    
    // Use requestAnimationFrame to ensure canvas has been fully resized
    // This gives the browser time to complete layout/paint after framebuffer changes
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Force a reflow to ensure we get fresh dimensions
        void canvas.offsetHeight;
        
        // Get the visual dimensions of the canvas as displayed in the browser
        // This accounts for CSS scaling and gives us the actual visible size
        const canvasRect = canvas.getBoundingClientRect();
        const canvasWidth = canvasRect.width;
        const canvasHeight = canvasRect.height;
        
        if (!canvasWidth || !canvasHeight) {
          showToast('Canvas dimensions not available', 'error');
          return;
        }
        
        // Calculate scale factor to fit overlay within actual displayed canvas
        const scaleX = canvasWidth / overlayImg.naturalWidth;
        const scaleY = canvasHeight / overlayImg.naturalHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Don't upscale beyond 100%
        
        // Update the overlayScale parameter (convert to percentage, ensure minimum 1%)
        ZM.params.overlayScale = Math.max(1, Math.round(scale * 100));
        
        // Reset position to center
        ZM.params.overlayX = 50;
        ZM.params.overlayY = 50;
        
        // Update scale slider and display
        if (scaleSlider) {
          scaleSlider.value = ZM.params.overlayScale;
        }
        const scaleDisplay = document.getElementById('overlay-scale-val');
        if (scaleDisplay) {
          scaleDisplay.textContent = ZM.params.overlayScale;
        }
        
        // Update X position slider and display
        if (xSlider) {
          xSlider.value = ZM.params.overlayX;
        }
        const xDisplay = document.getElementById('overlay-x-val');
        if (xDisplay) {
          xDisplay.textContent = ZM.params.overlayX;
        }
        
        // Update Y position slider and display
        if (ySlider) {
          ySlider.value = ZM.params.overlayY;
        }
        const yDisplay = document.getElementById('overlay-y-val');
        if (yDisplay) {
          yDisplay.textContent = ZM.params.overlayY;
        }
        
        // Apply the new scale and position
        updateOverlay();
        ZM.saveToLocalStorage();
        showToast(`Auto-fit: ${ZM.params.overlayScale}%`, 'success');
      });
    });
  }
  
  // Auto-fit button
  if (autoFitBtn) {
    autoFitBtn.addEventListener('click', calculateAutoFitScale);
  }
  
  // Preset selector
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      const value = e.target.value;
      
      if (value === 'none') {
        // Hide overlay but keep custom image data in memory
        ZM.params.overlayVisible = false;
        ZM.params.overlayPresetFile = null; // Clear current preset selection
        if (loadInput) loadInput.value = '';
        rebuildOverlayDropdown(ZM);
        updateOverlay();
        ZM.saveToLocalStorage();
        showToast('Overlay hidden', 'info');
      } else if (value === 'upload') {
        // Trigger file upload
        if (loadInput) {
          loadInput.click();
        }
        // Keep previous selection until file is chosen
        updateOverlayDropdownSelection(ZM);
      } else if (value === 'custom') {
        // Load custom image from storage
        if (ZM.params.overlayCustomImageSrc && ZM.params.overlayCustomFilename) {
          ZM.params.overlayImageSrc = ZM.params.overlayCustomImageSrc;
          ZM.params.overlayPresetFile = null;
          ZM.params.overlayVisible = true;
          updateOverlay();
          ZM.saveToLocalStorage();
          showToast(`Showing: ${ZM.params.overlayCustomFilename}`, 'success');
        }
      } else if (value && ZM.overlayPresets) {
        // Load preset overlay
        const index = parseInt(value);
        const overlay = ZM.overlayPresets[index];
        
        if (overlay && overlay.data && overlay.data.base64) {
          ZM.params.overlayImageSrc = overlay.data.base64;
          ZM.params.overlayPresetFile = overlay.file;
          ZM.params.overlayVisible = true;
          // Don't clear custom image data - keep it available in dropdown
          rebuildOverlayDropdown(ZM);
          updateOverlay();
          ZM.saveToLocalStorage();
          showToast(`Loaded: ${overlay.name}`, 'success');
        }
      }
    });
  }
  
  // File input handler (for custom images)
  if (loadInput) {
    loadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) {
        // User cancelled - restore previous selection
        updateOverlayDropdownSelection(ZM);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        ZM.params.overlayImageSrc = base64Data;
        ZM.params.overlayCustomImageSrc = base64Data; // Store separately for persistence
        ZM.params.overlayPresetFile = null; // Clear preset file
        ZM.params.overlayCustomFilename = file.name; // Store filename
        ZM.params.overlayVisible = true;
        rebuildOverlayDropdown(ZM); // Rebuild to show new/updated custom image
        updateOverlay();
        
        // Wait for the overlay image element to load the new image before auto-fitting
        const overlayImg = ZM.params.stereoscopicMode ? overlayImgLeft : overlayImgMono;
        if (overlayImg) {
          // Set up a one-time load handler
          const handleImageLoad = () => {
            // Auto-fit the overlay to canvas (includes centering)
            calculateAutoFitScale();
            overlayImg.removeEventListener('load', handleImageLoad);
          };
          
          // Check if image is already loaded (cached)
          if (overlayImg.complete && overlayImg.naturalWidth > 0) {
            handleImageLoad();
          } else {
            overlayImg.addEventListener('load', handleImageLoad);
          }
        }
        
        showToast(`Loaded: ${file.name}`, 'success');
      };
      reader.readAsDataURL(file);
    });
  }
  
  // Update when any parameter changes
  if (scaleSlider) {
    scaleSlider.addEventListener('input', updateOverlay);
  }
  if (opacitySlider) {
    opacitySlider.addEventListener('input', updateOverlay);
  }
  if (xSlider) {
    xSlider.addEventListener('input', updateOverlay);
  }
  if (ySlider) {
    ySlider.addEventListener('input', updateOverlay);
  }
  
  // Initial state
  updateOverlay();
  
  // Store update function for external calls
  ZM.updateOverlay = updateOverlay;
}

/**
 * Setup text message overlay controls
 */
function setupTextOverlayControls(ZM) {
  const messageInput = document.getElementById('text-overlay-message');
  const toggleBtn = document.getElementById('text-overlay-toggle');
  const sizeSlider = document.getElementById('text-overlay-size');
  const sizeDisplay = document.getElementById('text-overlay-size-val');
  const fadeSlider = document.getElementById('text-overlay-fade');
  const fadeDisplay = document.getElementById('text-overlay-fade-val');
  const fadeDurationSlider = document.getElementById('text-fade-duration');
  const fadeDurationDisplay = document.getElementById('text-fade-duration-val');
  const positionButtons = document.querySelectorAll('.text-position-btn');
  const colorPicker = document.getElementById('text-overlay-color');
  const alignButtons = document.querySelectorAll('.text-align-btn');
  const weightButtons = document.querySelectorAll('.text-weight-btn');
  const displayElement = document.getElementById('text-overlay-display');
  
  // Update display function
  function updateTextOverlay() {
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
  }
  
  // Message input handler
  if (messageInput) {
    messageInput.addEventListener('input', (e) => {
      ZM.params.textOverlayMessage = e.target.value;
      
      // Enable/disable button based on message content
      if (toggleBtn) {
        toggleBtn.disabled = !e.target.value.trim();
      }
      
      // Update display if visible
      if (ZM.params.textOverlayVisible) {
        updateTextOverlay();
      }
      
      // Broadcast change
      if (ZM.windowSync) {
        ZM.windowSync.broadcastParamChanges({
          textOverlayMessage: ZM.params.textOverlayMessage
        });
      }
      
      ZM.saveToLocalStorage();
    });
    
    // Set initial message input value
    messageInput.value = ZM.params.textOverlayMessage;
  }
  
  // Toggle button handler
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const wasVisible = ZM.params.textOverlayVisible;
      ZM.params.textOverlayVisible = !wasVisible;
      
      // Apply transition duration BEFORE visibility change
      if (displayElement) {
        const duration = ZM.params.textOverlayFadeDuration || 0.5;
        displayElement.style.transition = `all ${duration}s ease`;
      }
      
      // Update button appearance
      if (ZM.params.textOverlayVisible) {
        toggleBtn.textContent = 'Hide from Monitors';
        toggleBtn.classList.add('hide');
        showToast('Text sent to monitors', 'success');
      } else {
        toggleBtn.textContent = 'Send to Monitors';
        toggleBtn.classList.remove('hide');
        showToast('Text hidden from monitors', 'info');
      }
      
      updateTextOverlay();
      
      // Broadcast change
      if (ZM.windowSync) {
        ZM.windowSync.broadcastParamChanges({
          textOverlayVisible: ZM.params.textOverlayVisible
        });
      }
      
      ZM.saveToLocalStorage();
    });
    
    // Initial button state
    toggleBtn.disabled = !ZM.params.textOverlayMessage.trim();
    if (ZM.params.textOverlayVisible) {
      toggleBtn.textContent = 'Hide from Monitors';
      toggleBtn.classList.add('hide');
    }
  }
  
  // Size slider handler
  if (sizeSlider) {
    sizeSlider.addEventListener('input', (e) => {
      ZM.params.textOverlaySize = parseInt(e.target.value);
      
      if (sizeDisplay) {
        sizeDisplay.textContent = ZM.params.textOverlaySize;
      }
      
      updateTextOverlay();
      
      // Broadcast change
      if (ZM.windowSync) {
        ZM.windowSync.broadcastParamChanges({
          textOverlaySize: ZM.params.textOverlaySize
        });
      }
      
      ZM.saveToLocalStorage();
    });
    
    // Set initial size slider value
    sizeSlider.value = ZM.params.textOverlaySize;
    if (sizeDisplay) {
      sizeDisplay.textContent = ZM.params.textOverlaySize;
    }
  }
  
  // Opacity slider handler
  if (fadeSlider) {
    fadeSlider.addEventListener('input', (e) => {
      ZM.params.textOverlayFade = parseInt(e.target.value);
      
      if (fadeDisplay) {
        fadeDisplay.textContent = ZM.params.textOverlayFade;
      }
      
      updateTextOverlay();
      
      // Broadcast change
      if (ZM.windowSync) {
        ZM.windowSync.broadcastParamChanges({
          textOverlayFade: ZM.params.textOverlayFade
        });
      }
      
      ZM.saveToLocalStorage();
    });
    
    // Set initial opacity slider value
    fadeSlider.value = ZM.params.textOverlayFade;
    if (fadeDisplay) {
      fadeDisplay.textContent = ZM.params.textOverlayFade;
    }
  }
  
  // Position button handlers
  positionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const position = btn.dataset.position;
      ZM.params.textOverlayPosition = position;
      
      // Update button states
      positionButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      updateTextOverlay();
      
      // Broadcast change
      if (ZM.windowSync) {
        ZM.windowSync.broadcastParamChanges({
          textOverlayPosition: ZM.params.textOverlayPosition
        });
      }
      
      ZM.saveToLocalStorage();
    });
  });
  
  // Set initial position button state
  positionButtons.forEach(btn => {
    if (btn.dataset.position === ZM.params.textOverlayPosition) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Color picker handler
  if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
      ZM.params.textOverlayColor = e.target.value;
      
      updateTextOverlay();
      
      // Broadcast change
      if (ZM.windowSync) {
        ZM.windowSync.broadcastParamChanges({
          textOverlayColor: ZM.params.textOverlayColor
        });
      }
      
      ZM.saveToLocalStorage();
    });
    
    // Set initial color picker value
    colorPicker.value = ZM.params.textOverlayColor;
  }
  
  // Alignment button handlers
  alignButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const align = btn.dataset.align;
      ZM.params.textOverlayAlign = align;
      
      // Update button states
      alignButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      updateTextOverlay();
      
      // Broadcast change
      if (ZM.windowSync) {
        ZM.windowSync.broadcastParamChanges({
          textOverlayAlign: ZM.params.textOverlayAlign
        });
      }
      
      ZM.saveToLocalStorage();
    });
  });
  
  // Set initial alignment button state
  alignButtons.forEach(btn => {
    if (btn.dataset.align === ZM.params.textOverlayAlign) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Weight button handlers
  weightButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const weight = btn.dataset.weight;
      ZM.params.textOverlayWeight = weight;
      
      // Update button states
      weightButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      updateTextOverlay();
      
      // Broadcast change
      if (ZM.windowSync) {
        ZM.windowSync.broadcastParamChanges({
          textOverlayWeight: ZM.params.textOverlayWeight
        });
      }
      
      ZM.saveToLocalStorage();
    });
  });
  
  // Set initial weight button state
  weightButtons.forEach(btn => {
    if (btn.dataset.weight === ZM.params.textOverlayWeight) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Fade duration slider handler
  if (fadeDurationSlider) {
    fadeDurationSlider.addEventListener('input', (e) => {
      ZM.params.textOverlayFadeDuration = parseFloat(e.target.value);
      
      if (fadeDurationDisplay) {
        fadeDurationDisplay.textContent = ZM.params.textOverlayFadeDuration.toFixed(1);
      }
      
      // Broadcast change
      if (ZM.windowSync) {
        ZM.windowSync.broadcastParamChanges({
          textOverlayFadeDuration: ZM.params.textOverlayFadeDuration
        });
      }
      
      ZM.saveToLocalStorage();
    });
  }
  
  // Set initial fade duration slider value from saved params
  if (fadeDurationSlider && fadeDurationDisplay) {
    fadeDurationSlider.value = ZM.params.textOverlayFadeDuration;
    fadeDurationDisplay.textContent = ZM.params.textOverlayFadeDuration.toFixed(1);
  }
  
  // Set initial transition duration based on current visibility state
  if (displayElement) {
    const initialDuration = ZM.params.textOverlayFadeDuration || 0.5;
    displayElement.style.transition = `all ${initialDuration}s ease`;
  }
  
  // Initial render
  updateTextOverlay();
  
  // Store update function for external calls
  ZM.updateTextOverlay = updateTextOverlay;
}

/**
 * Setup export buttons
 */
function setupExportButtons(ZM) {
  const pngBtn = document.getElementById('export-png');
  const svgBtn = document.getElementById('export-svg');
  const videoBtn = document.getElementById('export-video');
  
  if (pngBtn) {
    pngBtn.addEventListener('click', () => ZM.exportPNG());
    setupHoverEffect(pngBtn, '#26527a', '#1a3a5f');
  }
  
  if (svgBtn) {
    svgBtn.addEventListener('click', () => ZM.exportSVG());
    setupHoverEffect(svgBtn, '#267526', '#1a5f1a');
  }
  
  if (videoBtn) {
    videoBtn.addEventListener('click', () => {
      if (ZM.isVideoRecording()) {
        ZM.stopVideoRecording();
        if (ZM.showToast) ZM.showToast('Video Recording — OFF');
      } else {
        ZM.startVideoRecording();
        if (ZM.showToast) ZM.showToast('Video Recording — ON');
      }
    });
    
    videoBtn.addEventListener('mouseenter', () => {
      if (!ZM.isVideoRecording()) {
        videoBtn.style.background = '#752626';
        videoBtn.style.transform = 'scale(1.02)';
      }
    });
    videoBtn.addEventListener('mouseleave', () => {
      if (!ZM.isVideoRecording()) {
        videoBtn.style.background = '#5f1a1a';
        videoBtn.style.transform = 'scale(1)';
      }
    });
  }
}

/**
 * Setup hover effect for button
 */
function setupHoverEffect(element, hoverBg, normalBg) {
  element.addEventListener('mouseenter', () => {
    element.style.background = hoverBg;
    element.style.transform = 'scale(1.02)';
  });
  element.addEventListener('mouseleave', () => {
    element.style.background = normalBg;
    element.style.transform = 'scale(1)';
  });
}

/**
 * Update project name display
 */
/**
 * Update project name display
 */
function updateProjectNameDisplay(fileName) {
  const displayContainer = document.getElementById('project-name-display');
  const displayText = document.getElementById('project-name-text');
  
  if (displayContainer && displayText) {
    if (fileName) {
      const cleanName = fileName.replace(/\.(json|JSON)$/, '');
      displayText.textContent = cleanName;
      displayContainer.style.display = 'block';
    } else {
      displayContainer.style.display = 'none';
    }
  }
}

/**
 * Setup collapsible sections
 */
function setupCollapsibleSections() {
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const open = content.classList.toggle('expanded');
      header.classList.toggle('active', open);
    });
  });
}

/**
 * Setup language filter
 */
function setupLanguageFilter() {
  document.querySelectorAll('.lang-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedLang = btn.dataset.langFilter;
      
      // Update active state
      document.querySelectorAll('.lang-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show/hide documentation buttons
      document.querySelectorAll('.about-btn[data-lang]').forEach(docBtn => {
        if (docBtn.dataset.lang === selectedLang) {
          docBtn.classList.remove('hidden');
        } else {
          docBtn.classList.add('hidden');
        }
      });
    });
  });
}

/**
 * Setup documentation buttons
 */
function setupDocumentationButtons() {
  const docButtons = {
    'doc-readme': '../README.md',
    'doc-manual-en': 'User-Manual.md',
    'doc-manual-fr': 'User-Manual-fr.md',
    'doc-tech-en': 'Documentation.md',
    'doc-tech-fr': 'Documentation-fr.md',
    'doc-projection-en': 'Projection-Matrix-Guide.md',
    'doc-projection-fr': 'Projection-Matrix-Guide-fr.md',
    'doc-transitions-en': 'Transition-System-Architecture.md',
    'doc-transitions-fr': 'Transition-System-Architecture-fr.md',
    'doc-spaceflow': 'SPACEFLOW-ARCHITECTURE.md',
    'doc-migration': 'MIGRATION-STRATEGY.md',
    'doc-patch-system-en': 'PATCH-SYSTEM.md',
    'doc-patch-system-fr': 'PATCH-SYSTEM-fr.md',
    'doc-player': 'Player-README.md',
    'doc-preset-format': 'Preset-JSON-Format.md',
    'doc-update-presets': 'Update-Presets.md'
  };
  
  for (const [id, doc] of Object.entries(docButtons)) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        window.open(`docs/markdown-viewer.html?doc=${doc}`, '_blank');
      });
    }
  }
}

/**
 * Sync UI from params (for when params are loaded from file)
 */
function syncUIFromParams(ZM) {
  // Update all wired sliders to reflect loaded params
  const sliderMappings = [
    { id: 'thickness', valId: 'thickness-val', param: 'lineThickness', decimals: 1 },
    { id: 'emit-rate', valId: 'emit-rate-val', param: 'emitRate', decimals: 1 },
    { id: 'speed', valId: 'speed-val', param: 'speed', decimals: 0 },
    { id: 'emitter-rotation', valId: 'emitter-rotation-val', param: 'emitterRotation', decimals: 0 },
    { id: 'geometry-scale', valId: 'geometry-scale-val', param: 'geometryScale', decimals: 0 },
    { id: 'fade-duration', valId: 'fade-duration-val', param: 'fadeDuration', decimals: 0 },
    { id: 'color-slot-z-offset', valId: 'color-slot-z-offset-val', param: 'colorSlotZOffset', decimals: 0 },
    { id: 'ambient-speed-master', valId: 'ambient-speed-master-val', param: 'ambientSpeedMaster', decimals: 0 },
    { id: 'video-duration', valId: 'video-duration-val', param: 'videoDuration', decimals: 0 },
    { id: 'video-fps', valId: 'video-fps-val', param: 'videoFPS', decimals: 0 },
    { id: 'eye-separation', valId: 'eye-separation-val', param: 'eyeSeparation', decimals: 0 },
    { id: 'state-transition-duration', valId: 'state-transition-duration-val', param: 'stateTransitionDuration', decimals: 1 },
    { id: 'color-transition-duration', valId: 'color-transition-duration-val', param: 'colorTransitionDuration', decimals: 1 },
    { id: 'color-random-seed', valId: 'color-random-seed-val', param: 'colorRandomSeed', decimals: 0 },
    { id: 'auto-trigger-frequency', valId: 'auto-trigger-frequency-val', param: 'autoTriggerFrequency', decimals: 0 },
    { id: 'overlay-scale', valId: 'overlay-scale-val', param: 'overlayScale', decimals: 0 },
    { id: 'overlay-opacity', valId: 'overlay-opacity-val', param: 'overlayOpacity', decimals: 0 },
    { id: 'overlay-x', valId: 'overlay-x-val', param: 'overlayX', decimals: 0 },
    { id: 'overlay-y', valId: 'overlay-y-val', param: 'overlayY', decimals: 0 }
  ];
  
  sliderMappings.forEach(({ id, valId, param, decimals }) => {
    const slider = document.getElementById(id);
    const display = document.getElementById(valId);
    if (slider && ZM.params[param] !== undefined) {
      slider.value = ZM.params[param];
      if (display) {
        display.textContent = decimals > 0 ? 
          ZM.params[param].toFixed(decimals) : 
          ZM.params[param];
      }
    }
  });
  
  // Reinitialize color RNG if seed changed (for state loading)
  if (ZM.params.colorRandomSeed !== undefined) {
    initColorRNG(ZM.params.colorRandomSeed);
  }
  
  // Update checkboxes
  const checkboxMap = {
    'random-thickness': 'randomThickness',
    'random-speed': 'randomSpeed',
    'depth-invert': 'depthInvert',
    'stereoscopic-mode': 'stereoscopicMode',
    'framebuffer-mode': 'framebufferMode',
    'auto-trigger-states': 'autoTriggerStates'
  };
  
  Object.entries(checkboxMap).forEach(([checkboxId, paramKey]) => {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox && ZM.params[paramKey] !== undefined) {
      checkbox.checked = ZM.params[paramKey];
    }
  });
  
  // Update palette UI
  updatePaletteUI(ZM);

  // Update canvas border visibility
  const borderVisibleCheckbox = document.getElementById('canvas-border-visible');
  const borderVisible = ZM.params.canvasBorderVisible === true;
  
  if (borderVisibleCheckbox) borderVisibleCheckbox.checked = borderVisible;
  applyCanvasBorder(borderVisible);
  
  // Update overlay preset dropdown
  if (ZM.overlayPresets) {
    ZM.rebuildOverlayDropdown();
  }
  
  // Update overlay image
  if (ZM.updateOverlay) {
    ZM.updateOverlay();
  }
  
  // Update active palette button
  document.querySelectorAll('.palette-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.palette) === ZM.params.activePaletteIndex);
  });
  
  // Update background transition state if needed
  if (ZM.bgTransition) {
    const newBg = getBackgroundColor(ZM.params);
    ZM.bgTransition.current = newBg;
    ZM.bgTransition.start = newBg;
    ZM.bgTransition.target = newBg;
    ZM.bgTransition.progress = 1.0;
    ZM.bgTransition.isTransitioning = false;
  }
  
  // Sync camera from params ONLY if not transitioning
  // (If transitioning, the transition handles camera movement)
  if (!ZM.camera.transition.isActive) {
    ZM.camera.syncFromParams(ZM.params);
  }
  
  // Reinitialize sketches if needed
  if (ZM.initializeSketches) {
    ZM.initializeSketches();
  }
}

/**
 * Setup state panel UI
 */
function setupStatePanel(ZM) {
  const stateContainer = document.getElementById('state-list-container');
  if (!stateContainer) {
    
    return;
  }
  
  // Initial render
  updateStatePanel(ZM);
  
  // Setup drag-and-drop reordering (only once on initialization)
  setupDragAndDrop(ZM, stateContainer);
  
  // New state button - direct save with auto-generated name
  const newStateBtn = document.getElementById('new-state-btn');
  if (newStateBtn) {
    newStateBtn.addEventListener('click', () => {
      const name = `State ${ZM.stateManager.states.length + 1}`;
      ZM.stateManager.save(name);
      // Show toast notification
      showToast('State created! Double-click to rename.');
    });
  }
  
  // Export all button
  const exportAllBtn = document.getElementById('export-all-states-btn');
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', () => {
      exportAllStatesAsFiles(ZM);
    });
  }
  
  // Import state button
  const importStateBtn = document.getElementById('import-state-btn');
  if (importStateBtn) {
    importStateBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              ZM.stateManager.importState(data);
              showToast('✓ State(s) imported successfully!', 'success');
            } catch (err) {
              showToast('Failed to import state. Invalid file format.');
              
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    });
  }
}

/**
 * Update state panel UI
 */
function updateStatePanel(ZM) {
  const stateContainer = document.getElementById('state-list-container');
  if (!stateContainer) return;
  
  const states = ZM.stateManager.getAllStates();
  const activeId = ZM.stateManager.activeStateId;
  
  if (states.length === 0) {
    stateContainer.innerHTML = '<div class="state-empty-state">No states yet. Create one!</div>';
    return;
  }
  
  stateContainer.innerHTML = states.map((state, index) => {
    const isActive = state.id === activeId;
    const date = new Date(state.timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const timeStr = `${day}.${month}.${year} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}`;
    
    return `
      <div class="state-item ${isActive ? 'active' : ''}" data-state-id="${state.id}" data-index="${index}" draggable="true">
        <div class="state-drag-handle" title="Drag to reorder">⋮⋮</div>
        <div class="state-info">
          <div class="state-name">${escapeHtml(state.name)}</div>
          <div class="state-timestamp">${timeStr}</div>
        </div>
        <div class="state-actions">
          <button class="state-action-btn update" data-action="update" title="Update">
            <span class="icon-update"></span>
          </button>
          <button class="state-action-btn duplicate" data-action="duplicate" title="Duplicate">
            <span class="icon-duplicate"></span>
          </button>
          <button class="state-action-btn rename" data-action="rename" title="Rename">
            <span class="icon-rename"></span>
          </button>
          <button class="state-action-btn delete" data-action="delete" title="Delete">
            <span class="icon-delete"></span>
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Wire up state item clicks
  stateContainer.querySelectorAll('.state-item').forEach(item => {
    const stateId = item.dataset.stateId;
    
    // Click on item to load (including clicking on the state name)
    item.addEventListener('click', (e) => {
      // Ignore if clicking on action buttons, drag handle, or in edit mode
      if (e.target.closest('.state-action-btn')) return;
      if (e.target.closest('.state-drag-handle')) return;
      if (e.target.closest('.state-name.editing')) return;
      
      // If clicking directly on state name, delay to allow double-click to work
      if (e.target.closest('.state-name')) {
        const nameElement = e.target.closest('.state-name');
        // Clear any existing timer
        if (nameElement._clickTimer) {
          clearTimeout(nameElement._clickTimer);
          nameElement._clickTimer = null;
          return; // This is the second click of a double-click
        }
        // Set a timer for single-click action
        nameElement._clickTimer = setTimeout(() => {
          nameElement._clickTimer = null;
          ZM.stateManager.load(stateId);
        }, 250); // 250ms delay to detect double-click
      } else {
        // Clicking elsewhere on the item loads immediately
        ZM.stateManager.load(stateId);
      }
    });
    
    // Inline editing for state name - double-click to rename
    const nameElement = item.querySelector('.state-name');
    nameElement.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      enableInlineEdit(ZM, stateId, nameElement);
    });
    
    // Action buttons
    item.querySelectorAll('.state-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        
        if (action === 'update') {
          // Direct update with toast notification
          ZM.stateManager.update(stateId);
          showToast('✓ State Updated', 'success');
        } else if (action === 'duplicate') {
          ZM.stateManager.duplicate(stateId);
          showToast('State duplicated!');
        } else if (action === 'rename') {
          // Trigger inline editing
          const nameElement = item.querySelector('.state-name');
          enableInlineEdit(ZM, stateId, nameElement);
        } else if (action === 'delete') {
          // Show confirmation bar
          showDeleteConfirmation(ZM, stateId, item);
        }
      });
    });
  });
}

/**
 * Setup drag-and-drop reordering for state items
 */
function setupDragAndDrop(ZM, container) {
  let draggedElement = null;
  let draggedIndex = null;
  let dropTargetIndex = null;
  let didReorder = false;
  
  container.addEventListener('dragstart', (e) => {
    const stateItem = e.target.closest('.state-item');
    if (!stateItem) return;
    
    // Don't allow drag if in edit mode or clicking on action buttons
    if (stateItem.querySelector('.state-name.editing')) {
      e.preventDefault();
      return;
    }
    if (e.target.closest('.state-action-btn')) {
      e.preventDefault();
      return;
    }
    
    draggedElement = stateItem;
    draggedIndex = parseInt(stateItem.dataset.index);
    dropTargetIndex = null;
    didReorder = false;
    
    stateItem.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', stateItem.innerHTML);
    
    // Set drag image with some transparency
    if (e.dataTransfer.setDragImage) {
      e.dataTransfer.setDragImage(stateItem, 20, 20);
    }
  });
  
  container.addEventListener('dragend', (e) => {
    const stateItem = e.target.closest('.state-item');
    if (stateItem) {
      stateItem.classList.remove('dragging');
    }
    
    // Remove all drag-over classes
    container.querySelectorAll('.state-item').forEach(item => {
      item.classList.remove('drag-over');
    });
    
    // Update UI and show feedback only once after drag completes
    if (didReorder) {
      // Refresh the UI to show new order
      if (ZM.updateStatePanel) {
        ZM.updateStatePanel();
      }
      
      // Show single confirmation toast
      if (ZM.showToast) {
        ZM.showToast('✓ States reordered', 'success');
      }
    }
    
    // Reset state
    draggedElement = null;
    draggedIndex = null;
    dropTargetIndex = null;
    didReorder = false;
  });
  
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const stateItem = e.target.closest('.state-item');
    if (!stateItem || !draggedElement || stateItem === draggedElement) {
      return;
    }
    
    e.dataTransfer.dropEffect = 'move';
    
    // Visual feedback: add drag-over class
    container.querySelectorAll('.state-item').forEach(item => {
      item.classList.remove('drag-over');
    });
    stateItem.classList.add('drag-over');
  });
  
  container.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const targetItem = e.target.closest('.state-item');
    if (!targetItem || !draggedElement || targetItem === draggedElement) {
      return;
    }
    
    dropTargetIndex = parseInt(targetItem.dataset.index);
    
    // Perform reorder silently (no UI updates or toasts during drag)
    const reordered = ZM.stateManager.reorder(draggedIndex, dropTargetIndex, true);
    if (reordered) {
      didReorder = true;
      // Update draggedIndex to new position for subsequent drops in same drag
      draggedIndex = dropTargetIndex;
    }
    
    // Clean up visual feedback
    targetItem.classList.remove('drag-over');
  });
  
  // Prevent default drag behavior on drag handle to allow easy dragging
  container.querySelectorAll('.state-drag-handle').forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      // Don't prevent default - allow drag to start
    });
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Enable inline editing for state name
 */
function enableInlineEdit(ZM, stateId, nameElement) {
  if (nameElement.classList.contains('editing')) return;
  
  const originalName = nameElement.textContent;
  nameElement.classList.add('editing');
  nameElement.contentEditable = true;
  nameElement.focus();
  
  // Select all text
  const range = document.createRange();
  range.selectNodeContents(nameElement);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  
  const saveEdit = () => {
    const newName = nameElement.textContent.trim();
    nameElement.classList.remove('editing');
    nameElement.contentEditable = false;
    
    if (newName && newName !== originalName) {
      ZM.stateManager.rename(stateId, newName);
      showToast('✓ State Renamed', 'success');
    } else {
      nameElement.textContent = originalName;
    }
  };
  
  const cancelEdit = () => {
    nameElement.classList.remove('editing');
    nameElement.contentEditable = false;
    nameElement.textContent = originalName;
  };
  
  // Save on Enter, cancel on Escape
  nameElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation(); // Prevent global keyboard shortcuts from triggering
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancelEdit();
    }
  });
  
  // Save on blur
  nameElement.addEventListener('blur', saveEdit, { once: true });
}

/**
 * Show delete confirmation bar
 */
function showDeleteConfirmation(ZM, stateId, stateItem) {
  // Remove any existing confirmation bars
  document.querySelectorAll('.state-confirm-bar').forEach(bar => bar.remove());
  
  const state = ZM.stateManager.getStateById(stateId);
  const confirmBar = document.createElement('div');
  confirmBar.className = 'state-confirm-bar';
  confirmBar.innerHTML = `
    <div class="state-confirm-message">
      Delete "${escapeHtml(state.name)}"?
    </div>
    <div class="state-confirm-actions">
      <button class="state-confirm-btn confirm">Delete</button>
      <button class="state-confirm-btn cancel">Cancel</button>
    </div>
  `;
  
  // Insert after state item
  stateItem.insertAdjacentElement('afterend', confirmBar);
  
  // Wire up buttons
  confirmBar.querySelector('.confirm').addEventListener('click', () => {
    ZM.stateManager.delete(stateId);
    confirmBar.remove();
    showToast('State deleted');
  });
  
  confirmBar.querySelector('.cancel').addEventListener('click', () => {
    confirmBar.remove();
  });
  
  // Auto-hide on click outside
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!confirmBar.contains(e.target) && !stateItem.contains(e.target)) {
        confirmBar.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 100);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Auto-remove after 2.5 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

