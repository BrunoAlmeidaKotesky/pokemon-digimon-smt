// Conteúdo da Autobatalha: chaves, regra de qual habilidade cada forma lança, contagem de traços, itens e textos.
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { definirSet } from '../dados';
import { COMPONENTES, ORIGENS, type CampeaoDados, type FormaDados, type SetDados } from '../tipos';
import {
  GOLPE, HABILIDADES_CLASSE, HABILIDADES_PROPRIAS, ITENS, MULT_TRANSFORMAR, TRACOS, combinar, contarTracos, ehComponente,
  habilidadeDa, opcoesDeUlt, transformacao,
} from './index';
import { criarMundo } from './test-helpers';

const ler = <T>(caminho: string) => JSON.parse(readFileSync(new URL(caminho, import.meta.url), 'utf8')) as T;

const CHAVES_PROPRIAS = [
  'pokemon:Exploud', 'pokemon:Luxray', 'pokemon:Serperior', 'pokemon:Reuniclus', 'pokemon:Aegislash', 'pokemon:Vikavolt',
  'pokemon:Tsareena', 'pokemon:Solgaleo', 'pokemon:Lunala', 'pokemon:Mega Mewtwo X', 'pokemon:Mega Banette',
  'pokemon:Mega Lopunny', 'digimon:Sukamon', 'smt:Anubis', 'smt:Arahabaki', 'smt:Mot', 'jojo:Ball Breaker',
  'jojo:Civil War', 'jojo:Dirty Deeds Done Dirt Cheap', 'jojo:Hey Ya!', 'jojo:Scary Monsters',
  'jojo:The World (Steel Ball Run)', 'jojo:Tubular Bells', 'jojo:Tusk', 'jojo:Silver Chariot', 'jojo:Star Platinum',
  'jojo:Strength', "jojo:Holy's Stand", 'jojo:Soft & Wet', 'jojo:Wonder of U', 'jojo:Boy II Man', 'jojo:Pearl Jam',
  'jojo:Bad Company', 'jojo:Crazy Diamond', 'jojo:Echoes', 'jojo:Harvest', 'jojo:Red Hot Chili Pepper', 'jojo:Stray Cat',
  'jojo:The Hand', 'jojo:Baby Face', 'jojo:Chariot Requiem', 'jojo:Gold Experience', 'jojo:Gold Experience Requiem',
  'jojo:Metallica', 'jojo:Mr.President', 'jojo:Sex Pistols', 'jojo:Talking Head', 'jojo:C-MOON', 'jojo:Made in Heaven',
  'jojo:The World Over Heaven', 'jojo:November Rain', 'jojo:Light Rod Stand', 'jojo:Foo Fighters (Stand)',
  'jojo:Whitesnake', "lol:Vel'Koz", 'deadlock:Baba', 'sujimon:Escapist', 'sujimon:Twisted Mind',
  'sujimon:Baseball Diehard', 'sujimon:Massacre Mascot',
];
const CLASSES = ['demoniacos', 'criaturinha-bizarra', 'fadinhas', 'safada', 'atirador', 'anjo', 'robo', 'dragao',
  'temporais', 'tanque', 'porradeiro', 'assassino'];
const ELEMENTOS = ['fogo', 'agua', 'terra', 'vento', 'raio', 'gelo', 'planta'];

// ---------------------------------------------------------------------------------------------------------------
// Set pequeno pros testes
// ---------------------------------------------------------------------------------------------------------------

