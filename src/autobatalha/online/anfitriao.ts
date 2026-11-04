// Anfitrião da Autobatalha online: o navegador de quem cria a sala roda a partida de verdade (o controle, com os
// ganchos daqui) e cuida da rede.
//
// - Sala: código de 4 letras (no transporte, `ab-ABCD`, pra não bater com as salas da aba Online), link
//   ?autobatalha=ABCD. Quem abre o link manda "ola" com a senha do aparelho, a versão do jogo e as escolhas (nome,
//   ícone, tabuleiro); entra no primeiro lugar livre (h2 a h8; o anfitrião é o h1). Versão diferente = recusado com
//   aviso pra recarregar. Vagas que sobram até 8 viram bots quando a partida começa.
// - Partida: cada convidado manda ações; o anfitrião aplica no Jogador dele (o id vem da conexão, nunca da mensagem)
//   e manda pra cada um a visão dele (online/visao.ts), só com o que mudou, juntando mudanças seguidas. Na luta, manda
//   a cada humano só a entrada e a semente da dele (o convidado reproduz) e espera todos avisarem que viram.
// - Queda: o convidado que cai fica `ausente` e um bot joga por ele; volta pelo mesmo aparelho (senha) ou, se o
//   aparelho mudou, com o mesmo nome que tinha na partida. No lobby, quem cai sai da sala.
// - O anfitrião pode tirar alguém (não volta mais nesta sala). Fechar a página ou a sala avisa todo mundo.
import * as controle from '../controle';
import { S, setCarregado } from '../dados';
import { estiloOuPadrao } from '../estilos';
import { limparNome } from '../partida';
import type { EscolhasJogador, HumanoSala, Jogador } from '../tipos';
import {
  ID_ANFITRIAO, idDoLugar, linkDaSala, MAX_HUMANOS, nomePadraoDoLugar, novoCodigo, PREFIXO_TRANSPORTE, TEMPOS_REDE,
  type TemposRede,
} from './parametros';
import {
  daRede, lerMsgConvidado, MAX_MSG_CONVIDADO, paraRede, type LutaVista, type MsgAnfitriao, type MsgConvidado,
  type PartidaParcial, type SalaVista,
} from './protocolo';
import { textoDoErro, transporteDaPagina, TransportError, type HostEndpoint, type Link, type Transport } from './rede';
import { versaoDoJogo } from './versao';
import { basePraVer, chaveDaRodada, jogadorProprio, jogadorPublico, lutasDosHumanos } from './visao';

/** quanto o anfitrião junta mudanças seguidas antes de mandar */
export const MS_JUNTAR = 40;
/** quanto uma conexão nova tem pra dizer "ola" */
const MS_ESPERA_OLA = 10000;

/** O que já foi mandado a um convidado (pra mandar só o que mudou). */
interface Enviado {
  sala: string;
  /** id da partida cujos jogadores estão em `jogadores` (null = sem partida mandada) */
  partida: number | null;
  base: string;
  jogadores: Map<string, string>;
  /** marca do tempo mandado (fase, prazo, fim do carrossel) */
  tempo: string;
  /** já mandou "sem partida" */
  semPartida: boolean;
}

interface Convidado {
  id: string;
  /** senha do aparelho */
  aparelho: string;
  escolhas: EscolhasJogador;
  /** null = fora do ar */
  link: Link | null;
  /** última mensagem dele (Date.now) */
  visto: number;
  expulso: boolean;
  enviado: Enviado;
  /** a luta dele nesta rodada (mandada de novo se ele voltar no meio dela) */
  luta: LutaVista | null;
}

interface Sala {
  codigo: string;
  endpoint: HostEndpoint;
  convidados: Map<string, Convidado>;
  /** aparelhos tirados pelo anfitrião */
  banidos: Set<string>;
  versao: () => string;
  tempos: TemposRede;
  pinga: ReturnType<typeof setInterval>;
  juntar: ReturnType<typeof setTimeout> | null;
}

export interface OpcoesSala {
  transporte?: Transport;
  tempos?: TemposRede;
  versao?: () => string;
}

let sala: Sala | null = null;
let criando = false;
let ouvePagina = false;

const novoEnviado = (): Enviado => ({ sala: '', partida: null, base: '', jogadores: new Map(), tempo: '', semPartida: false });

function enviar(link: Link | null, m: MsgAnfitriao): void {
  if (!link) return;
  try { link.send(paraRede(m)); } catch { /* a conexão já caiu */ }
}

