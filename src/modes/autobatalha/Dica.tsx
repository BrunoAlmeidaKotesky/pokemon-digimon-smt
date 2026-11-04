// Dica (tooltip) de qualquer retrato: unidade, carta da loja, campeão do planejador, lutador na luta, traço e item.
// Fica ao lado do retrato sem sair da tela; o mouse pode entrar nela (escolher a ult, trocar a posição do Yu-Gi-Oh!).
import { Fragment, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import type { EstadoTela } from '../../autobatalha/api';
import type { Atributos, CampeaoDados, EstadoVisivel, Jogador, Partida, Unidade } from '../../autobatalha/tipos';
import { S, urlImagem } from '../../autobatalha/dados';
import { acoes } from '../../autobatalha/controle';
import { atributosDaUnidade, separarId } from '../../autobatalha/combate';
import { TRACOS, habilidadeDa, opcoesDeUlt, passivaDe } from '../../autobatalha/conteudo';
import { abrirImagem, fecharDica, useDica, useImagemGrande, type AlvoDica } from './interacao';
import { lutadoresEm } from './reproducao';
import {
  Estrelas, Foto, IconeAlcance, IconeItem, Moeda, NOME_UNICOS, TextoPorEstrela, corTraco, custoAttr, formaOuNada, imgForma, nomeItem, nomeTraco, num, partesItem,
  pct, textoItem,
} from './comum';

export function Dica({ estado }: { estado: EstadoTela }) {
  const d = useDica();
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!d || !el) return;
    if (!d.el.isConnected) { fecharDica(0, true); return; }
    posicionar(el, d.el.getBoundingClientRect());
  });
  // fixa: fecha com clique fora (da dica e do retrato) ou Esc
  const fixa = d?.fixa ? d.el : null;
  useEffect(() => {
    if (!fixa) return;
    const fora = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (t && (ref.current?.contains(t) || fixa.contains(t))) return;
      fecharDica(0, true);
    };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fecharDica(0, true); };
    document.addEventListener('pointerdown', fora, true);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fora, true);
      document.removeEventListener('keydown', tecla);
    };
  }, [fixa]);
  if (!d) return null;
  const corpo = conteudo(d.alvo, estado, d.fixa);
  if (!corpo) return null;
  const retrato = d.alvo.tipo === 'unidade' || d.alvo.tipo === 'campeao' || d.alvo.tipo === 'lutador';
  return (
    <div ref={ref} id="abDica" className={'ab-dica ' + d.alvo.tipo + (d.fixa ? ' fixa' : '')} role="tooltip">
      {corpo}
      <p className="ab-d-rodape">
        {d.fixa ? `Fixa: Esc ou clique fora fecha${retrato ? '. Clique na imagem pra ver a arte grande' : ''}` : 'Botão direito deixa a dica fixa'}
      </p>
    </div>
  );
}

/** Foto da dica: com a dica fixa, clicar abre a arte em tamanho grande. */
function FotoDica({ src, nome, fixa, className = 'ab-d-foto' }: { src: string; nome: string; fixa: boolean; className?: string }) {
  if (!fixa || !src) return <Foto src={src} nome={nome} className={className} />;
  return (
    <button type="button" className="ab-d-foto-btn" title="Ver a arte grande" aria-label={`Ver a arte de ${nome} grande`}
      onClick={() => abrirImagem({ src, nome })}>
      <Foto src={src} nome={nome} className={className} />
    </button>
  );
}

