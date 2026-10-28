// Subaba "Custos": quantos campeões (dos marcados) há em cada custo da loja, de 1 a 5, contra a meta, no total e em
// cada origem; avisa o que passou do limite e pra onde dá pra passar. O custo de cada um se dá na lista da franquia.
import { label } from '../../state/app';
import * as cat from '../../catalog/store';
import { NAO_SAO_CAMPEOES, PROPORCAO, avisos, campeoesDe, situacao, type Cota } from '../../catalog/custos';
import { SEM } from '../../catalog/model';
import { plural, style } from './comum';

/** Abre a lista da franquia (marcados, vista Personagens) com o filtro de custo ('' = todos; SEM = sem custo). */
function verNaLista(k: string, custo: string) {
  cat.mudarFiltros(k, { custo });
  cat.escolherGrupo('marcados');
  cat.escolherVista('personagens');
  cat.escolherFranquia(k);
}

const estado = (c: Cota) => (c.tem > c.max ? 'acima' : c.tem < c.min ? 'abaixo' : 'ok');
const TITULO = { acima: 'acima do limite', abaixo: 'abaixo da meta', ok: 'dentro da faixa' } as const;

export function PainelCustos({ frs }: { frs: readonly string[] }) {
  const origens = frs.filter(k => !NAO_SAO_CAMPEOES.includes(k))
    .map(k => ({ k, rotulo: label(k), cs: campeoesDe(cat.marcados(k), cat.linhasDe(k), cat.unidadesDe(k)) }))
    .filter(o => o.cs.length);
  const total = situacao(origens.flatMap(o => o.cs));
  const porOrigem = origens.map(o => ({ k: o.k, rotulo: o.rotulo, s: situacao(o.cs) }));
  const avs = avisos(total, porOrigem);

  return (
    <div id="catCustos" className="panel stack cat-custos" role="tabpanel" aria-label="Custos">
      <div>
        <h2 style={{ margin: 0 }}>Custos do Set 1</h2>
        <p className="mute" style={{ margin: 0 }}>
          Dê o custo na loja (1 a 5) a cada campeão na lista da franquia. Linha evolutiva é um campeão só, e o custo dela
          fica na 1ª forma. Aqui está quanto cabe em cada custo, no total e em cada origem, contando os marcados. A meta
          segue a proporção do TFT ({PROPORCAO.join('/')}); a faixa aceita 10% pra mais ou pra menos (no mínimo 1).
        </p>
      </div>
      {!total.total ? (
        <p id="catCustosVazio" className="mute">Ninguém marcado ainda: os custos contam os campeões do grupo Marcados.</p>
      ) : (
        <>
          <p id="catCustosResumo" style={{ margin: 0 }}>
            <b>{total.total - total.semCusto}</b> de {plural(total.total, 'campeão', 'campeões')} com custo
            {total.semCusto ? `; faltam ${total.semCusto}.` : '.'}
          </p>
          <table id="catCustosTotal" className="custos-tab">
            <thead><tr><th>Custo</th><th>Campeões</th><th>Meta</th><th>Faixa</th></tr></thead>
            <tbody>
              {total.cotas.map(c => (
                <tr key={c.custo} data-custo={c.custo}>
                  <th scope="row">{c.custo}</th>
                  <td className={'custo-cel ' + estado(c)} title={TITULO[estado(c)]}>{c.tem}</td>
                  <td>{c.meta}</td>
                  <td className="mute">{c.min} a {c.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {avs.length ? (
            <ul id="catCustosAvisos" className="custos-avisos">
              {avs.map(a => <li key={a.texto} data-fr={a.k}>{a.texto}</li>)}
            </ul>
          ) : <p id="catCustosAvisos" className="mute" style={{ margin: 0 }}>Nenhum custo passou do limite.</p>}
          <div className="custos-scroll">
            <table id="catCustosOrigens" className="custos-tab">
              <thead>
                <tr><th>Origem</th><th>Campeões</th><th>Sem custo</th>{total.cotas.map(c => <th key={c.custo}>Custo {c.custo}</th>)}</tr>
              </thead>
              <tbody>
                {porOrigem.map(({ k, rotulo, s }) => (
                  <tr key={k} data-fr={k} style={style(k)}>
                    <th scope="row"><span className="dot" aria-hidden="true" />{rotulo}</th>
                    <td>{s.total}</td>
                    <td>
                      {s.semCusto ? (
                        <button type="button" className="custo-ir" title={`Ver os sem custo de ${rotulo}`} onClick={() => verNaLista(k, SEM)}>{s.semCusto}</button>
                      ) : '0'}
                    </td>
                    {s.cotas.map(c => (
                      <td key={c.custo} className={'custo-cel ' + estado(c)} title={`${TITULO[estado(c)]}: meta ${c.meta}, faixa de ${c.min} a ${c.max}`}>
                        <button type="button" className="custo-ir" onClick={() => verNaLista(k, String(c.custo))}>{c.tem}<span className="mute">/{c.meta}</span></button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
