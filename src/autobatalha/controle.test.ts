import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { acoes, CHAVE_CONFIG, CONFIG_PADRAO, estadoAutobatalha, MS_CLASH, MS_RESULTADO, normalizarConfig, S_FECHAR_CARROSSEL } from './controle';
import { ehEstilo, ESTILO_PADRAO } from './estilos';
import { S } from './dados';
import { CHAVE_PARTIDA, definirMotor, horarioDoGrupo, humano, MAX_NOME, S_DEPOIS_DA_ULTIMA } from './partida';
import { lutaGanha, prepararTeste } from './partida/test-helpers';

let guardado: Map<string, string>;

beforeEach(() => {
  vi.useFakeTimers();
  guardado = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => guardado.get(k) ?? null,
    setItem: (k: string, v: string) => { guardado.set(k, v); },
    removeItem: (k: string) => { guardado.delete(k); },
  });
  prepararTeste();
  acoes.abandonar();
  acoes.configurar({ relogio: true, segundos: 30, velocidade: 1, dificuldade: 'facil', nome: '', avatar: null, estilo: ESTILO_PADRAO });
});
afterEach(() => {
  acoes.abandonar();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const E = estadoAutobatalha;

describe('controle', () => {
  it('ciclo: planejamento com relógio → luta reproduzida → resultado → próximo planejamento', () => {
    acoes.novaPartida(5);
    let e = E();
    expect(e.partida?.fase).toBe('planejamento');
    expect(e.relogio).toBe(20); // estágio 1: 2/3 de 30 s
    expect(e.temSalva).toBe(true);
    expect(guardado.has(CHAVE_PARTIDA)).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(E().relogio).toBe(15);
    vi.advanceTimersByTime(15000);
    e = E();
    expect(e.partida?.fase).toBe('luta');
    expect(e.reproducao?.adversario).toBe('monstros');
    expect(e.reproducao?.resultado.gravacao).toBeDefined();
    expect(e.relogio).toBeNull();
    // primeiro a apresentação dos dois lados (clash): o tempo da luta não corre
    expect(e.reproducao?.comecou).toBe(false);
    vi.advanceTimersByTime(MS_CLASH - 100);
    expect(E().reproducao!.t).toBe(0);
    expect(E().reproducao!.comecou).toBe(false);
    vi.advanceTimersByTime(100);
    expect(E().reproducao!.comecou).toBe(true);
    vi.advanceTimersByTime(4000);
    expect(E().reproducao!.t).toBeGreaterThan(3.5);
    acoes.velocidade(4);
    vi.advanceTimersByTime(1600);
    expect(E().reproducao!.t).toBeGreaterThan(9);
    vi.advanceTimersByTime(400);
    e = E();
    expect(e.partida?.fase).toBe('resultado');
    expect(e.reproducao?.acabou).toBe(true);
    vi.advanceTimersByTime(MS_RESULTADO);
    e = E();
    expect(e.partida?.fase).toBe('planejamento');
    expect([e.partida?.estagio, e.partida?.rodada]).toEqual([1, 2]);
    expect(e.reproducao).toBeNull();
    expect(e.config.velocidade).toBe(4);
  });

  it('a partida muda de referência a cada ação; avisos somem sozinhos', () => {
    acoes.novaPartida(6);
    const antes = E().partida;
    acoes.atualizarLoja(); // 1 de ouro: não dá
    expect(E().aviso).toBe('Ouro insuficiente');
    expect(E().partida).not.toBe(antes);
    vi.advanceTimersByTime(3000);
    expect(E().aviso).toBeNull();
  });

  it('pronto, pular luta e sem relógio', () => {
    acoes.configurar({ relogio: false });
    acoes.novaPartida(7);
    expect(E().relogio).toBeNull();
    vi.advanceTimersByTime(120000);
    expect(E().partida?.fase).toBe('planejamento');
    acoes.pronto();
    expect(E().partida?.fase).toBe('luta');
    acoes.pularLuta();
    expect(E().partida?.fase).toBe('resultado');
    vi.advanceTimersByTime(MS_RESULTADO);
    expect(E().partida?.rodada).toBe(2);
  });

  /** joga as 3 rodadas do estágio 1 (sem relógio) e para no carrossel do estágio 2 */
  function ateOCarrossel(semente: number) {
    acoes.configurar({ relogio: false });
    acoes.novaPartida(semente);
    for (let r = 0; r < 3; r++) { acoes.pronto(); acoes.pularLuta(); vi.advanceTimersByTime(MS_RESULTADO); }
    const e = E();
    expect([e.partida?.estagio, e.partida?.rodada, e.partida?.fase]).toEqual([2, 1, 'carrossel']);
    return e.carrossel!;
  }

  it('carrossel no começo do estágio 2: duplas no tempo, o humano pega quando liberado e fecha antes se todos pegaram', () => {
    const c = ateOCarrossel(8);
    expect(c.opcoes).toHaveLength(9);
    expect(c.liberados).toBe(0);
    expect(c.podePegar).toBe(false);
    expect(c.horarios).toEqual(c.grupos.map((_, k) => horarioDoGrupo(k)));
    expect(c.fim).toBe(c.horarios.at(-1)! + S_DEPOIS_DA_ULTIMA);
    expect(E().relogio).toBeNull();
    const salvaAntes = guardado.get(CHAVE_PARTIDA);
    const itensAntes = humano(E().partida!).itens.length; // os monstros do estágio 1 podem ter dado componentes
    // antes da vez: não dá
    acoes.pegarCarrossel(0);
    expect(E().aviso).toMatch(/Espere/);
    expect(E().carrossel!.opcoes[0]!.pegou).toBeNull();
    // a dupla do humano é liberada no horário dela (as anteriores já pegaram)
    const k = c.grupos.findIndex(g => g.includes('voce'));
    let t = c.horarios[k]! * 1000 + 300;
    vi.advanceTimersByTime(t);
    let e = E();
    expect(e.carrossel!.liberados).toBe(k + 1);
    expect(e.carrossel!.tempo).toBeGreaterThan(c.horarios[k]!);
    expect(e.carrossel!.podePegar).toBe(true);
    expect(e.carrossel!.opcoes.filter(o => o.pegou != null && o.pegou !== 'voce').length).toBeGreaterThanOrEqual(2 * k);
    const i = e.carrossel!.opcoes.findIndex(o => o.pegou == null);
    const opcao = e.carrossel!.opcoes[i]!;
    acoes.pegarCarrossel(i);
    e = E();
    expect(e.carrossel!.opcoes[i]!.pegou).toBe('voce');
    expect(e.carrossel!.podePegar).toBe(false);
    const eu = humano(e.partida!);
    expect(eu.itens).toHaveLength(itensAntes + 1);
    expect(eu.itens.at(-1)).toBe(opcao.item);
    expect(Object.values(eu.unidades).some(u => u.campeao === opcao.campeao)).toBe(true);
    // a última dupla pega na hora; todos pegaram: fecha ~1,5 s depois, antes do fim do tempo
    const ultima = c.horarios.at(-1)! * 1000;
    vi.advanceTimersByTime(Math.max(0, ultima - t) + S_FECHAR_CARROSSEL * 1000 + 500);
    t = Math.max(t, ultima) + S_FECHAR_CARROSSEL * 1000 + 500;
    expect(t).toBeLessThan(c.fim * 1000);
    e = E();
    expect(e.partida?.fase).toBe('planejamento');
    expect(e.carrossel).toBeNull();
    expect(e.partida?.carrossel).toBeUndefined();
    // os bots jogaram o planejamento e a partida foi salva de novo, sem o carrossel
    const salva = guardado.get(CHAVE_PARTIDA)!;
    expect(salva).not.toBe(salvaAntes);
    expect(JSON.parse(salva)).toMatchObject({ estagio: 2, rodada: 1, fase: 'planejamento' });
    expect(salva).not.toContain('"carrossel"');
  });

  it('carrossel sem o humano pegar: no fim ele leva uma ao acaso', () => {
    const c = ateOCarrossel(12);
    const itensAntes = humano(E().partida!).itens.length;
    vi.advanceTimersByTime(c.fim * 1000 - 500);
    expect(E().partida?.fase).toBe('carrossel');
    expect(E().carrossel!.liberados).toBe(c.grupos.length);
    vi.advanceTimersByTime(800);
    const e = E();
    expect(e.partida?.fase).toBe('planejamento');
    expect(humano(e.partida!).itens).toHaveLength(itensAntes + 1);
    expect(e.aviso).toMatch(/do carrossel ao acaso/);
  });

  it('no carrossel dá pra mexer na loja, mas não no tabuleiro; pegar fora do carrossel não faz nada', () => {
    acoes.configurar({ relogio: false });
    acoes.novaPartida(13);
    acoes.pegarCarrossel(0); // planejamento: não faz nada
    expect(E().aviso).toBeNull();
    for (let r = 0; r < 3; r++) { acoes.pronto(); acoes.pularLuta(); vi.advanceTimersByTime(MS_RESULTADO); }
    expect(E().partida?.fase).toBe('carrossel');
    const ouro = humano(E().partida!).ouro;
    acoes.atualizarLoja();
    expect(humano(E().partida!).ouro).toBe(ouro - 2);
    const uid = Number(Object.values(humano(E().partida!).tabuleiro)[0]);
    acoes.mover(uid, { tipo: 'banco', i: 8 });
    expect(E().aviso).toMatch(/só muda no planejamento/);
    acoes.pronto(); // não termina nada fora do planejamento
    expect(E().partida?.fase).toBe('carrossel');
  });

  it('continuar carrega a salva; abandonar apaga', () => {
    acoes.novaPartida(9);
    const salva = JSON.parse(guardado.get(CHAVE_PARTIDA)!) as unknown;
    acoes.pronto(); acoes.pularLuta(); vi.advanceTimersByTime(MS_RESULTADO);
    expect(E().partida?.rodada).toBe(2);
    guardado.set(CHAVE_PARTIDA, JSON.stringify(salva));
    acoes.continuar();
    expect(E().partida).toEqual(salva);
    expect(E().partida?.fase).toBe('planejamento');
    expect(E().relogio).toBe(20);
    acoes.abandonar();
    expect(E().partida).toBeNull();
    expect(E().temSalva).toBe(false);
    expect(guardado.has(CHAVE_PARTIDA)).toBe(false);
  });

  it('humano eliminado: o resto corre sem mostrar e vai pro fim', () => {
    acoes.configurar({ relogio: false });
    acoes.novaPartida(10);
    definirMotor({ simularLuta: lutaGanha('b') });
    const p = E().partida!;
    p.estagio = 2; p.rodada = 7; p.tipo = 'monstros';
    humano(p).vida = 1;
    acoes.pronto();
    acoes.pularLuta();
    expect(humano(E().partida!).colocacao).toBe(8);
    vi.advanceTimersByTime(MS_RESULTADO);
    const e = E();
    expect(e.partida?.fase).toBe('fim');
    expect(e.partida?.jogadores.map(j => j.colocacao).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(e.temSalva).toBe(false);
  });

  it('pular durante a apresentação (clash) termina a luta', () => {
    acoes.configurar({ relogio: false });
    acoes.novaPartida(14);
    acoes.pronto();
    expect(E().reproducao?.comecou).toBe(false);
    acoes.pularLuta();
    expect(E().partida?.fase).toBe('resultado');
    expect(E().reproducao).toMatchObject({ comecou: true, acabou: true });
    vi.advanceTimersByTime(MS_RESULTADO);
    expect(E().partida?.rodada).toBe(2);
  });

  it('juntar dois componentes soltos e recolher a moeda do chão', () => {
    acoes.novaPartida(15);
    const p = E().partida!;
    humano(p).itens = ['pyrus', 'aurelus', 'haos+darkus'];
    humano(p).moedas = [{ casa: { col: 2, lin: 1 }, valor: 2 }];
    acoes.juntarItens(1, 0);
    expect(humano(E().partida!).itens).toEqual(['pyrus+aurelus', 'haos+darkus']);
    acoes.juntarItens(0, 1);
    expect(E().aviso).toMatch(/dois componentes/);
    const ouro = humano(E().partida!).ouro;
    acoes.pegarMoeda(0);
    expect(humano(E().partida!).ouro).toBe(ouro + 2);
    expect(humano(E().partida!).moedas ?? []).toHaveLength(0);
    acoes.pegarMoeda(0); // já recolhida: nada muda
    expect(humano(E().partida!).ouro).toBe(ouro + 2);
  });

  it('olhar outro jogador', () => {
    acoes.novaPartida(11);
    acoes.olhar('pyrus');
    expect(E().olhando).toBe('pyrus');
    acoes.olhar(null);
    expect(E().olhando).toBeNull();
  });
});

describe('configuração salva (pdx-autobatalha-config)', () => {
  it('config antiga, sem os campos da sala e do jogador: ganha os padrões e mantém o resto', () => {
    expect(normalizarConfig({ relogio: false, segundos: 50, velocidade: 2, dificuldade: 'normal', volume: 0.3 })).toEqual({
      relogio: false, segundos: 50, dificuldade: 'normal', nome: '', avatar: null, estilo: ESTILO_PADRAO, velocidade: 2, volume: 0.3,
    });
    for (const lixo of [null, undefined, 'texto', 42, []]) expect(normalizarConfig(lixo)).toEqual(CONFIG_PADRAO);
  });

  it('campos novos: os válidos ficam, os errados voltam pro padrão', () => {
    expect(normalizarConfig({ nome: '  Ana   Bia  ', avatar: 'pokemon:Squirtle', estilo: 'noite' })).toMatchObject({
      nome: 'Ana Bia', avatar: 'pokemon:Squirtle', estilo: 'noite',
    });
    expect(normalizarConfig({ nome: 7, avatar: 3, estilo: 'lava' })).toMatchObject({ nome: '', avatar: null, estilo: ESTILO_PADRAO });
    expect(normalizarConfig({ nome: 'x'.repeat(40), avatar: '' }).nome).toHaveLength(MAX_NOME);
    expect(normalizarConfig({ avatar: '' }).avatar).toBeNull();
    // o resto continua sendo conferido como antes
    expect(normalizarConfig({ segundos: 9999, velocidade: 3, volume: -1, dificuldade: 'impossivel' })).toMatchObject({
      segundos: 300, velocidade: 1, volume: 0, dificuldade: 'facil',
    });
  });

  it('escolhas do jogador e regras da sala vão pra mesma chave, normalizadas', () => {
    acoes.escolher({ nome: ' Bruno ', avatar: 'pokemon:Squirtle', estilo: 'deserto' });
    acoes.mudarRegras({ dificuldade: 'dificil', segundos: 60 });
    const salvo = JSON.parse(guardado.get(CHAVE_CONFIG)!) as Record<string, unknown>;
    expect(salvo).toMatchObject({ nome: 'Bruno', avatar: 'pokemon:Squirtle', estilo: 'deserto', dificuldade: 'dificil', segundos: 60, relogio: true });
    expect(E().config).toMatchObject({ nome: 'Bruno', estilo: 'deserto', dificuldade: 'dificil' });
  });
});

describe('sala (lobby)', () => {
  it('8 lugares: você é o anfitrião, os bots têm ícone e estilo válidos; muda com as suas escolhas', () => {
    const sala = E().sala!;
    expect(sala.anfitriao).toBe(sala.voce);
    expect(sala.lugares).toHaveLength(8);
    expect(sala.lugares[0]).toMatchObject({ id: sala.voce, nome: 'Você', bot: false, anfitriao: true, estilo: ESTILO_PADRAO });
    for (const l of sala.lugares.slice(1)) {
      expect(l.bot).toBe(true);
      expect(l.anfitriao).toBe(false);
      expect(l.avatar).toBeTruthy();
      expect(ehEstilo(l.estilo)).toBe(true);
    }
    acoes.escolher({ nome: 'Ana', avatar: 'pokemon:Squirtle', estilo: 'vulcao' });
    const nova = E().sala!;
    expect(nova.semente).toBe(sala.semente);
    expect(nova.lugares[0]).toMatchObject({ nome: 'Ana', avatar: S().forma('pokemon:Squirtle').img, estilo: 'vulcao' });
    expect(nova.lugares.slice(1)).toEqual(sala.lugares.slice(1));
  });

  it('começar sem semente usa a da sala: a partida tem os jogadores que o lobby mostrou; depois a sala troca', () => {
    acoes.escolher({ nome: 'Ana', avatar: 'pokemon:Squirtle', estilo: 'oceano' });
    acoes.mudarRegras({ relogio: false, dificuldade: 'normal' });
    const sala = E().sala!;
    acoes.novaPartida();
    const p = E().partida!;
    expect(p.semente).toBe(sala.semente);
    expect(p.dificuldade).toBe('normal');
    expect(p.jogadores.map(j => [j.id, j.nome, j.avatar, j.estilo])).toEqual(sala.lugares.map(l => [l.id, l.nome, l.avatar, l.estilo]));
    expect(E().sala!.semente).not.toBe(sala.semente);
  });
});
