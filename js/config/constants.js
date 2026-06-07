// ═══════════════════════════════════════════════════════════════════════════
// SPACEFLOW - Application Constants
// Centralized numeric and configuration values with detailed documentation
// ═══════════════════════════════════════════════════════════════════════════

// Original constants preserved
export const SEGMENTS = 16;
export const STORAGE_KEY = 'zigmap26Settings';

/**
 * DEBUG CONFIGURATION
 * 
 * Controls console logging behavior throughout the application.
 * Set to false in production to disable all debug logging.
 */
export const DEBUG = {
  /**
   * Master debug flag - controls all debug logging.
   * 
   * When true: Console logs are active for development/troubleshooting
   * When false: All debug logs are suppressed for clean production output
   * 
   * Individual category flags below allow fine-grained control.
   */
  ENABLED: true,
  
  /**
   * Log preset loading and project state changes.
   * Used in: main.js - preset loading, project initialization
   */
  PRESETS: true,
  
  /**
   * Log keyboard shortcuts and input handling.
   * Used in: KeyboardHandler.js - key press events, shortcut activation
   */
  KEYBOARD: true,
  
  /**
   * Log export operations (PNG, SVG, Depth, Video).
   * Used in: PNGExporter.js, SVGExporter.js, DepthExporter.js, VideoRecorder.js
   */
  EXPORTS: true,
  
  /**
   * Log state management operations (save, load, transitions).
   * Used in: StateManager.js - state capture, restoration, auto-trigger
   */
  STATES: true,
};

/**
 * UI TIMING CONSTANTS
 * 
 * These control the timing behavior of various UI interactions and animations.
 * All values are in milliseconds unless otherwise specified.
 */
export const UI_TIMING = {
  /**
   * Polling interval when waiting for UI controller to initialize.
   * 
   * Used in: main.js - updateProjectName() function
   * Context: After loading a project or preset, we need to update the project name
   * display. Since UIController may not be ready yet, we poll every 50ms until
   * ZM.updateProjectNameDisplay becomes available.
   * 
   * Why 50ms: Fast enough for imperceptible delay, but not so fast as to waste cycles.
   * Typical initialization takes 100-200ms, so 2-4 polls max.
   */
  PROJECT_NAME_UPDATE_POLL_MS: 50,

  /**
   * Duration panels stay at full opacity after being opened from the top bar.
   * 
   * Used in: main.js - top bar toggle event listeners
   * Context: When user clicks a top bar item to reveal a control panel, the panel
   * briefly stays at full opacity (class 'topbar-hovered') before returning to
   * its normal semi-transparent state. This makes it easier to see what was just opened.
   * 
   * Why 1.5 seconds: Gives user enough time to visually locate the panel and understand
   * what controls are available before opacity reduces.
   */
  PANEL_FULL_OPACITY_DURATION_MS: 1500,

  /**
   * Delay before auto-collapsing control panels when not in use.
   * 
   * Used in: main.js - Panel auto-collapse timeout
   * Context: After user stops interacting with the application, control panels
   * automatically collapse after this delay to provide an unobstructed view.
   * 
   * Why 10 seconds: Long enough that users won't be annoyed by premature collapse,
   * but short enough to keep the interface clean during extended viewing.
   */
  PANEL_AUTO_COLLAPSE_DELAY_MS: 10000,

  /**
   * Duration the main keyboard shortcuts toast stays visible before auto-dismissing.
   * 
   * Used in: main.js - showShortcutsToast() with countdown timer
   * Context: When showing the full keyboard shortcuts reference, it displays for
   * this duration before automatically closing. User can dismiss manually at any time.
   * 
   * Why 25 seconds: Long enough to read through ~20 shortcuts at comfortable pace
   * (about 1.2 seconds per shortcut), but not indefinitely blocking the view.
   */
  SHORTCUTS_TOAST_DURATION_MS: 25000,

  /**
   * Default duration for mini notification toasts at bottom of screen.
   * 
   * Used in: main.js - showMiniToast() default parameter
   * Context: Small status notifications (save confirmations, mode changes, etc.)
   * appear at bottom of screen for this duration before fading out.
   * 
   * Why 4.4 seconds: Long enough to read short messages (3-5 words) plus reaction time.
   * Odd value (4400 vs 4000 or 5000) provides distinct timing from other animations.
   */
  MINI_TOAST_DEFAULT_DURATION_MS: 4400,

  /**
   * Delay before hiding cursor in fullscreen mode after no mouse movement.
   * 
   * Used in: main.js - cursor auto-hide timeout in fullscreen
   * Context: When in fullscreen mode, the cursor hides after this period of inactivity
   * to provide immersive viewing. Any mouse movement instantly shows cursor again.
   * 
   * Why 1 second: Quick enough that cursor doesn't distract during presentations,
   * but not so fast that it disappears during slow mouse movements or pauses.
   */
  CURSOR_HIDE_DELAY_MS: 1000,
};

