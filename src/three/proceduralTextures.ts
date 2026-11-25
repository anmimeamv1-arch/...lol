import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();
let maxAnisotropy = 1;

export function setTextureAnisotropy(aniso: number): void {
  maxAnisotropy = Math.max(1, aniso);
}

function drawMonochromePattern(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  kind: 'capulana' | 'shawl' | 'lenco' | 'church',
): void {
  const tones = [
    ['#e4e4e7', '#27272a', '#71717a'],
    ['#d4d4d8', '#18181b', '#52525b'],
    ['#f4f4f5', '#3f3f46', '#a1a1aa'],
    ['#27272a', '#e4e4e7', '#71717a'],
    ['#3f3f46', '#f4f4f5', '#a1a1aa'],
    ['#52525b', '#e4e4e7', '#27272a'],
  ];
  const [bg, fg, mid] = tones[seed % tones.length];

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = fg;
  ctx.fillStyle = mid;

  const patternType = seed % 4;
  if (kind === 'church') {
    // Architectural medallion motif for church capulana banners
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.44, w * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.44, w * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(8, h * 0.72, w - 16, 4);
  } else if (kind === 'shawl') {
    // Vertical woven stripe motif + bottom fringe silhouette
    for (let x = 8; x < w; x += 14) {
      ctx.fillRect(x, 0, 5, h - 24);
    }
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = bg;
    ctx.fillRect(0, h - 22, w, 22);
    ctx.fillStyle = fg;
    for (let x = 4; x < w - 4; x += 7) {
      ctx.fillRect(x, h - 22, 3, 20);
    }
  } else if (patternType === 0) {
    // Geometric diamonds
    ctx.lineWidth = 1.5;
    for (let y = 16; y < h; y += 26) {
      for (let x = 16; x < w; x += 26) {
        ctx.beginPath();
        ctx.moveTo(x, y - 9);
        ctx.lineTo(x + 9, y);
        ctx.lineTo(x, y + 9);
        ctx.lineTo(x - 9, y);
        ctx.closePath();
        ctx.stroke();
      }
    }
  } else if (patternType === 1) {
    // Horizontal woven bands
    for (let y = 10; y < h; y += 18) {
      ctx.fillRect(0, y, w, 6);
    }
  } else if (patternType === 2) {
    // Concentric rings
    ctx.lineWidth = 1.5;
    for (let y = 20; y < h; y += 34) {
      for (let x = 20; x < w; x += 34) {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else {
    // Diagonal herringbone lines
    ctx.lineWidth = 2;
    for (let i = -h; i < w + h; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h * 0.4, h);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Subtle matte border
  ctx.strokeStyle = 'rgba(24, 24, 27, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
}

export function getDisplayTileTexture(
  position: number,
  displayNumber: number,
  kind: 'capulana' | 'shawl' | 'lenco' | 'church',
  priceLabel?: string,
): THREE.CanvasTexture {
  const key = `disp:${position}:${displayNumber}:${kind}:${priceLabel ?? ''}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const w = 128;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  drawMonochromePattern(ctx, w, h, displayNumber, kind);

  // High-contrast top position plaque
  ctx.fillStyle = '#18181b';
  ctx.fillRect(8, 8, w - 16, 40);
  ctx.strokeStyle = '#fafafa';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(8.75, 8.75, w - 17.5, 38.5);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(position).padStart(2, '0'), w / 2, 24);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 10px "JetBrains Mono", monospace';
  ctx.fillText(`#${displayNumber}`, w / 2, 40);

  if (priceLabel) {
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(18, h - 42, w - 36, 26);
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, h - 42, w - 36, 26);
    ctx.fillStyle = '#18181b';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillText(priceLabel, w / 2, h - 29);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

export function getShelfStackTexture(column: number, isTop: boolean): THREE.CanvasTexture {
  const key = `shelf:${column}:${isTop ? 'top' : 'row'}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const w = 96;
  const h = 96;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Folded cloth layers aesthetic (monochrome)
  ctx.fillStyle = isTop ? '#d4d4d8' : '#e4e4e7';
  ctx.fillRect(0, 0, w, h);

  const layers = 6;
  const layerH = h / layers;
  for (let i = 0; i < layers; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#d4d4d8' : '#a1a1aa';
    ctx.fillRect(0, i * layerH, w, layerH - 2);
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(0, (i + 1) * layerH - 2, w, 2);
  }

  // Crisp column index badge centered on front of folded stack
  ctx.fillStyle = '#18181b';
  ctx.fillRect(14, 26, w - 28, 44);
  ctx.strokeStyle = '#fafafa';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14.75, 26.75, w - 29.5, 42.5);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`C${String(column).padStart(2, '0')}`, w / 2, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

export function getFloorGridTexture(): THREE.CanvasTexture {
  const key = 'floor-grid';
  const cached = textureCache.get(key);
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e7e7e4';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(24, 24, 27, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(24, 24, 27, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

export function getWallLabelTexture(title: string, subtitle: string): THREE.CanvasTexture {
  const key = `wall-label:${title}:${subtitle}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const w = 512;
  const h = 112;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#52525b';
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, w - 6, h - 6);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 34px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, w / 2, 42);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 20px "JetBrains Mono", monospace';
  ctx.fillText(subtitle, w / 2, 80);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}

export function disposeProceduralTextures(): void {
  for (const tex of textureCache.values()) {
    tex.dispose();
  }
  textureCache.clear();
}
