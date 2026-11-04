// Barra de baixo: ouro (com juros e sequência), nível e XP, chances da loja, comprar XP, atualizar, travar e as 7
// cartas. Cada carta mostra o retrato inteiro, o custo, todos os traços em etiquetas coloridas (até duas linhas),
// quantas cópias você já tem e se a compra evolui. Campeão que você já tem (banco ou tabuleiro) ganha um anel dourado
// pulsando em volta da carta; se a compra fecha uma evolução, o anel gira e brilha mais forte, com o ★★ ou ★★★ no
// meio. Soltar uma peça aqui vende.
import { useLayoutEffect, useRef, useState } from 'react';
import type { Jogador } from '../../autobatalha/tipos';
import { S } from '../../autobatalha/dados';
import { acoes } from '../../autobatalha/controle';
import { CUSTO_ATUALIZAR, CUSTO_XP, JUROS_MAX, bonusSequencia, chancesLoja, juros, valorVenda, xpParaProximo } from '../../autobatalha/partida';
import { propsDica, useArrasto } from './interacao';
import { usePlanoAtivo } from './planos';
import { atributosDe } from './Tabuleiro';
import { IconeAlcance, LETRAS_NOME_COMPRIDO, Moeda, corTraco, custoAttr, formaOuNada, imgForma, nomeCurtoTraco, nomeTraco, pct, plural } from './comum';

/** a estrela que a compra fecha (1 = não evolui nada) */
function estrelaAoComprar(j: Jogador, campeao: string): number {
  const us = Object.values(j.unidades).filter(u => u.campeao === campeao);
  if (us.filter(u => u.estrela === 1).length + 1 < 3) return 1;
  return us.filter(u => u.estrela === 2).length + 1 >= 3 ? 3 : 2;
}

/** cópias que o jogador tem do campeão (banco e tabuleiro), por estrela */
function copiasDe(j: Jogador, campeao: string): [number, number, number] {
  const us = Object.values(j.unidades).filter(u => u.campeao === campeao);
  const de = (e: number) => us.filter(u => u.estrela === e).length;
  return [de(1), de(2), de(3)];
}

/** Destaque da vaga da loja (data-destaque no item da lista, que desenha o anel em volta da carta): 'evolui2' ou
 *  'evolui3' = a compra fecha a evolução; 'tem' = você já tem o campeão; sem = nenhum. */
function destaqueDe(j: Jogador, campeao: string): string | undefined {
  const evolui = estrelaAoComprar(j, campeao);
  if (evolui > 1) return `evolui${evolui}`;
  return copiasDe(j, campeao).some(n => n > 0) ? 'tem' : undefined;
}

