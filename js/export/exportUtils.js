/**
 * Export Utilities — Shared functions for export operations
 */

import { debugLog } from '../core/debugLogger.js';

/**
 * Check if export is allowed (blocks display/player windows from exporting).
 * 
 * Display windows are meant for projection/presentation only and should not
 * perform export operations. All exports must originate from the main control window.
 * 
 * @param {Object} ZM - Main application object
 * @param {string} exportType - Type of export for logging (e.g., '📄 SVG Export', '📸 PNG Export')
 * @returns {boolean} - true if export should proceed, false if blocked
 * 
 * @example
 * export function exportSVG(ZM) {
 *   if (!canExport(ZM, '📄 SVG Export')) return;
 *   // ... export logic
 * }
 */
export function canExport(ZM, exportType = 'Export') {
  // Block display windows from exporting
  if (ZM.isDisplayMode) {
    debugLog('EXPORTS', `${exportType} blocked: display windows cannot export`);
    return false;
  }
  
  // Future extensibility: add more validation checks here
  // Example checks that could be added:
  // - if (ZM.isPlayerMode) return false; // Block player windows
  // - if (ZM.emitterInstance.lines.length === 0) return false; // No content to export
  // - if (ZM.isRecording) return false; // Don't allow exports during video recording
  
  return true;
}
