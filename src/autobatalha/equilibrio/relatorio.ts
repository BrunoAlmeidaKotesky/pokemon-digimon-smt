// Escreve o docs/tft/matematica/equilibrio.md a partir dos números do playtest (equilibrio.playtest.ts). As faixas de
// equilíbrio ficam em FAIXAS (medidas.ts); aqui só monta as tabelas e as listas do que ficou fora.
import { S } from '../dados';
import { CHANCE_MOEDA_ABATE, CHANCE_MOEDA_LANCAR, HABILIDADES_CLASSE, ITENS, PASSIVAS, TETO_MOEDAS, TRACOS } from '../conteudo';
import { ORIGENS, type Estrela, type Origem } from '../tipos';
import { somaLancVazia, type Equivalente, type Grupo, type LinhaCampeao, type SomaLanc, type TabelaLanc } from './laboratorio';
import {
  FAIXAS, foraDaFaixa, foraDaMediana, media, mediana, num, pct, quantil, tabela, taxa, type Placar,
} from './medidas';
import type { EstatPartidas } from './partidas';

export interface ResultadoCurva { p: Grupo; q: Grupo; placar: Placar }
export interface ResultadoPacote { classe: string; estrela: Estrela; eq: Equivalente }
export interface ResultadoTraco { traco: string; nivel: number; estrela: Estrela; eq: Equivalente }
export interface ResultadoItem { item: string; estrela: Estrela; eq: Equivalente }
export interface ResultadoOrigens { limite: number; estrela: Estrela; placares: ReadonlyMap<Origem, Placar> }
export interface ResultadoEvolucao { fr: Origem; de: 1 | 2; soLinhas: boolean; eq: Equivalente }

export interface Resultados {
  /** AAAA-MM-DD */
  data: string;
  /** semente base de tudo */
  base: number;
  /** quantos cenários em cada medida (curva, traço, item, pacote) e sementes das partidas */
  cenarios: { curva: number; tracos: number; itens: number; pacotes: number; origens: number; evolucao: number; partidas: number[] };
  campeoes?: LinhaCampeao[];
  curva?: ResultadoCurva[];
  pacotes?: ResultadoPacote[];
  tracos?: ResultadoTraco[];
  itens?: ResultadoItem[];
  partidas?: EstatPartidas;
  /** lançamentos nas lutas da curva por custo */
  lancCurva?: TabelaLanc;
  origens?: ResultadoOrigens[];
  evolucao?: ResultadoEvolucao[];
}

const g = (x: Grupo) => `★${x.estrela} custo ${x.custo}`;
const nomeTraco = (id: string) => S().nomeTraco(id);
const nomeItem = (id: string) => ITENS[id]?.nome ?? id;
const nomeHab = (l: LinhaCampeao): string => {
  if (!l.habilidade) return '(só ataca)';
  const c = HABILIDADES_CLASSE[l.habilidade];
  if (c) return c.nome;
  if (l.habilidade === 'golpe') return 'Golpe';
  if (S().temForma(l.habilidade)) return `Vira ${S().forma(l.habilidade).nome}`;
  return 'própria';
};
const nomePapel = (id: string) => (id === 'unicos' ? 'Únicos' : nomeTraco(id));
/** valor da habilidade por lançamento, em múltiplos do dano de ataque */
const valorLanc = (l: LinhaCampeao) => (l.habDano + l.habCura + l.habEscudo) / l.danoAtaque;
const PAPEIS_DANO = ['porradeiro', 'assassino', 'atirador', 'dragao', 'demoniacos'];

// =================================================================================================================

