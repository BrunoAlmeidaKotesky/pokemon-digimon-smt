// Partes do EstadoTela que saem da partida: o carrossel e a votação do "Pronto" vistos por quem joga nesta tela
// (Partida.voce). O controle (solo e anfitrião) e o convidado online montam a tela com as mesmas funções.
import type { EstadoCarrossel, EstadoVotacao } from './api';
import { horarioDoGrupo, podePegar, vivos } from './partida';
import type { Partida } from './tipos';

/** O carrossel pra tela (null fora da fase 'carrossel'); `tempo` = segundos desde o começo, `fim` = quando acaba. */
export function estadoDoCarrossel(p: Partida | null, tempo: number, fim: number): EstadoCarrossel | null {
  const c = p?.fase === 'carrossel' ? p.carrossel : undefined;
  if (!p || !c) return null;
  return {
    opcoes: c.opcoes, grupos: c.grupos, liberados: c.liberados, horarios: c.grupos.map((_, k) => horarioDoGrupo(k)),
    tempo, fim, podePegar: podePegar(p, p.voce),
  };
}

/** A votação do "Pronto" pra tela (null fora do planejamento). */
export function estadoDaVotacao(p: Partida | null): EstadoVotacao | null {
  if (!p || p.fase !== 'planejamento') return null;
  const vs = vivos(p);
  const eu = p.jogadores.find(j => j.id === p.voce);
  return { prontos: vs.filter(j => j.pronto).map(j => j.id), total: vs.length, voce: !!eu?.pronto };
}

/** Humanos vivos e presentes (não fora do ar): sem nenhum, a partida corre sozinha até o fim. */
export const humanosPresentes = (p: Partida): string[] =>
  vivos(p).filter(j => !j.bot && !j.ausente).map(j => j.id);
