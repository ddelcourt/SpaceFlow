/**
 * PNGExporter — Export canvas as PNG image
 * VERSION: 2026-03-20 — Side-by-Side Stereoscopic Export
 */

console.log('PNGExporter.js — SBS Stereo Export');

/**
 * Composite a single canvas with its overlay
 * @param {Canvas} canvas - Source p5 canvas
 * @param {HTMLImageElement} overlayImg - Overlay image element
 * @param {Object} ZM - ZigMap instance
 * @param {number} offsetX - X offset for positioning overlay in final composite
 * @returns {Canvas} Composite canvas
 */
function compositeSingleEye(canvas, overlayImg, ZM, offsetX = 0) {
  const composite = document.createElement('canvas');
  composite.width = canvas.width;
  composite.height = canvas.height;
  const ctx = composite.getContext('2d');
  
  // Draw canvas
  ctx.drawImage(canvas, 0, 0);
  
  // Check if overlay should be added
  const hasOverlay = ZM.params.overlayVisible && ZM.params.overlayImageSrc && overlayImg && overlayImg.complete && overlayImg.naturalWidth > 0;
  
  if (!hasOverlay) {
    return composite;
  }
  
  // Get overlay on-screen dimensions
  const rect = overlayImg.getBoundingClientRect();
  const onScreenWidth = rect.width;
  const onScreenHeight = rect.height;
  
  // Get canvas on-screen CSS size
  const canvasRect = canvas.getBoundingClientRect();
  const canvasCSSWidth = canvasRect.width;
  const canvasCSSHeight = canvasRect.height;
  
  // Calculate buffer-to-CSS ratio
  const scaleX = canvas.width / canvasCSSWidth;
  const scaleY = canvas.height / canvasCSSHeight;
  
  // Apply same ratio to overlay
  const imgWidth = onScreenWidth * scaleX;
  const imgHeight = onScreenHeight * scaleY;
  
  // Position as percentage of canvas
  const x = (ZM.params.overlayX / 100) * composite.width;
  const y = (ZM.params.overlayY / 100) * composite.height;
  
  // Draw overlay with opacity
  const opacity = ZM.params.overlayOpacity / 100;
  ctx.globalAlpha = opacity;
  ctx.drawImage(
    overlayImg,
    x - imgWidth / 2,
    y - imgHeight / 2,
    imgWidth,
    imgHeight
  );
  ctx.globalAlpha = 1.0;
  
  return composite;
}

/**
 * Create a composite canvas with overlay (supports mono and side-by-side stereo)
 * @param {Object} ZM - ZigMap instance
 * @param {Canvas} leftCanvas - Left eye canvas (or mono canvas)
 * @param {Canvas} rightCanvas - Right eye canvas (optional, for stereo mode)
 * @returns {Canvas} Final composite canvas
 */
function createCompositeCanvas(ZM, leftCanvas, rightCanvas = null) {
  const isStereo = ZM.params.stereoscopicMode && rightCanvas && ZM.p5InstanceRight;
  
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                    PNG EXPORT - COMPOSITE CANVAS                   ║');
  console.log('╠═══════════════════════════════════════════════════════════════════╣');
  console.log('│ Mode:', isStereo ? 'STEREOSCOPIC (Side-by-Side)' : 'MONO');
  console.log('│ Left canvas:', leftCanvas.width, 'x', leftCanvas.height);
  if (isStereo) {
    console.log('│ Right canvas:', rightCanvas.width, 'x', rightCanvas.height);
  }
  console.log('│ Overlay visible:', ZM.params.overlayVisible);
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  if (isStereo) {
    // Side-by-Side Stereoscopic Export
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = leftCanvas.width + rightCanvas.width;
    finalCanvas.height = leftCanvas.height;
    const ctx = finalCanvas.getContext('2d');
    
    // Get overlay images
    const overlayImgLeft = document.getElementById('overlay-image-left');
    const overlayImgRight = document.getElementById('overlay-image-right');
    
    // Composite left eye with its overlay
    const leftComposite = compositeSingleEye(leftCanvas, overlayImgLeft, ZM);
    ctx.drawImage(leftComposite, 0, 0);
    
    // Composite right eye with its overlay
    const rightComposite = compositeSingleEye(rightCanvas, overlayImgRight, ZM);
    ctx.drawImage(rightComposite, leftCanvas.width, 0);
    
    console.log('✓ Side-by-Side stereo composite created:', finalCanvas.width, 'x', finalCanvas.height);
    
    return finalCanvas;
  } else {
    // Mono mode - single canvas with overlay
    const overlayImgMono = document.getElementById('overlay-image');
    const composite = compositeSingleEye(leftCanvas, overlayImgMono, ZM);
    
    console.log('✓ Mono composite created:', composite.width, 'x', composite.height);
    
    return composite;
  }
}

export function exportPNG(ZM) {
  // Only allow exports from main window, not display windows
  if (ZM.isDisplayMode) {
    console.log('📸 exportPNG() blocked: display windows cannot export');
    return;
  }
  
  console.log('📸 exportPNG() called');
  console.log('  Stereoscopic mode:', ZM.params.stereoscopicMode);
  console.log('  ZM.p5Instance exists:', !!ZM.p5Instance);
  console.log('  ZM.p5InstanceRight exists:', !!ZM.p5InstanceRight);
  
  if (!ZM.p5Instance) {
    console.log('⚠️  No p5Instance - aborting export');
    return;
  }
  
  // Create composite with both canvases if in stereo mode
  const leftCanvas = ZM.p5Instance.canvas;
  const rightCanvas = ZM.params.stereoscopicMode && ZM.p5InstanceRight ? ZM.p5InstanceRight.canvas : null;
  
  const composite = createCompositeCanvas(ZM, leftCanvas, rightCanvas);
  
  console.log('  Final composite created:', composite.width, 'x', composite.height);
  
  composite.toBlob(blob => {
    console.log('  Blob created, size:', blob.size, 'bytes');
    const url = URL.createObjectURL(blob);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const suffix = ZM.params.stereoscopicMode ? '-SBS' : '';
    const a = document.createElement('a');
    a.href = url;
    a.download = `spaceflow-${ts}${suffix}.png`;
    a.click();
    console.log('✅ PNG download triggered:', a.download);
    URL.revokeObjectURL(url);
    if (ZM && ZM.showToast) ZM.showToast('✓ PNG exported', 'success');
  }, 'image/png');
}

// Export composite function for use by other exporters
export { createCompositeCanvas };
