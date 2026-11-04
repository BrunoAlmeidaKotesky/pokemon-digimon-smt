// Tabuleiro de casas hexagonais (a sua metade no planejamento, o inteiro na luta), banco, itens soltos e as peças.
// O tamanho das casas sai do espaço que a área tem (a tela mede e passa largura e altura), então tudo cresce com a
// janela. Arrastar: peça pra casa ou banco (mover), pra loja (vender); item solto pra uma unidade (equipar) ou pra
// outro componente solto (juntar no Bakugan completo). Passar o mouse numa moeda caída recolhe o ouro.
import { useState, type CSSProperties } from 'react';
import type { Reproducao } from '../../autobatalha/api';
import {
  COLUNAS, LINHAS, LINHAS_DONO, type Atributos, type Casa, type Custo, type EfeitoVisual, type Estrela, type EstadoVisivel, type Jogador,
  type Partida, type Status, type Unidade,
} from '../../autobatalha/tipos';
import { S, urlImagem } from '../../autobatalha/dados';
import { deChave } from '../../autobatalha/hex';
import { acoes } from '../../autobatalha/controle';
import { atributosDaUnidade, idLuta } from '../../autobatalha/combate';
import { ehComponente } from '../../autobatalha/conteudo';
import { ehFantasma, valorVenda } from '../../autobatalha/partida';
import { donoDoLado, unidadeDoLutador } from './Dica';
import {
  abrirDica, dicaAtual, fecharDica, iniciarArrasto, propsDica, registrarFantasma, useArrasto, useTracoEmFoco, type AlvoDica, type Carga,
} from './interacao';
import { eventosEntre, lutadoresEm } from './reproducao';
import {
  Estrelas, Foto, IconeAlcance, IconeItem, Moeda, RAZAO_LUTA, avatarDe, casaQueCabe, centroCasa, custoAttr, formaOuNada, geo, imgForma, num,
  plural, tamanhoTabuleiro, type Geo,
} from './comum';

// ---------- atributos (com memória: a peça redesenha muito na luta) ----------
const memoria = new Map<string, Atributos | null>();
/** Atributos da unidade fora da luta (null se a forma não existe mais no set). */
export function atributosDe(u: Unidade): Atributos | null {
  const k = `${u.campeao}|${u.forma}|${u.estrela}|${u.itens.join(',')}|${u.ult ?? ''}|${u.posicao ?? ''}|${u.bonus?.vida ?? 0}|${u.bonus?.dano ?? 0}`;
  let a = memoria.get(k);
  if (a === undefined) {
    try { a = atributosDaUnidade(u); } catch { a = null; }
    if (memoria.size > 600) memoria.clear();
    memoria.set(k, a);
  }
  return a;
}

/** traços de uma unidade (origem do campeão e classes da forma atual), pro destaque do traço em foco */
export function tracosDaUnidade(u: Pick<Unidade, 'campeao' | 'forma'>): string[] {
  try {
    return [S().campeao(u.campeao).fr, ...S().forma(u.forma).classes];
  } catch {
    return [];
  }
}

// ---------- peça (foto redonda, estrelas, barras, alcance e itens) ----------
export interface FichaDados {
  nome: string;
  img: string;
  custo: Custo;
  estrela: Estrela;
  vida: number;
  vidaMax: number;
  escudo: number;
  mana: number;
  manaMax: number;
  inimigo: boolean;
  itens: readonly string[];
  /** casas de alcance (o ícone de perto/longe); sem = não mostra */
  alcance?: number;
  stand?: boolean;
  monstro?: boolean;
  chefe?: boolean;
  morto?: boolean;
  status?: readonly Status[];
}

const fr = (x: number) => `${Math.max(0, Math.min(1, x)) * 100}%`;

