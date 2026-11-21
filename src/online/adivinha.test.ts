import { beforeEach, describe, expect, it } from 'vitest';
import { parseCatalogo, type Catalogo } from '../catalog/model';
import { mulberry32 } from '../core/test-helpers';
import type { EmojiMapa } from '../adivinha/pool';
import type { Item } from '../types';
import { ADV_PADRAO, ADV_RODADAS, advSettings } from './adivinha';
import { parseClientMsg, parseHostMsg } from './protocol';
import { createRoom, DEFAULT_CONFIG, reduce } from './room';
import type { Action, AdivinhaGame, AdivinhaView, Ctx, OnlineConfig, RoomState } from './types';
import { viewFor } from './view';

// ---------- fixtures ----------

const CAMPEOES: Record<string, Record<string, unknown>> = {
  Ahri: { classe: ['Mago', 'Assassino'], regiao: 'Ionia', alcance: 'À distância', dano: 'Mágico', recurso: 'Mana', dificuldade: 5, genero: 'Feminino' },
  Akali: { classe: 'Assassino', regiao: 'Ionia', alcance: 'Corpo a corpo', dano: 'Mágico', recurso: 'Energia', dificuldade: 7, genero: 'Feminino' },
  Jinx: { classe: 'Atirador', regiao: 'Zaun', alcance: 'À distância', dano: 'Físico', recurso: 'Mana', dificuldade: 6 },
  Garen: { classe: ['Lutador', 'Tanque'], regiao: 'Demacia', alcance: 'Corpo a corpo', dano: 'Físico', recurso: 'Nenhum', dificuldade: 5 },
  Lux: { classe: ['Mago', 'Suporte'], regiao: 'Demacia', alcance: 'À distância', dano: 'Mágico', recurso: 'Mana', dificuldade: 5 },
};
const CAT: Catalogo = parseCatalogo({
  campos: ['classe', 'regiao', 'alcance', 'dano', 'recurso', 'dificuldade', 'genero'].map(id => ({ id })),
  itens: CAMPEOES,
}) as Catalogo;
const NOMES = Object.keys(CAMPEOES);
const LISTS: Record<string, Item[] | null> = { lol: NOMES.map(n => ({ name: n, img: `https://img.test/${n}.png` })) };
const EMOJIS: EmojiMapa = new Map([['Ahri', ['🦊', '🔮', '💖', '✨']], ['Jinx', ['🔫', '💥', '🩵']]]);

let rand = mulberry32(9);
let now = 10_000;
const ctx = (over: Partial<Ctx> = {}): Ctx => ({
  rand, now, lists: LISTS, adivinha: { catalogos: { lol: CAT }, emojis: { lol: EMOJIS } }, ...over,
});
const R = (s: RoomState, a: Action, c: Ctx = ctx()) => reduce(s, a, c);

function room(names = ['Ana', 'Bia'], adv: Partial<OnlineConfig['adivinha']> = {}): RoomState {
  let s = createRoom('ADVN', { id: 'h', name: 'Host' }, { ...DEFAULT_CONFIG, mode: 'adivinha', adivinha: { ...ADV_PADRAO, ...adv } });
  for (const n of names) s = R(s, { type: 'join', id: n.toLowerCase(), name: n });
  return s;
}
const G = (s: RoomState) => s.game as AdivinhaGame;
const started = (names?: string[], adv?: Partial<OnlineConfig['adivinha']>, c?: Ctx) => R(room(names, adv), { type: 'start' }, c);
const chute = (s: RoomState, id: string, nome: string) => R(s, { type: 'chute', id, rodada: G(s).rodada, nome });
/** um nome errado que ainda não foi chutado */
const errado = (s: RoomState) => NOMES.find(n => n !== G(s).secreto.name && !G(s).chutes.some(c => c.alvo?.name === n)) as string;
const V = (s: RoomState, id: string) => viewFor(s, id, now).game as AdivinhaView;

beforeEach(() => {
  rand = mulberry32(9);
  now = 10_000;
});

// ---------- testes ----------