/**
 * EXPORT TIMING CONSTANTS
 * 
 * Delays used during export operations to ensure rendering completes before capture.
 */
export const EXPORT_TIMING = {
  /**
   * Delay before capturing depth map to ensure rendering is complete.
   * 
   * Used in: DepthExporter.js - exportDepthMap() setTimeout before renderDepthMap()
   * Context: When exporting depth map, we schedule rendering with a small delay to
   * ensure the canvas is fully updated and any pending draws are complete. This prevents
   * capturing a partially-rendered or outdated frame.
   * 
   * Why 30ms: Two frame intervals at 60fps (16.67ms each). Ensures at least one full
   * frame has rendered even if export is triggered mid-frame. Not so long that user
   * notices delay.
   */
  DEPTH_MAP_RENDER_DELAY_MS: 30,
};

/**
 * DEPTH EXPORT CONSTANTS
 * 
 * Values controlling depth map generation and grayscale conversion.
 * These affect the visual quality and dynamic range of exported depth maps.
 */
export const DEPTH_EXPORT = {
  /**
   * Minimum percentile for depth range calculation (clips extreme dark values).
   * 
   * Used in: DepthExporter.js - computeDepthRangeFromRibbons() percentile calculation
   * Context: When converting 3D depth to grayscale, we collect all ribbon depths and
   * use the 1st percentile as minimum instead of absolute minimum. This clips the
   * darkest 1% of outliers to maximize contrast on the remaining 99% of content.
   * 
   * Why 0.01 (1%): Removes extreme outliers (ribbons at near-infinite depth or
   * numerical edge cases) without affecting perceptible content. More aggressive
   * clipping (5%, 10%) would lose legitimate depth information.
   * 
   * Visual impact: Without clipping, a single far-away ribbon could compress the
   * entire depth range, making most content appear mid-gray. Clipping preserves
   * full black-to-white range for visible content.
   */
  PERCENTILE_MIN: 0.01,

  /**
   * Maximum percentile for depth range calculation (clips extreme light values).
   * 
   * Used in: DepthExporter.js - computeDepthRangeFromRibbons() percentile calculation
   * Context: Paired with PERCENTILE_MIN, this clips the brightest 1% of depth values
   * to maximize contrast on the remaining content.
   * 
   * Why 0.99 (99th percentile): Symmetric with PERCENTILE_MIN, removes the nearest
   * 1% of ribbons that might be too close to camera and compress the depth range.
   */
  PERCENTILE_MAX: 0.99,

  /**
   * Percentage to expand depth range beyond clipped values (ensures pure black/white).
   * 
   * Used in: DepthExporter.js - computeDepthRangeFromRibbons() final range expansion
   * Context: After clipping to 1st-99th percentile, we expand the range by 3% in both
   * directions. This ensures the extreme ribbons within the clipped range actually reach
   * pure black (0) and pure white (255) in the exported image, rather than near-black
   * and near-white.
   * 
   * Why 0.03 (3%): Small enough not to reintroduce clipped outliers, but large enough
   * to guarantee full tonal range. Creates "headroom" so the darkest visible ribbon
   * maps to RGB 0 and brightest to RGB 255.
   * 
   * Example: If clipped range is 100-900, expansion creates 73-927 range (27 units
   * padding on each side = 3% of 900-100=800). Now depth 100 maps to ~10% gray instead
   * of pure black, giving true black to deeper ribbons.
   */
  DEPTH_EXPANSION_PERCENT: 0.03,

  /**
   * Gamma curve exponent for perceptual depth mapping.
   * 
   * Used in: DepthExporter.js - depthToGrey() function
   * Context: After normalizing depth to 0-1 range, we apply Math.pow(t, 0.85) before
   * converting to 0-255 grayscale. This is a gamma correction that makes depth
   * transitions more perceptually uniform.
   * 
   * Why 0.85: Values < 1.0 create an "expand shadows" curve - darker values spread
   * across more gray levels, lighter values compress. This matches human perception
   * where we distinguish dark tones better than light tones. Also increases contrast
   * in the typically-more-populated mid-to-far depth range.
   * 
   * Visual impact: Without gamma (1.0), depth map would look "flat" with most
   * content in mid-grays. With 0.85, near objects are darker and more separated,
   * creating more dramatic depth visualization.
   * 
   * Technical: Standard gamma correction uses 2.2 or 0.45 (inverse). We use 0.85
   * as a mild correction that enhances depth without over-darkening.
   */
  GAMMA_CORRECTION: 0.85,

  /**
   * Minimum depth array size required for valid percentile calculation.
   * 
   * Used in: DepthExporter.js - computeDepthRangeFromRibbons() validation
   * Context: If fewer than 10 depth samples are collected (very few visible ribbons),
   * percentile calculation becomes unreliable. We fall back to a default range.
   * 
   * Why 10: Minimum for meaningful percentile statistics. With < 10 samples, the
   * 1st and 99th percentile would be the same as min/max anyway. Also indicates
   * scene is nearly empty and default range is safer than potentially extreme values.
   */
  MIN_DEPTH_SAMPLES: 10,

  /**
   * Threshold for detecting degenerate quads in gradient rendering.
   * 
   * Used in: DepthExporter.js - rasterizeDepthPolygon() zero-length check
   * Context: When drawing a quad's depth gradient, we calculate distance between
   * leading and trailing edge centers. If distance < epsilon, the quad is collapsed
   * (zero-area) and we skip rendering to avoid NaN in gradient calculation.
   * 
   * Why 0.01: In screen coordinates (pixels), 0.01px is sub-pixel level - truly
   * degenerate. Anything larger would be visible. This prevents divide-by-zero or
   * numerical instability in canvas gradient without rejecting valid thin quads.
   */
  EPSILON: 0.01,

  /**
   * Default depth map background color (pure black).
   * 
   * Used in: DepthExporter.js - renderDepthMap() canvas fill
   * Context: Before drawing depth ribbons, canvas is filled with this color. Black
   * background ensures empty areas (no ribbons) export as depth=0 / far distance.
   * 
   * Why black: Semantic meaning - black = no content / infinite depth. Also provides
   * maximum contrast for light ribbons. Alternative would be white (near depth) but
   * that's counterintuitive for depth maps.
   */
  BACKGROUND_COLOR: '#000000',
};

