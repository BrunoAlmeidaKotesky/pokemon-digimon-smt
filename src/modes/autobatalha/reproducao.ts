// Reprodução da luta gravada (ResultadoLuta.gravacao) num instante t: quem está onde, com quanta vida, escudo e
// mana, e os eventos recentes (dano, cura, habilidade, efeitos). Os quadros trazem só o que mudou de um tick pro
// outro, então o estado de cada quadro é o acumulado; é montado uma vez por gravação.
import type { EstadoVisivel, EventoLuta, ResultadoLuta, Status } from '../../autobatalha/tipos';

export type Gravacao = NonNullable<ResultadoLuta['gravacao']>;
/** [col, lin, vida, escudo, mana, vivo, vida máxima, mana máxima] (os máximos mudam na transformação e nos buffs) */
type Valores = [number, number, number, number, number, number, number, number];

interface Preparo {
  inicial: EstadoVisivel[];
  surgem: { t: number; e: EstadoVisivel }[];
  trocas: { t: number; id: string; nome: string; img: string }[];
  tempos: number[];
  fotos: Map<string, Valores>[];
  status: Map<string, Status[]>[];
  eventos: EventoLuta[];
  tEventos: number[];
}

const cache = new WeakMap<Gravacao, Preparo>();

function preparar(g: Gravacao): Preparo {
  const pronto = cache.get(g);
  if (pronto) return pronto;
  const eventos = [...g.eventos].sort((a, b) => a.t - b.t);
  const surgem: Preparo['surgem'] = [];
  const trocas: Preparo['trocas'] = [];
  for (const ev of eventos) {
    if (ev.tipo === 'surge') surgem.push({ t: ev.t, e: ev.estado });
    else if (ev.tipo === 'transformar') trocas.push({ t: ev.t, id: ev.id, nome: ev.nome, img: ev.img });
  }
  const atual = new Map<string, Valores>();
  for (const e of [...g.inicial, ...surgem.map(s => s.e)]) {
    atual.set(e.id, [e.casa.col, e.casa.lin, e.vida, e.escudo, e.mana, e.vivo ? 1 : 0, e.vidaMax, e.manaMax]);
  }
  const st = new Map<string, Status[]>(g.inicial.map(e => [e.id, e.status]));
  const fotos: Map<string, Valores>[] = [];
  const status: Map<string, Status[]>[] = [];
  const quadros = [...g.quadros].sort((a, b) => a.t - b.t);
  for (const q of quadros) {
    for (const [id, v] of Object.entries(q.u)) {
      const antes = atual.get(id);
      const max = q.max?.[id];
      atual.set(id, [v[0], v[1], v[2], v[3], v[4], v[5], max?.[0] ?? antes?.[6] ?? v[2], max?.[1] ?? antes?.[7] ?? 0]);
      st.set(id, q.s?.[id] ?? []);
    }
    for (const [id, s] of Object.entries(q.s ?? {})) st.set(id, s);
    fotos.push(new Map(atual));
    status.push(new Map(st));
  }
  const p: Preparo = { inicial: g.inicial, surgem, trocas, tempos: quadros.map(q => q.t), fotos, status, eventos, tEventos: eventos.map(e => e.t) };
  cache.set(g, p);
  return p;
}

/** índice do último valor <= t (−1 se nenhum) */
function ultimoAte(xs: readonly number[], t: number): number {
  let lo = 0, hi = xs.length - 1, r = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (xs[m]! <= t + 1e-9) { r = m; lo = m + 1; } else hi = m - 1;
  }
  return r;
}

/** Os lutadores no instante t (os invocados aparecem quando surgem; a transformação troca nome e imagem). */
export function lutadoresEm(g: Gravacao, t: number): EstadoVisivel[] {
  const p = preparar(g);
  const i = ultimoAte(p.tempos, t);
  const foto = i >= 0 ? p.fotos[i]! : null;
  const st = i >= 0 ? p.status[i]! : null;
  const troca = new Map<string, { nome: string; img: string }>();
  for (const x of p.trocas) if (x.t <= t + 1e-9) troca.set(x.id, { nome: x.nome, img: x.img });
  const lista = [...p.inicial, ...p.surgem.filter(s => s.t <= t + 1e-9).map(s => s.e)];
  return lista.map(e => {
    const v = foto?.get(e.id);
    const tr = troca.get(e.id);
    const out: EstadoVisivel = { ...e, status: st?.get(e.id) ?? e.status };
    if (tr) { out.nome = tr.nome; out.img = tr.img; }
    if (v) {
      out.casa = { col: v[0], lin: v[1] };
      out.vida = v[2];
      out.escudo = v[3];
      out.mana = v[4];
      out.vivo = v[5] === 1;
      out.vidaMax = Math.max(1, v[6], v[2]);
      out.manaMax = v[7] || e.manaMax;
    }
    return out;
  });
}

/** Eventos com t0 < t <= t1, com o índice (estável, serve de chave pra animação). */
export function eventosEntre(g: Gravacao, t0: number, t1: number): { ev: EventoLuta; i: number }[] {
  const p = preparar(g);
  const out: { ev: EventoLuta; i: number }[] = [];
  for (let i = ultimoAte(p.tEventos, t0) + 1; i < p.eventos.length && p.eventos[i]!.t <= t1 + 1e-9; i++) out.push({ ev: p.eventos[i]!, i });
  return out;
}
