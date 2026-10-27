// Vista "Linhas" de uma franquia: uma carta por linha evolutiva, com os níveis lado a lado (no celular, um embaixo do
// outro). Dá pra confirmar, renomear, apagar, mover alguém de nível (ou virar alternativa), tirar e pôr gente. Quem
// tem ult mostra a forma embaixo ("ult: Mega Venusaur").
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { label } from '../../state/app';
import { Switch } from '../../components/Controls';
import * as cat from '../../catalog/store';
import * as pl from '../../catalog/plano';
import { normalizar, type Linha } from '../../catalog/model';
import { BotaoConfirmar, BuscaPersonagem, Thumb, linhaAvulsa, plural } from './comum';

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
            title={`Desfaz todas as mudanças nas linhas de ${nome} (as confirmações ficam) e volta pras do set1-base.json`} onConfirm={() => cat.voltarLinhasDaBase(k)} />
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
  // mexer = mudar o conteúdo desta linha (ela deixa de seguir a base); confirmar e apagar não contam
  const editar = (fn: (ls: pl.LinhaEvo[]) => pl.LinhaEvo[], mexer = false) => cat.editarLinhas(k, fn, mexer ? [l.id] : []);
  const daBase = cat.linhaNaBase(k, l.id);

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
    editar(ls => pl.moverMembro(ls, l.id, escolhido, destino), true);
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
            onBlur={e => { editar(ls => pl.renomearLinha(ls, l.id, e.target.value), true); setRenomeando(false); }} />
        ) : (
          <h3 className="lin-nome">{l.nome}</h3>
        )}
        <span className="lin-n mute">{plural(l.niveis.length, 'nível', 'níveis')}</span>
        {l.editada && daBase && (
          <span className="lin-tag" title="Você mudou esta linha: o que mudar nela no set1-base.json não aparece aqui">editada</span>
        )}
        <span className="lin-head-acts">
          {l.editada && daBase && (
            <BotaoConfirmar className="lin-voltar" rotulo="Voltar à da base" confirmar="Confirmar: desfazer"
              title="Desfaz as suas mudanças nesta linha (a confirmação fica)" onConfirm={() => cat.voltarLinhaDaBase(k, l.id)} />
          )}
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
                  const ult = cat.ultDe(k, nome);
                  return (
                    <div key={nome} className="lin-m">
                      <button type="button" className={'lin-membro' + (escolhido === nome ? ' on' : '') + (row ? '' : ' fora')} data-nome={nome}
                        aria-pressed={escolhido === nome} title={row ? `${nome}: mover ou tirar` : `${nome} não está na lista do site`}
                        onClick={() => setSel(escolhido === nome ? null : nome)}>
                        <Thumb l={row ?? linhaAvulsa(k, nome)} pronto={pronto} />
                        <span className="nm">{nome}</span>
                        {!row && <small>fora da lista</small>}
                      </button>
                      {ult && <span className="lin-ult" data-de={nome} title={`Na ult, ${nome} vira ${ult}`}>ult: {ult}</span>}
                    </div>
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
          <button type="button" className="btn mini danger lin-tirar" onClick={() => { editar(ls => pl.removerMembro(ls, l.id, escolhido), true); setSel(null); }}>Tirar da linha</button>
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
  const [destino, setDestino] = useState('fim');
  const grupo = cat.grupoDe(k) ?? cat.grupoBase(k);
  // o nível escolhido pode ter sumido (alguém saiu da linha)
  const dest = destino === 'inicio' || destino === 'fim' || Number(destino) < l.niveis.length ? destino : 'fim';

  return (
    <BuscaPersonagem porNome={porNome} pronto={pronto} inputRef={inputRef} rotulo={`Adicionar à linha ${l.nome}`} placeholder="Adicionar personagem…"
      vazio={`Ninguém com esse nome em ${label(k)}.`} prioridade={nome => (grupo.has(nome) ? 0 : 2)} onFechar={fechar}
      nota={nome => {
        const pos = indice.get(nome);
        return [
          grupo.has(nome) ? 'no grupo' : '',
          !pos ? '' : pos.linha.id === l.id ? `já está aqui (nível ${pos.nivel + 1}): muda de nível` : `sai da linha ${pos.linha.nome}`,
        ].filter(Boolean).join(' · ');
      }}
      onEscolher={nome => cat.editarLinhas(k, ls => pl.adicionarMembro(ls, l.id, nome, dest === 'inicio' || dest === 'fim' ? dest : Number(dest)), [l.id])}>
      <select className="lin-destino" aria-label="Em qual nível" value={dest} onChange={e => setDestino(e.target.value)}>
        {l.niveis.map((_, i) => <option key={i} value={String(i)}>Nível {i + 1} (alternativa)</option>)}
        <option value="fim">{l.niveis.length ? 'Novo nível no fim' : 'Nível 1'}</option>
        {l.niveis.length > 0 && <option value="inicio">Novo nível no começo</option>}
      </select>
    </BuscaPersonagem>
  );
}