export function Loja({ eu, editavel }: { eu: Jogador; editavel: boolean }) {
  const arr = useArrasto();
  const plano = usePlanoAtivo();
  const proximo = xpParaProximo(eu.nivel);
  const chances = chancesLoja(eu.nivel);
  const formas = eu.lojaFormas;
  const vendendo = arr?.tipo === 'unidade' ? eu.unidades[arr.uid] : undefined;
  const j = juros(eu.ouro);
  const seq = eu.sequencia;
  const bonus = bonusSequencia(seq);
  const faltaJuros = j < JUROS_MAX ? 10 - (eu.ouro % 10) : 0;
  return (
    <div id="abLoja" className={'ab-loja' + (vendendo ? ' vender' : '')} data-solta={editavel ? 'loja' : undefined}>
      <div className="ab-eco">
        <div className="ab-eco-l1">
          <span className="ab-ouro" title="Ouro"><Moeda /><b id="abOuro">{eu.ouro}</b></span>
          <span id="abJuros" className={'ab-pilula juros' + (j ? ' on' : '')}
            title={`Juros: +1 de ouro a cada 10 guardados (até ${JUROS_MAX}), no começo da rodada${faltaJuros ? `. Faltam ${faltaJuros} pro próximo` : ''}`}>
            +{j} juros
          </span>
          {Math.abs(seq) >= 2 && (
            <span id="abSequencia" className={'ab-pilula seq ' + (seq > 0 ? 'vit' : 'der')}
              title={`${plural(Math.abs(seq), seq > 0 ? 'vitória seguida' : 'derrota seguida', seq > 0 ? 'vitórias seguidas' : 'derrotas seguidas')}: +${bonus} de ouro por rodada`}>
              <Chama />{Math.abs(seq)} {seq > 0 ? 'V' : 'D'} +{bonus}
            </span>
          )}
        </div>
        <div className="ab-eco-l2">
          <span className="ab-nivel">Nível <b id="abNivel">{eu.nivel}</b></span>
          <span className="ab-xp-txt mute">{proximo ? `${eu.xp}/${proximo} XP` : 'nível máximo'}</span>
        </div>
        <div className="ab-xp" aria-hidden="true"><i style={{ width: proximo ? pct(Math.min(1, eu.xp / proximo)) : '100%' }} /></div>
        <div className="ab-chances" title="Chance de cada custo na loja, neste nível">
          {chances.map((p, i) => <span key={i} {...custoAttr(i + 1)} className={p > 0 ? undefined : 'zero'}>{pct(p)}</span>)}
        </div>
        <div className="ab-botoes">
          <button type="button" id="abXp" className={'btn' + (eu.ouro < CUSTO_XP ? ' falta' : '')} disabled={!editavel || !proximo}
            title="Comprar XP (tecla F)" onClick={() => acoes.comprarXp()}>
            XP <span className="preco"><Moeda />{CUSTO_XP}</span>
          </button>
          <button type="button" id="abAtualizar" className={'btn' + (eu.ouro < CUSTO_ATUALIZAR ? ' falta' : '')} disabled={!editavel}
            title="Atualizar a loja (tecla D)" onClick={() => acoes.atualizarLoja()}>
            Atualizar <span className="preco"><Moeda />{CUSTO_ATUALIZAR}</span>
          </button>
          <button type="button" id="abTravar" className={'btn ab-travar' + (eu.lojaTravada ? ' on' : '')} disabled={!editavel} aria-pressed={eu.lojaTravada}
            title={eu.lojaTravada ? 'Loja travada: não muda na próxima rodada. Clique pra destravar' : 'Travar a loja na próxima rodada'} onClick={() => acoes.travarLoja()}>
            <Cadeado fechado={eu.lojaTravada} /><span className="sr">{eu.lojaTravada ? 'Destravar' : 'Travar'}</span>
          </button>
        </div>
      </div>
      <ol id="abCartas" className="ab-cartas">
        {eu.loja.map((id, i) => (
          <li key={i} data-destaque={id ? destaqueDe(eu, id) : undefined}>
            {id ? (
              <Carta id={id} i={i} forma={formas?.[i] ?? S().formaPadrao(id, 1)} eu={eu} noPlano={plano.has(id)} editavel={editavel} />
            ) : <div className={'ab-carta vazia' + (i === 6 ? ' do-time' : '')} aria-label="Vaga vazia" />}
          </li>
        ))}
      </ol>
      {vendendo && (
        <div className="ab-vender" aria-live="polite">
          Solte aqui pra vender {formaOuNada(vendendo.forma)?.nome ?? ''} por <Moeda /><b>{valorVenda(vendendo)}</b>
        </div>
      )}
    </div>
  );
}