/**
 * CAMERA CONSTANTS
 * 
 * Constraints on camera movement and positioning.
 */
export const CAMERA = {
  /**
   * Minimum allowed camera distance (maximum zoom in).
   * 
   * Used in: MouseHandler.js - wheel event zoom clamping
   * Context: When user scrolls to zoom, camera distance is clamped to this minimum.
   * Prevents camera from getting too close where:
   * - Near clipping plane cuts off geometry
   * - Individual ribbons become too large and blocky
   * - Projection distortion becomes extreme
   * 
   * Why 50: Empirically tested value. At distance=50:
   * - Ribbons are large but not clipping
   * - Perspective still feels natural
   * - Close enough for detailed inspection
   * Values < 30 start clipping, > 100 feels too distant for "close-up"
   */
  DISTANCE_MIN: 50,

  /**
   * Maximum allowed camera distance (maximum zoom out).
   * 
   * Used in: MouseHandler.js - wheel event zoom clamping
   * Context: Upper limit for camera distance. Prevents:
   * - Ribbons becoming too small to see (< 1px)
   * - Performance issues with extreme far plane
   * - Numerical precision loss at huge distances
   * - User getting "lost in space" unable to find content
   * 
   * Why 10000: Practical viewing limit. At distance=10000:
   * - Entire compositions visible even for large spreads
   * - Ribbons still above sub-pixel size for typical density
   * - Projection math remains stable (no overflow)
   * Real-world analogy: viewing 10-meter sculpture from 10km - just visible
   */
  DISTANCE_MAX: 10000,
};

