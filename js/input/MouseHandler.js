/**
 * MouseHandler — Camera controls via mouse interaction
 */

export function setupMouseHandlers(ZM) {
  const container = document.getElementById('canvas-container');
  
  // Throttle camera broadcasts during mouse movements (every 32ms = ~30fps)
  let lastCameraBroadcast = 0;
  const CAMERA_BROADCAST_THROTTLE = 32;
  
  function broadcastCameraState() {
    const now = Date.now();
    if (now - lastCameraBroadcast < CAMERA_BROADCAST_THROTTLE) return;
    
    if (ZM.windowSync && ZM.windowSync.broadcastParamChanges) {
      ZM.windowSync.broadcastParamChanges({
        cameraRotationX: ZM.params.cameraRotationX,
        cameraRotationY: ZM.params.cameraRotationY,
        cameraDistance: ZM.params.cameraDistance,
        cameraOffsetX: ZM.params.cameraOffsetX,
        cameraOffsetY: ZM.params.cameraOffsetY
      });
      lastCameraBroadcast = now;
    }
  }
  
  // Mouse down
  container.addEventListener('mousedown', (e) => {
    // Cancel any active camera transition
    if (ZM.camera.transition.isActive) {
      ZM.camera.transition.isActive = false;
    }
    
    if (e.button === 0) {
      ZM.camera.isDragging = true;
      ZM.camera.isPanning = false;
      ZM.camera.lastMouseX = e.clientX;
      ZM.camera.lastMouseY = e.clientY;
    } else if (e.button === 1) {
      // Middle click: recenter 2D offset only, keep orbit intact
      ZM.camera.transitionTo(
        ZM.camera.rotationX,
        ZM.camera.rotationY,
        ZM.camera.distance,
        0, 0
      );
      ZM.params.cameraOffsetX = 0;
      ZM.params.cameraOffsetY = 0;
      ZM.saveToLocalStorage();
      e.preventDefault(); // prevent browser auto-scroll cursor
    } else if (e.button === 2) {
      ZM.camera.isPanning = true;
      ZM.camera.isDragging = false;
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
      
      // Broadcast camera changes during drag (throttled)
      broadcastCameraState();
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
      
      // Broadcast camera changes during pan (throttled)
      broadcastCameraState();
    }
  });
  
  // Mouse up
  window.addEventListener('mouseup', () => {
    ZM.camera.isDragging = false;
    ZM.camera.isPanning = false;
    // No need to broadcast on mouseup - we're already broadcasting during movement
  });
  
  // Prevent context menu on right-click
  container.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  // Mouse wheel for zoom
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    // Cancel any active camera transition
    if (ZM.camera.transition.isActive) {
      ZM.camera.transition.isActive = false;
    }
    
    const delta = e.deltaY;
    const zoomSpeed = 2;
    
    ZM.camera.distance += delta * zoomSpeed;
    ZM.camera.distance = Math.max(50, Math.min(10000, ZM.camera.distance));
    
    ZM.params.cameraDistance = ZM.camera.distance;
    ZM.saveToLocalStorage();
    
    // Broadcast camera distance to display window (throttled)
    broadcastCameraState();
  }, { passive: false });
}
