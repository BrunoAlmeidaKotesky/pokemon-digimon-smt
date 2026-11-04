// Sala online de ponta a ponta no mesmo processo: o anfitrião (o controle de verdade, com os ganchos do
// online/anfitriao.ts) e convidados (online/convidado.ts) ligados por um transporte de mentira. Set de teste e motor
// falso (partida/test-helpers.ts): a luta falsa também é determinística pela semente.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Config } from '../api';
import * as controle from '../controle';
import { CONFIG_PADRAO } from '../controle';
import { jogadorDe } from '../partida';
import { prepararTeste } from '../partida/test-helpers';
import type { Jogador } from '../tipos';
import * as anfitriao from './anfitriao';
import { criarConvidado, type Convidado } from './convidado';
import { TEMPOS_REDE } from './parametros';
import { transporteDeTeste, type TransporteDeTeste } from './test-helpers';
import { espelharLuta } from './visao';

const VERSAO = 'v-teste';
let t: TransporteDeTeste;
let convidados: Convidado[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  const guardado = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => guardado.get(k) ?? null,
    setItem: (k: string, v: string) => { guardado.set(k, v); },
    removeItem: (k: string) => { guardado.delete(k); },
  });
  prepararTeste();
  controle.acoes.abandonar();
  controle.acoes.configurar({ relogio: false, segundos: 30, velocidade: 1, dificuldade: 'facil', nome: 'Bia', avatar: null });
  t = transporteDeTeste();
  convidados = [];
});
afterEach(() => {
  for (const c of convidados) c.sair();
  anfitriao.encerrarSala();
  controle.acoes.abandonar();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const passar = (ms = 100) => vi.advanceTimersByTimeAsync(ms);
const E = controle.estadoAutobatalha;
const partida = () => controle.partidaAtual()!;

async function abrirSala(): Promise<string> {
  await anfitriao.criarSala({ transporte: t, versao: () => VERSAO });
  const on = E().online!;
  expect(on).toMatchObject({ papel: 'anfitriao', situacao: 'na-sala' });
  expect(on.codigo).toMatch(/^[A-Z]{4}$/);
  return on.codigo;
}

async function entrar(codigo: string, nome: string, aparelho: string, versao = VERSAO): Promise<Convidado> {
  const config = (): Config => ({ ...CONFIG_PADRAO, nome });
  const c = criarConvidado({ config, aparelho, transporte: t, versao: () => versao, tempos: TEMPOS_REDE });
  convidados.push(c);
  await c.entrar(codigo);
  await passar();
  return c;
}

const eu = (c: Convidado): Jogador => c.estado().partida!.jogadores.find(j => j.id === c.id())!;

describe('sala online da Autobatalha', () => {
  it('lobby: convidados entram pelo código nos lugares seguintes, com o nome que escolheram; o resto é bot', async () => {
    const codigo = await abrirSala();
    const ana = await entrar(codigo, 'Ana', 'aparelho-ana-1');
    const caio = await entrar(codigo, 'Caio', 'aparelho-caio-1');
    expect([ana.id(), caio.id()]).toEqual(['h2', 'h3']);
    const lugares = E().sala!.lugares;
    expect(lugares.map(l => [l.id, l.nome, l.bot])).toEqual([
      ['h1', 'Bia', false], ['h2', 'Ana', false], ['h3', 'Caio', false],
      ['pyrus', 'Pyrus', true], ['aquos', 'Aquos', true], ['haos', 'Haos', true], ['darkus', 'Darkus', true], ['subterra', 'Subterra', true],
    ]);
    // o convidado vê a mesma sala, com ele marcado e as regras do anfitrião
    const s = ana.estado().sala!;
    expect(s).toMatchObject({ anfitriao: 'h1', voce: 'h2' });
    expect(s.lugares.map(l => l.nome)).toEqual(lugares.map(l => l.nome));
    expect(ana.estado().config.relogio).toBe(false);
    expect(ana.estado().online).toMatchObject({ papel: 'convidado', situacao: 'na-sala', codigo });
    // escolhas do convidado chegam a todos; regras mudam só pelo anfitrião
    ana.escolher({ nome: 'Ana Maria', avatar: null, estilo: 'neve' });
    controle.acoes.mudarRegras({ segundos: 50 });
    await passar();
    expect(caio.estado().sala!.lugares[1]).toMatchObject({ nome: 'Ana Maria', estilo: 'neve' });
    expect(caio.estado().config.segundos).toBe(50);
    // quem sai do lobby libera o lugar
    caio.sair();
    await passar();
    expect(E().sala!.lugares.filter(l => !l.bot).map(l => l.id)).toEqual(['h1', 'h2']);
  });

  it('versão diferente é recusada com aviso pra recarregar', async () => {
    const codigo = await abrirSala();
    const velho = await entrar(codigo, 'Velho', 'aparelho-velho', 'v-antiga');
    expect(velho.estado().online).toMatchObject({ situacao: 'encerrada', versaoDiferente: true });
    expect(velho.estado().online!.aviso).toMatch(/versão diferente/);
    expect(E().sala!.lugares.filter(l => !l.bot)).toHaveLength(1);
  });

  it('partida: cada um vê o próprio Jogador inteiro e o público dos outros; a ação vale só pro dono', async () => {
    const codigo = await abrirSala();
    const ana = await entrar(codigo, 'Ana', 'aparelho-ana-1');
    const caio = await entrar(codigo, 'Caio', 'aparelho-caio-1');
    controle.acoes.novaPartida(77);
    await passar();
    const p = partida();
    expect(p.jogadores.filter(j => !j.bot).map(j => j.id)).toEqual(['h1', 'h2', 'h3']);
    const visao = ana.estado().partida!;
    expect(visao.voce).toBe('h2');
    expect(visao.jogadores.map(j => j.id)).toEqual(p.jogadores.map(j => j.id));
    // o próprio: a loja dele; os outros: sem loja; a partida sem pool nem semente
    expect(eu(ana).loja).toEqual(jogadorDe(p, 'h2').loja);
    expect(eu(ana).loja.length).toBeGreaterThan(0);
    for (const j of visao.jogadores.filter(x => x.id !== 'h2')) {
      expect(j.loja).toEqual([]);
      expect(j.lojaFormas).toBeUndefined();
      expect(j.escolhaPendente).toBeUndefined();
    }
    expect(visao.pool).toEqual({});
    expect(visao.semente).not.toBe(p.semente);
    expect(visao.sorteios).toBeUndefined();

    // compra: só o Jogador de quem mandou muda
    const vaga = eu(ana).loja.findIndex(id => id != null);
    const ouroCaio = jogadorDe(p, 'h3').ouro, ouroBia = jogadorDe(p, 'h1').ouro;
    jogadorDe(p, 'h2').ouro = 10;
    ana.agir({ tipo: 'comprar', i: vaga });
    await passar();
    expect(jogadorDe(partida(), 'h2').ouro).toBeLessThan(10);
    expect(jogadorDe(partida(), 'h3').ouro).toBe(ouroCaio);
    expect(jogadorDe(partida(), 'h1').ouro).toBe(ouroBia);
    expect(eu(ana).ouro).toBe(jogadorDe(partida(), 'h2').ouro);
    // o Caio tenta vender uma unidade da Ana: o anfitrião aplica no Jogador dele, onde ela não existe
    const uidDaAna = Number(Object.keys(jogadorDe(partida(), 'h2').unidades)[0]);
    caio.agir({ tipo: 'vender', uid: uidDaAna });
    await passar();
    expect(jogadorDe(partida(), 'h2').unidades[uidDaAna]).toBeDefined();
    expect(caio.estado().aviso).toBe('Unidade não encontrada');
    // ação fora da fase é ignorada (carrossel no planejamento)
    const antes = JSON.stringify(jogadorDe(partida(), 'h3'));
    caio.agir({ tipo: 'carrossel', i: 0 });
    await passar();
    expect(JSON.stringify(jogadorDe(partida(), 'h3'))).toBe(antes);
  });

  it('voto de pronto de cada um; a luta de cada humano é reproduzida no convidado igual à do anfitrião (lado B espelhado)', async () => {
    const codigo = await abrirSala();
    const ana = await entrar(codigo, 'Ana', 'aparelho-ana-1');
    const caio = await entrar(codigo, 'Caio', 'aparelho-caio-1');
    controle.acoes.novaPartida(78);
    await passar();
    // rodada contra jogadores com a Ana (A) contra o Caio (B)
    const p = partida();
    p.tipo = 'pvp';
    p.confrontos = [['h2', 'h3'], ['h1', 'pyrus'], ['aquos', 'haos'], ['darkus', 'subterra']];
    controle.acoes.votarPronto();
    ana.agir({ tipo: 'pronto' });
    await passar();
    expect(partida().fase).toBe('planejamento');
    expect(caio.estado().votacao).toMatchObject({ total: 8, voce: false });
    expect(caio.estado().votacao!.prontos).toEqual(expect.arrayContaining(['h1', 'h2']));
    caio.agir({ tipo: 'pronto', valor: true });
    await passar();
    // todos votaram: a luta começou pra todos
    expect(partida().fase).toBe('luta');
    const pend = controle.lutaPendente()!;
    const daAna = pend.lutas.find(l => l.a === 'h2')!;
    expect(daAna.b).toBe('h3');
    expect(ana.estado().partida!.fase).toBe('luta');
    const repAna = ana.estado().reproducao!;
    const repCaio = caio.estado().reproducao!;
    expect(repAna.adversario).toBe('h3');
    expect(repCaio.adversario).toBe('h2');
    const semGravacao = <T extends { gravacao?: unknown }>(r: T) => ({ ...r, gravacao: undefined });
    expect(semGravacao(repAna.resultado)).toEqual(semGravacao(daAna.resultado));
    expect(semGravacao(repCaio.resultado)).toEqual(semGravacao(espelharLuta(daAna.resultado)));
    // a rodada espera todos verem: o anfitrião pula, a Ana pula; falta o Caio
    controle.acoes.pularLuta();
    ana.pularLuta();
    await passar();
    expect(partida().fase).toBe('luta');
    caio.pularLuta();
    await passar();
    expect(partida().fase).toBe('resultado');
    expect(caio.estado().partida!.fase).toBe('resultado');
    // o placar da luta bate com a vida que o anfitrião tirou
    const perdeu = daAna.resultado.vencedor === 'a' ? 'h3' : daAna.resultado.vencedor === 'b' ? 'h2' : null;
    if (perdeu) expect(jogadorDe(partida(), perdeu).vida).toBeLessThan(100);
  });

  it('a luta não espera pra sempre: no limite de tempo a rodada segue sem quem não avisou', async () => {
    const codigo = await abrirSala();
    const ana = await entrar(codigo, 'Ana', 'aparelho-ana-1');
    controle.acoes.novaPartida(79);
    await passar();
    controle.acoes.votarPronto();
    ana.agir({ tipo: 'pronto' });
    await passar();
    expect(partida().fase).toBe('luta');
    controle.acoes.pularLuta();
    await passar();
    expect(partida().fase).toBe('luta');
    // a luta falsa dura 10 s: apresentação + 10 s + folga
    await passar(controle.MS_CLASH + 10_000 + controle.MS_FOLGA_LUTA);
    expect(['resultado', 'planejamento']).toContain(partida().fase);
  });

  it('queda: quem cai fica fora do ar, um bot joga e vota por ele, e ele volta pro mesmo lugar', async () => {
    const codigo = await abrirSala();
    const ana = await entrar(codigo, 'Ana', 'aparelho-ana-1');
    const caio = await entrar(codigo, 'Caio', 'aparelho-caio-1');
    controle.acoes.novaPartida(80);
    await passar();
    // a Ana fecha a página
    ana.sair();
    await passar();
    expect(jogadorDe(partida(), 'h2').ausente).toBe(true);
    expect(jogadorDe(partida(), 'h2').pronto).toBe(true);
    await passar();
    expect(caio.estado().partida!.jogadores.find(j => j.id === 'h2')!.ausente).toBe(true);
    // a rodada anda só com os presentes (a luta da Ana não é esperada)
    controle.acoes.votarPronto();
    caio.agir({ tipo: 'pronto' });
    await passar();
    expect(partida().fase).toBe('luta');
    controle.acoes.pularLuta();
    caio.pularLuta();
    await passar(controle.MS_RESULTADO + 100);
    expect(partida().fase).toBe('planejamento');
    expect([partida().estagio, partida().rodada]).toEqual([1, 2]);
    // um bot jogou o planejamento por ela (escolheu os traços que monta) e votou
    const ana2 = jogadorDe(partida(), 'h2');
    expect(ana2.alvos?.length).toBeGreaterThan(0);
    expect(ana2.pronto).toBe(true);
    // volta pelo mesmo aparelho: o mesmo lugar, presente de novo, sem o voto do bot
    const volta = await entrar(codigo, 'Ana', 'aparelho-ana-1');
    expect(volta.id()).toBe('h2');
    expect(jogadorDe(partida(), 'h2').ausente).toBeUndefined();
    expect(jogadorDe(partida(), 'h2').pronto).toBeUndefined();
    expect(volta.estado().partida!.voce).toBe('h2');
    expect([volta.estado().partida!.estagio, volta.estado().partida!.rodada]).toEqual([1, 2]);
  });

  it('a conexão cai sozinha: o convidado reconecta e recupera o lugar', async () => {
    const codigo = await abrirSala();
    const ana = await entrar(codigo, 'Ana', 'aparelho-ana-1');
    controle.acoes.novaPartida(81);
    await passar();
    t.derrubar(t.conexoes[0]!);
    await passar(0);
    expect(jogadorDe(partida(), 'h2').ausente).toBe(true);
    expect(ana.estado().online!.situacao).toBe('reconectando');
    await passar(300);
    expect(ana.estado().online!.situacao).toBe('na-sala');
    expect(ana.id()).toBe('h2');
    expect(jogadorDe(partida(), 'h2').ausente).toBeUndefined();
  });

  it('aparelho novo no meio da partida volta pro lugar de quem caiu com o mesmo nome; desconhecido é recusado', async () => {
    const codigo = await abrirSala();
    const ana = await entrar(codigo, 'Ana', 'aparelho-ana-1');
    controle.acoes.novaPartida(82);
    await passar();
    ana.sair();
    await passar();
    const outro = await entrar(codigo, 'Zé', 'aparelho-ze-123');
    expect(outro.estado().online).toMatchObject({ situacao: 'encerrada' });
    expect(outro.estado().online!.aviso).toMatch(/já começou/);
    const celular = await entrar(codigo, 'ana', 'aparelho-ana-celular');
    expect(celular.id()).toBe('h2');
    expect(jogadorDe(partida(), 'h2').ausente).toBeUndefined();
  });

  it('o anfitrião tira alguém: no lobby o lugar some; na partida um bot fica no lugar e ele não volta', async () => {
    const codigo = await abrirSala();
    const ana = await entrar(codigo, 'Ana', 'aparelho-ana-1');
    const caio = await entrar(codigo, 'Caio', 'aparelho-caio-1');
    anfitriao.expulsar('h3');
    await passar(500);
    expect(caio.estado().online!.aviso).toMatch(/tirou você/);
    expect(E().sala!.lugares.filter(l => !l.bot).map(l => l.id)).toEqual(['h1', 'h2']);
    const denovo = await entrar(codigo, 'Caio', 'aparelho-caio-1');
    expect(denovo.estado().online!.situacao).toBe('encerrada');
    controle.acoes.novaPartida(83);
    await passar();
    anfitriao.expulsar('h2');
    await passar(500);
    expect(ana.estado().online!.situacao).toBe('encerrada');
    expect(jogadorDe(partida(), 'h2').ausente).toBe(true);
  });

  it('o anfitrião fecha a sala: todos veem o aviso e ele volta pro solo', async () => {
    const codigo = await abrirSala();
    const ana = await entrar(codigo, 'Ana', 'aparelho-ana-1');
    controle.acoes.novaPartida(84);
    await passar();
    anfitriao.encerrarSala();
    await passar(300);
    expect(ana.estado().online).toMatchObject({ situacao: 'encerrada', aviso: 'O anfitrião fechou a sala.' });
    expect(E().online).toBeNull();
    expect(E().partida).toBeNull();
    expect(E().sala!.lugares.filter(l => !l.bot)).toHaveLength(1);
  });

  it('anfitrião que some sem avisar: o convidado tenta voltar e mostra que a sala acabou', async () => {
    const codigo = await abrirSala();
    const ana = await entrar(codigo, 'Ana', 'aparelho-ana-1');
    t.sumirAnfitriao('ab-' + codigo);
    await passar(500);
    expect(ana.estado().online).toMatchObject({ situacao: 'encerrada' });
    expect(ana.estado().online!.aviso).toMatch(/A sala acabou/);
  });

  it('relógio e carrossel: o convidado conta o mesmo tempo que o anfitrião e pega na vez dele', async () => {
    controle.acoes.configurar({ relogio: true, segundos: 30 });
    const codigo = await abrirSala();
    const ana = await entrar(codigo, 'Ana', 'aparelho-ana-1');
    controle.acoes.novaPartida(87);
    await passar();
    expect(E().relogio).toBe(20); // estágio 1: 2/3 de 30 s
    expect(ana.estado().relogio).toBe(20);
    await passar(7000);
    expect(Math.abs(ana.estado().relogio! - E().relogio!)).toBeLessThanOrEqual(1);
    // última rodada do estágio 1: depois dela vem o carrossel
    partida().rodada = 3;
    controle.acoes.votarPronto();
    ana.agir({ tipo: 'pronto' });
    await passar();
    controle.acoes.pularLuta();
    ana.pularLuta();
    await passar(controle.MS_RESULTADO + 100);
    expect(partida().fase).toBe('carrossel');
    const c = ana.estado().carrossel!;
    expect(c.opcoes).toHaveLength(9);
    expect(ana.estado().relogio).toBeNull();
    const k = c.grupos.findIndex(g => g.includes('h2'));
    await passar(c.horarios[k]! * 1000 + 400);
    expect(Math.abs(ana.estado().carrossel!.tempo - E().carrossel!.tempo)).toBeLessThan(0.5);
    expect(ana.estado().carrossel!.podePegar).toBe(true);
    const i = ana.estado().carrossel!.opcoes.findIndex(o => o.pegou == null);
    ana.agir({ tipo: 'carrossel', i });
    await passar();
    expect(partida().carrossel!.opcoes[i]!.pegou).toBe('h2');
    expect(ana.estado().carrossel!.opcoes[i]!.pegou).toBe('h2');
    expect(ana.estado().carrossel!.podePegar).toBe(false);
  });

  it('partida online não fica salva e não apaga a solo', async () => {
    controle.acoes.novaPartida(85);
    const salva = localStorage.getItem('pdx-autobatalha-v1');
    expect(salva).toBeTruthy();
    controle.acoes.abandonar();
    localStorage.setItem('pdx-autobatalha-v1', salva!);
    const codigo = await abrirSala();
    await entrar(codigo, 'Ana', 'aparelho-ana-1');
    controle.acoes.novaPartida(86);
    await passar();
    controle.acoes.abandonar();
    expect(localStorage.getItem('pdx-autobatalha-v1')).toBe(salva);
  });
});