function forma(id: string, classes: string[], extra: Partial<FormaDados> = {}): FormaDados {
  const [fr, nome] = id.split(':') as [FormaDados['fr'], string];
  return { id, nome, img: '', fr, classes, info: [], ...extra };
}
const FORMAS: FormaDados[] = [
  forma('pokemon:Bulba', ['planta'], { semUlt: true }),
  forma('pokemon:Venu', ['planta'], { transforma: ['pokemon:Mega Venu', 'pokemon:Giga Venu'] }),
  forma('pokemon:Mega Venu', ['planta'], { soUlt: true }),
  forma('pokemon:Giga Venu', ['planta'], { soUlt: true }),
  forma('pokemon:Char', ['dragao', 'fogo']),
  forma('pokemon:Mewtwo', ['unicos']),
  forma('pokemon:Exploud', ['unicos'], { habilidade: 'pokemon:Exploud' }),
  forma('pokemon:Gardevoir', ['fadinhas', 'safada']),
  forma('pokemon:Gallade', ['porradeiro']),
  forma('digimon:War', ['dragao', 'fogo'], { soUlt: true, transforma: ['digimon:Omega'] }),
  forma('digimon:Omega', ['dragao', 'fogo'], { soUlt: true }),
  forma('digimon:Agu', ['fogo']),
  forma('jojo:Star Platinum', ['temporais', 'porradeiro'], { habilidade: 'jojo:Star Platinum' }),
  forma('lol:Ahri', ['safada']),
  forma("lol:Vel'Koz", ['unicos'], { habilidade: "lol:Vel'Koz" }),
];
const campeao = (id: string, fr: CampeaoDados['fr'], niveis: string[][]): CampeaoDados =>
  ({ id, fr, nome: niveis[0]![0]!.split(':')[1]!, custo: 1, niveis });
const SET: SetDados = {
  versao: 1, geradoEm: '2026-11-04', fonte: 'teste', tracos: [],
  campeoes: [
    campeao('pokemon:bulba', 'pokemon', [['pokemon:Bulba'], ['pokemon:Venu']]),
    campeao('pokemon:char', 'pokemon', [['pokemon:Char']]),
    campeao('pokemon:mewtwo', 'pokemon', [['pokemon:Mewtwo']]),
    campeao('pokemon:exploud', 'pokemon', [['pokemon:Exploud']]),
    campeao('pokemon:ralts', 'pokemon', [['pokemon:Gardevoir', 'pokemon:Gallade']]),
    campeao('digimon:agu', 'digimon', [['digimon:Agu']]),
    campeao('jojo:star-platinum', 'jojo', [['jojo:Star Platinum']]),
    campeao('lol:ahri', 'lol', [['lol:Ahri']]),
    campeao("lol:vel-koz", 'lol', [["lol:Vel'Koz"]]),
  ],
  formas: Object.fromEntries(FORMAS.map(f => [f.id, f])),
  bakugan: {},
  ff: { inimigos: [], chefes: [] },
};
const F = (id: string) => SET.formas[id]!;

beforeAll(() => { definirSet(SET); });

// ---------------------------------------------------------------------------------------------------------------

