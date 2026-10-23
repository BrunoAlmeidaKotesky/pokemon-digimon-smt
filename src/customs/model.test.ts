import { describe, expect, it } from 'vitest';
import {
  addFranchise,
  addItems,
  applyOp,
  cleanLabel,
  customImg,
  imgKey,
  isCustomKey,
  isImageDataUrl,
  newKey,
  NO_NAME,
  PALETTE,
  parseCustomImg,
  removeFranchise,
  removeItem,
  renameFranchise,
  renameItem,
  toItems,
  validateCustoms,
  type Rand,
} from './model';
import { CUSTOM_LIMITS, type CustomFranchise, type CustomItem, type CustomOp } from './types';

/** Congela tudo, recursivamente: qualquer escrita lança (os testes rodam em módulo, modo estrito). */
function deepFreeze<T>(x: T): T {
  if (typeof x === 'object' && x !== null && !Object.isFrozen(x)) {
    Object.freeze(x);
    for (const v of Object.values(x)) deepFreeze(v);
  }
  return x;
}

/** data URL válida (webp) com n caracteres de base64 */
const img = (n = 8, ch = 'A'): string => `data:image/webp;base64,${ch.repeat(n)}`;
const PREFIX_LEN = 'data:image/webp;base64,'.length;

/** gerador que devolve os valores em ciclo */
const cycle = (vals: number[]): Rand => {
  let i = 0;
  return () => vals[i++ % vals.length] as number;
};
/** gerador que conta as chamadas */
function counting(): Rand & { calls: number } {
  let x = 0;
  const f = (() => {
    f.calls++;
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  }) as Rand & { calls: number };
  f.calls = 0;
  return f;
}

const item = (id: string, name = id, data = img()): CustomItem => ({ id, name, data });
const fr = (key: string, items: CustomItem[] = [], label = key, color = PALETTE[0] as string): CustomFranchise => ({
  key,
  label,
  color,
  items,
});

/** franquia com n imagens (ids i0, i1...) */
const full = (key: string, n: number): CustomFranchise =>
  fr(key, Array.from({ length: n }, (_, i) => item(`i${i}`)));

describe('newKey', () => {
  it("'c-' + 6 caracteres base36, 6 chamadas ao gerador", () => {
    const r = counting();
    expect(newKey(r)).toMatch(/^c-[0-9a-z]{6}$/);
    expect(r.calls).toBe(6);
  });

  it('determinístico pelo gerador', () => {
    expect(newKey(() => 0)).toBe('c-000000');
    expect(newKey(() => 0.9999)).toBe('c-zzzzzz');
    expect(newKey(cycle([0, 1 / 36, 2 / 36, 10 / 36, 35 / 36, 0.5]))).toBe('c-012azi');
  });

  it('gerador torto (1, negativo, NaN) ainda dá chave no formato', () => {
    for (const v of [1, -0.5, NaN, Infinity]) expect(newKey(() => v)).toMatch(/^c-[0-9a-z]{6}$/);
  });

  it('sem gerador usa Math.random', () => {
    expect(isCustomKey(newKey())).toBe(true);
  });
});