function secaoCurva(r: Resultados): string {
  const curva = r.curva ?? [];
  if (!curva.length) return '';
  const fora: string[] = [];
  const linhas = curva.map(c => {
    const t = taxa(c.placar);
    let alvo = '';
    let faixa: readonly [number, number] | null = null;
    const umaAcima = c.p.estrela === c.q.estrela + 1;
    if (c.p.estrela === c.q.estrela && c.p.custo === c.q.custo + 1) faixa = FAIXAS.custoAcima;
    else if (umaAcima && c.q.custo === c.p.custo + 1) faixa = FAIXAS.duasEstrelasContraCusto2;
    else if (umaAcima && c.q.custo === c.p.custo + 2) faixa = FAIXAS.duasEstrelasContraCusto3;
    if (faixa) {
      alvo = `${pct(faixa[0])}–${pct(faixa[1])}`;
      const f = foraDaFaixa(t, faixa);
      if (f) fora.push(`${g(c.p)} contra ${g(c.q)}: ${pct(t)} (alvo ${alvo})`);
    }
    return [g(c.p), g(c.q), pct(t), alvo || '–'];
  });
  return [
    '## Curva por custo',
    '',
    `Times de 5 campeões sorteados (sem Stands) de um custo e estrela contra os de outro, ${r.cenarios.curva} cenários ` +
    'jogados dos dois lados. Alvo: custo de cima ganha da mesma estrela; uma estrela a mais ' +
    'briga com 1 e 2 custos acima (★2 de custo 1 contra ★1 de custo 2 e 3, e assim por diante).',
    '',
    tabela(['Time', 'Contra', 'Vitórias', 'Alvo'], linhas),
    '',
    fora.length ? `**Fora do alvo:** ${fora.join('; ')}.` : '**Tudo dentro do alvo.**',
  ].join('\n');
}

/** Junta as somas de lançamento que passam no filtro. */
function juntarLanc(t: TabelaLanc | undefined, filtro: (papel: string, custo: number, estrela: number) => boolean): SomaLanc {
  const out = somaLancVazia();
  for (const [k, v] of t ?? []) {
    const [papel, custo, estrela] = k.split('|');
    if (!filtro(papel!, Number(custo), Number(estrela))) continue;
    for (const c of Object.keys(out) as (keyof SomaLanc)[]) out[c] += v[c];
  }
  return out;
}
const primeiroDe = (s: SomaLanc) => (s.nPrimeiro ? s.primeiro / s.nPrimeiro : NaN);
const porDezDe = (s: SomaLanc) => (s.vivo ? (s.lanc / s.vivo) * 10 : NaN);

