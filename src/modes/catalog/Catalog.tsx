import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { KEYS } from '../../sources';
import { resolve } from '../../sources/resolve';
import { app, label } from '../../state/app';
import { Segmented } from '../../components/Controls';
import * as cat from '../../catalog/store';
import * as pl from '../../catalog/plano';
import {
  SEM, filtrar, filtravel, lerImportacao, montarExportacao, montarLinhas, normalizar, opcoes, opcoesClasse, opcoesLinha, opcoesUlt,
  resumoInfo, temFiltro, type Campo, type Contexto, type Exportacao, type FiltroLinha, type FiltroUlt, type Linha,
} from '../../catalog/model';
import { BotaoConfirmar, BuscaPersonagem, Thumb, linhaAvulsa, plural, style, useCatalogo, useTextoSalvo } from './comum';
import { VistaLinhas } from './Linhas';
import { PainelClasses } from './Classes';

const quantos = (pers: number, frs: number) => `${plural(pers, 'personagem', 'personagens')} em ${plural(frs, 'franquia', 'franquias')}`;
/** "2026-10-25" -> "25/10/2026" */
const data = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split('-').reverse().join('/') : s);
const ROTULO_GRUPO: Record<cat.Grupo, string> = { base: 'Set 1 (base)', marcados: 'Marcados', todos: 'Todos' };
const ROTULO_LINHA: Record<Exclude<FiltroLinha, ''>, string> = {
  com: 'Com linha', sem: 'Sem linha', confirmada: 'Linha confirmada', pendente: 'Linha não confirmada',
};

/**
 * Aba Catálogo: lista os personagens de cada franquia com as informações da fonte (public/catalogo/<chave>.json),
 * deixa marcar quem entra no Set 1 do modo estilo TFT e planejar cada um (classes, habilidade, linha evolutiva), a
 * partir da base (public/catalogo/set1-base.json). Só monta o conteúdo com a aba aberta (nada de baixar catálogo ou
 * desenhar lista escondida); o estado fica em src/catalog/store.ts e sobrevive à troca de aba. Franquias
 * personalizadas ficam de fora: não têm fonte nem chave fixa.
 */
export function Catalog() {
  return <section id="catalog" hidden={app.mode !== 'catalog'}>{app.mode === 'catalog' && <Conteudo />}</section>;
}

function Conteudo() {
  useCatalogo();
  // as fixas que continuam no site (Sujimon some se a lista faltar)
  const frs = KEYS.filter(k => app.st[k] != null);
  const naClasses = cat.classesAbertas();
  const k = frs.includes(cat.franquiaAtual()) ? cat.franquiaAtual() : frs[0]!;
  useEffect(() => { void cat.pedirBase(); }, []);
  useEffect(() => { if (!naClasses) void cat.pedirCatalogo(k); }, [k, naClasses]);
  // no grupo base a subaba conta quem está nele; nos outros, os marcados
  const noBase = cat.grupoAtual() === 'base';
  return (
    <>
      <Topo />
      <div id="catFr" className="cat-frs" role="tablist" aria-label="Franquia">
        {frs.map(f => {
          const n = noBase ? cat.grupoBase(f).size : cat.marcados(f).size;
          const on = !naClasses && f === k;
          return (
            <button key={f} type="button" role="tab" aria-selected={on} data-fr={f} style={style(f)}
              title={noBase ? `${n} no Set 1 (base)` : plural(n, 'marcado', 'marcados')}
              className={'cat-fr' + (on ? ' on' : '') + (n ? ' has' : '')} onClick={() => cat.escolherFranquia(f)}>
              <span className="dot" aria-hidden="true" />{label(f)} <span className="n">· {n}</span>
            </button>
          );
        })}
        <button type="button" role="tab" id="catAbaClasses" aria-selected={naClasses} className={'cat-aba-cls' + (naClasses ? ' on' : '')} onClick={cat.abrirClasses}>
          Classes <span className="n">· {cat.classes().length}</span>
        </button>
      </div>
      {naClasses ? <PainelClasses frs={frs} /> : <Franquia key={k} k={k} />}
    </>
  );
}

// ---------- exportar, copiar, importar ----------
/**
 * Monta o set1.json com os marcados (ou com o grupo base): baixa os catálogos dessas franquias e, pra quem vem sem
 * imagem na lista nem no catálogo (Digimon), busca o detalhe. Cada personagem leva o planejamento, e o arquivo, o
 * plano inteiro.
 */