export function Ficha({ d }: { d: FichaDados }) {
  const total = Math.max(d.vidaMax, d.vida + d.escudo, 1);
  const cls = ['ab-ficha', d.inimigo ? 'inimigo' : 'aliado', d.stand && 'stand', d.monstro && 'monstro', d.chefe && 'chefe', d.morto && 'morto', d.status?.includes('atordoado') && 'atordoado']
    .filter(Boolean).join(' ');
  return (
    <div className={cls} {...custoAttr(d.custo)}>
      <div className="topo">
        {!d.monstro && <Estrelas n={d.estrela} />}
        <div className="barra vida" aria-hidden="true">
          <i className="v" style={{ width: fr(d.vida / total) }} />
          {d.escudo > 0 && <i className="e" style={{ left: fr(d.vida / total), width: fr(d.escudo / total) }} />}
        </div>
        <div className="barra mana" aria-hidden="true"><i style={{ width: fr(d.manaMax ? d.mana / d.manaMax : 0) }} /></div>
      </div>
      <Foto src={d.img} nome={d.nome} className="redonda" />
      {d.alcance != null && !d.monstro && <IconeAlcance alcance={d.alcance} />}
      {d.stand && <span className="ab-marca-stand" title="Stand">S</span>}
      {d.itens.length > 0 && <div className="itens">{d.itens.map((id, i) => <IconeItem key={i} id={id} />)}</div>}
    </div>
  );
}

/** peça de uma unidade fora da luta: vida cheia e a mana inicial */
export function fichaDaUnidade(u: Unidade, inimigo = false): FichaDados {
  const c = S().campeao(u.campeao);
  const at = atributosDe(u);
  return {
    nome: formaOuNada(u.forma)?.nome ?? c.nome, img: imgForma(u.forma), custo: c.custo, estrela: u.estrela,
    vida: at?.vida ?? 1, vidaMax: at?.vida ?? 1, escudo: 0, mana: at?.manaInicial ?? 0, manaMax: at?.mana ?? 100,
    inimigo, itens: u.itens, alcance: at?.alcance, stand: !!c.stand,
  };
}

// ---------- soltar ----------
/** O que acontece ao soltar uma carga num alvo (elemento com data-solta). */
export function soltar(c: Carga, alvo: HTMLElement | null): void {
  if (!alvo) return;
  const tipo = alvo.dataset.solta;
  if (c.tipo === 'unidade') {
    if (tipo === 'casa') acoes.mover(c.uid, { tipo: 'tabuleiro', casa: { col: Number(alvo.dataset.col), lin: Number(alvo.dataset.lin) } });
    else if (tipo === 'banco') acoes.mover(c.uid, { tipo: 'banco', i: Number(alvo.dataset.i) });
    else if (tipo === 'loja') acoes.vender(c.uid);
    return;
  }
  if (tipo === 'item') {
    const k = Number(alvo.dataset.i);
    if (Number.isInteger(k) && k !== c.i) acoes.juntarItens(c.i, k);
    return;
  }
  const el = alvo.closest<HTMLElement>('[data-uid]') ?? alvo.querySelector<HTMLElement>('[data-uid]');
  const uid = Number(el?.dataset.uid);
  if (el && Number.isInteger(uid)) acoes.equipar(c.i, uid);
}

