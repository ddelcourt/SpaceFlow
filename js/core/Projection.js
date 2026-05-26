// ═══════════════════════════════════════════════════════════════════════════
// SPACEFLOW - Projection Module
// 3D to 2D projection mathematics for SVG/depth map export
// Rotation order: Z → Y → X (matches p5.js WEBGL)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Project a 3D point to 2D screen space with depth
 * @param {number} x, y, z - World space coordinates
 * @param {Object} options - {emitterRotation, cameraRotationX, cameraRotationY, near, far, defaultCameraZ, totalDistance, canvasWidth, canvasHeight}
 * @returns {Object|null} {sx, sy, depth} or null if clipped
 */
export function projectPoint(x, y, z, options) {
  const {
    emitterRotation,
    cameraRotationX,
    cameraRotationY,
    near,
    far,
    defaultCameraZ,
    totalDistance,
    canvasWidth,
    canvasHeight
  } = options;

  const eRad = emitterRotation * Math.PI / 180;
  const rX = cameraRotationX;
  const rY = cameraRotationY;

  // 1. rotateZ (emitter rotation)
  let px = x * Math.cos(eRad) - y * Math.sin(eRad);
  let py = x * Math.sin(eRad) + y * Math.cos(eRad);
  let pz = z;

  // 2. rotateY (horizontal camera orbit)
  const px2 = px * Math.cos(rY) + pz * Math.sin(rY);
  const pz2 = -px * Math.sin(rY) + pz * Math.cos(rY);
  px = px2;
  pz = pz2;

  // 3. rotateX (vertical camera orbit)
  const py3 = py * Math.cos(rX) - pz * Math.sin(rX);
  const pz3 = py * Math.sin(rX) + pz * Math.cos(rX);
  py = py3;
  pz = pz3;

  // 4. Subtract total camera distance
  pz -= totalDistance;

  // 5. Frustum clipping
  if (pz >= -near || pz <= -far) return null;

  // 6. Perspective divide
  const s = defaultCameraZ / -pz;
  const sx = px * s + canvasWidth / 2;
  const sy = py * s + canvasHeight / 2;

  return { sx: sx, sy: sy, depth: -pz };
}

/**
 * Project a vertex from local line space → world space → screen space
 * @param {Object} line - Line object with x, y position
 * @param {number} localX, localY - Local coordinates
 * @param {Object} options - Projection options + {geometryScale}
 */
export function projectVertex(line, localX, localY, options) {
  const { canvasWidth, canvasHeight, geometryScale } = options;
  const scale = geometryScale / 100;
  const wx = ((line.x - canvasWidth / 2) + localX) * scale;
  const wy = ((line.y - canvasHeight / 2) + localY) * scale;
  return projectPoint(wx, wy, 0, options);
}

/**
 * Calculate default camera Z position from FOV
 * @param {number} canvasHeight - Canvas height in pixels
 * @param {number} fov - Field of view in degrees
 * @returns {number} Default camera Z position
 */
export function calculateDefaultCameraZ(canvasHeight, fov) {
  const fovRad = fov * Math.PI / 180;
  return (canvasHeight / 2) / Math.tan(fovRad / 2);
}

/**
 * Calculate total camera distance
 * @param {number} defaultCameraZ - Default p5.js camera position
 * @param {number} cameraDistance - User's zoom distance
 * @returns {number} Total distance from camera to origin
 */
export function calculateTotalDistance(defaultCameraZ, cameraDistance) {
  return defaultCameraZ + cameraDistance;
}

/**
 * Rotation matrices for reference (used in projectPoint)
 */
export const rotationMatrices = {
  /**
   * Rotate around X-axis (pitch)
   * @param {number} x, y, z - Input coordinates
   * @param {number} angle - Rotation angle in radians
   * @returns {Object} {x, y, z} rotated coordinates
   */
  rotX: (x, y, z, angle) => ({
    x: x,
    y: y * Math.cos(angle) - z * Math.sin(angle),
    z: y * Math.sin(angle) + z * Math.cos(angle)
  }),

  /**
   * Rotate around Y-axis (yaw)
   */
  rotY: (x, y, z, angle) => ({
    x: x * Math.cos(angle) + z * Math.sin(angle),
    y: y,
    z: -x * Math.sin(angle) + z * Math.cos(angle)
  }),

  /**
   * Rotate around Z-axis (roll)
   */
  rotZ: (x, y, z, angle) => ({
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle),
    z: z
  })
};