describe('configuração', () => {
  it('padrão e limites', () => {
    expect(DEFAULT_CONFIG.adivinha).toEqual({ grupo: 'lol', submodo: 'classico', rodadas: 5, tempo: 40 });
    expect(advSettings({ grupo: 'digimon', submodo: 'falas' as never, rodadas: 99, tempo: 7 })).toEqual({ grupo: 'lol', submodo: 'classico', rodadas: ADV_RODADAS.max, tempo: 40 });
    expect(advSettings({ grupo: 'megaten', submodo: 'emoji', rodadas: 0.4, tempo: 15 })).toEqual({ grupo: 'megaten', submodo: 'emoji', rodadas: 1, tempo: 15 });
    expect(advSettings({ submodo: 'blur' }).submodo).toBe('blur');
    expect(advSettings(null)).toEqual(ADV_PADRAO);
  });
});

describe('começo', () => {
  it('sem catálogo carregado ou sem emojis: aviso e continua no lobby', () => {
    const carregando = R(room(), { type: 'start' }, ctx({ adivinha: { catalogos: {}, emojis: {} } }));
    expect(carregando.phase).toBe('lobby');
    expect(carregando.notice).toBe('As informações de LoL ainda estão carregando. Tente de novo em instantes.');
    const falhou = R(room(), { type: 'start' }, ctx({ adivinha: { catalogos: { lol: null }, emojis: {} } }));
    expect(falhou.notice).toBe('Não consegui carregar as informações de LoL.');
    const semEmoji = R(room(['Ana'], { submodo: 'emoji' }), { type: 'start' }, ctx({ adivinha: { catalogos: { lol: CAT }, emojis: { lol: null } } }));
    expect(semEmoji.notice).toBe('LoL ainda não tem emojis: escolha outro modo.');
    const semLista = R(room(), { type: 'start' }, ctx({ lists: {} }));
    expect(semLista.notice).toBe('Lista de LoL ainda não carregou.');
  });

  it('sorteia o secreto, abre a rodada 1 e a vez é do primeiro da sala, com o tempo configurado', () => {
    const s = started(['Ana', 'Bia'], { tempo: 30, rodadas: 3 });
    const g = G(s);
    expect(s.phase).toBe('play');
    expect(s.notice).toBe('');
    expect(g).toMatchObject({ grupo: 'lol', submodo: 'classico', rodadas: 3, tempo: 30, rodada: 1, passo: 'chute', ordem: ['h', 'ana', 'bia'], vez: 'h', prazo: now + 30_000 });
    expect(NOMES).toContain(g.secreto.name);
    expect(g.usados).toEqual([g.secreto.name]);
    expect(g.placar).toEqual({ h: 0, ana: 0, bia: 0 });
  });
});

