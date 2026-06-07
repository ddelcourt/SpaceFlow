// ═══════════════════════════════════════════════════════════════════════════
// SPACEFLOW - Debug Logger
// Centralized logging system with category-based filtering
// ═══════════════════════════════════════════════════════════════════════════

import { DEBUG } from '../config/constants.js';

/**
 * Conditional console.log wrapper - logs only if debug flags are enabled.
 * 
 * @param {string} category - Debug category (PRESETS, KEYBOARD, EXPORTS, STATES)
 * @param {...any} args - Arguments to pass to console.log
 */
export function debugLog(category, ...args) {
  if (!DEBUG.ENABLED) return;
  if (!DEBUG[category]) return;
  console.log(...args);
}

/**
 * Conditional console.warn wrapper - always shows warnings regardless of category.
 * 
 * @param {...any} args - Arguments to pass to console.warn
 */
export function debugWarn(...args) {
  if (!DEBUG.ENABLED) return;
  console.warn(...args);
}

/**
 * Conditional console.error wrapper - always shows errors (even if DEBUG.ENABLED = false).
 * 
 * @param {...any} args - Arguments to pass to console.error
 */
export function debugError(...args) {
  console.error(...args);
}

/**
 * Legacy compatibility - direct replacement for console.log without category.
 * Uses ENABLED flag only. Use debugLog() with category for better control.
 * 
 * @param {...any} args - Arguments to pass to console.log
 */
export function log(...args) {
  if (DEBUG.ENABLED) {
    console.log(...args);
  }
}
