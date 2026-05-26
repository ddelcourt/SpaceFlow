// ═══════════════════════════════════════════════════════════════════════════
// SPACEFLOW - Camera State
// Camera position, rotation, and interaction state
// ═══════════════════════════════════════════════════════════════════════════

export class Camera {
  constructor(params) {
    this.params = params; // Store reference to params for dynamic transition duration
    this.rotationX = params.cameraRotationX;
    this.rotationY = params.cameraRotationY;
    this.distance = params.cameraDistance;
    this.offsetX = params.cameraOffsetX ||  0;
    this.offsetY = params.cameraOffsetY || 0;
    this.isDragging = false;
    this.isPanning = false;
    this.isRotating = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    // Camera transition state
    this.transition = {
      isActive: false,
      progress: 1.0,
      duration: params.stateTransitionDuration, // Use parameter instead of hardcoded value
      start: {
        rotationX: this.rotationX,
        rotationY: this.rotationY,
        distance: this.distance,
        offsetX: this.offsetX,
        offsetY: this.offsetY
      },
      target: {
        rotationX: this.rotationX,
        rotationY: this.rotationY,
        distance: this.distance,
        offsetX: this.offsetX,
        offsetY: this.offsetY
      }
    };
  }

  /**
   * Start transitioning camera to new position
   */
  transitionTo(targetRotationX, targetRotationY, targetDistance, targetOffsetX, targetOffsetY) {
    this.transition.start = {
      rotationX: this.rotationX,
      rotationY: this.rotationY,
      distance: this.distance,
      offsetX: this.offsetX,
      offsetY: this.offsetY
    };
    
    // Normalize target angles to ensure shortest path
    this.transition.target = {
      rotationX: this.normalizeAngleForTransition(this.rotationX, targetRotationX),
      rotationY: this.normalizeAngleForTransition(this.rotationY, targetRotationY),
      distance: targetDistance,
      offsetX: targetOffsetX,
      offsetY: targetOffsetY
    };
    
    // Use current transition duration from params
    this.transition.duration = this.params.stateTransitionDuration;
    this.transition.progress = 0.0;
    this.transition.isActive = true;
  }

  /**
   * Update camera transition
   */
  updateTransition(dt) {
    if (!this.transition.isActive) return;
    
    this.transition.progress += dt / this.transition.duration;
    
    if (this.transition.progress >= 1.0) {
      // Snap to final values
      this.transition.progress = 1.0;
      this.rotationX = this.transition.target.rotationX;
      this.rotationY = this.transition.target.rotationY;
      this.distance = this.transition.target.distance;
      this.offsetX = this.transition.target.offsetX;
      this.offsetY = this.transition.target.offsetY;
      this.transition.isActive = false;
    } else {
      // Smooth easing (ease-in-out)
      const t = this.easeInOutCubic(this.transition.progress);
      
      this.rotationX = this.lerp(this.transition.start.rotationX, this.transition.target.rotationX, t);
      this.rotationY = this.lerp(this.transition.start.rotationY, this.transition.target.rotationY, t);
      this.distance = this.lerp(this.transition.start.distance, this.transition.target.distance, t);
      this.offsetX = this.lerp(this.transition.start.offsetX, this.transition.target.offsetX, t);
      this.offsetY = this.lerp(this.transition.start.offsetY, this.transition.target.offsetY, t);
    }
  }

  /**
   * Linear interpolation
   */
  lerp(start, end, t) {
    return start + (end - start) * t;
  }

  /**
   * Normalize target angle to ensure shortest rotation path
   * Takes the current angle and a target angle, returns normalized target
   * that is within PI of the current angle (shortest path)
   */
  normalizeAngleForTransition(current, target) {
    // Calculate the difference
    let diff = target - current;
    
    // Normalize to [-PI, PI] range for shortest path
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    
    // Return the normalized target
    return current + diff;
  }

  /**
   * Ease-in-out cubic easing function for smooth transitions
   */
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  syncToParams(params) {
    params.cameraRotationX = this.rotationX;
    params.cameraRotationY = this.rotationY;
    params.cameraDistance = this.distance;
    params.cameraOffsetX = this.offsetX;
    params.cameraOffsetY = this.offsetY;
  }

  syncFromParams(params) {
    this.rotationX = params.cameraRotationX;
    this.rotationY = params.cameraRotationY;
    this.distance = params.cameraDistance;
    this.offsetX = params.cameraOffsetX || 0;
    this.offsetY = params.cameraOffsetY || 0;
  }

  reset() {
    this.rotationX = -0.3;
    this.rotationY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  resetZoom() {
    this.distance = 600;
  }
}