function secaoMana(r: Resultados): string {
  const tp = r.partidas?.lanc, tc = r.lancCurva;
  if (!tp?.size && !tc?.size) return '';
  const papeis = [...new Set([...(tp?.keys() ?? []), ...(tc?.keys() ?? [])].map(k => k.split('|')[0]!))];
  const linhaPapel = (nome: string, f: (p: string) => boolean) => {
    const sp = juntarLanc(tp, p => f(p)), sc = juntarLanc(tc, p => f(p));
    const tot = sp.manaAtaque + sp.manaGolpe + sp.manaConteudo || 1;
    const fr = (x: number) => pct(sp.n ? x / sp.n : NaN);
    return [nome, sp.n, num(primeiroDe(sp), 1), fr(sp.antes3), fr(sp.nPrimeiro - sp.antes3 - sp.depois10), fr(sp.depois10),
      fr(sp.n - sp.nPrimeiro), num(porDezDe(sp), 2),
      pct(sp.manaAtaque / tot), pct(sp.manaGolpe / tot), pct(sp.manaConteudo / tot), num(primeiroDe(sc), 1), num(porDezDe(sc), 2)];
  };
  papeis.sort((a, b) => primeiroDe(juntarLanc(tp ?? tc, p => p === a)) - primeiroDe(juntarLanc(tp ?? tc, p => p === b)));
  const tabPapel = tabela(
    ['Papel', 'Unidades-luta', '1º lanç. (s)', 'Antes de 3 s', '3–10 s', 'Depois de 10 s', 'Não lançou', 'Lanç./10 s vivo',
      'Mana de atacar', 'de apanhar', 'de efeitos',
      '1º lanç. 5×5 (s)', 'Lanç./10 s 5×5'],
    [...papeis.map(p => linhaPapel(nomePapel(p), x => x === p)), linhaPapel('**Todos**', () => true)],
  );
  const tabCusto = tabela(
    ['Custo', '1º lanç. ★1 (s)', '★2', '★3', 'Lanç./10 s ★1', '★2', '★3'],
    ([1, 2, 3, 4, 5] as const).map(c => {
      const de = (e: number) => juntarLanc(tp ?? tc, (_p, cu, es) => cu === c && es === e);
      return [c, ...[1, 2, 3].map(e => num(primeiroDe(de(e)), 1)), ...[1, 2, 3].map(e => num(porDezDe(de(e)), 2))];
    }),
  );
  const tanque = primeiroDe(juntarLanc(tp ?? tc, p => p === 'tanque'));
  const dano = primeiroDe(juntarLanc(tp ?? tc, p => PAPEIS_DANO.includes(p)));
  const cs = (r.campeoes ?? []).filter(l => !l.stand && l.habilidade);
  const primeiros = cs.map(l => l.primeiro).filter(Number.isFinite);
  const naFaixa = primeiros.filter(x => !foraDaFaixa(x, FAIXAS.primeiroLancamento)).length / (primeiros.length || 1);
  const rapidos = cs.filter(l => l.lancPorSegundo > FAIXAS.lancPorSegundoMax).sort((a, b) => b.lancPorSegundo - a.lancPorSegundo);
  const raros = cs.filter(l => l.lancou < FAIXAS.lancouMin && !(l.habilidade && S().temForma(l.habilidade)));
  const [p1, p2] = FAIXAS.primeiroLancamento;
  return [
    '## Mana e lançamentos',
    '',
    `Alvo: 1º lançamento entre ${num(p1)} e ${num(p2)} s pra maioria; tanque não lança antes dos papéis de dano ` +
    `(${PAPEIS_DANO.map(nomePapel).join(', ')}); ninguém lança mais de 1 vez a cada ${num(1 / FAIXAS.lancPorSegundoMax)} s ` +
    'vivo. Tabelas das partidas de bots (tabuleiros de verdade, com itens e traços) e, nas duas últimas colunas, da curva ' +
    'por custo (5 contra 5, sem itens). "Mana de apanhar" = golpes recebidos; "de efeitos" = habilidades, traços e itens ' +
    'que dão mana. Só unidades com habilidade.',
    '',
    tabPapel,
    '',
    tabCusto,
    '',
    `- Tanque: 1º lançamento em ${num(tanque, 1)} s; papéis de dano: ${num(dano, 1)} s` +
      (tanque < dano ? ' (**tanque mais rápido**).' : '.'),
    `- Rodízio (seção seguinte, 4 contra 4 com bonecos): 1º lançamento dentro de ${num(p1)}–${num(p2)} s em ${pct(naFaixa)} ` +
      `dos campeões (mediana ${num(mediana(primeiros), 1)} s).`,
    `- Lançam mais de 1 vez a cada ${num(1 / FAIXAS.lancPorSegundoMax)} s vivo no rodízio: ` +
      (rapidos.length ? rapidos.slice(0, 15).map(l => `${l.nome} ★${l.estrela} (${num(l.lancPorSegundo * 10, 1)} a cada 10 s)`).join(', ') +
        (rapidos.length > 15 ? ` e mais ${rapidos.length - 15}` : '') : 'ninguém') + '.',
    `- Lançam em menos de ${pct(FAIXAS.lancouMin)} das lutas do rodízio (fora transformação): ` +
      (raros.length ? raros.map(l => `${l.nome} ★${l.estrela} (${pct(l.lancou)})`).join(', ') : 'ninguém') + '.',
  ].join('\n');
}

