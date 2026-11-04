// Sessão da Autobatalha: o que a tela (src/modes/autobatalha) lê e chama. Escolhe a fonte do estado e pra onde vão as
// ações:
// - solo, ou anfitrião de uma sala online: o controle (controle.ts), que roda a partida neste navegador (o anfitrião
//   online liga os ganchos dele por online/anfitriao.ts);
// - convidado de uma sala online: online/convidado.ts (a partida vem do anfitrião, as ações vão pra ele).
// As preferências e as suas escolhas (nome, ícone, tabuleiro) ficam sempre na configuração local do controle
// (pdx-autobatalha-config); o convidado manda as escolhas pro anfitrião e usa as regras da sala dele.
import { useSyncExternalStore } from 'react';
import type { Acoes, AcoesOnline, EstadoTela } from './api';
import * as controle from './controle';
import { setCarregado } from './dados';
import * as anfitriao from './online/anfitriao';
import { criarConvidado, type Convidado } from './online/convidado';
import { codigoDaUrl, limparCodigo, senhaDoAparelho, tirarSalaDaUrl } from './online/parametros';
import type { AcaoJogador } from './tipos';

let convidado: Convidado | null = null;
/** o código do link (?autobatalha=ABCD) já foi tentado nesta página */
let tentouLink = false;

// ---------- estado ----------

const ouvintes = new Set<() => void>();
let desligarFonte: (() => void) | null = null;
const avisarTela = (): void => { ouvintes.forEach(l => l()); };

function ligarFonte(): void {
  desligarFonte?.();
  desligarFonte = convidado ? convidado.assinar(avisarTela) : controle.assinar(avisarTela);
}
function assinar(l: () => void): () => void {
  ouvintes.add(l);
  if (ouvintes.size === 1) ligarFonte();
  return () => {
    ouvintes.delete(l);
    if (!ouvintes.size) { desligarFonte?.(); desligarFonte = null; }
  };
}
/** Trocou de fonte (entrou ou saiu de uma sala como convidado). */
function trocouFonte(): void {
  if (ouvintes.size) ligarFonte();
  avisarTela();
}

export const estadoAutobatalha = (): EstadoTela => (convidado ? convidado.estado() : controle.estadoAutobatalha());
export function useAutobatalha(): EstadoTela {
  return useSyncExternalStore(assinar, estadoAutobatalha, estadoAutobatalha);
}

// ---------- ações ----------

/** Ação no próprio Jogador: o convidado manda pro anfitrião; senão o controle faz aqui. */
function agir(a: AcaoJogador, local: () => void): void {
  if (convidado) convidado.agir(a);
  else local();
}

function entrar(codigo: string): void {
  const c = limparCodigo(codigo);
  if (!c || convidado || anfitriao.temSala()) return;
  // partida solo aberta fica salva como estava (o lobby oferece continuar depois)
  convidado = criarConvidado({ config: () => controle.estadoAutobatalha().config, aparelho: senhaDoAparelho() });
  trocouFonte();
  void convidado.entrar(c);
}

export const acoes: Acoes & AcoesOnline = {
  async carregar() {
    await controle.acoes.carregar();
    // abriu pelo link da sala: entra como convidado (uma vez por página)
    if (!tentouLink && setCarregado()) {
      tentouLink = true;
      const c = codigoDaUrl();
      if (c && !controle.estadoAutobatalha().partida) entrar(c);
    }
  },
  novaPartida(semente) { if (!convidado) controle.acoes.novaPartida(semente); },
  continuar() { if (!convidado) controle.acoes.continuar(); },
  // convidado: "Sair" no meio da partida sai da sala (um bot joga no seu lugar)
  abandonar() { if (convidado) acoes.sairDaSala(); else controle.acoes.abandonar(); },

  comprar: i => agir({ tipo: 'comprar', i }, () => controle.acoes.comprar(i)),
  vender: uid => agir({ tipo: 'vender', uid }, () => controle.acoes.vender(uid)),
  atualizarLoja: () => agir({ tipo: 'atualizar' }, () => controle.acoes.atualizarLoja()),
  comprarXp: () => agir({ tipo: 'xp' }, () => controle.acoes.comprarXp()),
  travarLoja: () => agir({ tipo: 'travar' }, () => controle.acoes.travarLoja()),
  mover: (uid, para) => agir({ tipo: 'mover', uid, para }, () => controle.acoes.mover(uid, para)),
  equipar: (i, uid) => agir({ tipo: 'equipar', i, uid }, () => controle.acoes.equipar(i, uid)),
  juntarItens: (i, k) => agir({ tipo: 'juntar', i, k }, () => controle.acoes.juntarItens(i, k)),
  escolherEvolucao: forma => agir({ tipo: 'evolucao', forma }, () => controle.acoes.escolherEvolucao(forma)),
  pegarCarrossel: i => agir({ tipo: 'carrossel', i }, () => controle.acoes.pegarCarrossel(i)),
  pegarMoeda: i => agir({ tipo: 'moeda', i }, () => controle.acoes.pegarMoeda(i)),
  escolherUlt: (uid, ult) => agir({ tipo: 'ult', uid, ult }, () => controle.acoes.escolherUlt(uid, ult)),
  alternarPosicao: uid => agir({ tipo: 'posicao', uid }, () => controle.acoes.alternarPosicao(uid)),
  votarPronto: () => agir({ tipo: 'pronto' }, () => controle.acoes.votarPronto()),
  pronto: () => agir({ tipo: 'pronto', valor: true }, () => controle.acoes.pronto()),

  velocidade(v) {
    controle.acoes.velocidade(v);
    convidado?.configMudou();
  },
  pularLuta() { if (convidado) convidado.pularLuta(); else controle.acoes.pularLuta(); },
  configurar(c) {
    controle.acoes.configurar(c);
    if (convidado) {
      convidado.configMudou();
      if ('nome' in c || 'avatar' in c || 'estilo' in c) convidado.escolher(controle.escolhasDe(controle.estadoAutobatalha().config));
    }
  },
  // regras da sala: só o anfitrião (o convidado vê as do anfitrião)
  mudarRegras(c) { if (!convidado) controle.acoes.mudarRegras(c); },
  escolher(c) {
    controle.acoes.escolher(c);
    if (convidado) {
      convidado.configMudou();
      convidado.escolher(controle.escolhasDe(controle.estadoAutobatalha().config));
    }
  },
  olhar(id) { if (convidado) convidado.olhar(id); else controle.acoes.olhar(id); },

  jogarComAmigos() {
    if (convidado || controle.estadoAutobatalha().partida) return;
    void anfitriao.criarSala();
  },
  entrarNaSala: entrar,
  sairDaSala() {
    if (convidado) {
      convidado.sair();
      convidado = null;
      tirarSalaDaUrl();
      trocouFonte();
      return;
    }
    anfitriao.encerrarSala();
  },
  expulsar(id) { if (!convidado) anfitriao.expulsar(id); },
};
