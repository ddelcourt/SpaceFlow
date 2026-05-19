// ═══════════════════════════════════════════════════════════════════════════
// ZIG MAP26 - ZigzagLine Class
// Represents a single zigzag ribbon in 3D space
// ═══════════════════════════════════════════════════════════════════════════

import { SEGMENTS } from '../config/constants.js';
import { lerpColor } from './colorUtils.js';

export class ZigzagLine {
  constructor({
    p,
    x,
    y,
    segmentLength,
    lineThickness,
    lineColor,
    colorSlotIndex,
    vy,
    canvasWidth,
    canvasHeight,
    params,
    getSpawnDistanceFn,
    buildRibbonSidesFn
  }) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.segmentLength = segmentLength;
    this.lineThickness = lineThickness;
    
    // Color transition system
    this.currentColor = [...lineColor];  // Cached display color
    this.startColor = [...lineColor];     // Start of transition
    this.targetColor = [...lineColor];    // Target of transition
    this.colorTransitionProgress = 1.0;
    this.isTransitioning = false;
    
    // Z-offset to prevent z-fighting between color slots (dynamic multiplier)
    this.colorSlotIndex = colorSlotIndex;
    this.zOffset = (colorSlotIndex - 2) * params.colorSlotZOffset;
    
    // Store BASE velocity (without ambientSpeedMaster applied)
    // Effective velocity is calculated dynamically from params.ambientSpeedMaster
    const speedMultiplier = Math.max(params.ambientSpeedMaster, 0.01) / 100; // Prevent division by zero
    this.baseVy = vy / speedMultiplier;
    this.vy = vy;
    this.params = params;
    this.segments = SEGMENTS;
    this.step = segmentLength / Math.SQRT2;
    this.totalWidth = this.segments * this.step;
    this.alive = true;
    this.age = 0;

    // Dependencies
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.getSpawnDistance = getSpawnDistanceFn;
    this.buildRibbonSides = buildRibbonSidesFn;
  }

  /**
   * Start transitioning to a new color
   */
  transitionToColor(newColor, newColorSlotIndex) {
    this.startColor = [...this.currentColor];  // Remember where we started
    this.targetColor = [...newColor];
    this.colorTransitionProgress = 0.0;
    this.isTransitioning = true;
    this._loggedDuration = false; // Reset log flag for new transition
    
    // Update z-offset if color slot changed (prevents z-fighting)
    if (newColorSlotIndex !== undefined && newColorSlotIndex !== this.colorSlotIndex) {
      this.colorSlotIndex = newColorSlotIndex;
      this.zOffset = (newColorSlotIndex - 2) * this.params.colorSlotZOffset;
    }
  }

  _buildVertices() {
    const pts = [];
    let x = -this.totalWidth / 2;
    let y = 0;
    pts.push({ x: x, y: y });
    for (let i = 0; i < this.segments; i++) {
      x += this.step;
      y += i % 2 === 0 ? this.step : -this.step;
      pts.push({ x: x, y: y });
    }
    return pts;
  }

  update(dt) {
    this.age += dt;
    
    // Recalculate effective velocity from current ambientSpeedMaster (dynamic sync)
    this.vy = this.baseVy * (this.params.ambientSpeedMaster / 100);
    
    this.y += this.vy * dt;
    const worldY = this.y - this.canvasHeight / 2;
    const dist = this.getSpawnDistance(this.segmentLength);
    if (worldY > dist || worldY < -dist) this.alive = false;
    
    // Update color transition (only if actively transitioning)
    if (this.isTransitioning) {
      const duration = this.params.colorTransitionDuration;
      
      this.colorTransitionProgress += dt / duration;
      if (this.colorTransitionProgress >= 1.0) {
        this.colorTransitionProgress = 1.0;
        this.currentColor = [...this.targetColor]; // Snap to final color
        this.isTransitioning = false; // Stop checking
      } else {
        // Cache lerped color: interpolate from start to target
        this.currentColor = lerpColor(this.startColor, this.targetColor, this.colorTransitionProgress);
      }
    }
  }

  _alpha() {
    const fadeDuration = this.params.fadeDuration;
    
    // Fade in based on age
    const fadeIn = Math.min(this.age / fadeDuration, 1);
    
    // Fade out based on time-to-boundary (distance / velocity)
    const spawnDist = this.getSpawnDistance(this.segmentLength);
    const worldY = this.y - this.canvasHeight / 2;
    const distToBoundary = Math.min(
      Math.abs(worldY - (-spawnDist)),
      Math.abs(worldY - spawnDist)
    );
    // Convert distance to time: how many seconds until reaching boundary
    const timeToBoundary = distToBoundary / Math.abs(this.vy);
    const fadeOut = Math.min(timeToBoundary / fadeDuration, 1);
    
    return Math.min(fadeIn, fadeOut);
  }

  draw(p) {
    const alpha = this._alpha() * 255;
    const { leftSide, rightSide } = this.buildRibbonSides(
      this._buildVertices(),
      this.lineThickness / 2
    );

    p.push();
    p.translate(
      this.x - this.canvasWidth / 2,
      this.y - this.canvasHeight / 2,
      0
    );
    // Use cached currentColor (updated in update())
    p.fill(...this.currentColor, alpha);
    p.noStroke();
    p.beginShape();
    for (const pt of leftSide) {
      p.vertex(pt.x, pt.y, this.zOffset);
    }
    for (let i = rightSide.length - 1; i >= 0; i--) {
      p.vertex(rightSide[i].x, rightSide[i].y, this.zOffset);
    }
    p.endShape(p.CLOSE);
    p.pop();
  }
}