function secaoCampeoes(r: Resultados): string {
  const cs = r.campeoes ?? [];
  if (!cs.length) return '';
  const partes: string[] = [
    '## Força por campeão',
    '',
    'Cada campeão (forma da estrela, ult padrão) com 3 bonecos do custo dele (atributos base, sem habilidade nem ' +
    'traço) contra cada outro do mesmo custo e estrela com os mesmos bonecos, em 3 disposições e dos dois lados ' +
    `(rodízio). Os Stands formam um grupo à parte, presos ao mesmo usuário. Faixa: ${pct(FAIXAS.campeao[0])} a ` +
    `${pct(FAIXAS.campeao[1])} de vitórias. "Valor/lanç." = dano + cura + escudo da habilidade por lançamento, em ` +
    'múltiplos do dano de ataque.',
    '',
  ];
  const resumo: (string | number)[][] = [];
  const foraTodos: LinhaCampeao[] = [];
  for (const custo of [1, 2, 3, 4, 5] as const) for (const estrela of [1, 2] as const) {
    const grupo = cs.filter(l => l.custo === custo && l.estrela === estrela && !l.stand);
    if (!grupo.length) continue;
    const fora = grupo.filter(l => foraDaFaixa(taxa(l.placar), FAIXAS.campeao));
    foraTodos.push(...fora);
    const ts = grupo.map(l => taxa(l.placar));
    resumo.push([custo, `★${estrela}`, grupo.length, `${pct(Math.min(...ts))}–${pct(Math.max(...ts))}`,
      pct(quantil(ts, 0.1)), pct(quantil(ts, 0.9)), fora.length]);
  }
  partes.push(tabela(['Custo', 'Estrela', 'Campeões', 'Vitórias (mín–máx)', '10%', '90%', 'Fora da faixa'], resumo), '');
  const linhaCamp = (l: LinhaCampeao) => [
    l.nome, l.custo, `★${l.estrela}`, nomePapel(l.papel), nomeHab(l), pct(taxa(l.placar)), num(l.dano), pct(l.sobrevive),
    num(l.primeiro, 1), num(l.lancPorSegundo * 10, 1), num(valorLanc(l), 1),
  ];
  const cab = ['Campeão', 'Custo', '★', 'Papel', 'Habilidade', 'Vitórias', 'Dano/luta', 'Vivo no fim', '1º lanç. (s)', 'Lanç./10 s', 'Valor/lanç.'];
  foraTodos.sort((a, b) => taxa(b.placar) - taxa(a.placar));
  partes.push('**Fora da faixa** (mais forte primeiro):', '', foraTodos.length ? tabela(cab, foraTodos.map(linhaCamp)) : 'ninguém.', '');
  const stands = cs.filter(l => l.stand);
  if (stands.length) {
    const fs = stands.filter(l => foraDaFaixa(taxa(l.placar), FAIXAS.campeao)).sort((a, b) => taxa(b.placar) - taxa(a.placar));
    partes.push('**Stands fora da faixa** (entre Stands do mesmo custo):', '', fs.length ? tabela(cab, fs.map(linhaCamp)) : 'nenhum.', '');
  }
  const todos = [...cs].sort((a, b) => a.custo - b.custo || a.estrela - b.estrela || Number(a.stand) - Number(b.stand) || taxa(b.placar) - taxa(a.placar));
  partes.push('<details><summary>Todos os campeões</summary>', '', tabela([...cab, 'Stand'], todos.map(l => [...linhaCamp(l), l.stand ? 'sim' : ''])), '', '</details>');
  return partes.join('\n');
}

