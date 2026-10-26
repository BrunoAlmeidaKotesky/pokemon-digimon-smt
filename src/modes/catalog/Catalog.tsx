import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { KEYS } from '../../sources';
import { resolve } from '../../sources/resolve';
import { app, label, frColor } from '../../state/app';
import { Switch } from '../../components/Controls';
import * as cat from '../../catalog/store';
import {
  SEM, filtrar, filtravel, lerImportacao, montarExportacao, montarLinhas, opcoes, resumoInfo, temFiltro,
  type Campo, type Exportacao, type Linha,
} from '../../catalog/model';

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const quantos = (pers: number, frs: number) => `${plural(pers, 'personagem', 'personagens')} em ${plural(frs, 'franquia', 'franquias')}`;
/** "2026-10-25" -> "25/10/2026" */
const data = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split('-').reverse().join('/') : s);
const style = (k: string) => ({ ['--c' as string]: frColor(k) });

/** Assina o estado do Catálogo (marcações, catálogos baixados, filtros). */
function useCatalogo() {
  useSyncExternalStore(cat.assinar, cat.versao);
}

/**
 * Aba Catálogo: lista os personagens de cada franquia com as informações da fonte (public/catalogo/<chave>.json)
 * e deixa marcar quem entra no Set 1 do modo estilo TFT. Só monta o conteúdo com a aba aberta (nada de baixar
 * catálogo ou desenhar lista escondida); o estado fica em src/catalog/store.ts e sobrevive à troca de aba.
 * Franquias personalizadas ficam de fora: não têm fonte nem chave fixa.
 */
export function Catalog() {
  return <section id="catalog" hidden={app.mode !== 'catalog'}>{app.mode === 'catalog' && <Conteudo />}</section>;
}

function Conteudo() {
  useCatalogo();
  // as fixas que continuam no site (Sujimon some se a lista faltar)
  const frs = KEYS.filter(k => app.st[k] != null);
  const k = frs.includes(cat.franquiaAtual()) ? cat.franquiaAtual() : frs[0]!;
  useEffect(() => { void cat.pedirCatalogo(k); }, [k]);
  return (
    <>
      <Topo />
      <div id="catFr" className="cat-frs" role="tablist" aria-label="Franquia">
        {frs.map(f => {
          const n = cat.marcados(f).size;
          return (
            <button key={f} type="button" role="tab" aria-selected={f === k} data-fr={f} style={style(f)}
              className={'cat-fr' + (f === k ? ' on' : '') + (n ? ' has' : '')} onClick={() => cat.escolherFranquia(f)}>
              <span className="dot" aria-hidden="true" />{label(f)} <span className="n">· {n}</span>
            </button>
          );
        })}
      </div>
      <Franquia key={k} k={k} />
    </>
  );
}

// ---------- exportar, copiar, importar ----------
/**
 * Monta o set1.json: baixa os catálogos das franquias marcadas e, pros marcados sem imagem na lista nem no catálogo
 * (Digimon), busca o detalhe.
 */
async function gerarExportacao(): Promise<Exportacao> {
  const marcas = cat.marcasSalvas();
  const ks = KEYS.filter(k => marcas[k]?.length);
  const cats = await Promise.all(ks.map(cat.pedirCatalogo));
  await Promise.all(ks.flatMap((k, i) => {
    const nomes = new Set(marcas[k]);
    return (app.lists[k] ?? []).filter(it => !it.img && it.href && nomes.has(it.name) && !cats[i]?.imagens.has(it.name)).map(resolve);
  }));
  return montarExportacao({
    marcas, ordem: ks, listas: app.lists, catalogos: Object.fromEntries(ks.map((k, i) => [k, cats[i]])), rotulo: label,
    geradoEm: new Date().toISOString(),
  });
}
const texto = (e: Exportacao) => JSON.stringify(e, null, 2) + '\n';

