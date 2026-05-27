// ═══════════════════════════════════════════════════════════════════════════
// SPACEFLOW - Local Storage Module
// Save and load application settings
// ═══════════════════════════════════════════════════════════════════════════

import { STORAGE_KEY } from '../config/constants.js';
import { DEFAULT_PARAMS } from '../config/defaults.js';
import { OVERLAY_FILES } from '../../config/overlayPresets.js';

/**
 * Format JSON with compact color palette entries
 * Each color object written on a single line like defaults.js
 */
function formatJSONWithCompactPalettes(data) {
  // First, stringify with standard formatting
  let json = JSON.stringify(data, null, 2);
  
  // Regex pattern to match color palette entries and compact them
  // Matches: { "rgb": [r, g, b], "role": "..." } spread across multiple lines
  const colorPattern = /\{\s+"rgb":\s+\[\s+(\d+),\s+(\d+),\s+(\d+)\s+\],\s+"role":\s+"(\w+)"\s+\}/g;
  
  // Replace with compact single-line format
  json = json.replace(colorPattern, '{ "rgb": [$1, $2, $3], "role": "$4" }');
  
  return json;
}

/**
 * Clear all localStorage data
 */
export function clearLocalStorage() {
  try {
    localStorage.clear();
    console.log('✓ localStorage cleared');
  } catch (e) {
    console.warn('localStorage clear failed:', e);
  }
}

/**
 * Save parameters to localStorage
 * @param {Object} params - Parameters object to save
 * @param {string} projectName - Optional project name to save
 */
export function saveToLocalStorage(params, projectName = null) {
  try {
    // Create a copy and remove canvas border settings (these should come from preset files only)
    const paramsToSave = { ...params };
    delete paramsToSave.canvasBorderVisible;
    delete paramsToSave.canvasBorderColor;
    
    // Store params and project name together
    const dataToSave = {
      params: paramsToSave,
      projectName: projectName || null
    };
    
    console.log('[localStorage] Saving data:', { projectName, activePaletteIndex: paramsToSave.activePaletteIndex });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

/**
 * Load parameters from localStorage
 * @param {Object} defaultParams - Default parameters to merge with
 * @returns {Object|null} Object with params and projectName, or null if failed
 */
export function loadFromLocalStorage(defaultParams) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    console.log('[localStorage] Raw loaded data:', data);
    
    // Handle old format (params only) vs new format (object with params and projectName)
    const loaded = data.params ? data.params : data;
    const projectName = data.projectName || null;
    console.log('[localStorage] Extracted params:', loaded);
    console.log('[localStorage] Extracted projectName:', projectName);
    
    // Remove canvas border settings - these should come from preset file, not localStorage
    // The loaded preset file is the authority for these UI settings
    delete loaded.canvasBorderVisible;
    delete loaded.canvasBorderColor;
    
    // Ensure critical values are valid
    if (loaded.near === undefined || loaded.near < 0.01) loaded.near = 0.01;
    if (loaded.far === undefined) loaded.far = 5000;
    if (loaded.cameraDistance < 50) loaded.cameraDistance = 600;
    if (loaded.cameraRotationX === undefined) loaded.cameraRotationX = defaultParams.cameraRotationX;
    if (loaded.cameraRotationY === undefined) loaded.cameraRotationY = defaultParams.cameraRotationY;
    if (loaded.cameraOffsetX === undefined) loaded.cameraOffsetX = 0;
    if (loaded.cameraOffsetY === undefined) loaded.cameraOffsetY = 0;
    if (loaded.depthInvert === undefined) loaded.depthInvert = false;
    
    // Ensure rendering settings exist (for backward compatibility)
    if (loaded.framebufferMode === undefined) loaded.framebufferMode = false;
    if (loaded.framebufferPreset === undefined) loaded.framebufferPreset = '1920x1080';
    if (loaded.framebufferWidth === undefined) loaded.framebufferWidth = 1920;
    if (loaded.framebufferHeight === undefined) loaded.framebufferHeight = 1080;
    if (loaded.stereoscopicMode === undefined) loaded.stereoscopicMode = false;
    if (loaded.eyeSeparation === undefined) loaded.eyeSeparation = 30;
    
    // Ensure palettes exist (for backward compatibility with old saves)
    if (!loaded.palettes || !Array.isArray(loaded.palettes) || loaded.palettes.length !== 4) {
      loaded.palettes = defaultParams.palettes;
    }
    if (loaded.activePaletteIndex === undefined) loaded.activePaletteIndex = 0;
    if (loaded.colorTransitionDuration === undefined) loaded.colorTransitionDuration = 3.0;
    if (loaded.stateTransitionDuration === undefined) loaded.stateTransitionDuration = 180;
    if (loaded.autoTriggerStates === undefined) loaded.autoTriggerStates = false;
    if (loaded.autoTriggerFrequency === undefined) loaded.autoTriggerFrequency = 30;
    if (loaded.colorSlotZOffset === undefined) loaded.colorSlotZOffset = 100;
    
    // Ensure overlay settings exist (for backward compatibility)
    if (loaded.overlayImageSrc === undefined) loaded.overlayImageSrc = null;
    if (loaded.overlayCustomFilename === undefined) loaded.overlayCustomFilename = null;
    if (loaded.overlayCustomImageSrc === undefined) loaded.overlayCustomImageSrc = null;
    if (loaded.overlayVisible === undefined) loaded.overlayVisible = false;
    if (loaded.overlayScale === undefined) loaded.overlayScale = 100;
    if (loaded.overlayOpacity === undefined) loaded.overlayOpacity = 100;
    if (loaded.overlayX === undefined) loaded.overlayX = 50;
    if (loaded.overlayY === undefined) loaded.overlayY = 50;
    if (loaded.overlayAutoFit === undefined) loaded.overlayAutoFit = false;
    
    // Ensure project-level settings exist (for backward compatibility)
    if (loaded.ambientSpeedMaster === undefined) loaded.ambientSpeedMaster = 100;
    
    const result = { params: { ...defaultParams, ...loaded }, projectName };
    console.log('[localStorage] Returning:', { projectName, activePaletteIndex: result.params.activePaletteIndex });
    return result;
  } catch (e) {
    console.warn('localStorage load failed:', e);
    return null;
  }
}

