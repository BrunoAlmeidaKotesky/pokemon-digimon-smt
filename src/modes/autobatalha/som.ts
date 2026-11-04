// Sons da Autobatalha, gerados na hora com Web Audio (osciladores, envelopes, ruído filtrado): nada de arquivo nem de
// dependência. A tela chama `tocar('comprar')`, `tocarHabilidade('fogo')` etc.; o volume vem da configuração
// (`definirVolume`, 0 = mudo). O navegador só deixa tocar depois de um gesto do usuário, então o AudioContext só nasce
// no primeiro clique ou tecla (`prepararAudio` instala os ouvintes); antes disso, e sem Web Audio (testes, navegador
// sem som), tudo vira nada, sem erro. Cada som tem um limite por segundo (golpes numa luta cheia não viram barulho).
import type { EfeitoVisual } from '../../autobatalha/tipos';

export type Som =
  | 'clique' | 'comprar' | 'vender' | 'atualizar' | 'xp' | 'nivel' | 'evoluir2' | 'evoluir3' | 'posicionar' | 'equipar'
  | 'juntar' | 'clash' | 'luta' | 'golpe' | 'critico' | 'morte' | 'vitoria' | 'derrota' | 'empate' | 'carrosselVez'
  | 'carrosselPegou' | 'relogio' | 'relogioFim' | 'moeda' | 'erro' | 'abrir' | 'fechar';

// ---------- limite por segundo ----------

/** Janela deslizante: devolve uma função que diz se pode tocar no instante `agora` (ms), no máximo `max` vezes em
 *  `janela` ms. O que passa do limite é descartado (não entra na conta). */
export function criarLimite(max: number, janela = 1000): (agora: number) => boolean {
  const tempos: number[] = [];
  return agora => {
    while (tempos.length && tempos[0]! <= agora - janela) tempos.shift();
    if (tempos.length >= max) return false;
    tempos.push(agora);
    return true;
  };
}

/** quantos de cada som por segundo (os que não estão aqui: LIMITE_PADRAO) */
const LIMITES: Partial<Record<Som | 'habilidade', number>> = {
  golpe: 10, critico: 4, habilidade: 6, morte: 4, moeda: 8, relogio: 2, relogioFim: 2,
};
const LIMITE_PADRAO = 6;
const limites = new Map<string, (agora: number) => boolean>();
function podeTocar(chave: Som | 'habilidade'): boolean {
  let f = limites.get(chave);
  if (!f) limites.set(chave, (f = criarLimite(LIMITES[chave] ?? LIMITE_PADRAO)));
  return f(globalThis.performance?.now() ?? Date.now());
}

// ---------- contexto de áudio ----------

type CtorAudio = typeof AudioContext;
const CtorDoAudio = (): CtorAudio | undefined =>
  globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: CtorAudio }).webkitAudioContext;

interface Audio { ctx: AudioContext; saida: GainNode }

let volume = 0.6;
let audio: Audio | null = null;
let preparado = false;
let ruidoBuf: AudioBuffer | null = null;

/** Cria o contexto (no gesto do usuário) com o mestre: volume → compressor → saída. */
function criarAudio(): Audio | null {
  if (audio) return audio;
  const Ctor = CtorDoAudio();
  if (!Ctor) return null;
  const ctx = new Ctor();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.003;
  comp.release.value = 0.15;
  comp.connect(ctx.destination);
  const saida = ctx.createGain();
  saida.gain.value = volume;
  saida.connect(comp);
  audio = { ctx, saida };
  return audio;
}

/** Primeiro gesto: cria o contexto, ou retoma se o navegador suspendeu (aba escondida, por exemplo). */
function aoGesto(): void {
  try {
    const a = criarAudio();
    if (a && a.ctx.state !== 'running') void a.ctx.resume().catch(() => undefined);
  } catch { /* sem som */ }
}

