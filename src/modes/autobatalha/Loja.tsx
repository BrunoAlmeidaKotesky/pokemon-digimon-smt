// Barra de baixo: ouro, nível e XP, chances da loja, comprar XP, atualizar, travar e as 7 cartas. Soltar uma peça
// aqui vende.
import type { Jogador } from '../../autobatalha/tipos';
import { S } from '../../autobatalha/dados';
import { acoes } from '../../autobatalha/controle';
import { CUSTO_ATUALIZAR, CUSTO_XP, chancesLoja, valorVenda, xpParaProximo } from '../../autobatalha/partida';
import { propsDica, useArrasto } from './interacao';
import { usePlanoAtivo } from './planos';
import { Moeda, corTraco, custoAttr, formaOuNada, imgForma, nomeTraco, pct } from './comum';

/** a estrela que a compra fecha (1 = não evolui nada) */
function estrelaAoComprar(j: Jogador, campeao: string): number {
  const us = Object.values(j.unidades).filter(u => u.campeao === campeao);
  if (us.filter(u => u.estrela === 1).length + 1 < 3) return 1;
  return us.filter(u => u.estrela === 2).length + 1 >= 3 ? 3 : 2;
}

export function Loja({ eu, editavel }: { eu: Jogador; editavel: boolean }) {
  const arr = useArrasto();
  const plano = usePlanoAtivo();
  const proximo = xpParaProximo(eu.nivel);
  const chances = chancesLoja(eu.nivel);
  const formas = eu.lojaFormas;
  const vendendo = arr?.tipo === 'unidade' ? eu.unidades[arr.uid] : undefined;
  return (
    <div id="abLoja" className={'ab-loja' + (vendendo ? ' vender' : '')} data-solta={editavel ? 'loja' : undefined}>
      <div className="ab-eco">
        <div className="ab-eco-l1">
          <span className="ab-ouro" title="Ouro"><Moeda /><b id="abOuro">{eu.ouro}</b></span>
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
            Comprar XP <span className="preco"><Moeda />{CUSTO_XP}</span>
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
          <li key={i}>
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
  const classes = (f?.classes ?? []).filter(x => x !== c.fr);
  const evolui = estrelaAoComprar(eu, id);
  const time = i === 6;
  return (
    <button type="button" className={'ab-carta' + (time ? ' do-time' : '') + (noPlano ? ' no-plano' : '')} {...custoAttr(c.custo)}
      data-campeao={id} disabled={!editavel} onClick={() => acoes.comprar(i)} {...propsDica({ tipo: 'campeao', campeao: id, forma })}
      aria-label={`Comprar ${f?.nome ?? c.nome} por ${c.custo} de ouro`}>
      <span className="retrato">
        <img src={imgForma(forma)} alt="" draggable={false} decoding="async" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
      </span>
      <span className="marcas">
        {noPlano && <span className="marca plano" title="No plano ativo do planejador">plano</span>}
        {evolui > 1 && <span className="marca evolui" title={`Comprar fecha 3 cópias: vira estrela ${evolui}`}>{'★'.repeat(evolui)}</span>}
        {time && <span className="marca time" title="Vaga do time: campeão que divide origem ou classe com o seu tabuleiro">time</span>}
      </span>
      <span className="faixa">
        <b className="nome">{f?.nome ?? c.nome}</b>
        <span className="custo"><Moeda />{c.custo}</span>
      </span>
      <span className="tracos">
        <span className="origem" style={corTraco(c.fr)}>{nomeTraco(c.fr)}</span>
        {classes.map(x => <span key={x} className="classe">{nomeTraco(x)}</span>)}
      </span>
    </button>
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
