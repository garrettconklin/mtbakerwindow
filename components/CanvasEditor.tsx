"use client";

import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { LightRun, MiniLightArea } from "@/app/page";
import { renderLights } from "@/lib/lightRenderer";
import { renderMiniLights } from "@/lib/miniLightRenderer";
import { applyDuskPro } from "@/lib/imageFilters";
import { Command } from "@/lib/commandHistory";

type DrawingMode = 'idle' | 'drawing-string' | 'tracing-mini';

interface CanvasEditorProps {
  image: string;
  lightRuns: LightRun[];
  miniLightAreas: MiniLightArea[];
  selectedPattern: "warm-white" | "cool-white" | "multi-color" | "candy-cane" | "icicle" | "blue" | "halloween" | "orange";
  miniLightPattern: "warm-white" | "cool-white" | "multi-color" | "candy-cane" | "icicle" | "blue" | "halloween" | "orange";
  bulbSpacing: number;
  miniLightSize: number;
  miniLightDensity: number;
  brightness: number;
  miniLightBrightness: number;
  showBefore: boolean;
  isDrawing: boolean;
  isTracingMini: boolean;
  onLightRunsChange: (runs: LightRun[]) => void;
  onMiniLightAreasChange: (areas: MiniLightArea[]) => void;
  onIsDrawingChange: (drawing: boolean) => void;
  onIsTracingMiniChange: (tracing: boolean) => void;
  onAddToHistory: (lightRuns: LightRun[], miniAreas?: MiniLightArea[]) => void;
  onExecuteCommand: (command: Command) => void;
  drawingMode: DrawingMode;
  onDrawingModeChange: (mode: DrawingMode) => void;
  cooldownUntil: number;
  onSetCooldown: (timestamp: number) => void;
  currentRun: { x: number; y: number }[];
  onCurrentRunChange: (run: { x: number; y: number }[]) => void;
  currentMiniTrace: { x: number; y: number }[];
  onCurrentMiniTraceChange: (trace: { x: number; y: number }[]) => void;
}

type Pt = { x: number; y: number }; // normalized to drawn image rect (0..1)

