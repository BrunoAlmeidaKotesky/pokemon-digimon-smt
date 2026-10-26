// Vista "Linhas" de uma franquia: uma carta por linha evolutiva, com os níveis lado a lado (no celular, um embaixo do
// outro). Dá pra confirmar, renomear, apagar, mover alguém de nível (ou virar alternativa), tirar e pôr gente.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { label } from '../../state/app';
import { Switch } from '../../components/Controls';
import * as cat from '../../catalog/store';
import * as pl from '../../catalog/plano';
import { normalizar, type Linha } from '../../catalog/model';
import { BotaoConfirmar, Thumb, linhaAvulsa, plural } from './comum';

/** Quantos resultados a busca de "adicionar" mostra. */
const MAX_RESULTADOS = 8;

export function VistaLinhas({ k, linhas: lista, pronto }: { k: string; linhas: readonly Linha[]; pronto: boolean }) {
  const linhasEvo = cat.linhasDe(k);
  const soPendentes = cat.soNaoConfirmadas();
  const focoId = cat.focoEm(k);
  const [q, setQ] = useState('');
  // ir pra uma linha (pelo selo do personagem) limpa a busca, que podia escondê-la
  const [focoVisto, setFocoVisto] = useState<string | null>(null);
  if (focoId && focoId !== focoVisto) {
    setFocoVisto(focoId);
    setQ('');
  }
  const porNome = useMemo(() => new Map(lista.map(l => [l.nome, l])), [lista]);
  const indice = useMemo(() => pl.indiceLinhas(linhasEvo), [linhasEvo]);
  const termos = normalizar(q).split(/\s+/).filter(Boolean);
  const vis = linhasEvo.filter(l => (!soPendentes || !l.confirmada)
    && termos.every(t => normalizar([l.nome, ...l.niveis.flat()].join('\n')).includes(t)));
  const ok = linhasEvo.filter(l => l.confirmada).length;
  const nome = label(k);
  const temBase = !!(cat.base() && cat.base() !== 'carregando');

  function nova() {
    const id = cat.criarLinha(k, '');
    cat.irParaLinha(k, id);
  }

  return (
    <div className="stack lin-vista">
      <div className="lin-topo">
        <p id="catLinProg" className="lin-prog">
          <b>{ok}</b> de {plural(linhasEvo.length, 'linha confirmada', 'linhas confirmadas')}
        </p>
        <span className="lin-meter" aria-hidden="true"><span style={{ width: linhasEvo.length ? `${(100 * ok) / linhasEvo.length}%` : '0' }} /></span>
      </div>
      <div className="cat-tools">
        <label className="cat-field cat-q">
          <span>Buscar linha</span>
          <input id="catLinBusca" type="search" placeholder="Nome da linha ou de alguém nela" value={q} onChange={e => setQ(e.target.value)} />
        </label>
        <Switch id="catSoPendentes" title="Só não confirmadas" checked={soPendentes} onChange={cat.mudarSoNaoConfirmadas} />
        <button type="button" id="catNovaLinha" className="btn" onClick={nova}>Nova linha</button>
        {cat.linhasMexidas(k) && temBase && (
          <BotaoConfirmar id="catLinBase" rotulo="Voltar pra base" confirmar="Confirmar: desfazer as mudanças"
            title={`Desfaz todas as mudanças nas linhas de ${nome} e volta pras do set1-base.json`} onConfirm={() => cat.voltarLinhasDaBase(k)} />
        )}
      </div>
      {vis.length ? (
        <ol id="catLinhas" className="lin-lista">
          {vis.map(l => (
            <CartaoLinha key={l.id} k={k} l={l} porNome={porNome} indice={indice} pronto={pronto} foco={focoId === l.id} />
          ))}
        </ol>
      ) : (
        <p id="catLinVazio" className="mute">
          {linhasEvo.length ? 'Nenhuma linha com esses filtros.' : `Nenhuma linha em ${nome} ainda. "Nova linha" cria uma, ou use "Nova linha" num personagem da lista.`}
        </p>
      )}
    </div>
  );
}

