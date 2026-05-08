/**
 * SVGExporter — Export scene as SVG vector graphic
 * VERSION: 2026-03-20 — Improved error handling
 */

import { getBackgroundColor } from '../core/colorUtils.js';

export function exportSVG(ZM) {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                         SVG EXPORT START                           ║');
  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  console.log('│ ZM.sketchReady:', !!ZM.sketchReady);
  console.log('│ ZM.p5Instance:', !!ZM.p5Instance);
  console.log('│ ZM.emitterInstance:', !!ZM.emitterInstance);
  if (ZM.emitterInstance) {
    console.log('│ Lines count:', ZM.emitterInstance.lines ? ZM.emitterInstance.lines.length : 0);
  }
  console.log('│ ZM.camera:', !!ZM.camera);
  console.log('│ ZM.buildRibbonSides:', !!ZM.buildRibbonSides);
  
  // Allow exports as long as we have valid geometry, even if sketch is being reinitialized
  // This allows exports during transitions between states or mode changes
  if (!ZM.emitterInstance || !ZM.emitterInstance.lines || ZM.emitterInstance.lines.length === 0) {
    console.error('│ ERROR: No geometry available to export');
    console.log('╚═══════════════════════════════════════════════════════════════════╝');
    if (ZM.showToast) ZM.showToast('No geometry to export. Wait for lines to appear...', 'info');
    return;
  }
  
  // Check for other required components
  if (!ZM.camera) {
    console.error('│ ERROR: Camera not initialized');
    console.log('╚═══════════════════════════════════════════════════════════════════╝');
    if (ZM.showToast) ZM.showToast('Camera not ready', 'error');
    return;
  }
  
  if (!ZM.buildRibbonSides) {
    console.error('│ ERROR: buildRibbonSides function not found');
    console.log('╚═══════════════════════════════════════════════════════════════════╝');
    if (ZM.showToast) ZM.showToast('Export failed: missing helper function', 'error');
    return;
  }
  
  console.log('│ Lines to export:', ZM.emitterInstance.lines.length);
  console.log('│ Canvas dimensions:', ZM.W, 'x', ZM.H);
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', ZM.W);
  svg.setAttribute('height', ZM.H);
  svg.setAttribute('viewBox', `0 0 ${ZM.W} ${ZM.H}`);
  
  // Add background rectangle
  const bg = ZM.bgTransition?.current || getBackgroundColor(ZM.params);
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('x', '0');
  bgRect.setAttribute('y', '0');
  bgRect.setAttribute('width', ZM.W);
  bgRect.setAttribute('height', ZM.H);
  bgRect.setAttribute('fill', `rgb(${bg.join(',')})`);
  svg.appendChild(bgRect);
  
  // Rotation helpers
  function rotX(x, y, z, a) {
    return {
      x: x, 
      y: y * Math.cos(a) - z * Math.sin(a), 
      z: y * Math.sin(a) + z * Math.cos(a)
    };
  }
  function rotY(x, y, z, a) {
    return {
      x: x * Math.cos(a) + z * Math.sin(a), 
      y: y, 
      z: -x * Math.sin(a) + z * Math.cos(a)
    };
  }
  function rotZ(x, y, z, a) {
    return {
      x: x * Math.cos(a) - y * Math.sin(a), 
      y: x * Math.sin(a) + y * Math.cos(a), 
      z: z
    };
  }
  
  // Camera projection setup
  // Use transition values to match exactly what's rendered
  const fovRad = ZM.fovTransition.current * Math.PI / 180;
  const defaultCameraZ = (ZM.H / 2) / Math.tan(fovRad / 2);
  const emitterRotation = ZM.emitterRotationTransition.current * Math.PI / 180;
  
  // Camera effective position (thinking of pan/zoom as camera position offsets)
  // In p5.js: camera is at (0, 0, defaultCameraZ), then translate(offsetX, offsetY, -distance) moves the world
  // This is equivalent to camera being at (-offsetX, -offsetY, defaultCameraZ + distance)
  const cameraX = -ZM.camera.offsetX;
  const cameraY = -ZM.camera.offsetY;
  const cameraZ = defaultCameraZ + ZM.camera.distance;
  
  console.log('SVG Export Camera Setup:');
  console.log('  - FOV:', ZM.fovTransition.current);
  console.log('  - Default cameraZ:', defaultCameraZ.toFixed(2));
  console.log('  - Camera position:', cameraX.toFixed(2), cameraY.toFixed(2), cameraZ.toFixed(2));
  console.log('  - Emitter rotation:', (emitterRotation * 180 / Math.PI).toFixed(2));
  console.log('  - Camera rotation:', ZM.camera.rotationX.toFixed(3), ZM.camera.rotationY.toFixed(3));
  console.log('  - Geometry scale:', ZM.geometryScaleTransition.current);
  
  function projectPoint(x, y, z) {
    // Transformation pipeline:
    // 1. Apply rotations to geometry (Z → Y → X)
    // 2. Transform to camera space by subtracting camera position
    // 3. Apply perspective projection
    
    // Step 1: Apply rotations in order: Z → Y → X
    let pt = rotZ(x, y, z, emitterRotation);
    pt = rotY(pt.x, pt.y, pt.z, ZM.camera.rotationY);
    pt = rotX(pt.x, pt.y, pt.z, ZM.camera.rotationX);
    
    // Step 2: Transform to camera space
    // Subtract camera position from world position
    const viewX = pt.x - cameraX;
    const viewY = pt.y - cameraY;
    const viewZ = pt.z - cameraZ;
    
    // Step 3: Frustum culling
    if (viewZ >= -ZM.params.near || viewZ <= -ZM.params.far) return null;
    
    // Step 4: Perspective projection
    const s = defaultCameraZ / -viewZ;
    const projX = viewX * s;
    const projY = viewY * s;
    
    return { 
      x: projX + ZM.W / 2, 
      y: projY + ZM.H / 2 
    };
  }
  
  const scaleVal = ZM.geometryScaleTransition.current / 100;
  
  // Process each line
  let exportedCount = 0;
  ZM.emitterInstance.lines.forEach(line => {
    try {
      const localVerts = line._buildVertices();
      const { leftSide: leftLocal, rightSide: rightLocal } = 
        ZM.buildRibbonSides(localVerts, line.lineThickness / 2);
    
    // Project to screen space
    function toScreen(localPts) {
      return localPts
        .map(pt => ({
          x: ((line.x - ZM.W / 2) + pt.x) * scaleVal,
          y: ((line.y - ZM.H / 2) + pt.y) * scaleVal,
          z: line.zOffset * scaleVal
        }))
        .map(pt => projectPoint(pt.x, pt.y, pt.z))
        .filter(Boolean);
    }
    
    const leftScreen = toScreen(leftLocal);
    const rightScreen = toScreen(rightLocal);
    
    if (leftScreen.length < 2 || rightScreen.length < 2) return;
    
    // Create polygon
    const alpha = line._alpha();
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const pts = [...leftScreen, ...rightScreen.reverse()]
      .map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    
    polygon.setAttribute('points', pts);
    polygon.setAttribute('fill', `rgb(${line.currentColor.join(',')})`);
    polygon.setAttribute('fill-opacity', alpha.toString());
    polygon.setAttribute('stroke', 'none');
    svg.appendChild(polygon);
    exportedCount++;
    } catch (err) {
      console.error('SVG Export: Failed to export line:', err);
    }
  });
  
  if (exportedCount === 0) {
    console.warn('SVG Export: No ribbons were exported (all outside frustum or invalid)');
    if (ZM.showToast) ZM.showToast('No visible geometry in current view', 'info');
    return;
  }
  
  console.log(`✓ SVG Export: Successfully exported ${exportedCount} ribbons`);
  
  // Download
  const blob = new Blob(
    [new XMLSerializer().serializeToString(svg)],
    { type: 'image/svg+xml' }
  );
  const url = URL.createObjectURL(blob);
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zigmap26-${ts}.svg`;
  a.click();
  URL.revokeObjectURL(url);
  
  if (ZM.showToast) ZM.showToast(`✓ SVG exported (${exportedCount} ribbons)`, 'success');
}
