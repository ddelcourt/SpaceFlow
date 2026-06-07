/**
 * KeyboardHandler — Centralized keyboard shortcuts
 */

import { debugLog } from '../core/debugLogger.js';

// No direct imports from colorUtils - uses ZM.triggerPaletteChange() wrapper

export function setupKeyboardHandlers(ZM) {
  // Load keyboard shortcuts configuration
  fetch('config/keyboardShortcuts.json')
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const shortcuts = data.shortcuts || data; // Handle both {shortcuts: [...]} and [...]
      if (!Array.isArray(shortcuts)) {
        console.error('Keyboard shortcuts is not an array:', data);
        return;
      }
      
      window.addEventListener('keydown', (e) => {
        // Safety check: ensure e.target is a valid DOM element with getAttribute
        if (!e.target || typeof e.target.getAttribute !== 'function') {
          console.warn('⚠️ Keyboard event with invalid target:', e);
          return;
        }
        
        // Skip if typing in a text-like input field, textarea, or contenteditable element
        // (range and checkbox inputs should NOT block global shortcuts)
        const TEXT_INPUT_TYPES = ['text', 'number', 'email', 'password', 'search', 'tel', 'url'];
        const isTextInput = e.target.tagName === 'TEXTAREA' ||
                            (e.target.tagName === 'INPUT' && TEXT_INPUT_TYPES.includes(e.target.type));
        const isContentEditable = e.target.isContentEditable || 
                                   e.target.contentEditable === 'true' ||
                                   e.target.getAttribute('contenteditable') === 'true';
        
        if (isTextInput || isContentEditable) {
          return;
        }
        
        // Check each shortcut
        for (const shortcut of shortcuts) {
          const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
          const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
          const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
          
          if (keyMatch && ctrlMatch && shiftMatch) {
            if (shortcut.preventDefault) {
              e.preventDefault();
              e.stopPropagation();
            }
            
            // Execute action
            executeAction(shortcut.action, ZM);
            // Show mini feedback toast (skip info-panel toggle — it's self-evident;
            // skip state nav actions — they show their own toast with state name + swatches)
            const noToastActions = ['toggleShortcutsToast', 'autoTriggerSkip', 'autoTriggerPrevious', 'autoTriggerPlayPause'];
            if (!noToastActions.includes(shortcut.action) && ZM.showToast) {
              const suffix = getToggleSuffix(shortcut.action, ZM);
              const type = suffix.includes('ON') || suffix.includes('PLAYING') ? 'success' : 'info';
              const node = buildPaletteSwatches(shortcut.action, ZM);
              ZM.showToast(shortcut.description + suffix, type, 4400, node);
            }
            break;
          }
        }
      });
    })
    .catch(err => {
      console.error('Failed to load keyboard shortcuts:', err);
    });
}