function secaoHabilidades(r: Resultados): string {
  const cs = (r.campeoes ?? []).filter(l => l.habilidade && !l.stand && Number.isFinite(valorLanc(l)));
  if (!cs.length) return '';
  // ult de classe: média de quem usa (a ult padrão do campeão)
  const porUlt = new Map<string, LinhaCampeao[]>();
  for (const l of cs) if (l.habilidade && (HABILIDADES_CLASSE[l.habilidade] || l.habilidade === 'golpe')) {
    porUlt.set(l.habilidade, [...(porUlt.get(l.habilidade) ?? []), l]);
  }
  const ults = [...porUlt].sort((a, b) => media(b[1].map(l => taxa(l.placar))) - media(a[1].map(l => taxa(l.placar))));
  const tabUlt = tabela(['Ult', 'Classe', 'Campeões (★1 e ★2)', 'Vitórias (média)', 'Valor/lanç. (mediana)', 'Lanç./10 s'],
    ults.map(([id, ls]) => [HABILIDADES_CLASSE[id]?.nome ?? 'Golpe', id === 'golpe' ? '–' : nomePapel(id), ls.length,
      pct(media(ls.map(l => taxa(l.placar)))), num(mediana(ls.map(valorLanc)), 2), num(mediana(ls.map(l => l.lancPorSegundo)) * 10, 1)]));
  // fora da curva: valor por lançamento muito acima/abaixo da mediana do custo e estrela
  const fora: (string | number)[][] = [];
  for (const custo of [1, 2, 3, 4, 5] as const) for (const estrela of [1, 2] as const) {
    const grupo = cs.filter(l => l.custo === custo && l.estrela === estrela && !(l.habilidade && S().temForma(l.habilidade)));
    const med = mediana(grupo.map(valorLanc));
    for (const l of grupo) {
      const v = valorLanc(l);
      const f = v > med * FAIXAS.habilidadeMult ? 'acima' : v < med / FAIXAS.habilidadeMult ? 'abaixo' : null;
      if (f) fora.push([l.nome, custo, `★${estrela}`, nomeHab(l), num(v, 2), num(med, 2), f, pct(taxa(l.placar))]);
    }
  }
  return [
    '## Habilidades',
    '',
    'Ult de classe pela média de quem a usa como padrão (todas as estrelas e custos medidos):',
    '',
    tabUlt,
    '',
    `Valor por lançamento (em múltiplos do dano de ataque) mais de ${num(FAIXAS.habilidadeMult, 1)}× acima ou abaixo da ` +
    'mediana do custo e estrela (transformações fora). Abaixo nem sempre é fraco: controle (atordoar, provocar) e ' +
    'buff não entram no valor; olhe as vitórias.',
    '',
    fora.length ? tabela(['Campeão', 'Custo', '★', 'Habilidade', 'Valor/lanç.', 'Mediana do grupo', 'Onde', 'Vitórias'], fora) : 'Ninguém.',
  ].join('\n');
}

function secaoPacotes(r: Resultados): string {
  const ps = r.pacotes ?? [];
  if (!ps.length) return '';
  const classes = [...new Set(ps.map(p => p.classe))];
  const de = (c: string, e: Estrela) => ps.find(p => p.classe === c && p.estrela === e);
  const linhas = classes.map(c => [nomePapel(c), ...([1, 2] as const).flatMap(e => {
    const p = de(c, e);
    return p ? [pct(p.eq.taxa), pct(p.eq.equivalente, 0, true)] : ['–', '–'];
  })]).sort((a, b) => parseFloat(String(b[4]).replace(',', '.')) - parseFloat(String(a[4]).replace(',', '.')));
  const eqs = ps.filter(p => p.estrela === 2).map(p => p.eq.equivalente);
  const med = mediana(eqs);
  const fora = ps.filter(p => p.estrela === 2 && foraDaMediana(p.eq.equivalente, med, FAIXAS.relativoMediana, FAIXAS.folga));
  return [
    '## Pacote de cada classe (papel + ult)',
    '',
    'Um campeão sintético de custo 3 só com a classe (os atributos do papel e a ult da classe) e 3 bonecos, contra o ' +
    `mesmo time com um boneco no lugar dele. ${r.cenarios.pacotes} cenários. "Vale" = bônus de vida e dano no boneco ` +
    'que empata. É a régua dos papéis e das ults sem traço nem habilidade própria.',
    '',
    tabela(['Classe', 'Vitórias ★1', 'Vale ★1', 'Vitórias ★2', 'Vale ★2'], linhas),
    '',
    `Mediana ★2: ${pct(med, 0, true)}. ` + (fora.length
      ? `**Longe da mediana (★2):** ${fora.map(p => `${nomePapel(p.classe)} ${pct(p.eq.equivalente, 0, true)}`).join(', ')}.`
      : 'Todas perto da mediana.'),
  ].join('\n');
}