/**
 * Download project (parameters + presets) as JSON file
 * @param {Object} ZM - Main application object (or just params for backward compat)
 * @param {string} format - Export format: 'project' (v2.0) or 'states' (individual files)
 * @param {string} customFilename - Optional custom filename (without .json extension)
 */
export function downloadJSON(ZM, format = 'project', customFilename = null) {
  // Only allow downloads from main window, not display windows
  if (ZM.isDisplayMode) {
    console.log('💾 downloadJSON() blocked: display windows cannot download');
    return;
  }
  
  console.log('[Export] Format selected:', format);
  
  // Force-update active state before exporting to capture any recent changes
  if (ZM.cancelStateAutoUpdate) {
    ZM.cancelStateAutoUpdate(); // Cancel any pending debounced update
  }
  if (ZM.stateManager?.activeStateId) {
    console.log('[Export] Force-updating active state before export');
    ZM.stateManager.update(ZM.stateManager.activeStateId);
  }
  
  console.log('[Export] States to export:', ZM.stateManager?.states?.length);
  console.log('[Export] Active state ID:', ZM.stateManager?.activeStateId);
  
  // Log each state's activePaletteIndex
  if (ZM.stateManager?.states) {
    ZM.stateManager.states.forEach((state, idx) => {
      console.log(`[Export] State ${idx}: ${state.name}, activePaletteIndex:`, state.params?.activePaletteIndex);
    });
  }
  
  // Handle "states" format - export each state as individual file
  if (format === 'states') {
    exportAllStatesAsFiles(ZM);
    return;
  }
  
  // Clone params and remove base64 overlay data to keep file small
  const paramsClone = JSON.parse(JSON.stringify(ZM.params));
  if (!paramsClone.overlayPresetFile) {
    // Only keep overlayImageSrc if it's a custom upload (not a preset)
    delete paramsClone.overlayImageSrc;
  } else {
    // Using preset - remove base64, keep filename reference
    delete paramsClone.overlayImageSrc;
  }
  
  // Project format: v2.0 structure with states and metadata
  const data = ZM.params ? {
    version: '2.0',
    params: paramsClone,
    states: ZM.stateManager?.states || [],
    activeStateId: ZM.stateManager?.activeStateId || null,
    overlayPresetFiles: OVERLAY_FILES || [],
    saveDate: new Date().toISOString()
  } : ZM; // Fallback to old format if ZM is actually params
  
  // Format JSON with compact color palettes (one color per line)
  const formattedJSON = formatJSONWithCompactPalettes(data);
  
  const blob = new Blob([formattedJSON], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Generate timestamp in yy-mm-dd-hh-mm-ss format
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${yy}-${mm}-${dd}-${hh}-${min}-${ss}`;
  
  // Use custom filename with timestamp if provided, otherwise use default
  if (customFilename) {
    a.download = `${customFilename}-${timestamp}.json`;
  } else {
    a.download = `spaceflow-project-${timestamp}.json`;
  }
  
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export all states as individual JSON files in a ZIP archive
 * @param {Object} ZM - Main application object
 */
export async function exportAllStatesAsFiles(ZM) {
  console.log('[Export] exportAllStatesAsFiles called');
  console.log('[Export] StateManager:', ZM.stateManager);
  console.log('[Export] States count:', ZM.stateManager?.states?.length);
  
  if (!ZM.stateManager || !ZM.stateManager.states || ZM.stateManager.states.length === 0) {
    console.warn('No states to export');
    if (ZM.showToast) {
      ZM.showToast('No states to export');
    }
    return;
  }
  
  // Check if JSZip is available
  console.log('[Export] JSZip available?', typeof JSZip !== 'undefined');
  if (typeof JSZip === 'undefined') {
    console.error('JSZip library not loaded');
    if (ZM.showToast) {
      ZM.showToast('Error: ZIP library not available');
    }
    return;
  }
  
  const states = ZM.stateManager.states;
  console.log('[Export] Creating ZIP with', states.length, 'states');
  const zip = new JSZip();
  
  // Add each state to the ZIP
  states.forEach(state => {
    const safeName = state.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `spaceflow-state-${safeName}.json`;
    const content = formatJSONWithCompactPalettes(state);
    zip.file(filename, content);
  });
  
  // Generate ZIP file
  console.log('[Export] Generating ZIP blob...');
  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    console.log('[Export] ZIP blob generated:', zipBlob.size, 'bytes');
    const url = URL.createObjectURL(zipBlob);
    const timestamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spaceflow-states-${timestamp}.zip`;
    console.log('[Export] Triggering download:', a.download);
    a.click();
    URL.revokeObjectURL(url);
    
    if (ZM.showToast) {
      ZM.showToast(`Exported ${states.length} states in ZIP archive`);
    }
    console.log('[Export] ZIP export completed successfully');
  } catch (err) {
    console.error('Failed to create ZIP:', err);
    if (ZM.showToast) {
      ZM.showToast('Error creating ZIP archive');
    }
  }
}