function executeAction(action, ZM) {
  const actions = {
    // UI Navigation
    toggleControls: () => {
      // Toggle global UI visibility (affects all panels + top bar)
      document.body.classList.toggle('global-ui-hidden');
      document.body.classList.toggle('ui-hidden');
    },
    
    toggleFullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    },
    
    // Export Actions
    exportPNG: () => ZM.exportPNG(),
    exportSVG: () => ZM.exportSVG(),
    exportDepthMap: () => ZM.exportDepthMap(),
    toggleVideoRecording: () => {
      if (ZM.isVideoRecording()) {
        ZM.stopVideoRecording();
      } else {
        ZM.startVideoRecording();
      }
    },
    downloadJSON: () => ZM.downloadJSON(),
    
    // Camera Controls
    resetCamera: () => {
      ZM.camera.rotationX = 0;
      ZM.camera.rotationY = 0;
      ZM.camera.distance = 600;
      ZM.camera.offsetX = 0;
      ZM.camera.offsetY = 0;
      ZM.params.cameraRotationX = ZM.camera.rotationX;
      ZM.params.cameraRotationY = ZM.camera.rotationY;
      ZM.params.cameraDistance = ZM.camera.distance;
      ZM.params.cameraOffsetX = ZM.camera.offsetX;
      ZM.params.cameraOffsetY = ZM.camera.offsetY;
      ZM.saveToLocalStorage();
    },
    
    resetZoom: () => {
      ZM.camera.distance = 600;
      ZM.params.cameraDistance = 600;
      ZM.saveToLocalStorage();
    },
    
    // Modulation Toggles
    toggleRandomThickness: () => {
      ZM.params.randomThickness = !ZM.params.randomThickness;
      document.getElementById('random-thickness').checked = ZM.params.randomThickness;
      ZM.saveToLocalStorage();
    },
    
    toggleRandomSpeed: () => {
      ZM.params.randomSpeed = !ZM.params.randomSpeed;
      document.getElementById('random-speed').checked = ZM.params.randomSpeed;
      ZM.saveToLocalStorage();
    },
    
    // View Modes
    toggleStereoMode: () => {
      ZM.params.stereoscopicMode = !ZM.params.stereoscopicMode;
      document.getElementById('stereoscopic-mode').checked = ZM.params.stereoscopicMode;
      ZM.initializeSketches();
      if (ZM.params.framebufferMode) {
        setTimeout(() => ZM.updateCanvasSize(), 100);
      }
      ZM.saveToLocalStorage();
    },
    
    toggleFramebuffer: () => {
      ZM.params.framebufferMode = !ZM.params.framebufferMode;
      document.getElementById('framebuffer-mode').checked = ZM.params.framebufferMode;
      ZM.updateCanvasSize();
      ZM.saveToLocalStorage();
    },
    
    // Color Palette Selection
    selectPalette1: () => {
      document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
      const btn = document.querySelector('.palette-btn[data-palette="0"]');
      if (btn) btn.classList.add('active');
      
      ZM.params.activePaletteIndex = 0;
      if (ZM.updatePaletteUI) ZM.updatePaletteUI();
      
      // Broadcast BEFORE triggering so all windows transition simultaneously
      if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
        ZM.windowSync.broadcastParamChanges({ activePaletteIndex: 0 });
      }
      
      if (ZM.triggerPaletteChange) {
        ZM.triggerPaletteChange();
      }
      ZM.saveToLocalStorage();
    },
    
    selectPalette2: () => {
      document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
      const btn = document.querySelector('.palette-btn[data-palette="1"]');
      if (btn) btn.classList.add('active');
      
      ZM.params.activePaletteIndex = 1;
      if (ZM.updatePaletteUI) ZM.updatePaletteUI();
      
      // Broadcast BEFORE triggering so all windows transition simultaneously
      if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
        ZM.windowSync.broadcastParamChanges({ activePaletteIndex: 1 });
      }
      
      if (ZM.triggerPaletteChange) {
        ZM.triggerPaletteChange();
      }
      ZM.saveToLocalStorage();
    },
    
    selectPalette3: () => {
      document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
      const btn = document.querySelector('.palette-btn[data-palette="2"]');
      if (btn) btn.classList.add('active');
      
      ZM.params.activePaletteIndex = 2;
      if (ZM.updatePaletteUI) ZM.updatePaletteUI();
      
      // Broadcast BEFORE triggering so all windows transition simultaneously
      if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
        ZM.windowSync.broadcastParamChanges({ activePaletteIndex: 2 });
      }
      
      if (ZM.triggerPaletteChange) {
        ZM.triggerPaletteChange();
      }
      ZM.saveToLocalStorage();
    },
    
    selectPalette4: () => {
      document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
      const btn = document.querySelector('.palette-btn[data-palette="3"]');
      if (btn) btn.classList.add('active');
      
      ZM.params.activePaletteIndex = 3;
      if (ZM.updatePaletteUI) ZM.updatePaletteUI();
      
      // Broadcast BEFORE triggering so all windows transition simultaneously
      if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
        ZM.windowSync.broadcastParamChanges({ activePaletteIndex: 3 });
      }
      
      if (ZM.triggerPaletteChange) {
        ZM.triggerPaletteChange();
      }
      ZM.saveToLocalStorage();
    },
    
    // Palette Copy/Paste
    copyPalette: () => {
      const copyBtn = document.getElementById('copy-palette-btn');
      if (copyBtn) copyBtn.click();
    },
    
    pastePalette: () => {
      const pasteBtn = document.getElementById('paste-palette-btn');
      if (pasteBtn && !pasteBtn.disabled) pasteBtn.click();
    },
    
    // Auto-Trigger Controls
    autoTriggerPlayPause: () => {
      if (!ZM.autoTriggerTimer || ZM.stateManager.states.length < 2) return;
      
      // If auto-trigger is disabled, enable it and start playing
      if (!ZM.params.autoTriggerStates) {
        ZM.params.autoTriggerStates = true;
        const checkbox = document.getElementById('auto-trigger-states');
        if (checkbox) checkbox.checked = true;
        ZM.autoTriggerTimer.paused = false;
        ZM.saveToLocalStorage();
        debugLog('STATES', '[Auto-Trigger] Enabled and started (via spacebar)');
      } else {
        // Toggle pause state
        if (ZM.autoTriggerTimer.paused) {
          ZM.autoTriggerTimer.paused = false;
          debugLog('STATES', '[Auto-Trigger] Resumed (via spacebar)');
        } else {
          ZM.autoTriggerTimer.paused = true;
          ZM.autoTriggerTimer.pausedAt = ZM.autoTriggerTimer.elapsed;
          debugLog('STATES', '[Auto-Trigger] Paused (via spacebar)');
        }
      }
      
      if (ZM.stateManager && ZM.stateManager.updateAutoTriggerStatus) {
        ZM.stateManager.updateAutoTriggerStatus();
      }
      if (ZM.showToast) ZM.showToast(ZM.autoTriggerTimer.paused ? '⏸ States Player' : '▶ States Player');
    },
    
    autoTriggerPrevious: () => {
      if (!ZM.stateHistory || ZM.stateManager.states.length < 2) return;
      
      // Navigate to previous state in history
      const success = ZM.stateManager.navigateHistory(-1);
      if (!success) {
        debugLog('STATES', '[History] No previous state in history');
      }
    },
    
    autoTriggerReset: () => {
      if (!ZM.autoTriggerTimer || ZM.stateManager.states.length < 2) return;
      
      ZM.autoTriggerTimer.elapsed = 0;
      ZM.autoTriggerTimer.pausedAt = 0;
      debugLog('STATES', '[Auto-Trigger] Timer reset (via left arrow)');
      
      if (ZM.stateManager && ZM.stateManager.updateAutoTriggerStatus) {
        ZM.stateManager.updateAutoTriggerStatus();
      }
    },
    
    autoTriggerSkip: () => {
      if (!ZM.autoTriggerTimer || ZM.stateManager.states.length < 2) return;
      
      ZM.autoTriggerTimer.elapsed = 0;
      ZM.autoTriggerTimer.pausedAt = 0;
      ZM.stateManager.loadRandomState();
      debugLog('STATES', '[Auto-Trigger] Skipped to next state (via right arrow)');
      
      if (ZM.stateManager && ZM.stateManager.updateAutoTriggerStatus) {
        ZM.stateManager.updateAutoTriggerStatus();
      }
    },

    toggleShortcutsToast: () => {
      if (ZM.toggleShortcutsToast) ZM.toggleShortcutsToast();
    }
  };
  
  if (actions[action]) {
    actions[action]();
  } else {
    console.warn('Unknown keyboard action:', action);
  }
}