function secaoTracos(r: Resultados): string {
  const ts = r.tracos ?? [];
  if (!ts.length) return '';
  const tipo = (id: string) => TRACOS[id]?.tipo ?? 'classe';
  const bloco = (titulo: string, filtro: (id: string) => boolean, comparar: boolean) => {
    const ids = [...new Set(ts.filter(t => filtro(t.traco)).map(t => t.traco))];
    const maxDeg = Math.max(...ids.map(id => TRACOS[id]?.degraus.length ?? 0));
    const meds = Array.from({ length: maxDeg }, (_, n) => mediana(ts.filter(t => filtro(t.traco) && t.nivel === n).map(t => t.eq.equivalente)));
    const fora: string[] = [];
    const linhas = ids.map(id => {
      const t = TRACOS[id]!;
      return [nomeTraco(id), t.degraus.join('/'), ...Array.from({ length: maxDeg }, (_, n) => {
        const x = ts.find(y => y.traco === id && y.nivel === n);
        if (!x) return '–';
        if (comparar && foraDaMediana(x.eq.equivalente, meds[n]!, FAIXAS.relativoMediana, FAIXAS.folga)) {
          fora.push(`${nomeTraco(id)} (${t.degraus[n]}) ${pct(x.eq.equivalente, 0, true)}`);
          return `**${pct(x.eq.equivalente, 0, true)}**`;
        }
        return pct(x.eq.equivalente, 0, true);
      })];
    });
    return [
      `### ${titulo}`,
      '',
      tabela(['Traço', 'Degraus', ...Array.from({ length: maxDeg }, (_, n) => `Degrau ${n + 1}`)], [
        ...linhas, ...(comparar ? [['**Mediana**', '', ...meds.map(m => pct(m, 0, true))]] : []),
      ]),
      '',
      comparar ? (fora.length ? `**Longe da mediana do degrau:** ${fora.join('; ')}.` : 'Todos perto da mediana do degrau.') : '',
    ].join('\n');
  };
  return [
    '## Traços',
    '',
    'O time tem exatamente os campeões do degrau com o traço (sorteados, ★2) e mais 2 sem ele (JoJo: um usuário pra ' +
    'cada Stand); o outro lado é o mesmo time com o traço desligado. "Vale" = bônus de vida e dano no time todo que ' +
    `empata (${r.cenarios.tracos} cenários). Em negrito: mais de ${num(FAIXAS.relativoMediana[1], 1)}× longe da ` +
    'mediana do mesmo degrau. Origens: só referência (as escadas e os números delas não mudam aqui); Overwatch, ' +
    'Deadlock e Sujimon agem também fora da luta, e isso não entra.',
    '',
    bloco('Classes', id => tipo(id) === 'classe', true),
    '',
    bloco('Elementos', id => tipo(id) === 'elemento', true),
    '',
    bloco('Origens', id => tipo(id) === 'origem', false),
  ].join('\n');
}

function secaoItens(r: Resultados): string {
  const is = r.itens ?? [];
  if (!is.length) return '';
  const comp = is.filter(i => !i.item.includes('+')), compl = is.filter(i => i.item.includes('+'));
  const bloco = (lista: typeof is) => {
    const med = mediana(lista.map(i => i.eq.equivalente));
    const ord = [...lista].sort((a, b) => b.eq.equivalente - a.eq.equivalente);
    return {
      med,
      linhas: ord.map(i => {
        const f = foraDaMediana(i.eq.equivalente, med, FAIXAS.relativoMediana, FAIXAS.folga);
        const v = pct(i.eq.equivalente, 0, true);
        return [nomeItem(i.item), i.item, pct(i.eq.taxa), f ? `**${v}**` : v];
      }),
      fora: ord.filter(i => foraDaMediana(i.eq.equivalente, med, FAIXAS.relativoMediana, FAIXAS.folga)),
    };
  };
  const a = bloco(comp), b = bloco(compl);
  return [
    '## Itens',
    '',
    'Um portador sorteado (custo 2 a 4, ★2, sem Stands) com 3 bonecos; o outro lado é o mesmo time sem o item. ' +
    `"Vale" = bônus de vida e dano só no portador que empata (${r.cenarios.itens} cenários). Em negrito: mais de ` +
    `${num(FAIXAS.relativoMediana[1], 1)}× longe da mediana do grupo.`,
    '',
    `### Componentes (mediana ${pct(a.med, 0, true)})`,
    '',
    tabela(['Item', 'Id', 'Vitórias', 'Vale'], a.linhas),
    '',
    `### Completos (mediana ${pct(b.med, 0, true)})`,
    '',
    tabela(['Item', 'Id', 'Vitórias', 'Vale'], b.linhas),
    '',
    [...a.fora, ...b.fora].length
      ? `**Longe da mediana:** ${[...a.fora, ...b.fora].map(i => `${nomeItem(i.item)} ${pct(i.eq.equivalente, 0, true)}`).join(', ')}.`
      : 'Todos perto da mediana.',
  ].join('\n');
}

