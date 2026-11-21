// Relógio da aba Adivinha (contagem até o próximo desafio, tempo da vez no online e troca do dia à meia-noite).
// Fica num store fora do React: o componente só lê o instante guardado, que anda a cada meio segundo enquanto
// alguém está olhando.
import { useSyncExternalStore } from 'react';
import { dataSP } from '../../adivinha/dia';

let agora = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const subs = new Set<() => void>();

function assinar(fn: () => void): () => void {
  subs.add(fn);
  agora = Date.now();
  timer ??= setInterval(() => {
    agora = Date.now();
    for (const f of Array.from(subs)) f();
  }, 500);
  return () => {
    subs.delete(fn);
    if (!subs.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Instante atual (ms), atualizado a cada meio segundo. */
export const useAgora = () => useSyncExternalStore(assinar, () => agora);
/** Data de hoje em Brasília ('AAAA-MM-DD'); só redesenha quando o dia vira. */
export const useHoje = () => useSyncExternalStore(assinar, () => dataSP(agora));