/**
 * OVERLAY EXPORT CONSTANTS
 * 
 * Conversion factors for overlay positioning and scaling.
 */
export const OVERLAY = {
  /**
   * Percentage-to-decimal conversion factor.
   * 
   * Used in: PNGExporter.js - overlay positioning calculation
   * Context: Overlay position params (overlayX, overlayY) are stored as percentages
   * (0-100) for UI display, but must be converted to decimal (0-1) for canvas
   * coordinate math: actualX = (overlayX / 100) * canvasWidth
   * 
   * Why 100: Standard percentage conversion. Dividing by 100 converts 50% → 0.5.
   * Storing as percentages in params makes UI sliders intuitive (0-100 range).
   */
  PERCENT_TO_DECIMAL: 100,

  /**
   * Percentage-to-opacity conversion factor.
   * 
   * Used in: PNGExporter.js - overlay opacity calculation
   * Context: Overlay opacity param is stored as percentage (0-100) but canvas
   * globalAlpha requires decimal (0-1): ctx.globalAlpha = overlayOpacity / 100
   * 
   * Why 100: Same as PERCENT_TO_DECIMAL. Keeps UI in intuitive 0-100% range while
   * converting to canvas API's 0.0-1.0 range.
   */
  OPACITY_PERCENT_TO_DECIMAL: 100,
};

/**
 * SYNC CONSTANTS
 * 
 * Multi-window synchronization throttling values.
 */
export const SYNC = {
  /**
   * General parameter sync throttle rate (~60fps).
   * 
   * Used in: WindowSync.js - SYNC_THROTTLE_MS for parameter broadcasts
   * Context: When parameters change in primary window, changes are broadcast to
   * display windows. Throttling to 16ms ensures max 60 updates/sec, preventing
   * message queue overflow and performance degradation on rapid parameter changes
   * (e.g., dragging sliders).
   * 
   * Why 16ms: One frame at 60fps (1000ms/60fps = 16.67ms). Since most displays are
   * 60Hz, faster sync provides no benefit but wastes bandwidth. Display windows
   * update at 60fps anyway, so intermediate broadcasts would be discarded.
   * 
   * Trade-off: Slightly increased latency (up to 16ms delay) for much better
   * performance during rapid changes.
   */
  THROTTLE_MS: 16,

  /**
   * Real-time camera sync throttle for mouse-driven camera updates (~60fps).
   * 
   * Used in: WindowSync.js - MOUSE_BROADCAST_THROTTLE for camera movements
   * Context: Mouse wheel zoom and camera rotation generate high-frequency updates.
   * Throttling to 17ms (slightly higher than general sync) ensures smooth display
   * window mirroring without overwhelming the BroadcastChannel.
   * 
   * Why 17ms: Slightly slower than THROTTLE_MS (16ms) to give parameter syncs
   * priority. Still ~58-59fps effective rate, imperceptible to user. The 1ms
   * difference creates a natural priority queue where parameter changes process
   * before camera position refinements.
   * 
   * Why separate constant: Camera updates are higher frequency (every mousemove)
   * than parameter changes, so they need independent throttling control.
   */
  MOUSE_BROADCAST_THROTTLE_MS: 17,
};

/**
 * EXPORT DEFAULT CONSTANTS AS SINGLE OBJECT
 * 
 * For backward compatibility and convenience, also export all constants
 * as properties of a single object.
 */
export const CONSTANTS = {
  UI_TIMING,
  EXPORT_TIMING,
  DEPTH_EXPORT,
  CAMERA,
  OVERLAY,
  SYNC,
};

export default CONSTANTS;
