export type Pattern =
  | "warm-white"
  | "cool-white"
  | "multi-color"
  | "candy-cane"
  | "icicle"
  | "blue"
  | "halloween"
  | "orange";

export interface MiniLightArea {
  id: string;
  points: { x: number; y: number }[]; // CANVAS PIXELS (CanvasEditor denormalizes before calling)
  pattern: Pattern;
  size: number;      // 0.5 - 1.5px
  density: number;   // 5% - 80%
  brightness: number; // 0..100
  visible: boolean;
}

export function renderMiniLights(
  ctx: CanvasRenderingContext2D,
  area: MiniLightArea,
  canvasWidth: number,
  canvasHeight: number
) {
  if (!area.visible || (area.points?.length ?? 0) < 3) return;

  const brightness = clamp(area.brightness / 100, 0, 1);
  const colors = patternColors(area.pattern);
  
  // Create a polygon path for the area
  const polygon = area.points;
  
  // Calculate the area of the polygon to make density proportional
  const polygonArea = calculatePolygonArea(polygon);
  
  // Generate random points within the polygon based on density and actual area
  // Base density: 1 light per 40 square pixels at 100% density (2.5x more dense)
  const baseLightsPerArea = polygonArea / 40;
  const numLights = Math.floor((area.density / 100) * baseLightsPerArea);
  const lightPositions = generatePointsInPolygon(polygon, numLights);
  
  // Create offscreen canvas for glow effects
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = canvasWidth;
  glowCanvas.height = canvasHeight;
  const glowCtx = glowCanvas.getContext('2d')!;

  for (let i = 0; i < lightPositions.length; i++) {
    const pos = lightPositions[i];
    const color = colors[i % colors.length];
    
    // Draw the main mini light (very small)
    drawMiniLight(ctx, pos.x, pos.y, color, brightness, area.size);
    
    // Add soft glow on separate layer
    drawMiniGlow(glowCtx, pos.x, pos.y, color, brightness, area.size);
  }

  // Apply blur and composite the glow
  glowCtx.filter = 'blur(2px)';
  glowCtx.globalCompositeOperation = 'source-over';
  glowCtx.drawImage(glowCanvas, 0, 0);
  glowCtx.filter = 'none';

  // Add the glow to main canvas
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.6;
  ctx.drawImage(glowCanvas, 0, 0);
  ctx.restore();
}

/* ---------- Colors ---------- */
const WARM_WHITE = 'rgb(255, 180, 80)';
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

/* ---------- Mini Light Drawing Functions ---------- */
function drawMiniLight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  brightness: number,
  size: number
) {
  const radius = size;
  
  ctx.save();
  
  // Main light body
  ctx.fillStyle = color;
  ctx.globalAlpha = brightness * 0.9;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Bright center
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.globalAlpha = brightness;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

function drawMiniGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  brightness: number,
  size: number
) {
  // Validate coordinates to prevent non-finite values
  if (!isFinite(x) || !isFinite(y) || !isFinite(brightness) || !isFinite(size)) {
    return;
  }
  
  const glowSize = size * 4;
  
  // Create soft glow
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
  gradient.addColorStop(0, withAlpha(color, 0.6 * brightness));
  gradient.addColorStop(0.4, withAlpha(color, 0.3 * brightness));
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, glowSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------- Utility Functions ---------- */
function generatePointsInPolygon(polygon: { x: number; y: number }[], numPoints: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  
  // Find bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const point of polygon) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  
  // Generate random points and test if they're inside the polygon
  let attempts = 0;
  const maxAttempts = numPoints * 10; // Prevent infinite loops
  
  while (points.length < numPoints && attempts < maxAttempts) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    
    if (isPointInPolygon({ x, y }, polygon)) {
      points.push({ x, y });
    }
    attempts++;
  }
  
  return points;
}

function isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  let inside = false;
  const { x, y } = point;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
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

function calculatePolygonArea(polygon: { x: number; y: number }[]): number {
  if (polygon.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area) / 2;
}