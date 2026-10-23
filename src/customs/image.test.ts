import { afterEach, describe, expect, it, vi } from 'vitest';
import { fitSize, imagesFromDataTransfer, isImageDataUrl, labelFromFile, shrinkImage } from './image';
import { CUSTOM_LIMITS } from './types';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fitSize', () => {
  it('não aumenta o que já cabe', () => {
    expect(fitSize(100, 50, 512)).toEqual({ w: 100, h: 50 });
    expect(fitSize(512, 512, 512)).toEqual({ w: 512, h: 512 });
    expect(fitSize(1, 1, 512)).toEqual({ w: 1, h: 1 });
  });

  it('reduz pelo maior lado, mantendo a proporção', () => {
    expect(fitSize(1024, 512, 512)).toEqual({ w: 512, h: 256 });
    expect(fitSize(600, 1200, 512)).toEqual({ w: 256, h: 512 });
    expect(fitSize(2000, 2000, 512)).toEqual({ w: 512, h: 512 });
    expect(fitSize(1000, 333, 512)).toEqual({ w: 512, h: 170 });
  });

  it('lado muito fino fica com pelo menos 1px', () => {
    expect(fitSize(10000, 1, 512)).toEqual({ w: 512, h: 1 });
    expect(fitSize(3, 9000, 512)).toEqual({ w: 1, h: 512 });
  });

  it('medida inválida vira 0x0', () => {
    for (const [w, h, s] of [[0, 10, 512], [10, 0, 512], [-5, 10, 512], [NaN, 10, 512], [10, Infinity, 512], [10, 10, 0]] as const) {
      expect(fitSize(w, h, s)).toEqual({ w: 0, h: 0 });
    }
  });
});

describe('labelFromFile', () => {
  it('tira a extensão e troca _ e - por espaço', () => {
    expect(labelFromFile('pikachu.png')).toBe('pikachu');
    expect(labelFromFile('mr_mime-galar.webp')).toBe('mr mime galar');
    expect(labelFromFile('  a__b  --c .JPEG')).toBe('a b c');
    expect(labelFromFile('foto.final.jpg')).toBe('foto.final');
  });

  it('ponto que não é extensão fica', () => {
    expect(labelFromFile('Mr. Mime')).toBe('Mr. Mime');
    expect(labelFromFile('v1.2 final')).toBe('v1.2 final');
  });

  it(`vazio vira 'Sem nome'; longo é cortado em ${CUSTOM_LIMITS.label}`, () => {
    expect(labelFromFile('')).toBe('Sem nome');
    expect(labelFromFile('.png')).toBe('Sem nome');
    expect(labelFromFile('___.gif')).toBe('Sem nome');
    expect(labelFromFile(`${'x'.repeat(100)}.png`)).toBe('x'.repeat(CUSTOM_LIMITS.label));
    expect(labelFromFile('a\u0000b‮.png')).toBe('ab');
  });
});

describe('isImageDataUrl (reexportado)', () => {
  it('aceita imagem em base64 e recusa o resto', () => {
    expect(isImageDataUrl('data:image/webp;base64,AAAA')).toBe(true);
    expect(isImageDataUrl('data:image/svg+xml;base64,AAAA')).toBe(false);
  });
});

