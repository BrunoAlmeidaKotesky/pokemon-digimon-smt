// Laterais da partida: traços do tabuleiro (esquerda) e os 8 jogadores com a vida (direita; no planejamento, um ✓ em
// quem já votou "Pronto").
// Traço: hexágono na forma do degrau (bronze, prata, ouro, prisma) com a cor do traço, os degraus com o atual em
// destaque e a barra até o próximo. Passar o mouse destaca no tabuleiro as unidades do traço; o botão ao lado abre a
// lista dos campeões dele (os seus destacados).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Jogador, Partida } from '../../autobatalha/tipos';
import { acoes } from '../../autobatalha/sessao';
import { unidadesNoTabuleiro } from '../../autobatalha/partida';
import { TRACOS, contarTracos, type TracoAtivo } from '../../autobatalha/conteudo';
import { fecharDica, focarTraco, propsDica, useTracoEmFoco } from './interacao';
import { CampeoesDoTraco, type AbaInfo } from './Info';
import { Foto, MarcaDegrau, avatarDe, corTraco } from './comum';

export { avatarDe } from './comum';

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

/** Lista de traços com contagem e degraus; `vazio` = texto quando não há nenhum. `verCampeoes` liga o botão da lista
 *  de campeões de cada traço. */
export function ListaTracos({ tracos, vazio, verCampeoes, aberto }: {
  tracos: readonly TracoAtivo[];
  vazio: string;
  verCampeoes?: (id: string, el: HTMLElement) => void;
  aberto?: string | null;
}) {
  const foco = useTracoEmFoco();
  const lista = ordenarTracos(tracos);
  if (!lista.length) return <p className="ab-vazio">{vazio}</p>;
  return (
    <ul className="ab-lista-tracos">
      {lista.map(t => {
        const tr = TRACOS[t.id]!;
        const ativo = t.nivel >= 0;
        const prox = tr.degraus.find(d => d > t.n);
        const pd = propsDica({ tipo: 'traco', id: t.id, n: t.n, nivel: t.nivel });
        return (
          <li key={t.id} className={'ab-traco' + (ativo ? ' ativo' : '') + (foco === t.id ? ' foco' : '')} data-traco={t.id} style={corTraco(t.id)}
            onPointerEnter={e => { pd.onPointerEnter(e); focarTraco(t.id); }}
            onPointerLeave={() => { pd.onPointerLeave(); focarTraco(null); }}
            onContextMenu={pd.onContextMenu}>
            <MarcaDegrau id={t.id} n={t.n} nivel={t.nivel} total={tr.degraus.length} />
            <span className="nm">{tr.nome}</span>
            <span className="conta" title={prox ? `${t.n} de ${prox} pro próximo degrau` : 'degrau máximo'}>
              {t.n}{prox ? <small>/{prox}</small> : null}
            </span>
            <span className="dg" aria-label={prox ? `próximo degrau: ${prox}` : 'degrau máximo'}>
              {tr.degraus.map((d, k) => <span key={k} className={k === t.nivel ? 'on' : k < t.nivel ? 'feito' : undefined}>{d}</span>)}
            </span>
            <span className="prog" aria-hidden="true"><i style={{ width: `${Math.min(100, (t.n / (prox ?? t.n)) * 100)}%` }} /></span>
            {verCampeoes && (
              <button type="button" className={'ab-ico ab-ver' + (aberto === t.id ? ' on' : '')} data-ver-campeoes={t.id}
                title={`Ver os campeões de ${tr.nome}`} aria-label={`Ver os campeões de ${tr.nome}`} aria-expanded={aberto === t.id}
                onClick={e => verCampeoes(t.id, e.currentTarget)}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.5h2M2 8h2M2 12.5h2M6.5 3.5H14M6.5 8H14M6.5 12.5H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Tracos({ j, eu, abrirInfo }: { j: Jogador; eu: Jogador; abrirInfo: (aba: AbaInfo, traco?: string) => void }) {
  const unidades = unidadesNoTabuleiro(j, true);
  const tracos = contarTracos(unidades.map(u => ({ campeao: u.campeao, forma: u.forma })));
  const [ver, setVer] = useState<{ id: string; top: number; left: number } | null>(null);
  const pop = useRef<HTMLDivElement>(null);
  const abrir = (id: string, el: HTMLElement) => {
    if (ver?.id === id) { setVer(null); return; }
    fecharDica(0, true);
    const r = el.closest('.ab-tracos')?.getBoundingClientRect() ?? el.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    setVer({ id, left: r.right + 8, top: b.top });
  };
  // a lista fecha com Esc ou clique fora (e no botão do traço de novo)
  const aberto = ver?.id ?? null;
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t && (pop.current?.contains(t) || t.closest('[data-ver-campeoes]') || t.closest('#abDica'))) return;
      setVer(null);
    };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setVer(null); };
    document.addEventListener('pointerdown', fora, true);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fora, true);
      document.removeEventListener('keydown', tecla);
    };
  }, [aberto]);
  // a lista não passa do fim da janela
  useEffect(() => {
    const el = pop.current;
    if (!el || !ver) return;
    const sobra = window.innerHeight - 8 - (ver.top + el.offsetHeight);
    el.style.top = `${Math.max(8, ver.top + Math.min(0, sobra))}px`;
  }, [ver]);
  const tr = ver ? TRACOS[ver.id] : undefined;
  return (
    <aside id="abTracos" className="ab-lado ab-tracos" aria-label="Traços">
      <div className="ab-lado-cab">
        <h3>Traços</h3>
        <button type="button" className="ab-ico" title="Todos os traços" aria-label="Todos os traços" onClick={() => abrirInfo('tracos')}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M8 7.2V11.5M8 4.6v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>
      <ListaTracos tracos={tracos} vazio="Ponha campeões no tabuleiro pra ver os traços." verCampeoes={abrir} aberto={aberto} />
      {ver && tr && (
        <div ref={pop} id="abCampeoesTraco" className="ab-pop-ct panel" style={{ ...corTraco(ver.id), left: ver.left, top: ver.top }} role="dialog" aria-label={`Campeões de ${tr.nome}`}>
          <div className="cab">
            <b>{tr.nome}</b>
            <span className="mute">{tr.degraus.join(' / ')}</span>
            <button type="button" className="btn mini" onClick={() => { setVer(null); abrirInfo('tracos', ver.id); }}>Detalhes</button>
            <button type="button" className="ab-ico" aria-label="Fechar" onClick={() => setVer(null)}>×</button>
          </div>
          <CampeoesDoTraco id={ver.id} eu={eu} />
        </div>
      )}
    </aside>
  );
}

export function Jogadores({ partida, olhando, children }: { partida: Partida; olhando: string | null; children?: ReactNode }) {
  const vivo = (j: Jogador) => (j.vida > 0 && j.colocacao == null) || j.colocacao === 1;
  const ordem = [...partida.jogadores].sort((a, b) => Number(vivo(b)) - Number(vivo(a)) || b.vida - a.vida || (a.colocacao ?? 9) - (b.colocacao ?? 9));
  const conf = partida.confrontos.find(c => c.includes(partida.voce));
  const adv = conf ? (conf[0] === partida.voce ? conf[1] : conf[0]).replace(/^fantasma:/, '') : null;
  const vendo = olhando ?? partida.voce;
  // votação do "Pronto": marca em quem já votou (só no planejamento)
  const votando = partida.fase === 'planejamento';
  return (
    <aside id="abJogadores" className="ab-lado ab-jogadores" aria-label="Jogadores">
      <h3>Jogadores</h3>
      <ol>
        {ordem.map(j => {
          const eu = j.id === partida.voce;
          const fora = !vivo(j);
          const pronto = votando && !fora && !!j.pronto;
          return (
            <li key={j.id}>
              <button type="button" className={'ab-jog' + (eu ? ' eu' : '') + (fora ? ' fora' : '') + (j.id === vendo ? ' vendo' : '') + (j.id === adv ? ' adv' : '') + (pronto ? ' pronto' : '') + (j.ausente && !fora ? ' ausente' : '')}
                data-jogador={j.id} aria-pressed={j.id === vendo} title={(eu ? 'Seu tabuleiro' : `Ver o tabuleiro de ${j.nome}`) + (pronto ? ' (pronto pra luta)' : '')}
                onClick={() => acoes.olhar(eu ? null : j.id)}>
                {pronto && (
                  <span className="ab-jog-pronto" title="Votou pronto">
                    <span className="ab-sr">pronto</span>
                    <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                )}
                <Foto src={avatarDe(j)} nome={j.nome} className="redonda" />
                <span className="txt">
                  <span className="nm">{j.nome}{eu && <small> (você)</small>}</span>
                  <span className="vida-bar" aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(100, j.vida))}%` }} /></span>
                </span>
                <span className="vida">{fora && j.colocacao ? `${j.colocacao}º` : Math.max(0, j.vida)}</span>
                {j.id === adv && !fora && <span className="ab-tag adv" title="Adversário desta rodada">vs</span>}
                {j.ausente && !fora && <span className="ab-tag ausente" title="Fora do ar: um bot joga por ele até ele voltar">bot</span>}
              </button>
            </li>
          );
        })}
      </ol>
      {children}
    </aside>
  );
}
