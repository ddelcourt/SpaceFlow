/**
 * UIController — Binds UI controls to parameters
 */

import { triggerPaletteChange, getBackgroundColor } from '../core/colorUtils.js';
import { OVERLAY_FILES, OVERLAY_FOLDER } from '../../config/overlayPresets.js';

// Debounce timer for auto-updating active state
let stateAutoUpdateTimer = null;

/**
 * Cancel any pending state auto-update
 */
function cancelStateAutoUpdate() {
  if (stateAutoUpdateTimer) {
    clearTimeout(stateAutoUpdateTimer);
    stateAutoUpdateTimer = null;
    console.log('🚫 Cancelled pending state auto-update');
  }
}

/**
 * Auto-update active state after changes (debounced)
 */
function scheduleStateAutoUpdate(ZM) {
  if (!ZM.stateManager?.activeStateId) {
    console.log('⏭️  Skipping state auto-update: no active state');
    return;
  }
  
  // Clear existing timer
  if (stateAutoUpdateTimer) {
    clearTimeout(stateAutoUpdateTimer);
  }
  
  console.log(`⏱️  Scheduled state auto-update for ${ZM.stateManager.activeStateId} in 500ms`);
  
  // Schedule update after 500ms of no changes
  stateAutoUpdateTimer = setTimeout(() => {
    console.log(`🔄 Auto-updating active state ${ZM.stateManager.activeStateId}`);
    ZM.stateManager.update(ZM.stateManager.activeStateId);
    console.log('✓ Auto-update complete');
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
  ZM.cancelStateAutoUpdate = cancelStateAutoUpdate; // Expose to other modules
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
    
    window.ZigMap26.config = { keyboardShortcuts, uiPresets, appInfo };
  } catch (err) {
    console.error('Failed to load UI configs:', err);
  }
}

/**
 * Initialize all UI controls
 */
function initializeAllControls(ZM) {
  // Standard sliders
  wireSlider(ZM, 'thickness', 'thickness-val', 'lineThickness', 1);
  wireSlider(ZM, 'emit-rate', 'emit-rate-val', 'emitRate', 1);
  wireSlider(ZM, 'speed', 'speed-val', 'speed');
  wireSlider(ZM, 'emitter-rotation', 'emitter-rotation-val', 'emitterRotation');
  wireSlider(ZM, 'geometry-scale', 'geometry-scale-val', 'geometryScale');
  wireSlider(ZM, 'fade-duration', 'fade-duration-val', 'fadeDuration');
  wireSlider(ZM, 'color-slot-z-offset', 'color-slot-z-offset-val', 'colorSlotZOffset');
  wireSlider(ZM, 'ambient-speed-master', 'ambient-speed-master-val', 'ambientSpeedMaster');
  wireSlider(ZM, 'video-duration', 'video-duration-val', 'videoDuration');
  wireSlider(ZM, 'video-fps', 'video-fps-val', 'videoFPS');
  wireSlider(ZM, 'eye-separation', 'eye-separation-val', 'eyeSeparation');
  wireSlider(ZM, 'state-transition-duration', 'state-transition-duration-val', 'stateTransitionDuration', 1);
  wireSlider(ZM, 'color-transition-duration', 'color-transition-duration-val', 'colorTransitionDuration', 1);
  wireSlider(ZM, 'auto-trigger-frequency', 'auto-trigger-frequency-val', 'autoTriggerFrequency');
  wireSlider(ZM, 'overlay-scale', 'overlay-scale-val', 'overlayScale');
  wireSlider(ZM, 'overlay-opacity', 'overlay-opacity-val', 'overlayOpacity');
  wireSlider(ZM, 'overlay-x', 'overlay-x-val', 'overlayX');
  wireSlider(ZM, 'overlay-y', 'overlay-y-val', 'overlayY');
  
  // FOV with distance compensation
  setupFOVControl(ZM);
  
  // Near/Far clipping planes
  setupClippingPlanes(ZM);
  
  // Thickness range
  setupRangeControl(ZM, 'thickness-range', 'thicknessRange', '%');
  
  // Speed range
  setupRangeControl(ZM, 'speed-range', 'speedRange', '%');
  
  // Checkboxes
  wireCheckbox(ZM, 'random-thickness', 'randomThickness');
  wireCheckbox(ZM, 'random-speed', 'randomSpeed');
  wireCheckbox(ZM, 'depth-invert', 'depthInvert');
  wireCheckbox(ZM, 'auto-trigger-states', 'autoTriggerStates');
  wireCheckbox(ZM, 'overlay-visible', 'overlayVisible');
  
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
  
  // File save/load
  setupFileSaveLoad(ZM);
  
  // UI buttons
  setupUIButtons(ZM);
}

/**
 * Wire a simple slider to a parameter
 */
function wireSlider(ZM, sliderId, displayId, paramKey, decimals = 0) {
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(displayId);
  
  if (!slider || !display) return;
  
  slider.value = ZM.params[paramKey];
  display.textContent = decimals > 0 ? 
    ZM.params[paramKey].toFixed(decimals) : 
    ZM.params[paramKey];
  
  slider.addEventListener('input', () => {
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
    
    ZM.saveToLocalStorage();
  });
}

/**
 * Wire a checkbox to a parameter
 */
function wireCheckbox(ZM, checkboxId, paramKey) {
  const checkbox = document.getElementById(checkboxId);
  if (!checkbox) return;
  
  checkbox.checked = ZM.params[paramKey];
  checkbox.addEventListener('change', (e) => {
    ZM.params[paramKey] = e.target.checked;
    ZM.saveToLocalStorage();
    
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
  
  farSlider.addEventListener('input', () => {
    ZM.params.far = parseFloat(farSlider.value);
    farDisplay.textContent = ZM.params.far;
    ZM.saveToLocalStorage();
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
  
  maxSlider.addEventListener('input', () => {
    if (+maxSlider.value < +minSlider.value) {
      maxSlider.value = minSlider.value;
    }
    ZM.params[maxKey] = +maxSlider.value;
    maxDisplay.textContent = maxSlider.value + suffix;
    ZM.saveToLocalStorage();
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
  
  // Mode checkbox
  modeCheckbox.checked = ZM.params.framebufferMode;
  modeCheckbox.addEventListener('change', (e) => {
    ZM.params.framebufferMode = e.target.checked;
    ZM.updateCanvasSize();
    ZM.saveToLocalStorage();
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
        if (ZM.params.framebufferMode) ZM.updateCanvasSize();
      }
      ZM.saveToLocalStorage();
    });
  }
  
  // Width/height inputs
  if (widthInput) {
    widthInput.value = ZM.params.framebufferWidth;
    widthInput.addEventListener('input', (e) => {
      ZM.params.framebufferWidth = Math.max(320, parseInt(e.target.value) || 1920);
      if (ZM.params.framebufferMode) ZM.updateCanvasSize();
      ZM.params.framebufferPreset = getPresetForDimensions(
        ZM.params.framebufferWidth, 
        ZM.params.framebufferHeight
      );
      presetSelect.value = ZM.params.framebufferPreset;
      ZM.saveToLocalStorage();
    });
  }
  
  if (heightInput) {
    heightInput.value = ZM.params.framebufferHeight;
    heightInput.addEventListener('input', (e) => {
      ZM.params.framebufferHeight = Math.max(240, parseInt(e.target.value) || 1080);
      if (ZM.params.framebufferMode) ZM.updateCanvasSize();
      ZM.params.framebufferPreset = getPresetForDimensions(
        ZM.params.framebufferWidth, 
        ZM.params.framebufferHeight
      );
      presetSelect.value = ZM.params.framebufferPreset;
      ZM.saveToLocalStorage();
    });
  }
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
 * Setup color swatches
 */
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
      triggerPaletteChange(ZM);
      ZM.saveToLocalStorage();
      
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
      triggerPaletteChange(ZM);
      ZM.saveToLocalStorage();
      
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
      triggerPaletteChange(ZM);
      ZM.saveToLocalStorage();
      
      // Auto-update active state (debounced)
      scheduleStateAutoUpdate(ZM);
    });
  });
}

/**
 * Update palette UI from current params
 */
function updatePaletteUI(ZM) {
  const activePaletteIndex = ZM.params.activePaletteIndex;
  const activePalette = ZM.params.palettes[activePaletteIndex];
  
  console.log(`updatePaletteUI: Loading palette ${activePaletteIndex}`, activePalette);
  
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
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      // Get selected export format from dropdown
      const formatSelect = document.getElementById('export-format');
      const format = formatSelect ? formatSelect.value : 'project';
      console.log('[UI] Export button clicked, format:', format);
      ZM.downloadJSON(format);
    });
  }
  
  if (loadBtn && loadInput) {
    loadBtn.addEventListener('click', () => loadInput.click());
    loadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        ZM.loadJSON(file);
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
        console.warn(`Failed to load overlay: ${file}`, err);
      }
    }
    
    // Populate dropdown
    presetSelect.innerHTML = '<option value="">-- Select Preset --</option>';
    
    overlays.forEach((overlay, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = overlay.name;
      option.dataset.overlayData = JSON.stringify(overlay.data);
      presetSelect.appendChild(option);
    });
    
    // Add "Custom Image" option
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = '-- Custom Image --';
    presetSelect.appendChild(customOption);
    
    // Store overlays in ZM for later use
    ZM.overlayPresets = overlays;
    
    console.log(`✓ Loaded ${overlays.length} overlay presets`);
  } catch (err) {
    console.error('Failed to load overlay presets:', err);
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
  const loadBtn = document.getElementById('load-overlay-btn');
  const loadInput = document.getElementById('load-overlay-input');
  const clearBtn = document.getElementById('clear-overlay-btn');
  const visibleCheckbox = document.getElementById('overlay-visible');
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
      // Move mono overlay back to canvas-container
      const canvasContainer = document.getElementById('canvas-container');
      if (canvasContainer && overlayImgMono && overlayImgMono.parentElement !== canvasContainer) {
        canvasContainer.appendChild(overlayImgMono);
      }
    }
    
    if (ZM.params.overlayVisible && ZM.params.overlayImageSrc) {
      overlays.forEach(overlayImg => {
        if (!overlayImg) return;
        
        overlayImg.style.display = 'block';
        overlayImg.src = ZM.params.overlayImageSrc;
        
        // Always use transform-based scaling (GPU-accelerated)
        overlayImg.style.maxWidth = 'none';
        overlayImg.style.maxHeight = 'none';
        overlayImg.style.width = '';
        overlayImg.style.height = '';
        overlayImg.style.transform = `translate(-50%, -50%) scale(${ZM.params.overlayScale / 100})`;
        
        overlayImg.style.opacity = ZM.params.overlayOpacity / 100;
        overlayImg.style.left = `${ZM.params.overlayX}%`;
        overlayImg.style.top = `${ZM.params.overlayY}%`;
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
    
    let containerWidth, containerHeight;
    
    if (ZM.params.stereoscopicMode) {
      // In stereo mode, fit to individual eye container (half width)
      const stereoEye = document.querySelector('.stereo-eye');
      if (stereoEye) {
        containerWidth = stereoEye.clientWidth;
        containerHeight = stereoEye.clientHeight;
      } else {
        showToast('Stereo containers not found', 'error');
        return;
      }
    } else {
      // In mono mode, fit to full canvas container
      const canvasContainer = document.getElementById('canvas-container');
      if (!canvasContainer) return;
      containerWidth = canvasContainer.clientWidth;
      containerHeight = canvasContainer.clientHeight;
    }
    
    // Calculate scale factor to fit overlay within container
    const scaleX = containerWidth / overlayImg.naturalWidth;
    const scaleY = containerHeight / overlayImg.naturalHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale beyond 100%
    
    // Update the overlayScale parameter (convert to percentage)
    ZM.params.overlayScale = Math.round(scale * 100);
    
    // Update slider to reflect auto-calculated value
    if (scaleSlider) {
      scaleSlider.value = ZM.params.overlayScale;
    }
    
    // Apply the new scale
    updateOverlay();
    ZM.saveToLocalStorage();
    
    showToast(`Auto-fit: ${ZM.params.overlayScale}%`, 'success');
  }
  
  // Auto-fit button
  if (autoFitBtn) {
    autoFitBtn.addEventListener('click', calculateAutoFitScale);
  }
  
  // Preset selector
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      const value = e.target.value;
      
      if (value === 'custom') {
        // Trigger custom file input
        if (loadInput) loadInput.click();
        // Reset dropdown
        setTimeout(() => presetSelect.value = '', 100);
      } else if (value && ZM.overlayPresets) {
        // Load preset overlay
        const index = parseInt(value);
        const overlay = ZM.overlayPresets[index];
        
        if (overlay && overlay.data && overlay.data.base64) {
          ZM.params.overlayImageSrc = overlay.data.base64;
          ZM.params.overlayPresetFile = overlay.file; // Track which preset file is used
          ZM.params.overlayVisible = true;
          if (visibleCheckbox) visibleCheckbox.checked = true;
          updateOverlay();
          ZM.saveToLocalStorage();
          showToast(`Loaded: ${overlay.name}`, 'success');
        }
      }
    });
  }
  
  // Load button (for custom images)
  if (loadBtn && loadInput) {
    loadBtn.addEventListener('click', () => loadInput.click());
    
    loadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        ZM.params.overlayImageSrc = event.target.result;
        ZM.params.overlayPresetFile = null; // Clear preset file (custom upload)
        ZM.params.overlayVisible = true;
        if (visibleCheckbox) visibleCheckbox.checked = true;
        if (presetSelect) presetSelect.value = ''; // Reset preset selector
        updateOverlay();
        ZM.saveToLocalStorage();
        showToast('Custom overlay image loaded', 'success');
      };
      reader.readAsDataURL(file);
    });
  }
  
  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      ZM.params.overlayImageSrc = null;
      ZM.params.overlayPresetFile = null;
      ZM.params.overlayVisible = false;
      if (visibleCheckbox) visibleCheckbox.checked = false;
      if (loadInput) loadInput.value = '';
      if (presetSelect) presetSelect.value = '';
      updateOverlay();
      ZM.saveToLocalStorage();
      showToast('Overlay image cleared', 'info');
    });
  }
  
  // Update when any parameter changes
  if (visibleCheckbox) {
    visibleCheckbox.addEventListener('change', updateOverlay);
  }
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
 * Setup export buttons
 */
