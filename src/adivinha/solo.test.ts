import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installStorage, seedRandom } from '../core/test-helpers';
import { indiceDoDia } from './dia';
import { ADIVINHA_KEY, chavePercurso, lerSalvo } from './placar';
import type { AdvItem } from './pool';
import {
  alternarEtapa, chutar, desistir, escolher, franquiaSeguinte, irParaFranquia, proximaEtapa, proximo, recomecarCiclo, reiniciarSolo,
  mudarRecorte, recorteDe, salvoAtual, sessaoLivre, solo, tela, verEtapa, type Pools,
} from './solo';

const item = (name: string): AdvItem => ({ name, img: '', fr: 'lol', info: {}, emoji: ['🦊', '🌙'] });
const LISTA = ['Ahri', 'Akali', 'Jinx', 'Lux', 'Zed'].map(item);
const pools = (emoji = true): Pools => ({ classico: LISTA, imagem: LISTA, blur: LISTA, emoji: emoji ? LISTA : [] });
const HOJE = '2026-11-21';
let st: ReturnType<typeof installStorage>;
const T = (p = pools()) => tela(p, HOJE)!;
const errado = (p = pools()) => LISTA.find(x => x.name !== T(p).jogo.alvo.name && !T(p).jogo.chutes.includes(x.name))!.name;
/** acerta a etapa da tela (um chute errado antes) */
function resolver(p = pools()) {
  chutar(p, errado(p), HOJE);
  chutar(p, T(p).jogo.alvo.name, HOJE);
}

