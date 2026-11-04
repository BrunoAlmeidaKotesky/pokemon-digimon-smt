// Tabuleiro de casas hexagonais (a sua metade no planejamento, o inteiro na luta), banco, itens soltos e as peças.
// Arrastar: peça pra casa ou banco (mover), pra loja (vender); item solto pra uma unidade (equipar).
import type { CSSProperties } from 'react';
import type { Reproducao } from '../../autobatalha/api';
import { COLUNAS, LINHAS, LINHAS_DONO, type Atributos, type Casa, type Custo, type EfeitoVisual, type Estrela, type EstadoVisivel, type Jogador, type Partida, type Status, type Unidade } from '../../autobatalha/tipos';
import { S, urlImagem } from '../../autobatalha/dados';
import { deChave } from '../../autobatalha/hex';
import { acoes } from '../../autobatalha/controle';
import { atributosDaUnidade, idLuta } from '../../autobatalha/combate';
import { unidadeDoLutador } from './Dica';
import { abrirDica, dicaAtual, fecharDica, iniciarArrasto, propsDica, registrarFantasma, useArrasto, type AlvoDica, type Carga } from './interacao';
import { eventosEntre, lutadoresEm } from './reproducao';
import { Estrelas, Foto, IconeItem, centroCasa, custoAttr, formaOuNada, geo, imgForma, num, plural, tamanhoTabuleiro, type Geo } from './comum';

// ---------- peça (foto redonda, estrelas, barras e itens) ----------
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
      {d.stand && <span className="ab-marca-stand" title="Stand">S</span>}
      {d.itens.length > 0 && <div className="itens">{d.itens.map((id, i) => <IconeItem key={i} id={id} />)}</div>}
    </div>
  );
}

function atributos(u: Unidade): Atributos | null {
  try {
    return atributosDaUnidade(u);
  } catch {
    return null;
  }
}