function setupExportButtons(ZM) {
  const pngBtn = document.getElementById('export-png');
  const svgBtn = document.getElementById('export-svg');
  const depthBtn = document.getElementById('export-depth-map');
  const videoBtn = document.getElementById('export-video');
  
  if (pngBtn) {
    pngBtn.addEventListener('click', () => ZM.exportPNG());
    setupHoverEffect(pngBtn, '#26527a', '#1a3a5f');
  }
  
  if (svgBtn) {
    svgBtn.addEventListener('click', () => ZM.exportSVG());
    setupHoverEffect(svgBtn, '#267526', '#1a5f1a');
  }
  
  if (depthBtn) {
    depthBtn.addEventListener('click', () => ZM.exportDepthMap());
  }
  
  if (videoBtn) {
    videoBtn.addEventListener('click', () => {
      if (ZM.isVideoRecording()) {
        ZM.stopVideoRecording();
      } else {
        ZM.startVideoRecording();
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
    'doc-manual-en': 'User-Manual.md',
    'doc-manual-fr': 'User-Manual-fr.md',
    'doc-readme-en': '../README.md',
    'doc-readme-fr': 'README-fr.md',
    'doc-tech-en': 'Documentation.md',
    'doc-tech-fr': 'Documentation-fr.md',
    'doc-projection-en': 'Projection-Matrix-Guide.md',
    'doc-projection-fr': 'Projection-Matrix-Guide-fr.md'
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
  
  // Update palette UI
  updatePaletteUI(ZM);
  
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
  
  // Sync camera from params
  ZM.camera.syncFromParams(ZM.params);
  
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
    console.warn('State container not found');
    return;
  }
  
  // Initial render
  updateStatePanel(ZM);
  
  // New state button - direct save with auto-generated name
  const newStateBtn = document.getElementById('new-state-btn');
  if (newStateBtn) {
    newStateBtn.addEventListener('click', () => {
      const name = `State ${ZM.stateManager.states.length + 1}`;
      ZM.stateManager.save(name);
      // Show toast notification
      showToast('State created! Click to rename.');
    });
  }
  
  // Export all button
  const exportAllBtn = document.getElementById('export-all-states-btn');
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', () => {
      ZM.stateManager.exportAll();
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
              console.error(err);
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
  
  stateContainer.innerHTML = states.map(state => {
    const isActive = state.id === activeId;
    const date = new Date(state.timestamp);
    const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    return `
      <div class="state-item ${isActive ? 'active' : ''}" data-state-id="${state.id}">
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
    
    // Click on item to load
    item.addEventListener('click', (e) => {
      // Ignore if clicking on action buttons or in edit mode
      if (e.target.closest('.state-action-btn')) return;
      if (e.target.closest('.state-name.editing')) return;
      ZM.stateManager.load(stateId);
    });
    
    // Inline editing for state name
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