describe('imagesFromDataTransfer', () => {
  const png = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' });
  const jpg = new File([new Uint8Array([2])], 'b.jpg', { type: 'image/jpeg' });
  const txt = new File(['oi'], 'c.txt', { type: 'text/plain' });
  const untyped = new File([new Uint8Array([3])], 'd.webp', { type: '' });
  const untypedTxt = new File(['x'], 'e.doc', { type: '' });
  const dt = (files: File[], items: Partial<DataTransferItem>[] = []): DataTransfer =>
    ({ files, items }) as unknown as DataTransfer;
  const fileItem = (f: File | null, type = f?.type ?? 'image/png'): Partial<DataTransferItem> => ({
    kind: 'file',
    type,
    getAsFile: () => f,
  });

  it('drop: só os arquivos de imagem (pelo tipo ou, sem tipo, pela extensão)', () => {
    expect(imagesFromDataTransfer(dt([png, txt, jpg, untyped, untypedTxt]))).toEqual([png, jpg, untyped]);
    expect(imagesFromDataTransfer(dt([txt]))).toEqual([]);
  });

  it('paste com files e items iguais: não repete', () => {
    expect(imagesFromDataTransfer(dt([png], [fileItem(png)]))).toEqual([png]);
  });

  it('paste só com items: pega os de imagem', () => {
    const items = [
      { kind: 'string', type: 'text/plain', getAsFile: () => null },
      fileItem(txt),
      fileItem(png),
      fileItem(null, 'image/png'),
      fileItem(jpg),
    ];
    expect(imagesFromDataTransfer(dt([], items))).toEqual([png, jpg]);
  });

  it('sem nada', () => {
    expect(imagesFromDataTransfer(dt([]))).toEqual([]);
    expect(imagesFromDataTransfer({} as DataTransfer)).toEqual([]);
  });
});

// --- shrinkImage com canvas de mentira ---

interface Log {
  ops: string[];
  sizes: [number, number][];
  closed: number;
}

function stubBitmap(w: number, h: number, log: Log): void {
  vi.stubGlobal('createImageBitmap', async (b: Blob) => {
    if (b.type === 'text/plain') throw new DOMException('bad', 'InvalidStateError');
    return { width: w, height: h, close: () => log.closed++ };
  });
}

function fakeCtx(log: Log): Record<string, unknown> {
  return {
    set fillStyle(v: string) {
      log.ops.push(`fill ${v}`);
    },
    fillRect: () => log.ops.push('fillRect'),
    clearRect: () => log.ops.push('clear'),
    drawImage: (_b: unknown, _x: number, _y: number, w: number, h: number) => log.ops.push(`draw ${w}x${h}`),
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low',
  };
}

/** OffscreenCanvas de mentira; `webp` = se sabe gerar WebP; `bytes` = tamanho do arquivo gerado (pode depender do lado) */
function stubOffscreen(log: Log, webp: boolean, bytes: (w: number) => number = () => 3): void {
  vi.stubGlobal(
    'OffscreenCanvas',
    class {
      constructor(
        public width: number,
        public height: number,
      ) {
        log.sizes.push([width, height]);
      }
      getContext(kind: string) {
        return kind === '2d' ? fakeCtx(log) : null;
      }
      async convertToBlob(o: { type: string; quality: number }): Promise<Blob> {
        const type = o.type === 'image/webp' && !webp ? 'image/png' : o.type;
        log.ops.push(`encode ${type} ${o.quality}`);
        return new Blob([new Uint8Array(bytes(this.width)).fill(65)], { type });
      }
    },
  );
}

function stubDocument(log: Log, webp: boolean): void {
  vi.stubGlobal('OffscreenCanvas', undefined);
  vi.stubGlobal('document', {
    createElement: (tag: string) => {
      const c = {
        tag,
        width: 0,
        height: 0,
        getContext: (kind: string) => {
          log.sizes.push([c.width, c.height]);
          return kind === '2d' ? fakeCtx(log) : null;
        },
        toDataURL: (type: string, q: number) => {
          const t = type === 'image/webp' && !webp ? 'image/png' : type;
          log.ops.push(`encode ${t} ${q}`);
          return `data:${t};base64,QUFB`;
        },
      };
      return c;
    },
  });
}

const newLog = (): Log => ({ ops: [], sizes: [], closed: 0 });
const pngBlob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });

