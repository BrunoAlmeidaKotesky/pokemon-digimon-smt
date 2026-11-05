// Painel "Informações" da partida (botão no topo da tela) e a lista de campeões de um traço (também usada no painel
// de traços da partida). Abas: todos os traços (degraus, efeitos e os campeões de cada um), as receitas dos Bakugan
// (componente × componente), as chances da loja por nível e as regras de ouro, XP, venda e dano. Os números vêm das
// constantes e funções da partida (src/autobatalha/partida) e do conteúdo, pra não ficarem desatualizados.
import { useEffect, useMemo, useRef, useState } from 'react';
import './info.css';
import { COMPONENTES, type CampeaoDados, type Custo, type Estrela, type Jogador, type Traco } from '../../autobatalha/tipos';
import { S } from '../../autobatalha/dados';
import { MULT_COMPLETO, TRACOS, combinar, contarTracos, type TracoAtivo } from '../../autobatalha/conteudo';
import {
  BONUS_SEQUENCIA, COPIAS_POR_CUSTO, COPIAS_POR_ESTRELA, CUSTO_ATUALIZAR, CUSTO_XP, ESTAGIO_DO_ITEM_COMPLETO, JUROS_MAX,
  MAX_ITENS, NIVEL_MAXIMO, OPCOES_DO_CARROSSEL, OURO_INICIAL, OURO_VITORIA, PESO_DONO, PRIMEIRO_ESTAGIO_DO_CARROSSEL,
  RENDA_BASE, RENDA_ESTAGIO_1, VAGAS_BANCO, VAGAS_LOJA, VIDA_INICIAL, XP_POR_COMPRA, XP_POR_RODADA,
  bonusSequencia, chancesLoja, danoBaseEstagio, danoDerrota, danoMonstros, juros, unidadesNoTabuleiro,
  valorVenda, xpParaProximo,
} from '../../autobatalha/partida';
import { propsDica } from './interacao';
import {
  Foto, IconeItem, MarcaDegrau, Moeda, corTraco, custoAttr, formaOuNada, imgForma, nomeItem, nomeTraco, pct, textoItem,
} from './comum';

export type AbaInfo = 'tracos' | 'bakugan' | 'loja' | 'regras';
const ABAS: { id: AbaInfo; nome: string }[] = [
  { id: 'tracos', nome: 'Traços' },
  { id: 'bakugan', nome: 'Bakugan' },
  { id: 'loja', nome: 'Loja e níveis' },
  { id: 'regras', nome: 'Regras' },
];
const CUSTOS: Custo[] = [1, 2, 3, 4, 5];
const ESTRELAS: Estrela[] = [1, 2, 3];

/** sem acento e minúsculo, pra busca */
const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

/** Um campeão do traço: a menor estrela em que ele tem o traço e a forma que tem (o traço conta pela forma atual). */
export interface CampeaoNoTraco { c: CampeaoDados; estrela: Estrela; forma: string }

/** Campeões do set que têm o traço em alguma estrela (origem: já na loja; classe: a 1ª forma da linha que tem), por
 *  estrela, custo e nome. */
export function campeoesComTraco(id: string): CampeaoNoTraco[] {
  const s = S();
  const out: CampeaoNoTraco[] = [];
  for (const c of s.dados.campeoes) {
    if (c.fr === id) { out.push({ c, estrela: 1, forma: c.niveis[0]![0]! }); continue; }
    for (const e of ESTRELAS) {
      const nivel = c.niveis[Math.min(e, c.niveis.length) - 1] ?? [];
      const forma = nivel.find(f => s.temForma(f) && s.forma(f).classes.includes(id));
      if (forma) { out.push({ c, estrela: e, forma }); break; }
    }
  }
  return out.sort((a, b) => a.estrela - b.estrela || a.c.custo - b.c.custo || a.c.nome.localeCompare(b.c.nome, 'pt-BR'));
}