describe('addFranchise', () => {
  it('acrescenta no fim, com rótulo limpo, cor da paleta e sem imagens; não muda a lista recebida', () => {
    const a = deepFreeze([] as CustomFranchise[]);
    const b = addFranchise(a, '  Meus   bichos ', cycle([0.1]));
    expect(a).toEqual([]);
    expect(b).toHaveLength(1);
    expect(b[0]).toEqual({ key: expect.stringMatching(/^c-[0-9a-z]{6}$/), label: 'Meus bichos', color: PALETTE[0], items: [] });
    const c = addFranchise(deepFreeze(b), 'Outro', cycle([0.2]));
    expect(c).toHaveLength(2);
    expect(c[0]).toBe(b[0]);
    expect(c[1]?.color).toBe(PALETTE[1]);
    expect(c[1]?.key).not.toBe(c[0]?.key);
  });

  it('cores na ordem da paleta; ao remover uma, a próxima reaproveita a primeira livre', () => {
    let l: CustomFranchise[] = [];
    for (let i = 0; i < 4; i++) l = addFranchise(l, `g${i}`, counting());
    expect(l.map(f => f.color)).toEqual(PALETTE.slice(0, 4));
    l = removeFranchise(l, (l[1] as CustomFranchise).key);
    l = addFranchise(l, 'novo', counting());
    expect(l.at(-1)?.color).toBe(PALETTE[1]);
    expect(new Set(l.map(f => f.color)).size).toBe(l.length);
  });

  it('rótulo vazio vira "Grupo N" sem repetir', () => {
    let l = addFranchise([], '   ', counting());
    expect(l[0]?.label).toBe('Grupo 1');
    l = addFranchise(l, 'Grupo 2', counting());
    l = addFranchise(l, '\u0000\t', counting());
    expect(l.map(f => f.label)).toEqual(['Grupo 1', 'Grupo 2', 'Grupo 3']);
  });

  it('chave única mesmo com gerador que repete sempre', () => {
    let l: CustomFranchise[] = [];
    for (let i = 0; i < CUSTOM_LIMITS.franchises; i++) l = addFranchise(l, `g${i}`, () => 0);
    const keys = l.map(f => f.key);
    expect(new Set(keys).size).toBe(CUSTOM_LIMITS.franchises);
    for (const k of keys) expect(k).toMatch(/^c-[0-9a-z]{6}$/);
  });

  it(`no máximo ${CUSTOM_LIMITS.franchises} franquias (todas com cores diferentes)`, () => {
    let l: CustomFranchise[] = [];
    for (let i = 0; i < CUSTOM_LIMITS.franchises; i++) l = addFranchise(l, `g${i}`, counting());
    expect(new Set(l.map(f => f.color)).size).toBe(CUSTOM_LIMITS.franchises);
    deepFreeze(l);
    expect(addFranchise(l, 'demais', counting())).toBe(l);
  });

  it('cores de fora da paleta (lista que veio de outro lugar) não ocupam a paleta', () => {
    const l = deepFreeze([fr('c-a', [], 'x', '#000000'), fr('c-b', [], 'y', PALETTE[0] as string)]);
    expect(addFranchise(l, 'z', counting()).at(-1)?.color).toBe(PALETTE[1]);
  });
});

describe('renameFranchise / removeFranchise', () => {
  const base = deepFreeze([fr('c-aaa', [item('x')], 'Velho'), fr('c-bbb')]);

  it('renomeia só a franquia certa, com rótulo limpo', () => {
    const l = renameFranchise(base, 'c-aaa', '  Novo‮ nome ');
    expect(l).not.toBe(base);
    expect(l[0]).toEqual({ ...base[0], label: 'Novo nome' });
    expect(l[0]?.items).toBe(base[0]?.items);
    expect(l[1]).toBe(base[1]);
    expect(base[0]?.label).toBe('Velho');
  });

  it('rótulo vazio, igual ou chave inexistente: mesma lista', () => {
    expect(renameFranchise(base, 'c-aaa', '   ')).toBe(base);
    expect(renameFranchise(base, 'c-aaa', 'Velho')).toBe(base);
    expect(renameFranchise(base, 'c-zzz', 'Novo')).toBe(base);
  });

  it(`corta o rótulo em ${CUSTOM_LIMITS.label}`, () => {
    expect(renameFranchise(base, 'c-bbb', 'x'.repeat(100))[1]?.label).toBe('x'.repeat(CUSTOM_LIMITS.label));
  });

  it('remove; chave inexistente devolve a mesma lista', () => {
    const l = removeFranchise(base, 'c-aaa');
    expect(l).toEqual([base[1]]);
    expect(l[0]).toBe(base[1]);
    expect(base).toHaveLength(2);
    expect(removeFranchise(base, 'c-zzz')).toBe(base);
  });
});