/** Peça de unidade (tabuleiro ou banco): dica ao passar o mouse e, se for sua, arrasta. */
function PecaUnidade({ u, dono, editavel, casa, style, className, foco }: {
  u: Unidade;
  dono: string;
  editavel: boolean;
  /** casa no tabuleiro (a peça também é alvo de soltar: troca de lugar) */
  casa?: Casa;
  style?: CSSProperties;
  className?: string;
  /** traço em foco: a peça fica em destaque (tem o traço) ou apagada (não tem) */
  foco: string | null;
}) {
  const arr = useArrasto();
  const d = fichaDaUnidade(u);
  const pegando = arr?.tipo === 'unidade' && arr.uid === u.uid;
  const alvo: AlvoDica = { tipo: 'unidade', dono, uid: u.uid, editavel };
  const temFoco = foco ? tracosDaUnidade(u).includes(foco) : false;
  // clique (sem arrastar) fixa a dica, pra escolher a ult ou a posição; outro clique solta
  const clicar = (el: HTMLElement) => {
    const atual = dicaAtual();
    if (atual?.fixa && atual.alvo.tipo === 'unidade' && atual.alvo.uid === u.uid) fecharDica(0, true);
    else abrirDica(alvo, el, true);
  };
  return (
    <div className={'ab-peca' + (pegando ? ' pegando' : '') + (editavel ? ' minha' : '') + (foco ? (temFoco ? ' em-foco' : ' fora-foco') : '') + (className ? ' ' + className : '')} style={style}
      data-uid={u.uid} data-campeao={u.campeao}
      data-solta={casa && editavel ? 'casa' : undefined} data-col={casa?.col} data-lin={casa?.lin}
      {...propsDica(alvo)}
      onPointerDown={editavel ? e => {
        const el = e.currentTarget;
        iniciarArrasto(e, { tipo: 'unidade', uid: u.uid, img: d.img, custo: d.custo, nome: d.nome, venda: valorVenda(u) }, soltar, () => clicar(el));
      } : undefined}>
      <Ficha d={d} />
    </div>
  );
}

// ---------- casas ----------
function estiloCasa(c: Casa, g: Geo): CSSProperties {
  const { x, y } = centroCasa(c, g);
  return { left: x - g.w / 2, top: y - g.h / 2, width: g.w, height: g.h };
}
function estiloPeca(c: Casa, g: Geo): CSSProperties {
  const { x, y } = centroCasa(c, g);
  return { left: x, top: y };
}
/** variáveis de tamanho do tabuleiro: --w (largura da casa) e --tok (diâmetro da peça) */
const varsTab = (g: Geo, tok: number, extra?: CSSProperties): CSSProperties =>
  ({ ['--w' as string]: `${g.w}px`, ['--tok' as string]: `${Math.round(tok)}px`, ...extra });

/** id de cada "+1" que sobe ao recolher uma moeda */
let ganhos = 0;
const proximoGanho = () => ++ganhos;

/** espaço livre da área do tabuleiro (a tela mede e passa) */
export interface Espaco { largura: number; altura: number }
const FOLGA = 6;

/** A metade de um jogador (8 × 4, linha 0 = frente, em cima). Editável = a sua no planejamento; aí as moedas caídas
 *  aparecem e passar o mouse recolhe. */
