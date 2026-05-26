// ═══════════════════════════════════════════════════════════════════════════
// SPACEFLOW - Utility Functions
// Helper functions used across the application
// ═══════════════════════════════════════════════════════════════════════════

import { SEGMENTS } from '../config/constants.js';

/**
 * Calculate spawn distance for emitter based on segment length
 * @param {number} segmentLength - Length of each zigzag segment
 * @returns {number} Distance from center where lines spawn/despawn
 */
export function getSpawnDistance(segmentLength) {
  const step = segmentLength / Math.SQRT2;
  return (SEGMENTS * step) / 2;
}

/**
 * Build ribbon sides from center line points
 * Creates left and right edge vertices for a ribbon with given width
 * @param {Array} points - Center line points [{x, y}]
 * @param {number} halfWidth - Half of the ribbon width
 * @returns {Object} {leftSide, rightSide} arrays of points
 */
export function buildRibbonSides(points, halfWidth) {
  const leftSide = [];
  const rightSide = [];

  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const prev = points[i - 1];
    const next = points[i + 1];

    // Handle endpoints
    if (i === 0 || i === points.length - 1) {
      leftSide.push({ x: curr.x, y: curr.y + halfWidth });
      rightSide.push({ x: curr.x, y: curr.y - halfWidth });
      continue;
    }

    // Calculate perpendicular vectors for smooth ribbon edges
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    const perp1X = -dy1 / len1;
    const perp1Y = dx1 / len1;
    const perp2X = -dy2 / len2;
    const perp2Y = dx2 / len2;

    // Average the perpendicular vectors
    let perpX = (perp1X + perp2X) / 2;
    let perpY = (perp1Y + perp2Y) / 2;
    const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
    
    if (perpLen > 0.001) {
      perpX /= perpLen;
      perpY /= perpLen;
    } else {
      perpX = 0;
      perpY = 1;
    }

    leftSide.push({
      x: curr.x + perpX * halfWidth,
      y: curr.y + perpY * halfWidth
    });
    rightSide.push({
      x: curr.x - perpX * halfWidth,
      y: curr.y - perpY * halfWidth
    });
  }

  return { leftSide: leftSide, rightSide: rightSide };
}