describe('addItems', () => {
  it('acrescenta com ids únicos e rótulos limpos; não muda a lista recebida', () => {
    const base = deepFreeze([fr('c-aaa', [item('old')]), fr('c-bbb')]);
    const l = addItems(base, 'c-aaa', [
      { name: ' Pika  chu ', data: img(4) },
      { name: '', data: img(8) },
      { name: '\u0000\u0007', data: img(12) },
    ], counting());
    expect(base[0]?.items).toHaveLength(1);
    const items = l[0]?.items ?? [];
    expect(items).toHaveLength(4);
    expect(items[0]).toBe(base[0]?.items[0]);
    expect(items.slice(1).map(i => i.name)).toEqual(['Pika chu', NO_NAME, NO_NAME]);
    expect(items.slice(1).map(i => i.data)).toEqual([img(4), img(8), img(12)]);
    for (const i of items.slice(1)) expect(i.id).toMatch(/^[0-9a-z]{6}$/);
    expect(new Set(items.map(i => i.id)).size).toBe(4);
    expect(l[1]).toBe(base[1]);
  });

  it('ids únicos mesmo com gerador que repete', () => {
    const l = addItems([fr('c-aaa')], 'c-aaa', Array.from({ length: 30 }, () => ({ name: 'a', data: img() })), () => 0);
    const ids = (l[0]?.items ?? []).map(i => i.id);
    expect(ids).toHaveLength(30);
    expect(new Set(ids).size).toBe(30);
    for (const id of ids) expect(id).toMatch(/^[0-9a-z]{6}$/);
  });

  it('ignora data URL inválida', () => {
    const base = deepFreeze([fr('c-aaa')]);
    const bad = [
      'data:image/svg+xml;base64,PHN2Zz4=',
      'data:text/html;base64,PGI+',
      'data:image/png,AAAA',
      'data:image/png;base64,',
      'data:image/png;base64,AA"><script>',
      img(CUSTOM_LIMITS.dataChars),
      'https://x/y.png',
      '',
      42,
      null,
    ];
    const l = addItems(base, 'c-aaa', [...bad.map(data => ({ name: 'x', data: data as string })), { name: 'ok', data: img() }], counting());
    expect(l[0]?.items.map(i => i.name)).toEqual(['ok']);
    expect(addItems(base, 'c-aaa', bad.map(data => ({ name: 'x', data: data as string })), counting())).toBe(base);
  });

  it('chave inexistente, lista vazia de imagens ou itens tortos: mesma lista', () => {
    const base = deepFreeze([fr('c-aaa')]);
    expect(addItems(base, 'c-zzz', [{ name: 'a', data: img() }], counting())).toBe(base);
    expect(addItems(base, 'c-aaa', [], counting())).toBe(base);
    expect(addItems(base, 'c-aaa', [null, 3, 'x'] as unknown as { name: string; data: string }[], counting())).toBe(base);
    expect(addItems(base, 'c-aaa', 'nada' as unknown as { name: string; data: string }[], counting())).toBe(base);
  });

  it(`no máximo ${CUSTOM_LIMITS.items} imagens por franquia`, () => {
    const base = deepFreeze([full('c-aaa', CUSTOM_LIMITS.items - 2)]);
    const add = Array.from({ length: 5 }, (_, i) => ({ name: `n${i}`, data: img() }));
    const l = addItems(base, 'c-aaa', add, counting());
    expect(l[0]?.items).toHaveLength(CUSTOM_LIMITS.items);
    expect(l[0]?.items.slice(-2).map(i => i.name)).toEqual(['n0', 'n1']);
    expect(addItems(deepFreeze(l), 'c-aaa', add, counting())).toBe(l);
  });

  it('o limite conta só imagens válidas', () => {
    const base = [full('c-aaa', CUSTOM_LIMITS.items - 1)];
    const l = addItems(base, 'c-aaa', [{ name: 'ruim', data: 'x' }, { name: 'boa', data: img() }], counting());
    expect(l[0]?.items.at(-1)?.name).toBe('boa');
  });
});

