// Laterais da partida: traços do tabuleiro (esquerda) e os 8 jogadores com a vida (direita).
import type { Jogador, Partida } from '../../autobatalha/tipos';
import { urlImagem } from '../../autobatalha/dados';
import { acoes } from '../../autobatalha/controle';
import { unidadesNoTabuleiro } from '../../autobatalha/partida';
import { TRACOS, contarTracos, type TracoAtivo } from '../../autobatalha/conteudo';
import { propsDica } from './interacao';
import { Foto, corTraco, formaOuNada, imgForma } from './comum';

/** ativos primeiro (degrau mais alto, depois mais campeões), depois os inativos pelos que faltam menos */
export function ordenarTracos(ts: readonly TracoAtivo[]): TracoAtivo[] {
  const falta = (t: TracoAtivo) => (TRACOS[t.id]?.degraus[0] ?? 99) - t.n;
  return ts.filter(t => TRACOS[t.id]).sort((a, b) => {
    const aa = a.nivel >= 0 ? 1 : 0, bb = b.nivel >= 0 ? 1 : 0;
    if (aa !== bb) return bb - aa;
    if (aa) return b.nivel - a.nivel || b.n - a.n;
    return falta(a) - falta(b) || b.n - a.n;
  });
}

/** Lista de traços com contagem e degraus; `vazio` = texto quando não há nenhum. */
export function ListaTracos({ tracos, vazio }: { tracos: readonly TracoAtivo[]; vazio: string }) {
  const lista = ordenarTracos(tracos);
  if (!lista.length) return <p className="ab-vazio">{vazio}</p>;
  return (
    <ul className="ab-lista-tracos">
      {lista.map(t => {
        const tr = TRACOS[t.id]!;
        const ativo = t.nivel >= 0;
        const prox = tr.degraus.find(d => d > t.n);
        return (
          <li key={t.id} className={'ab-traco' + (ativo ? ` ativo n${Math.min(t.nivel, 3)}` : '')} data-traco={t.id} style={corTraco(t.id)}
            {...propsDica({ tipo: 'traco', id: t.id, n: t.n, nivel: t.nivel })}>
            <span className="ab-hexn">{t.n}</span>
            <span className="nm">{tr.nome}</span>
            <span className="dg" aria-label={prox ? `próximo degrau: ${prox}` : 'degrau máximo'}>
              {tr.degraus.map((d, k) => <span key={k} className={k <= t.nivel ? 'on' : undefined}>{d}</span>)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Tracos({ j }: { j: Jogador }) {
  const unidades = unidadesNoTabuleiro(j, true);
  const tracos = contarTracos(unidades.map(u => ({ campeao: u.campeao, forma: u.forma })));
  return (
    <aside id="abTracos" className="ab-lado ab-tracos" aria-label="Traços">
      <h3>Traços</h3>
      <ListaTracos tracos={tracos} vazio="Ponha campeões no tabuleiro pra ver os traços." />
    </aside>
  );
}

const avatar = (j: Jogador) => (formaOuNada(j.avatar) ? imgForma(j.avatar) : j.avatar ? urlImagem(j.avatar) : '');

export function Jogadores({ partida, olhando }: { partida: Partida; olhando: string | null }) {
  const vivo = (j: Jogador) => (j.vida > 0 && j.colocacao == null) || j.colocacao === 1;
  const ordem = [...partida.jogadores].sort((a, b) => Number(vivo(b)) - Number(vivo(a)) || b.vida - a.vida || (a.colocacao ?? 9) - (b.colocacao ?? 9));
  const conf = partida.confrontos.find(c => c.includes(partida.voce));
  const adv = conf ? (conf[0] === partida.voce ? conf[1] : conf[0]).replace(/^fantasma:/, '') : null;
  const vendo = olhando ?? partida.voce;
  return (
    <aside id="abJogadores" className="ab-lado ab-jogadores" aria-label="Jogadores">
      <h3>Jogadores</h3>
      <ol>
        {ordem.map(j => {
          const eu = j.id === partida.voce;
          const fora = !vivo(j);
          return (
            <li key={j.id}>
              <button type="button" className={'ab-jog' + (eu ? ' eu' : '') + (fora ? ' fora' : '') + (j.id === vendo ? ' vendo' : '') + (j.id === adv ? ' adv' : '')}
                data-jogador={j.id} aria-pressed={j.id === vendo} title={eu ? 'Seu tabuleiro' : `Ver o tabuleiro de ${j.nome}`}
                onClick={() => acoes.olhar(eu ? null : j.id)}>
                <Foto src={avatar(j)} nome={j.nome} className="redonda" />
                <span className="txt">
                  <span className="nm">{j.nome}{eu && <small> (você)</small>}</span>
                  <span className="vida-bar" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(100, j.vida))}%` }} /></span>
                </span>
                <span className="vida">{fora && j.colocacao ? `${j.colocacao}º` : Math.max(0, j.vida)}</span>
                {j.id === adv && !fora && <span className="ab-tag adv" title="Adversário desta rodada">vs</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
