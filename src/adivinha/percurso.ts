// Percurso do desafio do dia (e ciclo do "Todos" no livre): Clássico → Imagem → Blur → Emoji, um personagem por
// etapa. O jogador pode desligar etapas (pelo menos uma fica); etapa sem dados (Emoji sem arquivo) sai sozinha.
// No dia, a etapa seguinte só abre depois de resolver a anterior. Lógica pura.
import { ETAPAS, isSubmodo, type Submodo } from './grupos';
import { chaveDe, desafioDeHoje, type Salvo } from './placar';

/** Etapas ligadas, válidas e na ordem; nenhuma válida = todas. */
export function limparLigadas(x: unknown): Submodo[] {
  const l = Array.isArray(x) ? ETAPAS.filter(e => x.includes(e)) : [];
  return l.length ? l : [...ETAPAS];
}

/** Liga ou desliga uma etapa; a última ligada não desliga. */
export function alternar(ligadas: readonly Submodo[], sub: Submodo): Submodo[] {
  if (!isSubmodo(sub)) return [...ligadas];
  if (ligadas.includes(sub)) return ligadas.length > 1 ? ligadas.filter(e => e !== sub) : [...ligadas];
  return ETAPAS.filter(e => e === sub || ligadas.includes(e));
}

/** As etapas do percurso: ligadas e com dados, na ordem. */
export function etapasDoPercurso(ligadas: readonly Submodo[], comDados: readonly Submodo[]): Submodo[] {
  return ETAPAS.filter(e => ligadas.includes(e) && comDados.includes(e));
}

export interface EtapaDia {
  sub: Submodo;
  feita: boolean;
  /** chutes até acertar (0 se ainda não acertou) */
  chutes: number;
}
export interface Percurso {
  etapas: EtapaDia[];
  /** primeira etapa ainda não resolvida (null = percurso completo) */
  atual: Submodo | null;
  completo: boolean;
  /** chutes do percurso inteiro (só das etapas resolvidas) */
  chutes: number;
}

/** Como está o percurso de hoje da franquia, pelas etapas resolvidas no salvo. */
export function percursoDoDia(s: Salvo, grupo: string, hoje: string, etapas: readonly Submodo[]): Percurso {
  const l = etapas.map(sub => {
    const d = desafioDeHoje(s, chaveDe(grupo, sub), hoje);
    return { sub, feita: !!d?.acertou, chutes: d?.acertou ? d.chutes.length : 0 };
  });
  const atual = l.find(e => !e.feita)?.sub ?? null;
  return { etapas: l, atual, completo: l.length > 0 && atual === null, chutes: l.reduce((n, e) => n + e.chutes, 0) };
}

/** Dá pra abrir a etapa: já resolvida ou a da vez. */
export const liberada = (p: Percurso, sub: Submodo): boolean => p.etapas.some(e => e.sub === sub && (e.feita || e.sub === p.atual));

/** Etapa depois de `sub` no percurso (null se `sub` é a última ou não está nele). */
export function etapaSeguinte(etapas: readonly Submodo[], sub: Submodo): Submodo | null {
  const i = etapas.indexOf(sub);
  return i >= 0 && i < etapas.length - 1 ? (etapas[i + 1] as Submodo) : null;
}

/** Próxima franquia na ordem dos chips depois de `atual`, pulando as `feitas` (volta pro começo); nenhuma = null. */
export function proximaFranquia(ordem: readonly string[], atual: string, feita: (g: string) => boolean = () => false): string | null {
  const n = ordem.length, i = ordem.indexOf(atual);
  for (let k = 1; k <= n; k++) {
    const g = ordem[(i + k) % n] as string;
    if (g !== atual && !feita(g)) return g;
  }
  return null;
}