function secaoMoedas(r: Resultados): string {
  const ids = Object.keys(PASSIVAS);
  const cs = r.campeoes ?? [], mp = r.partidas?.moedas;
  if (!cs.length && !mp?.size) return '';
  const linhas = ids.map(id => {
    const de = (e: Estrela) => cs.find(l => l.campeao === id && l.estrela === e);
    const m = mp?.get(id);
    return [S().campeao(id).nome, PASSIVAS[id]!.nome, num(de(1)?.moedas ?? NaN, 2), num(de(2)?.moedas ?? NaN, 2),
      m ? m.lutas : 0, m && m.lutas ? num(m.moedas / m.lutas, 2) : '–'];
  });
  return [
    '## Ouro no chão (passivas)',
    '',
    `Regra: ao lançar a habilidade (${pct(CHANCE_MOEDA_LANCAR)}) e no golpe que derruba um inimigo ` +
    `(${pct(CHANCE_MOEDA_ABATE)}), chance de derrubar 1 de ouro, até ${TETO_MOEDAS.join('/')} por luta. Alvo: perto de ` +
    '1 de ouro por luta por campeão desses. Rodízio = lutas da força por campeão; partidas = por unidade-luta nas ' +
    'partidas de bots (com dois no mesmo lado, o ouro do lado é dividido).',
    '',
    tabela(['Campeão', 'Passiva', 'Ouro/luta rodízio ★1', '★2', 'Lutas nas partidas', 'Ouro/luta partidas'], linhas),
  ].join('\n');
}

function secaoPartidas(r: Resultados): string {
  const e = r.partidas;
  if (!e || !e.partidas) return '';
  const ord = (m: Map<string, Placar>, min: number) => [...m].filter(([, p]) => p.lutas >= min).sort((a, b) => taxa(b[1]) - taxa(a[1]));
  const tracos = ord(e.tracos, 30).map(([k, p]) => {
    const [id, n] = k.split(':');
    const t = TRACOS[id!];
    return [nomeTraco(id!), t ? `${t.degraus[Number(n)]}` : n!, p.lutas, pct(taxa(p))];
  });
  const itens = ord(e.itens, 30).map(([k, p]) => [nomeItem(k), p.lutas, pct(taxa(p))]);
  const monstros = [...e.monstros].sort((a, b) => {
    const [ea, ra] = a[0].split('-').map(Number), [eb, rb] = b[0].split('-').map(Number);
    return ea! - eb! || ra! - rb!;
  }).map(([k, p]) => [k, p.lutas, pct(taxa(p))]);
  return [
    '## Partidas de bots',
    '',
    `${e.partidas} partidas de 8 bots (sementes ${r.cenarios.partidas.join(', ')}); duram ${num(media(e.rodadas), 1)} ` +
    `rodadas em média e acabam no estágio ${num(media(e.estagioFinal), 1)}. ${pct(taxa(e.porTempo))} das lutas entre ` +
    'jogadores vão até os 30 s. As taxas misturam o efeito do traço/item com a força do tabuleiro de quem o tem ' +
    '(sinal, não medida isolada; essa é a das seções acima).',
    '',
    '### Vitórias com o traço ativo (degrau mais alto atingido; 30 lutas ou mais)',
    '',
    tabela(['Traço', 'Degrau', 'Lutas', 'Vitórias'], tracos),
    '',
    '### Vitórias com o item em alguém do time (30 lutas ou mais)',
    '',
    tabela(['Item', 'Lutas', 'Vitórias'], itens),
    '',
    '### Rodadas de monstros (vitórias dos jogadores)',
    '',
    tabela(['Rodada', 'Lutas', 'Vitórias'], monstros),
    '',
    '### Colocação pela origem mais usada (do estágio 3 em diante)',
    '',
    tabela(['Origem', 'Jogadores', 'Colocação média', 'Entre os 4 primeiros'], [...e.colocacoes]
      .sort((a, b) => media(a[1]) - media(b[1]))
      .map(([fr, cs]) => [nomeOrigem(fr), cs.length, num(media(cs), 2), pct(cs.filter(c => c <= 4).length / cs.length)])),
    '',
    '### Em campo por nível',
    '',
    tabela(['Nível', 'Jogador-rodadas', 'Unidades em média', 'Stands em média', 'Máximo'], [...e.campo]
      .sort((a, b) => a[0] - b[0])
      .map(([n, c]) => [n, c.n, num(c.unidades / c.n, 1), num(c.stands / c.n, 1), c.maximo])),
  ].join('\n');
}

