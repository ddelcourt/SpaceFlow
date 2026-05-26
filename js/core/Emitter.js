// ═══════════════════════════════════════════════════════════════════════════
// SPACEFLOW - Emitter Class
// Manages emission and lifecycle of zigzag lines
// ═══════════════════════════════════════════════════════════════════════════

import { ZigzagLine } from './ZigzagLine.js';
import { pickRandomLineColor } from './colorUtils.js';

export class Emitter {
  constructor({
    p,
    x,
    y,
    params,
    noiseOffsetGetter,
    canvasWidth,
    canvasHeight,
    getSpawnDistanceFn,
    buildRibbonSidesFn
  }) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.params = params;
    this.getNoiseOffset = noiseOffsetGetter;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.getSpawnDistance = getSpawnDistanceFn;
    this.buildRibbonSides = buildRibbonSidesFn;
    this.lines = [];
    this.accumulator = 0;
  }

  update(dt) {
    this.accumulator += dt;
    const effectiveRate = this.params.emitRate * (this.params.ambientSpeedMaster / 100);
    const interval = 1 / effectiveRate;
    
    while (this.accumulator >= interval) {
      this.accumulator -= interval;
      this._emit();
    }
    
    for (const line of this.lines) {
      line.update(dt);
    }
    
    this.lines = this.lines.filter(l => l.alive);
  }

  _emit() {
    const noiseOffset = this.getNoiseOffset();
    
    let thickness = this.params.lineThickness;
    if (this.params.randomThickness) {
      const noiseVal = this.p.noise(noiseOffset);
      const sineVal = Math.sin(noiseOffset * 2) * 0.5 + 0.5;
      const variation = noiseVal * 0.7 + sineVal * 0.3;
      const minP = this.params.thicknessRangeMin / 100;
      const maxP = this.params.thicknessRangeMax / 100;
      thickness = this.params.lineThickness * (minP + variation * (maxP - minP));
    }

    let speed = this.params.speed;
    if (this.params.randomSpeed) {
      const noiseVal = this.p.noise(noiseOffset * 10);
      const sineVal = Math.sin(noiseOffset * 15) * 0.5 + 0.5;
      const variation = noiseVal * 0.7 + sineVal * 0.3;
      const minP = this.params.speedRangeMin / 100;
      const maxP = this.params.speedRangeMax / 100;
      speed = this.params.speed * (minP + variation * (maxP - minP));
    }
    speed *= this.params.ambientSpeedMaster / 100;

    const colorData = pickRandomLineColor(this.params);

    this.lines.push(
      new ZigzagLine({
        p: this.p,
        x: this.x,
        y: this.y,
        segmentLength: this.params.segmentLength,
        lineThickness: thickness,
        lineColor: colorData.color,
        colorSlotIndex: colorData.slotIndex,
        vy: -speed,
        canvasWidth: this.canvasWidth,
        canvasHeight: this.canvasHeight,
        params: this.params,
        getSpawnDistanceFn: this.getSpawnDistance,
        buildRibbonSidesFn: this.buildRibbonSides
      })
    );
  }

  draw(p) {
    for (const line of this.lines) {
      line.draw(p);
    }
  }
}
