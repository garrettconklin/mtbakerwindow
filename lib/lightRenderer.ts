export type Pattern =
  | "warm-white"
  | "cool-white"
  | "multi-color"
  | "candy-cane"
  | "icicle"
  | "blue"
  | "halloween"
  | "orange";

export interface LightRun {
  id: string;
  points: { x: number; y: number }[]; // CANVAS PIXELS (CanvasEditor denormalizes before calling)
  pattern: Pattern;
  spacing: number;    // pixels at current canvas scale
  brightness: number; // 0..100
  visible: boolean;
}

export function renderLights(
  ctx: CanvasRenderingContext2D,
  run: LightRun
) {
  if (!run.visible || (run.points?.length ?? 0) < 2) return;

  // Smooth the path slightly for more natural curves
  const pts = smoothPolyline(run.points, 0.1);
  const centers = sampleAlongPolyline(pts, Math.max(8, run.spacing));

  const brightness = clamp(run.brightness / 100, 0, 1);
  const colors = patternColors(run.pattern);

  // Create offscreen canvas for glow effects
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = W;
  glowCanvas.height = H;
  const glowCtx = glowCanvas.getContext('2d')!;

  for (let i = 0; i < centers.length; i++) {
    const p = centers[i];
    const color = colors[i % colors.length];
    
    // Draw the main bulb (small and subtle)
    drawRealisticBulb(ctx, p.x, p.y, color, brightness);
    
    // Add soft glow on separate layer
    drawSoftGlow(glowCtx, p.x, p.y, color, brightness);
  }

  // Apply blur and composite the glow
  glowCtx.filter = 'blur(3px)';
  glowCtx.globalCompositeOperation = 'source-over';
  glowCtx.drawImage(glowCanvas, 0, 0);
  glowCtx.filter = 'none';

  // Add the glow to main canvas
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.8;
  ctx.drawImage(glowCanvas, 0, 0);
  ctx.restore();
}

/* ---------- Colors ---------- */
const WARM_WHITE = 'rgb(255, 180, 80)';   // True amber like traditional incandescent bulbs
const COOL_WHITE = 'rgb(240, 248, 255)';
const RED = 'rgb(200, 40, 40)';
const GREEN = 'rgb(40, 150, 60)';
const BLUE = 'rgb(40, 100, 200)';
const YELLOW = 'rgb(255, 180, 40)';
const ORANGE = 'rgb(255, 120, 40)';
const ICICLE_BLUE = 'rgb(40, 120, 220)';
const PURPLE = 'rgb(120, 40, 200)';

function patternColors(pattern: Pattern): string[] {
  switch (pattern) {
    case "warm-white": return [WARM_WHITE];
    case "cool-white": return [COOL_WHITE];
    case "multi-color": return [RED, GREEN, BLUE, YELLOW, ORANGE];
    case "candy-cane": return [WARM_WHITE, RED];
    case "icicle": return [COOL_WHITE, ICICLE_BLUE];
    case "blue": return [BLUE];
    case "halloween": return [ORANGE, PURPLE];
    case "orange": return [ORANGE];
  }
}