beforeEach(() => {
  st = installStorage();
  reiniciarSolo();
  escolher({ grupo: 'lol', submodo: 'classico', rodada: 'dia' });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('desafio do dia: percurso', () => {
  it('começa no Clássico, com o personagem do dia daquela etapa', () => {
    const t = T();
    expect(t).toMatchObject({ modo: 'dia', sub: 'classico', etapas: ['classico', 'imagem', 'blur', 'emoji'] });
    expect(t.jogo.alvo.name).toBe(LISTA[indiceDoDia(HOJE, 'lol', 'classico', LISTA.length)]!.name);
    expect(T().jogo).toBe(t.jogo);
    expect(tela({ classico: [], imagem: [], blur: [], emoji: [] }, HOJE)).toBeNull();
  });

  it('etapa trancada não abre; resolvida fica na tela até "Próxima etapa"; cada etapa com o seu personagem', () => {
    verEtapa(pools(), HOJE, 'blur');
    expect(T().sub).toBe('classico');
    resolver();
    expect(T()).toMatchObject({ sub: 'classico', jogo: { fim: 'acertou' } });
    expect(T().percurso?.atual).toBe('imagem');
    proximaEtapa(pools(), HOJE);
    const img = T();
    expect(img.sub).toBe('imagem');
    expect(img.jogo.alvo.name).toBe(LISTA[indiceDoDia(HOJE, 'lol', 'imagem', LISTA.length)]!.name);
    // rever a etapa feita e voltar
    verEtapa(pools(), HOJE, 'classico');
    expect(T().sub).toBe('classico');
    verEtapa(pools(), HOJE, 'imagem');
    expect(T().sub).toBe('imagem');
    // desistir não vale no dia
    desistir(pools(), HOJE);
    expect(T().jogo.fim).toBeNull();
  });

  it('o dia conta quando o percurso termina; o Emoji sem arquivo sai do percurso', () => {
    const p = pools(false);
    expect(T(p).etapas).toEqual(['classico', 'imagem', 'blur']);
    for (const sub of ['classico', 'imagem', 'blur']) {
      expect(T(p).sub).toBe(sub);
      expect(salvoAtual().stats[chavePercurso('lol')]).toBeUndefined();
      resolver(p);
      proximaEtapa(p, HOJE);
    }
    expect(T(p).percurso).toMatchObject({ completo: true, chutes: 6, atual: null });
    expect(T(p).sub).toBe('blur');
    const salvo = lerSalvo(JSON.parse(st.getItem(ADIVINHA_KEY)!));
    expect(salvo.stats[chavePercurso('lol')]).toEqual({ jogos: 1, chutes: 6, seq: 1, melhor: 1, ultimo: HOJE });
    expect(salvo.stats['lol:classico']).toEqual({ jogos: 1, chutes: 2, seq: 1, melhor: 1, ultimo: HOJE });
    expect(salvo.dia['lol:blur']).toMatchObject({ data: HOJE, acertou: true });
    // recarregar: tudo feito
    reiniciarSolo();
    expect(T(p).percurso?.completo).toBe(true);
  });

  it('desligar etapas encurta o percurso (pelo menos uma fica) e é guardado; desligar a que faltava fecha o dia', () => {
    alternarEtapa(pools(), HOJE, 'blur');
    alternarEtapa(pools(), HOJE, 'emoji');
    expect(solo.etapas).toEqual(['classico', 'imagem']);
    expect(T().etapas).toEqual(['classico', 'imagem']);
    resolver();
    proximaEtapa(pools(), HOJE);
    expect(T().sub).toBe('imagem');
    alternarEtapa(pools(), HOJE, 'imagem');
    expect(T().percurso?.completo).toBe(true);
    expect(salvoAtual().stats[chavePercurso('lol')]?.jogos).toBe(1);
    alternarEtapa(pools(), HOJE, 'classico');
    expect(solo.etapas).toEqual(['classico']);
    reiniciarSolo();
    expect(solo.etapas).toEqual(['classico']);
  });

  it('próxima franquia: a seguinte dos chips, pulando as já feitas hoje', () => {
    expect(franquiaSeguinte()).toBe('overwatch');
    expect(franquiaSeguinte(g => g === 'overwatch' || g === 'deadlock')).toBe('pokemon');
    expect(franquiaSeguinte(() => true)).toBeNull();
    irParaFranquia('pokemon');
    expect(solo.grupo).toBe('pokemon');
  });
});

describe('livre', () => {
  beforeEach(() => { escolher({ rodada: 'livre', submodo: 'blur' }); seedRandom(5); });

  it('submodo solto: sorteia do saco (passa por todos antes de repetir); desistir mostra; próximo troca', () => {
    const vistos: string[] = [];
    for (let i = 0; i < LISTA.length; i++) {
      const t = T();
      expect(t).toMatchObject({ modo: 'livre', sub: 'blur', etapas: ['blur'], percurso: null });
      expect(t.jogo.data).toBeNull();
      vistos.push(t.jogo.alvo.name);
      desistir(pools(), HOJE);
      expect(T().jogo.fim).toBe('desistiu');
      proximo(pools(), HOJE);
    }
    expect(new Set(vistos).size).toBe(LISTA.length);
    expect(T().jogo.alvo.name).not.toBe(vistos.at(-1));
    escolher({ submodo: 'emoji' });
    expect(tela(pools(false), HOJE)).toBeNull();
  });

  it('Todos: Clássico → Imagem → Blur → Emoji, um personagem por etapa; no fim, recomeça o ciclo', () => {
    escolher({ submodo: 'todos' });
    const ciclo1: string[] = [];
    for (const sub of ['classico', 'imagem', 'blur', 'emoji']) {
      expect(T()).toMatchObject({ modo: 'todos', sub });
      proximaEtapa(pools(), HOJE); // sem terminar, não anda
      expect(T().sub).toBe(sub);
      ciclo1.push(T().jogo.alvo.name);
      if (sub === 'blur') desistir(pools(), HOJE); else resolver();
      proximaEtapa(pools(), HOJE);
    }
    // a última etapa não tem próxima: fica na tela até recomeçar
    expect(T()).toMatchObject({ sub: 'emoji', jogo: { fim: 'acertou' } });
    expect(sessaoLivre('lol', 'todos')).toEqual({ acertos: 3, chutes: 6 });
    recomecarCiclo(pools());
    const t = T();
    expect(t).toMatchObject({ sub: 'classico', jogo: { fim: null, chutes: [] } });
    expect(t.jogo.ciclo).toBe(2);
    // nada do livre vai pro localStorage além da escolha da tela
    expect(lerSalvo(JSON.parse(st.getItem(ADIVINHA_KEY)!))).toMatchObject({ dia: {}, stats: {}, cfg: { grupo: 'lol', submodo: 'todos', rodada: 'livre' } });
  });

  it('Todos: etapas desligadas saem do ciclo; a próxima franquia começa do Clássico', () => {
    escolher({ submodo: 'todos' });
    alternarEtapa(pools(), HOJE, 'imagem');
    alternarEtapa(pools(), HOJE, 'blur');
    expect(T().etapas).toEqual(['classico', 'emoji']);
    resolver();
    proximaEtapa(pools(), HOJE);
    expect(T().sub).toBe('emoji');
    expect(franquiaSeguinte(() => true)).toBe('overwatch'); // no livre não pula
    irParaFranquia('overwatch');
    expect(T()).toMatchObject({ sub: 'classico', jogo: { fim: null } });
  });
});

describe('recorte do livre', () => {
  it('fica guardado; trocar recomeça o livre com personagem novo; o dia não muda', () => {
    const dia = T();
    escolher({ rodada: 'livre', submodo: 'classico' });
    seedRandom(9);
    const livre = T().jogo;
    // trocar o recorte (mesmo de outra franquia sem recorte) recomeça o livre dela
    mudarRecorte('lol', ['I', 'II']);
    expect(recorteDe('lol')).toBeNull();
    expect(T().jogo).not.toBe(livre);
    mudarRecorte('pokemon', ['IV']);
    expect(lerSalvo(JSON.parse(st.getItem(ADIVINHA_KEY)!)).recortes).toEqual({ pokemon: ['IV'] });
    reiniciarSolo();
    expect(recorteDe('pokemon')).toEqual(['IV']);
    mudarRecorte('pokemon', null);
    expect(recorteDe('pokemon')).toBeNull();
    // o dia é o mesmo de antes
    escolher({ rodada: 'dia' });
    expect(T().jogo.alvo.name).toBe(dia.jogo.alvo.name);
  });
});