/** traços do tabuleiro do jogador (vazio sem jogador) */
function tracosDo(eu: Jogador | null): TracoAtivo[] {
  if (!eu) return [];
  return contarTracos(unidadesNoTabuleiro(eu, true).map(u => ({ campeao: u.campeao, forma: u.forma })));
}

// ---------- painel ----------

export function Informacoes({ eu, fechar, aba, traco }: { eu: Jogador | null; fechar: () => void; aba?: AbaInfo; traco?: string }) {
  const [atual, setAtual] = useState<AbaInfo>(traco ? 'tracos' : aba ?? 'tracos');
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [fechar]);
  return (
    <div className="ab-sobreposto" onPointerDown={e => { if (e.target === e.currentTarget) fechar(); }}>
      <div id="abInfo" className="ab-info panel" role="dialog" aria-modal="true" aria-label="Informações da partida">
        <div className="ab-info-cab">
          <h2>Informações</h2>
          <div className="ab-info-abas" role="tablist" aria-label="Assunto">
            {ABAS.map(a => (
              <button key={a.id} type="button" role="tab" data-aba={a.id} aria-selected={a.id === atual}
                className={'ab-info-aba' + (a.id === atual ? ' on' : '')} onClick={() => setAtual(a.id)}>
                {a.nome}
              </button>
            ))}
          </div>
          <button type="button" id="abInfoFechar" className="btn mini" onClick={fechar}>Fechar</button>
        </div>
        <div className="ab-info-corpo" role="tabpanel" aria-label={ABAS.find(a => a.id === atual)?.nome}>
          {atual === 'tracos' && <AbaTracos eu={eu} inicial={traco} />}
          {atual === 'bakugan' && <AbaBakugan />}
          {atual === 'loja' && <AbaLoja eu={eu} />}
          {atual === 'regras' && <AbaRegras />}
        </div>
      </div>
    </div>
  );
}

// ---------- traços ----------

const GRUPOS: { tipo: Traco['tipo']; nome: string }[] = [
  { tipo: 'origem', nome: 'Origens' },
  { tipo: 'classe', nome: 'Classes' },
  { tipo: 'elemento', nome: 'Elementos' },
];
const ROTULO_TIPO: Partial<Record<Traco['tipo'], string>> = { origem: 'origem (franquia)', classe: 'classe', elemento: 'elemento' };