describe('renameItem / removeItem', () => {
  const base = deepFreeze([fr('c-aaa', [item('a1', 'Um'), item('a2', 'Dois')]), fr('c-bbb', [item('a1', 'Outro')])]);

  it('renomeia só a imagem certa', () => {
    const l = renameItem(base, 'c-aaa', 'a2', '  Dois  novo ');
    expect(l[0]?.items[1]).toEqual({ ...base[0]?.items[1], name: 'Dois novo' });
    expect(l[0]?.items[0]).toBe(base[0]?.items[0]);
    expect(l[1]).toBe(base[1]);
    expect(base[0]?.items[1]?.name).toBe('Dois');
  });

  it('rótulo vazio, igual, franquia ou imagem inexistente: mesma lista', () => {
    expect(renameItem(base, 'c-aaa', 'a1', ' \t ')).toBe(base);
    expect(renameItem(base, 'c-aaa', 'a1', 'Um')).toBe(base);
    expect(renameItem(base, 'c-zzz', 'a1', 'X')).toBe(base);
    expect(renameItem(base, 'c-aaa', 'nope', 'X')).toBe(base);
  });

  it('remove só a imagem certa; inexistente devolve a mesma lista', () => {
    const l = removeItem(base, 'c-aaa', 'a1');
    expect(l[0]?.items).toEqual([base[0]?.items[1]]);
    expect(l[1]).toBe(base[1]);
    expect(base[0]?.items).toHaveLength(2);
    expect(removeItem(base, 'c-aaa', 'nope')).toBe(base);
    expect(removeItem(base, 'c-zzz', 'a1')).toBe(base);
  });
});

describe('applyOp', () => {
  const base = deepFreeze([fr('c-aaa', [item('a1', 'Um')]), fr('c-bbb')]);

  it("'add' acrescenta as imagens válidas", () => {
    const l = applyOp(base, { op: 'add', key: 'c-bbb', items: [{ name: 'Novo', data: img() }, { name: 'x', data: 'lixo' }] }, counting());
    expect(l[1]?.items.map(i => i.name)).toEqual(['Novo']);
    expect(l[0]).toBe(base[0]);
  });

  it("'add' tolera itens tortos no meio (pula) e nome que não é texto (vira 'Sem nome')", () => {
    const op = { op: 'add', key: 'c-bbb', items: [null, 1, 'x', [], { data: 5 }, { name: 7, data: img() }, { name: 'B', data: img() }] };
    const l = applyOp(base, op as unknown as CustomOp, counting());
    expect(l[1]?.items.map(i => i.name)).toEqual([NO_NAME, 'B']);
  });

  it("'add' com lista gigante só olha as primeiras CUSTOM_LIMITS.items", () => {
    const items = Array.from({ length: CUSTOM_LIMITS.items * 3 }, (_, i) => ({ name: `n${i}`, data: i < CUSTOM_LIMITS.items ? 'x' : img() }));
    expect(applyOp(base, { op: 'add', key: 'c-bbb', items }, counting())).toBe(base);
  });

  it("'label' troca o rótulo", () => {
    const l = applyOp(base, { op: 'label', key: 'c-aaa', id: 'a1', name: ' Novo ' }, counting());
    expect(l[0]?.items[0]?.name).toBe('Novo');
  });

  it('pedido inválido ou chave inexistente: mesma lista, sem lançar', () => {
    const throwing = {};
    Object.defineProperty(throwing, 'key', { get: () => { throw new Error('boom'); }, enumerable: true });
    const items = [{ name: 'a', data: img() }];
    const proxy = new Proxy({}, { get: () => { throw new Error('boom'); } });
    const bad: unknown[] = [
      null,
      undefined,
      42,
      'add',
      [],
      {},
      { op: 'add' },
      { op: 'add', key: 'c-zzz', items },
      { op: 'add', key: 3, items },
      { op: 'add', key: 'c-aaa', items: 'nada' },
      { op: 'add', key: 'c-aaa', items: { 0: items[0], length: 1 } },
      { op: 'label', key: 'c-aaa', id: 'a1' },
      { op: 'label', key: 'c-aaa', id: 3, name: 'x' },
      { op: 'label', key: 'c-aaa', id: 'nope', name: 'x' },
      { op: 'label', key: 'c-zzz', id: 'a1', name: 'x' },
      { op: 'label', key: 'c-aaa', id: 'a1', name: '' },
      { op: 'remove', key: 'c-aaa', id: 'a1' },
      { op: 'add', key: 'c-aaa', items: [proxy] },
      throwing,
      proxy,
    ];
    for (const op of bad) expect(applyOp(base, op as CustomOp, counting())).toBe(base);
  });

  it('gerador que lança: mesma lista', () => {
    const l = applyOp(base, { op: 'add', key: 'c-bbb', items: [{ name: 'a', data: img() }] }, () => {
      throw new Error('x');
    });
    expect(l).toBe(base);
  });
});