describe('shrinkImage (OffscreenCanvas)', () => {
  it('reduz pro tamanho certo e devolve WebP 0.82', async () => {
    const log = newLog();
    stubBitmap(2048, 1024, log);
    stubOffscreen(log, true);
    const url = await shrinkImage(pngBlob);
    expect(url).toBe('data:image/webp;base64,QUFB');
    expect(isImageDataUrl(url)).toBe(true);
    expect(log.sizes).toEqual([[512, 256]]);
    expect(log.ops).toEqual(['clear', 'draw 512x256', 'encode image/webp 0.82']);
    expect(log.closed).toBe(1);
  });

  it('não aumenta imagem pequena; respeita o side pedido', async () => {
    const log = newLog();
    stubBitmap(100, 40, log);
    stubOffscreen(log, true);
    await shrinkImage(pngBlob);
    await shrinkImage(pngBlob, 50);
    expect(log.sizes).toEqual([[100, 40], [50, 20]]);
  });

  it('sem WebP: JPEG 0.85 com fundo branco pintado antes da imagem', async () => {
    const log = newLog();
    stubBitmap(300, 600, log);
    stubOffscreen(log, false);
    const url = await shrinkImage(pngBlob);
    expect(url).toBe('data:image/jpeg;base64,QUFB');
    expect(log.ops).toEqual([
      'clear', 'draw 256x512', 'encode image/png 0.82',
      'clear', 'fill #fff', 'fillRect', 'draw 256x512', 'encode image/jpeg 0.85',
    ]);
  });

  it('resultado grande demais: diminui e tenta de novo', async () => {
    const log = newLog();
    stubBitmap(1000, 1000, log);
    // 512px gera um arquivo que passa do limite; 358px (512 * 0.7) cabe
    stubOffscreen(log, true, w => (w >= 512 ? CUSTOM_LIMITS.dataChars : 10));
    const url = await shrinkImage(pngBlob);
    expect(log.sizes).toEqual([[512, 512], [358, 358]]);
    expect(isImageDataUrl(url)).toBe(true);
  });

  it('se nunca couber, rejeita (e fecha o bitmap)', async () => {
    const log = newLog();
    stubBitmap(1000, 1000, log);
    stubOffscreen(log, true, () => CUSTOM_LIMITS.dataChars);
    await expect(shrinkImage(pngBlob)).rejects.toThrow('imagem grande demais');
    expect(log.sizes).toHaveLength(3);
    expect(log.closed).toBe(1);
  });
});

describe('shrinkImage (<canvas>)', () => {
  it('sem OffscreenCanvas usa <canvas> e devolve WebP', async () => {
    const log = newLog();
    stubBitmap(1024, 768, log);
    stubDocument(log, true);
    const url = await shrinkImage(pngBlob);
    expect(url).toBe('data:image/webp;base64,QUFB');
    expect(log.sizes).toEqual([[512, 384]]);
    expect(log.ops).toEqual(['clear', 'draw 512x384', 'encode image/webp 0.82']);
  });

  it("toDataURL devolvendo 'data:image/png' (sem WebP): JPEG 0.85 com fundo branco", async () => {
    const log = newLog();
    stubBitmap(64, 64, log);
    stubDocument(log, false);
    const url = await shrinkImage(pngBlob);
    expect(url).toBe('data:image/jpeg;base64,QUFB');
    expect(log.ops).toEqual([
      'clear', 'draw 64x64', 'encode image/png 0.82',
      'clear', 'fill #fff', 'fillRect', 'draw 64x64', 'encode image/jpeg 0.85',
    ]);
  });

  it('OffscreenCanvas sem contexto 2d cai no <canvas>', async () => {
    const log = newLog();
    stubBitmap(64, 64, log);
    stubDocument(log, true);
    vi.stubGlobal('OffscreenCanvas', class {
      getContext() {
        return null;
      }
    });
    expect(await shrinkImage(pngBlob)).toBe('data:image/webp;base64,QUFB');
  });
});

describe('shrinkImage (não é imagem)', () => {
  it('rejeita quando não decodifica', async () => {
    const log = newLog();
    stubBitmap(10, 10, log);
    stubOffscreen(log, true);
    await expect(shrinkImage(new Blob(['oi'], { type: 'text/plain' }))).rejects.toThrow('não é imagem');
    expect(log.sizes).toEqual([]);
  });

  it('rejeita imagem sem tamanho (e fecha o bitmap)', async () => {
    const log = newLog();
    stubBitmap(0, 0, log);
    stubOffscreen(log, true);
    await expect(shrinkImage(pngBlob)).rejects.toThrow('não é imagem');
    expect(log.closed).toBe(1);
  });

  it('rejeita sem createImageBitmap', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    await expect(shrinkImage(pngBlob)).rejects.toThrow('não é imagem');
  });
});