function CartaoLinha({ k, l, porNome, indice, pronto, foco }: {
  k: string;
  l: pl.LinhaEvo;
  porNome: ReadonlyMap<string, Linha>;
  indice: ReadonlyMap<string, pl.PosLinha>;
  pronto: boolean;
  foco: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const busca = useRef<HTMLInputElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [renomeando, setRenomeando] = useState(false);
  // o campo de adicionar fica fechado (as cartas ficam mais baixas); abre sozinho na linha nova
  const [adicionando, setAdicionando] = useState(false);
  const [focoAntes, setFocoAntes] = useState(false);
  if (foco !== focoAntes) {
    setFocoAntes(foco);
    if (foco && l.niveis.length <= 1) setAdicionando(true);
  }
  // quem estava escolhido pode ter saído da linha (por outra carta, por exemplo)
  const nivelSel = sel ? l.niveis.findIndex(n => n.includes(sel)) : -1;
  const escolhido = nivelSel >= 0 ? sel : null;
  const editar = (fn: (ls: pl.LinhaEvo[]) => pl.LinhaEvo[]) => cat.editarLinhas(k, fn);

  useEffect(() => {
    if (!foco) return;
    const el = ref.current;
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    // linha nova (um nível só): já no campo de adicionar; senão, a carta
    if (busca.current) busca.current.focus({ preventScroll: true });
    else el.focus({ preventScroll: true });
    el.classList.add('foco');
    // sem limpar no cleanup: o foco vira false na próxima mudança e cancelaria o timer
    setTimeout(() => el.classList.remove('foco'), 1600);
    cat.focoFeito();
  }, [foco, l.niveis.length]);

  function mover(destino: pl.Destino) {
    if (!escolhido) return;
    editar(ls => pl.moverMembro(ls, l.id, escolhido, destino));
  }

  return (
    <li ref={ref} tabIndex={-1} className={'lin-card' + (l.confirmada ? ' ok' : '')} data-id={l.id} aria-label={`Linha ${l.nome}`}>
      <div className="lin-head">
        <label className="lin-ok">
          <input type="checkbox" checked={!!l.confirmada} onChange={e => editar(ls => pl.confirmarLinha(ls, l.id, e.target.checked))} />
          <span>Confirmada</span>
        </label>
        {renomeando ? (
          <input className="lin-nome-in" defaultValue={l.nome} aria-label="Nome da linha" autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') { e.currentTarget.value = l.nome; e.currentTarget.blur(); }
            }}
            onBlur={e => { editar(ls => pl.renomearLinha(ls, l.id, e.target.value)); setRenomeando(false); }} />
        ) : (
          <h3 className="lin-nome">{l.nome}</h3>
        )}
        <span className="lin-n mute">{plural(l.niveis.length, 'nível', 'níveis')}</span>
        <span className="lin-head-acts">
          <button type="button" className={'btn mini lin-add-btn' + (adicionando ? ' on' : '')} aria-expanded={adicionando}
            onClick={() => setAdicionando(!adicionando)}>{adicionando ? 'Fechar' : '+ Adicionar'}</button>
          {!renomeando && <button type="button" className="btn mini lin-renomear" onClick={() => setRenomeando(true)}>Renomear</button>}
          <BotaoConfirmar className="lin-apagar" rotulo="Apagar" confirmar="Confirmar: apagar" onConfirm={() => editar(ls => pl.apagarLinha(ls, l.id))} />
        </span>
      </div>

      {l.niveis.length ? (
        <div className="lin-niveis" style={{ ['--n' as string]: l.niveis.length }}>
          {l.niveis.map((n, i) => (
            <div key={i} className="lin-nivel" data-nivel={i + 1}>
              <span className="lin-nl">Nível {i + 1}{n.length > 1 ? ' · alternativas' : ''}</span>
              <div className="lin-membros">
                {n.map(nome => {
                  const row = porNome.get(nome);
                  return (
                    <button key={nome} type="button" className={'lin-membro' + (escolhido === nome ? ' on' : '') + (row ? '' : ' fora')} data-nome={nome}
                      aria-pressed={escolhido === nome} title={row ? `${nome}: mover ou tirar` : `${nome} não está na lista do site`}
                      onClick={() => setSel(escolhido === nome ? null : nome)}>
                      <Thumb l={row ?? linhaAvulsa(k, nome)} pronto={pronto} />
                      <span className="nm">{nome}</span>
                      {!row && <small>fora da lista</small>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mute lin-vazia">Linha vazia: adicione alguém abaixo.</p>
      )}

      {escolhido && (
        <div className="lin-acoes" role="group" aria-label={`Mover ${escolhido}`}>
          <span className="lin-acoes-t"><b>{escolhido}</b> vai pro:</span>
          {l.niveis.map((n, i) => (i === nivelSel ? null : (
            <button key={i} type="button" className="btn mini" data-destino={i + 1} onClick={() => mover(i)}>
              Nível {i + 1}{n.length ? ' (alternativa)' : ''}
            </button>
          )))}
          <button type="button" className="btn mini" data-destino="inicio" onClick={() => mover('inicio')}>Novo nível no começo</button>
          <button type="button" className="btn mini" data-destino="fim" onClick={() => mover('fim')}>Novo nível no fim</button>
          <button type="button" className="btn mini danger lin-tirar" onClick={() => { editar(ls => pl.removerMembro(ls, l.id, escolhido)); setSel(null); }}>Tirar da linha</button>
          <button type="button" className="btn mini" onClick={() => setSel(null)}>Fechar</button>
        </div>
      )}

      {adicionando && <Adicionar k={k} l={l} porNome={porNome} indice={indice} pronto={pronto} inputRef={busca} fechar={() => setAdicionando(false)} />}
    </li>
  );
}

/** Campo "adicionar à linha": busca na lista da franquia (quem está no grupo vem primeiro) e o nível de destino. */
function Adicionar({ k, l, porNome, indice, pronto, inputRef, fechar }: {
  k: string;
  l: pl.LinhaEvo;
  porNome: ReadonlyMap<string, Linha>;
  indice: ReadonlyMap<string, pl.PosLinha>;
  pronto: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  /** Esc com o campo vazio fecha */
  fechar: () => void;
}) {
  const [q, setQ] = useState('');
  const [destino, setDestino] = useState('fim');
  const lista = useRef<HTMLUListElement>(null);
  const grupo = cat.grupoDe(k) ?? cat.grupoBase(k);
  const t = normalizar(q.trim());
  const res = useMemo(() => {
    if (!t) return [];
    const achados: { nome: string; ordem: number }[] = [];
    let i = 0;
    for (const nome of porNome.keys()) {
      const n = normalizar(nome);
      const p = n.indexOf(t);
      if (p >= 0) achados.push({ nome, ordem: (grupo.has(nome) ? 0 : 2) + (p === 0 ? 0 : 1) + i++ / 1e6 });
    }
    return achados.sort((a, b) => a.ordem - b.ordem).slice(0, MAX_RESULTADOS).map(a => a.nome);
  }, [t, porNome, grupo]);
  // o nível escolhido pode ter sumido (alguém saiu da linha)
  const dest = destino === 'inicio' || destino === 'fim' || Number(destino) < l.niveis.length ? destino : 'fim';

  function adicionar(nome: string) {
    cat.editarLinhas(k, ls => pl.adicionarMembro(ls, l.id, nome, dest === 'inicio' || dest === 'fim' ? dest : Number(dest)));
    setQ('');
    inputRef.current?.focus();
  }
  /** Setas sobem e descem entre o campo e os resultados. */
  function setas(e: KeyboardEvent, i: number) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const bs = lista.current ? [...lista.current.querySelectorAll('button')] : [];
    const j = i + (e.key === 'ArrowDown' ? 1 : -1);
    if (j < 0) inputRef.current?.focus();
    else bs[Math.min(j, bs.length - 1)]?.focus();
  }

  return (
    <div className="lin-add">
      <div className="lin-add-campos">
        <input ref={inputRef} type="search" className="lin-busca" autoFocus placeholder="Adicionar personagem…" aria-label={`Adicionar à linha ${l.nome}`}
          value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && res[0]) { e.preventDefault(); adicionar(res[0]); }
            else if (e.key === 'Escape') { if (q) setQ(''); else fechar(); }
            else setas(e, -1);
          }} />
        <select className="lin-destino" aria-label="Em qual nível" value={dest} onChange={e => setDestino(e.target.value)}>
          {l.niveis.map((_, i) => <option key={i} value={String(i)}>Nível {i + 1} (alternativa)</option>)}
          <option value="fim">{l.niveis.length ? 'Novo nível no fim' : 'Nível 1'}</option>
          {l.niveis.length > 0 && <option value="inicio">Novo nível no começo</option>}
        </select>
      </div>
      {t && (res.length ? (
        <ul ref={lista} className="lin-res" aria-label="Resultados">
          {res.map((nome, i) => {
            const pos = indice.get(nome);
            const nota = [
              grupo.has(nome) ? 'no grupo' : '',
              !pos ? '' : pos.linha.id === l.id ? `já está aqui (nível ${pos.nivel + 1}): muda de nível` : `sai da linha ${pos.linha.nome}`,
            ].filter(Boolean).join(' · ');
            return (
              <li key={nome}>
                <button type="button" className="lin-res-it" data-nome={nome} onClick={() => adicionar(nome)} onKeyDown={e => setas(e, i)}>
                  <Thumb l={porNome.get(nome)!} pronto={pronto} />
                  <span className="txt">
                    <span className="nm">{nome}</span>
                    {nota && <small>{nota}</small>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : <p className="mute lin-res-vazio">Ninguém com esse nome em {label(k)}.</p>)}
    </div>
  );
}