export function prepararAudio(): void {
  if (preparado) return;
  preparado = true;
  try {
    if (typeof window === 'undefined' || !CtorDoAudio()) return;
    window.addEventListener('pointerdown', aoGesto, { capture: true });
    window.addEventListener('keydown', aoGesto, { capture: true });
  } catch { /* sem som */ }
}

export function definirVolume(v: number): void {
  volume = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
  try {
    if (audio) audio.saida.gain.setTargetAtTime(volume, audio.ctx.currentTime, 0.02);
  } catch { /* sem som */ }
}

/** O áudio pronto pra tocar agora (gesto já feito, contexto rodando, volume acima de 0), ou null. */
function pronto(): Audio | null {
  if (volume <= 0 || !audio) return null;
  return audio.ctx.state === 'running' ? audio : null;
}

// ---------- peças dos sons ----------

interface Filtro { tipo: BiquadFilterType; f: number; ate?: number; q?: number }
interface Tom {
  /** frequência inicial (Hz) e, se houver, a final (desliza exponencialmente até o fim) */
  f: number;
  ate?: number;
  tipo?: OscillatorType;
  /** começo, em segundos a partir de agora */
  em?: number;
  dur: number;
  vol: number;
  ataque?: number;
  filtro?: Filtro;
  /** vibrato: [velocidade em Hz, profundidade em Hz] */
  vibrato?: [number, number];
  /** desafinação em cents */
  detune?: number;
}
interface Ruido { em?: number; dur: number; vol: number; ataque?: number; filtro: Filtro }

/** nota MIDI → Hz (69 = Lá 440) */
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);
/** variação pequena e aleatória (só no som, não mexe no jogo) */
const variar = (x: number, fr = 0.06) => x * (1 + (Math.random() * 2 - 1) * fr);

function envelope(g: GainNode, t0: number, vol: number, ataque: number, dur: number): void {
  const a = Math.min(ataque, dur * 0.5);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(Math.max(0.0002, vol), t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
}

function filtro(ctx: AudioContext, o: Filtro, t0: number, dur: number): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = o.tipo;
  f.frequency.setValueAtTime(o.f, t0);
  if (o.ate) f.frequency.exponentialRampToValueAtTime(o.ate, t0 + dur);
  if (o.q != null) f.Q.value = o.q;
  return f;
}

function tom(a: Audio, o: Tom): void {
  const { ctx } = a;
  const t0 = ctx.currentTime + (o.em ?? 0);
  const osc = ctx.createOscillator();
  osc.type = o.tipo ?? 'sine';
  osc.frequency.setValueAtTime(o.f, t0);
  if (o.ate) osc.frequency.exponentialRampToValueAtTime(o.ate, t0 + o.dur);
  if (o.detune) osc.detune.value = o.detune;
  const g = ctx.createGain();
  envelope(g, t0, o.vol, o.ataque ?? 0.005, o.dur);
  let no: AudioNode = osc;
  if (o.filtro) {
    const fl = filtro(ctx, o.filtro, t0, o.dur);
    osc.connect(fl);
    no = fl;
  }
  no.connect(g);
  g.connect(a.saida);
  let lfo: OscillatorNode | null = null;
  if (o.vibrato) {
    lfo = ctx.createOscillator();
    lfo.frequency.value = o.vibrato[0];
    const prof = ctx.createGain();
    prof.gain.value = o.vibrato[1];
    lfo.connect(prof);
    prof.connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + o.dur + 0.05);
  }
  osc.onended = () => { g.disconnect(); lfo?.disconnect(); };
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

/** ruído branco de 1 s, feito uma vez */
function bufferDeRuido(ctx: AudioContext): AudioBuffer {
  if (ruidoBuf && ruidoBuf.sampleRate === ctx.sampleRate) return ruidoBuf;
  const n = ctx.sampleRate;
  const b = ctx.createBuffer(1, n, n);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  ruidoBuf = b;
  return b;
}

