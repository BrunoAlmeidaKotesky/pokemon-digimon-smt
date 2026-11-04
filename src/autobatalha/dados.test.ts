// Invariantes do set gerado por `node autobatalha.mjs` (public/autobatalha/set1.json) e o índice de dados.ts.
// Não confere personagem por personagem (o set muda a cada exportação do Catálogo): confere que o arquivo é coerente.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { indexar } from './dados';
import { ORIGENS, type CampeaoDados, type SetDados } from './tipos';

const ler = <T>(caminho: string) => JSON.parse(readFileSync(new URL(caminho, import.meta.url), 'utf8')) as T;
const set = ler<SetDados>('../../public/autobatalha/set1.json');
const receitas = ler<[string, string, string][]>('../../docs/tft/base/receitas-bakugan.json');

const formas = Object.values(set.formas);
const idsTraco = new Set(set.tracos.map(t => t.id));
const formasDe = (c: CampeaoDados) => c.niveis.flat();

describe('set da Autobatalha (public/autobatalha/set1.json)', () => {
  it('cabeçalho: versão, data, fonte e traços sem repetir', () => {
    expect(set.versao).toBe(1);
    expect(set.geradoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(set.fonte).toBeTruthy();
    expect(set.tracos.length).toBeGreaterThan(0);
    expect(idsTraco.size).toBe(set.tracos.length);
    for (const t of set.tracos) expect(t.nome, t.id).toBeTruthy();
  });

  it('ids únicos: campeões, e cada forma guardada pelo próprio id `${fr}:${nome}`', () => {
    expect(new Set(set.campeoes.map(c => c.id)).size).toBe(set.campeoes.length);
    for (const [id, f] of Object.entries(set.formas)) {
      expect(f.id).toBe(id);
      expect(id).toBe(`${f.fr}:${f.nome}`);
    }
  });

  it('toda forma citada em niveis, transforma e de existe', () => {
    for (const c of set.campeoes) {
      for (const id of formasDe(c)) expect(set.formas[id], `${c.id} → ${id}`).toBeDefined();
      for (const [a, b] of Object.entries(c.de ?? {})) {
        expect(set.formas[a], `${c.id} de ${a}`).toBeDefined();
        expect(set.formas[b], `${c.id} de ${b}`).toBeDefined();
      }
    }
    for (const f of formas) for (const t of f.transforma ?? []) expect(set.formas[t], `${f.id} → ${t}`).toBeDefined();
  });

  it('campeão: origem válida, custo 1 a 5, 1 a 3 níveis sem nível vazio, formas da mesma origem', () => {
    for (const c of set.campeoes) {
      expect(ORIGENS, c.id).toContain(c.fr);
      expect([1, 2, 3, 4, 5], c.id).toContain(c.custo);
      expect(c.nome, c.id).toBeTruthy();
      expect(c.niveis.length, c.id).toBeGreaterThanOrEqual(1);
      expect(c.niveis.length, c.id).toBeLessThanOrEqual(3);
      for (const n of c.niveis) expect(n.length, c.id).toBeGreaterThan(0);
      for (const id of formasDe(c)) expect(set.formas[id]?.fr, `${c.id} → ${id}`).toBe(c.fr);
      expect(c.nome, c.id).toBe(set.formas[c.niveis[0]![0]!]?.nome);
    }
  });

  it('de: a forma do último nível vem de uma forma do nível 2', () => {
    for (const c of set.campeoes) {
      for (const [a, b] of Object.entries(c.de ?? {})) {
        expect(c.niveis[2], c.id).toContain(a);
        expect(c.niveis[1], c.id).toContain(b);
      }
    }
  });

  it('cada forma vendida está em um campeão só, e nenhuma forma de nível é só de ult', () => {
    const dono = new Map<string, string>();
    for (const c of set.campeoes) {
      for (const id of new Set(formasDe(c))) {
        expect(dono.get(id), `${id} em ${dono.get(id)} e ${c.id}`).toBeUndefined();
        dono.set(id, c.id);
        expect(set.formas[id]?.soUlt, id).toBeUndefined();
      }
    }
    for (const f of formas) if (!f.soUlt) expect(dono.has(f.id), `${f.id} não é vendida nem só de ult`).toBe(true);
  });

  it('forma só de ult é alvo de alguma transformação', () => {
    const alvos = new Set(formas.flatMap(f => f.transforma ?? []));
    for (const f of formas) if (f.soUlt) expect(alvos.has(f.id), f.id).toBe(true);
  });

  it('toda forma tem imagem, origem válida, classes conhecidas e informações bem formadas', () => {
    for (const f of formas) {
      expect(f.img, f.id).toBeTruthy();
      expect(ORIGENS, f.id).toContain(f.fr);
      for (const cl of f.classes) expect(idsTraco.has(cl) || cl === 'unicos', `${f.id}: ${cl}`).toBe(true);
      for (const i of f.info) {
        expect(i.rotulo, f.id).toBeTruthy();
        expect(i.valor, f.id).toBeTruthy();
      }
    }
  });

  it('ult: forma não final só ataca (sem transformação); habilidade própria é o id da forma; só de ult não tem habilidade', () => {
    for (const f of formas) {
      if (f.semUlt) expect(f.transforma, f.id).toBeUndefined();
      if (f.habilidade) expect(f.habilidade, f.id).toBe(f.id);
      if (f.soUlt) expect(f.habilidade, f.id).toBeUndefined();
      if (f.semUlt) expect(['pokemon', 'digimon'], f.id).toContain(f.fr);
    }
  });

  it('Stand: todo campeão de JoJo e só eles', () => {
    for (const c of set.campeoes) expect(!!c.stand, c.id).toBe(c.fr === 'jojo');
  });

  it('Bakugan: um por receita, com imagem; Final Fantasy: inimigos e chefes com imagem', () => {
    for (const r of receitas) expect(typeof set.bakugan[r[2]], r[2]).toBe('string');
    expect(Object.values(set.bakugan).filter(Boolean).length).toBeGreaterThan(0);
    expect(set.ff.inimigos.length).toBeGreaterThan(0);
    expect(set.ff.chefes.length).toBeGreaterThan(0);
    for (const m of [...set.ff.inimigos, ...set.ff.chefes]) {
      expect(m.img, m.nome).toBeTruthy();
      expect(m.jogo, m.nome).toBeTruthy();
      if (m.nivel !== undefined) expect(typeof m.nivel).toBe('number');
    }
  });
});

describe('indexar() com o set gerado', () => {
  const S = indexar(set);

  it('porCusto tem todos os campeões', () => {
    const soma = ([1, 2, 3, 4, 5] as const).reduce((n, k) => n + S.porCusto[k].length, 0);
    expect(soma).toBe(set.campeoes.length);
    for (const k of [1, 2, 3, 4, 5] as const) for (const c of S.porCusto[k]) expect(c.custo).toBe(k);
  });

  it('formaPadrao: estrela s = nível s; linha de 2 níveis repete o último na estrela 3', () => {
    const dois = set.campeoes.find(c => c.niveis.length === 2);
    expect(dois).toBeDefined();
    expect(S.formaPadrao(dois!.id, 1)).toBe(dois!.niveis[0]![0]);
    expect(S.formaPadrao(dois!.id, 3)).toBe(dois!.niveis[1]![0]);
    const tres = set.campeoes.find(c => c.niveis.length === 3)!;
    expect(S.formaPadrao(tres.id, 2)).toBe(tres.niveis[1]![0]);
    const solto = set.campeoes.find(c => c.niveis.length === 1)!;
    expect(S.formaPadrao(solto.id, 3)).toBe(solto.niveis[0]![0]);
  });

  it('tracosDoCampeao: a origem primeiro e as classes de todas as formas da linha', () => {
    for (const c of set.campeoes) {
      const t = S.tracosDoCampeao(c.id);
      expect(t[0], c.id).toBe(c.fr);
      for (const id of formasDe(c)) for (const cl of set.formas[id]!.classes) expect(t, c.id).toContain(cl);
      expect(new Set(t).size, c.id).toBe(t.length);
    }
  });

  it('campeao, forma, origemDe e nomeTraco', () => {
    const c = set.campeoes[0]!;
    expect(S.campeao(c.id)).toBe(c);
    const f = c.niveis[0]![0]!;
    expect(S.forma(f).id).toBe(f);
    expect(S.temForma(f)).toBe(true);
    expect(S.origemDe(f)).toBe(c.fr);
    expect(S.nomeTraco('pokemon')).toBe('Pokémon');
    for (const t of set.tracos) expect(S.nomeTraco(t.id)).toBe(t.nome);
    expect(() => S.campeao('nao:existe')).toThrow();
    expect(() => S.forma('nao:existe')).toThrow();
  });
});
