/**
 * SketchFactory — Creates p5.js sketch instances for rendering
 */

import { Emitter } from '../core/Emitter.js';
import { getSpawnDistance, buildRibbonSides } from '../core/utils.js';
import { getBackgroundColor, lerpColor } from '../core/colorUtils.js';
import { getPerformanceMonitor } from '../core/PerformanceMonitor.js';

let sharedLastTime = 0;

/**
 * Creates main p5 sketch or stereo pair
 */
export function createSketch(ZM, eyeOffset = 0, canvasId = 'left-canvas') {
  // Background color transition state (shared across stereo pair via ZM)
  if (!ZM.bgTransition) {
    const initialBg = getBackgroundColor(ZM.params);
    ZM.bgTransition = {
      current: [...initialBg],   // Cached display color
      start: [...initialBg],      // Start of transition
      target: [...initialBg],     // Target of transition
      progress: 1.0,
      isTransitioning: false
    };
  }
  
  // FOV transition state (shared across stereo pair via ZM)
  if (!ZM.fovTransition) {
    ZM.fovTransition = {
      current: ZM.params.fov,
      start: ZM.params.fov,
      target: ZM.params.fov,
      progress: 1.0,
      isTransitioning: false,
      duration: ZM.params.stateTransitionDuration // Use parameter instead of hardcoded value
    };
  }
  
  // Emitter rotation transition state (shared across stereo pair via ZM)
  if (!ZM.emitterRotationTransition) {
    ZM.emitterRotationTransition = {
      current: ZM.params.emitterRotation,
      start: ZM.params.emitterRotation,
      target: ZM.params.emitterRotation,
      progress: 1.0,
      isTransitioning: false,
      duration: ZM.params.stateTransitionDuration // Use parameter instead of hardcoded value
    };
  }
  
  // Geometry scale transition state (shared across stereo pair via ZM)
  if (!ZM.geometryScaleTransition) {
    ZM.geometryScaleTransition = {
      current: ZM.params.geometryScale,
      start: ZM.params.geometryScale,
      target: ZM.params.geometryScale,
      progress: 1.0,
      isTransitioning: false,
      duration: ZM.params.stateTransitionDuration // Use parameter instead of hardcoded value
    };
  }
  
  // Speed transition state (shared across stereo pair via ZM)
  if (!ZM.speedTransition) {
    ZM.speedTransition = {
      current: ZM.params.speed,
      start: ZM.params.speed,
      target: ZM.params.speed,
      progress: 1.0,
      isTransitioning: false,
      duration: ZM.params.stateTransitionDuration // Use parameter instead of hardcoded value
    };
  }
  
  return (p) => {
    let emitter = null;
    const isPrimary = canvasId === 'left-canvas' || canvasId === 'mono-canvas';
    
    p.setup = () => {
      // Set pixelDensity BEFORE createCanvas (important for WebGL)
      // Use pixelDensity(1) in framebuffer mode to respect exact dimensions
      // Use native density for smooth retina rendering when not in framebuffer mode
      if (ZM.params.framebufferMode) {
        p.pixelDensity(1);
      } else {
        p.pixelDensity(p.displayDensity());
      }
      
      const canvas = p.createCanvas(ZM.W, ZM.H, p.WEBGL);
      canvas.parent(canvasId);
      p.frameRate(60);
      
      // Prevent canvas from being dragged as an image
      canvas.elt.addEventListener('dragstart', (e) => e.preventDefault());
      
      // Optional: Check WebGL limits using p5's drawingContext (the actual WebGL context)
      if (isPrimary && p.drawingContext) {
        try {
          const gl = p.drawingContext;
          const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
          console.log(`📐 Canvas: ${ZM.W}x${ZM.H} | WebGL Max: ${maxTextureSize}x${maxTextureSize}`);
          
          // Warn if size exceeds GPU limits (consider pixelDensity multiplier)
          const actualWidth = ZM.W * p.pixelDensity();
          const actualHeight = ZM.H * p.pixelDensity();
          if (actualWidth > maxTextureSize || actualHeight > maxTextureSize) {
            console.warn(`⚠️ Canvas buffer ${actualWidth}x${actualHeight} may exceed GPU limit ${maxTextureSize}`);
          }
        } catch (e) {
          console.log('Could not check WebGL limits:', e.message);
        }
      }
      
      // Create or reuse emitter
      if (!ZM.emitterInstance) {
        // First canvas: create new emitter
        console.log('  ✨ Creating NEW emitter');
        emitter = new Emitter({
          p: p,
          x: ZM.W / 2,
          y: ZM.H / 2 + getSpawnDistance(ZM.params.segmentLength),
          params: ZM.params,
          noiseOffsetGetter: () => ZM.noiseOffset,
          canvasWidth: ZM.W,
          canvasHeight: ZM.H,
          getSpawnDistanceFn: getSpawnDistance,
          buildRibbonSidesFn: buildRibbonSides
        });
        ZM.emitterInstance = emitter;
        console.log('  ✓ Emitter created and ready');
      } else {
        // Reuse existing emitter (dimensions already updated in initializeSketches)
        console.log('  ♻️ REUSING existing emitter with', ZM.emitterInstance.lines.length, 'lines');
        console.log('     Canvas:', canvasId, '| isPrimary:', isPrimary);
        emitter = ZM.emitterInstance;
        
        // CRITICAL: Only update p5 reference on PRIMARY canvas
        // Primary canvas handles emitter.update() which uses this.p.noise()
        // Secondary (right) canvas only draws, doesn't update emitter state
        if (isPrimary) {
          console.log('     Updating p5 references for primary canvas');
          emitter.p = p;
          
          // Update p5 reference for all existing lines (for consistency)
          // Also update buildRibbonSides reference for export compatibility
          for (const line of emitter.lines) {
            line.p = p;
            line.buildRibbonSides = buildRibbonSides;
          }
        } else {
          console.log('     Skipping p5 update for secondary canvas (uses primary refs)');
        }
      }
      
      // Mark sketch as ready
      ZM.sketchReady = true;
      console.log('✓ Sketch setup complete - rendering started');
    };
    
    p.draw = () => {
      // Performance monitoring
      const perfMon = getPerformanceMonitor();
      if (perfMon && isPrimary) perfMon.startFrame();
      
      // Time management
      const now = p.millis() / 1000;
      const dt = sharedLastTime === 0 ? 0.016 : now - sharedLastTime;
      sharedLastTime = now;
      
      // Update primary canvas only features (emitter, noise, background transitions)
      if (isPrimary) {
        // Update noise offset
        ZM.noiseOffset += dt * (ZM.params.ambientSpeedMaster / 100);
        
        // Update emitter (only on primary canvas to avoid duplicate particle generation)
        emitter.update(dt);
        
        // Update background color transition (only if actively transitioning)
        if (ZM.bgTransition.isTransitioning) {
          ZM.bgTransition.progress += dt / ZM.params.colorTransitionDuration;
          if (ZM.bgTransition.progress >= 1.0) {
            ZM.bgTransition.progress = 1.0;
            ZM.bgTransition.current = [...ZM.bgTransition.target];
            ZM.bgTransition.isTransitioning = false; // Stop checking
          } else {
            // Cache lerped color: interpolate from start to target
            ZM.bgTransition.current = lerpColor(
              ZM.bgTransition.start,
              ZM.bgTransition.target,
              ZM.bgTransition.progress
            );
          }
        }
      }
      
      // Update transitions (in ALL canvases including display windows)
      // This allows display windows to animate camera/geometry/FOV transitions
      
      // Update camera transition
      if (ZM.camera.transition.isActive) {
        ZM.camera.updateTransition(dt);
        // Sync to params for consistency
        ZM.params.cameraRotationX = ZM.camera.rotationX;
        ZM.params.cameraRotationY = ZM.camera.rotationY;
        ZM.params.cameraDistance = ZM.camera.distance;
        ZM.params.cameraOffsetX = ZM.camera.offsetX;
        ZM.params.cameraOffsetY = ZM.camera.offsetY;
      }
      
      // Update FOV transition
      if (ZM.fovTransition.isTransitioning) {
        ZM.fovTransition.progress += dt / ZM.fovTransition.duration;
        if (ZM.fovTransition.progress >= 1.0) {
          ZM.fovTransition.progress = 1.0;
          ZM.fovTransition.current = ZM.fovTransition.target;
          ZM.params.fov = ZM.fovTransition.target;
          ZM.fovTransition.isTransitioning = false;
        } else {
          // Ease-in-out cubic
          const t = ZM.fovTransition.progress < 0.5
            ? 4 * ZM.fovTransition.progress * ZM.fovTransition.progress * ZM.fovTransition.progress
            : 1 - Math.pow(-2 * ZM.fovTransition.progress + 2, 3) / 2;
          ZM.fovTransition.current = ZM.fovTransition.start + (ZM.fovTransition.target - ZM.fovTransition.start) * t;
        }
      }
      
      // Update emitter rotation transition
      if (ZM.emitterRotationTransition.isTransitioning) {
        ZM.emitterRotationTransition.progress += dt / ZM.emitterRotationTransition.duration;
        if (ZM.emitterRotationTransition.progress >= 1.0) {
          ZM.emitterRotationTransition.progress = 1.0;
          ZM.emitterRotationTransition.current = ZM.emitterRotationTransition.target;
          ZM.params.emitterRotation = ZM.emitterRotationTransition.target;
          ZM.emitterRotationTransition.isTransitioning = false;
        } else {
          // Ease-in-out cubic
          const t = ZM.emitterRotationTransition.progress < 0.5
            ? 4 * ZM.emitterRotationTransition.progress * ZM.emitterRotationTransition.progress * ZM.emitterRotationTransition.progress
            : 1 - Math.pow(-2 * ZM.emitterRotationTransition.progress + 2, 3) / 2;
          ZM.emitterRotationTransition.current = ZM.emitterRotationTransition.start + (ZM.emitterRotationTransition.target - ZM.emitterRotationTransition.start) * t;
        }
      }
      
      // Update geometry scale transition
      if (ZM.geometryScaleTransition.isTransitioning) {
        ZM.geometryScaleTransition.progress += dt / ZM.geometryScaleTransition.duration;
        if (ZM.geometryScaleTransition.progress >= 1.0) {
          ZM.geometryScaleTransition.progress = 1.0;
          ZM.geometryScaleTransition.current = ZM.geometryScaleTransition.target;
          ZM.params.geometryScale = ZM.geometryScaleTransition.target;
          ZM.geometryScaleTransition.isTransitioning = false;
        } else {
          // Ease-in-out cubic
          const t = ZM.geometryScaleTransition.progress < 0.5
            ? 4 * ZM.geometryScaleTransition.progress * ZM.geometryScaleTransition.progress * ZM.geometryScaleTransition.progress
            : 1 - Math.pow(-2 * ZM.geometryScaleTransition.progress + 2, 3) / 2;
          ZM.geometryScaleTransition.current = ZM.geometryScaleTransition.start + (ZM.geometryScaleTransition.target - ZM.geometryScaleTransition.start) * t;
        }
      }
      
      // Update speed transition
      if (ZM.speedTransition.isTransitioning) {
        ZM.speedTransition.progress += dt / ZM.speedTransition.duration;
        if (ZM.speedTransition.progress >= 1.0) {
          ZM.speedTransition.progress = 1.0;
          ZM.speedTransition.current = ZM.speedTransition.target;
          ZM.params.speed = ZM.speedTransition.target;
          ZM.speedTransition.isTransitioning = false;
          console.log('✓ Speed transition complete:', ZM.params.speed);
        } else {
          // Ease-in-out cubic
          const t = ZM.speedTransition.progress < 0.5
            ? 4 * ZM.speedTransition.progress * ZM.speedTransition.progress * ZM.speedTransition.progress
            : 1 - Math.pow(-2 * ZM.speedTransition.progress + 2, 3) / 2;
          ZM.speedTransition.current = ZM.speedTransition.start + (ZM.speedTransition.target - ZM.speedTransition.start) * t;
          ZM.params.speed = ZM.speedTransition.current;
          if (Math.floor(ZM.speedTransition.progress * 10) !== Math.floor((ZM.speedTransition.progress - dt / ZM.speedTransition.duration) * 10)) {
            console.log('🏃 Speed transitioning:', ZM.params.speed.toFixed(1), `(${(ZM.speedTransition.progress * 100).toFixed(0)}%)`);
          }
        }
      }
      
      // Primary canvas only: Auto-trigger random state switching (only on primary canvas AND not in display mode)
        // Each trigger loads a TRULY RANDOM state (excluding current) - no sequence or pattern
        if (isPrimary && !ZM.isDisplayMode && ZM.params.autoTriggerStates && ZM.stateManager && ZM.stateManager.states.length > 1) {
          // Only increment timer if not paused
          if (!ZM.autoTriggerTimer.paused) {
            ZM.autoTriggerTimer.elapsed += dt;
            if (ZM.autoTriggerTimer.elapsed >= ZM.params.autoTriggerFrequency) {
              ZM.autoTriggerTimer.elapsed = 0;
              ZM.stateManager.loadRandomState(); // Fresh random selection each time
            }
          }
          
          // PERFORMANCE FIX: Throttle UI updates to ~10fps instead of 60fps
          // DOM manipulation is expensive - no need to update countdown every frame
          if (!ZM._lastUIUpdate) ZM._lastUIUpdate = 0;
          if (now - ZM._lastUIUpdate >= 0.1) { // Update every 100ms (10fps)
            ZM._lastUIUpdate = now;
            if (ZM.stateManager.updateAutoTriggerStatus) {
              ZM.stateManager.updateAutoTriggerStatus();
            }
          }
        }
      
      // Clear background with cached color (no per-frame lerp)
      p.background(...ZM.bgTransition.current);
      
      // Setup camera with transitioning FOV
      const fovRad = ZM.fovTransition.current * (Math.PI / 180);
      const cameraZ = (ZM.H / 2) / Math.tan(fovRad / 2);
      const eyeOffsetX = eyeOffset * ZM.params.eyeSeparation;
      
      p.perspective(fovRad, ZM.W / ZM.H, ZM.params.near, ZM.params.far);
      // Both stereo cameras look at center (0,0,0) for proper convergence
      p.camera(eyeOffsetX, 0, cameraZ, 0, 0, 0, 0, 1, 0);
      
      // Apply camera transforms
      p.translate(ZM.camera.offsetX, ZM.camera.offsetY, -ZM.camera.distance);
      p.rotateX(ZM.camera.rotationX);
      p.rotateY(ZM.camera.rotationY);
      p.rotateZ(ZM.emitterRotationTransition.current * Math.PI / 180);
      
      // Apply geometry scale (use transition value)
      const scaleVal = ZM.geometryScaleTransition.current / 100;
      p.scale(scaleVal);
      
      emitter.lines.forEach(line => {
        line.draw(p, ZM);
        if (perfMon && isPrimary) perfMon.recordDraw();
      });
      
      // Performance monitoring
      if (perfMon && isPrimary) {
        perfMon.endFrame(emitter.lines.length);
      }
    };
    
    return p;
  };
}

