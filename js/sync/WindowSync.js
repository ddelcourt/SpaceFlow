/**
 * WindowSync — Multi-window synchronization using BroadcastChannel API
 * Allows a display window to mirror the primary window's rendering
 */

const CHANNEL_NAME = 'zigmap26-sync';
const SYNC_THROTTLE_MS = 16; // ~60fps max

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

  // Listen for ready messages from display windows
  channel.onmessage = (event) => {
    if (event.data.type === 'display-ready') {
      console.log('🖥️ Display window connected, sending full state...');
      sendFullState();
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
          startRotationX: ZM.camera.transition.startRotationX,
          startRotationY: ZM.camera.transition.startRotationY,
          startDistance: ZM.camera.transition.startDistance,
          startOffsetX: ZM.camera.transition.startOffsetX,
          startOffsetY: ZM.camera.transition.startOffsetY,
          targetRotationX: ZM.camera.transition.targetRotationX,
          targetRotationY: ZM.camera.transition.targetRotationY,
          targetDistance: ZM.camera.transition.targetDistance,
          targetOffsetX: ZM.camera.transition.targetOffsetX,
          targetOffsetY: ZM.camera.transition.targetOffsetY,
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
        console.log('📤 Synced params:', Object.keys(pendingUpdates).join(', '));
        
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
        }
        
        // Update all params
        Object.assign(ZM.params, params);
        
        // Update noise offset
        if (noiseOffset !== undefined) {
          ZM.noiseOffset = noiseOffset;
        }

        // Update camera state - snap to current values (no independent transitions)
        if (event.data.camera && ZM.camera) {
          const camData = event.data.camera;
          
          // Set current camera values (use primary's current position)
          ZM.camera.rotationX = camData.rotationX;
          ZM.camera.rotationY = camData.rotationY;
          ZM.camera.distance = camData.distance;
          ZM.camera.offsetX = camData.offsetX;
          ZM.camera.offsetY = camData.offsetY;
          
          // Disable camera transitions in display window
          ZM.camera.transition.isActive = false;
          ZM.camera.transition.progress = 1.0;
        } else if (ZM.camera) {
          // Fallback: sync from params if camera data not provided
          ZM.camera.syncFromParams(ZM.params);
          ZM.camera.transition.isActive = false;
          ZM.camera.transition.progress = 1.0;
        }
        
        // Update geometry scale transition - snap to current value (no independent transitions)
        if (event.data.geometryScaleTransition && ZM.geometryScaleTransition) {
          const trans = event.data.geometryScaleTransition;
          // Use the primary window's CURRENT value for rendering
          ZM.geometryScaleTransition.current = trans.current;
          ZM.geometryScaleTransition.target = trans.current;  // Set target = current to prevent display from re-interpolating
          ZM.geometryScaleTransition.start = trans.current;
          ZM.geometryScaleTransition.progress = 1.0;
          ZM.geometryScaleTransition.isTransitioning = false; // Never run transition logic in display window
          
          // Debug: log if we're receiving transition updates
          if (trans.isTransitioning && !initialSyncReceived) {
            console.log(`📊 Display receiving transition: geometryScale = ${trans.current.toFixed(1)} (primary transitioning: ${trans.isTransitioning})`);
          }
        } else if (ZM.geometryScaleTransition && params.geometryScale !== undefined) {
          // Fallback: snap to param value if transition data not provided
          ZM.geometryScaleTransition.current = params.geometryScale;
          ZM.geometryScaleTransition.target = params.geometryScale;
          ZM.geometryScaleTransition.start = params.geometryScale;
          ZM.geometryScaleTransition.progress = 1.0;
          ZM.geometryScaleTransition.isTransitioning = false;
        }
        
        // Update emitter rotation transition - snap to current value (no independent transitions)
        if (event.data.emitterRotationTransition && ZM.emitterRotationTransition) {
          const trans = event.data.emitterRotationTransition;
          // Use the primary window's CURRENT value, not start a new transition
          ZM.emitterRotationTransition.current = trans.current;
          ZM.emitterRotationTransition.target = trans.current;  // Set target = current to prevent transitioning
          ZM.emitterRotationTransition.start = trans.current;
          ZM.emitterRotationTransition.progress = 1.0;
          ZM.emitterRotationTransition.isTransitioning = false; // Never transition in display window
        } else if (ZM.emitterRotationTransition && params.emitterRotation !== undefined) {
          // Fallback: snap to param value if transition data not provided
          ZM.emitterRotationTransition.current = params.emitterRotation;
          ZM.emitterRotationTransition.target = params.emitterRotation;
          ZM.emitterRotationTransition.start = params.emitterRotation;
          ZM.emitterRotationTransition.progress = 1.0;
          ZM.emitterRotationTransition.isTransitioning = false;
        }
        
        // Update FOV transition - snap to current value (no independent transitions)
        if (event.data.fovTransition && ZM.fovTransition) {
          const trans = event.data.fovTransition;
          // Use the primary window's CURRENT value, not start a new transition
          ZM.fovTransition.current = trans.current;
          ZM.fovTransition.target = trans.current;  // Set target = current to prevent transitioning
          ZM.fovTransition.start = trans.current;
          ZM.fovTransition.progress = 1.0;
          ZM.fovTransition.isTransitioning = false; // Never transition in display window
        } else if (ZM.fovTransition && params.fov !== undefined) {
          // Fallback: snap to param value if transition data not provided
          ZM.fovTransition.current = params.fov;
          ZM.fovTransition.target = params.fov;
          ZM.fovTransition.start = params.fov;
          ZM.fovTransition.progress = 1.0;
          ZM.fovTransition.isTransitioning = false;
        }
        
        // Update background color transition - snap to current value (no independent transitions)
        if (event.data.bgTransition && ZM.bgTransition) {
          const trans = event.data.bgTransition;
          // Use the primary window's CURRENT color, not start a new transition
          ZM.bgTransition.current = [...trans.current];
          ZM.bgTransition.target = [...trans.current];  // Set target = current to prevent transitioning
          ZM.bgTransition.start = [...trans.current];
          ZM.bgTransition.progress = 1.0;
          ZM.bgTransition.isTransitioning = false; // Never transition in display window
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
          console.log('🎨 Palette changed in display window - transitioning existing lines');
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
        Object.assign(ZM.params, changes);
        console.log('📥 Synced params:', Object.keys(changes).join(', '));

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

        // Update palette if palette params changed
        const paletteParams = ['activePaletteIndex', 'palettes', 'backgroundColor'];
        if (paletteParams.some(param => param in changes)) {
          if (ZM.triggerPaletteChange && ZM.sketchReady) {
            ZM.triggerPaletteChange();
          }
        }
        
        // Update geometry scale transition (snap to current value, no transition)
        if ('geometryScale' in changes && ZM.geometryScaleTransition) {
          ZM.geometryScaleTransition.current = changes.geometryScale;
          ZM.geometryScaleTransition.target = changes.geometryScale;
          ZM.geometryScaleTransition.start = changes.geometryScale;
          ZM.geometryScaleTransition.progress = 1.0;
          ZM.geometryScaleTransition.isTransitioning = false;
        }
        
        // Update emitter rotation transition (snap to current value, no transition)
        if ('emitterRotation' in changes && ZM.emitterRotationTransition) {
          ZM.emitterRotationTransition.current = changes.emitterRotation;
          ZM.emitterRotationTransition.target = changes.emitterRotation;
          ZM.emitterRotationTransition.start = changes.emitterRotation;
          ZM.emitterRotationTransition.progress = 1.0;
          ZM.emitterRotationTransition.isTransitioning = false;
        }
        
        // Update transition durations when changed
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
 * Open display window
 * @returns {Window} Reference to opened window
 */
export function openDisplayWindow() {
  // Open display window with minimal chrome
  // Note: Modern browsers may ignore these features for security reasons
  const displayWindow = window.open(
    'display.html',
    'zigmap26-display',
    'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=yes'
  );

  if (displayWindow) {
    console.log('🪟 Display window opened');
  } else {
    console.error('❌ Failed to open display window (popup blocked?)');
  }

  return displayWindow;
}
