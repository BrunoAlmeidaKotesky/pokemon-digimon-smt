// Imagens das franquias customizadas: reduzir (canvas), dar rótulo a partir do nome do arquivo e
// pegar os arquivos de um arrastar-e-soltar ou de um colar. Só a redução precisa de DOM.
import { cleanLabel, isImageDataUrl, NO_NAME } from './model';
import { CUSTOM_LIMITS } from './types';

export { isImageDataUrl };

const WEBP_Q = 0.82;
const JPEG_Q = 0.85;
/** se a imagem codificada passar de CUSTOM_LIMITS.dataChars, tenta de novo com este fator nos lados */
const RETRY_SCALE = 0.7;
const RETRIES = 3;

const notImage = (): Error => new Error('não é imagem');

/**
 * Tamanho que cabe em side×side mantendo a proporção, sem aumentar. Lados arredondados, no mínimo 1.
 * Medida inválida (0, negativa, NaN, infinita) -> { w: 0, h: 0 }.
 */
export function fitSize(w: number, h: number, side: number): { w: number; h: number } {
  if (!(w > 0 && h > 0 && side > 0) || !Number.isFinite(w) || !Number.isFinite(h)) return { w: 0, h: 0 };
  const s = Math.min(1, side / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
}

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** Desenha a imagem inteira em w×h; `white` pinta o fundo de branco antes (pra JPEG, que não tem transparência). */
function paint(ctx: Ctx, bmp: ImageBitmap, w: number, h: number, white: boolean): void {
  ctx.clearRect(0, 0, w, h);
  if (white) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, w, h);
}

async function blobToDataUrl(b: Blob): Promise<string> {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${b.type};base64,${btoa(bin)}`;
}

/** OffscreenCanvas: WebP; se o navegador devolver outro tipo (não sabe gerar WebP), JPEG com fundo branco. Sem 2d: null. */
async function viaOffscreen(bmp: ImageBitmap, w: number, h: number): Promise<string | null> {
  const c = new OffscreenCanvas(w, h);
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  paint(ctx, bmp, w, h, false);
  const webp = await c.convertToBlob({ type: 'image/webp', quality: WEBP_Q });
  if (webp.type === 'image/webp') return blobToDataUrl(webp);
  paint(ctx, bmp, w, h, true);
  return blobToDataUrl(await c.convertToBlob({ type: 'image/jpeg', quality: JPEG_Q }));
}

/** <canvas>: toDataURL devolve 'data:image/png' quando não gera WebP; aí vai JPEG com fundo branco. */
function viaCanvas(bmp: ImageBitmap, w: number, h: number): string {
  if (typeof document === 'undefined') throw new Error('sem canvas');
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('sem canvas');
  paint(ctx, bmp, w, h, false);
  const webp = c.toDataURL('image/webp', WEBP_Q);
  if (webp.startsWith('data:image/webp')) return webp;
  paint(ctx, bmp, w, h, true);
  return c.toDataURL('image/jpeg', JPEG_Q);
}

async function encode(bmp: ImageBitmap, w: number, h: number): Promise<string> {
  if (typeof OffscreenCanvas === 'function') {
    const url = await viaOffscreen(bmp, w, h);
    if (url !== null) return url;
  }
  return viaCanvas(bmp, w, h);
}

/**
 * Reduz a imagem pra caber em side×side (mantendo a proporção, sem aumentar) e devolve uma data URL WebP
 * (qualidade 0.82) ou, se o navegador não gerar WebP, JPEG (0.85, fundo branco onde era transparente).
 * Se ainda passar de CUSTOM_LIMITS.dataChars, diminui mais um pouco e tenta de novo.
 * Rejeita com Error('não é imagem') se não decodificar.
 */
export async function shrinkImage(blob: Blob, side: number = CUSTOM_LIMITS.side): Promise<string> {
  if (typeof createImageBitmap !== 'function') throw notImage();
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(blob);
  } catch {
    throw notImage();
  }
  try {
    let { w, h } = fitSize(bmp.width, bmp.height, side);
    if (!w || !h) throw notImage();
    for (let i = 0; i < RETRIES; i++) {
      const url = await encode(bmp, w, h);
      if (isImageDataUrl(url)) return url;
      w = Math.max(1, Math.round(w * RETRY_SCALE));
      h = Math.max(1, Math.round(h * RETRY_SCALE));
    }
    throw new Error('imagem grande demais');
  } finally {
    bmp.close?.();
  }
}

/** 'mr_mime-galar.png' -> 'mr mime galar' (sem extensão, _ e - viram espaço, limpo e cortado; vazio -> 'Sem nome'). */
export function labelFromFile(name: string): string {
  const base = String(name ?? '').replace(/\.[a-z0-9]{1,5}$/i, '');
  return cleanLabel(base.replace(/[_-]+/g, ' ')) || NO_NAME;
}

const IMAGE_EXT = /\.(?:png|jpe?g|webp|gif|bmp|avif|svg|ico|tiff?)$/i;

/** Arquivo de imagem pelo tipo (ou, sem tipo, pela extensão). */
function isImageFile(f: File | null | undefined): f is File {
  if (!f) return false;
  return f.type ? f.type.startsWith('image/') : IMAGE_EXT.test(f.name ?? '');
}

/**
 * Arquivos de imagem de um drop ou de um paste. Usa dt.files; se não vier nenhum arquivo ali (alguns
 * navegadores só põem a imagem colada em dt.items), pega os items do tipo image/*. Não repete arquivo.
 */
export function imagesFromDataTransfer(dt: DataTransfer): File[] {
  const files = Array.from(dt.files ?? []);
  if (files.length) return files.filter(isImageFile);
  const out: File[] = [];
  for (const it of Array.from(dt.items ?? [])) {
    if (it.kind !== 'file' || !it.type.startsWith('image/')) continue;
    const f = it.getAsFile();
    if (f) out.push(f);
  }
  return out;
}