describe('o secreto nunca vai pra ninguém enquanto a rodada está aberta', () => {
  it('Clássico: nem nome, nem imagem, nem informações; só depois do resultado', () => {
    let s = started();
    const sec = G(s).secreto;
    for (const id of ['h', 'ana', 'bia']) {
      const txt = JSON.stringify(viewFor(s, id, now));
      expect(txt).not.toContain(sec.name);
      expect(txt).not.toContain(sec.img);
      expect(V(s, id).secreto).toBeNull();
      expect(V(s, id).imagem).toBe('');
    }
    s = chute(s, 'h', errado(s));
    expect(JSON.stringify(viewFor(s, 'ana', now))).not.toContain(`"${sec.name}"`);
    s = chute(s, 'ana', sec.name);
    expect(V(s, 'bia').secreto).toEqual({ name: sec.name, img: sec.img, fr: 'lol' });
  });

  it('Emoji: só os já revelados (1 + chutes errados de todos), mais a quantidade; no fim, todos', () => {
    let s = started(['Ana'], { submodo: 'emoji' });
    const sec = G(s).secreto;
    expect(['Ahri', 'Jinx']).toContain(sec.name);
    const todos = EMOJIS.get(sec.name)!;
    expect(V(s, 'ana')).toMatchObject({ emoji: todos.slice(0, 1), totalEmoji: todos.length, erros: 0 });
    expect(JSON.stringify(viewFor(s, 'ana', now))).not.toContain(todos[1]!);
    // no Emoji só entra quem tem emoji: o chute errado também é um deles
    const outro = sec.name === 'Ahri' ? 'Jinx' : 'Ahri';
    expect(chute(s, 'h', 'Garen')).toBe(s);
    s = chute(s, 'h', outro);
    expect(V(s, 'ana')).toMatchObject({ emoji: todos.slice(0, 2), erros: 1 });
    s = R(s, { type: 'skip' });
    expect(V(s, 'ana').emoji).toEqual(todos);
  });

  it('Imagem (recorte) e Blur: mandam a imagem (precisa aparecer) e o ponto, iguais pra todos; nada de nome', () => {
    for (const submodo of ['imagem', 'blur'] as const) {
      const s = started(['Ana'], { submodo });
      const sec = G(s).secreto;
      const va = V(s, 'ana'), vh = V(s, 'h');
      expect(va.submodo).toBe(submodo);
      expect(va.imagem).toBe(sec.img);
      expect(va.foco).toBe(vh.foco);
      expect(va.foco).toBeGreaterThanOrEqual(0);
      expect(va.foco).toBeLessThan(1);
      expect(va.secreto).toBeNull();
      expect(parseHostMsg({ t: 'state', view: viewFor(s, 'ana', now) })).not.toBeNull();
    }
    expect(V(started(['Ana'], { submodo: 'emoji' }), 'ana').imagem).toBe('');
  });
});