/** Escolhas que vieram pela rede, limpas: nome cortado, ícone que existe no set, estilo conhecido. */
function limparEscolhas(e: EscolhasJogador): EscolhasJogador {
  const avatar = e.avatar && setCarregado() && S().temForma(e.avatar) && !S().forma(e.avatar).soUlt ? e.avatar : null;
  return { nome: limparNome(e.nome), avatar, estilo: estiloOuPadrao(e.estilo) };
}

const ordenados = (s: Sala): Convidado[] => [...s.convidados.values()].sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));

// ---------- ganchos do controle ----------

const ganchos: controle.GanchosAnfitriao = {
  convidados(): HumanoSala[] {
    if (!sala) return [];
    return ordenados(sala).map(c => ({ id: c.id, escolhas: c.escolhas, nomePadrao: nomePadraoDoLugar(c.id), conectado: !!c.link }));
  },
  mudou() {
    if (sala && !sala.juntar) sala.juntar = setTimeout(enviarTudo, MS_JUNTAR);
  },
  lutas(rr) {
    if (!sala) return;
    // primeiro a partida já na fase da luta, depois a luta de cada um
    enviarTudo();
    const p = controle.partidaAtual();
    if (!p) return;
    const lutas = lutasDosHumanos(p, rr, ID_ANFITRIAO);
    for (const c of sala.convidados.values()) {
      c.luta = lutas.get(c.id) ?? null;
      if (c.luta) enviar(c.link, { t: 'luta', luta: c.luta });
    }
  },
  avisar(id, msg) {
    enviar(sala?.convidados.get(id)?.link ?? null, { t: 'aviso', texto: msg });
  },
};

// ---------- mandar a visão de cada um ----------

function salaVista(s: Sala, c: Convidado): SalaVista {
  const e = controle.estadoAutobatalha();
  return {
    codigo: s.codigo, anfitriao: ID_ANFITRIAO, voce: c.id, lugares: e.sala?.lugares ?? [],
    regras: { relogio: e.config.relogio, segundos: e.config.segundos, dificuldade: e.config.dificuldade },
    emPartida: !!controle.partidaAtual(),
  };
}

/** Manda a cada convidado conectado o que mudou pra ele: a sala, a partida (só as partes que mudaram) e o tempo. */
function enviarTudo(): void {
  const s = sala;
  if (!s) return;
  if (s.juntar) clearTimeout(s.juntar);
  s.juntar = null;
  const p = controle.partidaAtual();
  // de volta ao lobby: quem estava fora do ar (ou foi tirado) sai da sala
  if (!p) {
    let saiu = false;
    for (const c of [...s.convidados.values()]) if (!c.link) { s.convidados.delete(c.id); saiu = true; }
    if (saiu) { controle.atualizarSala(); return; } // atualizarSala chama mudou() de novo
  }
  const tempo = controle.tempoDaPartida();
  const marca = controle.marcaDoTempo();
  const idPartida = controle.idDaPartida();
  const publicos = new Map<string, { j: Jogador; json: string }>();
  if (p) for (const j of p.jogadores) { const v = jogadorPublico(j); publicos.set(j.id, { j: v, json: JSON.stringify(v) }); }
  for (const c of s.convidados.values()) {
    if (!c.link) continue;
    const sv = JSON.stringify(salaVista(s, c));
    if (sv !== c.enviado.sala) {
      c.enviado.sala = sv;
      enviar(c.link, { t: 'sala', sala: JSON.parse(sv) as SalaVista });
    }
    if (!p) {
      if (!c.enviado.semPartida) {
        enviar(c.link, { t: 'estado', partida: null, tempo });
        c.enviado = { ...novoEnviado(), sala: c.enviado.sala, semPartida: true };
      }
      continue;
    }
    if (c.enviado.partida !== idPartida) c.enviado = { ...novoEnviado(), sala: c.enviado.sala, partida: idPartida };
    const novos: Jogador[] = [];
    for (const j of p.jogadores) {
      const proprio = j.id === c.id ? jogadorProprio(j) : null;
      const pub = publicos.get(j.id)!;
      const json = proprio ? JSON.stringify(proprio) : pub.json;
      if (c.enviado.jogadores.get(j.id) === json) continue;
      c.enviado.jogadores.set(j.id, json);
      novos.push(proprio ?? pub.j);
    }
    const base = basePraVer(p, c.id, idPartida);
    const bj = JSON.stringify(base);
    const mudouBase = bj !== c.enviado.base;
    if (!mudouBase && !novos.length && marca === c.enviado.tempo) continue;
    const parcial: PartidaParcial = { ids: p.jogadores.map(j => j.id), jogadores: novos };
    if (mudouBase) parcial.base = base;
    c.enviado.base = bj;
    c.enviado.tempo = marca;
    c.enviado.semPartida = false;
    enviar(c.link, { t: 'estado', partida: parcial, tempo });
  }
}