/** Ao lado do retrato (à direita, senão à esquerda, senão em cima ou embaixo), sempre dentro da janela. */
function posicionar(el: HTMLElement, r: DOMRect) {
  const m = 8, gap = 10;
  const w = el.offsetWidth, h = el.offsetHeight;
  const W = window.innerWidth, H = window.innerHeight;
  let x: number, y: number;
  if (r.right + gap + w <= W - m) x = r.right + gap;
  else if (r.left - gap - w >= m) x = r.left - gap - w;
  else x = -1;
  if (x >= 0) {
    y = Math.min(Math.max(r.top + r.height / 2 - h / 2, m), H - h - m);
  } else {
    x = Math.min(Math.max(r.left + r.width / 2 - w / 2, m), W - w - m);
    y = r.top - gap - h >= m ? r.top - gap - h : Math.min(r.bottom + gap, H - h - m);
  }
  el.style.left = `${Math.round(Math.max(m, x))}px`;
  el.style.top = `${Math.round(Math.max(m, y))}px`;
}

function conteudo(alvo: AlvoDica, e: EstadoTela, fixa: boolean): ReactNode {
  const p = e.partida;
  switch (alvo.tipo) {
    case 'unidade': {
      const u = p?.jogadores.find(j => j.id === alvo.dono)?.unidades[alvo.uid];
      return u ? <DicaUnidade u={u} editavel={alvo.editavel} fixa={fixa} /> : null;
    }
    case 'campeao': {
      const u: Unidade = { uid: -1, campeao: alvo.campeao, estrela: alvo.estrela ?? 1, forma: alvo.forma, itens: [] };
      return <DicaUnidade u={u} editavel={false} fixa={fixa} etiqueta={alvo.etiqueta ?? 'na loja: estrela 1'} segura={alvo.item} />;
    }
    case 'lutador': {
      const rep = e.reproducao;
      const g = rep?.resultado.gravacao;
      if (!rep || !g || !p) return null;
      const l = lutadoresEm(g, rep.t).find(x => x.id === alvo.id);
      if (!l) return null;
      const u = unidadeDoLutador(p, rep.adversario, l);
      if (u && !l.monstro) return <DicaUnidade u={u} editavel={false} luta={l} fixa={fixa} />;
      const s = separarId(l.id);
      const m = s.invocado ? null : /^m(\d+)$/.exec(s.id);
      const mon = l.lado === 'b' && m ? p.monstros[Number(m[1])] : undefined;
      return <DicaMonstro l={l} at={mon?.atributos ?? null} fixa={fixa} />;
    }
    case 'traco':
      return <DicaTraco id={alvo.id} n={alvo.n} nivel={alvo.nivel} />;
    case 'item':
      return <DicaItem id={alvo.id} />;
  }
}

/** jogador dono de um lado da luta (o fantasma é a cópia de outro jogador) */
export function donoDoLado(jogadores: readonly Jogador[], id: string): Jogador | undefined {
  const real = id.replace(/^fantasma:/, '');
  return jogadores.find(j => j.id === real);
}

/** a unidade por trás de um lutador (id da luta `${lado}:${uid}`); null em monstro e invocado */
export function unidadeDoLutador(p: Partida, adversario: string, l: Pick<EstadoVisivel, 'id' | 'lado'>): Unidade | null {
  const s = separarId(l.id);
  if (s.invocado || !/^\d+$/.test(s.id)) return null;
  const dono = donoDoLado(p.jogadores, s.lado === 'a' ? p.voce : adversario);
  return dono?.unidades[Number(s.id)] ?? null;
}

function tentar<T>(f: () => T): T | null {
  try {
    return f();
  } catch {
    return null;
  }
}

/** `editavel`: é sua (dá pra escolher ult e posição); os botões aparecem com a dica fixa (clique na unidade).
 *  `etiqueta`: marca no topo (carta da loja, carrossel); `segura`: item que vem junto (carrossel), fora dos atributos. */
