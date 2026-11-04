// Convidado da Autobatalha online: a tela de quem entrou pelo link. Não roda a partida: recebe do anfitrião a sala, a
// visão da partida (online/visao.ts, só as partes que mudaram) e o tempo da fase, monta o EstadoTela e manda as ações.
// O que corre aqui: a contagem do relógio e do carrossel (a partir do tempo que o anfitrião mandou) e a reprodução da
// luta, simulada neste navegador com o mesmo motor (mesma entrada e semente = a luta que o anfitrião calculou); no
// fim dela avisa que viu. A conexão se mantém com ping e, se cair, tenta voltar sozinha (o anfitrião devolve o mesmo
// lugar pela senha do aparelho; enquanto isso um bot joga por você).
import type { Config, EstadoOnline, EstadoTela, RegrasSala } from '../api';
import { MS_CLASH, MS_TICK_LUTA, escolhasDe } from '../controle';
import { estadoDaVotacao, estadoDoCarrossel } from '../derivados';
import type { AcaoJogador, EscolhasJogador, Partida, ResultadoLuta } from '../tipos';
import { linkDaSala, PREFIXO_TRANSPORTE, TEMPOS_REDE, type TemposRede } from './parametros';
import { daRede, lerMsgAnfitriao, MAX_MSG_ANFITRIAO, paraRede, type LutaVista, type MsgAnfitriao, type MsgConvidado } from './protocolo';
import { ehErroDeRede, textoDoErro, transporteDaPagina, TransportError, type Link, type Transport } from './rede';
import { versaoDoJogo } from './versao';
import { juntarVisao, reproduzirLuta } from './visao';

const MS_AVISO = 2500;
/** tick da contagem do relógio e do carrossel */
const MS_TICK_TELA = 200;

export interface OpcoesConvidado {
  /** a configuração local: as suas escolhas e preferências (as regras vêm do anfitrião) */
  config: () => Config;
  /** senha deste aparelho */
  aparelho: string;
  transporte?: Transport;
  tempos?: TemposRede;
  versao?: () => string;
  /** reproduz a luta (padrão: o motor ligado na partida, online/visao.ts) */
  reproduzir?: (l: LutaVista) => ResultadoLuta;
}

export interface Convidado {
  estado(): EstadoTela;
  assinar(l: () => void): () => void;
  /** entra na sala do código (e fica tentando voltar se cair) */
  entrar(codigo: string): Promise<void>;
  /** sai da sala (avisa o anfitrião) e para tudo */
  sair(): void;
  agir(a: AcaoJogador): void;
  escolher(e: EscolhasJogador): void;
  /** a configuração local mudou (velocidade, volume, escolhas) */
  configMudou(): void;
  olhar(id: string | null): void;
  pularLuta(): void;
  /** o id do lugar deste convidado (null antes de entrar) */
  id(): string | null;
}

