/**
 * WindowSync — Multi-window synchronization using BroadcastChannel API
 * Allows a display window to mirror the primary window's rendering
 */

import { initColorRNG } from '../core/colorUtils.js';

const CHANNEL_NAME = 'zigmap26-sync';
const SYNC_THROTTLE_MS = 16; // ~60fps max

// Display window counter for sequential IDs
let displayWindowCounter = 0;

/**
 * Initialize window sync for primary (control) window
 * @param {Object} ZM - Main application object
 */
export function initializePrimarySync(ZM) {
  if (!('BroadcastChannel' in window)) {
    console.warn('⚠️ BroadcastChannel API not supported. Display window sync disabled.');
    ZM.windowSync = null;
    return;
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);
  let lastSyncTime = 0;
  let pendingUpdates = null;
  let syncScheduled = false;

  console.log('📡 Primary window sync initialized');

  // Throttle mouse command broadcasts for real-time sync (60fps)
  let lastMouseBroadcast = 0;
  const MOUSE_BROADCAST_THROTTLE = 17; // ~60fps
  
  function broadcastCameraFromMouse(state) {
    const now = Date.now();
    if (now - lastMouseBroadcast < MOUSE_BROADCAST_THROTTLE) return;
    
    if (ZM.windowSync && ZM.windowSync.broadcastCameraImmediate) {
      ZM.windowSync.broadcastCameraImmediate(state);
      lastMouseBroadcast = now;
    }
  }

  // Listen for messages from display windows
  channel.onmessage = (event) => {
    const { type } = event.data;
    
    if (type === 'display-ready') {
      console.log('🖥️ Display window connected, sending full state...');
      sendFullState();
    } else if (type === 'keyboard-command') {
      // Bidirectional keyboard control: Display windows can send commands back to main window
      // Flow: Display → keyboard-command → Main → KeyboardHandler executes action
      //       → Action triggers state change → StateManager broadcasts transitions
      //       → All displays (including sender) receive and execute transitions
      const { key, ctrlKey, metaKey, shiftKey } = event.data;
      console.log(`⌨️ Remote command: ${key}${ctrlKey || metaKey ? ' (Ctrl/Cmd)' : ''}`);
      
      // Simulate keyboard event on document.body (not window) so e.target has getAttribute()
      const keyEvent = new KeyboardEvent('keydown', {
        key: key,
        code: key,
        ctrlKey: ctrlKey,
        metaKey: metaKey,
        shiftKey: shiftKey,
        bubbles: true,
        cancelable: true
      });
      
      document.body.dispatchEvent(keyEvent);
      // Note: Main window's action execution will automatically broadcast results to all displays
    } else if (type === 'mouse-command') {
      // Bidirectional mouse control: Display windows can send mouse commands to main window
      // Flow: Display → mouse-command → Main → Apply to camera → broadcastCameraImmediate
      //       → All displays (including sender) receive camera state update
      const { command } = event.data;
      
      if (!ZM.camera) return;
      
      switch (command.action) {
        case 'cancel-transitions':
          // Cancel any active transitions when manual mouse control starts
          if (ZM.camera.transition.isActive) {
            ZM.camera.transition.isActive = false;
          }
          if (ZM.emitterRotationTransition && ZM.emitterRotationTransition.isTransitioning) {
            ZM.emitterRotationTransition.isTransitioning = false;
          }
          break;
          
        case 'orbit':
          // Apply camera orbit (rotation)
          ZM.camera.rotationY += command.dx * 0.005;
          ZM.camera.rotationX += command.dy * 0.005;
          ZM.params.cameraRotationY = ZM.camera.rotationY;
          ZM.params.cameraRotationX = ZM.camera.rotationX;
          ZM.saveToLocalStorage();
          
          // Broadcast to all displays (throttled)
          const state = {
            rotationX: ZM.camera.rotationX,
            rotationY: ZM.camera.rotationY,
            distance: ZM.camera.distance,
            offsetX: ZM.camera.offsetX,
            offsetY: ZM.camera.offsetY
          };
          if (ZM.emitterRotationTransition && ZM.emitterRotationTransition.current !== undefined) {
            state.emitterRotation = ZM.emitterRotationTransition.current;
          }
          broadcastCameraFromMouse(state);
          break;
          
        case 'pan':
          // Apply camera pan (offset)
          // Scale mouse movement if in framebuffer mode
          let scaledDx = command.dx;
          let scaledDy = command.dy;
          
          if (ZM.params.framebufferMode && ZM.p5Instance && ZM.p5Instance.canvas) {
            const canvasW = ZM.W;
            const canvasH = ZM.H;
            const displayW = ZM.p5Instance.canvas.clientWidth;
            const displayH = ZM.p5Instance.canvas.clientHeight;
            
            if (displayW > 0 && displayH > 0) {
              const scaleX = canvasW / displayW;
              const scaleY = canvasH / displayH;
              scaledDx = command.dx * scaleX;
              scaledDy = command.dy * scaleY;
            }
          }
          
          ZM.camera.offsetX += scaledDx;
          ZM.camera.offsetY += scaledDy;
          ZM.params.cameraOffsetX = ZM.camera.offsetX;
          ZM.params.cameraOffsetY = ZM.camera.offsetY;
          ZM.saveToLocalStorage();
          
          // Broadcast to all displays (throttled)
          const panState = {
            rotationX: ZM.camera.rotationX,
            rotationY: ZM.camera.rotationY,
            distance: ZM.camera.distance,
            offsetX: ZM.camera.offsetX,
            offsetY: ZM.camera.offsetY
          };
          if (ZM.emitterRotationTransition && ZM.emitterRotationTransition.current !== undefined) {
            panState.emitterRotation = ZM.emitterRotationTransition.current;
          }
          broadcastCameraFromMouse(panState);
          break;
          
        case 'rotate':
          // Apply Z-rotation (emitter rotation)
          if (ZM.emitterRotationTransition) {
            ZM.emitterRotationTransition.current += command.dx * 0.5;
            ZM.params.emitterRotation = ZM.emitterRotationTransition.current;
            
            // Cancel transition and snap to current value
            ZM.emitterRotationTransition.target = ZM.emitterRotationTransition.current;
            ZM.emitterRotationTransition.start = ZM.emitterRotationTransition.current;
            ZM.emitterRotationTransition.progress = 1.0;
            ZM.emitterRotationTransition.isTransitioning = false;
            
            ZM.saveToLocalStorage();
            
            // Broadcast to all displays (throttled)
            const state = {
              rotationX: ZM.camera.rotationX,
              rotationY: ZM.camera.rotationY,
              distance: ZM.camera.distance,
              offsetX: ZM.camera.offsetX,
              offsetY: ZM.camera.offsetY,
              emitterRotation: ZM.emitterRotationTransition.current
            };
            broadcastCameraFromMouse(state);
          }
          break;
          
        case 'zoom':
          // Apply camera zoom
          const zoomSpeed = 2;
          ZM.camera.distance += command.delta * zoomSpeed;
          ZM.camera.distance = Math.max(50, Math.min(10000, ZM.camera.distance));
          ZM.params.cameraDistance = ZM.camera.distance;
          ZM.saveToLocalStorage();
          
          // Broadcast to all displays (throttled)
          const zoomState = {
            rotationX: ZM.camera.rotationX,
            rotationY: ZM.camera.rotationY,
            distance: ZM.camera.distance,
            offsetX: ZM.camera.offsetX,
            offsetY: ZM.camera.offsetY
          };
          if (ZM.emitterRotationTransition && ZM.emitterRotationTransition.current !== undefined) {
            zoomState.emitterRotation = ZM.emitterRotationTransition.current;
          }
          broadcastCameraFromMouse(zoomState);
          break;
      }
    }
  };

  /**
   * Send full application state to display window
   */
  function sendFullState() {
    const state = {
      type: 'full-sync',
      params: JSON.parse(JSON.stringify(ZM.params)),
      noiseOffset: ZM.noiseOffset,
      timestamp: Date.now()
    };
    
    // Log what we're sending (only on explicit broadcasts, not periodic updates)
    if (!ZM.windowSync._broadcastingTransition) {
      console.log('📤 Sending full state to display:');
      console.log(`   colorTransitionDuration: ${state.params.colorTransitionDuration}s`);
      console.log(`   colorRandomSeed: ${state.params.colorRandomSeed}`);
    }
    
    // Include transition states so display window can match ongoing transitions
    if (ZM.geometryScaleTransition) {
      state.geometryScaleTransition = {
        current: ZM.geometryScaleTransition.current,
        target: ZM.geometryScaleTransition.target,
        start: ZM.geometryScaleTransition.start,
        progress: ZM.geometryScaleTransition.progress,
        isTransitioning: ZM.geometryScaleTransition.isTransitioning,
        duration: ZM.geometryScaleTransition.duration
      };
    }
    
    if (ZM.emitterRotationTransition) {
      state.emitterRotationTransition = {
        current: ZM.emitterRotationTransition.current,
        target: ZM.emitterRotationTransition.target,
        start: ZM.emitterRotationTransition.start,
        progress: ZM.emitterRotationTransition.progress,
        isTransitioning: ZM.emitterRotationTransition.isTransitioning,
        duration: ZM.emitterRotationTransition.duration
      };
    }
    
    if (ZM.fovTransition) {
      state.fovTransition = {
        current: ZM.fovTransition.current,
        target: ZM.fovTransition.target,
        start: ZM.fovTransition.start,
        progress: ZM.fovTransition.progress,
        isTransitioning: ZM.fovTransition.isTransitioning,
        duration: ZM.fovTransition.duration
      };
    }
    
    // Include background color transition
    if (ZM.bgTransition) {
      state.bgTransition = {
        current: [...ZM.bgTransition.current],
        target: [...ZM.bgTransition.target],
        start: [...ZM.bgTransition.start],
        progress: ZM.bgTransition.progress,
        isTransitioning: ZM.bgTransition.isTransitioning
      };
    }
    
    // Include current camera state (not just params)
    if (ZM.camera) {
      state.camera = {
        rotationX: ZM.camera.rotationX,
        rotationY: ZM.camera.rotationY,
        distance: ZM.camera.distance,
        offsetX: ZM.camera.offsetX,
        offsetY: ZM.camera.offsetY,
        transition: {
          isActive: ZM.camera.transition.isActive,
          progress: ZM.camera.transition.progress,
          startRotationX: ZM.camera.transition.start.rotationX,
          startRotationY: ZM.camera.transition.start.rotationY,
          startDistance: ZM.camera.transition.start.distance,
          startOffsetX: ZM.camera.transition.start.offsetX,
          startOffsetY: ZM.camera.transition.start.offsetY,
          targetRotationX: ZM.camera.transition.target.rotationX,
          targetRotationY: ZM.camera.transition.target.rotationY,
          targetDistance: ZM.camera.transition.target.distance,
          targetOffsetX: ZM.camera.transition.target.offsetX,
          targetOffsetY: ZM.camera.transition.target.offsetY,
          duration: ZM.camera.transition.duration
        }
      };
    }
    
    channel.postMessage(state);
    // Only log explicitly requested broadcasts (not periodic transition updates)
    if (!ZM.windowSync._broadcastingTransition) {
      console.log('✓ Full state sent to display window (with transitions)');
    }
  }

  /**
   * Broadcast parameter changes (delta updates)
   * @param {Object} changes - Object containing only changed parameters
   */
  function broadcastParamChanges(changes) {
    if (!changes || Object.keys(changes).length === 0) {
      return;
    }

    // Check if this contains palette-critical changes (need immediate sync)
    const paletteParams = ['activePaletteIndex', 'palettes', 'backgroundColor', 'colorTransitionDuration', 'colorRandomSeed'];
    const hasPaletteChanges = Object.keys(changes).some(k => paletteParams.includes(k));
    
    if (hasPaletteChanges) {
      // Send palette changes IMMEDIATELY (no throttling) for perfect synchronization
      const updates = {
        type: 'delta-sync',
        changes: changes,
        timestamp: Date.now()
      };
      
      channel.postMessage(updates);
      console.log('📤 Broadcasting palette change (immediate):', Object.keys(changes).filter(k => paletteParams.includes(k)).join(', '));
      lastSyncTime = Date.now();
      return;
    }

    // For non-palette changes, use normal throttling
    // Store pending updates
    if (!pendingUpdates) {
      pendingUpdates = {};
    }
    Object.assign(pendingUpdates, changes);

    // Throttle updates
    if (!syncScheduled) {
      syncScheduled = true;
      
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncTime;
      const delay = Math.max(0, SYNC_THROTTLE_MS - timeSinceLastSync);

      setTimeout(() => {
        const updates = {
          type: 'delta-sync',
          changes: pendingUpdates,
          timestamp: Date.now()
        };
        
        channel.postMessage(updates);
        
        // Enhanced logging for palette changes
        const changedKeys = Object.keys(pendingUpdates);
        const paletteRelated = changedKeys.filter(k => ['activePaletteIndex', 'palettes', 'backgroundColor'].includes(k));
        if (paletteRelated.length > 0) {
          console.log('📤 Broadcasting palette change:', paletteRelated.join(', '));
        } else {
          console.log('📤 Synced params:', changedKeys.join(', '));
        }
        
        lastSyncTime = Date.now();
        pendingUpdates = null;
        syncScheduled = false;
      }, delay);
    }
  }

  /**
   * Broadcast full state (for major changes like preset/state loading)
   */
  function broadcastFullState() {
    sendFullState();
  }

  /**
   * Broadcast state load to display windows
   * Display windows will call restoreState() with the same logic as main window
   */
  function broadcastStateLoad(state, instant = false) {
    const message = {
      type: 'state-load',
      state: state,
      instant: instant,
      timestamp: Date.now()
    };
    channel.postMessage(message);
  }

  /**
   * Broadcast camera transition command (replaces continuous param updates)
   */
  function broadcastCameraTransition(target, duration) {
    const message = {
      type: 'camera-transition',
      target: {
        rotationX: target.rotationX,
        rotationY: target.rotationY,
        distance: target.distance,
        offsetX: target.offsetX,
        offsetY: target.offsetY
      },
      duration: duration,
      timestamp: Date.now()
    };
    channel.postMessage(message);
  }

  /**
   * Broadcast geometry scale transition command
   */
  function broadcastGeometryTransition(targetScale, duration) {
    const message = {
      type: 'geometry-transition',
      targetScale: targetScale,
      duration: duration,
      timestamp: Date.now()
    };
    channel.postMessage(message);
  }

  /**
   * Broadcast FOV transition command
   */
  function broadcastFOVTransition(targetFOV, duration) {
    const message = {
      type: 'fov-transition',
      targetFOV: targetFOV,
      duration: duration,
      timestamp: Date.now()
    };
    channel.postMessage(message);
  }

  /**
   * Broadcast emitter rotation transition command
   */
  function broadcastEmitterRotationTransition(targetRotation, duration) {
    const message = {
      type: 'emitter-rotation-transition',
      targetRotation: targetRotation,
      duration: duration,
      timestamp: Date.now()
    };
    channel.postMessage(message);
  }

  /**
   * Broadcast immediate camera update (for manual mouse control - real-time)
   */
  function broadcastCameraImmediate(cameraState) {
    const message = {
      type: 'camera-immediate',
      state: {
        rotationX: cameraState.rotationX,
        rotationY: cameraState.rotationY,
        distance: cameraState.distance,
        offsetX: cameraState.offsetX,
        offsetY: cameraState.offsetY,
        emitterRotation: cameraState.emitterRotation
      },
      timestamp: Date.now()
    };
    channel.postMessage(message);
  }

  /**
   * Close sync channel
   */
  function close() {
    channel.close();
    console.log('📡 Primary window sync closed');
  }

  // Store sync functions in ZM
  ZM.windowSync = {
    channel,
    broadcastParamChanges,
    broadcastFullState,
    sendFullState,
    broadcastStateLoad,
    broadcastCameraTransition,
    broadcastGeometryTransition,
    broadcastFOVTransition,
    broadcastEmitterRotationTransition,
    broadcastCameraImmediate,
    close,
    isPrimary: true
  };
}