function Carta({ id, i, forma, eu, noPlano, editavel }: { id: string; i: number; forma: string; eu: Jogador; noPlano: boolean; editavel: boolean }) {
  const c = S().campeao(id);
  const f = formaOuNada(forma);
  const classes = (f?.classes ?? []).filter(x => x !== c.fr && x !== 'unicos');
  const evolui = estrelaAoComprar(eu, id);
  const [n1, n2, n3] = copiasDe(eu, id);
  const time = i === 6;
  const alcance = atributosDe({ uid: -1, campeao: id, estrela: 1, forma, itens: [] })?.alcance;
  const tem = n1 + n2 + n3 > 0;
  const quantas = [
    n1 ? plural(n1, 'cópia de estrela 1', 'cópias de estrela 1') : '',
    n2 ? plural(n2, 'de estrela 2', 'de estrela 2') : '',
    n3 ? plural(n3, 'de estrela 3', 'de estrela 3') : '',
  ].filter(Boolean).join(' e ');
  return (
    <button type="button" className={'ab-carta' + (time ? ' do-time' : '') + (noPlano ? ' no-plano' : '') + (tem ? ' tem' : '') + (evolui > 1 ? ' evolui' : '')} {...custoAttr(c.custo)}
      data-campeao={id} disabled={!editavel} onClick={() => acoes.comprar(i)} {...propsDica({ tipo: 'campeao', campeao: id, forma })}
      aria-label={`Comprar ${f?.nome ?? c.nome} por ${c.custo} de ouro`}>
      <span className="retrato">
        <img src={imgForma(forma)} alt="" draggable={false} decoding="async" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
        {alcance != null && <IconeAlcance alcance={alcance} />}
      </span>
      <span className="marcas">
        {noPlano && <span className="marca plano" title="No plano ativo do planejador">plano</span>}
        {time && <span className="marca time" title="Vaga do time: campeão que divide origem ou classe com o seu tabuleiro">time</span>}
        {tem && (
          <span className="marca copias" data-copias={n1} title={`Você tem ${quantas}`}>
            {[0, 1, 2].map(k => <i key={k} className={k < n1 ? 'on' : undefined} />)}
            {n2 > 0 && <small>★★{n2 > 1 ? `×${n2}` : ''}</small>}
            {n3 > 0 && <small>★★★{n3 > 1 ? `×${n3}` : ''}</small>}
          </span>
        )}
      </span>
      {evolui > 1 && <span className="ab-evolui" title={`Comprar fecha 3 cópias: vira estrela ${evolui}`}>{'★'.repeat(evolui)}</span>}
      <span className="faixa">
        <b className="nome">{f?.nome ?? c.nome}</b>
        <span className="custo"><Moeda />{c.custo}</span>
      </span>
      <Etiquetas key={[c.fr, ...classes].join()} origem={c.fr} classes={classes} />
    </button>
  );
}

const comprido = (id: string) => nomeTraco(id).length > LETRAS_NOME_COMPRIDO;

/** Etiquetas dos traços da carta, todas visíveis em até duas linhas: a origem primeiro e os nomes compridos no fim
 *  (sozinhos numa linha, quebram melhor). Se ainda passar das duas linhas (4 traços com um comprido), os compridos
 *  viram o nome curto, com o inteiro no title; se nem assim couber (fonte mais larga em outro sistema), a letra diminui
 *  em dois passos. Muda de campeão = componente novo (key), que mede de novo. */
function Etiquetas({ origem, classes }: { origem: string; classes: string[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  /** 0 = normal; 1 = nomes compridos encurtados; 2 e 3 = também letra menor */
  const [aperto, setAperto] = useState(0);
  const curto = aperto > 0;
  const ordem = [...classes.filter(x => !comprido(x)), ...classes.filter(comprido)];
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || aperto >= 3) return;
    const conferir = () => { if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) setAperto(aperto + 1); };
    conferir();
    // a fonte do site pode chegar depois da primeira medida
    let vivo = true;
    void document.fonts?.ready.then(() => { if (vivo) conferir(); });
    return () => { vivo = false; };
  }, [aperto]);
  const etiqueta = (id: string, origemDaCarta: boolean) => {
    const encurta = curto && comprido(id);
    return (
      <span key={id} className={'ab-etq' + (origemDaCarta ? ' origem' : '')} style={corTraco(id)} title={encurta ? nomeTraco(id) : undefined}>
        {encurta ? nomeCurtoTraco(id) : nomeTraco(id)}
      </span>
    );
  };
  return (
    <span ref={ref} className="tracos" data-curto={curto || undefined} data-aperto={aperto > 1 ? aperto : undefined}>
      {etiqueta(origem, true)}
      {ordem.map(x => etiqueta(x, false))}
    </span>
  );
}

function Cadeado({ fechado }: { fechado: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <rect x="4" y="9" width="12" height="9" rx="2" fill="currentColor" />
      <path d={fechado ? 'M7 9V6a3 3 0 0 1 6 0v3' : 'M7 9V6a3 3 0 0 1 6 0'} stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Chaminha da sequência (vitórias ou derrotas seguidas). */
function Chama() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path d="M8 1.5c.6 2.4 3.6 3.9 3.6 7.6A3.6 3.6 0 0 1 8 12.8a3.6 3.6 0 0 1-3.6-3.7c0-1.6.8-2.5 1.6-3.3.1 1.2.7 1.9 1.4 2.1C7.3 6 7.1 3.6 8 1.5z" fill="currentColor" />
    </svg>
  );
}
