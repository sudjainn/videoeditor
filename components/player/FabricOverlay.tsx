
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Track, TrackType, Clip, LayerProperties } from '../../types';

interface FabricOverlayProps {
  tracks: Track[];
  width: number;
  height: number;
  selectedClipId: string | null;
  onSelectClip: (id: string | null, showPanel?: boolean) => void;
  onUpdateClip: (id: string, updates: Partial<Clip>) => void;
}

export interface FabricOverlayRef {
  update: (time: number) => void;
}

interface AnimationController {
  seek: (time: number) => void;
}

interface CacheEntry {
  object: any; // fabric.Object
  props: LayerProperties;
  controller: AnimationController | null;
  duration?: number;
  lastModified?: number; // Added from new version
}

export const FabricOverlay = forwardRef<FabricOverlayRef, FabricOverlayProps>(({
  tracks,
  width,
  height,
  selectedClipId,
  onSelectClip,
  onUpdateClip,
  isMobile
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const isRebuildingRef = useRef(false); // Guard for selection events
  const loadingIds = useRef<Set<string>>(new Set()); // Track items currently loading to prevent duplicate calls
  
  // Store objects and metadata
  const fabricObjectsMap = useRef<Map<string, CacheEntry>>(new Map());
  
  const tracksRef = useRef(tracks);
  useEffect(() => { tracksRef.current = tracks; }, [tracks]);

  const selectedClipIdRef = useRef(selectedClipId);
  useEffect(() => { selectedClipIdRef.current = selectedClipId; }, [selectedClipId]);

  const dimensionsRef = useRef({ width, height });
  useEffect(() => { dimensionsRef.current = { width, height }; }, [width, height]);

  // Expose imperative update method to parent
  useImperativeHandle(ref, () => ({
    update: (currentTime: number) => {
      syncCanvas(currentTime);
    }
  }));

  // Handle dimension changes (Added from new version)
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setDimensions({ width, height });
      fabricCanvasRef.current.renderAll();
    }
  }, [width, height]);

  // Initialize Fabric Canvas
  useEffect(() => {
    const fabric = (window as any).fabric;
    if (!fabric || !containerRef.current) return;

    // --- Override Textbox _renderBackground to support rounded corners ---
    if (!fabric.Textbox.prototype._renderBackgroundOriginal) {
       fabric.Textbox.prototype._renderBackgroundOriginal = fabric.Textbox.prototype._renderBackground;
       fabric.Textbox.prototype._renderBackground = function(ctx: CanvasRenderingContext2D) {
          if (!this.backgroundColor && !this.textBackgroundColor) return;
          
          if (this.backgroundColor) {
              const dim = this._getNonTransformedDimensions();
              ctx.fillStyle = this.backgroundColor;
              
              if (this.rx || this.ry) {
                  // Draw Rounded Rect for Background
                  const w = dim.x;
                  const h = dim.y;
                  const x = -w / 2;
                  const y = -h / 2;
                  const rx = this.rx || 0;
                  const ry = this.ry || 0;
                  
                  ctx.beginPath();
                  ctx.moveTo(x + rx, y);
                  ctx.lineTo(x + w - rx, y);
                  ctx.quadraticCurveTo(x + w, y, x + w, y + ry);
                  ctx.lineTo(x + w, y + h - ry);
                  ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h);
                  ctx.lineTo(x + rx, y + h);
                  ctx.quadraticCurveTo(x, y + h, x, y + h - ry);
                  ctx.lineTo(x, y + ry);
                  ctx.quadraticCurveTo(x, y, x + rx, y);
                  ctx.closePath();
                  ctx.fill();
              } else {
                  ctx.fillRect(-dim.x / 2, -dim.y / 2, dim.x, dim.y);
              }
              // Prevent standard shadow from being applied twice or incorrectly if needed
              this._removeShadow(ctx);
          }
          
          if (this.textBackgroundColor) {
             if (!this.backgroundColor) {
                 this._renderBackgroundOriginal(ctx);
             }
          }
       };
    }

    const canvasEl = document.createElement('canvas');
    canvasEl.width = width;
    canvasEl.height = height;
    containerRef.current.appendChild(canvasEl);

    console.log("[FabricOverlay] Initializing Canvas");
    const canvas = new fabric.Canvas(canvasEl, {
      width,
      height,
      preserveObjectStacking: true,
      selection: true,
      renderOnAddRemove: false,
      enableRetinaScaling: false
    });

    fabricCanvasRef.current = canvas;

    // Set global defaults (Added from new version)
    fabric.Object.prototype.set({
      transparentCorners: false, 
      cornerColor: '#ffffff', 
      cornerStrokeColor: '#6366f1',
      borderColor: '#6366f1', 
      cornerSize: isMobile ? 50 : 15,
      cornerStyle: 'circle',
      padding: 0,
      originX: 'center', 
      originY: 'center',
      strokeUniform: true
    });

    // Alignment Guides Setup
    const vLine = new fabric.Line([width / 2, 0, width / 2, height], {
      stroke: '#ef4444',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      visible: false,
      opacity: 0.8,
      data: { isVLine: true }
    });
    const hLine = new fabric.Line([0, height / 2, width, height / 2], {
      stroke: '#ef4444',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      visible: false,
      opacity: 0.8,
      data: { isHLine: true }
    });
    canvas.add(vLine, hLine);

    canvas.on('object:moving', (e: any) => {
      const obj = e.target;
      if (!obj || obj.data?.id === undefined) return;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const threshold = 10; 

      let vSnap = false;
      let hSnap = false;

      // Vertical Center Alignment
      if (Math.abs(obj.left - centerX) < threshold) {
        obj.set({ left: centerX });
        vSnap = true;
      }

      // Horizontal Center Alignment
      if (Math.abs(obj.top - centerY) < threshold) {
        obj.set({ top: centerY });
        hSnap = true;
      }

      if (vSnap || hSnap) {
          obj.setCoords();
      }

      vLine.set({ visible: vSnap });
      hLine.set({ visible: hSnap });
      if (vSnap) vLine.bringToFront();
      if (hSnap) hLine.bringToFront();
    });

    canvas.on('before:render', () => {
        const ctx = canvas.getContext();
  ctx.clearRect(0, 0, canvas.getWidth(), canvas.getHeight());
        });

        canvas.on('after:render', () => {
        canvas.requestRenderAll();
        });

    canvas.on('mouse:up', () => {
      vLine.set({ visible: false });
      hLine.set({ visible: false });
      canvas.requestRenderAll();
    });

    canvas.on('selection:created', (e: any) => {
      if (isRebuildingRef.current) return;
      const activeObj = e.selected?.[0];
      if (activeObj && activeObj.data?.id) {
        if (selectedClipIdRef.current !== activeObj.data.id) {
           onSelectClip(activeObj.data.id, false);
        }
      }
    });

    canvas.on('selection:updated', (e: any) => {
      if (isRebuildingRef.current) return;
      const activeObj = e.selected?.[0];
      if (activeObj && activeObj.data?.id) {
        onSelectClip(activeObj.data.id, false);
      }
    });

    canvas.on('selection:cleared', () => {
      if (isRebuildingRef.current) return;
      if (selectedClipIdRef.current !== null) {
        onSelectClip(null);
      }
    });

    canvas.on('object:modified', (e: any) => {
      const target = e.target;
      if (!target || !target.data?.id) return;
      
      const properties: Partial<LayerProperties> = {
        x: (target.left / (canvas.width || 1)) * 100,
        y: (target.top / (canvas.height || 1)) * 100,
        scaleX: target.scaleX,
        scaleY: target.scaleY,
        rotation: target.angle,
        skewX: target.skewX,
        skewY: target.skewY,
      };

      if (target.type === 'textbox') {
         // When a textbox is scaled via corner controls, Fabric scales scaleX/scaleY.
         // For textboxes, we usually want to convert that scale into width and font size changes
         // to avoid visual distortion and keep the text crisp.
         if (target.scaleX !== 1 || target.scaleY !== 1) {
             const newWidth = target.width * target.scaleX;
             const newFontSize = target.fontSize * target.scaleY;
             target.set({
                 width: newWidth,
                 fontSize: newFontSize,
                 scaleX: 1,
                 scaleY: 1
             });
         }

         properties.text = target.text;
         properties.fontSize = target.fontSize;
         properties.width = target.width; 
         properties.scaleX = 1;
         properties.scaleY = 1;
         if (typeof target.fill === 'string') {
             properties.color = target.fill;
         }
         properties.fontFamily = target.fontFamily;
         properties.fontWeight = target.fontWeight;
         properties.fontStyle = target.fontStyle;
         properties.textAlign = target.textAlign;
         properties.textDecoration = target.underline ? 'underline' : target.linethrough ? 'linethrough' : 'none';
      }
      
      onUpdateClip(target.data.id, { properties });
    });

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
      fabricObjectsMap.current.clear();
      loadingIds.current.clear();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setWidth(width);
      fabricCanvasRef.current.setHeight(height);
      
      // Update guide lines positions
      const canvas = fabricCanvasRef.current;
      const objects = canvas.getObjects();
      const vLine = objects.find((o: any) => o.data?.isVLine);
      const hLine = objects.find((o: any) => o.data?.isHLine);
      if (vLine) vLine.set({ x1: width / 2, x2: width / 2, y2: height, left: width / 2 });
      if (hLine) hLine.set({ y1: height / 2, y2: height / 2, x2: width, top: height / 2 });

      fabricCanvasRef.current.requestRenderAll();
    }
  }, [width, height]);

  useEffect(() => {
     const canvas = fabricCanvasRef.current;
     if (!canvas) return;

     if (!selectedClipId) {
       canvas.discardActiveObject();
       canvas.requestRenderAll();
       return;
     }

     const activeObject = canvas.getActiveObject();
     if (activeObject && activeObject.data?.id === selectedClipId) return;

     const entry = fabricObjectsMap.current.get(selectedClipId);
     if (entry && entry.object) {
       canvas.setActiveObject(entry.object);
       canvas.requestRenderAll();
     }
  }, [selectedClipId]);

  const applyCommonProps = (obj: any, props: LayerProperties) => {
      const fabric = (window as any).fabric;
      if (!fabric || !obj) return;

      const hasShadow = (props.shadowColor && props.shadowColor !== 'transparent');
      if (hasShadow) {
          obj.set('shadow', new fabric.Shadow({
              color: props.shadowColor,
              blur: props.shadowBlur || 0,
              offsetX: props.shadowOffsetX || 0,
              offsetY: props.shadowOffsetY || 0
          }));
      } else {
          obj.set('shadow', null);
      }

      if (props.stroke && props.strokeWidth && props.strokeWidth > 0) {
          obj.set('stroke', props.stroke);
          obj.set('strokeWidth', props.strokeWidth);
          // Ensure stroke is painted correct order
          obj.set('paintFirst', 'stroke');
          // if (obj.type === 'textbox') {
          //     obj.set('paintFirst', 'stroke');
          // }
      } else {
          obj.set('stroke', null);
          obj.set('strokeWidth', 0);
      }
      
      obj.set('opacity', props.opacity !== undefined ? props.opacity : 1);

      obj.set({
          // originX: 'center',
          // originY: 'center',
          // left: (props.x ?? 50) / 100 * dimensionsRef.current.width,
          // top: (props.y ?? 50) / 100 * dimensionsRef.current.height,
          skewX: props.skewX || 0,
          skewY: props.skewY || 0,
          scaleX: props.scaleX ?? 1,
          scaleY: props.scaleY ?? 1,
          angle: props.rotation || 0,
          opacity: props.opacity ?? 1
      });

      if (obj.isType('textbox') && props.width) {
        obj.set('width', props.width);
      }

      if (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'path') {
        if (obj.type === 'textbox') {
          // Calculate RGBA for background
          let bgCol = props.backgroundColor || '#000000';
          if (props.backgroundOpacity !== undefined && props.backgroundOpacity < 1) {
              bgCol = new fabric.Color(bgCol).setAlpha(props.backgroundOpacity).toRgba();
          }

          if (props.backgroundStyle === 'block') {
            obj.set('backgroundColor', bgCol);
            obj.set('textBackgroundColor', '');
            // Set custom radius properties
            obj.set('rx', props.backgroundCornerRadius || 0);
            obj.set('ry', props.backgroundCornerRadius || 0);
            // Apply padding to make box larger than text
            obj.set('padding', 10);
          } else if (props.backgroundStyle === 'strip') {
            obj.set('backgroundColor', '');
            obj.set('textBackgroundColor', bgCol);
            obj.set('rx', 0);
            obj.set('ry', 0);
            obj.set('padding', 0);
          } else {
            obj.set('backgroundColor', '');
            obj.set('textBackgroundColor', '');
            obj.set('padding', 0);
          }
        }

        if (props.textureImage) {
            fabric.util.loadImage(props.textureImage, (img: HTMLImageElement) => {
                if (img && fabricCanvasRef.current) {
                    obj.set('fill', new fabric.Pattern({ source: img, repeat: 'repeat' }));
                    fabricCanvasRef.current.requestRenderAll();
                }
            }, null, { crossOrigin: 'anonymous' });
        } else if (typeof props.color === 'string') {
            obj.set('fill', props.color || '#ffffff');
        }
      }

      if (obj.type === 'group' && props.colorOverrides) {
        const overrides = props.colorOverrides;
        const applyColor = (object: any) => {
             if (object.fill && typeof object.fill === 'string' && overrides[object.fill]) {
                 object.set('fill', overrides[object.fill]);
             }
             if (object.type === 'group' && object._objects) {
                 object._objects.forEach(applyColor);
             }
             if (object.type === 'path' && object.fill && overrides[object.fill]) {
                 object.set('fill', overrides[object.fill]);
             }
        };
        obj._objects?.forEach(applyColor);
      }
  };

  const createAnimatedTextGroup = (props: LayerProperties, canvas: any, duration: number) => {
    const fabric = (window as any).fabric;
    const textStr = props.text || ' '; 
    const dummy = new fabric.Textbox(textStr, {
        width: props.width || 400,
        fontSize: props.fontSize || 60,
        fontFamily: props.fontFamily || 'Inter',
        fontWeight: props.fontWeight || 600,
        fontStyle: props.fontStyle || 'normal',
        textAlign: props.textAlign || 'left',
        charSpacing: (props.charSpacing || 0) * 10,
        lineHeight: props.lineHeight || 1.16,
        splitByGrapheme: false
    });
    if (!dummy._textLines && dummy._initDimensions) dummy._initDimensions();

    const letters: any[] = [];
    const textLines = dummy._textLines || []; 
    const totalHeight = textLines.length * dummy.fontSize * dummy.lineHeight;
    let currentTop = -totalHeight / 2;

    for (let i = 0; i < textLines.length; i++) {
        const lineContent = textLines[i];
        const lineStr = (typeof lineContent === 'string') ? lineContent : (Array.isArray(lineContent) ? lineContent.join('') : String(lineContent));
        const lineWidth = dummy.getLineWidth(i);
        let currentLeft = 0;
        if (props.textAlign === 'center') currentLeft = -lineWidth / 2;
        else if (props.textAlign === 'right') currentLeft = (dummy.width / 2) - lineWidth;
        else currentLeft = -dummy.width / 2;

        for (let j = 0; j < lineStr.length; j++) {
            const char = lineStr.charAt(j);
            const tempChar = new fabric.Text(char, {
                fontSize: props.fontSize || 60,
                fontFamily: props.fontFamily || 'Inter',
                fontWeight: props.fontWeight || 600,
                fontStyle: props.fontStyle || 'normal',
                charSpacing: (props.charSpacing || 0) * 10,
                objectCaching: false,
            });
            const t = new fabric.Text(char, {
                left: currentLeft,
                top: currentTop,
                fill: props.color || '#ffffff',
                fontFamily: props.fontFamily || 'Inter',
                fontWeight: props.fontWeight || 600,
                fontSize: props.fontSize || 60,
                fontStyle: props.fontStyle || 'normal',
                underline: props.textDecoration === 'underline',
                linethrough: props.textDecoration === 'linethrough',
                // stroke: props.stroke,
                // strokeWidth: props.strokeWidth,
                // strokeUniform: true, 
                // paintFirst: 'stroke',
                // shadowColor: props.shadowColor,
                // shadowBlur: props.shadowBlur,
                opacity: 1, 
                originX: 'left',
                originY: 'top',
                objectCaching: false,
            });
            letters.push(t);
            currentLeft += tempChar.width;
        }
        currentTop += dummy.fontSize * dummy.lineHeight;
    }

    const group = new fabric.Group(letters, {
        left: (props.x || 50) / 100 * width,
        top: (props.y || 50) / 100 * height,
        originX: 'center',
        originY: 'center',
        scaleX: props.scaleX || 1,
        scaleY: props.scaleY || 1,
        angle: props.rotation || 0,
        selectable: true,
        transparentCorners: false,
        cornerColor: '#ffffff',
        borderColor: '#6366f1',
        objectCaching: false,
        clipPath: new fabric.Rect({
          left: 0,
          top: 0,
          width: dummy.width,
          height: totalHeight,
          originX: 'center',
          originY: 'center',
          absolutePositioned: false
      })
    });
    
    applyCommonProps(group, props);
    const controller = createAnimationController(group, props.animation || 'fadeIn', duration); 
    return { group, controller };
  };

  const createAnimationController = (group: any, preset: string, durationSec: number): AnimationController => {
    const anime = (window as any).anime;
    if (!anime) return { seek: () => {} };
    const objects = group._objects;
    const durationMs = durationSec * 1000;
    const animations: { instance: any, proxy: any, targetObj: any, duration: any, loop?: boolean }[] = [];
    const groupCenter = { x: 0, y: 0 }; 

    objects.forEach((obj: any, i: number) => {
    const targetState = {
      opacity: obj.opacity || 1,
      left: obj.left,
      top: obj.top,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      skewX: 0,
      skewY: 0
    };
    
    const proxy = { ...targetState };
    let animeParams: any = {
      targets: proxy,
      easing: 'easeOutExpo',
      duration: 1000,
      delay: i * 50,
      autoplay: false
    };

    // ✅ COMPLETE ANIMATION_PRESETS COVERAGE
    switch (preset) {
      // === IN ANIMATIONS ===
      case 'typewriter':
        proxy.opacity = 0;
        animeParams.opacity = [{ value: 0, duration: 0 }, { value: 1, duration: 1 }];
        animeParams.easing = 'linear';
        animeParams.duration = 1;
        animeParams.delay = i * 100;
        break;

      case 'pop':
        proxy.scaleX = 0;
        proxy.scaleY = 0;
        animeParams.scaleX = 1;
        animeParams.scaleY = 1;
        animeParams.easing = 'spring(1, 80, 10, 0)';
        animeParams.delay = i * 40;
        break;

      case 'jump':
        animeParams.top = [
          { value: targetState.top - 25, duration: 300, easing: 'easeOutSine' },
          { value: targetState.top, duration: 300, easing: 'easeInSine' }
        ];
        animeParams.loop = true;
        animeParams.delay = i * 100;
        break;

      case 'flicker':
        proxy.opacity = 0.2;
        animeParams.opacity = [
          { value: 1, duration: 100 },
          { value: 0.2, duration: 100 },
          { value: 1, duration: 100 },
          { value: 0.5, duration: 100 },
          { value: 1, duration: 200 }
        ];
        animeParams.loop = true;
        animeParams.delay = i * 50;
        break;

      case 'float':
        animeParams.top = [
          { value: targetState.top - 10, duration: 1500, easing: 'easeInOutSine' },
          { value: targetState.top + 5, duration: 1500, easing: 'easeInOutSine' },
          { value: targetState.top, duration: 1500, easing: 'easeInOutSine' }
        ];
        animeParams.loop = true;
        animeParams.delay = i * 200;
        break;

      case 'zoom':
      case 'scale':
        proxy.scaleX = 3;
        proxy.scaleY = 3;
        proxy.opacity = 0;
        animeParams.scaleX = 1;
        animeParams.scaleY = 1;
        animeParams.opacity = 1;
        animeParams.easing = 'easeOutQuart';
        animeParams.delay = i * 50;
        break;

      case 'slideTop':
        proxy.top = targetState.top + 50;
        proxy.opacity = 0;
        animeParams.top = targetState.top;
        animeParams.opacity = 1;
        break;

      case 'slideBottom':
        proxy.top = targetState.top - 50;
        proxy.opacity = 0;
        animeParams.top = targetState.top;
        animeParams.opacity = 1;
        break;

      case 'slideLeft':
        proxy.left = targetState.left + 100;
        proxy.opacity = 0;
        animeParams.left = targetState.left;
        animeParams.opacity = 1;
        break;

      case 'slideRight':
        proxy.left = targetState.left - 100;
        proxy.opacity = 0;
        animeParams.left = targetState.left;
        animeParams.opacity = 1;
        break;

      case 'headline':
        proxy.left = targetState.left - 50;
        proxy.opacity = 0;
        animeParams.left = targetState.left;
        animeParams.opacity = 1;
        animeParams.easing = 'easeOutExpo';
        animeParams.duration = 800;
        break;

      case 'rise':
        proxy.top = targetState.top + 30;
        proxy.opacity = 0;
        animeParams.top = targetState.top;
        animeParams.opacity = 1;
        animeParams.easing = 'easeOutBack';
        break;

      case 'compress':
        proxy.scaleX = 0.3;
        proxy.scaleY = 0.3;
        proxy.opacity = 0;
        animeParams.scaleX = 1;
        animeParams.scaleY = 1;
        animeParams.opacity = 1;
        animeParams.easing = 'easeOutElastic(1, .8)';
        break;

      case 'bounce':
        animeParams.top = [
          { value: targetState.top - 30, duration: 200 },
          { value: targetState.top + 10, duration: 200 },
          { value: targetState.top, duration: 200 }
        ];
        animeParams.easing = 'easeOutBounce';
        break;

      case 'flipboard':
        proxy.angle = -90;
        proxy.opacity = 0;
        animeParams.angle = 0;
        animeParams.opacity = 1;
        animeParams.easing = 'easeOutQuart';
        break;

      case 'dragonfly':
        proxy.scaleX = 0;
        proxy.scaleY = 0;
        proxy.opacity = 0;
        animeParams.scaleX = [0.5, 1.2, 1];
        animeParams.scaleY = [0.5, 1.2, 1];
        animeParams.opacity = 1;
        animeParams.duration = 1200;
        break;

      case 'block':
        proxy.opacity = 0;
        proxy.scaleX = 0;
        proxy.scaleY = 0;
        animeParams.opacity = 1;
        animeParams.scaleX = 1;
        animeParams.scaleY = 1;
        animeParams.easing = 'easeOutBack';
        break;
    case 'fadeOut':
        animeParams.delay = Math.max(0, durationMs - 1000) + (i * 30); 
        animeParams.duration = 800; 
        animeParams.opacity = 0;
        break;

      case 'emphasize':
        animeParams.scaleX = [
          { value: 1.2, duration: 200, easing: 'easeInOutQuad' },
          { value: 1, duration: 200, easing: 'easeInOutQuad' }
        ];
        animeParams.scaleY = animeParams.scaleX;
        animeParams.delay = i * 100 + 1000;
        animeParams.loop = true;
        animeParams.endDelay = 2000;
        break;

      // === OUT ANIMATIONS ===
      case 'fadeOut':
        animeParams.delay = Math.max(0, durationMs - 1000) + (i * 30); 
        animeParams.duration = 800; 
        animeParams.opacity = 0;
        break;

      case 'slideOut':
        proxy.left = targetState.left - 100;
        animeParams.left = targetState.left - 200;
        animeParams.opacity = 0;
        break;

      case 'blockOut':
        proxy.opacity = 1;
        animeParams.opacity = 0;
        animeParams.scaleX = 0;
        animeParams.scaleY = 0;
        break;

      case 'zoomOut':
        proxy.scaleX = 1;
        proxy.scaleY = 1;
        animeParams.scaleX = 3;
        animeParams.scaleY = 3;
        animeParams.opacity = 0;
        break;

      case 'sink':
        proxy.top = targetState.top;
        animeParams.top = targetState.top + 100;
        animeParams.opacity = 0;
        animeParams.easing = 'easeInSine';
        break;

      case 'popOut':
        proxy.scaleX = 1;
        proxy.scaleY = 1;
        animeParams.scaleX = 0;
        animeParams.scaleY = 0;
        animeParams.opacity = 0;
        animeParams.easing = 'spring(1, 80, 10, 0)';
        break;

      case 'drop':
        proxy.top = targetState.top;
        animeParams.top = targetState.top + 100;
        animeParams.opacity = 0;
        animeParams.easing = 'easeInQuad';
        break;

      case 'decompress':
        proxy.scaleX = 1;
        proxy.scaleY = 1;
        animeParams.scaleX = 0.3;
        animeParams.scaleY = 0.3;
        animeParams.opacity = 0;
        break;

      case 'fall':
        proxy.top = targetState.top;
        animeParams.top = targetState.top + 200;
        animeParams.opacity = 0;
        animeParams.easing = 'easeInQuart';
        break;

      case 'skid':
        proxy.left = targetState.left;
        proxy.angle = 0;
        animeParams.left = targetState.left + 150;
        animeParams.angle = 15;
        animeParams.opacity = 0;
        break;

      case 'wave':
        proxy.top = targetState.top;
        animeParams.top = [
          { value: targetState.top - 10, duration: 150 },
          { value: targetState.top + 20, duration: 300 },
          { value: targetState.top + 100, duration: 300 }
        ];
        animeParams.opacity = 0;
        break;

      // === LOOP ANIMATIONS ===
      case 'spin':
        proxy.angle = 0;
        animeParams.angle = 360;
        animeParams.duration = 3000;
        animeParams.loop = true;
        animeParams.easing = 'linear';
        break;

      case 'waveLoop':
        animeParams.top = [
          { value: targetState.top - 5, duration: 1000 },
          { value: targetState.top + 5, duration: 1000 },
          { value: targetState.top, duration: 1000 }
        ];
        animeParams.loop = true;
        animeParams.easing = 'easeInOutSine';
        break;

      case 'pulse':
        animeParams.scaleX = [1, 1.1, 1];
        animeParams.scaleY = [1, 1.1, 1];
        animeParams.duration = 1500;
        animeParams.loop = true;
        break;

      case 'heartbeat':
        animeParams.scaleX = [1, 1.3, 1.1, 1];
        animeParams.scaleY = [1, 1.1, 1.2, 1];
        animeParams.duration = 1200;
        animeParams.loop = true;
        animeParams.easing = 'easeInOutSine';
        break;

      case 'vogue':
        animeParams.angle = [0, 10, -10, 10, 0];
        animeParams.scaleX = [1, 1.05, 0.95, 1.05, 1];
        animeParams.duration = 2000;
        animeParams.loop = true;
        break;

      case 'dragonflyLoop':
        animeParams.scaleX = [1, 1.2, 0.8, 1];
        animeParams.scaleY = [1, 0.8, 1.2, 1];
        animeParams.duration = 1800;
        animeParams.loop = true;
        break;

      case 'billboard':
        animeParams.opacity = [1, 0.7, 1];
        animeParams.scaleX = [1, 1.05, 1];
        animeParams.duration = 2000;
        animeParams.loop = true;
        break;

      case 'roll':
        proxy.left = targetState.left;
        proxy.angle = 0;
        proxy.opacity = 1;
        
        //   animeParams.left = targetState.left + 50;
        animeParams.angle = 360;
        animeParams.opacity = [1, 0.4, 1];  // Trail fade
        animeParams.duration = 2500;
        animeParams.loop = true;
        animeParams.easing = 'easeInOutCubic';
        animeParams.delay = i * 100;        // Stagger letters
        break;

      // === DEFAULT ===
      case 'fadeIn':
      default:
        proxy.opacity = 0;
        animeParams.opacity = 1;
        break;
    }

    const instance = anime(animeParams);
    animations.push({ instance, proxy, targetObj: obj, duration: instance.duration });
  });

  return {
  seek: (timelineMs: number) => {
    let isAnyLoop = false;
    animations.forEach(({ instance, targetObj, proxy, duration, loop }) => {
      if (!duration) return;

      // Map global time → local looping time
      let local = timelineMs
      if(loop) {
        isAnyLoop = true;
        local = ((timelineMs % duration) + duration) % duration;
      }

      instance.seek(local);

      targetObj.set({
        opacity: proxy.opacity,
        left: proxy.left,
        top: proxy.top,
        scaleX: proxy.scaleX,
        scaleY: proxy.scaleY,
        angle: proxy.angle || 0,
        skewX: proxy.skewX || 0,
        skewY: proxy.skewY || 0,
        fill: targetObj.fill, 
        stroke: targetObj.stroke,
        strokeWidth: targetObj.strokeWidth,
        paintFirst: 'stroke',
        dirty: true
      });
    });
    
    if(isAnyLoop) {
      group.canvas?.requestRenderAll();
    }
  },
};
};


  const createSvgGroup = (clip: Clip, canvas: any, callback: (group: any) => void) => {
    const fabric = (window as any).fabric;
    fabric.loadSVGFromURL(clip.source, (objects: any[], options: any) => {
        const group = fabric.util.groupSVGElements(objects, options);
        const props = clip.properties;
        group.set({
            left: (props.x || 50) / 100 * width,
            top: (props.y || 50) / 100 * height,
            originX: 'center',
            originY: 'center',
            scaleX: props.scaleX || 1,
            scaleY: props.scaleY || 1,
            angle: props.rotation || 0,
            selectable: true,
            transparentCorners: false,
            cornerColor: '#ffffff',
            borderColor: '#6366f1',
        });
        if (group.width > width * 0.5) group.scaleToWidth(width * 0.3);
        applyCommonProps(group, props);
        callback(group);
    });
  };

  const createLyricGroup = (clip: Clip, canvas: any) => {
    const fabric = (window as any).fabric;
    const props = clip.properties;
    const words = props.lyrics || [];
    const isDynamic = props.lyricsStyle === 'dynamic';
    const baseSize = props.fontSize || (isDynamic ? 60 : 50);
    const spacing = props.wordSpacing !== undefined ? props.wordSpacing : 10;
    const lineHeightMult = props.lineHeight || 1.2;

    const pseudoRandom = (seed: number) => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const chunks: typeof words[] = [];
    words.forEach(w => {
        const cId = w.chunkId || 0;
        if (!chunks[cId]) chunks[cId] = [];
        chunks[cId].push(w);
    });

    const textObjects: any[] = [];
    
    chunks.forEach((chunkWords, chunkIndex) => {
        if (!chunkWords || chunkWords.length === 0) return;

        const measuredWords = chunkWords.map((w, i) => {
            let fontSize = baseSize;
            let rotation = 0;
            
            if (isDynamic) {
                const rand = pseudoRandom(w.word.length + i * 13 + chunkIndex * 7);
                if (rand > 0.7) fontSize = baseSize * 1.5;
                else if (rand < 0.2) fontSize = baseSize * 0.75;
                rotation = (rand - 0.5) * 10;
            }

            const tempText = new fabric.Text(w.word, {
                fontSize: fontSize,
                fontFamily: props.fontFamily || 'Inter',
                fontWeight: props.fontWeight || 'normal',
                fontStyle: props.fontStyle || 'normal',
            });
            
            return {
                ...w,
                fontSize,
                rotation,
                width: tempText.width,
                height: tempText.height,
                descent: tempText.height * 0.2
            };
        });

        const maxWidth = width * 0.8;
        const lines: { words: typeof measuredWords, width: number, height: number, maxAscent: number }[] = [];
        let currentLine: typeof measuredWords = [];
        let currentLineWidth = 0;

        measuredWords.forEach(mw => {
            if (currentLineWidth + mw.width > maxWidth && currentLine.length > 0) {
                const maxH = Math.max(...currentLine.map(w => w.height));
                const maxAscent = Math.max(...currentLine.map(w => w.height - w.descent));
                lines.push({ 
                    words: currentLine, 
                    width: currentLineWidth - spacing,
                    height: maxH,
                    maxAscent: maxAscent
                });
                currentLine = [mw];
                currentLineWidth = mw.width + spacing;
            } else {
                currentLine.push(mw);
                currentLineWidth += mw.width + spacing;
            }
        });
        if (currentLine.length > 0) {
            const maxH = Math.max(...currentLine.map(w => w.height));
            const maxAscent = Math.max(...currentLine.map(w => w.height - w.descent));
            lines.push({ 
                 words: currentLine, 
                 width: currentLineWidth - spacing,
                 height: maxH,
                 maxAscent: maxAscent
            });
        }

        const chunkTotalHeight = lines.reduce((sum, line) => sum + (line.height * lineHeightMult), 0);
        const chunkStartY = -chunkTotalHeight / 2;
        let cursorY = 0;

        lines.forEach(line => {
            let cursorX = -line.width / 2;
            line.words.forEach(mw => {
                const baselineOffset = line.maxAscent - (mw.height - mw.descent);
                const t = new fabric.Text(mw.word, {
                    left: cursorX,
                    top: chunkStartY + cursorY + baselineOffset,
                    fontSize: mw.fontSize,
                    fontFamily: props.fontFamily || 'Inter',
                    fill: props.color || '#ffffff',
                    fontWeight: props.fontWeight || 'normal',
                    fontStyle: props.fontStyle || 'normal',
                    underline: props.textDecoration === 'underline',
                    linethrough: props.textDecoration === 'linethrough',
                    originX: 'left',
                    originY: 'top',
                    angle: mw.rotation,
                    selectable: false,
                    opacity: 0, 
                });
                applyCommonProps(t, props);
                t.data = { startTime: mw.time, chunkId: mw.chunkId, isWord: true };
                textObjects.push(t);
                cursorX += mw.width + spacing;
            });
            cursorY += line.height * lineHeightMult;
        });
    });

    const group = new fabric.Group(textObjects, {
        left: (props.x || 50) / 100 * width,
        top: (props.y || 50) / 100 * height,
        originX: 'center',
        originY: 'center',
        selectable: true,
        subTargetCheck: false,
        objectCaching: false,
        strokeUniform: true  
    });
    
    return group;
  };

  const syncCanvas = (time: number) => {
    const fabric = (window as any).fabric;
    const canvas = fabricCanvasRef.current;
    if (!canvas || !fabric) return;

    const activeClips = (tracksRef.current || []).flatMap(t => t.clips.filter(c => 
        time >= c.startOffset && time < c.startOffset + c.duration &&
        ((t.type === TrackType.AUDIO && c.properties.lyrics?.length) || 
         (t.type === TrackType.VISUALIZER) ||
         (t.type !== TrackType.AUDIO && !t.isHidden && (t.type === TrackType.TEXT || t.type === TrackType.OBJECT || t.type === TrackType.IMAGE)))
    ));
    
    let dirty = false;

    fabricObjectsMap.current.forEach((entry, id) => {
      if (!activeClips.find(c => c.id === id)) {
        canvas.remove(entry.object);
        fabricObjectsMap.current.delete(id);
        loadingIds.current.delete(id);
        dirty = true;
      }
    });

    activeClips.forEach(clip => {
      if (loadingIds.current.has(clip.id)) return;

      let entry = fabricObjectsMap.current.get(clip.id);
      const props = clip.properties;
      let needsRebuild = !entry;

      if (entry) {
          const prev = entry.props;
          if (clip.type === TrackType.TEXT) {
             const isAnimated = !!(props.animation && props.animation !== '');
             const wasAnimated = !!(prev.animation && prev.animation !== '');
             
             if (isAnimated !== wasAnimated) needsRebuild = true;
             else if (isAnimated) {
                  if (prev.animation !== props.animation || 
                     prev.text !== props.text || 
                     prev.fontFamily !== props.fontFamily || 
                     prev.color !== props.color || 
                     prev.fontSize !== props.fontSize ||
                     prev.fontWeight !== props.fontWeight || 
                     prev.fontStyle !== props.fontStyle ||
                     prev.textDecoration !== props.textDecoration || 
                     prev.textAlign !== props.textAlign ||
                     prev.lineHeight !== props.lineHeight ||
                     prev.charSpacing !== props.charSpacing ||
                     entry.duration !== clip.duration) {
                     needsRebuild = true;
                 }
             } else {
                 if (prev.textureImage !== props.textureImage) needsRebuild = true;
             }
          } else if (clip.type === TrackType.OBJECT) {
              if (clip.source !== (entry.object as any).__sourceUrl) needsRebuild = true;
          } else if (clip.type === TrackType.AUDIO) {
              if (JSON.stringify(prev.lyrics) !== JSON.stringify(props.lyrics) || 
                  prev.lyricsStyle !== props.lyricsStyle ||
                  prev.fontFamily !== props.fontFamily ||
                  prev.fontSize !== props.fontSize ||
                  prev.fontWeight !== props.fontWeight ||
                  prev.fontStyle !== props.fontStyle ||
                  prev.wordSpacing !== props.wordSpacing || 
                  prev.lineHeight !== props.lineHeight ||
                  prev.textDecoration !== props.textDecoration ||
                  prev.textureImage !== props.textureImage ||
                  prev.stroke !== props.stroke || 
                  prev.strokeWidth !== props.strokeWidth ||
                  prev.shadowColor !== props.shadowColor ||
                  prev.shadowBlur !== props.shadowBlur) {
                  needsRebuild = true;
              }
          }
      }

      if (needsRebuild && !isRebuildingRef.current) {
          if (entry) canvas.remove(entry.object);
          
          // Clear active transform to prevent "uniScaleKey" errors if obj is removed while interacting
          if (canvas._currentTransform && canvas._currentTransform.target === entry?.object) {
              canvas._currentTransform = null;
          }

          if (entry) {
              if (canvas.getActiveObject() === entry.object) {
                  canvas.discardActiveObject();
              }
              canvas.remove(entry.object);
              fabricObjectsMap.current.delete(clip.id);
          }

          if (clip.type === TrackType.OBJECT) {
             loadingIds.current.add(clip.id);
             createSvgGroup(clip, canvas, (fabricObj) => {
                 loadingIds.current.delete(clip.id);
                 if (!fabricCanvasRef.current) return;
                 (fabricObj as any).__sourceUrl = clip.source;
                 fabricObj.data = { id: clip.id };
                 canvas.add(fabricObj);
                 if (selectedClipIdRef.current === clip.id) {
                     canvas.setActiveObject(fabricObj);
                 }
                 fabricObjectsMap.current.set(clip.id, { object: fabricObj, props: props, controller: null, duration: clip.duration });
                 canvas.requestRenderAll();
                 isRebuildingRef.current = false;
             });
             return; 
          } 
          else if (clip.type === TrackType.AUDIO) {
              const lyricGroup = createLyricGroup(clip, canvas);
              lyricGroup.data = { id: clip.id };
              canvas.add(lyricGroup);
              if (selectedClipIdRef.current === clip.id) {
                  canvas.setActiveObject(lyricGroup);
              }
              const newEntry = { object: lyricGroup, props: props, controller: null, duration: clip.duration};
              fabricObjectsMap.current.set(clip.id, newEntry);
              entry = newEntry; 
              dirty = true;
              isRebuildingRef.current = false;
          }
          else if (clip.type === TrackType.IMAGE && clip.source) {
              isRebuildingRef.current = true;
              fabric.Image.fromURL(clip.source, (imgObj: any) => {
                  imgObj.set({ originX: 'center', originY: 'center', data: { id: clip.id, isImage: true } });
                  applyCommonProps(imgObj, props);
                  canvas.add(imgObj);
                  if (selectedClipIdRef.current === clip.id) canvas.setActiveObject(imgObj);
                  fabricObjectsMap.current.set(clip.id, { object: imgObj, props: { ...props }, controller: null });
                  isRebuildingRef.current = false;
                  canvas.requestRenderAll();
              }, { crossOrigin: 'anonymous' });
          }
          else {
              let fabricObj: any;
              let controller: AnimationController | null = null;
              if (props.animation && props.animation !== '') {
                  const result = createAnimatedTextGroup(props, canvas, clip.duration);
                  fabricObj = result.group;
                  controller = result.controller;
              } else {
                  fabricObj = new fabric.Textbox(props.text || 'Text', {
                      left: (props.x || 50) / 100 * width,
                      top: (props.y || 50) / 100 * height,
                      width: props.width || 400,
                      fontSize: props.fontSize || 40,
                      fill: props.color || '#ffffff',
                      fontFamily: props.fontFamily || 'Inter',
                      fontWeight: props.fontWeight || 600,
                      fontStyle: props.fontStyle || 'normal',
                      textAlign: props.textAlign || 'left',
                      underline: props.textDecoration === 'underline',
                      linethrough: props.textDecoration === 'linethrough',
                      charSpacing: (props.charSpacing || 0) * 10,
                      originX: 'center',
                      originY: 'center',
                      scaleX: props.scaleX || 1,
                      scaleY: props.scaleY || 1,
                      angle: props.rotation || 0,
                      selectable: true,
                      transparentCorners: false,
                      cornerColor: '#ffffff',
                      borderColor: '#6366f1',
                      // lockScalingFlip: true,
                      // lockScalingY: true,
                      lockScalingFlip: true
                  });
                  fabricObj.setControlsVisibility({
                      mt: false,
                      mb: false,
                      ml: true,
                      mr: true,
                      bl: true,
                      br: true,
                      tl: true,
                      tr: true,
                      mtr: true
                  });
                  applyCommonProps(fabricObj, props);
              }

              fabricObj.data = { id: clip.id };
              canvas.add(fabricObj);
              if (selectedClipIdRef.current === clip.id) {
                canvas.setActiveObject(fabricObj);
              }
              const newEntry = { object: fabricObj, props: props, controller: controller, duration: clip.duration };
              fabricObjectsMap.current.set(clip.id, newEntry);
              entry = newEntry;
              dirty = true;
              isRebuildingRef.current = false;
          }
      } 
      
      if (entry) {
          const obj = entry.object;
          
          if (clip.type === TrackType.AUDIO && obj.type === 'group') {
              try {
                  const safeProps = props || {};
                  const isKaraoke = safeProps.lyricsStyle === 'karaoke';
                  const highlightColor = safeProps.lyricHighlightColor || '#ffff00';
                  const baseColor = safeProps.color || '#ffffff';
                  let localDirty = false;

                  if (obj.objectCaching !== false) {
                       obj.set('objectCaching', false);
                  }

                  if (safeProps.color !== entry.props.color || 
                      safeProps.lyricHighlightColor !== entry.props.lyricHighlightColor) {
                      if (obj.getObjects) {
                          obj.getObjects().forEach((o: any) => {
                              if (!o.data?.isActive) {
                                  o.set('fill', baseColor);
                              }
                          });
                          localDirty = true;
                      }
                  }
                  
                  const clipTime = time - clip.startOffset;
                  const offset = typeof safeProps.lyricOffset === 'number' ? safeProps.lyricOffset : 0;
                  const effectiveTime = clipTime - offset;

                  if (obj.getObjects) {
                      const words = obj.getObjects();
                      let activeChunkId = -1;
                      
                      const startedWords = words.filter((w: any) => w.data && effectiveTime >= w.data.startTime);
                      if (startedWords.length > 0) {
                          const lastStartedWord = startedWords[startedWords.length - 1];
                          activeChunkId = lastStartedWord.data.chunkId;
                      } else {
                          if (words.length > 0) activeChunkId = words[0].data.chunkId;
                      }

                      for (let i = 0; i < words.length; i++) {
                          const wordObj = words[i];
                          if (!wordObj || !wordObj.data) continue;

                          const wTime = wordObj.data.startTime || 0;
                          const wChunkId = wordObj.data.chunkId;
                          const nextWTime = words[i+1]?.data?.startTime ?? Infinity;

                          const isCorrectChunk = wChunkId === activeChunkId;
                          const hasStarted = effectiveTime >= wTime;
                          const isVisible = isCorrectChunk && hasStarted;

                          const targetOpacity = isVisible ? 1 : 0;
                          
                          if (wordObj.opacity !== targetOpacity) {
                              wordObj.set('opacity', targetOpacity);
                              localDirty = true;
                          }
                          
                          if (isKaraoke && isVisible) {
                              const isCurrentWord = effectiveTime >= wTime && effectiveTime < nextWTime;
                              const targetColor = isCurrentWord ? highlightColor : baseColor;
                              
                              if (wordObj.fill !== targetColor) {
                                  wordObj.set('fill', targetColor);
                                  wordObj.data.isActive = isCurrentWord;
                                  localDirty = true;
                              }
                          } else {
                              if (wordObj.fill !== baseColor && !safeProps.textureImage) {
                                  wordObj.set('fill', baseColor);
                                  localDirty = true;
                              }
                          }
                      }
                  }
                  
                  if (localDirty) {
                      obj.dirty = true; 
                      dirty = true; 
                  }
              } catch (err) {}
          }

          if (!obj.isMoving && !obj.isScaling && !obj.isRotating && clip.type !== TrackType.AUDIO) {
              const targetLeft = (props.x || 50) / 100 * width;
              const targetTop = (props.y || 50) / 100 * height;
              if (Math.abs(obj.left - targetLeft) > 1) { obj.set('left', targetLeft); dirty = true; }
              if (Math.abs(obj.top - targetTop) > 1) { obj.set('top', targetTop); dirty = true; }

              if (clip.type === TrackType.TEXT && obj.type === 'textbox' && !obj.isEditing) {
                  const newText = props.text || '';
                  if (obj.text !== newText) { obj.set('text', newText); dirty = true; }
                  
                  if (obj.fontSize !== (props.fontSize || 40)) { obj.set('fontSize', props.fontSize || 40); dirty = true; }
                  
                  // Update width to support wrapping
                  if (props.width && obj.width !== props.width) { obj.set('width', props.width); dirty = true; }

                  const fillColor = props.color || '#ffffff';
                  if (obj.fill !== fillColor && !props.textureImage && typeof obj.fill === 'string') { obj.set('fill', fillColor); dirty = true; }
                  
                  const fontFam = props.fontFamily || 'Inter';
                  if (obj.fontFamily !== fontFam) { obj.set('fontFamily', fontFam); dirty = true; }
                  
                  const fontWeight = props.fontWeight || 'normal';
                  if (obj.fontWeight !== fontWeight) { obj.set('fontWeight', fontWeight); dirty = true; }

                  if (obj.fontStyle !== (props.fontStyle || 'normal')) { obj.set('fontStyle', props.fontStyle || 'normal'); dirty = true; }

                  // Add missing textAlign update
                  const tAlign = props.textAlign || 'left';
                  if (obj.textAlign !== tAlign) { obj.set('textAlign', tAlign); dirty = true; }

                  // Add missing charSpacing update
                  const cSpacing = (props.charSpacing || 0) * 10;
                  if (obj.charSpacing !== cSpacing) { obj.set('charSpacing', cSpacing); dirty = true; }
                  
                  const lh = props.lineHeight || 1.16;
                  if (obj.lineHeight !== lh) { obj.set('lineHeight', lh); dirty = true; }

                  // Force update background logic if it changed
                  let bgCol = props.backgroundColor || '#000000';
                  if (props.backgroundOpacity !== undefined && props.backgroundOpacity < 1) {
                      bgCol = new fabric.Color(bgCol).setAlpha(props.backgroundOpacity).toRgba();
                  }
                  
                  if (props.backgroundStyle === 'block') {
                      if (obj.backgroundColor !== bgCol) { obj.set('backgroundColor', bgCol); dirty = true; }
                      if (obj.rx !== (props.backgroundCornerRadius || 0)) { obj.set('rx', props.backgroundCornerRadius || 0); dirty = true; }
                  } else {
                      if (obj.backgroundColor !== '') { obj.set('backgroundColor', ''); dirty = true; }
                  }
                  // Force re-render of background override
                  obj.dirty = true;

                  const textDec = props.textDecoration;
                  const isUnderline = textDec === 'underline';
                  const isLinethrough = textDec === 'linethrough';
                  if (obj.underline !== isUnderline) { obj.set('underline', isUnderline); dirty = true; }
                  if (obj.linethrough !== isLinethrough) { obj.set('linethrough', isLinethrough); dirty = true; }
              }
              
              if (!obj.isEditing) {
                  applyCommonProps(obj, props);
                  obj.setCoords();
                  dirty = true;
              }
          }
          entry.props = props;
      }

      // 3. Seek Animation
      if (entry && entry.controller) {
          const relTimeMs = (time - clip.startOffset) * 1000;
          entry.controller.seek(relTimeMs);
          dirty = true;
      }
    });

    if (dirty) {
      canvas.requestRenderAll();
    }
  };

  return <div 
    ref={containerRef} 
    className="absolute inset-0 z-20 pointer-events-auto" 
    onClick={(e) => e.stopPropagation()} 
  />;
});