// ---------- conexões ----------

function recusar(link: Link, motivo: string, versao = false): void {
  enviar(link, { t: 'recusado', motivo, versao });
  setTimeout(() => link.close(), 300);
}

function proximoLugar(s: Sala): string | null {
  for (let n = 2; n <= MAX_HUMANOS; n++) if (!s.convidados.has(idDoLugar(n))) return idDoLugar(n);
  return null;
}

/** "ola" de uma conexão: volta pro lugar dela, pega um lugar livre ou é recusada. Devolve o convidado. */
function ola(s: Sala, link: Link, m: Extract<MsgConvidado, { t: 'ola' }>): Convidado | null {
  if (m.versao !== s.versao()) {
    recusar(link, 'A sua página está numa versão diferente da do anfitrião. Recarreguem a página (os dois) e tentem de novo.', true);
    return null;
  }
  if (s.banidos.has(m.aparelho)) { recusar(link, 'O anfitrião tirou você desta sala.'); return null; }
  const p = controle.partidaAtual();
  let c = [...s.convidados.values()].find(x => x.aparelho === m.aparelho);
  // aparelho novo no meio da partida: volta pro lugar de quem caiu com o mesmo nome
  if (!c && p) {
    const nome = limparNome(m.escolhas.nome).toLocaleLowerCase('pt-BR');
    const nomeNaPartida = (id: string) => p.jogadores.find(j => j.id === id)?.nome.toLocaleLowerCase('pt-BR');
    if (nome) c = [...s.convidados.values()].find(x => !x.link && !x.expulso && nomeNaPartida(x.id) === nome);
  }
  if (c?.expulso) { recusar(link, 'O anfitrião tirou você desta sala.'); return null; }
  if (!c) {
    if (p) { recusar(link, 'A partida desta sala já começou. Espere ela acabar e abra o link de novo.'); return null; }
    const id = proximoLugar(s);
    if (!id) { recusar(link, `A sala está cheia (${MAX_HUMANOS} pessoas).`); return null; }
    c = { id, aparelho: m.aparelho, escolhas: limparEscolhas(m.escolhas), link: null, visto: Date.now(), expulso: false, enviado: novoEnviado(), luta: null };
    s.convidados.set(id, c);
  }
  const antigo = c.link;
  // a mesma pessoa entrou de novo (outra aba ou aparelho): a conexão antiga sai sem tentar voltar
  if (antigo && antigo !== link) {
    enviar(antigo, { t: 'substituido' });
    setTimeout(() => antigo.close(), 300);
  }
  c.link = link;
  c.aparelho = m.aparelho;
  c.visto = Date.now();
  c.enviado = novoEnviado();
  // no lobby as escolhas valem já; na partida, valem pra próxima
  c.escolhas = limparEscolhas(m.escolhas);
  enviar(link, { t: 'bemvindo', id: c.id, versao: s.versao() });
  if (p) controle.marcarAusente(c.id, false);
  controle.atualizarSala();
  enviarTudo();
  // voltou no meio da luta: manda a dele de novo
  const pend = controle.lutaPendente();
  if (pend && c.luta && c.luta.chave === chaveDaRodada(pend)) enviar(link, { t: 'luta', luta: c.luta });
  return c;
}

/** O convidado caiu ou saiu: na partida, um bot joga por ele até ele voltar; no lobby, sai da sala. */
function caiu(s: Sala, c: Convidado): void {
  c.link = null;
  if (controle.partidaAtual()) controle.marcarAusente(c.id, true);
  else s.convidados.delete(c.id);
  controle.atualizarSala();
}