function DicaUnidade({ u, editavel, luta, fixa = false, etiqueta, segura }: {
  u: Unidade; editavel: boolean; luta?: EstadoVisivel; fixa?: boolean; etiqueta?: string; segura?: string;
}) {
  const c = tentar(() => S().campeao(u.campeao));
  const f = formaOuNada(u.forma);
  if (!c || !f) return null;
  const at = tentar(() => atributosDaUnidade(u));
  const hab = tentar(() => habilidadeDa(f, u.ult));
  const ops = tentar(() => opcoesDeUlt(f)) ?? [];
  const ult = u.ult && ops.some(o => o.id === u.ult) ? u.ult : ops[0]?.id;
  const tracos = [f.fr, ...f.classes.filter(x => x !== f.fr)];
  const pos = u.posicao ?? 'ataque';
  const passiva = tentar(() => passivaDe(u.campeao));
  return (
    <>
      <div className="ab-d-topo" {...custoAttr(c.custo)}>
        <FotoDica src={luta ? urlImagem(luta.img) : imgForma(u.forma)} nome={luta?.nome ?? f.nome} fixa={fixa} />
        <div className="ab-d-tit">
          <b className="ab-d-nome">{luta?.nome ?? f.nome}</b>
          <span className="ab-d-sub">
            <Estrelas n={u.estrela} />
            <span className="ab-d-custo" title="Custo"><Moeda />{c.custo}</span>
            {at && <span className="ab-d-alcance"><IconeAlcance alcance={at.alcance} />{at.alcance > 1 ? `de longe (${at.alcance} casas)` : 'de perto'}</span>}
            {c.stand && <span className="ab-tag">Stand</span>}
            {etiqueta && <span className="ab-tag">{etiqueta}</span>}
          </span>
        </div>
      </div>
      {passiva && (
        <p className="ab-d-passiva"><b>Passiva: {passiva.nome}.</b> {passiva.texto}</p>
      )}
      {segura && (
        <ul className="ab-d-itens ab-d-segura" aria-label="Item que vem junto">
          <li><IconeItem id={segura} /><span><b>Vem com {nomeItem(segura)}</b> (vai pros itens soltos). {textoItem(segura)}</span></li>
        </ul>
      )}
      <ul className="ab-d-tracos">
        {tracos.map(id => (
          <li key={id} style={corTraco(id)}>
            <b>{nomeTraco(id)}</b>
            <span>{TRACOS[id]?.descricao ?? (id === 'unicos' ? `${NOME_UNICOS} não é traço: o que conta é a habilidade própria.` : '')}</span>
          </li>
        ))}
      </ul>
      {at && <Atribs at={at} luta={luta} />}
      <section className="ab-d-hab">
        {hab ? (
          <>
            <h4>{hab.nome} <span className="mute">· {hab.mana} de mana</span></h4>
            <p><TextoPorEstrela texto={hab.texto} estrela={u.estrela} /></p>
          </>
        ) : <p className="mute">{f.semUlt ? 'Sem habilidade: esta forma ainda evolui e só ataca.' : 'Sem habilidade: só ataca.'}</p>}
        {ops.length > 1 && (
          <div className="ab-d-ult" role="group" aria-label="Escolha da ult">
            <span className="mute">Ult:</span>
            {editavel && fixa ? ops.map(o => (
              <button key={o.id} type="button" className={'ab-chip' + (o.id === ult ? ' on' : '')} aria-pressed={o.id === ult}
                onClick={() => acoes.escolherUlt(u.uid, o.id)}>{o.nome}</button>
            )) : <b>{ops.find(o => o.id === ult)?.nome}</b>}
          </div>
        )}
        {f.fr === 'ygo' && (
          <div className="ab-d-ult">
            <span className="mute">Posição:</span> <b>{pos === 'ataque' ? 'Ataque' : 'Defesa'}</b>
            {editavel && fixa && u.uid >= 0 && (
              <button type="button" className="ab-chip" onClick={() => acoes.alternarPosicao(u.uid)}>Mudar pra {pos === 'ataque' ? 'defesa' : 'ataque'}</button>
            )}
          </div>
        )}
        {editavel && !fixa && (ops.length > 1 || f.fr === 'ygo') && (
          <p className="ab-d-dica mute">Clique na unidade pra trocar {ops.length > 1 ? 'a ult' : 'a posição'}.</p>
        )}
      </section>
      <LinhaEvolutiva c={c} atual={u.forma} />
      {u.itens.length > 0 && (
        <ul className="ab-d-itens">
          {u.itens.map((id, i) => <li key={i}><IconeItem id={id} /><span><b>{nomeItem(id)}</b> {textoItem(id)}</span></li>)}
        </ul>
      )}
      {u.bonus && (u.bonus.vida || u.bonus.dano) ? (
        <p className="ab-d-bonus">Bônus da partida: {[u.bonus.vida ? `+${pct(u.bonus.vida)} de vida` : '', u.bonus.dano ? `+${pct(u.bonus.dano)} de dano` : ''].filter(Boolean).join(', ')}</p>
      ) : null}
      {f.info.length > 0 && (
        <dl className="ab-d-info">
          {f.info.map(i => <Fragment key={i.rotulo}><dt>{i.rotulo}</dt><dd>{i.valor}</dd></Fragment>)}
        </dl>
      )}
    </>
  );
}

