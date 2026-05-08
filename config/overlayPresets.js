/**
 * Overlay Presets Configuration
 * List of overlay files available in assets/overlays/ folder
 * 
 * To add new overlays:
 * 1. Convert your image to Base64 using utilities/overlay-manager.html
 * 2. Save the JSON file to assets/overlays/
 * 3. Run ./scripts/overlay-updater (or ./scripts/update-all) to update this list
 * 
 * This file is automatically updated by scripts/overlay-updater
 */

export const OVERLAY_FILES = [
  'Mapping2026_Horizontal-White.json',
  'Mapping2026_Horizontal-White_O.json',
  'Mapping2026_Horizontal-White_O_Shadow.json',
  'Mapping2026_Square-White.json',
  'Mapping2026_Vertical-White.json',
  'Mapping2026_Vertical-White_Shadow.json'
];

export const OVERLAY_FOLDER = 'assets/overlays/';