/** peça de uma unidade fora da luta: vida cheia e a mana inicial */
export function fichaDaUnidade(u: Unidade, inimigo = false): FichaDados {
  const c = S().campeao(u.campeao);
  const at = atributos(u);
  return {
    nome: formaOuNada(u.forma)?.nome ?? c.nome, img: imgForma(u.forma), custo: c.custo, estrela: u.estrela,
    vida: at?.vida ?? 1, vidaMax: at?.vida ?? 1, escudo: 0, mana: at?.manaInicial ?? 0, manaMax: at?.mana ?? 100,
    inimigo, itens: u.itens, stand: !!c.stand,
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
  const el = alvo.closest<HTMLElement>('[data-uid]') ?? alvo.querySelector<HTMLElement>('[data-uid]');
  const uid = Number(el?.dataset.uid);
  if (el && Number.isInteger(uid)) acoes.equipar(c.i, uid);
}

/** Peça de unidade (tabuleiro ou banco): dica ao passar o mouse e, se for sua, arrasta. */
function PecaUnidade({ u, dono, editavel, casa, style, className }: {
  u: Unidade;
  dono: string;
  editavel: boolean;
  /** casa no tabuleiro (a peça também é alvo de soltar: troca de lugar) */
  casa?: Casa;
  style?: CSSProperties;
  className?: string;
}) {
  const arr = useArrasto();
  const d = fichaDaUnidade(u);
  const pegando = arr?.tipo === 'unidade' && arr.uid === u.uid;
  const alvo: AlvoDica = { tipo: 'unidade', dono, uid: u.uid, editavel };
  // clique (sem arrastar) fixa a dica, pra escolher a ult ou a posição; outro clique solta
  const clicar = (el: HTMLElement) => {
    const atual = dicaAtual();
    if (atual?.fixa && atual.alvo.tipo === 'unidade' && atual.alvo.uid === u.uid) fecharDica(0, true);
    else abrirDica(alvo, el, true);
  };
  return (
    <div className={'ab-peca' + (pegando ? ' pegando' : '') + (editavel ? ' minha' : '') + (className ? ' ' + className : '')} style={style}
      data-uid={u.uid} data-campeao={u.campeao}
      data-solta={casa && editavel ? 'casa' : undefined} data-col={casa?.col} data-lin={casa?.lin}
      {...propsDica(alvo)}
      onPointerDown={editavel ? e => {
        const el = e.currentTarget;
        iniciarArrasto(e, { tipo: 'unidade', uid: u.uid, img: d.img, custo: d.custo, nome: d.nome }, soltar, () => clicar(el));
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

const G_DONO = geo(92);
const G_LUTA = geo(60);

/** A metade de um jogador (8 × 4, linha 0 = frente, em cima). Editável = a sua no planejamento. */
export function TabuleiroDono({ j, editavel }: { j: Jogador; editavel: boolean }) {
  const g = G_DONO;
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
  return (
    <div id="abTabuleiro" className={'ab-tab dono' + (editavel ? ' editavel' : '')} style={{ width: largura, height: altura, ['--tok' as string]: '58px' }}>
      {casas.map(c => (
        <div key={`${c.col},${c.lin}`} className={'ab-casa' + (c.lin === 0 ? ' frente' : '')} style={estiloCasa(c, g)}
          data-solta={editavel ? 'casa' : undefined} data-col={c.col} data-lin={c.lin} />
      ))}
      {ligacoes.length > 0 && (
        <svg className="ab-ligacoes" width={largura} height={altura} aria-hidden="true">
          {ligacoes.map(l => <line key={l.id} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} />)}
        </svg>
      )}
      {pecas.map(p => <PecaUnidade key={p.u.uid} u={p.u} dono={j.id} editavel={editavel} casa={p.casa} style={estiloPeca(p.casa, g)} className="no-tab" />)}
    </div>
  );
}

export function Banco({ j, editavel }: { j: Jogador; editavel: boolean }) {
  return (
    <div id="abBanco" className="ab-banco" aria-label="Banco">
      {j.banco.map((uid, i) => {
        const u = uid != null ? j.unidades[uid] : undefined;
        return (
          <div key={i} className={'ab-vaga' + (u ? ' ocupada' : '')} data-solta={editavel ? 'banco' : undefined} data-i={i}>
            {u && <PecaUnidade u={u} dono={j.id} editavel={editavel} />}
          </div>
        );
      })}
    </div>
  );
}

export function ItensSoltos({ j, editavel }: { j: Jogador; editavel: boolean }) {
  return (
    <div id="abItens" className="ab-itens" aria-label="Itens soltos">
      {j.itens.length ? j.itens.map((id, i) => (
        <span key={i} className={'ab-item-solto' + (editavel ? ' minha' : '')} data-item={id} {...propsDica({ tipo: 'item', id })}
          onPointerDown={editavel ? e => iniciarArrasto(e, { tipo: 'item', i, id }, soltar) : undefined}>
          <IconeItem id={id} />
        </span>
      )) : <span className="ab-itens-vazio">Itens aparecem aqui</span>}
    </div>
  );
}

/** O que segue o mouse durante o arrasto. */
export function Fantasma() {
  const c = useArrasto();
  if (!c) return null;
  return (
    <div className="ab-fantasma" ref={registrarFantasma} aria-hidden="true">
      {c.tipo === 'unidade'
        ? <span className="ab-fantasma-u" {...custoAttr(c.custo)}><Foto src={c.img} nome={c.nome} className="redonda" /></span>
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

/** O tabuleiro inteiro na luta: o adversário em cima (espelhado), você embaixo. */
export function TabuleiroLuta({ partida, rep, velocidade }: { partida: Partida; rep: Reproducao; velocidade: number }) {
  const g = G_LUTA;
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

  const duracao = `${(0.42 / v).toFixed(3)}s`;
  return (
    <div id="abLuta" className="ab-tab luta" style={{ width: largura, height: altura, ['--tok' as string]: '42px', ['--mov' as string]: duracao }}>
      {casas.map(c => <div key={`${c.col},${c.lin}`} className={'ab-casa' + (c.lin < LINHAS_DONO ? ' deles' : '')} style={estiloCasa(c, g)} />)}
      {efeitos.map(({ ev, i }) => ev.tipo === 'visual' && ev.casas.map((c, k) => (
        <div key={`${i}-${k}`} className={`ab-fx fx-${EFEITOS.includes(ev.efeito) ? ev.efeito : 'golpe'}`} style={estiloCasa(c, g)} />
      )))}
      <svg className="ab-ligacoes" width={largura} height={altura} aria-hidden="true">
        {ligacoes.map(l => <line key={l.id} x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} />)}
        {tiros.map(({ ev, i }) => {
          if (ev.tipo !== 'ataque') return null;
          const a = pos(ev.de), b = pos(ev.para);
          return a && b ? <line key={i} className={'tiro ' + (porId.get(ev.de)?.lado ?? 'a')} x1={a.x} y1={a.y} x2={b.x} y2={b.y} /> : null;
        })}
      </svg>
      {lutadores.map(l => (
        <div key={l.id} className={'ab-peca na-luta' + (trocou.has(l.id) ? ' trocou' : '')} style={estiloPeca(l.casa, g)} data-lutador={l.id} data-lado={l.lado}
          {...propsDica({ tipo: 'lutador', id: l.id })}>
          <Ficha d={fichaDoLutador(l)} />
        </div>
      ))}
      {numeros.map(({ ev, i }) => {
        if (ev.tipo !== 'dano' && ev.tipo !== 'cura') return null;
        const p = pos(ev.para);
        if (!p) return null;
        const cls = ev.tipo === 'cura' ? 'cura' : `${COR_DANO[ev.danoTipo]}${ev.critico ? ' crit' : ''}`;
        return (
          <span key={i} className={'ab-num ' + cls} style={{ left: p.x + ((i % 5) - 2) * 7, top: p.y - 18 }}>
            {ev.tipo === 'cura' ? '+' : ''}{num(ev.valor)}{ev.tipo === 'dano' && ev.critico ? '!' : ''}
          </span>
        );
      })}
      {baloes.map(({ ev, i }) => {
        const quem = ev.tipo === 'habilidade' ? ev.de : ev.tipo === 'texto' ? ev.para : '';
        const p = pos(quem);
        if (!p) return null;
        return (
          <span key={i} className={'ab-balao' + (ev.tipo === 'texto' ? ' texto' : '')} style={{ left: p.x, top: p.y - 46 }}>
            {ev.tipo === 'habilidade' ? ev.nome : ev.tipo === 'texto' ? ev.texto : ''}
          </span>
        );
      })}
      {rep.acabou && <Placar partida={partida} rep={rep} />}
    </div>
  );
}

function fichaDoLutador(l: EstadoVisivel): FichaDados {
  return {
    nome: l.nome, img: urlImagem(l.img), custo: l.custo, estrela: l.estrela, vida: l.vida, vidaMax: l.vidaMax, escudo: l.escudo,
    mana: l.mana, manaMax: l.manaMax, inimigo: l.lado === 'b', itens: l.itens, stand: l.stand, monstro: l.monstro, chefe: l.chefe,
    morto: !l.vivo, status: l.status,
  };
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