function Atribs({ at, luta }: { at: Atributos; luta?: EstadoVisivel }) {
  const linhas: [string, string][] = [
    ['Vida', luta ? `${num(luta.vida)} / ${num(luta.vidaMax)}` : num(at.vida)],
    ['Dano', num(at.dano)],
    ['Armadura', num(at.armadura)],
    ['Resistência', num(at.resist)],
    ['Vel. ataque', num(at.velAtaque, 2)],
    ['Alcance', at.alcance > 1 ? `${num(at.alcance)} (longe)` : '1 (perto)'],
    ['Mana', luta ? `${num(luta.mana)} / ${num(luta.manaMax)}` : `${num(at.manaInicial)} / ${num(at.mana)}`],
    ['Crítico', `${pct(at.critChance)} (×${num(at.critDano, 2)})`],
  ];
  if (luta && luta.escudo > 0) linhas.splice(1, 0, ['Escudo', num(luta.escudo)]);
  return (
    <dl className="ab-d-at">
      {linhas.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}
    </dl>
  );
}

const unicos = (xs: string[]) => [...new Set(xs)];

/** Retratinhos de cada nível (alternativas lado a lado), a forma atual marcada e a transformação da ult. */
function LinhaEvolutiva({ c, atual }: { c: CampeaoDados; atual: string }) {
  const niveis = c.niveis;
  const ultimo = niveis[niveis.length - 1] ?? [];
  const finais = ultimo.includes(atual) ? [atual] : ultimo;
  const passo1 = unicos(finais.flatMap(id => formaOuNada(id)?.transforma ?? []));
  const passo2 = unicos(passo1.flatMap(id => formaOuNada(id)?.transforma ?? [])).filter(id => !passo1.includes(id));
  if (niveis.length <= 1 && !passo1.length) return null;
  const rotulo = (i: number) => (i === niveis.length - 1 && niveis.length < 3 ? `★${i + 1}–3` : `★${i + 1}`);
  const mini = (id: string) => {
    const f = formaOuNada(id);
    return (
      <span key={id} className={'ab-mini' + (id === atual ? ' atual' : '')} title={f?.nome ?? id}>
        <Foto src={imgForma(id)} nome={f?.nome ?? id} className="redonda" />
      </span>
    );
  };
  return (
    <section className="ab-d-linha">
      <h4>{niveis.length > 1 ? 'Linha evolutiva' : 'Transformação'}</h4>
      <div className="ab-d-lin">
        {niveis.length > 1 && niveis.map((nv, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="seta" aria-hidden="true">›</span>}
            <span className="nivel">
              <span className="formas">{nv.map(mini)}</span>
              <small>{rotulo(i)}{nv.length > 1 ? ' · escolha' : ''}</small>
            </span>
          </Fragment>
        ))}
        {passo1.length > 0 && (
          <>
            <span className="seta ult" aria-hidden="true">›</span>
            <span className="nivel">
              <span className="formas">{passo1.map(mini)}</span>
              <small>ult</small>
            </span>
          </>
        )}
        {passo2.length > 0 && (
          <>
            <span className="seta ult" aria-hidden="true">›</span>
            <span className="nivel">
              <span className="formas">{passo2.map(mini)}</span>
              <small>ult de novo</small>
            </span>
          </>
        )}
      </div>
    </section>
  );
}