function ruido(a: Audio, o: Ruido): void {
  const { ctx } = a;
  const t0 = ctx.currentTime + (o.em ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = bufferDeRuido(ctx);
  src.loop = true;
  const fl = filtro(ctx, o.filtro, t0, o.dur);
  const g = ctx.createGain();
  envelope(g, t0, o.vol, o.ataque ?? 0.004, o.dur);
  src.connect(fl);
  fl.connect(g);
  g.connect(a.saida);
  src.onended = () => { g.disconnect(); };
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + o.dur + 0.05);
}

/** notas em sequência (arpejo): cada uma `passo` s depois da anterior */
function arpejo(a: Audio, notas: number[], passo: number, base: Omit<Tom, 'f' | 'em'>, em = 0): void {
  notas.forEach((m, i) => tom(a, { ...base, f: hz(m), em: em + i * passo }));
}

/** brilho agudo (ruído passa-alta curtinho), pra dar "faísca" */
const faisca = (a: Audio, em: number, vol: number, dur = 0.25) =>
  ruido(a, { em, dur, vol, filtro: { tipo: 'highpass', f: 6000, q: 0.7 } });

// ---------- os sons ----------

const SONS: Record<Som, (a: Audio) => void> = {
  // bem discreto: um toque seco
  clique: a => tom(a, { f: 1500, tipo: 'triangle', dur: 0.035, vol: 0.05 }),
  // duas notas subindo, com brilho de moeda
  comprar: a => {
    tom(a, { f: hz(88), tipo: 'triangle', dur: 0.09, vol: 0.13 });
    tom(a, { f: hz(95), tipo: 'triangle', em: 0.06, dur: 0.16, vol: 0.12 });
    faisca(a, 0.05, 0.025, 0.12);
  },
  // moedinhas descendo
  vender: a => {
    tom(a, { f: hz(95), tipo: 'square', dur: 0.06, vol: 0.05, filtro: { tipo: 'lowpass', f: 4000 } });
    tom(a, { f: hz(91), tipo: 'square', em: 0.05, dur: 0.07, vol: 0.05, filtro: { tipo: 'lowpass', f: 4000 } });
    tom(a, { f: hz(86), tipo: 'triangle', em: 0.1, dur: 0.18, vol: 0.12 });
  },
  // cartas embaralhando: sopro que sobe e três estalinhos
  atualizar: a => {
    ruido(a, { dur: 0.2, vol: 0.12, ataque: 0.03, filtro: { tipo: 'bandpass', f: 700, ate: 3200, q: 1.2 } });
    for (let i = 0; i < 3; i++) ruido(a, { em: 0.03 + i * 0.045, dur: 0.03, vol: 0.06, filtro: { tipo: 'highpass', f: 2500 } });
  },
  // subida rápida com faísca
  xp: a => {
    tom(a, { f: 420, ate: 980, tipo: 'sine', dur: 0.2, vol: 0.12, ataque: 0.02 });
    tom(a, { f: 840, ate: 1960, tipo: 'triangle', dur: 0.2, vol: 0.04, ataque: 0.02 });
    faisca(a, 0.12, 0.03, 0.12);
  },
  // fanfarrinha de quatro notas
  nivel: a => {
    arpejo(a, [72, 76, 79, 84], 0.07, { tipo: 'triangle', dur: 0.22, vol: 0.12 });
    tom(a, { f: hz(84), tipo: 'sine', em: 0.21, dur: 0.4, vol: 0.08, vibrato: [6, 4] });
  },
  // arpejo brilhante e cintilante
  evoluir2: a => {
    arpejo(a, [79, 83, 86, 91], 0.06, { tipo: 'triangle', dur: 0.25, vol: 0.12 });
    arpejo(a, [91, 95], 0.06, { tipo: 'sine', dur: 0.35, vol: 0.05, detune: 8 }, 0.18);
    faisca(a, 0.15, 0.04, 0.35);
  },
  // arpejo grande, acorde sustentado e brilho
  evoluir3: a => {
    arpejo(a, [72, 76, 79, 84, 88, 91, 96], 0.055, { tipo: 'triangle', dur: 0.24, vol: 0.11 });
    for (const m of [84, 88, 91]) {
      tom(a, { f: hz(m), tipo: 'sine', em: 0.38, dur: 0.6, vol: 0.06, ataque: 0.03, vibrato: [5.5, 3] });
      tom(a, { f: hz(m), tipo: 'triangle', em: 0.38, dur: 0.6, vol: 0.03, detune: 9 });
    }
    faisca(a, 0.3, 0.05, 0.6);
  },
  // baque macio na casa
  posicionar: a => {
    tom(a, { f: 190, ate: 85, tipo: 'sine', dur: 0.1, vol: 0.16 });
    ruido(a, { dur: 0.04, vol: 0.05, filtro: { tipo: 'lowpass', f: 1800 } });
  },
  // tilintar metálico curto
  equipar: a => {
    tom(a, { f: 1320, tipo: 'triangle', dur: 0.16, vol: 0.08 });
    tom(a, { f: 1980, tipo: 'sine', dur: 0.12, vol: 0.05 });
    ruido(a, { dur: 0.03, vol: 0.04, filtro: { tipo: 'highpass', f: 4000 } });
  },
  // dois tilintares, sopro e sino de fusão
  juntar: a => {
    tom(a, { f: 1175, tipo: 'triangle', dur: 0.1, vol: 0.07 });
    tom(a, { f: 1480, tipo: 'triangle', em: 0.07, dur: 0.1, vol: 0.07 });
    ruido(a, { em: 0.08, dur: 0.18, vol: 0.06, ataque: 0.06, filtro: { tipo: 'bandpass', f: 800, ate: 4000, q: 1 } });
    arpejo(a, [84, 91], 0.05, { tipo: 'sine', dur: 0.35, vol: 0.09, vibrato: [6, 3] }, 0.22);
  },
  // choque de metal com estrondo grave
  clash: a => {
    ruido(a, { dur: 0.12, vol: 0.14, filtro: { tipo: 'highpass', f: 2200 } });
    for (const [f, v] of [[1250, 0.05], [1870, 0.04], [2610, 0.03], [3420, 0.02]] as const) {
      tom(a, { f, tipo: 'triangle', dur: 0.75, vol: v, ataque: 0.002 });
    }
    tom(a, { f: 130, ate: 45, tipo: 'sine', dur: 0.7, vol: 0.22 });
    ruido(a, { dur: 0.5, vol: 0.1, filtro: { tipo: 'lowpass', f: 400, ate: 120 } });
  },
  // corneta curta de começo de luta
  luta: a => {
    const corneta = { tipo: 'sawtooth' as const, vol: 0.07, ataque: 0.03, filtro: { tipo: 'lowpass' as const, f: 1800, q: 1 } };
    tom(a, { ...corneta, f: hz(67), dur: 0.16 });
    tom(a, { ...corneta, f: hz(72), em: 0.14, dur: 0.32, vibrato: [5, 3] });
  },
  // pancadinha baixinha
  golpe: a => {
    ruido(a, { dur: 0.05, vol: 0.035, filtro: { tipo: 'bandpass', f: variar(1300, 0.2), q: 1.5 } });
    tom(a, { f: variar(170, 0.1), ate: 90, tipo: 'sine', dur: 0.06, vol: 0.04 });
  },
  // estalo agudo e mais forte
  critico: a => {
    ruido(a, { dur: 0.08, vol: 0.1, filtro: { tipo: 'highpass', f: 2600 } });
    tom(a, { f: 900, ate: 380, tipo: 'square', dur: 0.1, vol: 0.04, filtro: { tipo: 'lowpass', f: 3000 } });
    tom(a, { f: 140, ate: 70, tipo: 'sine', dur: 0.1, vol: 0.08 });
  },
  // queda grave e sopro
  morte: a => {
    tom(a, { f: variar(520, 0.05), ate: 110, tipo: 'triangle', dur: 0.32, vol: 0.09 });
    ruido(a, { em: 0.05, dur: 0.25, vol: 0.05, filtro: { tipo: 'lowpass', f: 900, ate: 200 } });
  },
  // arpejo maior e acorde final
  vitoria: a => {
    arpejo(a, [72, 76, 79], 0.09, { tipo: 'triangle', dur: 0.2, vol: 0.12 });
    for (const m of [84, 88, 91]) tom(a, { f: hz(m), tipo: 'triangle', em: 0.27, dur: 0.6, vol: 0.07, ataque: 0.02, vibrato: [5, 3] });
    faisca(a, 0.27, 0.035, 0.4);
  },
  // três notas descendo, abafadas
  derrota: a => {
    const base = { tipo: 'sawtooth' as const, vol: 0.06, ataque: 0.03, filtro: { tipo: 'lowpass' as const, f: 1100 } };
    tom(a, { ...base, f: hz(67), dur: 0.25 });
    tom(a, { ...base, f: hz(63), em: 0.2, dur: 0.25 });
    tom(a, { ...base, f: hz(60), em: 0.4, dur: 0.55, vibrato: [4, 2] });
  },
  // dois tons neutros
  empate: a => {
    tom(a, { f: hz(74), tipo: 'triangle', dur: 0.18, vol: 0.09 });
    tom(a, { f: hz(74), tipo: 'triangle', em: 0.2, dur: 0.3, vol: 0.08 });
  },
  // sino duplo: sua vez
  carrosselVez: a => {
    for (const [m, em] of [[88, 0], [93, 0.13]] as const) {
      tom(a, { f: hz(m), tipo: 'sine', em, dur: 0.4, vol: 0.12 });
      tom(a, { f: hz(m) * 2.76, tipo: 'sine', em, dur: 0.2, vol: 0.025 });
    }
  },
  // estalo e sininho
  carrosselPegou: a => {
    tom(a, { f: 600, ate: 1200, tipo: 'sine', dur: 0.06, vol: 0.1 });
    arpejo(a, [84, 88, 91], 0.05, { tipo: 'triangle', dur: 0.22, vol: 0.09 }, 0.05);
  },
  // tique curto
  relogio: a => {
    tom(a, { f: 1000, tipo: 'sine', dur: 0.035, vol: 0.08 });
    ruido(a, { dur: 0.015, vol: 0.03, filtro: { tipo: 'highpass', f: 5000 } });
  },
  // tique agudo e dobrado, urgente
  relogioFim: a => {
    tom(a, { f: 1650, tipo: 'square', dur: 0.045, vol: 0.05, filtro: { tipo: 'lowpass', f: 4000 } });
    tom(a, { f: 1650, tipo: 'square', em: 0.09, dur: 0.045, vol: 0.04, filtro: { tipo: 'lowpass', f: 4000 } });
  },
  // plim de moeda
  moeda: a => {
    tom(a, { f: hz(83), tipo: 'square', dur: 0.06, vol: 0.045, filtro: { tipo: 'lowpass', f: 5000 } });
    tom(a, { f: hz(88), tipo: 'square', em: 0.055, dur: 0.28, vol: 0.045, filtro: { tipo: 'lowpass', f: 5000 } });
    tom(a, { f: hz(88), tipo: 'sine', em: 0.055, dur: 0.28, vol: 0.06 });
  },
  // bip baixo, suave, descendo
  erro: a => {
    tom(a, { f: 330, tipo: 'sine', dur: 0.09, vol: 0.08 });
    tom(a, { f: 262, tipo: 'sine', em: 0.08, dur: 0.14, vol: 0.08 });
  },
  // sopro subindo
  abrir: a => {
    ruido(a, { dur: 0.13, vol: 0.06, ataque: 0.04, filtro: { tipo: 'bandpass', f: 500, ate: 2000, q: 1.2 } });
    tom(a, { f: 700, ate: 1100, tipo: 'sine', dur: 0.08, vol: 0.04 });
  },
  // sopro descendo
  fechar: a => {
    ruido(a, { dur: 0.12, vol: 0.05, ataque: 0.02, filtro: { tipo: 'bandpass', f: 1800, ate: 500, q: 1.2 } });
    tom(a, { f: 900, ate: 600, tipo: 'sine', dur: 0.07, vol: 0.035 });
  },
};

