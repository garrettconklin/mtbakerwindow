export type DuskOpts = {
  exposure?: number;     // -1..+1 (negative = darker)
  contrast?: number;     // 0..1   (S-curve)
  coolShadows?: number;  // 0..0.4 blue/cyan in darks
  skyCoolTop?: number;   // 0..0.4 extra cool tint at the top
  vignette?: number;     // 0..0.6 vignette strength
  warmWindows?: number;  // 0..0.4 warm in bright areas only
};

/**
 * Realistic dusk without the blue wash.
 * - No "color" blend mode. Sky gradient uses soft-light at low opacity.
 * - Cool shadows only in deep shadows (L<150) and only when saturation is low.
 * - Slightly stronger exposure/contrast + vignette.
 */
export function applyDuskPro(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: DuskOpts = {}
) {
  const {
    exposure    = -0.65,     // much darker for twilight
    contrast    = 0.25,      // stronger contrast
    coolShadows = 0.15,      // slightly more cool in shadows
    skyCoolTop  = 0.20,      // cooler sky gradient
    vignette    = 0.40,      // stronger vignette for dramatic effect
    warmWindows = 0.15       // warmer windows to contrast the darkness
  } = opts;

  // 1) Neutral darken (no tint)
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = rgba(8,10,16, 0.35 + Math.max(0, -exposure * 0.65));
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // 2) Gentle contrast lift
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // 3) Per-pixel tone curve + targeted split-toning
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  const lut = buildToneLUT(exposure, contrast);

  // amounts
  const coolB = Math.round(255 * coolShadows);  // blue
  const coolG = Math.round(110 * coolShadows);  // a little cyan
  const warmR = Math.round(255 * warmWindows);
  const warmG = Math.round(120 * warmWindows);

  for (let i = 0; i < d.length; i += 4) {
    let r = lut[d[i]], g = lut[d[i + 1]], b = lut[d[i + 2]];
    const L = 0.2126*r + 0.7152*g + 0.0722*b;

    // chroma (quick/cheap): difference between max & min channels
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const chroma = maxC - minC;

    // Cool only deeper shadows and only if not already saturated/colored
    if (L < 150) {
      const kL = smoother(1 - L / 150);          // ramp in deep shadows
      const kC = 1 - Math.min(1, chroma / 35);   // suppress on colorful pixels
      const k  = kL * kC;
      b = clamp255(b + coolB * k);
      g = clamp255(g + coolG * k);
    }

    // Warm highlights (windows, bright interiors)
    if (L > 195) {
      const k = (L - 195) / 60;
      r = clamp255(r + warmR * k);
      g = clamp255(g + warmG * k);
    }

    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(img, x, y);

  // 4) Subtle sky coolness from the top (no hue replacement)
  //    Use SOFT-LIGHT so colors remain realistic.
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  // slightly desaturated cool tone at the very top
  sky.addColorStop(0, `rgba(70,100,160,${skyCoolTop})`);
  sky.addColorStop(0.35, "rgba(60,80,120,0.04)");
  sky.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // 5) Vignette to center attention / sell low light
  if (vignette > 0) {
    const vg = ctx.createRadialGradient(
      x + w / 2, y + h * 0.55, Math.min(w, h) * 0.22,
      x + w / 2, y + h * 0.55, Math.max(w, h) * 0.78
    );
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, `rgba(0,0,0,${vignette})`);
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = vg;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}

/* helpers */
function buildToneLUT(exposure:number, contrast:number){
  const lut = new Uint8ClampedArray(256);
  const c = Math.max(0, Math.min(1, contrast));
  for (let i=0;i<256;i++){
    let v = i/255;
    v = clamp01(v * Math.pow(2, exposure));        // exposure
    const mid=0.5, t=v-mid;
    v = clamp01(mid + t*(1+c*1.6) + (t*t*t)*c*-0.6); // S-curve
    lut[i] = (v*255)|0;
  }
  return lut;
}
function rgba(r:number,g:number,b:number,a=1){ return `rgba(${r|0},${g|0},${b|0},${Math.max(0,Math.min(1,a))})`; }
function clamp255(v:number){ return v<0?0:v>255?255:v|0; }
function clamp01(v:number){ return v<0?0:v>1?1:v; }
function smoother(t:number){ return t*t*(3-2*t); }