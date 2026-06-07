/**
 * SVGExporter — Export scene as SVG vector graphic
 * VERSION: 2026-03-20 — Improved error handling
 */

import { getBackgroundColor } from '../core/colorUtils.js';
import { debugLog } from '../core/debugLogger.js';
import { canExport } from './exportUtils.js';

export function exportSVG(ZM) {
  // Only allow exports from main window, not display windows
  if (!canExport(ZM, '📄 SVG Export')) return;
  
  debugLog('EXPORTS', '╔═══════════════════════════════════════════════════════════════════╗');
  debugLog('EXPORTS', '║                         SVG EXPORT START                           ║');
  debugLog('EXPORTS', '╠═══════════════════════════════════════════════════════════════════╣');
  debugLog('EXPORTS', '│ Canvas dimensions (ZM.W × ZM.H):', ZM.W, '×', ZM.H);
  debugLog('EXPORTS', '│ Framebuffer mode:', ZM.params.framebufferMode);
  debugLog('EXPORTS', '│ Stereoscopic mode:', ZM.params.stereoscopicMode);
  if (ZM.params.framebufferMode) {
    debugLog('EXPORTS', '│ Framebuffer size:', ZM.params.framebufferWidth, '×', ZM.params.framebufferHeight);
  }
  debugLog('EXPORTS', '│ ZM.sketchReady:', !!ZM.sketchReady);
  debugLog('EXPORTS', '│ ZM.p5Instance:', !!ZM.p5Instance);
  debugLog('EXPORTS', '│ ZM.emitterInstance:', !!ZM.emitterInstance);
  if (ZM.emitterInstance) {
    debugLog('EXPORTS', '│ Lines count:', ZM.emitterInstance.lines ? ZM.emitterInstance.lines.length : 0);
  }
  debugLog('EXPORTS', '│ ZM.camera:', !!ZM.camera);
  debugLog('EXPORTS', '│ ZM.buildRibbonSides:', !!ZM.buildRibbonSides);
  
  // Allow exports as long as we have valid geometry, even if sketch is being reinitialized
  // This allows exports during transitions between states or mode changes
  if (!ZM.emitterInstance || !ZM.emitterInstance.lines || ZM.emitterInstance.lines.length === 0) {
    console.error('│ ERROR: No geometry available to export');
    debugLog('EXPORTS', '╚═══════════════════════════════════════════════════════════════════╝');
    if (ZM.showToast) ZM.showToast('No geometry to export. Wait for lines to appear...', 'info');
    return;
  }
  
  // Check for other required components
  if (!ZM.camera) {
    console.error('│ ERROR: Camera not initialized');
    debugLog('EXPORTS', '╚═══════════════════════════════════════════════════════════════════╝');
    if (ZM.showToast) ZM.showToast('Camera not ready', 'error');
    return;
  }
  
  if (!ZM.buildRibbonSides) {
    console.error('│ ERROR: buildRibbonSides function not found');
    debugLog('EXPORTS', '╚═══════════════════════════════════════════════════════════════════╝');
    if (ZM.showToast) ZM.showToast('Export failed: missing helper function', 'error');
    return;
  }
  
  debugLog('EXPORTS', '│ Lines to export:', ZM.emitterInstance.lines.length);
  debugLog('EXPORTS', '│ Canvas dimensions:', ZM.W, 'x', ZM.H);
  debugLog('EXPORTS', '╚═══════════════════════════════════════════════════════════════════╝');
  
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
  
  debugLog('EXPORTS', 'SVG Export Camera Setup:');
  debugLog('EXPORTS', '  - FOV:', ZM.fovTransition.current);
  debugLog('EXPORTS', '  - Default cameraZ:', defaultCameraZ.toFixed(2));
  debugLog('EXPORTS', '  - Camera position:', cameraX.toFixed(2), cameraY.toFixed(2), cameraZ.toFixed(2));
  debugLog('EXPORTS', '  - Emitter rotation:', (emitterRotation * 180 / Math.PI).toFixed(2));
  debugLog('EXPORTS', '  - Camera rotation:', ZM.camera.rotationX.toFixed(3), ZM.camera.rotationY.toFixed(3));
  debugLog('EXPORTS', '  - Geometry scale:', ZM.geometryScaleTransition.current);
  
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
    
    // Step 3: Perspective projection
    // NOTE: No frustum culling here to match p5.js/WebGL behavior
    // p5.js passes all vertices to WebGL which handles clipping at polygon level
    // SVG export should do the same - project all vertices and let SVG viewer clip
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
  let skippedInvisible = 0;
  
  ZM.emitterInstance.lines.forEach(line => {
    try {
      // Skip invisible lines (alpha <= 0)
      const alpha = line._alpha();
      if (alpha <= 0) {
        skippedInvisible++;
        return;
      }
      
      const localVerts = line._buildVertices();
      const { leftSide: leftLocal, rightSide: rightLocal } = 
        ZM.buildRibbonSides(localVerts, line.lineThickness / 2);
    
      // Project to screen space - ALL vertices are projected
      function toScreen(localPts) {
        return localPts
          .map(pt => ({
            x: ((line.x - ZM.W / 2) + pt.x) * scaleVal,
            y: ((line.y - ZM.H / 2) + pt.y) * scaleVal,
            z: line.zOffset * scaleVal
          }))
          .map(pt => projectPoint(pt.x, pt.y, pt.z));
      }
      
      const leftScreen = toScreen(leftLocal);
      const rightScreen = toScreen(rightLocal);
      
      // Create single polygon for entire ribbon (left side + reversed right side)
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
  
  // Report export statistics
  debugLog('EXPORTS', '');
  debugLog('EXPORTS', 'SVG Export Statistics:');
  debugLog('EXPORTS', `  ✓ Exported: ${exportedCount} ribbons`);
  debugLog('EXPORTS', `  ⊘ Skipped (invisible/alpha=0): ${skippedInvisible}`);
  debugLog('EXPORTS', `  Total lines processed: ${ZM.emitterInstance.lines.length}`);
  
  if (exportedCount === 0) {
    console.warn('SVG Export: No ribbons were exported (all invisible)');
    if (ZM.showToast) ZM.showToast('No visible geometry to export', 'info');
    return;
  }
  
  debugLog('EXPORTS', `✓ SVG Export: Successfully exported ${exportedCount} ribbons`);
  
  // Download
  const blob = new Blob(
    [new XMLSerializer().serializeToString(svg)],
    { type: 'image/svg+xml' }
  );
  const url = URL.createObjectURL(blob);
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spaceflow-${ts}.svg`;
  a.click();
  URL.revokeObjectURL(url);
  
  if (ZM.showToast) ZM.showToast(`✓ SVG exported (${exportedCount} ribbons)`, 'success');
}