export function criarConvidado(o: OpcoesConvidado): Convidado {
  const tempos = o.tempos ?? TEMPOS_REDE;
  const versao = o.versao ?? versaoDoJogo;
  const reproduzir = o.reproduzir ?? reproduzirLuta;
  const ouvintes = new Set<() => void>();

  let estado: EstadoTela = {
    carregando: false, erro: null, partida: null, relogio: null, reproducao: null, config: o.config(), sala: null, temSalva: false,
    carrossel: null, votacao: null, olhando: null, aviso: null,
    online: { papel: 'convidado', codigo: '', link: '', situacao: 'conectando', aviso: '' },
  };
  let link: Link | null = null;
  let codigo = '';
  let meuId: string | null = null;
  let regras: RegrasSala | null = null;
  let saindo = false;
  let tentando = false;
  let ultimaMsg = 0;
  /** fim do planejamento no relógio daqui (Date.now) */
  let prazo: number | null = null;
  /** carrossel: tempo e fim mandados, e quando chegou */
  let carrossel: { tempo: number; fim: number; em: number } | null = null;
  /** luta sendo mostrada (chave da rodada) e se já avisou que viu */
  let luta: { chave: string; avisou: boolean } | null = null;
  let timerTela: ReturnType<typeof setInterval> | null = null;
  let timerPing: ReturnType<typeof setInterval> | null = null;
  let timerClash: ReturnType<typeof setTimeout> | null = null;
  let timerLuta: ReturnType<typeof setInterval> | null = null;
  let timerAviso: ReturnType<typeof setTimeout> | null = null;
  let ultimoTick = 0;

  const emitir = (): void => { ouvintes.forEach(l => l()); };

  function tempoDoCarrossel(): number {
    if (!carrossel) return 0;
    return Math.min(carrossel.fim, carrossel.tempo + (Date.now() - carrossel.em) / 1000);
  }
  const relogioAgora = (): number | null => (prazo == null ? null : Math.max(0, Math.ceil((prazo - Date.now()) / 1000)));

  /** Refaz as partes derivadas e avisa a tela. */
  function montar(m: Partial<EstadoTela> = {}): void {
    const p = 'partida' in m ? m.partida ?? null : estado.partida;
    estado = {
      ...estado, ...m, partida: p,
      config: { ...o.config(), ...(regras ?? {}) },
      relogio: p?.fase === 'planejamento' ? relogioAgora() : null,
      carrossel: estadoDoCarrossel(p, tempoDoCarrossel(), carrossel?.fim ?? 0),
      votacao: estadoDaVotacao(p),
    };
    emitir();
  }
  function mudarOnline(m: Partial<EstadoOnline>): void {
    const atual = estado.online ?? { papel: 'convidado' as const, codigo, link: linkDaSala(codigo), situacao: 'conectando' as const, aviso: '' };
    montar({ online: { ...atual, ...m } });
  }

  function enviar(m: MsgConvidado): void {
    if (!link) return;
    try { link.send(paraRede(m)); } catch { /* caiu */ }
  }

  function avisar(texto: string): void {
    if (timerAviso) clearTimeout(timerAviso);
    timerAviso = setTimeout(() => { timerAviso = null; if (estado.aviso === texto) montar({ aviso: null }); }, MS_AVISO);
    montar({ aviso: texto });
  }

  // ---------- contagem do relógio e do carrossel ----------

  function ligarTela(): void {
    const precisa = prazo != null || carrossel != null;
    if (precisa && !timerTela) timerTela = setInterval(() => montar(), MS_TICK_TELA);
    if (!precisa && timerTela) { clearInterval(timerTela); timerTela = null; }
  }

  // ---------- luta ----------

  function pararLuta(): void {
    if (timerClash) clearTimeout(timerClash);
    if (timerLuta) clearInterval(timerLuta);
    timerClash = null; timerLuta = null;
  }
  /** Terminou de ver (fim ou pulou): avisa o anfitrião uma vez. */
  function fimDaLuta(): void {
    pararLuta();
    const r = estado.reproducao;
    if (r && !r.acabou) montar({ reproducao: { ...r, t: r.resultado.duracao, comecou: true, acabou: true } });
    if (luta && !luta.avisou) {
      luta.avisou = true;
      enviar({ t: 'viu', luta: luta.chave });
    }
  }
  function tickLuta(): void {
    const r = estado.reproducao;
    if (!r || r.acabou) { pararLuta(); return; }
    const agora = Date.now();
    const t = r.t + ((agora - ultimoTick) / 1000) * estado.config.velocidade;
    ultimoTick = agora;
    if (t >= r.resultado.duracao) { fimDaLuta(); return; }
    montar({ reproducao: { ...r, t } });
  }
  function mostrarLuta(l: LutaVista): void {
    if (luta?.chave === l.chave && estado.reproducao) return;
    pararLuta();
    luta = { chave: l.chave, avisou: false };
    let resultado: ResultadoLuta;
    try { resultado = reproduzir(l); } catch {
      // não deu pra simular aqui (versão diferente?): segue sem mostrar
      avisar('Não deu pra mostrar a sua luta nesta página.');
      fimDaLuta();
      return;
    }
    montar({ reproducao: { resultado, adversario: l.adversario, t: 0, comecou: false, acabou: false }, olhando: null });
    timerClash = setTimeout(() => {
      timerClash = null;
      const r = estado.reproducao;
      if (!r || r.acabou) return;
      montar({ reproducao: { ...r, comecou: true } });
      ultimoTick = Date.now();
      timerLuta = setInterval(tickLuta, MS_TICK_LUTA);
    }, MS_CLASH);
  }

  // ---------- mensagens do anfitrião ----------

  function novaPartida(antes: Partida | null, p: Partida | null): void {
    // fora da luta, a reprodução some (a próxima rodada começou); no resultado, termina se ainda corria
    if (!p || p.fase === 'planejamento' || p.fase === 'carrossel' || p.fase === 'fim') {
      if (estado.reproducao) { pararLuta(); estado = { ...estado, reproducao: null }; }
      if (!p || p.fase !== 'fim') luta = null;
    } else if (p.fase === 'resultado' && estado.reproducao && !estado.reproducao.acabou) fimDaLuta();
    if (antes && p && antes.semente !== p.semente) estado = { ...estado, olhando: null };
  }

  function tratar(m: MsgAnfitriao): void {
    switch (m.t) {
      case 'bemvindo':
        meuId = m.id;
        mudarOnline({ situacao: 'na-sala', aviso: '', versaoDiferente: m.versao !== versao() });
        break;
      case 'recusado': encerrar(m.motivo, m.versao); break;
      case 'sala':
        regras = m.sala.regras;
        montar({ sala: { semente: 0, anfitriao: m.sala.anfitriao, voce: m.sala.voce, lugares: m.sala.lugares } });
        break;
      case 'estado': {
        const antes = estado.partida;
        const p = m.partida ? juntarVisao(antes, m.partida.base, m.partida.ids, m.partida.jogadores) : null;
        if (m.partida && !p) return; // parte sem a base de antes: espera a próxima completa
        prazo = m.tempo.relogioMs != null ? Date.now() + m.tempo.relogioMs : null;
        carrossel = m.tempo.carrossel ? { ...m.tempo.carrossel, em: Date.now() } : null;
        novaPartida(antes, p);
        ligarTela();
        montar({ partida: p });
        break;
      }
      case 'luta': mostrarLuta(m.luta); break;
      case 'aviso': avisar(m.texto); break;
      case 'expulso': encerrar('O anfitrião tirou você da sala.'); break;
      case 'encerrada': encerrar(m.motivo); break;
      case 'substituido': encerrar('Você entrou nesta sala por outra aba ou aparelho, então esta aba saiu da sala.'); break;
      case 'ping': break;
    }
  }

  // ---------- conexão ----------

  async function conectar(): Promise<void> {
    const l = await (o.transporte ?? transporteDaPagina()).join(PREFIXO_TRANSPORTE + codigo);
    if (saindo) { l.close(); return; }
    link = l;
    ultimaMsg = Date.now();
    l.onMessage(raw => {
      if (link !== l) return;
      const m = lerMsgAnfitriao(daRede(raw, MAX_MSG_ANFITRIAO));
      if (!m) return;
      ultimaMsg = Date.now();
      tratar(m);
    });
    l.onClose(() => {
      if (link !== l) return;
      link = null;
      if (!saindo) void perdeu();
    });
    enviar({ t: 'ola', aparelho: o.aparelho, versao: versao(), escolhas: escolhasDe(o.config()) });
  }

  async function perdeu(): Promise<void> {
    if (tentando || saindo) return;
    tentando = true;
    mudarOnline({ situacao: 'reconectando', aviso: 'A conexão com o anfitrião caiu. Tentando reconectar…' });
    let ultimo: unknown = null;
    for (let i = 0; i < tempos.tentativas && !saindo && !link; i++) {
      await new Promise(r => setTimeout(r, i ? tempos.espera : 100));
      if (saindo || link) break;
      try { await conectar(); break; } catch (e) {
        if (e instanceof TransportError && e.kind === 'sala-nao-existe') {
          tentando = false;
          encerrar('A sala acabou: o anfitrião saiu ou fechou a página.');
          return;
        }
        ultimo = e;
      }
    }
    tentando = false;
    if (!link && !saindo) {
      encerrar('Não consegui reconectar. ' + (ehErroDeRede(ultimo) ? textoDoErro(ultimo, codigo) : 'O anfitrião pode ter saído ou a internet caiu.'));
    }
  }

  function aoVoltarPraPagina(): void {
    if (document.visibilityState === 'visible' && !link && !saindo && estado.online?.situacao !== 'encerrada') void perdeu();
  }

  /** Para tudo e mostra o motivo (a tela oferece voltar pro solo). */
  function encerrar(motivo: string, versaoDiferente = false): void {
    saindo = true;
    const l = link;
    link = null;
    l?.close();
    pararLuta();
    for (const t of [timerTela, timerPing]) if (t) clearInterval(t);
    timerTela = null; timerPing = null;
    prazo = null; carrossel = null;
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', aoVoltarPraPagina);
    mudarOnline({ situacao: 'encerrada', aviso: motivo, versaoDiferente });
  }

  return {
    estado: () => estado,
    assinar(l) {
      ouvintes.add(l);
      return () => { ouvintes.delete(l); };
    },
    async entrar(c) {
      codigo = c;
      saindo = false;
      mudarOnline({ codigo: c, link: linkDaSala(c), situacao: 'conectando', aviso: '' });
      try { await conectar(); } catch (e) {
        encerrar(textoDoErro(e, c));
        return;
      }
      if (saindo) return;
      timerPing = setInterval(() => {
        if (!link) return;
        enviar({ t: 'ping' });
        if (Date.now() - ultimaMsg > tempos.limite) link.close();
      }, tempos.ping);
      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', aoVoltarPraPagina);
    },
    sair() {
      if (saindo && !link) return;
      enviar({ t: 'sair' });
      encerrar('Você saiu da sala.');
    },
    agir(a) { enviar({ t: 'acao', acao: a }); },
    escolher(e) { enviar({ t: 'escolher', escolhas: e }); },
    configMudou() { montar(); },
    olhar(id) { montar({ olhando: id }); },
    pularLuta() {
      if (estado.reproducao && !estado.reproducao.acabou) fimDaLuta();
    },
    id: () => meuId,
  };
}