export function TabuleiroDono({ j, editavel, espaco }: { j: Jogador; editavel: boolean; espaco: Espaco }) {
  const foco = useTracoEmFoco();
  const [ganhos, setGanhos] = useState<{ id: number; x: number; y: number; valor: number }[]>([]);
  const g = geo(casaQueCabe(espaco.largura - FOLGA, espaco.altura - FOLGA, LINHAS_DONO));
  const { largura, altura } = tamanhoTabuleiro(LINHAS_DONO, g);
  const pecas = Object.entries(j.tabuleiro)
    .map(([k, uid]) => ({ casa: deChave(k), u: j.unidades[uid] }))
    .filter((p): p is { casa: Casa; u: Unidade } => !!p.u);
  const casaDe = new Map(pecas.map(p => [p.u.uid, p.casa]));
  const ligacoes = pecas.flatMap(p => {
    const outra = p.u.usuario != null ? casaDe.get(p.u.usuario) : undefined;
    return outra ? [{ id: p.u.uid, a: centroCasa(p.casa, g), b: centroCasa(outra, g) }] : [];
  });
  const casas: Casa[] = [];
  for (let lin = 0; lin < LINHAS_DONO; lin++) for (let col = 0; col < COLUNAS; col++) casas.push({ col, lin });
  const moedas = editavel ? j.moedas ?? [] : [];
  // a moeda fica no canto de baixo à direita da casa, pra não tampar a peça nem atrapalhar o arrasto
  const posMoeda = (c: Casa, k: number) => {
    const { x, y } = centroCasa(c, g);
    return { x: x + g.w * 0.26 - (k % 3) * g.w * 0.09, y: y + g.h * 0.24 };
  };
  const recolher = (i: number, x: number, y: number, valor: number) => {
    acoes.pegarMoeda(i);
    const id = proximoGanho();
    setGanhos(gs => [...gs.slice(-6), { id, x, y, valor }]);
    setTimeout(() => setGanhos(gs => gs.filter(x2 => x2.id !== id)), 900);
  };
  return (
    <div id="abTabuleiro" className={'ab-tab dono' + (editavel ? ' editavel' : '') + (foco ? ' focando' : '')}
      style={varsTab(g, g.w * 0.66, { width: largura, height: altura })}>
      {casas.map(c => (
        <div key={`${c.col},${c.lin}`} className={'ab-casa' + (c.lin === 0 ? ' frente' : '')} style={estiloCasa(c, g)}
          data-solta={editavel ? 'casa' : undefined} data-col={c.col} data-lin={c.lin} />
      ))}
      {ligacoes.length > 0 && (
        <svg className="ab-ligacoes" width={largura} height={altura} aria-hidden="true">
          {ligacoes.map(l => <line key={l.id} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} />)}
        </svg>
      )}
      {pecas.map(p => <PecaUnidade key={p.u.uid} u={p.u} dono={j.id} editavel={editavel} casa={p.casa} style={estiloPeca(p.casa, g)} className="no-tab" foco={foco} />)}
      {moedas.map((m, i) => {
        const { x, y } = posMoeda(m.casa, i);
        return (
          <span key={`${i}-${m.casa.col},${m.casa.lin}`} className="ab-moeda-chao" style={{ left: x, top: y }} data-moeda={i}
            title={`${m.valor} de ouro: passe o mouse pra pegar`} onPointerEnter={() => recolher(i, x, y, m.valor)}>
            <Moeda />{m.valor > 1 && <b>{m.valor}</b>}
          </span>
        );
      })}
      {ganhos.map(x => <span key={x.id} className="ab-ganho" style={{ left: x.x, top: x.y }}>+{x.valor}</span>)}
    </div>
  );
}

export function Banco({ j, editavel }: { j: Jogador; editavel: boolean }) {
  const foco = useTracoEmFoco();
  return (
    <div id="abBanco" className={'ab-banco' + (foco ? ' focando' : '')} aria-label="Banco">
      {j.banco.map((uid, i) => {
        const u = uid != null ? j.unidades[uid] : undefined;
        return (
          <div key={i} className={'ab-vaga' + (u ? ' ocupada' : '')} data-solta={editavel ? 'banco' : undefined} data-i={i}>
            {u && <PecaUnidade u={u} dono={j.id} editavel={editavel} foco={foco} />}
          </div>
        );
      })}
    </div>
  );
}

/** A bolsa: os itens soltos, numa coluna à esquerda do tabuleiro. Arraste pra uma unidade (equipa) ou um componente
 *  sobre outro (junta no Bakugan completo). */
export function ItensSoltos({ j, editavel }: { j: Jogador; editavel: boolean }) {
  const arr = useArrasto();
  const arrastandoComp = arr?.tipo === 'item' && ehComponente(arr.id);
  return (
    <div id="abItens" className={'ab-itens' + (arrastandoComp ? ' juntando' : '')} aria-label="Itens soltos">
      <h3 title="Arraste pra uma unidade; um componente sobre outro vira o Bakugan completo">Itens</h3>
      <div className="ab-itens-lista">
        {j.itens.length ? j.itens.map((id, i) => {
          const comp = ehComponente(id);
          const alvo = editavel && arrastandoComp && comp && !(arr?.tipo === 'item' && arr.i === i);
          return (
            <span key={i} className={'ab-item-solto' + (editavel ? ' minha' : '') + (comp ? ' comp' : ' completo') + (alvo ? ' alvo' : '')
              + (arr?.tipo === 'item' && arr.i === i ? ' pegando' : '')}
              data-item={id} data-i={i} data-solta={alvo ? 'item' : undefined} {...propsDica({ tipo: 'item', id })}
              onPointerDown={editavel ? e => iniciarArrasto(e, { tipo: 'item', i, id }, soltar) : undefined}>
              <IconeItem id={id} />
            </span>
          );
        }) : <span className="ab-itens-vazio">Vazio</span>}
      </div>
    </div>
  );
}

