/**
 * VideoRecorder — Video export using CCapture.js
 */

import { createCompositeCanvas } from './PNGExporter.js';

let capturer = null;
let isRecording = false;
let recordingFrameCount = 0;
let recordingTotalFrames = 0;
let compositeCanvas = null;

export function isRecording_() {
  return isRecording;
}

export function startVideoRecording(ZM) {
  // Only allow recording from main window, not display windows
  if (ZM.isDisplayMode) {
    console.log('🎥 startVideoRecording() blocked: display windows cannot record');
    return;
  }
  
  if (isRecording) {
    stopVideoRecording(ZM);
    return;
  }
  
  // Prepare recording state
  isRecording = true;
  recordingFrameCount = 0;
  recordingTotalFrames = ZM.params.videoDuration * ZM.params.videoFPS;
  
  // Disable UI during recording
  document.querySelectorAll('.controls input, .controls button').forEach(el => {
    el.disabled = true;
    el.style.opacity = '0.5';
    el.style.pointerEvents = 'none';
  });
  
  const btn = document.getElementById('export-video');
  btn.textContent = 'Stop Recording';
  btn.disabled = false;
  btn.style.opacity = '1';
  btn.style.pointerEvents = 'auto';
  btn.style.background = '#8b2d2d';
  
  document.getElementById('video-progress').style.display = 'block';
  document.getElementById('video-progress').textContent = 'Recording: 0%';
  
  // Don't clear emitter - preserve current animation state
  // This allows recording to start with the current visual state
  
  // Initialize CCapture
  capturer = new CCapture({
    format: ZM.params.videoFormat === 'mp4' ? 'webm' : ZM.params.videoFormat,
    framerate: ZM.params.videoFPS,
    name: 'spaceflow',
    quality: 95,
    verbose: false,
    display: false,
    autoSaveTime: 0,
    workersPath: ''
  });
  
  // Start capture
  ZM.p5Instance.noLoop();
  if (ZM.params.stereoscopicMode && ZM.p5InstanceRight) {
    ZM.p5InstanceRight.noLoop();
  }
  capturer.start();
  renderVideoFrame(ZM);
}

function renderVideoFrame(ZM) {
  if (!isRecording || recordingFrameCount >= recordingTotalFrames) {
    if (isRecording) stopVideoRecording(ZM);
    return;
  }
  
  // Redraw canvases
  ZM.p5Instance.redraw();
  if (ZM.params.stereoscopicMode && ZM.p5InstanceRight) {
    ZM.p5InstanceRight.redraw();
  }
  
  // Create composite with overlay (supports side-by-side stereo)
  const leftCanvas = ZM.p5Instance.canvas;
  const rightCanvas = ZM.params.stereoscopicMode && ZM.p5InstanceRight ? ZM.p5InstanceRight.canvas : null;
  compositeCanvas = createCompositeCanvas(ZM, leftCanvas, rightCanvas);
  
  capturer.capture(compositeCanvas);
  
  recordingFrameCount++;
  
  const progress = Math.round((recordingFrameCount / recordingTotalFrames) * 100);
  document.getElementById('video-progress').textContent = `Recording: ${progress}%`;
  
  requestAnimationFrame(() => renderVideoFrame(ZM));
}

export function stopVideoRecording(ZM) {
  // Only allow stopping from main window
  if (ZM.isDisplayMode) {
    console.log('🎥 stopVideoRecording() blocked: display windows cannot record');
    return;
  }
  
  if (!isRecording) return;
  
  document.getElementById('video-progress').textContent = 'Encoding video...';
  
  capturer.stop();
  capturer.save();
  
  isRecording = false;
  recordingFrameCount = 0;
  compositeCanvas = null;
  
  // Re-enable UI
  document.querySelectorAll('.controls input, .controls button').forEach(el => {
    el.disabled = false;
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
  });
  
  const btn = document.getElementById('export-video');
  btn.disabled = false;
  btn.textContent = 'Export Video';
  btn.style.background = '#5f1a1a';
  
  document.getElementById('video-progress').style.display = 'none';
  
  // Resume playback
  ZM.p5Instance.frameRate(60);
  ZM.p5Instance.loop();
  if (ZM.params.stereoscopicMode && ZM.p5InstanceRight) {
    ZM.p5InstanceRight.frameRate(60);
    ZM.p5InstanceRight.loop();
  }
}

// Export with correct name
export { isRecording_ as isRecording };