describe('vez de cada um', () => {
  it('só quem está na vez chuta; chute errado traz as pistas e passa a vez', () => {
    let s = started();
    const n = errado(s);
    expect(chute(s, 'ana', n)).toBe(s); // não é a vez da Ana
    expect(R(s, { type: 'chute', id: 'h', rodada: 2, nome: n })).toBe(s); // rodada errada
    expect(chute(s, 'h', 'Teemo')).toBe(s); // fora da lista
    now += 1000;
    s = chute(s, 'h', n.toUpperCase()); // sem diferenciar maiúscula
    const g = G(s);
    expect(g.chutes).toHaveLength(1);
    expect(g.chutes[0]).toMatchObject({ por: 'h', porNome: 'Host', alvo: { name: n, fr: 'lol' }, certo: false });
    expect(g.chutes[0]!.pistas).toHaveLength(7);
    expect(g).toMatchObject({ vez: 'ana', prazo: now + 40_000 });
    // ninguém repete um chute da rodada
    expect(chute(s, 'ana', n)).toBe(s);
  });

  it('as pistas do Clássico são as mesmas da comparação (cores e setas)', () => {
    rand = () => 0; // secreto = primeiro da lista ordenada: Ahri
    let s = started(['Ana']);
    expect(G(s).secreto.name).toBe('Ahri');
    s = chute(s, 'h', 'Akali');
    expect(G(s).chutes[0]!.pistas).toEqual([
      { t: 'Assassino', c: 'parcial' }, { t: 'Ionia', c: 'certo' }, { t: 'Corpo a corpo', c: 'errado' },
      { t: 'Mágico', c: 'certo' }, { t: 'Energia', c: 'errado' }, { t: '7', c: 'errado', s: 'baixo' }, { t: 'Feminino', c: 'certo' },
    ]);
    expect(V(s, 'ana').chutes[0]!.pistas).toEqual(G(s).chutes[0]!.pistas);
  });

  it('quem acerta ganha a rodada (+1 ponto); a vez acaba', () => {
    let s = started();
    s = chute(s, 'h', errado(s));
    s = chute(s, 'ana', G(s).secreto.name);
    expect(G(s)).toMatchObject({ passo: 'resultado', vencedor: 'ana', vez: null, placar: { h: 0, ana: 1, bia: 0 } });
    expect(G(s).historico).toEqual([{ rodada: 1, secreto: { name: G(s).secreto.name, img: G(s).secreto.img, fr: 'lol' }, vencedor: 'ana', chutes: 2 }]);
    expect(chute(s, 'bia', errado(s))).toBe(s);
    expect(V(s, 'bia').placar.map(p => [p.nome, p.pontos])).toEqual([['Ana', 1], ['Host', 0], ['Bia', 0]]);
  });

  it('tempo esgotado (pelo relógio do host) passa a vez, sem contar como chute errado', () => {
    let s = started();
    expect(R(s, { type: 'tempo' }, ctx({ now: now + 39_999 }))).toBe(s);
    now += 40_000;
    s = R(s, { type: 'tempo' });
    expect(G(s).chutes).toEqual([{ por: 'h', porNome: 'Host', alvo: null, pistas: null, certo: false }]);
    expect(G(s)).toMatchObject({ vez: 'ana', prazo: now + 40_000 });
    expect(V(s, 'bia').erros).toBe(0);
    expect(V(s, 'bia').restante).toBe(40_000);
    now += 15_000;
    expect(V(s, 'bia').restante).toBe(25_000);
  });

  it('quem caiu é pulado (e, se era a vez dele, ela passa na hora); quem volta entra de novo na roda', () => {
    let s = started(['Ana', 'Bia']);
    s = R(s, { type: 'online', id: 'ana', online: false });
    s = chute(s, 'h', errado(s));
    expect(G(s).vez).toBe('bia');
    s = R(s, { type: 'online', id: 'bia', online: false });
    expect(G(s).vez).toBe('h');
    s = R(s, { type: 'online', id: 'ana', online: true });
    s = chute(s, 'h', errado(s));
    expect(G(s).vez).toBe('ana');
  });

  it('quem sai da sala sai da ordem (os pontos que tinha continuam no placar); quem entra vai pro fim', () => {
    let s = started(['Ana', 'Bia']);
    s = chute(s, 'h', errado(s));
    s = chute(s, 'ana', G(s).secreto.name);
    s = R(s, { type: 'next' });
    expect(G(s).vez).toBe('ana'); // a rodada 2 começa no segundo da sala
    s = R(s, { type: 'leave', id: 'ana' });
    expect(G(s)).toMatchObject({ ordem: ['h', 'bia'], vez: 'bia' });
    expect(V(s, 'h').placar.map(p => [p.nome, p.pontos])).toEqual([['Ana', 1], ['Host', 0], ['Bia', 0]]);
    s = R(s, { type: 'join', id: 'caio', name: 'Caio' });
    expect(G(s).ordem).toEqual(['h', 'bia', 'caio']);
    expect(G(s).placar.caio).toBe(0);
    s = chute(s, 'bia', errado(s));
    expect(G(s).vez).toBe('caio');
  });
});

describe('rodadas e fim', () => {
  it('próxima rodada: secreto novo (sem repetir) e começa no próximo jogador; depois da última, o placar final', () => {
    let s = started(['Ana'], { rodadas: 3 });
    const vistos: string[] = [];
    for (let r = 1; r <= 3; r++) {
      expect(G(s)).toMatchObject({ rodada: r, passo: 'chute', vez: r % 2 ? 'h' : 'ana', chutes: [] });
      vistos.push(G(s).secreto.name);
      s = R(s, { type: 'skip' }); // o host revela
      expect(G(s)).toMatchObject({ passo: 'resultado', vencedor: null });
      expect(chute(s, G(s).ordem[0]!, 'Ahri')).toBe(s);
      s = R(s, { type: 'next' });
    }
    expect(new Set(vistos).size).toBe(3);
    expect(G(s).passo).toBe('fim');
    expect(G(s).historico.map(h => h.vencedor)).toEqual([null, null, null]);
    expect(R(s, { type: 'next' })).toBe(s);
    expect(R(s, { type: 'skip' })).toBe(s);
    // voltar ao lobby encerra
    s = R(s, { type: 'lobby' });
    expect(s).toMatchObject({ phase: 'lobby', game: null });
  });

  it('a lista inteira usada: começa a repetir', () => {
    let s = started([], { rodadas: 10 });
    const vistos: string[] = [];
    for (let r = 0; r < 7; r++) {
      vistos.push(G(s).secreto.name);
      s = R(R(s, { type: 'skip' }), { type: 'next' });
    }
    expect(new Set(vistos.slice(0, 5)).size).toBe(5);
    expect(new Set(vistos).size).toBe(5);
  });

  it('host sozinho também joga', () => {
    let s = started([]);
    s = chute(s, 'h', errado(s));
    expect(G(s).vez).toBe('h');
    s = chute(s, 'h', G(s).secreto.name);
    expect(G(s).placar).toEqual({ h: 1 });
  });
});