const nomeOrigem = (o: string) => nomeTraco(o);

/** Colunas limite/estrela, uma linha por origem. */
function tabelaOrigens(rs: readonly ResultadoOrigens[]): string {
  const linhas = ORIGENS.map(o => [nomeOrigem(o), ...rs.map(x => pct(taxa(x.placares.get(o)!)))]);
  return tabela(['Origem', ...rs.map(x => `${x.limite} no tabuleiro, ★${x.estrela}`)], linhas);
}

function secaoOrigens(r: Resultados): string {
  const out: string[] = [];
  if (r.origens?.length) {
    out.push(
      '## Origens',
      '',
      `Time cheio de cada origem contra os times cheios das outras (${r.cenarios.origens} cenários por par, dos dois lados), com os ` +
      'custos da loja daquele nível e os traços valendo. JoJo: metade Stands, metade usuários de outras origens. ' +
      'Digimon: um terço do time de fora, pro Parceiro. Overwatch, Deadlock e Sujimon agem também fora da luta, e isso não ' +
      'entra aqui. Sem itens.',
      '',
      tabelaOrigens(r.origens),
      '',
    );
  }
  if (r.evolucao?.length) {
    const frs = [...new Set(r.evolucao.map(e => e.fr))];
    const linhas = frs.map(fr => {
      const de = (d: 1 | 2) => r.evolucao!.find(e => e.fr === fr && e.de === d);
      const x = de(1), y = de(2);
      return [nomeOrigem(fr) + (x?.soLinhas ? ' (linhas)' : ''), x ? pct(x.eq.equivalente, 0, true) : '–', y ? pct(y.eq.equivalente, 0, true) : '–'];
    });
    out.push(
      '### Quanto vale evoluir',
      '',
      `Os mesmos campeões numa estrela a mais: bônus de vida e dano no time da estrela de baixo que empata (${r.cenarios.evolucao} ` +
      'cenários, tabuleiro de 6). Pokémon, Digimon, SMT, Persona e Sujimon: só as linhas evolutivas.',
      '',
      tabela(['Origem', '★1 → ★2', '★2 → ★3'], linhas),
      '',
    );
  }
  return out.join('\n').trimEnd();
}

/** O equilibrio.md inteiro (a parte gerada; o histórico escrito à mão é juntado por quem grava). */
export function montarRelatorio(r: Resultados): string {
  const secoes = [secaoCurva(r), secaoMana(r), secaoCampeoes(r), secaoHabilidades(r), secaoPacotes(r), secaoTracos(r), secaoOrigens(r), secaoItens(r), secaoMoedas(r), secaoPartidas(r)]
    .filter(Boolean);
  return [
    '# Equilíbrio: playtest automático',
    '',
    `Gerado em ${r.data} por \`src/autobatalha/equilibrio/equilibrio.playtest.ts\` com o set, o motor e o conteúdo de ` +
    `verdade. Semente base ${r.base}: a mesma semente e o mesmo código dão os mesmos números. Como rodar e o que cada ` +
    'medida quer dizer: [README.md](README.md), seção "Playtest". Não edite a parte gerada à mão: rode de novo.',
    '',
    ...secoes.flatMap(s => [s, '']),
  ].join('\n');
}
