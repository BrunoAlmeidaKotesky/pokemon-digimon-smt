import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installStorage, seedRandom } from '../core/test-helpers';
import { indiceDoDia } from './dia';
import { ADIVINHA_KEY, lerSalvo } from './placar';
import type { AdvItem } from './pool';
import { chutar, desistir, escolher, jogoAtual, proximo, reiniciarSolo, salvoAtual, sessaoLivre, solo } from './solo';

const pool: AdvItem[] = ['Ahri', 'Akali', 'Jinx', 'Lux', 'Zed'].map(name => ({ name, img: '', fr: 'lol', info: {}, emoji: null }));
const HOJE = '2026-11-21';
let st: ReturnType<typeof installStorage>;

beforeEach(() => {
  st = installStorage();
  reiniciarSolo();
  escolher({ grupo: 'lol', submodo: 'classico', rodada: 'dia' });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('desafio do dia', () => {
  it('o personagem do índice do dia na lista ordenada; o mesmo a cada chamada', () => {
    const j = jogoAtual(pool, HOJE)!;
    expect(j.alvo.name).toBe(pool[indiceDoDia(HOJE, 'lol', 'classico', pool.length)]!.name);
    expect(jogoAtual(pool, HOJE)).toBe(j);
    expect(j.data).toBe(HOJE);
    expect(jogoAtual([], HOJE)).toBeNull();
  });

  it('chutes ficam salvos em pdx-adivinha-v1 e voltam depois de recarregar; acertar soma nas estatísticas', () => {
    const j = jogoAtual(pool, HOJE)!;
    const errado = pool.find(x => x.name !== j.alvo.name)!.name;
    chutar(pool, errado, HOJE);
    chutar(pool, errado, HOJE); // repetido: ignora
    chutar(pool, 'Ninguém', HOJE); // fora da lista: ignora
    expect(jogoAtual(pool, HOJE)!.chutes).toEqual([errado]);
    chutar(pool, j.alvo.name.toLowerCase(), HOJE); // sem diferenciar maiúscula
    expect(jogoAtual(pool, HOJE)!.fim).toBe('acertou');
    const salvo = lerSalvo(JSON.parse(st.getItem(ADIVINHA_KEY)!));
    expect(salvo.dia['lol:classico']).toEqual({ data: HOJE, alvo: j.alvo.name, chutes: [errado, j.alvo.name], acertou: true });
    expect(salvo.stats['lol:classico']).toEqual({ jogos: 1, chutes: 2, seq: 1, melhor: 1, ultimo: HOJE });
    // recarregar a página
    reiniciarSolo();
    expect(solo).toEqual({ grupo: 'lol', submodo: 'classico', rodada: 'dia' });
    const de = jogoAtual(pool, HOJE)!;
    expect(de).toMatchObject({ chutes: [errado, j.alvo.name], fim: 'acertou' });
    chutar(pool, errado, HOJE);
    expect(salvoAtual().stats['lol:classico']!.jogos).toBe(1);
    // desistir não vale no do dia
    desistir(pool, HOJE);
    expect(jogoAtual(pool, HOJE)!.fim).toBe('acertou');
  });

  it('à meia-noite vira outro desafio; cada submodo tem o seu', () => {
    const a = jogoAtual(pool, HOJE)!;
    chutar(pool, a.alvo.name, HOJE);
    const b = jogoAtual(pool, '2026-11-22')!;
    expect(b).not.toBe(a);
    expect(b).toMatchObject({ data: '2026-11-22', chutes: [], fim: null });
    escolher({ submodo: 'imagem' });
    expect(jogoAtual(pool, HOJE)!.chutes).toEqual([]);
    expect(jogoAtual(pool, HOJE)!.id).toBe('dia:lol:imagem');
  });

  it('se a lista mudar e o personagem salvo continuar nela, ele continua sendo o de hoje', () => {
    const j = jogoAtual(pool, HOJE)!;
    reiniciarSolo();
    const maior = [...pool, ...['Aatrox', 'Bard', 'Ekko'].map(name => ({ name, img: '', fr: 'lol', info: {}, emoji: null }))];
    chutar(pool, pool.find(x => x.name !== j.alvo.name)!.name, HOJE);
    reiniciarSolo();
    expect(jogoAtual(maior, HOJE)!.alvo.name).toBe(j.alvo.name);
  });
});

describe('livre', () => {
  beforeEach(() => { escolher({ rodada: 'livre' }); seedRandom(5); });

  it('sorteia do saco: passa por todos antes de repetir; desistir mostra; próximo troca', () => {
    const vistos: string[] = [];
    for (let i = 0; i < pool.length; i++) {
      const j = jogoAtual(pool, HOJE)!;
      expect(j.data).toBeNull();
      vistos.push(j.alvo.name);
      desistir(pool, HOJE);
      expect(jogoAtual(pool, HOJE)!.fim).toBe('desistiu');
      proximo(pool);
    }
    expect(new Set(vistos).size).toBe(pool.length);
    // saco novo: o primeiro não repete o último
    expect(jogoAtual(pool, HOJE)!.alvo.name).not.toBe(vistos.at(-1));
  });

  it('acertos e média da sessão; nada vai pro localStorage além da escolha da tela', () => {
    const j = jogoAtual(pool, HOJE)!;
    chutar(pool, pool.find(x => x.name !== j.alvo.name)!.name, HOJE);
    chutar(pool, j.alvo.name, HOJE);
    expect(sessaoLivre('lol', 'classico')).toEqual({ acertos: 1, chutes: 2 });
    expect(lerSalvo(JSON.parse(st.getItem(ADIVINHA_KEY)!))).toEqual({ dia: {}, stats: {}, cfg: { grupo: 'lol', submodo: 'classico', rodada: 'livre' } });
  });
});