describe('cleanLabel', () => {
  it('tira espaço das pontas e junta espaços repetidos', () => {
    expect(cleanLabel('  Ana   Bia  ')).toBe('Ana Bia');
    expect(cleanLabel('Ana\t\n\r Bia')).toBe('Ana Bia');
    expect(cleanLabel('Ana　Bia')).toBe('Ana Bia');
  });

  it('tira caracteres de controle e de direção de texto', () => {
    expect(cleanLabel('A\u0000n\u0007a\u001b\u007f\u0085')).toBe('Ana');
    expect(cleanLabel('Ana‮aiB')).toBe('AnaaiB');
    expect(cleanLabel('‎Bia⁦')).toBe('Bia');
  });

  it(`corta em ${CUSTOM_LIMITS.label} caracteres, sem partir emoji e sem sobrar espaço`, () => {
    expect(cleanLabel('x'.repeat(100))).toHaveLength(CUSTOM_LIMITS.label);
    expect(cleanLabel(`${'x'.repeat(CUSTOM_LIMITS.label - 1)} yz`)).toBe('x'.repeat(CUSTOM_LIMITS.label - 1));
    expect(cleanLabel('😀'.repeat(60))).toBe('😀'.repeat(CUSTOM_LIMITS.label));
  });

  it('mantém acentos e pontuação; vazio e não-texto viram vazio', () => {
    expect(cleanLabel('João  Ção!')).toBe('João Ção!');
    expect(cleanLabel('')).toBe('');
    expect(cleanLabel('\u0000\u0001 ')).toBe('');
    expect(cleanLabel(undefined as unknown as string)).toBe('');
    expect(cleanLabel(5 as unknown as string)).toBe('');
  });
});