/** O que segue o mouse durante o arrasto (unidade: com o valor de venda). */
export function Fantasma() {
  const c = useArrasto();
  if (!c) return null;
  return (
    <div className="ab-fantasma" ref={registrarFantasma} aria-hidden="true">
      {c.tipo === 'unidade'
        ? (
          <span className="ab-fantasma-u" {...custoAttr(c.custo)}>
            <Foto src={c.img} nome={c.nome} className="redonda" />
            {c.venda != null && <span className="venda" title="Valor de venda"><Moeda />{c.venda}</span>}
          </span>
        )
        : <IconeItem id={c.id} />}
    </div>
  );
}

// ---------- luta ----------
const COR_DANO = { fisico: 'fis', magico: 'mag', verdadeiro: 'ver' } as const;
const EFEITOS: readonly EfeitoVisual[] = ['explosao', 'raio', 'feixe', 'cura', 'escudo', 'golpe', 'sopro', 'gelo', 'fogo', 'veneno', 'luz', 'trevas', 'tempo', 'vento', 'terra', 'agua', 'charme', 'transformar', 'invocar'];

/** vida do humano no planejamento de cada rodada (pra mostrar quanto a luta tirou) */
const vidaNoPlanejamento = new Map<string, number>();
export const chaveRodada = (p: Partida) => `${p.semente}:${p.estagio}-${p.rodada}`;
export function lembrarVida(p: Partida, vida: number): void {
  vidaNoPlanejamento.set(chaveRodada(p), vida);
}

/** O tabuleiro inteiro na luta: o adversário em cima (espelhado), você embaixo. Antes de correr, a apresentação dos
 *  dois lados (clash). */
