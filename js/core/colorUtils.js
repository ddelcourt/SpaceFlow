// ═══════════════════════════════════════════════════════════════════════════
// ZIGMAP26 - Color Utilities
// Helper functions for palette and color management
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// SEEDED RANDOM NUMBER GENERATOR FOR COLOR SELECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Simple seeded random number generator (Mulberry32)
 * This allows deterministic "random" color selection across synchronized windows
 * @param {number} seed - Integer seed (1-9999)
 * @returns {number} Random number between 0 and 1
 */
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Global seeded RNG state
let colorRNG = mulberry32(1); // Default seed = 1

/**
 * Initialize or reset the color RNG with a new seed
 * @param {number} seed - Integer seed (1-9999)
 */
export function initColorRNG(seed) {
  const clampedSeed = Math.max(1, Math.min(9999, Math.floor(seed)));
  colorRNG = mulberry32(clampedSeed);
  console.log(`🎨 Color RNG initialized with seed: ${clampedSeed}`);
  return clampedSeed;
}

/**
 * Get next random number from seeded color RNG
 * @returns {number} Random number between 0 and 1
 */
function nextColorRandom() {
  return colorRNG();
}

// ═══════════════════════════════════════════════════════════════════════════
// COLOR PALETTE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get background color from active palette
 * @param {Object} params - Application parameters
 * @returns {Array} RGB array [r, g, b]
 */
export function getBackgroundColor(params) {
  const palette = params.palettes[params.activePaletteIndex];
  const bgColor = palette.find(c => c.role === 'background');
  return bgColor ? [...bgColor.rgb] : [0, 0, 0]; // Default black
}

/**
 * Get all line colors from active palette
 * @param {Object} params - Application parameters
 * @returns {Array} Array of RGB arrays
 */
export function getLineColors(params) {
  const palette = params.palettes[params.activePaletteIndex];
  const lineColors = palette.filter(c => c.role === 'line').map(c => [...c.rgb]);
  return lineColors.length > 0 ? lineColors : [[255, 255, 255]]; // Default white
}

/**
 * Pick a random line color from active palette
 * Uses seeded RNG for deterministic color selection across synchronized windows
 * @param {Object} params - Application parameters
 * @returns {Object} { color: [r,g,b], slotIndex: 0-3 }
 */
export function pickRandomLineColor(params) {
  const palette = params.palettes[params.activePaletteIndex];
  const lineColorSlots = palette
    .map((c, idx) => ({ color: c, slotIndex: idx }))
    .filter(slot => slot.color.role === 'line');
  
  if (lineColorSlots.length === 0) {
    return { color: [255, 255, 255], slotIndex: 0 }; // Default white, slot 0
  }
  
  // Use seeded RNG instead of Math.random() for deterministic selection
  const picked = lineColorSlots[Math.floor(nextColorRandom() * lineColorSlots.length)];
  return { color: [...picked.color.rgb], slotIndex: picked.slotIndex };
}

/**
 * Get color for a specific slot index from active palette
 * @param {Object} params - Application parameters
 * @param {number} slotIndex - Palette slot index (0-3)
 * @returns {Array} RGB array [r, g, b]
 */
export function getColorForSlot(params, slotIndex) {
  const palette = params.palettes[params.activePaletteIndex];
  if (slotIndex >= 0 && slotIndex < palette.length) {
    return [...palette[slotIndex].rgb];
  }
  return [255, 255, 255]; // Default white
}

/**
 * Lerp between two RGB colors
 * @param {Array} from - Start RGB [r, g, b]
 * @param {Array} to - End RGB [r, g, b]
 * @param {number} t - Progress 0-1
 * @returns {Array} Interpolated RGB [r, g, b]
 */
export function lerpColor(from, to, t) {
  return [
    Math.round(from[0] + (to[0] - from[0]) * t),
    Math.round(from[1] + (to[1] - from[1]) * t),
    Math.round(from[2] + (to[2] - from[2]) * t)
  ];
}

/**
 * Trigger palette change - transitions all existing lines and background
 * 
 * ⚠️ IMPORTANT: This function should be called via the wrapper method:
 *    - Main window: ZM.triggerPaletteChange()
 *    - Display window: ZM.triggerPaletteChange()
 * 
 * This ensures ONE consistent behavior across all windows.
 * 
 * @param {Object} ZM - Global ZigMap instance
 */
export function triggerPaletteChange(ZM) {
  console.log(`🎨 triggerPaletteChange: palette=${ZM.params.activePaletteIndex}, lines=${ZM.emitterInstance?.lines.length || 0}, duration=${ZM.params.colorTransitionDuration}s`);
  
  // Transition all existing lines to their same slot index in new palette
  if (ZM.emitterInstance && ZM.emitterInstance.lines) {
    for (const line of ZM.emitterInstance.lines) {
      // Keep the line's current slot index, get the color for that slot in the new palette
      const newColor = getColorForSlot(ZM.params, line.colorSlotIndex);
      line.transitionToColor(newColor, line.colorSlotIndex);
      // Slot index stays the same, only color changes
    }
  }
  
  // Transition background
  if (ZM.bgTransition) {
    const newBg = getBackgroundColor(ZM.params);
    ZM.bgTransition.start = [...ZM.bgTransition.current];  // Remember where we started
    ZM.bgTransition.target = newBg;
    ZM.bgTransition.progress = 0.0;
    ZM.bgTransition.isTransitioning = true;
  }
}