function baixar(nome: string, conteudo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Área de transferência; sem a API (http, navegador antigo), o execCommand. false = não deu. */
async function copiarTexto(t: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(t);
      return true;
    }
  } catch { /* tenta o jeito antigo */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.setAttribute('readonly', '');
    Object.assign(ta.style, { position: 'fixed', top: '0', opacity: '0' });
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function Topo() {
  const [msg, setMsg] = useState<{ txt: string; ruim?: boolean } | null>(null);
  const [manual, setManual] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);
  const marcas = cat.marcasSalvas();
  const ks = KEYS.filter(k => marcas[k]?.length);
  const total = ks.reduce((n, k) => n + marcas[k]!.length, 0);

  async function exportar(copiar: boolean) {
    setOcupado(true);
    try {
      const t = texto(await gerarExportacao());
      if (!copiar) {
        baixar('set1.json', t);
        setMsg({ txt: `Baixado o set1.json: ${quantos(total, ks.length)}.` });
      } else if (await copiarTexto(t)) {
        setManual('');
        setMsg({ txt: `Copiado: ${quantos(total, ks.length)}.` });
      } else {
        setManual(t);
        setMsg({ txt: 'Não deu pra copiar sozinho: selecione o texto abaixo e copie.', ruim: true });
      }
    } finally {
      setOcupado(false);
    }
  }

  async function importar(f: File) {
    let j: unknown;
    try {
      j = JSON.parse(await f.text());
    } catch {
      setMsg({ txt: `${f.name} não é um arquivo JSON.`, ruim: true });
      return;
    }
    const r = lerImportacao(j, KEYS);
    if (!r) {
      setMsg({ txt: `${f.name} não parece um set1.json exportado daqui.`, ruim: true });
      return;
    }
    const n = Object.values(r.marcas).reduce((a, v) => a + v.length, 0);
    const novas = cat.importar(r.marcas);
    const ign = r.ignoradas.length ? ` Franquias desconhecidas ignoradas: ${r.ignoradas.join(', ')}.` : '';
    setMsg({ txt: `Importado ${f.name}: ${quantos(n, Object.keys(r.marcas).length)}, ${plural(novas, 'novo', 'novos')}.${ign}`, ruim: !n });
  }

  return (
    <div className="panel stack cat-top">
      <div>
        <h2 style={{ margin: 0 }}>Catálogo do Set 1</h2>
        <p className="mute" style={{ margin: 0 }}>
          Marque quem entra no Set 1 do modo estilo TFT; fica salvo neste navegador. Exportar baixa um set1.json com os
          marcados e o que a fonte informa de cada um, e Importar soma as marcações de um set1.json às de agora.
        </p>
      </div>
      <div className="cat-acts">
        <button type="button" id="catExport" className="btn main" disabled={!total || ocupado} onClick={() => void exportar(false)}>Exportar</button>
        <button type="button" id="catCopy" className="btn" disabled={!total || ocupado} onClick={() => void exportar(true)}>Copiar</button>
        <button type="button" id="catImport" className="btn" onClick={() => arquivo.current?.click()}>Importar</button>
        <input ref={arquivo} id="catImportFile" type="file" accept=".json,application/json" hidden
          onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void importar(f); }} />
        <span id="catTotal" className="mute">{total ? `${quantos(total, ks.length)} marcados` : 'Nada marcado ainda'}</span>
      </div>
      <p id="catMsg" role="status" className={'note' + (msg?.ruim ? ' bad' : '')}>{msg?.txt}</p>
      {manual && <textarea id="catCopyText" className="cat-manual" readOnly rows={8} value={manual} onFocus={e => e.currentTarget.select()} aria-label="JSON pra copiar" />}
    </div>
  );
}