/* ---------- Bulb Drawing Functions ---------- */
function drawRealisticBulb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  brightness: number
) {
  const bulbWidth = 4;   // C9 bulb width - scaled for distance viewing
  const bulbHeight = 6;  // C9 bulb height - scaled for distance viewing
  
  ctx.save();
  
  // Draw socket first (dark base)
  ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + bulbHeight * 0.3, bulbWidth * 0.4, bulbHeight * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Main bulb body - teardrop/flame shape
  ctx.fillStyle = color;
  ctx.globalAlpha = brightness * 0.85;
  ctx.beginPath();
  // Create teardrop shape using bezier curves
  ctx.moveTo(x, y - bulbHeight * 0.5); // top point
  ctx.bezierCurveTo(
    x + bulbWidth * 0.5, y - bulbHeight * 0.3,  // top right curve
    x + bulbWidth * 0.5, y + bulbHeight * 0.1,  // bottom right curve
    x, y + bulbHeight * 0.4                     // bottom point
  );
  ctx.bezierCurveTo(
    x - bulbWidth * 0.5, y + bulbHeight * 0.1,  // bottom left curve
    x - bulbWidth * 0.5, y - bulbHeight * 0.3,  // top left curve
    x, y - bulbHeight * 0.5                     // back to top
  );
  ctx.fill();
  
  // Add faceted texture effect with subtle highlights
  ctx.globalAlpha = brightness * 0.3;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.ellipse(x - bulbWidth * 0.2, y - bulbHeight * 0.1, bulbWidth * 0.15, bulbHeight * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.ellipse(x + bulbWidth * 0.15, y + bulbHeight * 0.05, bulbWidth * 0.1, bulbHeight * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Bright filament core (intense center)
  ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
  ctx.globalAlpha = brightness * 1.2;
  ctx.beginPath();
  ctx.ellipse(x, y, bulbWidth * 0.2, bulbHeight * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Ultra-bright center point
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.globalAlpha = brightness;
  ctx.beginPath();
  ctx.ellipse(x, y, bulbWidth * 0.08, bulbHeight * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawSoftGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  brightness: number
) {
  // Validate coordinates to prevent non-finite values
  if (!isFinite(x) || !isFinite(y) || !isFinite(brightness)) {
    return; // Skip rendering if coordinates are invalid
  }
  
  const glowSize = 8.4; // Decreased by 30% from 12 to 8.4
  
  // Create realistic glow with multiple layers
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
  gradient.addColorStop(0, withAlpha(color, 0.9 * brightness));
  gradient.addColorStop(0.2, withAlpha(color, 0.7 * brightness));
  gradient.addColorStop(0.5, withAlpha(color, 0.3 * brightness));
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, glowSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Add directional light cast (downward glow)
  const downGlow = ctx.createRadialGradient(x, y + 10, 0, x, y + 10, glowSize * 0.9);
  downGlow.addColorStop(0, withAlpha(color, 0.5 * brightness));
  downGlow.addColorStop(0.6, withAlpha(color, 0.2 * brightness));
  downGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = downGlow;
  ctx.beginPath();
  ctx.ellipse(x, y + 6, glowSize * 0.9, glowSize * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

/* ---------- Utility Functions ---------- */
function smoothPolyline(points: { x: number; y: number }[], amount = 0.1) {
  if (points.length < 3) return points.slice();
  
  const smoothed: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    
    smoothed.push(current);
    
    // Add intermediate point for smoothing
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    smoothed.push({
      x: current.x + (midX - current.x) * amount,
      y: current.y + (midY - current.y) * amount
    });
  }
  smoothed.push(points[points.length - 1]);
  
  return smoothed;
}

function sampleAlongPolyline(points: { x: number; y: number }[], spacing: number) {
  if (points.length < 2) return [];
  
  const samples: Array<{ x: number; y: number; t: number }> = [];
  let totalDistance = 0;
  const segments: number[] = [];
  
  // Calculate segment lengths
  for (let i = 0; i < points.length - 1; i++) {
    const dist = distance(points[i], points[i + 1]);
    segments.push(dist);
    totalDistance += dist;
  }
  
  if (totalDistance === 0 || !isFinite(totalDistance)) return [];
  
  let currentDistance = 0;
  let targetDistance = 0; // Start at beginning for consistent 12" spacing
  
  for (let i = 0; i < points.length - 1; i++) {
    const segmentLength = segments[i];
    if (segmentLength === 0 || !isFinite(segmentLength)) continue; // Skip zero-length segments
    const start = points[i];
    const end = points[i + 1];
    
    while (currentDistance + segmentLength >= targetDistance) {
      const t = (targetDistance - currentDistance) / segmentLength;
      if (!isFinite(t)) break; // Skip if t is not finite
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;
      
      // Validate sample coordinates
      if (!isFinite(x) || !isFinite(y)) break;
      
      samples.push({
        x,
        y,
        t: targetDistance / totalDistance
      });
      
      targetDistance += spacing;
    }
    
    currentDistance += segmentLength;
  }
  
  // Always include the last point
  if (samples.length === 0 || distance(samples[samples.length - 1], points[points.length - 1]) > spacing * 0.3) {
    samples.push({
      x: points[points.length - 1].x,
      y: points[points.length - 1].y,
      t: 1
    });
  }
  
  return samples;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function withAlpha(color: string, alpha: number): string {
  const match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (match) {
    return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${clamp(alpha, 0, 1)})`;
  }
  return color;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}