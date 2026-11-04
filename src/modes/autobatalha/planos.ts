// Planos do planejador na tela: lidos uma vez do localStorage e gravados a cada mudança. A loja e o painel do
// planejador assinam daqui (o plano ativo marca os campeões na loja).
import { useSyncExternalStore } from 'react';
import { lerPlanos, planoAtivo, salvarPlanos, type Planos } from '../../autobatalha/planejador';

let estado: Planos = lerPlanos();
const ouvintes = new Set<() => void>();
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };

export function usePlanos(): Planos {
  return useSyncExternalStore(assinar, () => estado);
}

export const planosAtuais = () => estado;

export function mudarPlanos(p: Planos): void {
  estado = p;
  salvarPlanos(p);
  ouvintes.forEach(f => f());
}

/** campeões do plano ativo */
export function usePlanoAtivo(): ReadonlySet<string> {
  const p = usePlanos();
  const a = planoAtivo(p);
  return a ? new Set(a.campeoes) : VAZIO;
}
const VAZIO: ReadonlySet<string> = new Set();
