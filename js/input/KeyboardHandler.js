/**
 * KeyboardHandler — Centralized keyboard shortcuts
 */

import { triggerPaletteChange } from '../core/colorUtils.js';

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
        // Skip if typing in input field, textarea, or contenteditable element
        const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        const isContentEditable = e.target.isContentEditable || 
                                   e.target.contentEditable === 'true' ||
                                   e.target.getAttribute('contenteditable') === 'true';
        
        if (isInput || isContentEditable) {
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
            // Show mini feedback toast (skip info-panel toggle — it's self-evident)
            if (shortcut.action !== 'toggleShortcutsToast' && ZM.showToast) {
              const suffix = getToggleSuffix(shortcut.action, ZM);
              const type = suffix.includes('ON') || suffix.includes('PLAYING') ? 'success' : 'info';
              ZM.showToast(shortcut.description + suffix, type);
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
      document.querySelector('.controls').classList.toggle('hidden');
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
      ZM.camera.rotationX = -0.3;
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
      triggerPaletteChange(ZM);
      ZM.saveToLocalStorage();
    },
    
    selectPalette2: () => {
      document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
      const btn = document.querySelector('.palette-btn[data-palette="1"]');
      if (btn) btn.classList.add('active');
      
      ZM.params.activePaletteIndex = 1;
      if (ZM.updatePaletteUI) ZM.updatePaletteUI();
      triggerPaletteChange(ZM);
      ZM.saveToLocalStorage();
    },
    
    selectPalette3: () => {
      document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
      const btn = document.querySelector('.palette-btn[data-palette="2"]');
      if (btn) btn.classList.add('active');
      
      ZM.params.activePaletteIndex = 2;
      if (ZM.updatePaletteUI) ZM.updatePaletteUI();
      triggerPaletteChange(ZM);
      ZM.saveToLocalStorage();
    },
    
    selectPalette4: () => {
      document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
      const btn = document.querySelector('.palette-btn[data-palette="3"]');
      if (btn) btn.classList.add('active');
      
      ZM.params.activePaletteIndex = 3;
      if (ZM.updatePaletteUI) ZM.updatePaletteUI();
      triggerPaletteChange(ZM);
      ZM.saveToLocalStorage();
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
        console.log('[Auto-Trigger] Enabled and started (via spacebar)');
      } else {
        // Toggle pause state
        if (ZM.autoTriggerTimer.paused) {
          ZM.autoTriggerTimer.paused = false;
          console.log('[Auto-Trigger] Resumed (via spacebar)');
        } else {
          ZM.autoTriggerTimer.paused = true;
          ZM.autoTriggerTimer.pausedAt = ZM.autoTriggerTimer.elapsed;
          console.log('[Auto-Trigger] Paused (via spacebar)');
        }
      }
      
      if (ZM.stateManager && ZM.stateManager.updateAutoTriggerStatus) {
        ZM.stateManager.updateAutoTriggerStatus();
      }
    },
    
    autoTriggerPrevious: () => {
      if (!ZM.stateHistory || ZM.stateManager.states.length < 2) return;
      
      // Navigate to previous state in history
      const success = ZM.stateManager.navigateHistory(-1);
      if (!success) {
        console.log('[History] No previous state in history');
      }
    },
    
    autoTriggerReset: () => {
      if (!ZM.autoTriggerTimer || ZM.stateManager.states.length < 2) return;
      
      ZM.autoTriggerTimer.elapsed = 0;
      ZM.autoTriggerTimer.pausedAt = 0;
      console.log('[Auto-Trigger] Timer reset (via left arrow)');
      
      if (ZM.stateManager && ZM.stateManager.updateAutoTriggerStatus) {
        ZM.stateManager.updateAutoTriggerStatus();
      }
    },
    
    autoTriggerSkip: () => {
      if (!ZM.autoTriggerTimer || ZM.stateManager.states.length < 2) return;
      
      ZM.autoTriggerTimer.elapsed = 0;
      ZM.autoTriggerTimer.pausedAt = 0;
      ZM.stateManager.loadRandomState();
      console.log('[Auto-Trigger] Skipped to next state (via right arrow)');
      
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
      return document.querySelector('.controls')?.classList.contains('hidden') ? off : on;
    case 'toggleFullscreen':
      // requestFullscreen is async — fullscreenElement still reflects the OLD state here, so invert
      return (document.fullscreenElement || document.webkitFullscreenElement) ? off : on;
    case 'autoTriggerPlayPause':
      return ZM.autoTriggerTimer?.paused ? ' \u2014 PAUSED' : ' \u2014 PLAYING';
    default:
      return '';
  }
}