/** Som de cada habilidade pelo efeito visual dela. */
const HABILIDADES: Record<EfeitoVisual, (a: Audio) => void> = {
  // rajada que abre, com estalos
  fogo: a => {
    ruido(a, { dur: 0.35, vol: 0.12, ataque: 0.03, filtro: { tipo: 'lowpass', f: 700, ate: 3200, q: 1 } });
    for (let i = 0; i < 4; i++) ruido(a, { em: 0.04 + i * 0.06, dur: 0.02, vol: 0.05, filtro: { tipo: 'bandpass', f: variar(2500, 0.3), q: 4 } });
  },
  // estrondo grave
  explosao: a => {
    tom(a, { f: 110, ate: 40, tipo: 'sine', dur: 0.45, vol: 0.2 });
    ruido(a, { dur: 0.45, vol: 0.14, filtro: { tipo: 'lowpass', f: 2200, ate: 150 } });
  },
  // cristais finos
  gelo: a => {
    arpejo(a, [96, 100, 103], 0.04, { tipo: 'triangle', dur: 0.3, vol: 0.05 });
    ruido(a, { dur: 0.25, vol: 0.05, ataque: 0.05, filtro: { tipo: 'highpass', f: 5000 } });
  },
  // zap elétrico descendo
  raio: a => {
    tom(a, { f: 1600, ate: 180, tipo: 'sawtooth', dur: 0.2, vol: 0.06, filtro: { tipo: 'lowpass', f: 5000 } });
    ruido(a, { dur: 0.15, vol: 0.08, filtro: { tipo: 'highpass', f: 3000 } });
  },
  // raio contínuo que sobe
  feixe: a => tom(a, { f: 320, ate: 1400, tipo: 'sawtooth', dur: 0.3, vol: 0.05, ataque: 0.04, vibrato: [18, 25], filtro: { tipo: 'lowpass', f: 2500, q: 2 } }),
  // sopro forte
  sopro: a => ruido(a, { dur: 0.35, vol: 0.12, ataque: 0.06, filtro: { tipo: 'bandpass', f: 300, ate: 1300, q: 1.5 } }),
  // notas suaves subindo
  cura: a => arpejo(a, [84, 88, 91], 0.07, { tipo: 'sine', dur: 0.28, vol: 0.08, vibrato: [6, 3] }),
  // brilho metálico
  escudo: a => {
    tom(a, { f: 660, tipo: 'triangle', dur: 0.4, vol: 0.06, ataque: 0.02 });
    tom(a, { f: 990, tipo: 'triangle', dur: 0.35, vol: 0.04, ataque: 0.02, detune: 7 });
  },
  // baque e sopro
  golpe: a => {
    tom(a, { f: 160, ate: 70, tipo: 'sine', dur: 0.12, vol: 0.14 });
    ruido(a, { dur: 0.12, vol: 0.07, filtro: { tipo: 'bandpass', f: 900, ate: 2500, q: 1 } });
  },
  // bolhas
  veneno: a => {
    for (let i = 0; i < 4; i++) tom(a, { f: variar(330, 0.25), ate: variar(620, 0.2), tipo: 'sine', em: i * 0.065, dur: 0.07, vol: 0.06 });
  },
  // acorde claro e alto
  luz: a => {
    for (const m of [88, 91, 95]) tom(a, { f: hz(m), tipo: 'sine', dur: 0.4, vol: 0.05, ataque: 0.04 });
    faisca(a, 0, 0.03, 0.3);
  },
  // grave desafinado descendo
  trevas: a => {
    tom(a, { f: 116, ate: 70, tipo: 'sawtooth', dur: 0.42, vol: 0.07, ataque: 0.05, filtro: { tipo: 'lowpass', f: 700 } });
    tom(a, { f: 110, ate: 66, tipo: 'sawtooth', dur: 0.42, vol: 0.07, ataque: 0.05, detune: 20, filtro: { tipo: 'lowpass', f: 700 } });
  },
  // tique-taque e onda
  tempo: a => {
    tom(a, { f: 1200, tipo: 'sine', dur: 0.03, vol: 0.07 });
    tom(a, { f: 900, tipo: 'sine', em: 0.12, dur: 0.03, vol: 0.07 });
    tom(a, { f: 600, ate: 1200, tipo: 'sine', em: 0.05, dur: 0.3, vol: 0.05, ataque: 0.15, vibrato: [9, 30] });
  },
  // ventania
  vento: a => ruido(a, { dur: 0.38, vol: 0.1, ataque: 0.1, filtro: { tipo: 'bandpass', f: 600, ate: 2000, q: 3 } }),
  // tremor grave
  terra: a => {
    ruido(a, { dur: 0.38, vol: 0.14, filtro: { tipo: 'lowpass', f: 260, ate: 90 } });
    tom(a, { f: 72, ate: 45, tipo: 'sine', dur: 0.38, vol: 0.14 });
  },
  // bloop duplo
  agua: a => {
    tom(a, { f: 280, ate: 900, tipo: 'sine', dur: 0.1, vol: 0.09 });
    tom(a, { f: 340, ate: 1100, tipo: 'sine', em: 0.1, dur: 0.12, vol: 0.08 });
  },
  // brilhinhos agudos
  charme: a => arpejo(a, [91, 96, 93, 98], 0.05, { tipo: 'sine', dur: 0.15, vol: 0.06 }),
  // varredura que abre e acorde
  transformar: a => {
    tom(a, { f: 200, ate: 1200, tipo: 'sawtooth', dur: 0.5, vol: 0.05, ataque: 0.1, filtro: { tipo: 'lowpass', f: 400, ate: 5000, q: 3 } });
    for (const m of [72, 79, 84]) tom(a, { f: hz(m), tipo: 'triangle', em: 0.4, dur: 0.4, vol: 0.05 });
  },
  // par desafinado que cresce
  invocar: a => {
    tom(a, { f: 440, ate: 660, tipo: 'sine', dur: 0.5, vol: 0.06, ataque: 0.2 });
    tom(a, { f: 445, ate: 667, tipo: 'sine', dur: 0.5, vol: 0.06, ataque: 0.2 });
  },
};

/** genérico: subida curta com faísca */
function habilidadeGenerica(a: Audio): void {
  tom(a, { f: 500, ate: 1000, tipo: 'triangle', dur: 0.18, vol: 0.08 });
  faisca(a, 0.08, 0.03, 0.12);
}

// ---------- tocar ----------

export function tocar(s: Som): void {
  try {
    const a = pronto();
    if (!a || !podeTocar(s)) return;
    SONS[s]?.(a);
  } catch { /* sem som */ }
}

export function tocarHabilidade(efeito: EfeitoVisual | null): void {
  try {
    const a = pronto();
    if (!a || !podeTocar('habilidade')) return;
    (efeito ? HABILIDADES[efeito] ?? habilidadeGenerica : habilidadeGenerica)(a);
  } catch { /* sem som */ }
}