async function gerarExportacao(grupo: 'marcados' | 'base'): Promise<Exportacao> {
  const marcas = grupo === 'base' ? (await cat.pedirBase())?.selecao ?? {} : cat.marcasSalvas();
  const ks = KEYS.filter(k => marcas[k]?.length);
  const cats = await Promise.all(ks.map(cat.pedirCatalogo));
  await Promise.all(ks.flatMap((k, i) => {
    const nomes = new Set(marcas[k]);
    return (app.lists[k] ?? []).filter(it => !it.img && it.href && nomes.has(it.name) && !cats[i]?.imagens.has(it.name)).map(resolve);
  }));
  const classes = cat.classes();
  const indices = new Map(ks.map(k => [k, pl.indiceLinhas(cat.linhasDe(k))]));
  return montarExportacao({
    marcas, ordem: ks, listas: app.lists, catalogos: Object.fromEntries(ks.map((k, i) => [k, cats[i]])), rotulo: label,
    geradoEm: new Date().toISOString(),
    plano: {
      grupo,
      plano: cat.planoParaExportar(KEYS),
      linhas: cat.linhasParaExportar(KEYS),
      extras: (k, nome) => pl.extrasDoPersonagem(nome, cat.unidadesDe(k)[nome], classes, indices.get(k)?.get(nome), cat.ultDe(k, nome)),
    },
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

/** "10 classes, 120 personagens com classe, habilidade ou ult e mudanças em linhas de 4 franquias" */
function resumoDoPlano(p: pl.Plano): string {
  const r = pl.resumoPlano(p);
  const partes = [
    r.classes === null ? 'as classes da base' : plural(r.classes, 'classe', 'classes'),
    `${plural(r.unidades, 'personagem', 'personagens')} com classe, habilidade ou ult`,
    `mudanças em linhas de ${plural(r.franquiasComLinhas, 'franquia', 'franquias')}`,
  ];
  return `${partes.slice(0, -1).join(', ')} e ${partes.at(-1)}`;
}

function Topo() {
  const [msg, setMsg] = useState<{ txt: string; ruim?: boolean } | null>(null);
  const [manual, setManual] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);
  const marcas = cat.marcasSalvas();
  const ks = KEYS.filter(k => marcas[k]?.length);
  const total = ks.reduce((n, k) => n + marcas[k]!.length, 0);
  const b = cat.base();
  const base = b && b !== 'carregando' ? b : null;
  const ksBase = base ? KEYS.filter(k => base.selecao[k]?.length) : [];
  const totalBase = ksBase.reduce((n, k) => n + base!.selecao[k]!.length, 0);

  async function exportar(copiar: boolean) {
    setOcupado(true);
    try {
      const t = texto(await gerarExportacao('marcados'));
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

  async function exportarBase() {
    setOcupado(true);
    try {
      baixar('set1-grupo-base.json', texto(await gerarExportacao('base')));
      setMsg({ txt: `Baixado o set1-grupo-base.json: ${quantos(totalBase, ksBase.length)} do Set 1 (base), com o planejamento.` });
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
    const novas = n ? cat.importar(r.marcas) : 0;
    if (r.plano) await cat.importarPlano(r.plano, KEYS);
    const ign = r.ignoradas.length ? ` Franquias desconhecidas ignoradas: ${r.ignoradas.join(', ')}.` : '';
    const plano = r.plano ? ` Planejamento restaurado: ${resumoDoPlano(r.plano)}.` : '';
    const marcou = n || !r.plano ? `: ${quantos(n, Object.keys(r.marcas).length)}, ${plural(novas, 'novo', 'novos')}.` : '.';
    setMsg({ txt: `Importado ${f.name}${marcou}${plano}${ign}`, ruim: !n && !r.plano });
  }

  return (
    <div className="panel stack cat-top">
      <div>
        <h2 style={{ margin: 0 }}>Catálogo do Set 1</h2>
        <p className="mute" style={{ margin: 0 }}>
          Marque quem entra no Set 1 do modo estilo TFT e planeje cada um: classes, habilidade e linha evolutiva (fica
          salvo neste navegador). Exportar baixa um set1.json com os marcados, o que a fonte informa e o planejamento;
          o grupo base sai do mesmo jeito em outro arquivo. Importar soma as marcações e restaura o planejamento.
        </p>
      </div>
      <div className="cat-acts">
        <button type="button" id="catExport" className="btn main" disabled={!total || ocupado} onClick={() => void exportar(false)}>Exportar</button>
        <button type="button" id="catCopy" className="btn" disabled={!total || ocupado} onClick={() => void exportar(true)}>Copiar</button>
        <button type="button" id="catExportBase" className="btn" disabled={!totalBase || ocupado} onClick={() => void exportarBase()}
          title="Baixa o Set 1 (base) inteiro com o planejamento, sem precisar marcar ninguém">Exportar o grupo base</button>
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
  const linhas = useMemo(() => montarLinhas(lista ?? [], catOk), [lista, catOk]);
  const vista = cat.vistaAtual();
  const nLinhas = cat.linhasDe(k).length;
  const comInfo = catOk ? linhas.filter(l => l.info && Object.keys(l.info).length).length : 0;
  const nome = label(k);
  const pronto = c !== undefined && c !== 'carregando';

  return (
    <div className="panel stack cat-body" data-fr={k} style={style(k)} role="tabpanel" aria-label={nome}>
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
      <Segmented id="catVista" ariaLabel="Vista" value={vista} onChange={cat.escolherVista}
        options={[{ value: 'personagens', label: 'Personagens' }, { value: 'linhas', label: `Linhas · ${nLinhas}` }]} />

      {!lista ? (
        st === 'falhou'
          ? <p id="catLista" className="note bad">A lista de {nome} não carregou. Recarregue a página pra tentar de novo.</p>
          : <p id="catLista" className="mute">Carregando a lista de {nome}…</p>
      ) : vista === 'linhas' ? (
        <VistaLinhas k={k} linhas={linhas} pronto={pronto} />
      ) : (
        <VistaPersonagens k={k} linhas={linhas} campos={catOk ? catOk.campos : null} pronto={pronto} />
      )}
    </div>
  );
}

function VistaPersonagens({ k, linhas, campos: camposCat, pronto }: { k: string; linhas: readonly Linha[]; campos: Campo[] | null; pronto: boolean }) {
  const f = cat.filtrosDe(k);
  const g = cat.grupoAtual();
  const grupo = cat.grupoDe(k);
  const marc = cat.marcados(k);
  const doBase = cat.grupoBase(k);
  const temBase = !!(cat.base() && cat.base() !== 'carregando');
  const unidades = cat.unidadesDe(k);
  const classes = cat.classes();
  const linhasEvo = cat.linhasDe(k);
  const indice = useMemo(() => pl.indiceLinhas(linhasEvo), [linhasEvo]);
  const ultsBase = cat.ultsBase(k);
  const porNome = useMemo(() => new Map(linhas.map(l => [l.nome, l])), [linhas]);
  // habilidade, nomes das classes e ult, pra busca
  const textos = useMemo(() => {
    const nomes = new Map(classes.map(x => [x.id, x.nome]));
    return new Map([...new Set([...Object.keys(unidades), ...Object.keys(ultsBase)])].map(n => {
      const u = unidades[n];
      return [n, normalizar([u?.habilidade ?? '', ...(u?.classes ?? []).map(id => nomes.get(id) ?? ''), pl.ultEfetiva(u, ultsBase[n])].join('\n'))];
    }));
  }, [unidades, classes, ultsBase]);
  const ctx = useMemo<Contexto>(() => ({
    grupo,
    classes: n => unidades[n]?.classes,
    linha: n => indice.get(n)?.linha,
    ult: n => pl.ultEfetiva(unidades[n], ultsBase[n]),
    texto: n => textos.get(n) ?? '',
  }), [grupo, unidades, indice, ultsBase, textos]);
  const opsUlt = useMemo(() => opcoesUlt(linhas, f, ctx), [linhas, f, ctx]);
  // o filtro de ult só aparece na franquia em que alguém tem ult
  const temUlt = !!f.ult || Object.keys(ultsBase).length > 0 || Object.values(unidades).some(u => u.ult);
  const filtradas = useMemo(() => filtrar(linhas, f, ctx), [linhas, f, ctx]);
  const campos = useMemo(() => (camposCat ? camposCat.filter(x => filtravel(linhas, x.id)) : []), [camposCat, linhas]);
  const ops = useMemo(() => campos.map(x => opcoes(linhas, x.id, f, ctx)), [campos, linhas, f, ctx]);
  const opsClasse = useMemo(() => opcoesClasse(linhas, classes.map(x => x.id), f, ctx), [linhas, classes, f, ctx]);
  const opsLinha = useMemo(() => opcoesLinha(linhas, f, ctx), [linhas, f, ctx]);
  // do grupo (base ou marcados), quem não está na lista do site
  const fora = useMemo(() => {
    const nomes = new Set(linhas.map(l => l.nome));
    return [...(g === 'base' ? doBase : marc)].filter(n => !nomes.has(n));
  }, [linhas, g, doBase, marc]);
  const vis = filtradas.slice(0, cat.quantosMostrar());
  const nome = label(k);
  const nomesClasse = new Map(classes.map(x => [x.id, x.nome]));
  // no celular os seletores dos campos ficam recolhidos atrás de um botão (no computador o botão nem aparece)
  const [abertos, setAbertos] = useState(false);
  const ativos = campos.filter(x => f.campos[x.id]).length;
  // as mesmas contagens das subabas (quem não está na lista do site aparece no aviso "não estão na lista")
  const grupos: { value: cat.Grupo; label: string }[] = [
    ...(temBase ? [{ value: 'base' as const, label: `${ROTULO_GRUPO.base} · ${doBase.size}` }] : []),
    { value: 'marcados', label: `${ROTULO_GRUPO.marcados} · ${marc.size}` },
    { value: 'todos', label: `${ROTULO_GRUPO.todos} · ${linhas.length}` },
  ];

  return (
    <>
      <div className="cat-tools">
        <div className="cat-grupo">
          <span className="mute">Grupo</span>
          <Segmented id="catGrupo" ariaLabel="Grupo" value={g} options={grupos} onChange={cat.escolherGrupo} />
        </div>
        {temFiltro(f) && <button type="button" id="catLimparFiltros" className="btn mini" onClick={() => cat.limparFiltros(k)}>Limpar filtros</button>}
      </div>
      <div className={'cat-filters' + (abertos ? '' : ' fechado')}>
        <label className="cat-field cat-q">
          <span>Buscar</span>
          <input id="catBusca" type="search" placeholder="Nome, informação, classe ou habilidade" value={f.q} onChange={e => cat.mudarFiltros(k, { q: e.target.value })} />
        </label>
        <label className="cat-field cat-pf">
          <span>Classe</span>
          <select id="catClasse" value={f.classe} onChange={e => cat.mudarFiltros(k, { classe: e.target.value })}>
            <option value="">Todas</option>
            {opsClasse.map(o => <option key={o.valor} value={o.valor}>{o.valor === SEM ? 'Sem classe' : nomesClasse.get(o.valor)} ({o.n})</option>)}
          </select>
        </label>
        <label className="cat-field cat-pf">
          <span>Linha</span>
          <select id="catLinha" value={f.linha} onChange={e => cat.mudarFiltros(k, { linha: e.target.value as FiltroLinha })}>
            <option value="">Todas</option>
            {opsLinha.map(o => <option key={o.valor} value={o.valor}>{ROTULO_LINHA[o.valor]} ({o.n})</option>)}
          </select>
        </label>
        {temUlt && (
          <label className="cat-field cat-pf">
            <span>Ult</span>
            <select id="catUlt" value={f.ult} onChange={e => cat.mudarFiltros(k, { ult: e.target.value as FiltroUlt })}>
              <option value="">Todas</option>
              {opsUlt.map(o => <option key={o.valor} value={o.valor}>{o.valor === 'com' ? 'Com ult' : 'Sem ult'} ({o.n})</option>)}
            </select>
          </label>
        )}
        {campos.length > 0 && (
          <button type="button" id="catCamposBtn" className="btn mini cat-campos-btn" aria-expanded={abertos} onClick={() => setAbertos(!abertos)}>
            {abertos ? 'Esconder os filtros por campo' : `Filtros por campo (${campos.length})`}{ativos ? ` · ${plural(ativos, 'ativo', 'ativos')}` : ''}
          </button>
        )}
        {campos.map((x, i) => <CampoFiltro key={x.id} k={k} campo={x} valor={f.campos[x.id] ?? ''} ops={ops[i]!} />)}
      </div>
      <div className="cat-count">
        <span id="catCount"><b>{filtradas.length}</b> de {linhas.length}</span>
        <button type="button" id="catMarcar" className="btn mini" disabled={!filtradas.some(l => !marc.has(l.nome))}
          onClick={() => cat.marcar(k, filtradas.map(l => l.nome), true)}>Marcar os filtrados</button>
        <button type="button" id="catDesmarcar" className="btn mini" disabled={!filtradas.some(l => marc.has(l.nome))}
          onClick={() => cat.marcar(k, filtradas.map(l => l.nome), false)}>Desmarcar os filtrados</button>
        <BotaoConfirmar id="catLimpar" rotulo="Limpar marcações" confirmar={`Confirmar: desmarcar ${marc.size}`} disabled={!marc.size} onConfirm={() => cat.limpar(k)} />
      </div>
      {fora.length > 0 && (
        <p id="catFora" className="mute" style={{ margin: 0 }}>
          {g === 'base' ? 'Do Set 1 (base)' : 'Marcados'} que não estão na lista de {nome}: {fora.slice(0, 8).join(', ')}{fora.length > 8 ? ` e mais ${fora.length - 8}` : ''}.
        </p>
      )}
      {filtradas.length ? (
        <ul id="catList" className="cat-list">
          {vis.map(l => (
            <LinhaCat key={l.nome} k={k} l={l} on={marc.has(l.nome)} campos={camposCat} pronto={pronto}
              unidade={unidades[l.nome]} pos={indice.get(l.nome)} classes={classes}
              ult={pl.ultEfetiva(unidades[l.nome], ultsBase[l.nome])} ultBase={ultsBase[l.nome] ?? ''} porNome={porNome} />
          ))}
        </ul>
      ) : (
        <div id="catVazio" className="mute">
          {grupo && !grupo.size && g !== 'todos' ? (
            <p style={{ margin: 0 }}>
              {g === 'base' ? `Ninguém de ${nome} no Set 1 (base).` : `Ninguém marcado em ${nome}.`}{' '}
              <button type="button" id="catVerTodos" className="btn mini" onClick={() => cat.escolherGrupo('todos')}>Ver todos</button>
            </p>
          ) : <p style={{ margin: 0 }}>Ninguém com esses filtros.</p>}
        </div>
      )}
      {filtradas.length > vis.length && (
        <button type="button" id="catMais" className="btn cat-mais" onClick={cat.mostrarMais}>
          Mostrar mais ({filtradas.length - vis.length} {filtradas.length - vis.length === 1 ? 'restante' : 'restantes'})
        </button>
      )}
    </>
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

/**
 * Um personagem: caixa de marcar, miniatura, nome e as informações da fonte (campos null = franquia sem catálogo);
 * embaixo, o planejamento: classes (com o seletor), linha evolutiva, ult e habilidade.
 * `pronto`: o catálogo já chegou (ou não existe), então já dá pra saber se ele tem a imagem.
 * `ult`: a forma da ult que vale ('' = sem); `ultBase`: a que a base dá; `porNome`: a lista da franquia (pra buscar a ult).
 */
const LinhaCat = memo(function LinhaCat({ k, l, on, campos, pronto, unidade, pos, classes, ult, ultBase, porNome }: {
  k: string;
  l: Linha;
  on: boolean;
  campos: Campo[] | null;
  pronto: boolean;
  unidade: pl.Unidade | undefined;
  pos: pl.PosLinha | undefined;
  classes: pl.Classe[];
  ult: string;
  ultBase: string;
  porNome: ReadonlyMap<string, Linha>;
}) {
  const info = campos ? resumoInfo(campos, l.info) : '';
  const [aberto, setAberto] = useState(false);
  const [ultAberta, setUltAberta] = useState(false);
  const nomeNorm = normalizar(l.nome);
  const minhas = pl.classesDaUnidade(unidade, classes);
  const hab = useTextoSalvo(unidade?.habilidade ?? '', t => cat.mudarHabilidade(k, l.nome, t));
  // Pokémon (decidido em 27/10): a 1ª e a 2ª forma da linha não têm habilidade nem ult; na forma final, a ult é virar
  // a próxima forma (a Mega, por exemplo), que só melhora os atributos
  const pokemon = k === 'pokemon';
  const semNada = pokemon && !!pos && pos.nivel < pos.linha.niveis.length - 1;
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
      <div className="cat-plano">
        <div className="cat-tags">
          {minhas.map(c => (
            <span key={c.id} className="cls-chip" data-classe={c.id} title={c.descricao}>
              {c.nome}
              <button type="button" aria-label={`Tirar a classe ${c.nome} de ${l.nome}`} onClick={() => cat.alternarClasse(k, l.nome, c.id)}>×</button>
            </span>
          ))}
          <button type="button" className="cls-add" aria-expanded={aberto} aria-label={`Classes de ${l.nome}`} onClick={() => setAberto(!aberto)}>
            {aberto ? 'Fechar' : minhas.length ? 'Classes' : '+ Classe'}
          </button>
          {pos ? <SeloLinha k={k} nome={l.nome} pos={pos} /> : (
            <button type="button" className="lin-nova-row" title={`Criar uma linha evolutiva começando por ${l.nome}`}
              onClick={() => cat.irParaLinha(k, cat.criarLinha(k, '', l.nome))}>+ Linha</button>
          )}
          {ult ? (
            <button type="button" className="ult-selo" aria-expanded={ultAberta} title={`Na ult, ${l.nome} vira ${ult}. Trocar ou tirar`}
              onClick={() => setUltAberta(!ultAberta)}>
              <Thumb l={porNome.get(ult) ?? linhaAvulsa(k, ult)} pronto={pronto} />
              {pokemon ? (
                <span>Ult: vira {ult} ({(pos ? pos.linha.niveis.length : 1) + 1}ª forma)<small> · só melhora todos os atributos</small></span>
              ) : <span>Ult: {ult}</span>}
            </button>
          ) : !semNada && (
            <button type="button" className="ult-add" aria-expanded={ultAberta} aria-label={`Ult de ${l.nome}`}
              title="A forma em que ele vira na ult (ex.: a Mega)" onClick={() => setUltAberta(!ultAberta)}>{ultAberta ? 'Fechar' : '+ Ult'}</button>
          )}
        </div>
        {ultAberta && (
          <div className="ult-ed" role="group" aria-label={`Ult de ${l.nome}`}>
            <BuscaPersonagem porNome={porNome} pronto={pronto} rotulo={`Forma da ult de ${l.nome}`} placeholder="Forma da ult (ex.: Mega)…"
              vazio={`Ninguém com esse nome em ${label(k)}.`} onFechar={() => setUltAberta(false)}
              // quem tem o nome dele (Mega Charizard X pro Charizard) vem primeiro
              prioridade={n => (normalizar(n).includes(nomeNorm) && n !== l.nome ? 0 : 2)}
              nota={n => (n === ultBase ? 'a da base' : '')}
              onEscolher={n => { cat.mudarUlt(k, l.nome, n); setUltAberta(false); }} />
            <div className="ult-acts">
              {ult && <button type="button" className="btn mini danger ult-tirar" onClick={() => { cat.mudarUlt(k, l.nome, ''); setUltAberta(false); }}>Tirar a ult</button>}
              {ultBase && ultBase !== ult && (
                <button type="button" className="btn mini ult-base" onClick={() => { cat.mudarUlt(k, l.nome, ultBase); setUltAberta(false); }}>Usar a da base ({ultBase})</button>
              )}
              <button type="button" className="btn mini" onClick={() => setUltAberta(false)}>Fechar</button>
            </div>
          </div>
        )}
        {aberto && (
          <div className="cls-opts" role="group" aria-label={`Escolher as classes de ${l.nome}`}>
            {classes.length ? classes.map(c => {
              const tem = minhas.includes(c);
              return (
                <button key={c.id} type="button" className={'cls-opt' + (tem ? ' on' : '')} data-classe={c.id} aria-pressed={tem} title={c.descricao}
                  onClick={() => cat.alternarClasse(k, l.nome, c.id)}>{c.nome}</button>
              );
            }) : <span className="mute">Nenhuma classe ainda: crie na subaba Classes.</span>}
          </div>
        )}
        {semNada && pos ? <p className="cat-sem-hab">Sem habilidade especial nem ult ({pos.nivel + 1}ª forma)</p> : (
          <textarea className="cat-hab" rows={1} placeholder="Habilidade…" aria-label={`Habilidade de ${l.nome}`}
            value={hab.txt} onChange={e => hab.mudar(e.target.value)} onBlur={hab.flush} />
        )}
      </div>
    </li>
  );
});

/** "Linha Charmander · nível 2 de 3", com as alternativas do nível e ✓ se a linha está confirmada; leva pra linha. */
function SeloLinha({ k, nome, pos }: { k: string; nome: string; pos: pl.PosLinha }) {
  const { linha, nivel } = pos;
  const alt = linha.niveis[nivel]!.filter(x => x !== nome);
  return (
    <button type="button" className={'lin-selo' + (linha.confirmada ? ' ok' : '')} data-linha={linha.id}
      title={(linha.confirmada ? 'Linha confirmada. ' : 'Linha ainda não confirmada. ') + 'Ver a linha'}
      onClick={() => cat.irParaLinha(k, linha.id)}>
      Linha {linha.nome} · nível {nivel + 1} de {linha.niveis.length}{alt.length ? ` · ou ${alt.join(', ')}` : ''}
      {linha.confirmada && <span className="ok-v"> ✓</span>}
    </button>
  );
}