export function initializeSketches(ZM) {
  console.log('🎬 initializeSketches called');
  console.log('  - stereoscopicMode:', ZM.params.stereoscopicMode);
  console.log('  - framebufferMode:', ZM.params.framebufferMode);
  console.log('  - Current dimensions:', ZM.W, 'x', ZM.H);
  console.log('  - noiseOffset:', ZM.noiseOffset.toFixed(3));
  
  // Preserve existing emitter (don't restart animation)
  if (ZM.emitterInstance && ZM.emitterInstance.lines) {
    console.log('  - Preserving emitter with', ZM.emitterInstance.lines.length, 'existing lines');
  }
  
  // CRITICAL: Remove p5 instances FIRST, before touching DOM
  // This ensures graceful cleanup and prevents stale references
  if (ZM.p5Instance) {
    ZM.p5Instance.remove();
    ZM.p5Instance = null;
  }
  if (ZM.p5InstanceRight) {
    ZM.p5InstanceRight.remove();
    ZM.p5InstanceRight = null;
  }
  
  // Reset sketch ready flag (will be set to true when setup completes)
  ZM.sketchReady = false;
  
  // Reset shared time since new p5 instances will start with millis() = 0
  sharedLastTime = 0;
  
  // DO NOT clear emitter instance - we want to preserve existing lines
  // Exception: Don't clear during stereo mode toggle, but states/presets should clear emitter separately
  // ZM.emitterInstance = null; // ❌ Never clear here - preserves animation across mode changes
  
  const wrapper = document.getElementById('canvas-wrapper');
  if (!wrapper) {
    console.error('❌ canvas-wrapper element not found!');
    return;
  }
  
  if (ZM.params.stereoscopicMode) {
    // Store old dimensions for proportional scaling
    const prevW = ZM.W;
    const prevH = ZM.H;
    
    console.log('  - BEFORE dimension update:');
    console.log('    prevW:', prevW, 'prevH:', prevH);
    console.log('    Camera offsets:', ZM.camera.offsetX.toFixed(2), ZM.camera.offsetY.toFixed(2));
    
    // Update dimensions for stereo mode
    if (ZM.params.framebufferMode) {
      ZM.W = ZM.params.framebufferWidth;
      ZM.H = ZM.params.framebufferHeight;
    } else {
      ZM.W = Math.floor(window.innerWidth / 2);
      ZM.H = window.innerHeight;
    }
    
    console.log('  - AFTER dimension update:');
    console.log('    newW:', ZM.W, 'newH:', ZM.H);
    console.log('    dimensionsChanged:', (ZM.W !== prevW || ZM.H !== prevH));
    
    // Scale existing emitter and lines proportionally to new dimensions
    // Only scale if dimensions actually changed (mode toggle, not reload)
    const dimensionsChanged = (ZM.W !== prevW || ZM.H !== prevH);
    if (ZM.emitterInstance && prevW && prevH && dimensionsChanged) {
      const scaleX = ZM.W / prevW;
      const scaleY = ZM.H / prevH;
      console.log('  - Scaling emitter geometry:', scaleX.toFixed(3), 'x', scaleY.toFixed(3));
      
      // Scale emitter position
      ZM.emitterInstance.x *= scaleX;
      ZM.emitterInstance.y *= scaleY;
      ZM.emitterInstance.canvasWidth = ZM.W;
      ZM.emitterInstance.canvasHeight = ZM.H;
      
      // Scale all existing lines
      for (const line of ZM.emitterInstance.lines) {
        line.x *= scaleX;
        line.y *= scaleY;
        line.canvasWidth = ZM.W;
        line.canvasHeight = ZM.H;
      }
      
      // CRITICAL: Scale camera offsets to match scene scaling
      // Camera offsets are pan values that need to scale with scene coordinates
      ZM.camera.offsetX *= scaleX;
      ZM.camera.offsetY *= scaleY;
      console.log('  - Camera offsets scaled to:', ZM.camera.offsetX.toFixed(1), ',', ZM.camera.offsetY.toFixed(1));
    } else if (ZM.emitterInstance) {
      // Dimensions didn't change, just update canvas dimensions
      ZM.emitterInstance.canvasWidth = ZM.W;
      ZM.emitterInstance.canvasHeight = ZM.H;
      for (const line of ZM.emitterInstance.lines) {
        line.canvasWidth = ZM.W;
        line.canvasHeight = ZM.H;
      }
    }
    
    // NOW clear DOM and rebuild structure
    wrapper.innerHTML = '';
    wrapper.classList.add('stereoscopic');
    
    const container = document.createElement('div');
    container.className = 'stereo-container';
    
    ['left', 'right'].forEach(side => {
      const eye = document.createElement('div');
      eye.className = 'stereo-eye';
      eye.id = `${side}-eye-container`;
      const canvasDiv = document.createElement('div');
      canvasDiv.id = `${side}-canvas`;
      eye.appendChild(canvasDiv);
      container.appendChild(eye);
    });
    
    wrapper.appendChild(container);
    
    const eyeSep = ZM.params.eyeSeparation;
    ZM.p5Instance = new p5(createSketch(ZM, -eyeSep / 100, 'left-canvas'));
    ZM.p5InstanceRight = new p5(createSketch(ZM, eyeSep / 100, 'right-canvas'));
    
    console.log('✓ Canvases created in stereo mode');
    console.log('  - Canvas dimensions:', ZM.W, 'x', ZM.H);
    console.log('  - Emitter preserved:', ZM.emitterInstance ? 'YES' : 'NO');
    if (ZM.emitterInstance) {
      console.log('  - Lines count:', ZM.emitterInstance.lines.length);
      console.log('  - Emitter position:', ZM.emitterInstance.x.toFixed(1), ',', ZM.emitterInstance.y.toFixed(1));
    }
    
    if (ZM.params.framebufferMode) {
      setTimeout(() => updateCanvasSize(ZM), 50);
    }
  } else {
    // === MONO MODE ===
    // Store old dimensions for proportional scaling
    const prevW = ZM.W;
    const prevH = ZM.H;
    
    console.log('  - BEFORE dimension update:');
    console.log('    prevW:', prevW, 'prevH:', prevH);
    console.log('    Camera offsets:', ZM.camera.offsetX.toFixed(2), ZM.camera.offsetY.toFixed(2));
    
    // Update dimensions for mono mode
    if (ZM.params.framebufferMode) {
      ZM.W = ZM.params.framebufferWidth;
      ZM.H = ZM.params.framebufferHeight;
    } else {
      ZM.W = window.innerWidth;
      ZM.H = window.innerHeight;
    }
    
    console.log('  - AFTER dimension update:');
    console.log('    newW:', ZM.W, 'newH:', ZM.H);
    console.log('    dimensionsChanged:', (ZM.W !== prevW || ZM.H !== prevH));
    
    // Scale existing emitter and lines proportionally to new dimensions
    // Only scale if dimensions actually changed (mode toggle, not reload)
    const dimensionsChanged = (ZM.W !== prevW || ZM.H !== prevH);
    if (ZM.emitterInstance && prevW && prevH && dimensionsChanged) {
      const scaleX = ZM.W / prevW;
      const scaleY = ZM.H / prevH;
      console.log('  - Scaling emitter geometry:', scaleX.toFixed(3), 'x', scaleY.toFixed(3));
      
      // Scale emitter position
      ZM.emitterInstance.x *= scaleX;
      ZM.emitterInstance.y *= scaleY;
      ZM.emitterInstance.canvasWidth = ZM.W;
      ZM.emitterInstance.canvasHeight = ZM.H;
      
      // Scale all existing lines
      for (const line of ZM.emitterInstance.lines) {
        line.x *= scaleX;
        line.y *= scaleY;
        line.canvasWidth = ZM.W;
        line.canvasHeight = ZM.H;
      }
      
      // CRITICAL: Scale camera offsets to match scene scaling
      // Camera offsets are pan values that need to scale with scene coordinates
      ZM.camera.offsetX *= scaleX;
      ZM.camera.offsetY *= scaleY;
      console.log('  - Camera offsets scaled to:', ZM.camera.offsetX.toFixed(1), ',', ZM.camera.offsetY.toFixed(1));
    } else if (ZM.emitterInstance) {
      // Dimensions didn't change, just update canvas dimensions
      ZM.emitterInstance.canvasWidth = ZM.W;
      ZM.emitterInstance.canvasHeight = ZM.H;
      for (const line of ZM.emitterInstance.lines) {
        line.canvasWidth = ZM.W;
        line.canvasHeight = ZM.H;
      }
    }
    
    // NOW clear DOM and rebuild structure
    wrapper.innerHTML = '<div id="mono-canvas"></div>';
    wrapper.classList.remove('stereoscopic');
    
    ZM.p5Instance = new p5(createSketch(ZM, 0, 'mono-canvas'));
    ZM.p5InstanceRight = null;
    
    console.log('✓ Canvas created in mono mode');
    console.log('  - Canvas dimensions:', ZM.W, 'x', ZM.H);
    console.log('  - Emitter preserved:', ZM.emitterInstance ? 'YES' : 'NO');
    if (ZM.emitterInstance) {
      console.log('  - Lines count:', ZM.emitterInstance.lines.length);
      console.log('  - Emitter position:', ZM.emitterInstance.x.toFixed(1), ',', ZM.emitterInstance.y.toFixed(1));
    }
    
    if (ZM.params.framebufferMode) {
      setTimeout(() => updateCanvasSize(ZM), 50);
    }
  }
}