/**
 * Initialize window sync for display (renderer) window
 * @param {Object} ZM - Main application object
 * @returns {Promise} Resolves when initial sync is complete
 */
export function initializeDisplaySync(ZM) {
  return new Promise((resolve, reject) => {
    if (!('BroadcastChannel' in window)) {
      console.error('❌ BroadcastChannel API not supported');
      reject(new Error('BroadcastChannel not supported'));
      return;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);
    let initialSyncReceived = false;
    let previousPaletteState = null; // Track palette state to detect changes in full-sync

    console.log('🖥️ Display window sync initialized');

    // Listen for updates from primary window
    channel.onmessage = (event) => {
      const { type, params, changes, noiseOffset, timestamp } = event.data;

      if (type === 'full-sync') {
        if (!initialSyncReceived) {
          console.log('📥 Received full state from primary window');
          console.log(`   colorTransitionDuration: ${params.colorTransitionDuration}s`);
          console.log(`   colorRandomSeed: ${params.colorRandomSeed}`);
          console.log(`   ZM.params object ID: ${ZM.params}`);
        }
        
        // Update all params (modifies existing object in-place)
        const beforeDuration = ZM.params.colorTransitionDuration;
        Object.assign(ZM.params, params);
        const afterDuration = ZM.params.colorTransitionDuration;
        
        if (!initialSyncReceived && beforeDuration !== afterDuration) {
          console.log(`   ✓ colorTransitionDuration updated: ${beforeDuration}s → ${afterDuration}s`);
          
          // Verify all lines reference the same params object
          if (ZM.emitterInstance && ZM.emitterInstance.lines.length > 0) {
            const firstLine = ZM.emitterInstance.lines[0];
            console.log(`   ✓ Line params reference: ${firstLine.params === ZM.params ? 'SAME ✓' : 'DIFFERENT ✗'}`);
          }
        }
        
        // Initialize color RNG with seed from synced params (ensures deterministic color selection)
        if (params.colorRandomSeed !== undefined) {
          initColorRNG(params.colorRandomSeed);
        }
        
        // Update noise offset
        if (noiseOffset !== undefined) {
          ZM.noiseOffset = noiseOffset;
        }

        // Update camera state - if primary is transitioning, start transition; otherwise snap
        if (event.data.camera && ZM.camera) {
          const camData = event.data.camera;
          
          // Check if primary window is transitioning
          if (camData.transition && camData.transition.isActive) {
            // Primary is transitioning - start matching transition in display
            ZM.camera.transitionTo(
              camData.transition.targetRotationX,
              camData.transition.targetRotationY,
              camData.transition.targetDistance,
              camData.transition.targetOffsetX,
              camData.transition.targetOffsetY
            );
            // Match the transition state (progress, duration) from primary
            ZM.camera.transition.duration = camData.transition.duration;
            ZM.camera.transition.progress = camData.transition.progress;
            ZM.camera.transition.isActive = true;
            
            // Set current position to primary's current position
            ZM.camera.rotationX = camData.rotationX;
            ZM.camera.rotationY = camData.rotationY;
            ZM.camera.distance = camData.distance;
            ZM.camera.offsetX = camData.offsetX;
            ZM.camera.offsetY = camData.offsetY;
            
            console.log(`📥 Syncing camera transition: progress=${(camData.transition.progress * 100).toFixed(1)}%`);
          } else {
            // Primary is NOT transitioning - snap to current values
            ZM.camera.rotationX = camData.rotationX;
            ZM.camera.rotationY = camData.rotationY;
            ZM.camera.distance = camData.distance;
            ZM.camera.offsetX = camData.offsetX;
            ZM.camera.offsetY = camData.offsetY;
            
            // Disable any active transition
            ZM.camera.transition.isActive = false;
            ZM.camera.transition.progress = 1.0;
          }
          
          // Always update params to match
          ZM.params.cameraRotationX = camData.rotationX;
          ZM.params.cameraRotationY = camData.rotationY;
          ZM.params.cameraDistance = camData.distance;
          ZM.params.cameraOffsetX = camData.offsetX;
          ZM.params.cameraOffsetY = camData.offsetY;
        } else if (ZM.camera) {
          // Fallback: sync from params if camera data not provided
          ZM.camera.syncFromParams(ZM.params);
          ZM.camera.transition.isActive = false;
          ZM.camera.transition.progress = 1.0;
        }
        
        // Update geometry scale transition - if primary is transitioning, start transition; otherwise snap
        if (event.data.geometryScaleTransition && ZM.geometryScaleTransition) {
          const trans = event.data.geometryScaleTransition;
          
          // Check if primary window is transitioning
          if (trans.isTransitioning) {
            // Primary is transitioning - start matching transition in display
            ZM.geometryScaleTransition.start = trans.start;
            ZM.geometryScaleTransition.target = trans.target;
            ZM.geometryScaleTransition.current = trans.current;
            ZM.geometryScaleTransition.progress = trans.progress;
            ZM.geometryScaleTransition.duration = trans.duration;
            ZM.geometryScaleTransition.isTransitioning = true;
            
            if (!initialSyncReceived) {
              console.log(`📊 Syncing geometry transition: ${trans.current.toFixed(1)} → ${trans.target.toFixed(1)} (${(trans.progress * 100).toFixed(1)}%)`);
            }
          } else {
            // Primary is NOT transitioning - snap to current value
            ZM.geometryScaleTransition.current = trans.current;
            ZM.geometryScaleTransition.target = trans.current;
            ZM.geometryScaleTransition.start = trans.current;
            ZM.geometryScaleTransition.progress = 1.0;
            ZM.geometryScaleTransition.isTransitioning = false;
          }
        } else if (ZM.geometryScaleTransition && params.geometryScale !== undefined) {
          // Fallback: snap to param value if transition data not provided
          ZM.geometryScaleTransition.current = params.geometryScale;
          ZM.geometryScaleTransition.target = params.geometryScale;
          ZM.geometryScaleTransition.start = params.geometryScale;
          ZM.geometryScaleTransition.progress = 1.0;
          ZM.geometryScaleTransition.isTransitioning = false;
        }
        
        // Update emitter rotation transition - if primary is transitioning, start transition; otherwise snap
        if (event.data.emitterRotationTransition && ZM.emitterRotationTransition) {
          const trans = event.data.emitterRotationTransition;
          
          // Check if primary window is transitioning
          if (trans.isTransitioning) {
            // Primary is transitioning - start matching transition in display
            ZM.emitterRotationTransition.start = trans.start;
            ZM.emitterRotationTransition.target = trans.target;
            ZM.emitterRotationTransition.current = trans.current;
            ZM.emitterRotationTransition.progress = trans.progress;
            ZM.emitterRotationTransition.duration = trans.duration;
            ZM.emitterRotationTransition.isTransitioning = true;
          } else {
            // Primary is NOT transitioning - snap to current value
            ZM.emitterRotationTransition.current = trans.current;
            ZM.emitterRotationTransition.target = trans.current;
            ZM.emitterRotationTransition.start = trans.current;
            ZM.emitterRotationTransition.progress = 1.0;
            ZM.emitterRotationTransition.isTransitioning = false;
          }
        } else if (ZM.emitterRotationTransition && params.emitterRotation !== undefined) {
          // Fallback: snap to param value if transition data not provided
          ZM.emitterRotationTransition.current = params.emitterRotation;
          ZM.emitterRotationTransition.target = params.emitterRotation;
          ZM.emitterRotationTransition.start = params.emitterRotation;
          ZM.emitterRotationTransition.progress = 1.0;
          ZM.emitterRotationTransition.isTransitioning = false;
        }
        
        // Update FOV transition - if primary is transitioning, start transition; otherwise snap
        if (event.data.fovTransition && ZM.fovTransition) {
          const trans = event.data.fovTransition;
          
          // Check if primary window is transitioning
          if (trans.isTransitioning) {
            // Primary is transitioning - start matching transition in display
            ZM.fovTransition.start = trans.start;
            ZM.fovTransition.target = trans.target;
            ZM.fovTransition.current = trans.current;
            ZM.fovTransition.progress = trans.progress;
            ZM.fovTransition.duration = trans.duration;
            ZM.fovTransition.isTransitioning = true;
          } else {
            // Primary is NOT transitioning - snap to current value
            ZM.fovTransition.current = trans.current;
            ZM.fovTransition.target = trans.current;
            ZM.fovTransition.start = trans.current;
            ZM.fovTransition.progress = 1.0;
            ZM.fovTransition.isTransitioning = false;
          }
        } else if (ZM.fovTransition && params.fov !== undefined) {
          // Fallback: snap to param value if transition data not provided
          ZM.fovTransition.current = params.fov;
          ZM.fovTransition.target = params.fov;
          ZM.fovTransition.start = params.fov;
          ZM.fovTransition.progress = 1.0;
          ZM.fovTransition.isTransitioning = false;
        }
        
        // Update background color transition - if primary is transitioning, start transition; otherwise snap
        if (event.data.bgTransition && ZM.bgTransition) {
          const trans = event.data.bgTransition;
          
          // Check if primary window is transitioning
          if (trans.isTransitioning) {
            // Primary is transitioning - start matching transition in display
            ZM.bgTransition.start = [...trans.start];
            ZM.bgTransition.target = [...trans.target];
            ZM.bgTransition.current = [...trans.current];
            ZM.bgTransition.progress = trans.progress;
            ZM.bgTransition.isTransitioning = true;
          } else {
            // Primary is NOT transitioning - snap to current value
            ZM.bgTransition.current = [...trans.current];
            ZM.bgTransition.target = [...trans.current];
            ZM.bgTransition.start = [...trans.current];
            ZM.bgTransition.progress = 1.0;
            ZM.bgTransition.isTransitioning = false;
          }
        }

        // Sync UI if it exists
        if (ZM.syncUIFromParams) {
          ZM.syncUIFromParams();
        }

        // Detect palette changes and trigger color transitions on existing lines
        // Compare current palette state with previous to avoid unnecessary transitions
        const currentPaletteState = {
          activePaletteIndex: params.activePaletteIndex,
          palettes: JSON.stringify(params.palettes) // Stringify for comparison
        };
        
        const paletteChanged = previousPaletteState && (
          previousPaletteState.activePaletteIndex !== currentPaletteState.activePaletteIndex ||
          previousPaletteState.palettes !== currentPaletteState.palettes
        );
        
        if (paletteChanged && ZM.triggerPaletteChange && ZM.sketchReady) {
          // Palette has changed - transition existing lines to new colors
          ZM.triggerPaletteChange();
        }
        
        // Update previous palette state for next comparison
        previousPaletteState = currentPaletteState;

        if (!initialSyncReceived) {
          initialSyncReceived = true;
          console.log('✓ Initial sync complete');
          resolve();
        }

      } else if (type === 'delta-sync') {
        // Apply only changed parameters
        const transitionParams = new Set(['cameraRotationX', 'cameraRotationY', 'cameraDistance', 
                                          'cameraOffsetX', 'cameraOffsetY', 'fov', 
                                          'geometryScale', 'emitterRotation']);
        
        const hasTransitionParams = Object.keys(changes).some(k => transitionParams.has(k));
        
        // Capture old speed values BEFORE Object.assign (for line speed updates)
        const oldSpeed = 'speed' in changes ? ZM.params.speed : null;
        
        Object.assign(ZM.params, changes);
        
        // Debug log for color transition duration changes
        if (changes.colorTransitionDuration !== undefined) {
          console.log(`🎨 Color transition duration synced: ${changes.colorTransitionDuration}s (was: ${ZM.params.colorTransitionDuration}s)`);
        }
        
        // Re-initialize color RNG if seed changed (ensures all windows stay in sync)
        if (changes.colorRandomSeed !== undefined) {
          console.log(`🎲 Color RNG seed synced: ${changes.colorRandomSeed}`);
          initColorRNG(changes.colorRandomSeed);
        }

        // ONLY update camera/geometry if transition params are present (instant changes)
        if (hasTransitionParams) {
          // Update camera if camera params changed (snap instantly, no transitions)
          const cameraParams = ['cameraRotationX', 'cameraRotationY', 'cameraDistance', 'cameraOffsetX', 'cameraOffsetY', 'fov'];
          if (cameraParams.some(param => param in changes) && ZM.camera) {
            // Handle FOV changes (snap to value, no transition)
            if ('fov' in changes && ZM.fovTransition) {
              ZM.fovTransition.current = changes.fov;
              ZM.fovTransition.target = changes.fov;
              ZM.fovTransition.start = changes.fov;
              ZM.fovTransition.progress = 1.0;
              ZM.fovTransition.isTransitioning = false;
            }
            
            // Handle camera rotation changes (snap instantly)
            if ('cameraRotationX' in changes) {
              ZM.camera.rotationX = changes.cameraRotationX;
            }
            if ('cameraRotationY' in changes) {
              ZM.camera.rotationY = changes.cameraRotationY;
            }
            
            // Handle camera distance changes (snap instantly)
            if ('cameraDistance' in changes) {
              ZM.camera.distance = changes.cameraDistance;
            }
            
            // Handle camera offset changes (snap instantly)
            if ('cameraOffsetX' in changes) {
              ZM.camera.offsetX = changes.cameraOffsetX;
            }
            if ('cameraOffsetY' in changes) {
              ZM.camera.offsetY = changes.cameraOffsetY;
            }
            
            // Cancel any active camera transition
            ZM.camera.transition.isActive = false;
            ZM.camera.transition.progress = 1.0;
          }
          
          // Update geometry scale transition (snap to current value, cancel transition)
          if ('geometryScale' in changes && ZM.geometryScaleTransition) {
            ZM.geometryScaleTransition.current = changes.geometryScale;
            ZM.geometryScaleTransition.target = changes.geometryScale;
            ZM.geometryScaleTransition.start = changes.geometryScale;
            ZM.geometryScaleTransition.progress = 1.0;
            ZM.geometryScaleTransition.isTransitioning = false;
          }
          
          // Update emitter rotation transition (snap to current value, cancel transition)
          if ('emitterRotation' in changes && ZM.emitterRotationTransition) {
            ZM.emitterRotationTransition.current = changes.emitterRotation;
            ZM.emitterRotationTransition.target = changes.emitterRotation;
            ZM.emitterRotationTransition.start = changes.emitterRotation;
            ZM.emitterRotationTransition.progress = 1.0;
            ZM.emitterRotationTransition.isTransitioning = false;
          }
        }  // End hasTransitionParams block

      // Always update palette if palette params changed (not transition-related)
      const paletteParams = ['activePaletteIndex', 'palettes', 'backgroundColor'];
      if (paletteParams.some(param => param in changes)) {
        console.log(`🎨 Palette params changed:`, Object.keys(changes).filter(k => paletteParams.includes(k)));
        if (ZM.triggerPaletteChange && ZM.sketchReady) {
          console.log(`   ✓ Triggering palette change on display window`);
          ZM.triggerPaletteChange();
          
          // Update previousPaletteState to track this change
          previousPaletteState = {
            activePaletteIndex: ZM.params.activePaletteIndex,
            palettes: JSON.stringify(ZM.params.palettes)
          };
        } else if (!ZM.sketchReady) {
          console.log(`   ⚠️ Sketch not ready yet, palette change deferred`);
        }
      }
      
      // Always update transition durations when changed
      if ('stateTransitionDuration' in changes) {
        if (ZM.geometryScaleTransition) {
          ZM.geometryScaleTransition.duration = changes.stateTransitionDuration;
        }
        if (ZM.emitterRotationTransition) {
          ZM.emitterRotationTransition.duration = changes.stateTransitionDuration;
        }
        if (ZM.fovTransition) {
          ZM.fovTransition.duration = changes.stateTransitionDuration;
        }
        if (ZM.camera && ZM.camera.transition) {
          ZM.camera.transition.duration = changes.stateTransitionDuration;
        }
      }
      
      if ('colorTransitionDuration' in changes) {
        // Color transition duration is used in palette transitions
        // The duration is read from ZM.params.colorTransitionDuration when needed
      }
      
      // Update line base speeds when speed or ambientSpeedMaster changes
      if ('speed' in changes || 'ambientSpeedMaster' in changes) {
        if (ZM.emitterInstance && ZM.emitterInstance.lines) {
          // Recalculate baseVy for all existing lines if speed changed
          if ('speed' in changes && oldSpeed !== null && oldSpeed !== 0) {
            const speedRatio = changes.speed / oldSpeed;
            
            for (const line of ZM.emitterInstance.lines) {
              // Adjust baseVy proportionally to speed change
              line.baseVy *= speedRatio;
            }
            console.log(`🏃 Updated ${ZM.emitterInstance.lines.length} line base speeds (${oldSpeed} → ${changes.speed})`);
          }
          // ambientSpeedMaster is applied dynamically in line.update(), no adjustment needed
          if ('ambientSpeedMaster' in changes) {
            console.log(`🌍 Ambient speed master synced: ${changes.ambientSpeedMaster}% (affects ${ZM.emitterInstance.lines.length} lines)`);
          }
        }
      }

      // Handle specific param updates
      if ('overlayImageSrc' in changes || 'overlayVisible' in changes) {
        // Overlay changes are handled automatically by params
      }
      
      // Update overlay if overlay params changed
      if (ZM.updateOverlay && ('overlayX' in changes || 'overlayY' in changes || 
          'overlayScale' in changes || 'overlayOpacity' in changes || 
          'overlayRotation' in changes || 'overlayImageSrc' in changes || 
          'overlayVisible' in changes)) {
          ZM.updateOverlay();
        }
      
      } else if (type === 'state-load') {
        // NEW: Handle state load - use same restoreState() logic as main window
        const { state, instant } = event.data;
        
        console.log(`📥 Display window: Received state-load: ${state?.name} instant: ${instant}`);
        console.log(`   State colorTransitionDuration: ${state?.params?.colorTransitionDuration}s`);
        console.log(`   Current ZM.params.colorTransitionDuration: ${ZM.params.colorTransitionDuration}s`);
        
        if (ZM.stateManager && ZM.stateManager.restoreState && state) {
          console.log('📥 Display window: Calling restoreState()...');
          // Call the exact same restoreState function as main window
          // This ensures perfect synchronization of all transitions
          ZM.stateManager.restoreState(state, instant);
          console.log('✅ Display window: restoreState() completed');
        }
      
      } else if (type === 'cancel-transitions') {
        // Cancel all active transitions when manual mouse control starts (from any window)
        if (ZM.camera && ZM.camera.transition) {
          ZM.camera.transition.isActive = false;
          ZM.camera.transition.progress = 1.0;
        }
        if (ZM.geometryScaleTransition && ZM.geometryScaleTransition.isTransitioning) {
          ZM.geometryScaleTransition.isTransitioning = false;
        }
        if (ZM.fovTransition && ZM.fovTransition.isTransitioning) {
          ZM.fovTransition.isTransitioning = false;
        }
        if (ZM.emitterRotationTransition && ZM.emitterRotationTransition.isTransitioning) {
          ZM.emitterRotationTransition.isTransitioning = false;
        }
      
      } else if (type === 'camera-immediate') {
        // NEW: Handle immediate camera update (manual mouse control - real-time)
        const { state } = event.data;
        
        if (ZM.camera && state) {
          // Snap instantly to new position
          ZM.camera.rotationX = state.rotationX;
          ZM.camera.rotationY = state.rotationY;
          ZM.camera.distance = state.distance;
          ZM.camera.offsetX = state.offsetX;
          ZM.camera.offsetY = state.offsetY;
          
          // Cancel any active transition
          ZM.camera.transition.isActive = false;
          ZM.camera.transition.progress = 1.0;
          
          // Update params
          ZM.params.cameraRotationX = state.rotationX;
          ZM.params.cameraRotationY = state.rotationY;
          ZM.params.cameraDistance = state.distance;
          ZM.params.cameraOffsetX = state.offsetX;
          ZM.params.cameraOffsetY = state.offsetY;
          
          // Handle emitter rotation if included (for Z-rotation control)
          if (state.emitterRotation !== undefined && ZM.emitterRotationTransition) {
            ZM.emitterRotationTransition.current = state.emitterRotation;
            ZM.emitterRotationTransition.target = state.emitterRotation;
            ZM.emitterRotationTransition.start = state.emitterRotation;
            ZM.emitterRotationTransition.progress = 1.0;
            ZM.emitterRotationTransition.isTransitioning = false;
            ZM.params.emitterRotation = state.emitterRotation;
          }
        }
      }
    };

    // Request initial state from primary window (retry until we get response)
    console.log('📡 Requesting initial state from primary window...');
    
    let retryCount = 0;
    const maxRetries = 20; // 20 retries = ~10 seconds
    const retryInterval = setInterval(() => {
      if (initialSyncReceived) {
        clearInterval(retryInterval);
        return;
      }
      
      retryCount++;
      console.log(`📡 Requesting state (attempt ${retryCount}/${maxRetries})...`);
      channel.postMessage({ type: 'display-ready' });
      
      if (retryCount >= maxRetries) {
        clearInterval(retryInterval);
        console.error('❌ No response from primary window. Is the primary window open?');
        reject(new Error('Primary window not responding'));
      }
    }, 500); // Retry every 500ms

    // Store sync functions in ZM
    ZM.windowSync = {
      channel,
      close: () => {
        clearInterval(retryInterval);
        channel.close();
        console.log('🖥️ Display window sync closed');
      },
      isPrimary: false
    };
  });
}

/**
 * Open display window with sequential ID
 * @returns {Window} Reference to opened window
 */
export function openDisplayWindow() {
  // Generate sequential display ID
  displayWindowCounter++;
  const displayId = `display-${displayWindowCounter}`;
  
  // Open display window with ID in URL and as window name
  // Using ID as window name prevents duplicate windows with same ID
  const displayWindow = window.open(
    `display.html?id=${displayId}`,
    displayId,
    'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=yes'
  );

  if (displayWindow) {
    console.log(`🪟 Display window opened: ${displayId}`);
  } else {
    console.error('❌ Failed to open display window (popup blocked?)');
  }

  return displayWindow;
}