/**
 * Load overlay from preset file
 */
async function loadOverlayFromPreset(filename) {
  try {
    const response = await fetch(`assets/overlays/${filename}`);
    if (response.ok) {
      const data = await response.json();
      return data.base64;
    }
  } catch (err) {
    console.error(`Failed to load overlay preset: ${filename}`, err);
  }
  return null;
}

/**
 * Load project from JSON file (parameters + presets)
 * @param {File} file - File object to load
 * @param {Function} callback - Callback function(loadedData)
 */
export function loadJSON(file, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const loaded = JSON.parse(e.target.result);
      
      // Detect format: v2 has "params" field, v1 is just params at root
      const isV2 = loaded.version === '2.0' && loaded.params;
      const params = isV2 ? loaded.params : loaded;
      
      // Validate critical values
      if (params.near === undefined || params.near < 0.01) params.near = 0.01;
      if (params.far === undefined) params.far = 5000;
      
      // Ensure rendering settings exist (for backward compatibility)
      if (params.framebufferMode === undefined) params.framebufferMode = false;
      if (params.framebufferPreset === undefined) params.framebufferPreset = '1920x1080';
      if (params.framebufferWidth === undefined) params.framebufferWidth = 1920;
      if (params.framebufferHeight === undefined) params.framebufferHeight = 1080;
      if (params.stereoscopicMode === undefined) params.stereoscopicMode = false;
      if (params.eyeSeparation === undefined) params.eyeSeparation = 30;
      
      // Ensure palettes exist (for backward compatibility)
      if (!params.palettes || !Array.isArray(params.palettes) || params.palettes.length !== 4) {
        params.palettes = DEFAULT_PARAMS.palettes;
      }
      if (params.activePaletteIndex === undefined) params.activePaletteIndex = 0;
      if (params.colorTransitionDuration === undefined) params.colorTransitionDuration = 3.0;
      if (params.stateTransitionDuration === undefined) params.stateTransitionDuration = 4.5;
      if (params.autoTriggerStates === undefined) params.autoTriggerStates = false;
      if (params.autoTriggerFrequency === undefined) params.autoTriggerFrequency = 30;
      if (params.colorSlotZOffset === undefined) params.colorSlotZOffset = 100;
      
      // Clean up project-wide settings from states (same as we do in loadPresetFile)
      if (isV2 && loaded.states && Array.isArray(loaded.states)) {
        loaded.states.forEach(state => {
          // Ensure backward compatibility with old states that only have timestamp
          if (state.timestamp && !state.createdAt) {
            state.createdAt = state.timestamp;
          }
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
      
      // Pass back full data structure or just params for v1
      callback(isV2 ? {
        params: params,
        states: loaded.states || [],
        activeStateId: loaded.activeStateId || null,
        projectName: loaded.projectName || file.name // Store project name from file
      } : { params: params, projectName: file.name });
    } catch (err) {
      console.error('JSON load failed:', err);
      if (window.SpaceFlow && window.SpaceFlow.showToast) {
        window.SpaceFlow.showToast('Error loading JSON file. Please check the file format.');
      }
    }
  };
  reader.readAsText(file);
}