function DicaMonstro({ l, at, fixa }: { l: EstadoVisivel; at: Atributos | null; fixa: boolean }) {
  return (
    <>
      <div className="ab-d-topo monstro" {...custoAttr(l.custo)}>
        <FotoDica src={urlImagem(l.img)} nome={l.nome} fixa={fixa} />
        <div className="ab-d-tit">
          <b className="ab-d-nome">{l.nome}</b>
          <span className="ab-d-sub">
            <span className="ab-tag">{l.chefe ? 'Chefe do Final Fantasy' : l.monstro ? (l.lado === 'a' ? 'Invocado (Final Fantasy)' : 'Monstro do Final Fantasy') : 'Invocado'}</span>
          </span>
        </div>
      </div>
      {at ? <Atribs at={at} luta={l} /> : (
        <dl className="ab-d-at">
          <dt>Vida</dt><dd>{num(l.vida)} / {num(l.vidaMax)}</dd>
          <dt>Mana</dt><dd>{num(l.mana)} / {num(l.manaMax)}</dd>
          {l.escudo > 0 && <><dt>Escudo</dt><dd>{num(l.escudo)}</dd></>}
        </dl>
      )}
    </>
  );
}

function DicaTraco({ id, n, nivel }: { id: string; n: number; nivel: number }) {
  const t = TRACOS[id];
  if (!t) return null;
  return (
    <>
      <div className="ab-d-traco" style={corTraco(id)}>
        <b className="ab-d-nome">{t.nome}</b>
        <span className="mute">{n} {n === 1 ? 'campeão' : 'campeões'}{nivel >= 0 ? ` · degrau ${nivel + 1} ativo` : ' · inativo'}</span>
      </div>
      <p className="ab-d-desc">{t.descricao}</p>
      {t.degraus.length > 0 && (
        <ol className="ab-d-degraus">
          {t.degraus.map((d, k) => (
            <li key={k} className={k === nivel ? 'on' : k < nivel ? 'feito' : undefined}>
              <b>({d})</b> {t.textos[k] ?? ''}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function DicaItem({ id }: { id: string }) {
  const partes = partesItem(id);
  return (
    <>
      <div className="ab-d-item">
        <IconeItem id={id} />
        <b className="ab-d-nome">{nomeItem(id)}</b>
      </div>
      <p className="ab-d-desc">{textoItem(id)}</p>
      {partes.length > 1 && <p className="mute ab-d-receita">{partes.map(nomeItem).join(' + ')}</p>}
      {partes.length === 1 && (
        <p className="mute ab-d-receita">
          Componente: arraste pra uma unidade, ou solte em cima de outro componente nos itens soltos. Dois componentes viram um Bakugan completo.
        </p>
      )}
    </>
  );
}

/** A arte em tamanho grande (clique na foto da dica fixa): fecha com Esc ou clique. */
export function ImagemGrandeJanela() {
  const img = useImagemGrande();
  useEffect(() => {
    if (!img) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') abrirImagem(null); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [img]);
  if (!img) return null;
  return (
    <div id="abImagem" className="ab-imagem" role="dialog" aria-modal="true" aria-label={img.nome} onClick={() => abrirImagem(null)}>
      <figure>
        <img src={img.src} alt={img.nome} />
        <figcaption>{img.nome} <small>(clique ou Esc fecha)</small></figcaption>
      </figure>
    </div>
  );
}