describe('protocolo', () => {
  it('a visão de cada jogador passa na conferência', () => {
    let s = started(['Ana'], { submodo: 'emoji' });
    s = chute(s, 'h', G(s).secreto.name === 'Ahri' ? 'Jinx' : 'Ahri');
    now += 40_000;
    s = R(s, { type: 'tempo' });
    for (const id of ['h', 'ana']) expect(parseHostMsg({ t: 'state', view: viewFor(s, id, now) })).not.toBeNull();
    s = R(R(s, { type: 'skip' }), { type: 'next' });
    expect(parseHostMsg({ t: 'state', view: viewFor(s, 'ana', now) })).not.toBeNull();
    const c = started(['Ana']);
    expect(parseHostMsg({ t: 'state', view: viewFor(chute(c, 'h', errado(c)), 'ana', now) })).not.toBeNull();
  });

  it('visão torta é recusada', () => {
    const v = viewFor(started(['Ana']), 'ana', now);
    const torta = (patch: Record<string, unknown>) => parseHostMsg({ t: 'state', view: { ...v, game: { ...v.game, ...patch } } });
    expect(torta({ submodo: 'falas' })).toBeNull();
    expect(torta({ chutes: [{ por: 'h', porNome: 'H', alvo: null, pistas: [{ t: 'x', c: 'roxo' }], certo: false }] })).toBeNull();
    expect(torta({ restante: 'muito' })).toBeNull();
    expect(torta({ placar: [{ id: 'h', nome: 'H', pontos: -1 }] })).toBeNull();
    expect(parseHostMsg({ t: 'state', view: { ...v, cfg: { ...v.cfg, adivinha: { grupo: 'lol' } } } })).toBeNull();
  });

  it('chute do jogador', () => {
    expect(parseClientMsg({ t: 'chute', rodada: 2, nome: 'Ahri', extra: 1 })).toEqual({ t: 'chute', rodada: 2, nome: 'Ahri' });
    expect(parseClientMsg({ t: 'chute', rodada: -1, nome: 'Ahri' })).toBeNull();
    expect(parseClientMsg({ t: 'chute', rodada: 1, nome: '  ' })).toBeNull();
    expect(parseClientMsg({ t: 'chute', rodada: 1, nome: 'x'.repeat(500) })).toBeNull();
  });
});

