// Janela do lobby pra escolher o seu ícone: a grade de todos os personagens do set (cada forma uma vez, inclusive as
// de transformação), retratos redondos, com busca por nome, origem (franquia) e custo. Clicar escolhe e fecha. A lista
// e os filtros são funções puras em src/autobatalha/icones.ts.
import { useEffect, useMemo, useState } from 'react';
import { ORIGENS, type Custo } from '../../autobatalha/tipos';
import { S, urlImagem } from '../../autobatalha/dados';
import { acoes } from '../../autobatalha/sessao';
import { FILTRO_ICONES_VAZIO, filtrarIcones, iconesDoSet, type FiltroIcones } from '../../autobatalha/icones';
import { Foto, Moeda, corTraco, custoAttr, nomeTraco, plural } from './comum';

const CUSTOS: Custo[] = [1, 2, 3, 4, 5];

export function JanelaIcones({ atual, fechar }: { atual: string | null; fechar: () => void }) {
  const set = S();
  const todos = useMemo(() => iconesDoSet(set), [set]);
  const [filtro, setFiltro] = useState<FiltroIcones>(FILTRO_ICONES_VAZIO);
  const lista = useMemo(() => filtrarIcones(todos, filtro), [todos, filtro]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [fechar]);

  const escolher = (forma: string) => {
    acoes.escolher({ avatar: forma });
    fechar();
  };
  const alternarCusto = (c: Custo) =>
    setFiltro(f => ({ ...f, custos: f.custos.includes(c) ? f.custos.filter(x => x !== c) : [...f.custos, c] }));

  return (
    <div className="ab-sobreposto" onPointerDown={e => { if (e.target === e.currentTarget) fechar(); }}>
      <div id="abIcones" className="ab-icones panel" role="dialog" aria-modal="true" aria-label="Escolher o seu ícone">
        <div className="ab-janela-cab">
          <h3>Escolha o seu ícone</h3>
          <span id="abIconesConta" className="mute">{plural(lista.length, 'personagem', 'personagens')}</span>
          <button type="button" id="abIconesFechar" className="btn mini" onClick={fechar}>Fechar</button>
        </div>
        <div className="ab-icones-filtros">
          <input id="abIconeBusca" type="search" placeholder="Buscar pelo nome" aria-label="Buscar personagem" value={filtro.busca} autoFocus
            onChange={e => setFiltro({ ...filtro, busca: e.target.value })} />
          <span className="ab-plan-custos" role="group" aria-label="Custo">
            {CUSTOS.map(c => {
              const on = filtro.custos.includes(c);
              return (
                <button key={c} type="button" className={'ab-chip custo' + (on ? ' on' : '')} {...custoAttr(c)} aria-pressed={on}
                  title={`Custo ${c}`} onClick={() => alternarCusto(c)}>
                  <Moeda />{c}
                </button>
              );
            })}
          </span>
        </div>
        <div id="abIconeOrigens" className="ab-icones-origens" role="group" aria-label="Origem">
          <button type="button" className={'ab-chip' + (!filtro.origem ? ' on' : '')} data-origem="" aria-pressed={!filtro.origem}
            onClick={() => setFiltro({ ...filtro, origem: '' })}>Todas</button>
          {ORIGENS.map(o => {
            const on = filtro.origem === o;
            return (
              <button key={o} type="button" className={'ab-chip origem' + (on ? ' on' : '')} style={corTraco(o)} data-origem={o} aria-pressed={on}
                onClick={() => setFiltro({ ...filtro, origem: on ? '' : o })}>
                {nomeTraco(o)}
              </button>
            );
          })}
        </div>
        <ul id="abIconeGrade" className="ab-icones-grade">
          {lista.map(i => {
            const on = i.forma === atual;
            return (
              <li key={i.forma}>
                <button type="button" className={'ab-icone' + (on ? ' on' : '')} data-forma={i.forma} data-origem={i.fr} {...(i.custo ? custoAttr(i.custo) : {})}
                  aria-pressed={on} title={i.nome + (i.transformacao ? ' (transformação)' : '')} onClick={() => escolher(i.forma)}>
                  <Foto src={urlImagem(i.img)} nome={i.nome} className="redonda" preguicosa />
                  <span className="nm">{i.nome}</span>
                </button>
              </li>
            );
          })}
          {!lista.length && <li className="mute ab-icones-vazio">Ninguém com esses filtros.</li>}
        </ul>
      </div>
    </div>
  );
}