function aceitar(link: Link): void {
  const s = sala;
  if (!s) { link.close(); return; }
  let c: Convidado | null = null;
  const espera = setTimeout(() => { if (!c) link.close(); }, MS_ESPERA_OLA);
  link.onMessage(raw => {
    const m = lerMsgConvidado(daRede(raw, MAX_MSG_CONVIDADO));
    if (!m || sala !== s) return;
    if (m.t === 'ola') {
      clearTimeout(espera);
      c = ola(s, link, m);
      return;
    }
    if (!c || c.link !== link) return;
    c.visto = Date.now();
    switch (m.t) {
      case 'escolher':
        c.escolhas = limparEscolhas(m.escolhas);
        controle.atualizarSala();
        break;
      case 'acao': controle.acaoDe(c.id, m.acao); break;
      case 'viu': {
        const pend = controle.lutaPendente();
        if (pend && m.luta === chaveDaRodada(pend)) controle.viuLuta(c.id);
        break;
      }
      case 'sair': link.close(); break;
      case 'ping': break;
    }
  });
  link.onClose(() => {
    clearTimeout(espera);
    if (sala === s && c && c.link === link) caiu(s, c);
  });
}

function pingar(): void {
  const s = sala;
  if (!s) return;
  const agora = Date.now();
  for (const c of s.convidados.values()) {
    if (!c.link) continue;
    enviar(c.link, { t: 'ping' });
    if (agora - c.visto > s.tempos.limite) c.link.close();
  }
}

// ---------- o que a tela chama (pela sessão) ----------

/** Cria a sala: você vira o anfitrião (o lobby mostra o código e o link). */
export async function criarSala(o: OpcoesSala = {}): Promise<void> {
  if (sala || criando) return;
  criando = true;
  const transporte = o.transporte ?? transporteDaPagina();
  controle.definirOnline({ papel: 'anfitriao', codigo: '', link: '', situacao: 'conectando', aviso: '' });
  let endpoint: HostEndpoint | null = null;
  let erro: unknown = null;
  for (let tentativa = 0; tentativa < 5 && !endpoint; tentativa++) {
    try { endpoint = await transporte.host(PREFIXO_TRANSPORTE + novoCodigo()); } catch (e) {
      erro = e;
      if (!(e instanceof TransportError && e.kind === 'codigo-em-uso')) break;
    }
  }
  criando = false;
  if (!endpoint) {
    controle.definirOnline({ papel: 'anfitriao', codigo: '', link: '', situacao: 'encerrada', aviso: textoDoErro(erro) });
    return;
  }
  const codigo = endpoint.code.slice(PREFIXO_TRANSPORTE.length);
  const tempos = o.tempos ?? TEMPOS_REDE;
  sala = {
    codigo, endpoint, convidados: new Map(), banidos: new Set(), versao: o.versao ?? versaoDoJogo, tempos,
    pinga: setInterval(pingar, tempos.ping), juntar: null,
  };
  controle.ligarAnfitriao(ganchos);
  const online = { papel: 'anfitriao' as const, codigo, link: linkDaSala(codigo), situacao: 'na-sala' as const, aviso: '' };
  controle.definirOnline(online);
  endpoint.onLink(aceitar);
  endpoint.onTrouble(ok => {
    if (!sala) return;
    controle.definirOnline({
      ...online,
      aviso: ok ? '' : 'Sem conexão com o servidor de convites: quem já está na sala continua jogando, mas ninguém novo consegue entrar até ela voltar.',
    });
  });
  // fechar a página avisa todo mundo que a sala acabou
  if (!ouvePagina && typeof window !== 'undefined') {
    ouvePagina = true;
    window.addEventListener('pagehide', () => { if (sala) encerrarSala('O anfitrião fechou a página: a sala acabou.'); });
  }
}

/** Fecha a sala pra todos (e volta pro solo). Sala que nem chegou a abrir: só some o aviso. */
export function encerrarSala(motivo = 'O anfitrião fechou a sala.'): void {
  const s = sala;
  sala = null;
  if (!s) { controle.definirOnline(null); return; }
  for (const c of s.convidados.values()) enviar(c.link, { t: 'encerrada', motivo });
  clearInterval(s.pinga);
  if (s.juntar) clearTimeout(s.juntar);
  setTimeout(() => s.endpoint.close(), 150);
  controle.desligarAnfitriao();
}

/** Tira um convidado: ele não volta mais nesta sala; na partida, um bot fica no lugar dele até o fim. */
export function expulsar(id: string): void {
  const s = sala;
  const c = s?.convidados.get(id);
  if (!s || !c) return;
  c.expulso = true;
  s.banidos.add(c.aparelho);
  const l = c.link;
  c.link = null;
  if (l) {
    enviar(l, { t: 'expulso' });
    setTimeout(() => l.close(), 300);
  }
  if (controle.partidaAtual()) controle.marcarAusente(id, true);
  else s.convidados.delete(id);
  controle.atualizarSala();
}

/** Há uma sala aberta (ou sendo criada) neste navegador. */
export const temSala = (): boolean => !!sala || criando;
