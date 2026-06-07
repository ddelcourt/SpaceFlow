/**
 * MouseHandler — Camera controls via mouse interaction
 */

import { CAMERA } from '../config/constants.js';

export function setupMouseHandlers(ZM) {
  const container = document.getElementById('canvas-container');
  
  // Throttle camera broadcasts during mouse movements for real-time sync
  // 60fps for smooth real-time manual control across display windows
  let lastCameraBroadcast = 0;
  const CAMERA_BROADCAST_THROTTLE = 17; // 60fps for real-time manual control
  
  function broadcastCameraStateRealtime() {
    const now = Date.now();
    if (now - lastCameraBroadcast < CAMERA_BROADCAST_THROTTLE) return;
    
    // Broadcast immediate camera update for real-time manual control
    if (ZM.windowSync && ZM.windowSync.broadcastCameraImmediate) {
      const state = {
        rotationX: ZM.camera.rotationX,
        rotationY: ZM.camera.rotationY,
        distance: ZM.camera.distance,
        offsetX: ZM.camera.offsetX,
        offsetY: ZM.camera.offsetY
      };
      
      // Include emitter rotation if available (for Z-rotation control)
      if (ZM.emitterRotationTransition && ZM.emitterRotationTransition.current !== undefined) {
        state.emitterRotation = ZM.emitterRotationTransition.current;
      }
      
      ZM.windowSync.broadcastCameraImmediate(state);
      lastCameraBroadcast = now;
    }
  }
  
  // Mouse down
  container.addEventListener('mousedown', (e) => {
    // Cancel any active camera transition (from state changes)
    if (ZM.camera.transition.isActive) {
      ZM.camera.transition.isActive = false;
    }
    
    // Broadcast cancellation to display windows
    if (ZM.windowSync && ZM.windowSync.channel) {
      ZM.windowSync.channel.postMessage({
        type: 'cancel-transitions',
        timestamp: Date.now()
      });
    }
    
    if (e.button === 0) {
      ZM.camera.isDragging = true;
      ZM.camera.isPanning = false;
      ZM.camera.isRotating = false;
      ZM.camera.lastMouseX = e.clientX;
      ZM.camera.lastMouseY = e.clientY;
    } else if (e.button === 1) {
      // Middle click + drag: control Z-rotation (emitterRotation)
      ZM.camera.isRotating = true;
      ZM.camera.isDragging = false;
      ZM.camera.isPanning = false;
      ZM.camera.lastMouseX = e.clientX;
      ZM.camera.lastMouseY = e.clientY;
      
      // Cancel any active emitter rotation transition
      if (ZM.emitterRotationTransition) {
        ZM.emitterRotationTransition.isTransitioning = false;
      }
      
      e.preventDefault(); // prevent browser auto-scroll cursor
    } else if (e.button === 2) {
      ZM.camera.isPanning = true;
      ZM.camera.isDragging = false;
      ZM.camera.isRotating = false;
      ZM.camera.lastMouseX = e.clientX;
      ZM.camera.lastMouseY = e.clientY;
      e.preventDefault();
    }
  });
  
  // Mouse move
  window.addEventListener('mousemove', (e) => {
    if (ZM.camera.isDragging) {
      const dx = e.clientX - ZM.camera.lastMouseX;
      const dy = e.clientY - ZM.camera.lastMouseY;
      
      ZM.camera.rotationY += dx * 0.005;
      ZM.camera.rotationX += dy * 0.005;
      
      ZM.params.cameraRotationY = ZM.camera.rotationY;
      ZM.params.cameraRotationX = ZM.camera.rotationX;
      
      ZM.camera.lastMouseX = e.clientX;
      ZM.camera.lastMouseY = e.clientY;
      
      ZM.saveToLocalStorage();
      
      // Broadcast in real-time during manual drag (throttled to 60fps)
      broadcastCameraStateRealtime();
    } else if (ZM.camera.isPanning) {
      const dx = e.clientX - ZM.camera.lastMouseX;
      const dy = e.clientY - ZM.camera.lastMouseY;
      
      // Scale mouse movement if in framebuffer mode
      // When canvas is scaled for display, mouse movements need to be scaled proportionally
      let scaledDx = dx;
      let scaledDy = dy;
      
      if (ZM.params.framebufferMode && ZM.p5Instance && ZM.p5Instance.canvas) {
        // Get canvas pixel dimensions
        const canvasW = ZM.W;
        const canvasH = ZM.H;
        
        // Get canvas CSS display dimensions
        const displayW = ZM.p5Instance.canvas.clientWidth;
        const displayH = ZM.p5Instance.canvas.clientHeight;
        
        // Calculate scale factors
        if (displayW > 0 && displayH > 0) {
          const scaleX = canvasW / displayW;
          const scaleY = canvasH / displayH;
          
          scaledDx = dx * scaleX;
          scaledDy = dy * scaleY;
        }
      }
      
      ZM.camera.offsetX += scaledDx;
      ZM.camera.offsetY += scaledDy;
      
      ZM.params.cameraOffsetX = ZM.camera.offsetX;
      ZM.params.cameraOffsetY = ZM.camera.offsetY;
      
      ZM.camera.lastMouseX = e.clientX;
      ZM.camera.lastMouseY = e.clientY;
      
      ZM.saveToLocalStorage();
      
      // Broadcast in real-time during manual pan (throttled to 60fps)
      broadcastCameraStateRealtime();
    } else if (ZM.camera.isRotating) {
      // Middle click drag: control Z-rotation (horizontal movement)
      const dx = e.clientX - ZM.camera.lastMouseX;
      
      // Update emitter rotation (horizontal movement = Z-rotation)
      ZM.emitterRotationTransition.current += dx * 0.5;
      ZM.params.emitterRotation = ZM.emitterRotationTransition.current;
      
      // Cancel transition and snap to current value
      ZM.emitterRotationTransition.target = ZM.emitterRotationTransition.current;
      ZM.emitterRotationTransition.start = ZM.emitterRotationTransition.current;
      ZM.emitterRotationTransition.progress = 1.0;
      ZM.emitterRotationTransition.isTransitioning = false;
      
      ZM.camera.lastMouseX = e.clientX;
      ZM.camera.lastMouseY = e.clientY;
      
      ZM.saveToLocalStorage();
      
      // Broadcast in real-time during manual Z-rotation (throttled to 60fps)
      broadcastCameraStateRealtime();
    }
  });
  
  // Mouse up
  window.addEventListener('mouseup', () => {
    ZM.camera.isDragging = false;
    ZM.camera.isPanning = false;
    ZM.camera.isRotating = false;
    // No need to broadcast on mouseup - already broadcasting during drag
  });
  
  // Prevent context menu on right-click
  container.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  // Mouse wheel for zoom
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    // Cancel any active camera transition (from state changes)
    if (ZM.camera.transition.isActive) {
      ZM.camera.transition.isActive = false;
    }
    
    // Broadcast cancellation to display windows (only once per scroll session)
    if (ZM.windowSync && ZM.windowSync.channel) {
      ZM.windowSync.channel.postMessage({
        type: 'cancel-transitions',
        timestamp: Date.now()
      });
    }
    
    const delta = e.deltaY;
    const zoomSpeed = 2;
    
    ZM.camera.distance += delta * zoomSpeed;
    ZM.camera.distance = Math.max(CAMERA.DISTANCE_MIN, Math.min(CAMERA.DISTANCE_MAX, ZM.camera.distance));
    
    ZM.params.cameraDistance = ZM.camera.distance;
    ZM.saveToLocalStorage();
    
    // Broadcast camera zoom immediately (real-time for manual control)
    broadcastCameraStateRealtime();
  }, { passive: false });
}