export function TabuleiroLuta({ partida, rep, velocidade, espaco }: { partida: Partida; rep: Reproducao; velocidade: number; espaco: Espaco }) {
  const foco = useTracoEmFoco();
  const g = geo(casaQueCabe(espaco.largura - FOLGA, espaco.altura - FOLGA, LINHAS, RAZAO_LUTA), RAZAO_LUTA);
  const { largura, altura } = tamanhoTabuleiro(LINHAS, g);
  const grav = rep.resultado.gravacao;
  if (!grav) return <p className="mute">Luta sem gravação.</p>;
  const t = rep.t;
  const v = Math.max(1, velocidade);
  const lutadores = lutadoresEm(grav, t);
  const porId = new Map(lutadores.map(l => [l.id, l]));
  const pos = (id: string) => { const l = porId.get(id); return l ? centroCasa(l.casa, g) : null; };
  // janelas em segundos de luta: o mesmo tempo na tela em qualquer velocidade
  const recentes = eventosEntre(grav, t - 1.3 * v, t);
  const numeros = recentes.filter(r => (r.ev.tipo === 'dano' || r.ev.tipo === 'cura') && r.ev.t >= t - 0.9 * v).slice(-40);
  const baloes = recentes.filter(r => r.ev.tipo === 'habilidade' || r.ev.tipo === 'texto');
  const efeitos = recentes.filter(r => r.ev.tipo === 'visual' && r.ev.t >= t - 0.6 * v);
  const tiros = recentes.filter(r => r.ev.tipo === 'ataque' && r.ev.distancia > 1 && r.ev.t >= t - 0.25 * v);
  const trocou = new Set(recentes.filter(r => r.ev.tipo === 'transformar' && r.ev.t >= t - 0.6 * v).map(r => (r.ev.tipo === 'transformar' ? r.ev.id : '')));
  const lancou = new Set(recentes.filter(r => r.ev.tipo === 'habilidade' && r.ev.t >= t - 0.35 * v).map(r => (r.ev.tipo === 'habilidade' ? r.ev.de : '')));
  const moedas = eventosEntre(grav, -1, t).filter(r => r.ev.tipo === 'moeda');
  const casas: Casa[] = [];
  for (let lin = 0; lin < LINHAS; lin++) for (let col = 0; col < COLUNAS; col++) casas.push({ col, lin });

  // Stands: linha até o usuário (pelo uid da unidade de cada lado)
  const ligacoes = lutadores.flatMap(l => {
    if (!l.stand || !l.vivo) return [];
    const usuario = unidadeDoLutador(partida, rep.adversario, l)?.usuario;
    const outro = usuario != null ? porId.get(idLuta(l.lado, String(usuario))) : undefined;
    if (!outro?.vivo) return [];
    return [{ id: l.id, a: centroCasa(l.casa, g), b: centroCasa(outro.casa, g) }];
  });
  const meio = (LINHAS_DONO - 0.5) * g.h * 0.75 + g.h / 2;

  const duracao = `${(0.42 / v).toFixed(3)}s`;
  return (
    <div id="abLuta" className={'ab-tab luta' + (foco ? ' focando' : '') + (rep.comecou ? '' : ' antes')}
      style={varsTab(g, g.w * 0.64, { width: largura, height: altura, ['--mov' as string]: duracao, ['--meio' as string]: `${meio}px` })}>
      {casas.map(c => <div key={`${c.col},${c.lin}`} className={'ab-casa' + (c.lin < LINHAS_DONO ? ' deles' : '')} style={estiloCasa(c, g)} />)}
      <span className="ab-meio" aria-hidden="true" />
      {efeitos.map(({ ev, i }) => ev.tipo === 'visual' && ev.casas.map((c, k) => (
        <div key={`${i}-${k}`} className={`ab-fx fx-${EFEITOS.includes(ev.efeito) ? ev.efeito : 'golpe'}`} style={estiloCasa(c, g)} />
      )))}
      {moedas.map(({ ev, i }) => {
        if (ev.tipo !== 'moeda') return null;
        const { x, y } = centroCasa(ev.casa, g);
        return <span key={i} className="ab-moeda-chao caindo" style={{ left: x + g.w * 0.24, top: y + g.h * 0.22 }}><Moeda /></span>;
      })}
      <svg className="ab-ligacoes" width={largura} height={altura} aria-hidden="true">
        {ligacoes.map(l => <line key={l.id} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} />)}
        {tiros.map(({ ev, i }) => {
          if (ev.tipo !== 'ataque') return null;
          const a = pos(ev.de), b = pos(ev.para);
          return a && b ? <line key={i} className={'tiro ' + (porId.get(ev.de)?.lado ?? 'a')} x1={a.x} y1={a.y} x2={b.x} y2={b.y} /> : null;
        })}
      </svg>
      {lutadores.map(l => {
        const u = l.monstro ? null : unidadeDoLutador(partida, rep.adversario, l);
        const temFoco = foco && u ? tracosDaUnidade(u).includes(foco) : false;
        return (
          <div key={l.id} className={'ab-peca na-luta' + (trocou.has(l.id) ? ' trocou' : '') + (lancou.has(l.id) ? ' lanca' : '') + (foco ? (temFoco ? ' em-foco' : ' fora-foco') : '')}
            style={estiloPeca(l.casa, g)} data-lutador={l.id} data-lado={l.lado}
            {...propsDica({ tipo: 'lutador', id: l.id })}>
            <Ficha d={fichaDoLutador(l, u)} />
          </div>
        );
      })}
      {numeros.map(({ ev, i }) => {
        if (ev.tipo !== 'dano' && ev.tipo !== 'cura') return null;
        const p = pos(ev.para);
        if (!p) return null;
        const cls = ev.tipo === 'cura' ? 'cura' : `${COR_DANO[ev.danoTipo]}${ev.critico ? ' crit' : ''}`;
        return (
          <span key={i} className={'ab-num ' + cls} style={{ left: p.x + ((i % 5) - 2) * g.w * 0.1, top: p.y - g.h * 0.3 }}>
            {ev.tipo === 'cura' ? '+' : ''}{num(ev.valor)}{ev.tipo === 'dano' && ev.critico ? '!' : ''}
          </span>
        );
      })}
      {baloes.map(({ ev, i }) => {
        const quem = ev.tipo === 'habilidade' ? ev.de : ev.tipo === 'texto' ? ev.para : '';
        const p = pos(quem);
        if (!p) return null;
        return (
          <span key={i} className={'ab-balao' + (ev.tipo === 'texto' ? ' texto' : '')} style={{ left: p.x, top: p.y - g.h * 0.72 }}>
            {ev.tipo === 'habilidade' ? ev.nome : ev.tipo === 'texto' ? ev.texto : ''}
          </span>
        );
      })}
      {!rep.comecou && <Clash partida={partida} rep={rep} />}
      {rep.acabou && <Placar partida={partida} rep={rep} />}
    </div>
  );
}