describe('habilidades', () => {
  it('toda chave própria da lista existe, e só elas', () => {
    for (const k of CHAVES_PROPRIAS) expect(HABILIDADES_PROPRIAS[k], k).toBeDefined();
    expect(Object.keys(HABILIDADES_PROPRIAS).sort()).toEqual([...CHAVES_PROPRIAS].sort());
    for (const [k, h] of Object.entries(HABILIDADES_PROPRIAS)) expect(h.id).toBe(k);
  });

  it('toda classe e elemento (menos Únicos) tem ult', () => {
    expect(Object.keys(HABILIDADES_CLASSE).sort()).toEqual([...CLASSES, ...ELEMENTOS].sort());
    expect(HABILIDADES_CLASSE.unicos).toBeUndefined();
    for (const [k, h] of Object.entries(HABILIDADES_CLASSE)) expect(h.id).toBe(k);
  });

  it('nome, texto e mana de toda habilidade', () => {
    const todas = [...Object.values(HABILIDADES_CLASSE), ...Object.values(HABILIDADES_PROPRIAS), GOLPE, transformacao('pokemon:Mega Venu')];
    for (const h of todas) {
      expect(h.nome.trim(), h.id).not.toBe('');
      expect(h.texto.startsWith(`${h.nome}: `), h.id).toBe(true);
      expect(h.texto.length, h.id).toBeGreaterThan(h.nome.length + 20);
      expect(h.texto, h.id).not.toMatch(/undefined|NaN|\[object/);
      expect(h.mana, h.id).toBeGreaterThanOrEqual(50);
      expect(h.mana, h.id).toBeLessThanOrEqual(120);
    }
  });
});

describe('habilidadeDa (regra do doc)', () => {
  it('forma não final (semUlt) não lança', () => {
    expect(habilidadeDa(F('pokemon:Bulba'))).toBeNull();
    expect(opcoesDeUlt(F('pokemon:Bulba'))).toEqual([]);
  });

  it('transformação: vira a forma escolhida, ou a 1ª', () => {
    const venu = F('pokemon:Venu');
    expect(habilidadeDa(venu)?.id).toBe('pokemon:Mega Venu');
    expect(habilidadeDa(venu)?.nome).toBe('Vira Mega Venu');
    expect(habilidadeDa(venu, 'pokemon:Giga Venu')?.id).toBe('pokemon:Giga Venu');
    expect(habilidadeDa(venu, 'fogo')?.id).toBe('pokemon:Mega Venu');
    expect(habilidadeDa(venu)?.mana).toBe(80);
    expect(habilidadeDa(venu)?.texto).toBe(
      'Vira Mega Venu: +40% de vida, dano, armadura e resistência e +15% de velocidade de ataque até o fim da luta.');
    expect(opcoesDeUlt(venu)).toEqual([
      { id: 'pokemon:Mega Venu', nome: 'Vira Mega Venu' }, { id: 'pokemon:Giga Venu', nome: 'Vira Giga Venu' }]);

    const m = criarMundo();
    const eu = m.add('Venu', 'a', { col: 3, lin: 5 });
    habilidadeDa(venu, 'pokemon:Giga Venu')!.lancar(m.ctx, eu, null);
    expect(m.registro).toContain(`transformar:pokemon:Giga Venu:${MULT_TRANSFORMAR}`);
    expect(m.registro).toContain('buff:velAtaque');
    expect(m.registro).toContain('visual:transformar');
  });

  it('depois de transformar não lança mais, salvo a cadeia do Digimon', () => {
    expect(habilidadeDa(F('pokemon:Mega Venu'))).toBeNull();
    expect(opcoesDeUlt(F('pokemon:Mega Venu'))).toEqual([]);
    expect(habilidadeDa(F('digimon:War'))?.id).toBe('digimon:Omega');
    expect(habilidadeDa(F('digimon:Omega'))).toBeNull();
  });

  it('habilidade própria', () => {
    expect(habilidadeDa(F('jojo:Star Platinum'))).toBe(HABILIDADES_PROPRIAS['jojo:Star Platinum']);
    expect(habilidadeDa(F('pokemon:Exploud'), 'unicos')).toBe(HABILIDADES_PROPRIAS['pokemon:Exploud']);
    expect(opcoesDeUlt(F('jojo:Star Platinum'))).toEqual([]);
  });

  it('ult da classe escolhida, ou da 1ª classe com ult', () => {
    const char = F('pokemon:Char');
    expect(habilidadeDa(char)).toBe(HABILIDADES_CLASSE.dragao);
    expect(habilidadeDa(char, 'fogo')).toBe(HABILIDADES_CLASSE.fogo);
    expect(habilidadeDa(char, 'agua')).toBe(HABILIDADES_CLASSE.dragao);
    expect(opcoesDeUlt(char)).toEqual([{ id: 'dragao', nome: 'Sopro de Dragão' }, { id: 'fogo', nome: 'Bola de Fogo' }]);
  });

  it('sem classe com ult: Golpe', () => {
    expect(habilidadeDa(F('pokemon:Mewtwo'))).toBe(GOLPE);
    expect(opcoesDeUlt(F('pokemon:Mewtwo'))).toEqual([]);
  });

  it('LoL: na estrela 3, a cada 2 lançamentos sai duas vezes', () => {
    const h = habilidadeDa(F('lol:Ahri'))!;
    expect(h.id).toBe('safada');
    expect(h.texto).toContain('regra do LoL');
    expect(habilidadeDa(F("lol:Vel'Koz"))!.texto).toContain('regra do LoL');

    const lancamentos = (estrela: 1 | 3) => {
      const m = criarMundo();
      const eu = m.add('Ahri', 'a', { col: 3, lin: 4 }, { fr: 'lol', estrela, at: { dano: 1 } });
      m.add('alvo', 'b', { col: 3, lin: 3 }, { at: { vida: 1e6 } });
      for (let i = 0; i < 4; i++) { h.lancar(m.ctx, eu, null); m.rodar(1); }
      return m.conta('visual:charme');
    };
    expect(lancamentos(1)).toBe(4);
    expect(lancamentos(3)).toBe(6);
  });
});

describe('traços', () => {
  it('10 origens e 19 classes/elementos, sem Únicos, com as escadas do design', () => {
    expect(Object.keys(TRACOS).sort()).toEqual([...ORIGENS, ...CLASSES, ...ELEMENTOS].sort());
    const escadas: Record<string, number[]> = {
      pokemon: [2, 4, 6, 8, 9, 10], digimon: [2, 3, 4, 5, 6], smt: [2, 3, 4, 6, 8], persona: [1, 2, 3, 4, 5],
      jojo: [2, 3, 5, 7, 9, 10], ygo: [2, 3, 5, 7, 9, 10], lol: [2, 3, 5, 7, 9, 10], overwatch: [2, 3, 4, 5, 7],
      deadlock: [2, 3, 4, 5, 6], sujimon: [2, 3, 4, 5, 6],
    };
    for (const o of ORIGENS) expect(TRACOS[o]!.degraus, o).toEqual(escadas[o]);
    for (const c of CLASSES) expect(TRACOS[c]!.degraus, c).toEqual([2, 4, 6]);
    for (const e of ELEMENTOS) expect(TRACOS[e]!.degraus, e).toEqual([2, 3, 4]);
    for (const o of ORIGENS) expect(TRACOS[o]!.tipo).toBe('origem');
    for (const c of CLASSES) expect(TRACOS[c]!.tipo).toBe('classe');
    for (const e of ELEMENTOS) expect(TRACOS[e]!.tipo).toBe('elemento');
  });

  it('nome, descrição e um texto por degrau', () => {
    for (const t of Object.values(TRACOS)) {
      expect(t.nome.trim(), t.id).not.toBe('');
      expect(t.descricao.trim(), t.id).not.toBe('');
      expect(t.textos, t.id).toHaveLength(t.degraus.length);
      for (const x of [t.descricao, ...t.textos]) {
        expect(x.trim(), t.id).not.toBe('');
        expect(x, t.id).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('atributos por degrau só usam números', () => {
    for (const t of Object.values(TRACOS)) {
      if (!t.atributos) continue;
      for (let n = 0; n < t.degraus.length; n++) {
        for (const v of Object.values(t.atributos(n))) expect(Number.isFinite(v), t.id).toBe(true);
      }
    }
  });

  it('contarTracos: cópia repetida conta uma vez, origem conta, Únicos fica fora, ordem dos ativos', () => {
    const r = contarTracos([
      { campeao: 'pokemon:char', forma: 'pokemon:Char' },
      { campeao: 'pokemon:char', forma: 'pokemon:Char' },
      { campeao: 'digimon:agu', forma: 'digimon:Agu' },
      { campeao: 'pokemon:mewtwo', forma: 'pokemon:Mewtwo' },
      { campeao: 'pokemon:exploud', forma: 'pokemon:Exploud' },
      { campeao: 'pokemon:bulba', forma: 'pokemon:Venu' },
      { campeao: 'lol:ahri', forma: 'lol:Ahri' },
    ]);
    const de = (id: string) => r.find(t => t.id === id);
    expect(de('unicos')).toBeUndefined();
    expect(de('fogo')).toEqual({ id: 'fogo', n: 2, nivel: 0 });
    expect(de('pokemon')).toEqual({ id: 'pokemon', n: 4, nivel: 1 });
    expect(de('dragao')).toEqual({ id: 'dragao', n: 1, nivel: -1 });
    expect(de('planta')).toEqual({ id: 'planta', n: 1, nivel: -1 });
    expect(de('digimon')).toEqual({ id: 'digimon', n: 1, nivel: -1 });
    expect(de('lol')).toEqual({ id: 'lol', n: 1, nivel: -1 });
    expect(de('safada')).toEqual({ id: 'safada', n: 1, nivel: -1 });
    // ativos primeiro (pokemon tem mais campeões que fogo no mesmo degrau), depois inativos
    expect(r.slice(0, 2).map(t => t.id)).toEqual(['pokemon', 'fogo']);
    expect(r.slice(2).every(t => t.nivel === -1)).toBe(true);
  });

  it('contarTracos: alternativas do mesmo campeão contam uma vez em cada traço; degrau sobe com a contagem', () => {
    const r = contarTracos([
      { campeao: 'pokemon:ralts', forma: 'pokemon:Gardevoir' },
      { campeao: 'pokemon:ralts', forma: 'pokemon:Gallade' },
    ]);
    expect(r.find(t => t.id === 'pokemon')?.n).toBe(1);
    expect(r.find(t => t.id === 'fadinhas')?.n).toBe(1);
    expect(r.find(t => t.id === 'porradeiro')?.n).toBe(1);
    expect(contarTracos([])).toEqual([]);
  });
});

describe('itens', () => {
  const receitas = ler<[string, string, string][]>('../../../docs/tft/base/receitas-bakugan.json');

  it('7 componentes e 28 completos, um por par', () => {
    const comps = Object.values(ITENS).filter(i => !i.componentes);
    const completos = Object.values(ITENS).filter(i => i.componentes);
    expect(comps.map(c => c.id)).toEqual([...COMPONENTES]);
    expect(completos).toHaveLength(28);
    const pares = new Set<string>();
    for (const a of COMPONENTES) for (const b of COMPONENTES) {
      const id = combinar(a, b);
      expect(id).toBe(combinar(b, a));
      expect(ITENS[id], id).toBeDefined();
      expect([...ITENS[id]!.componentes!].sort()).toEqual([a, b].sort());
      pares.add(id);
    }
    expect(pares.size).toBe(28);
    for (const c of COMPONENTES) expect(ehComponente(c)).toBe(true);
    expect(ehComponente('pyrus+aquos')).toBe(false);
  });

  it('receitas e nomes dos Bakugan batem com docs/tft/base/receitas-bakugan.json', () => {
    expect(receitas).toHaveLength(28);
    for (const [a, b, bakugan] of receitas) {
      const id = combinar(a.toLowerCase() as typeof COMPONENTES[number], b.toLowerCase() as typeof COMPONENTES[number]);
      expect(ITENS[id]?.bakugan, id).toBe(bakugan);
      expect(ITENS[id]?.nome, id).toBe(bakugan.replace(' (Generation 1)', ''));
    }
    expect(ITENS['darkus+darkus']?.nome).toBe('Hydranoid');
  });

  it('completo soma os componentes ×1,5', () => {
    expect(ITENS['pyrus+pyrus']!.atributos).toEqual({ dano: 0.45 });
    expect(ITENS['pyrus+aquos']!.atributos).toEqual({ dano: 0.23, manaInicial: 23 });
    expect(ITENS['subterra+ventus']!.atributos).toEqual({ armadura: 0.38, velAtaque: 0.18 });
    expect(ITENS['haos+ventus']!.atributos).toEqual({ resist: 0.23, velAtaque: 0.18, desvio: 0.15 });
    expect(ITENS.pyrus!.atributos).toEqual({ dano: 0.15 });
  });

  it('texto não vazio, com os números', () => {
    for (const i of Object.values(ITENS)) {
      expect(i.nome.trim(), i.id).not.toBe('');
      expect(i.texto, i.id).toMatch(/\d/);
      expect(i.texto, i.id).not.toMatch(/undefined|NaN/);
    }
    expect(ITENS.haos!.texto).toBe('+15% de resistência e escudo de 8% da vida no começo da luta.');
    expect(ITENS['pyrus+pyrus']!.texto).toBe('+45% de dano de ataque. Os ataques queimam o alvo por 3 s: 2% da vida máxima por segundo.');
  });
});

describe('set de verdade (public/autobatalha/set1.json)', () => {
  const set = ler<SetDados>('../../../public/autobatalha/set1.json');

  it('toda habilidade própria citada no set existe', () => {
    for (const f of Object.values(set.formas)) {
      if (f.habilidade) expect(HABILIDADES_PROPRIAS[f.habilidade], f.id).toBeDefined();
    }
  });

  it('toda classe do set (menos Únicos) é um traço com ult', () => {
    for (const f of Object.values(set.formas)) {
      for (const c of f.classes) {
        if (c === 'unicos') continue;
        expect(TRACOS[c], `${f.id}: ${c}`).toBeDefined();
        expect(HABILIDADES_CLASSE[c], `${f.id}: ${c}`).toBeDefined();
      }
    }
  });

  it('todo Bakugan dos itens tem imagem no set', () => {
    for (const i of Object.values(ITENS)) if (i.bakugan) expect(set.bakugan[i.bakugan], i.bakugan).toBeTruthy();
  });
});