describe('toItems', () => {
  it("nome = rótulo, img = 'cst:<chave>/<id>'", () => {
    const f = deepFreeze(fr('c-aaa', [item('a1', 'Um'), item('a2', 'Dois')]));
    expect(toItems(f)).toEqual([
      { name: 'Um', img: 'cst:c-aaa/a1' },
      { name: 'Dois', img: 'cst:c-aaa/a2' },
    ]);
    expect(toItems(fr('c-bbb'))).toEqual([]);
  });

  it("rótulos repetidos ganham ' (2)', ' (3)'...; o primeiro fica como está", () => {
    const f = fr('c-aaa', [item('a', 'Ash'), item('b', 'Misty'), item('c', 'Ash'), item('d', 'Ash'), item('e', 'Misty')]);
    expect(toItems(f).map(i => i.name)).toEqual(['Ash', 'Misty', 'Ash (2)', 'Ash (3)', 'Misty (2)']);
  });

  it('o sufixo não bate com rótulo que já existe', () => {
    const f = fr('c-aaa', [item('a', 'Ash'), item('b', 'Ash'), item('c', 'Ash (2)'), item('d', 'Ash (2)')]);
    const names = toItems(f).map(i => i.name);
    expect(names).toEqual(['Ash', 'Ash (3)', 'Ash (2)', 'Ash (2) (2)']);
    expect(new Set(names).size).toBe(names.length);
  });

  it("rótulo vazio vira 'Sem nome' (e repete com sufixo)", () => {
    expect(toItems(fr('c-aaa', [item('a', ''), item('b', '')])).map(i => i.name)).toEqual([NO_NAME, `${NO_NAME} (2)`]);
  });

  it('nomes sempre únicos com muitas repetições', () => {
    const f = fr('c-aaa', Array.from({ length: CUSTOM_LIMITS.items }, (_, i) => item(`i${i}`, i % 3 ? 'X' : 'X (2)')));
    const names = toItems(f).map(i => i.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('customImg / parseCustomImg / imgKey', () => {
  it('ida e volta', () => {
    const s = customImg('c-k3x9a2', 'ab12cd');
    expect(s).toBe('cst:c-k3x9a2/ab12cd');
    expect(parseCustomImg(s)).toEqual({ key: 'c-k3x9a2', id: 'ab12cd' });
    expect(imgKey(s)).toBe('c-k3x9a2');
  });

  it('o que não é imagem customizada vira null', () => {
    const bad = [
      '',
      'https://x/y.png',
      'cst:',
      'cst:c-abc',
      'cst:c-abc/',
      'cst:/abc',
      'cst:abc/x1',
      'cst:c-/x1',
      'cst:c-ABC/x1',
      'cst:c-abc/X1',
      'cst:c-abc/x/y',
      'cst:c-abc/x 1',
      'cst:c-__proto__/x',
      ' cst:c-abc/x1',
      'CST:c-abc/x1',
      `cst:c-${'a'.repeat(17)}/x1`,
      `cst:c-abc/${'a'.repeat(17)}`,
    ];
    for (const s of bad) {
      expect(parseCustomImg(s)).toBeNull();
      expect(imgKey(s)).toBeNull();
    }
    expect(parseCustomImg(undefined as unknown as string)).toBeNull();
  });
});

describe('isImageDataUrl', () => {
  it('aceita webp, jpeg, png e gif em base64', () => {
    for (const t of ['webp', 'jpeg', 'png', 'gif']) expect(isImageDataUrl(`data:image/${t};base64,AAAA`)).toBe(true);
    expect(isImageDataUrl('data:image/png;base64,iVBORw0KGgo+/A==')).toBe(true);
  });

  it(`até ${CUSTOM_LIMITS.dataChars} caracteres`, () => {
    expect(isImageDataUrl(img(CUSTOM_LIMITS.dataChars - PREFIX_LEN))).toBe(true);
    expect(isImageDataUrl(img(CUSTOM_LIMITS.dataChars - PREFIX_LEN + 1))).toBe(false);
  });

  it('recusa outros tipos, sem base64, base64 torto, vazio e não-texto', () => {
    const bad: unknown[] = [
      'data:image/svg+xml;base64,PHN2Zz4=',
      'data:image/bmp;base64,AAAA',
      'data:text/html;base64,AAAA',
      'data:image/png,AAAA',
      'data:image/png;base64,',
      'data:image/png;base64,AA AA',
      'data:image/png;base64,AA"/><script>',
      'data:image/png;base64,AAAA===',
      'data:image/png;charset=utf-8;base64,AAAA',
      'DATA:image/png;base64,AAAA',
      ' data:image/png;base64,AAAA',
      'data:image/png;base64,AAAA\n',
      'blob:https://x/1',
      '',
      null,
      undefined,
      12,
      {},
    ];
    for (const s of bad) expect(isImageDataUrl(s)).toBe(false);
  });
});

describe('PALETTE', () => {
  const FIXED = ['#d6302a', '#1f6fd1', '#7a1fa8', '#0c8a5a', '#c2410c', '#0e8fa8', '#c0267a'];
  const lum = (h: string): number => {
    const [r, g, b] = [1, 3, 5].map(i => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string): number => {
    const x = lum(a);
    const y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };

  it(`${CUSTOM_LIMITS.franchises} cores #rrggbb diferentes entre si e das franquias fixas`, () => {
    expect(PALETTE).toHaveLength(CUSTOM_LIMITS.franchises);
    for (const c of PALETTE) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    expect(new Set(PALETTE).size).toBe(PALETTE.length);
    for (const c of PALETTE) expect(FIXED).not.toContain(c);
  });

  it('contraste >= 3:1 no painel claro e no escuro', () => {
    for (const c of PALETTE) {
      expect(contrast(c, '#ffffff')).toBeGreaterThanOrEqual(3);
      expect(contrast(c, '#1a1d23')).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('validateCustoms', () => {
  const good = (): unknown[] => [
    { key: 'c-k3x9a2', label: 'Meus', color: '#6461E0', items: [{ id: 'ab12cd', name: 'Um', data: img() }, { id: 'x1', name: 'Dois', data: img(4, 'B') }] },
    { key: 'c-zz', label: 'Vazio', color: '#8f8a00', items: [] },
  ];

  it('lista válida: cópia nova, só com os campos conhecidos, cor minúscula e rótulos limpos', () => {
    const src = good();
    (src[0] as Record<string, unknown>).extra = 1;
    ((src[0] as { items: Record<string, unknown>[] }).items[0] as Record<string, unknown>).evil = '<script>';
    ((src[0] as { items: Record<string, unknown>[] }).items[1] as Record<string, unknown>).name = '  Dois \u0000 ';
    (src[1] as Record<string, unknown>).label = '   ';
    const out = validateCustoms(deepFreeze(src));
    expect(out).toEqual([
      { key: 'c-k3x9a2', label: 'Meus', color: '#6461e0', items: [{ id: 'ab12cd', name: 'Um', data: img() }, { id: 'x1', name: 'Dois', data: img(4, 'B') }] },
      { key: 'c-zz', label: NO_NAME, color: '#8f8a00', items: [] },
    ]);
    expect(out?.[0]).not.toBe(src[0]);
  });

  it('lista vazia é válida', () => {
    expect(validateCustoms([])).toEqual([]);
  });

  it('o que addFranchise/addItems produzem passa', () => {
    let l = addFranchise([], 'A', counting());
    l = addFranchise(l, 'B', counting());
    l = addItems(l, (l[0] as CustomFranchise).key, [{ name: 'x', data: img() }, { name: 'x', data: img() }], counting());
    expect(validateCustoms(JSON.parse(JSON.stringify(l)))).toEqual(l);
  });

  it(`no limite: ${CUSTOM_LIMITS.franchises} franquias, ${CUSTOM_LIMITS.items} imagens, data URL de ${CUSTOM_LIMITS.dataChars} caracteres`, () => {
    const big = img(CUSTOM_LIMITS.dataChars - PREFIX_LEN);
    const l = Array.from({ length: CUSTOM_LIMITS.franchises }, (_, i) => fr(`c-f${i}`, [item('a', 'x', big)]));
    l[0] = full('c-f0', CUSTOM_LIMITS.items);
    expect(validateCustoms(l)).toEqual(l);
  });

  /** cópia de good() com um ajuste */
  const tweak = (fn: (l: Record<string, unknown>[]) => void): unknown => {
    const l = JSON.parse(JSON.stringify(good())) as Record<string, unknown>[];
    fn(l);
    return l;
  };
  const items0 = (l: Record<string, unknown>[]): Record<string, unknown>[] => (l[0] as { items: Record<string, unknown>[] }).items;

  it('lixo de todo tipo vira null, sem lançar', () => {
    const throwingKey = { label: 'x', color: '#000000', items: [] };
    Object.defineProperty(throwingKey, 'key', { get: () => { throw new Error('boom'); }, enumerable: true });
    const throwingLen = new Proxy([], { get: (t, p) => (p === 'length' ? (() => { throw new Error('boom'); })() : Reflect.get(t, p)) });
    const throwingAll = new Proxy({}, { get: () => { throw new Error('boom'); }, ownKeys: () => { throw new Error('boom'); } });
    const throwingArr = new Proxy([good()[0]], { get: (t, p) => (p === '0' ? (() => { throw new Error('boom'); })() : Reflect.get(t, p)) });
    // eslint-disable-next-line no-sparse-arrays
    const holes = [, good()[0]];
    const junk: unknown[] = [
      null,
      undefined,
      0,
      NaN,
      '',
      'c-abc',
      true,
      {},
      { 0: good()[0], length: 1 },
      () => 1,
      Symbol('x'),
      [null],
      [1],
      ['c-abc'],
      [[]],
      [[good()[0]]],
      holes,
      [throwingKey],
      throwingLen,
      throwingAll,
      throwingArr,
      [throwingAll],
      Array.from({ length: CUSTOM_LIMITS.franchises + 1 }, (_, i) => fr(`c-f${i}`)),
      // chaves
      tweak(l => { (l[1] as Record<string, unknown>).key = (l[0] as Record<string, unknown>).key; }),
      tweak(l => { (l[0] as Record<string, unknown>).key = 'abc'; }),
      tweak(l => { (l[0] as Record<string, unknown>).key = 'pokemon'; }),
      tweak(l => { (l[0] as Record<string, unknown>).key = 'c-'; }),
      tweak(l => { (l[0] as Record<string, unknown>).key = 'c-AB'; }),
      tweak(l => { (l[0] as Record<string, unknown>).key = 'c-a b'; }),
      tweak(l => { (l[0] as Record<string, unknown>).key = 'c-a/b'; }),
      tweak(l => { (l[0] as Record<string, unknown>).key = '__proto__'; }),
      tweak(l => { (l[0] as Record<string, unknown>).key = `c-${'a'.repeat(17)}`; }),
      tweak(l => { (l[0] as Record<string, unknown>).key = 5; }),
      tweak(l => { delete (l[0] as Record<string, unknown>).key; }),
      // rótulo e cor
      tweak(l => { (l[0] as Record<string, unknown>).label = 5; }),
      tweak(l => { (l[0] as Record<string, unknown>).label = 'x'.repeat(CUSTOM_LIMITS.label * 4 + 1); }),
      tweak(l => { (l[0] as Record<string, unknown>).color = 'red'; }),
      tweak(l => { (l[0] as Record<string, unknown>).color = '#fff'; }),
      tweak(l => { (l[0] as Record<string, unknown>).color = '#12345g'; }),
      tweak(l => { (l[0] as Record<string, unknown>).color = '#123456;background:url(x)'; }),
      tweak(l => { (l[0] as Record<string, unknown>).color = null; }),
      // imagens
      tweak(l => { (l[0] as Record<string, unknown>).items = 'x'; }),
      tweak(l => { (l[0] as Record<string, unknown>).items = { 0: {}, length: 1 }; }),
      tweak(l => { delete (l[0] as Record<string, unknown>).items; }),
      tweak(l => { (l[0] as Record<string, unknown>).items = Array.from({ length: CUSTOM_LIMITS.items + 1 }, (_, i) => item(`i${i}`)); }),
      tweak(l => { items0(l).push(null as unknown as Record<string, unknown>); }),
      tweak(l => { items0(l).push([] as unknown as Record<string, unknown>); }),
      tweak(l => { (items0(l)[1] as Record<string, unknown>).id = 'ab12cd'; }),
      tweak(l => { (items0(l)[0] as Record<string, unknown>).id = 'A B'; }),
      tweak(l => { (items0(l)[0] as Record<string, unknown>).id = ''; }),
      tweak(l => { (items0(l)[0] as Record<string, unknown>).id = 'x/y'; }),
      tweak(l => { (items0(l)[0] as Record<string, unknown>).id = 3; }),
      tweak(l => { (items0(l)[0] as Record<string, unknown>).name = 3; }),
      tweak(l => { (items0(l)[0] as Record<string, unknown>).name = 'x'.repeat(CUSTOM_LIMITS.label * 4 + 1); }),
      tweak(l => { (items0(l)[0] as Record<string, unknown>).data = 'data:image/svg+xml;base64,PHN2Zz4='; }),
      tweak(l => { (items0(l)[0] as Record<string, unknown>).data = 'data:text/html;base64,PGI+'; }),
      tweak(l => { (items0(l)[0] as Record<string, unknown>).data = 'javascript:alert(1)'; }),
      tweak(l => { (items0(l)[0] as Record<string, unknown>).data = 'https://x/y.png'; }),
      tweak(l => { (items0(l)[0] as Record<string, unknown>).data = img(CUSTOM_LIMITS.dataChars); }),
      tweak(l => { (items0(l)[0] as Record<string, unknown>).data = 5; }),
      tweak(l => { delete (items0(l)[0] as Record<string, unknown>).data; }),
    ];
    for (const x of junk) {
      let r: unknown = 'lançou';
      expect(() => { r = validateCustoms(x); }).not.toThrow();
      expect(r).toBeNull();
    }
  });
});