/**
 * Builds a row of palette color swatches for palette-selection actions, null otherwise.
 */
function buildPaletteSwatches(action, ZM) {
  if (!/^selectPalette\d+$/.test(action)) return null;
  const palette = ZM.params.palettes?.[ZM.params.activePaletteIndex];
  if (!palette) return null;
  const wrap = document.createElement('span');
  wrap.style.cssText = 'display:inline-flex;gap:4px;margin-left:8px;vertical-align:middle;';
  palette.forEach(slot => {
    const s = document.createElement('span');
    const [r, g, b] = slot.rgb;
    const border = slot.role === 'background'
      ? '2px solid rgba(200,200,200,0.6)'
      : '1px solid rgba(255,255,255,0.2)';
    s.style.cssText = `position:relative;display:inline-block;width:14px;height:14px;border-radius:3px;background:rgb(${r},${g},${b});border:${border};flex-shrink:0;`;
    if (slot.role === 'none') {
      const dim = document.createElement('span');
      dim.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.75);border-radius:2px;';
      s.appendChild(dim);
    }
    if (slot.role === 'none') {
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
    wrap.appendChild(s);
  });
  return wrap;
}

/**
 * Returns " — ON" / " — OFF" (or similar) for toggle actions, empty string for non-toggles.
 */
function getToggleSuffix(action, ZM) {
  const on  = ' \u2014 ON';
  const off = ' \u2014 OFF';
  switch (action) {
    case 'toggleRandomThickness':
      return ZM.params.randomThickness ? on : off;
    case 'toggleRandomSpeed':
      return ZM.params.randomSpeed ? on : off;
    case 'toggleStereoMode':
      return ZM.params.stereoscopicMode ? on : off;
    case 'toggleFramebuffer':
      return ZM.params.framebufferMode
        ? ` — ON (${ZM.params.framebufferWidth}×${ZM.params.framebufferHeight})`
        : off;
    case 'toggleControls':
      return document.body.classList.contains('global-ui-hidden') ? off : on;
    case 'toggleFullscreen':
      // requestFullscreen is async — fullscreenElement still reflects the OLD state here, so invert
      return (document.fullscreenElement || document.webkitFullscreenElement) ? off : on;
    case 'autoTriggerPlayPause':
      return ZM.autoTriggerTimer?.paused ? ' \u2014 PAUSED' : ' \u2014 PLAYING';
    default:
      return '';
  }
}