function fichaDoLutador(l: EstadoVisivel, u: Unidade | null): FichaDados {
  return {
    nome: l.nome, img: urlImagem(l.img), custo: l.custo, estrela: l.estrela, vida: l.vida, vidaMax: l.vidaMax, escudo: l.escudo,
    mana: l.mana, manaMax: l.manaMax, inimigo: l.lado === 'b', itens: l.itens, alcance: u ? atributosDe(u)?.alcance : undefined,
    stand: l.stand, monstro: l.monstro, chefe: l.chefe, morto: !l.vivo, status: l.status,
  };
}

/** Quem é o adversário da luta, pra apresentação: jogador (avatar), fantasma ou os monstros (o chefe, se houver). */
export function ladoAdversario(p: Partida, adversario: string): { nome: string; img: string; sub: string } {
  if (adversario === 'monstros') {
    const chefe = p.monstros.find(m => m.chefe);
    const m = chefe ?? p.monstros[0];
    const n = p.monstros.length;
    if (!m) return { nome: 'Monstros', img: '', sub: 'Final Fantasy' };
    return {
      nome: chefe ? chefe.monstro.nome : n > 1 ? `${m.monstro.nome} e mais ${n - 1}` : m.monstro.nome,
      img: urlImagem(m.monstro.img),
      sub: chefe ? `Chefe do ${chefe.monstro.jogo}` : `Monstros do Final Fantasy`,
    };
  }
  const j = donoDoLado(p.jogadores, adversario);
  if (!j) return { nome: 'Adversário', img: '', sub: '' };
  return { nome: ehFantasma(adversario) ? `Fantasma de ${j.nome}` : j.nome, img: avatarDe(j), sub: ehFantasma(adversario) ? 'cópia do tabuleiro' : `${Math.max(0, j.vida)} de vida` };
}

/** Apresentação antes da luta: você de um lado, o adversário do outro e o "VS" no meio. */
function Clash({ partida, rep }: { partida: Partida; rep: Reproducao }) {
  const eu = partida.jogadores.find(j => j.id === partida.voce);
  const adv = ladoAdversario(partida, rep.adversario);
  return (
    <div id="abClash" className={'ab-clash' + (rep.adversario === 'monstros' ? ' monstros' : '')} aria-live="polite">
      <div className="lado eu">
        <Foto src={eu ? avatarDe(eu) : ''} nome={eu?.nome ?? 'Você'} className="redonda" />
        <b>{eu?.nome ?? 'Você'}</b>
        <small>{eu ? `${Math.max(0, eu.vida)} de vida` : ''}</small>
      </div>
      <b className="vs">VS</b>
      <div className="lado eles">
        <Foto src={adv.img} nome={adv.nome} className="redonda" />
        <b>{adv.nome}</b>
        <small>{adv.sub}</small>
      </div>
    </div>
  );
}