// ---------- uma franquia ----------
function Franquia({ k }: { k: string }) {
  const lista = app.lists[k];
  const st = app.st[k];
  const c = cat.catalogo(k);
  const catOk = c && c !== 'carregando' ? c : null;
  const f = cat.filtrosDe(k);
  const marc = cat.marcados(k);
  const linhas = useMemo(() => montarLinhas(lista ?? [], catOk), [lista, catOk]);
  const filtradas = useMemo(() => filtrar(linhas, f, marc), [linhas, f, marc]);
  const campos = useMemo(() => (catOk ? catOk.campos.filter(x => filtravel(linhas, x.id)) : []), [catOk, linhas]);
  const ops = useMemo(() => campos.map(x => opcoes(linhas, x.id, f, marc)), [campos, linhas, f, marc]);
  const fora = useMemo(() => {
    if (!lista) return [];
    const nomes = new Set(lista.map(it => it.name));
    return [...marc].filter(n => !nomes.has(n));
  }, [lista, marc]);
  const vis = filtradas.slice(0, cat.quantosMostrar());
  const comInfo = catOk ? linhas.filter(l => l.info && Object.keys(l.info).length).length : 0;
  const nome = label(k);
  // no celular os seletores dos campos ficam recolhidos atrás de um botão (no computador o botão nem aparece)
  const [abertos, setAbertos] = useState(false);
  const ativos = campos.filter(x => f.campos[x.id]).length;

  return (
    <div className="panel stack cat-body" data-fr={k} style={style(k)}>
      {c === null ? (
        <p id="catFonte" className="note">Sem informações da fonte pra {nome}: a lista mostra só nome e imagem, e dá pra marcar do mesmo jeito.</p>
      ) : catOk ? (
        <p id="catFonte" className="mute cat-fonte">
          Informações: <b>{catOk.fonte || 'fonte sem nome'}</b>{catOk.geradoEm && <> (gerado em {data(catOk.geradoEm)})</>}
          {lista && <> · {comInfo} de {lista.length} com informação</>}
        </p>
      ) : (
        <p id="catFonte" className="mute cat-fonte">Carregando as informações da fonte…</p>
      )}

      {!lista ? (
        st === 'falhou'
          ? <p id="catLista" className="note bad">A lista de {nome} não carregou. Recarregue a página pra tentar de novo.</p>
          : <p id="catLista" className="mute">Carregando a lista de {nome}…</p>
      ) : (
        <>
          <div className={'cat-filters' + (abertos ? '' : ' fechado')}>
            <label className="cat-field cat-q">
              <span>Buscar</span>
              <input id="catBusca" type="search" placeholder="Nome ou informação" value={f.q} onChange={e => cat.mudarFiltros(k, { q: e.target.value })} />
            </label>
            {campos.length > 0 && (
              <button type="button" id="catCamposBtn" className="btn mini cat-campos-btn" aria-expanded={abertos} onClick={() => setAbertos(!abertos)}>
                {abertos ? 'Esconder os filtros por campo' : `Filtros por campo (${campos.length})`}{ativos ? ` · ${plural(ativos, 'ativo', 'ativos')}` : ''}
              </button>
            )}
            {campos.map((x, i) => <CampoFiltro key={x.id} k={k} campo={x} valor={f.campos[x.id] ?? ''} ops={ops[i]!} />)}
          </div>
          <div className="cat-tools">
            <Switch id="catSoMarcados" title="Só marcados" checked={f.soMarcados} onChange={on => cat.mudarFiltros(k, { soMarcados: on })} />
            {temFiltro(f) && <button type="button" id="catLimparFiltros" className="btn mini" onClick={() => cat.limparFiltros(k)}>Limpar filtros</button>}
          </div>
          <div className="cat-count">
            <span id="catCount"><b>{filtradas.length}</b> de {linhas.length}</span>
            <button type="button" id="catMarcar" className="btn mini" disabled={!filtradas.some(l => !marc.has(l.nome))}
              onClick={() => cat.marcar(k, filtradas.map(l => l.nome), true)}>Marcar os filtrados</button>
            <button type="button" id="catDesmarcar" className="btn mini" disabled={!filtradas.some(l => marc.has(l.nome))}
              onClick={() => cat.marcar(k, filtradas.map(l => l.nome), false)}>Desmarcar os filtrados</button>
            <LimparMarcas k={k} n={marc.size} />
          </div>
          {fora.length > 0 && (
            <p id="catFora" className="mute" style={{ margin: 0 }}>
              Marcados que não estão na lista de {nome}: {fora.slice(0, 8).join(', ')}{fora.length > 8 ? ` e mais ${fora.length - 8}` : ''}.
            </p>
          )}
          {filtradas.length ? (
            <ul id="catList" className="cat-list">
              {vis.map(l => <LinhaCat key={l.nome} k={k} l={l} on={marc.has(l.nome)} campos={catOk ? catOk.campos : null} pronto={c !== undefined && c !== 'carregando'} />)}
            </ul>
          ) : (
            <p id="catVazio" className="mute">Ninguém com esses filtros.</p>
          )}
          {filtradas.length > vis.length && (
            <button type="button" id="catMais" className="btn cat-mais" onClick={cat.mostrarMais}>
              Mostrar mais ({filtradas.length - vis.length} {filtradas.length - vis.length === 1 ? 'restante' : 'restantes'})
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** Seletor de um campo: "Todos" e cada valor com quantos personagens o têm (acompanhando os outros filtros). */
function CampoFiltro({ k, campo, valor, ops }: { k: string; campo: Campo; valor: string; ops: { valor: string; n: number }[] }) {
  return (
    <label className="cat-field">
      <span title={campo.rotulo}>{campo.rotulo}</span>
      <select id={'catCampo_' + campo.id} data-campo={campo.id} value={valor} onChange={e => cat.mudarCampo(k, campo.id, e.target.value)}>
        <option value="">Todos</option>
        {ops.map(o => <option key={o.valor} value={o.valor}>{o.valor === SEM ? 'Sem informação' : o.valor} ({o.n})</option>)}
      </select>
    </label>
  );
}

/** "Limpar marcações" da franquia: o primeiro clique pede confirmação, o segundo (em até 4 s) limpa. */
function LimparMarcas({ k, n }: { k: string; n: number }) {
  const [confirma, setConfirma] = useState(false);
  useEffect(() => {
    if (!confirma) return;
    const t = setTimeout(() => setConfirma(false), 4000);
    return () => clearTimeout(t);
  }, [confirma]);
  return (
    <button type="button" id="catLimpar" className={'btn mini' + (confirma ? ' danger' : '')} disabled={!n}
      onClick={() => { if (confirma) cat.limpar(k); setConfirma(!confirma); }}>
      {confirma ? `Confirmar: desmarcar ${n}` : 'Limpar marcações'}
    </button>
  );
}

/**
 * Um personagem: caixa de marcar, miniatura, nome e as informações da fonte (campos null = franquia sem catálogo).
 * `pronto`: o catálogo já chegou (ou não existe), então já dá pra saber se ele tem a imagem.
 */
function LinhaCat({ k, l, on, campos, pronto }: { k: string; l: Linha; on: boolean; campos: Campo[] | null; pronto: boolean }) {
  const info = campos ? resumoInfo(campos, l.info) : '';
  return (
    <li className={'cat-row' + (on ? ' on' : '')} data-nome={l.nome}>
      <label>
        <input type="checkbox" checked={on} onChange={() => cat.alternar(k, l.nome)} />
        <Thumb l={l} pronto={pronto} />
        <span className="txt">
          <b className="nm">{l.nome}</b>
          {campos && <span className={'campos' + (info ? '' : ' sem')} title={info || undefined}>{info || 'Sem informação da fonte'}</span>}
        </span>
      </label>
    </li>
  );
}

/**
 * Miniatura: a imagem da lista, senão a do catálogo; o Digimon sem as duas busca o detalhe (só depois de o catálogo
 * chegar, que pode trazer a imagem). Imagem quebrada tenta a outra.
 */
function Thumb({ l, pronto }: { l: Linha; pronto: boolean }) {
  const it = l.item;
  const [, setBuscou] = useState(0);
  const [falhas, setFalhas] = useState<string[]>([]);
  useEffect(() => {
    if (!pronto || it.img || l.imgFonte || !it.href) return;
    let vivo = true;
    resolve(it).then(() => { if (vivo) setBuscou(n => n + 1); });
    return () => { vivo = false; };
  }, [it, l.imgFonte, pronto]);
  const src = [it.img, l.imgFonte].find(s => s && !falhas.includes(s));
  return (
    <span className="th">
      {src ? <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFalhas(x => [...x, src])} /> : null}
    </span>
  );
}