/**
 * Updates canvas size based on framebuffer mode
 */
export function updateCanvasSize(ZM) {
  if (!ZM.p5Instance) return;
  
  const wrapper = document.getElementById('canvas-wrapper');
  
  if (ZM.params.framebufferMode) {
    const W = ZM.params.framebufferWidth;
    const H = ZM.params.framebufferHeight;
    ZM.W = W;
    ZM.H = H;
    
    wrapper.classList.add('framebuffer-mode');
    
    // Pixel density 1 for exact framebuffer resolution
    ZM.p5Instance.pixelDensity(1);
    if (ZM.p5InstanceRight) ZM.p5InstanceRight.pixelDensity(1);
    
    // Resize p5 canvases to exact framebuffer pixel dimensions
    ZM.p5Instance.resizeCanvas(W, H);
    if (ZM.p5InstanceRight) ZM.p5InstanceRight.resizeCanvas(W, H);
    
    if (ZM.params.stereoscopicMode) {
      // Stereo + framebuffer:
      // Wrapper fills full viewport so the split stays exactly at screen center.
      // Each eye's available display area is half the viewport width × full height.
      // Scale the framebuffer canvas to fit within that area, preserving aspect ratio.
      const eyeW = Math.floor(window.innerWidth / 2);
      const eyeH = window.innerHeight;
      const scale = Math.min(eyeW / W, eyeH / H); // Allow upscaling
      const displayW = Math.round(W * scale);
      const displayH = Math.round(H * scale);
      
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      
      // Override p5's own inline style.width/height with the computed display size.
      // Inline styles take priority over both CSS rules and p5's resizeCanvas values.
      ZM.p5Instance.canvas.style.width = `${displayW}px`;
      ZM.p5Instance.canvas.style.height = `${displayH}px`;
      ZM.p5Instance.canvas.style.transform = 'none';
      
      if (ZM.p5InstanceRight) {
        ZM.p5InstanceRight.canvas.style.width = `${displayW}px`;
        ZM.p5InstanceRight.canvas.style.height = `${displayH}px`;
        ZM.p5InstanceRight.canvas.style.transform = 'none';
      }
    } else {
      // Mono + framebuffer: scale the wrapper (and canvas) to fit the viewport
      const scaleX = window.innerWidth / W;
      const scaleY = window.innerHeight / H;
      const scale = Math.min(scaleX, scaleY); // Allow upscaling
      const displayW = Math.round(W * scale);
      const displayH = Math.round(H * scale);
      
      wrapper.style.width = `${displayW}px`;
      wrapper.style.height = `${displayH}px`;
      
      ZM.p5Instance.canvas.style.width = `${displayW}px`;
      ZM.p5Instance.canvas.style.height = `${displayH}px`;
      ZM.p5Instance.canvas.style.transform = 'none';
    }
  } else {
    // Non-framebuffer: native resolution, canvas sized to match the viewport
    ZM.p5Instance.pixelDensity(ZM.p5Instance.displayDensity());
    if (ZM.p5InstanceRight) ZM.p5InstanceRight.pixelDensity(ZM.p5InstanceRight.displayDensity());
    
    wrapper.classList.remove('framebuffer-mode');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    
    if (ZM.params.stereoscopicMode) {
      ZM.W = Math.floor(window.innerWidth / 2);
      ZM.H = window.innerHeight;
    } else {
      ZM.W = window.innerWidth;
      ZM.H = window.innerHeight;
    }
    
    ZM.p5Instance.resizeCanvas(ZM.W, ZM.H);
    if (ZM.p5InstanceRight) ZM.p5InstanceRight.resizeCanvas(ZM.W, ZM.H);
    
    // Clear any explicit inline sizing set during framebuffer mode.
    // p5's resizeCanvas() will have set its own style.width/height, which is correct here.
    ZM.p5Instance.canvas.style.width = '';
    ZM.p5Instance.canvas.style.height = '';
    ZM.p5Instance.canvas.style.transform = 'none';
    if (ZM.p5InstanceRight) {
      ZM.p5InstanceRight.canvas.style.width = '';
      ZM.p5InstanceRight.canvas.style.height = '';
      ZM.p5InstanceRight.canvas.style.transform = 'none';
    }
  }
}

// Export wrapped functions that will be attached to ZM
export function attachToZM(ZM) {
  ZM.initializeSketches = () => initializeSketches(ZM);
  ZM.updateCanvasSize = () => updateCanvasSize(ZM);
}