function AbaTracos({ eu, inicial }: { eu: Jogador | null; inicial?: string }) {
  const [busca, setBusca] = useState('');
  const [abertos, setAbertos] = useState<ReadonlySet<string>>(() => new Set(inicial ? [inicial] : []));
  const ref = useRef<HTMLDivElement>(null);
  const meus = useMemo(() => new Map(tracosDo(eu).map(t => [t.id, t])), [eu]);
  const quantos = useMemo(() => new Map(Object.keys(TRACOS).map(id => [id, campeoesComTraco(id).length])), []);
  useEffect(() => {
    if (!inicial) return;
    const el = [...(ref.current?.querySelectorAll<HTMLElement>('[data-traco]') ?? [])].find(x => x.dataset.traco === inicial);
    el?.scrollIntoView({ block: 'start' });
  }, [inicial]);
  const q = normalizar(busca);
  const passa = (t: Traco) => !q || normalizar(t.nome).includes(q) || normalizar(t.descricao).includes(q);
  const alternar = (id: string) => setAbertos(a => {
    const n = new Set(a);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const todos = Object.values(TRACOS);
  const algum = todos.some(passa);
  return (
    <div ref={ref} className="ab-info-tracos-aba">
      <div className="ab-info-busca">
        <input id="abInfoBusca" type="search" placeholder="Buscar traço pelo nome ou efeito" value={busca} aria-label="Buscar traço"
          onChange={e => setBusca(e.target.value)} />
        <span className="mute">O número no hexágono é quantos campeões diferentes do traço você tem no tabuleiro.</span>
      </div>
      {!algum && <p className="mute">Nenhum traço com esse nome.</p>}
      {GRUPOS.map(g => {
        const lista = todos.filter(t => t.tipo === g.tipo && passa(t));
        if (!lista.length) return null;
        return (
          <section key={g.tipo} className="ab-info-grupo">
            <h3>{g.nome} <small className="mute">{lista.length}</small></h3>
            <ul className="ab-info-tracos">
              {lista.map(t => {
                const meu = meus.get(t.id);
                const n = meu?.n ?? 0;
                const nivel = meu?.nivel ?? -1;
                const aberto = abertos.has(t.id);
                const total = quantos.get(t.id) ?? 0;
                return (
                  <li key={t.id} className={'ab-info-traco' + (nivel >= 0 ? ' ativo' : '') + (aberto ? ' aberto' : '')} data-traco={t.id} style={corTraco(t.id)}>
                    <div className="ab-info-traco-cab">
                      <MarcaDegrau id={t.id} n={n} nivel={nivel} total={t.degraus.length} />
                      <div className="tit">
                        <b>{t.nome}</b>
                        <span className="mute">
                          {ROTULO_TIPO[t.tipo] ?? t.tipo}
                          {n > 0 ? ` · ${n} no seu tabuleiro${nivel >= 0 ? `, degrau ${nivel + 1}` : ''}` : ''}
                        </span>
                      </div>
                      <button type="button" className={'ab-chip' + (aberto ? ' on' : '')} aria-expanded={aberto} data-ver-campeoes={t.id}
                        onClick={() => alternar(t.id)}>
                        Campeões ({total})
                      </button>
                    </div>
                    <p className="ab-info-desc">{t.descricao}</p>
                    {t.degraus.length > 0 && (
                      <ol className="ab-info-degraus">
                        {t.degraus.map((d, k) => (
                          <li key={k} className={k === nivel ? 'on' : k < nivel ? 'feito' : undefined}>
                            <b>({d})</b> {t.textos[k] ?? ''}
                          </li>
                        ))}
                      </ol>
                    )}
                    {aberto && <CampeoesDoTraco id={t.id} eu={eu} />}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** Grade dos campeões do traço: primeiro os que já têm na forma da loja, depois os que só ganham ao evoluir (com a
 *  estrela e a forma). Os que o jogador tem ficam destacados (no tabuleiro mais forte que no banco). */
export function CampeoesDoTraco({ id, eu }: { id: string; eu: Jogador | null }) {
  const lista = useMemo(() => campeoesComTraco(id), [id]);
  const noTabuleiro = new Set(eu ? unidadesNoTabuleiro(eu, true).map(u => u.campeao) : []);
  const tem = new Set(eu ? Object.values(eu.unidades).map(u => u.campeao) : []);
  if (!lista.length) return <p className="ab-ct-vazio mute">Nenhum campeão do set tem esse traço.</p>;
  const ja = lista.filter(x => x.estrela === 1);
  const depois = lista.filter(x => x.estrela > 1);
  const grade = (itens: CampeaoNoTraco[], rotulo: string) => (
    <ul className="ab-ct" aria-label={rotulo} data-ct={id}>
      {itens.map(({ c, estrela, forma }) => {
        const onde = noTabuleiro.has(c.id) ? 'tabuleiro' : tem.has(c.id) ? 'banco' : null;
        const nomeForma = formaOuNada(forma)?.nome ?? c.nome;
        return (
          <li key={c.id} className={'ab-ct-c' + (onde ? ' tem ' + onde : '')} {...custoAttr(c.custo)} data-campeao={c.id}
            data-estrela={estrela}
            aria-label={`${c.nome}, custo ${c.custo}${estrela > 1 ? `, ganha o traço na estrela ${estrela}` : ''}${onde === 'tabuleiro' ? ', no seu tabuleiro' : onde === 'banco' ? ', no seu banco' : ''}`}
            {...propsDica({ tipo: 'campeao', campeao: c.id, forma, estrela, etiqueta: estrela > 1 ? `tem o traço na estrela ${estrela}` : 'campeão do traço' })}>
            <Foto src={imgForma(forma)} nome={nomeForma} className="redonda" />
            <span className="nm">{c.nome}</span>
            <span className="custo"><Moeda />{c.custo}</span>
            {estrela > 1 && <span className="evolui">{'★'.repeat(estrela)} {nomeForma}</span>}
            {onde && <span className="onde">{onde === 'tabuleiro' ? 'no tabuleiro' : 'no banco'}</span>}
          </li>
        );
      })}
    </ul>
  );
  return (
    <>
      {ja.length > 0 && grade(ja, `Campeões de ${nomeTraco(id)}`)}
      {depois.length > 0 && (
        <>
          <h4 className="ab-ct-sub">Ganham {nomeTraco(id)} ao evoluir</h4>
          {grade(depois, `Ganham ${nomeTraco(id)} ao evoluir`)}
        </>
      )}
    </>
  );
}

// ---------- Bakugan ----------

function AbaBakugan() {
  return (
    <div className="ab-info-bakugan">
      <p className="ab-info-nota">
        Dois componentes na mesma unidade viram o Bakugan completo na hora (nos itens soltos, solte um componente em cima do
        outro). O completo soma os bônus dos dois ×{String(MULT_COMPLETO).replace('.', ',')} e ganha um efeito próprio: passe o
        mouse em cima pra ler. Cada unidade carrega até {MAX_ITENS} itens.
      </p>
      <div className="ab-info-rolar">
        <table id="abInfoReceitas" className="ab-info-receitas">
          <thead>
            <tr>
              <th className="canto" aria-label="Componente × componente"><span aria-hidden="true">×</span></th>
              {COMPONENTES.map(c => (
                <th key={c} scope="col" {...propsDica({ tipo: 'item', id: c })}>
                  <IconeItem id={c} />
                  <small>{nomeItem(c)}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPONENTES.map(a => (
              <tr key={a}>
                <th scope="row" {...propsDica({ tipo: 'item', id: a })}>
                  <IconeItem id={a} />
                  <small>{nomeItem(a)}</small>
                </th>
                {COMPONENTES.map(b => {
                  const id = combinar(a, b);
                  return (
                    <td key={b} data-item={id} className={a === b ? 'igual' : undefined} {...propsDica({ tipo: 'item', id })}>
                      <IconeItem id={id} />
                      <small>{nomeItem(id)}</small>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Componentes</h3>
      <ul className="ab-info-comp">
        {COMPONENTES.map(c => (
          <li key={c} {...propsDica({ tipo: 'item', id: c })}>
            <IconeItem id={c} />
            <span><b>{nomeItem(c)}</b> {textoItem(c)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- loja e níveis ----------

function AbaLoja({ eu }: { eu: Jogador | null }) {
  const niveis = Array.from({ length: NIVEL_MAXIMO }, (_, i) => i + 1);
  const porCusto = S().porCusto;
  return (
    <div className="ab-info-loja">
      <p className="ab-info-nota">
        Cada uma das {VAGAS_LOJA} vagas da loja sorteia um custo pela linha do seu nível; dentro do custo, campeão que você já
        tem pesa {PESO_DONO} e os outros 1. A última vaga é a do time: só campeões que dividem origem ou classe com o seu
        tabuleiro.
      </p>
      <div className="ab-info-rolar">
        <table id="abInfoChances" className="ab-info-tabela ab-info-chances">
          <thead>
            <tr>
              <th scope="col">Nível</th>
              {CUSTOS.map(c => <th key={c} scope="col" {...custoAttr(c)} className="cu"><Moeda />{c}</th>)}
              <th scope="col">XP pro próximo</th>
              <th scope="col">Unidades no tabuleiro</th>
            </tr>
          </thead>
          <tbody>
            {niveis.map(n => {
              const ch = chancesLoja(n);
              const xp = xpParaProximo(n);
              return (
                <tr key={n} data-nivel={n} className={eu?.nivel === n ? 'eu' : undefined}>
                  <th scope="row">{n}{eu?.nivel === n && <small> (você)</small>}</th>
                  {ch.map((p, i) => (
                    <td key={i} {...custoAttr(i + 1)} className={p > 0 ? 'tem' : 'zero'} style={{ ['--p' as string]: `${Math.round(p * 100)}%` }}>
                      {p > 0 ? pct(p) : '—'}
                    </td>
                  ))}
                  <td>{xp ? `${xp} XP` : 'máximo'}</td>
                  <td>{n}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="ab-info-nota">
        Comprar XP: <Moeda />{CUSTO_XP} dá {XP_POR_COMPRA} XP; todo planejamento (a partir da 1-2) dá {XP_POR_RODADA} XP de
        graça. Stand de JoJo ocupa vaga no tabuleiro como qualquer unidade.
      </p>
      <h3>Pool compartilhado</h3>
      <div className="ab-info-rolar">
        <table className="ab-info-tabela ab-info-pool">
          <thead>
            <tr>
              <th scope="col">Custo</th>
              {CUSTOS.map(c => <th key={c} scope="col" {...custoAttr(c)} className="cu"><Moeda />{c}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Cópias de cada campeão</th>
              {CUSTOS.map(c => <td key={c}>{COPIAS_POR_CUSTO[c]}</td>)}
            </tr>
            <tr>
              <th scope="row">Campeões diferentes</th>
              {CUSTOS.map(c => <td key={c}>{porCusto[c].length}</td>)}
            </tr>
            <tr>
              <th scope="row">Cópias no pool</th>
              {CUSTOS.map(c => <td key={c}>{COPIAS_POR_CUSTO[c] * porCusto[c].length}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="ab-info-nota mute">Os 8 jogadores compram do mesmo pool; vender devolve as cópias.</p>
    </div>
  );
}

// ---------- regras ----------

/** menor quantidade de ouro guardado que rende `n` de juros (pela função da partida) */
function ouroParaJuros(n: number): number | null {
  for (let o = 0; o <= 1000; o++) if (juros(o) >= n) return o;
  return null;
}

/** "2 seguidas +1, 3 +2, …, 5 ou mais +4", pelo bônus da partida */
function textoSequencia(): string {
  const ultimo = BONUS_SEQUENCIA.length - 1;
  const partes: string[] = [];
  for (let n = 1; n <= ultimo; n++) {
    const b = bonusSequencia(n);
    if (b <= 0) continue;
    const quem = n === ultimo ? `${n} ou mais` : String(n);
    partes.push(partes.length ? `${quem} +${b}` : `${quem} seguidas +${b}`);
  }
  return partes.join(', ');
}

/** "2: 2, 3: 3, …, 7+: 11": base do dano da derrota por estágio (o 7 vale pros seguintes) */
function textoDanoBase(): string {
  const partes: string[] = [];
  for (let e = 2; e <= 7; e++) partes.push(`${e}${e === 7 ? '+' : ''}: ${danoBaseEstagio(e)}`);
  return partes.join(', ');
}

/** campeão de exemplo de cada custo, pra tabela de venda (valorVenda da partida) */
function vendaDe(custo: Custo, estrela: Estrela): number | null {
  const c = S().porCusto[custo][0];
  if (!c) return null;
  return valorVenda({ uid: -1, campeao: c.id, estrela, forma: S().formaPadrao(c.id, estrela), itens: [] });
}

function AbaRegras() {
  const passo = ouroParaJuros(1);
  const teto = ouroParaJuros(JUROS_MAX);
  const exemplo = danoDerrota(4, [1, 1, 2]);
  const monstros1 = danoMonstros(1);
  return (
    <div className="ab-info-regras">
      <section>
        <h3>Partida</h3>
        <ul>
          <li>Você contra 7 bots, todos com {VIDA_INICIAL} de vida. Ganha quem sobrar; a colocação é a ordem de eliminação.</li>
          <li>Estágio 1: três rodadas contra monstros. Do 2 em diante: seis contra jogadores e a 7ª contra monstros (um chefe do 3 em diante).</li>
          <li>
            Carrossel no começo de cada estágio a partir do {PRIMEIRO_ESTAGIO_DO_CARROSSEL}: {OPCOES_DO_CARROSSEL} campeões, cada um com
            um item (componente antes do estágio {ESTAGIO_DO_ITEM_COMPLETO}, Bakugan completo dali em diante); quem tem menos vida
            escolhe antes, em duplas.
          </li>
        </ul>
      </section>
      <section>
        <h3>Ouro</h3>
        <ul>
          <li>Começa com <Moeda />{OURO_INICIAL}. Na 1-2 e na 1-3 entram <Moeda />{RENDA_ESTAGIO_1}.</li>
          <li>Do 2-1 em diante, no começo de cada planejamento: <Moeda />{RENDA_BASE} + juros + sequência.</li>
          <li>
            Juros: +1 a cada {passo ?? '?'} de ouro guardado, até +{JUROS_MAX}
            {teto != null ? ` (com ${teto} ou mais)` : ''}.
          </li>
          <li>Sequência (de vitórias ou de derrotas): {textoSequencia()}.</li>
          <li>Vencer contra jogador: +<Moeda />{OURO_VITORIA}. Rodada de monstros: vencer dá componente(s) e ouro (o chefe dá mais).</li>
          <li>Atualizar a loja: <Moeda />{CUSTO_ATUALIZAR}. Comprar XP: <Moeda />{CUSTO_XP} por {XP_POR_COMPRA} XP.</li>
        </ul>
      </section>
      <section>
        <h3>Banco, itens e venda</h3>
        <ul>
          <li>Banco com {VAGAS_BANCO} vagas; com ele cheio, só dá pra comprar o que fecha uma evolução.</li>
          <li>3 cópias iguais viram uma de estrela acima. Cada unidade carrega até {MAX_ITENS} itens; vendeu, os itens voltam.</li>
          <li>
            Venda: custo × cópias (★1 = {COPIAS_POR_ESTRELA[1]}, ★2 = {COPIAS_POR_ESTRELA[2]}, ★3 = {COPIAS_POR_ESTRELA[3]}),
            menos 1 na ★2 e na ★3 quando o custo é 2 ou mais:
          </li>
        </ul>
        <div className="ab-info-rolar">
          <table className="ab-info-tabela ab-info-venda">
            <thead>
              <tr>
                <th scope="col">Venda</th>
                {CUSTOS.map(c => <th key={c} scope="col" {...custoAttr(c)} className="cu"><Moeda />{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {ESTRELAS.map(e => (
                <tr key={e}>
                  <th scope="row">{'★'.repeat(e)}</th>
                  {CUSTOS.map(c => {
                    const v = vendaDe(c, e);
                    return <td key={c}>{v == null ? '—' : v}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h3>Dano da derrota</h3>
        <ul>
          <li>Base do estágio ({textoDanoBase()}) + metade, arredondada pra cima, de 1 por inimigo vivo + 1 por estrela acima da 1ª desses vivos.</li>
          <li>Ex.: no estágio 4, perder pra 3 inimigos vivos (um deles ★2) tira {exemplo} de vida.</li>
          <li>
            Contra monstros, perder tira só a base do estágio
            {monstros1 === 0 ? ' (o estágio 1 não tira vida)' : ''}.
          </li>
        </ul>
      </section>
    </div>
  );
}
