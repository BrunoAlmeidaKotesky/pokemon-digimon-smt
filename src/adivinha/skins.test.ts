import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { COM_SKINS, lerSkins, skinDe, skinsUrl } from './skins';

const BASE = 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/';
const ARQ = { base: BASE, itens: { Ahri: ['Ahri', [[0, 'Ahri'], [1, 'Dynasty Ahri'], [2, 'Midnight Ahri']]], Wukong: ['MonkeyKing', [[0, 'Wukong']]] } };

describe('skins do modo Imagem', () => {
  it('lê o arquivo: a url sai da base, do id e do número', () => {
    const m = lerSkins(ARQ)!;
    expect([...m.keys()]).toEqual(['Ahri', 'Wukong']);
    expect(m.get('Ahri')).toEqual([
      { img: BASE + 'Ahri_0.jpg', nome: 'Ahri' }, { img: BASE + 'Ahri_1.jpg', nome: 'Dynasty Ahri' }, { img: BASE + 'Ahri_2.jpg', nome: 'Midnight Ahri' },
    ]);
    expect(m.get('Wukong')![0]!.img).toBe(BASE + 'MonkeyKing_0.jpg');
    expect(skinsUrl('lol')).toBe('adivinha/skins/lol.json');
    expect(COM_SKINS).toEqual(['lol']);
  });

  it('arquivo torto, base que não é https ou entradas inválidas: null ou entrada pulada', () => {
    for (const ruim of [null, 5, [], {}, { base: BASE }, { base: 'http://x/', itens: ARQ.itens }, { base: 'javascript:alert(1)/', itens: ARQ.itens }, { base: BASE, itens: {} }]) {
      expect(lerSkins(ruim), JSON.stringify(ruim)).toBeNull();
    }
    const m = lerSkins({ base: BASE, itens: { A: ['A', [[0, 'A'], [-1, 'x'], ['2', 'y'], [3, '']]], B: ['../x', [[0, 'B']]], C: 'nada', D: ['D', []] } })!;
    expect([...m.keys()]).toEqual(['A']);
    expect(m.get('A')).toHaveLength(1);
  });

  it('a mesma semente dá a mesma skin; sementes diferentes passam por todas; sem lista, null', () => {
    const m = lerSkins(ARQ)!;
    expect(skinDe(m, 'Ahri', 0.42)).toEqual(skinDe(m, 'Ahri', 0.42));
    const vistas = new Set(Array.from({ length: 200 }, (_, i) => skinDe(m, 'Ahri', i / 200)!.nome));
    expect(vistas).toEqual(new Set(['Ahri', 'Dynasty Ahri', 'Midnight Ahri']));
    expect(skinDe(m, 'Wukong', 0.999)!.nome).toBe('Wukong');
    expect(skinDe(m, 'Zed', 0.5)).toBeNull();
    expect(skinDe(null, 'Ahri', 0.5)).toBeNull();
  });
});

describe('public/adivinha/skins/lol.json (gerado pelo skins-lol.mjs)', () => {
  const bruto = JSON.parse(fs.readFileSync(new URL('../../public/adivinha/skins/lol.json', import.meta.url), 'utf8')) as { itens: Record<string, unknown> };
  const m = lerSkins(bruto)!;
  const catalogo = Object.keys((JSON.parse(fs.readFileSync(new URL('../../public/catalogo/lol.json', import.meta.url), 'utf8')) as { itens: Record<string, unknown> }).itens);

  it('todo campeão do site tem pelo menos a skin padrão, com o nome dele', () => {
    for (const n of catalogo) {
      expect(m.get(n)?.length ?? 0, n).toBeGreaterThan(0);
      expect(m.get(n)![0]!.nome, n).toBe(n);
    }
    expect(m.size).toBe(catalogo.length);
  });

  it('são mais de 1500 skins, todas splash do Data Dragon, sem repetir', () => {
    const todas = [...m.values()].flat();
    expect(todas.length).toBeGreaterThan(1500);
    for (const s of todas) expect(s.img).toMatch(/^https:\/\/ddragon\.leagueoflegends\.com\/cdn\/img\/champion\/splash\/[\w.]+_\d+\.jpg$/);
    expect(new Set(todas.map(s => s.img)).size).toBe(todas.length);
  });
});
