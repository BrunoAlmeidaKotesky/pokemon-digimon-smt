// Casas hexagonais "odd-r": linhas ímpares deslocadas meia casa pra direita. Tabuleiro da luta: 8 colunas x 8
// linhas; cada jogador usa 4 linhas (a sua metade).
import { COLUNAS, LINHAS, LINHAS_DONO, type Casa, type CasaDono, type Lado } from './tipos';

interface Cubo { x: number; y: number; z: number }

export function paraCubo(c: Casa): Cubo {
  const x = c.col - (c.lin - (c.lin & 1)) / 2;
  const z = c.lin;
  return { x, y: -x - z, z };
}
export function deCubo(c: Cubo): Casa {
  return { col: c.x + (c.z - (c.z & 1)) / 2, lin: c.z };
}

export function distancia(a: Casa, b: Casa): number {
  const p = paraCubo(a), q = paraCubo(b);
  return Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y), Math.abs(p.z - q.z));
}

export const dentro = (c: Casa, linhas = LINHAS) => c.col >= 0 && c.col < COLUNAS && c.lin >= 0 && c.lin < linhas;
export const chave = (c: Casa) => `${c.col},${c.lin}`;
export function deChave(k: string): Casa {
  const [col, lin] = k.split(',').map(Number);
  return { col: col!, lin: lin! };
}
export const igual = (a: Casa, b: Casa) => a.col === b.col && a.lin === b.lin;

const DIRECOES: Cubo[] = [
  { x: 1, y: -1, z: 0 }, { x: 1, y: 0, z: -1 }, { x: 0, y: 1, z: -1 },
  { x: -1, y: 1, z: 0 }, { x: -1, y: 0, z: 1 }, { x: 0, y: -1, z: 1 },
];

/** As até 6 casas vizinhas dentro do tabuleiro. */
export function vizinhas(c: Casa, linhas = LINHAS): Casa[] {
  const p = paraCubo(c);
  return DIRECOES.map(d => deCubo({ x: p.x + d.x, y: p.y + d.y, z: p.z + d.z })).filter(v => dentro(v, linhas));
}

/** Casas a até `raio` de `c` (sem a própria), dentro do tabuleiro. */
export function emVolta(c: Casa, raio: number, linhas = LINHAS): Casa[] {
  const out: Casa[] = [];
  for (let lin = 0; lin < linhas; lin++) for (let col = 0; col < COLUNAS; col++) {
    const d = distancia(c, { col, lin });
    if (d > 0 && d <= raio) out.push({ col, lin });
  }
  return out;
}

function arredondarCubo(x: number, y: number, z: number): Cubo {
  let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
  const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return { x: rx, y: ry, z: rz };
}

/** Casas na reta de `a` até `b` (inclui as duas). */
export function reta(a: Casa, b: Casa): Casa[] {
  const n = distancia(a, b);
  const p = paraCubo(a), q = paraCubo(b);
  const out: Casa[] = [];
  for (let i = 0; i <= n; i++) {
    const t = n === 0 ? 0 : i / n;
    // leve deslocamento pra desempatar sempre pro mesmo lado
    out.push(deCubo(arredondarCubo(p.x + (q.x - p.x) * t + 1e-6, p.y + (q.y - p.y) * t + 1e-6, p.z + (q.z - p.z) * t - 2e-6)));
  }
  return out;
}

/** Reta de `a` passando por `b` e seguindo até sair do tabuleiro (sem `a`). */
export function retaAteBorda(a: Casa, b: Casa): Casa[] {
  if (igual(a, b)) return [];
  const p = paraCubo(a), q = paraCubo(b);
  const n = distancia(a, b);
  const out: Casa[] = [];
  for (let i = 1; i <= 2 * (COLUNAS + LINHAS); i++) {
    const t = i / n;
    const c = deCubo(arredondarCubo(p.x + (q.x - p.x) * t + 1e-6, p.y + (q.y - p.y) * t + 1e-6, p.z + (q.z - p.z) * t - 2e-6));
    if (!dentro(c)) break;
    if (!out.some(o => igual(o, c))) out.push(c);
  }
  return out;
}

/** Leque: casas a até `alcance` de `a`, no setor de 120° centrado na direção de `b`. */
export function cone(a: Casa, b: Casa, alcance: number): Casa[] {
  const centro = (c: Casa) => ({ x: c.col + (c.lin & 1 ? 0.5 : 0), y: c.lin * 0.866 });
  const pa = centro(a), pb = centro(b);
  const ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
  return emVolta(a, alcance).filter(c => {
    const pc = centro(c);
    let d = Math.atan2(pc.y - pa.y, pc.x - pa.x) - ang;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return Math.abs(d) <= Math.PI / 3 + 1e-9;
  });
}

/** Casa da metade de um jogador → casa no tabuleiro da luta. A: linhas 4..7 (4 = frente); B: espelhado. */
export function paraLuta(c: CasaDono, lado: Lado): Casa {
  return lado === 'a' ? { col: c.col, lin: LINHAS_DONO + c.lin } : { col: COLUNAS - 1 - c.col, lin: LINHAS_DONO - 1 - c.lin };
}