export const CanvasEditor = forwardRef<HTMLCanvasElement, CanvasEditorProps>(
  (
    {
      image,
      lightRuns,
      miniLightAreas,
      selectedPattern,
      miniLightPattern,
      bulbSpacing,
      miniLightSize,
      miniLightDensity,
      brightness,
      miniLightBrightness,
      showBefore,
      isDrawing,
      isTracingMini,
      onLightRunsChange,
      onMiniLightAreasChange,
      onIsDrawingChange,
      onIsTracingMiniChange,
      onAddToHistory,
      onExecuteCommand,
      drawingMode,
      onDrawingModeChange,
      cooldownUntil,
      onSetCooldown,
      currentRun,
      onCurrentRunChange,
      currentMiniTrace,
      onCurrentMiniTraceChange,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Cache of the last computed draw rectangle
    const drawRectRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

    useImperativeHandle(ref, () => canvasRef.current!);

    // Clear cooldown when it expires (forces a re-render)
    useEffect(() => {
      const now = Date.now();
      if (cooldownUntil > now) {
        const ms = Math.max(0, cooldownUntil - now);
        
        // Defensive check for setTimeout availability and functionality
        if (typeof window !== 'undefined' && 
            typeof window.setTimeout === 'function' && 
            typeof window.clearTimeout === 'function') {
          const id = window.setTimeout(() => {
            // clearing it will trigger a re-render and unfreeze the UI
            onSetCooldown(0);
          }, ms);
          return () => window.clearTimeout(id);
        }
      }
    }, [cooldownUntil, onSetCooldown]);

    const isInCooldown = Date.now() < cooldownUntil;

    useEffect(() => {
      if (imageRef.current) {
        imageRef.current.src = image;
      }
    }, [image]);

    useEffect(() => {
      const resizeCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const container = canvas.parentElement;
        if (!container) return;

        const containerWidth = container.clientWidth || 0;
        const containerHeight = container.clientHeight || 0;

        // If parent has no height, fall back to a 16:9 height based on width.
        const height =
          containerHeight > 0 ? containerHeight : Math.round(containerWidth * (9 / 16));

        canvas.width = containerWidth;
        canvas.height = height;
        setCanvasSize({ width: containerWidth, height });
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }, []);

    useEffect(() => {
      drawCanvas();
      // include selectedPattern and bulbSpacing because they affect temp run rendering
    }, [
      image,
      lightRuns,
      miniLightAreas,
      currentRun,
      currentMiniTrace,
      brightness,
      miniLightBrightness,
      showBefore,
      canvasSize,
      selectedPattern,
      miniLightPattern,
      bulbSpacing,
      miniLightSize,
      miniLightDensity,
    ]);

    const computeDrawRect = () => {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      if (!canvas || !img) return { x: 0, y: 0, w: 0, h: 0 };

      const iw = img.naturalWidth || 0;
      const ih = img.naturalHeight || 0;
      if (iw === 0 || ih === 0) return { x: 0, y: 0, w: 0, h: 0 };

      const imageAspect = iw / ih;
      const canvasAspect = canvas.width / canvas.height;

      let w: number, h: number, x: number, y: number;
      if (imageAspect > canvasAspect) {
        // image is wider than canvas
        w = canvas.width;
        h = w / imageAspect;
        x = 0;
        y = (canvas.height - h) / 2;
      } else {
        h = canvas.height;
        w = h * imageAspect;
        x = (canvas.width - w) / 2;
        y = 0;
      }
      return { x, y, w, h };
    };

    const drawCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const img = imageRef.current;

      if (!canvas || !ctx || !img) return;
      if (!img.complete || (img.naturalWidth === 0 && img.naturalHeight === 0)) return;

      const { x: drawX, y: drawY, w: drawWidth, h: drawHeight } = computeDrawRect();
      drawRectRef.current = { x: drawX, y: drawY, w: drawWidth, h: drawHeight };

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the image sized to fit
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      if (!showBefore) {
        // Professional dusk grade
        applyDuskPro(ctx, drawX, drawY, drawWidth, drawHeight, {
          exposure: -0.25,     // slight darken
          contrast: 0.12,      // soft S-curve
          coolShadows: 0.12,   // subtle cool in shadows/mids
          skyCoolTop: 0.18,    // cool the top of the frame
          vignette: 0.22,      // gentle vignette so bulbs pop
          warmWindows: 0.10    // tiny warmth in bright areas
        });

        // Render mini light areas first (behind string lights)
        miniLightAreas.forEach((area) => {
          if (!area.visible) return;
          const denormPoints = area.points.map((p: any) => ({
            x: drawX + p.x * drawWidth,
            y: drawY + p.y * drawHeight,
          }));
          const areaForRender: MiniLightArea = { ...area, points: denormPoints as any };
          renderMiniLights(ctx, areaForRender, drawWidth, drawHeight);
        });

        // Render the in-progress mini trace
        if (currentMiniTrace.length > 0) {
          const denorm = currentMiniTrace.map((p) => ({
            x: drawX + p.x * drawWidth,
            y: drawY + p.y * drawHeight,
          }));
          
          // Draw trace outline
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          denorm.forEach((point, index) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
          ctx.restore();
        }

        // Render saved light runs (convert normalized points back to canvas pixels for renderer)
        lightRuns.forEach((run) => {
          if (!run.visible) return;
          const denormPoints = run.points.map((p: any) => ({
            x: drawX + p.x * drawWidth,
            y: drawY + p.y * drawHeight,
          }));
          const runForRender: LightRun = { ...run, points: denormPoints as any };
          renderLights(ctx, runForRender);
        });

        // Render the in-progress run
        if (currentRun.length > 0) {
          const denorm = currentRun.map((p) => ({
            x: drawX + p.x * drawWidth,
            y: drawY + p.y * drawHeight,
          }));
          const tempRun: LightRun = {
            id: "temp",
            points: denorm as any,
            pattern: selectedPattern,
            spacing: bulbSpacing,
            brightness,
            visible: true,
          };
          renderLights(ctx, tempRun);
        }
      }
    };

    // Convert client coords -> canvas coords -> normalized image coords
    const getNormalizedImageCoords = (clientX: number, clientY: number): Pt | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const cx = (clientX - rect.left) * scaleX;
      const cy = (clientY - rect.top) * scaleY;

      const { x, y, w, h } = drawRectRef.current;
      // Reject clicks outside the drawn image area
      if (cx < x || cy < y || cx > x + w || cy > y + h) return null;

      return { x: (cx - x) / w, y: (cy - y) / h };
    };

    const handleCanvasClick = (event: React.MouseEvent) => {
      if (showBefore) return;
      
      // Check cooldown to prevent accidental clicks after mini trace completion
      if (isInCooldown) return;
      
      const pt = getNormalizedImageCoords(event.clientX, event.clientY);
      if (!pt) return; // ignore clicks outside the image

      // If we're tracing mini lights, ignore regular clicks
      if (isTracingMini) return;

      if (drawingMode === 'idle' && !event.shiftKey) {
        // Regular click starts string light drawing
        onCurrentRunChange([pt]);
        onDrawingModeChange('drawing-string');
      } else {
        if (isDrawing && !event.shiftKey) {
          // Prevent adding duplicate points that would create zero-length segments
          const lastPoint = currentRun[currentRun.length - 1];
          if (lastPoint && Math.abs(pt.x - lastPoint.x) < 0.001 && Math.abs(pt.y - lastPoint.y) < 0.001) {
            return; // Skip duplicate point
          }
          onCurrentRunChange([...currentRun, pt]);
        }
      }
    };

    const handleCanvasMouseMove = (event: React.MouseEvent) => {
      if (!isTracingMini) return;
      
      const pt = getNormalizedImageCoords(event.clientX, event.clientY);
      if (!pt) return;

      // Add point to trace if it's far enough from the last point
      const lastPoint = currentMiniTrace[currentMiniTrace.length - 1];
      if (!lastPoint || Math.abs(pt.x - lastPoint.x) > 0.005 || Math.abs(pt.y - lastPoint.y) > 0.005) {
        onCurrentMiniTraceChange([...currentMiniTrace, pt]);
      }
    };

    const handleCanvasMouseUp = () => {
      if (isTracingMini && currentMiniTrace.length >= 3) {
        // Finish mini light area
        const newArea: MiniLightArea = {
          id: `mini-${Date.now()}`,
          points: currentMiniTrace,
          pattern: miniLightPattern,
          size: miniLightSize,
          density: miniLightDensity,
          brightness: miniLightBrightness,
          visible: true,
        };

        // Execute command through the new system
        const command: Command = {
          kind: 'create-area',
          area: newArea
        };
        onExecuteCommand(command);

        onCurrentMiniTraceChange([]);
        onDrawingModeChange('idle');
        
        // Set cooldown to prevent accidental string light creation
        onSetCooldown(Date.now() + 100); // 100ms cooldown
      }
    };

    const handleCanvasDoubleClick = () => {
      if (isDrawing && currentRun.length >= 2) {
        // Finish current string light run
        const newRun: LightRun = {
          id: `run-${Date.now()}`,
          points: currentRun, // keep normalized
          pattern: selectedPattern,
          spacing: bulbSpacing,
          brightness,
          visible: true,
        };

        // Execute command through the new system
        const command: Command = {
          kind: 'create-run',
          run: newRun
        };
        onExecuteCommand(command);

        onCurrentRunChange([]);
        onDrawingModeChange('idle');
      }
    };

    const getCursorStyle = () => {
      if (showBefore) return 'default';
      if (isTracingMini) return 'crosshair';
      return 'crosshair';
    };

    const getStatusMessage = () => {
      if (isTracingMini) {
        return 'Drag to trace area • Release to finish • Move mouse outside to exit mini light mode';
      }
      if (isDrawing) {
        return 'Click to continue line • Double-click to finish';
      }
      return 'Click: String lights • Hold Shift+drag: Mini lights';
    };


    return (
      <div className="w-full h-full relative overflow-hidden">
        <img
          ref={imageRef}
          src={image}
          alt="House"
          className="hidden"
          onLoad={drawCanvas}
          // no sizing from CSS; use naturalWidth/Height internally
        />
        <canvas
          ref={canvasRef}
          className={`w-full h-full cursor-${getCursorStyle()}`}
          onClick={handleCanvasClick}
          onMouseDown={(e) => {
            if (e.shiftKey && drawingMode === 'idle' && !isInCooldown) {
              const pt = getNormalizedImageCoords(e.clientX, e.clientY);
              if (pt) {
                onCurrentMiniTraceChange([pt]);
                onDrawingModeChange('tracing-mini');
              }
            }
          }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onDoubleClick={handleCanvasDoubleClick}
        />
        {(isDrawing || isTracingMini) && (
          <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded text-sm">
            {getStatusMessage()}
          </div>
        )}
        {isInCooldown && (
          <div className="absolute top-4 right-4 bg-yellow-600 text-white px-3 py-1 rounded text-sm">
            Cooldown active...
          </div>
        )}
      </div>
    );
  }
);

CanvasEditor.displayName = "CanvasEditor";