/** Fim da luta: venceu, perdeu ou empate, e quanto de vida custou. */
function Placar({ partida, rep }: { partida: Partida; rep: Reproducao }) {
  const r = rep.resultado;
  const eu = partida.jogadores.find(j => j.id === partida.voce);
  const antes = vidaNoPlanejamento.get(chaveRodada(partida));
  const dano = eu && antes != null ? Math.max(0, antes - eu.vida) : 0;
  const titulo = r.vencedor === 'a' ? 'Vitória' : r.vencedor === 'b' ? 'Derrota' : 'Empate';
  const partes = [
    r.vencedor === 'a' ? `${r.vivosA.length} de pé` : r.vencedor === 'b' ? plural(r.vivosB.length, 'inimigo de pé', 'inimigos de pé') : '',
    dano > 0 ? `−${dano} de vida` : '',
    `${num(r.duracao, 1)} s`,
  ].filter(Boolean);
  return (
    <div id="abPlacar" className={'ab-placar ' + (r.vencedor === 'a' ? 'venceu' : r.vencedor === 'b' ? 'perdeu' : 'empate')} role="status">
      <b>{titulo}</b>
      <span>{partes.join(' · ')}</span>
    </div>
  );
}

// ---------- dano depois da luta ----------
export interface LutaVista { rep: Reproducao; rotulo: string; adversario: string }

/** Painel de dano por unidade da última luta: causado (do motor) e recebido (somado dos eventos), em barras. */
export function DanoDaLuta({ luta }: { luta: LutaVista }) {
  const [lado, setLado] = useState<'a' | 'b'>('a');
  const g = luta.rep.resultado.gravacao;
  if (!g) return null;
  const recebido = new Map<string, number>();
  for (const ev of g.eventos) if (ev.tipo === 'dano') recebido.set(ev.para, (recebido.get(ev.para) ?? 0) + ev.valor);
  const causado = luta.rep.resultado.dano;
  const linhas = lutadoresEm(g, luta.rep.resultado.duracao)
    .filter(l => l.lado === lado)
    .map(l => ({ l, c: causado[l.id] ?? 0, r: recebido.get(l.id) ?? 0 }))
    .filter(x => x.c > 0 || x.r > 0)
    .sort((a, b) => b.c - a.c || b.r - a.r)
    .slice(0, 12);
  const maxC = Math.max(1, ...linhas.map(x => x.c));
  const maxR = Math.max(1, ...linhas.map(x => x.r));
  return (
    <section id="abDano" className="ab-dano" aria-label="Dano da última luta">
      <div className="cab">
        <h3>Dano {luta.rotulo}</h3>
        <span className="ab-dano-lados" role="group" aria-label="Lado">
          <button type="button" className={'ab-chip' + (lado === 'a' ? ' on' : '')} aria-pressed={lado === 'a'} onClick={() => setLado('a')}>Seu</button>
          <button type="button" className={'ab-chip' + (lado === 'b' ? ' on' : '')} aria-pressed={lado === 'b'} onClick={() => setLado('b')}
            title={luta.adversario}>Deles</button>
        </span>
      </div>
      {linhas.length ? (
        <ol className="ab-dano-lista">
          {linhas.map(({ l, c, r }) => (
            <li key={l.id} {...custoAttr(l.custo)} title={`${l.nome}: ${num(c)} causado, ${num(r)} recebido`}>
              <Foto src={urlImagem(l.img)} nome={l.nome} className="redonda" />
              <span className="barras">
                <span className="nm">{l.nome}</span>
                <span className="b causado"><i style={{ width: fr(c / maxC) }} /><em>{num(c)}</em></span>
                <span className="b recebido"><i style={{ width: fr(r / maxR) }} /><em>{num(r)}</em></span>
              </span>
            </li>
          ))}
        </ol>
      ) : <p className="ab-vazio">Ninguém causou dano.</p>}
      <p className="ab-dano-leg"><i className="causado" /> causado <i className="recebido" /> recebido</p>
    </section>
  );
}