describe('recorte da sala (gerações do Pokémon)', () => {
  const POKES: Record<string, Record<string, unknown>> = {
    Bulbasaur: { tipo: ['Grass', 'Poison'], geracao: 'I' }, Charmander: { tipo: ['Fire'], geracao: 'I' }, Squirtle: { tipo: ['Water'], geracao: 'I' },
    Chikorita: { tipo: ['Grass'], geracao: 'II' }, Cyndaquil: { tipo: ['Fire'], geracao: 'II' }, Totodile: { tipo: ['Water'], geracao: 'II' },
    Treecko: { tipo: ['Grass'], geracao: 'III' },
  };
  const PCAT = parseCatalogo({ campos: [{ id: 'tipo' }, { id: 'geracao' }], itens: POKES }) as Catalogo;
  const pctx = (over: Partial<Ctx> = {}) => ctx({
    lists: { ...LISTS, pokemon: Object.keys(POKES).map(n => ({ name: n, img: `p/${n}.png` })) },
    adivinha: { catalogos: { lol: CAT, pokemon: PCAT }, emojis: { lol: EMOJIS } }, ...over,
  });
  const sala = (recorte?: string[]) => {
    let s = createRoom('PKMN', { id: 'h', name: 'Host' }, { ...DEFAULT_CONFIG, mode: 'adivinha', adivinha: { ...ADV_PADRAO, grupo: 'pokemon', rodadas: 6, ...(recorte ? { recorte } : {}) } });
    s = R(s, { type: 'join', id: 'ana', name: 'Ana' }, pctx());
    return R(s, { type: 'start' }, pctx());
  };

  it('configuração: recorte só da franquia escolhida; sem o campo, ou inválido = todas', () => {
    expect(advSettings({ grupo: 'pokemon', recorte: ['III', 'I'] }).recorte).toEqual(['I', 'III']);
    expect(advSettings({ grupo: 'pokemon', recorte: [] })).not.toHaveProperty('recorte');
    expect(advSettings({ grupo: 'lol', recorte: ['I'] })).not.toHaveProperty('recorte');
    expect(advSettings({ grupo: 'pokemon' })).not.toHaveProperty('recorte');
    expect(advSettings({ grupo: 'jojo', recorte: ['Part 4', 'Part 99'] }).recorte).toEqual(['Part 4']);
  });

  it('com recorte: o secreto sai das gerações ligadas (em todas as rodadas) e chute de fora é recusado', () => {
    let s = sala(['II']);
    expect(G(s).recorte).toEqual(['II']);
    const vistos = new Set<string>();
    for (let r = 0; r < 6; r++) {
      expect(POKES[G(s).secreto.name]!.geracao).toBe('II');
      vistos.add(G(s).secreto.name);
      if (r === 0) {
        // Bulbasaur é da geração I: fora do recorte
        expect(R(s, { type: 'chute', id: 'h', rodada: 1, nome: 'Bulbasaur' }, pctx())).toBe(s);
        const dentro = ['Chikorita', 'Cyndaquil', 'Totodile'].find(n => n !== G(s).secreto.name)!;
        s = R(s, { type: 'chute', id: 'h', rodada: 1, nome: dentro }, pctx());
        expect(G(s).chutes).toHaveLength(1);
      }
      s = R(R(s, { type: 'skip' }, pctx()), { type: 'next' }, pctx());
    }
    expect([...vistos].every(n => POKES[n]!.geracao === 'II')).toBe(true);
    // todos recebem o recorte (pro autocompletar), e a visão passa na conferência
    const v = viewFor(s, 'ana', now);
    expect((v.game as AdivinhaView).recorte).toEqual(['II']);
    expect(parseHostMsg({ t: 'state', view: v })).not.toBeNull();
  });

  it('sem recorte: todas as gerações; recorte sem ninguém vira aviso', () => {
    const s = sala();
    expect(G(s).recorte).toBeNull();
    expect(V(s, 'ana').recorte).toBeNull();
    const vazio = sala(['IX']);
    expect(vazio.phase).toBe('lobby');
    expect(vazio.notice).toBe('Nenhum personagem de Pokémon (geração IX) pra adivinhar: ligue mais opções.');
  });

  it('protocolo: host antigo (sem o campo na visão e na configuração) continua valendo', () => {
    const s = sala(['I', 'II']);
    const v = viewFor(s, 'ana', now);
    const semCampo = { ...v, cfg: { ...v.cfg, adivinha: { grupo: 'pokemon', submodo: 'classico', rodadas: 6, tempo: 40 } }, game: { ...(v.game as AdivinhaView) } };
    delete (semCampo.game as Partial<AdivinhaView>).recorte;
    expect(parseHostMsg({ t: 'state', view: semCampo })).not.toBeNull();
    expect(parseHostMsg({ t: 'state', view: { ...v, game: { ...(v.game as AdivinhaView), recorte: [1] } } })).toBeNull();
    expect(parseHostMsg({ t: 'state', view: { ...v, cfg: { ...v.cfg, adivinha: { ...v.cfg.adivinha, recorte: 'I' } } } })).toBeNull();
  });
});
