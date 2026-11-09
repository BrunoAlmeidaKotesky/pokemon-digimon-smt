// Playtest automático da Autobatalha: roda todas as medidas do laboratório e das partidas de bots e grava
// docs/tft/matematica/equilibrio.md (a parte de baixo, do marcador do histórico em diante, é escrita à mão e fica).
// Não entra no `vitest run` normal. Comando e opções: docs/tft/matematica/README.md, seção "Playtest".
//
//   node node_modules/vitest/vitest.mjs run --config src/autobatalha/equilibrio/playtest.config.ts
//
// Variáveis de ambiente (todas opcionais):
//   EQUILIBRIO_PARTES   lista separada por vírgula: campeoes,curva,pacotes,tracos,itens,partidas,origens,comps (padrão: todas)
//   EQUILIBRIO_RAPIDO=1 menos cenários (pra conferir um ajuste rápido; os números ficam mais ruidosos)
//   EQUILIBRIO_SAIDA    arquivo .md (padrão docs/tft/matematica/equilibrio.md)
//   EQUILIBRIO_JSON     se definido, grava também os números crus nesse arquivo .json
//   EQUILIBRIO_SEMENTE  semente base (padrão 2026)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { definirSet } from '../dados';
import { HABILIDADES_CLASSE, TRACOS } from '../conteudo';
import { ORIGENS, type Custo, type Estrela, type SetDados } from '../tipos';
import {
  curva, doisStandsNoTime, estenderSet, focosDoSet, focosEmConfronto, forcaPorCampeao, ganhoDeEvoluir, idsDosItens,
  origemContraOrigem, valorDoItem, valorDoPacote, valorDoTraco, type Grupo, type TabelaLanc,
} from './laboratorio';
import { juntarComHistorico } from './medidas';
import { jogarPartidas } from './partidas';
import { montarRelatorio, type Resultados } from './relatorio';

const env = process.env;
const RAPIDO = env.EQUILIBRIO_RAPIDO === '1';
const PARTES = new Set((env.EQUILIBRIO_PARTES ?? 'campeoes,curva,pacotes,tracos,itens,partidas,origens,comps').split(',').map(s => s.trim()));
const SAIDA = env.EQUILIBRIO_SAIDA ?? 'docs/tft/matematica/equilibrio.md';
const BASE = Number(env.EQUILIBRIO_SEMENTE ?? 2026);
const CENARIOS = RAPIDO
  ? { curva: 40, tracos: 20, itens: 30, pacotes: 24, origens: 6, evolucao: 12, comps: 6, doisStands: 30, partidas: Array.from({ length: 16 }, (_, i) => i + 1) }
  : { curva: 160, tracos: 60, itens: 90, pacotes: 72, origens: 20, evolucao: 40, comps: 24, doisStands: 120, partidas: Array.from({ length: 240 }, (_, i) => i + 1) };

/** Tabuleiro e estrela de cada coluna da comparação entre origens e das composições forçadas. */
const PONTOS_ORIGENS: readonly (readonly [number, Estrela])[] = [[4, 1], [6, 2], [8, 2], [10, 2], [10, 3]];
/** Origens em que a medida de evoluir olha só as linhas evolutivas. */
const COM_LINHAS = new Set<string>(['pokemon', 'digimon', 'smt', 'persona', 'sujimon']);
const G = (custo: Custo, estrela: Estrela): Grupo => ({ custo, estrela });
/** Confrontos da curva: [time, contra]. */
const CONFRONTOS: [Grupo, Grupo][] = [
  ...([1, 2] as const).flatMap(e => ([1, 2, 3, 4] as const).map(c => [G((c + 1) as Custo, e), G(c, e)] as [Grupo, Grupo])),
  [G(1, 2), G(1, 1)],
  [G(1, 2), G(2, 1)], [G(1, 2), G(3, 1)],
  [G(2, 2), G(3, 1)], [G(2, 2), G(4, 1)],
  [G(3, 2), G(4, 1)], [G(3, 2), G(5, 1)],
  [G(1, 3), G(2, 2)], [G(1, 3), G(3, 2)], [G(2, 3), G(4, 2)],
];

function log(msg: string): void {
  process.stdout.write(`[equilíbrio ${new Date().toISOString().slice(11, 19)}] ${msg}\n`);
}

it('playtest: mede e grava o equilibrio.md', () => {
  const dados = JSON.parse(readFileSync('public/autobatalha/set1.json', 'utf8')) as SetDados;
  const classes = [...Object.keys(HABILIDADES_CLASSE), 'unicos'];
  definirSet(estenderSet(dados, classes));
  const r: Resultados = { data: new Date().toISOString().slice(0, 10), base: BASE, cenarios: CENARIOS };

  if (PARTES.has('curva')) {
    log('curva por custo');
    const lanc: TabelaLanc = new Map();
    r.curva = CONFRONTOS.map(([p, q]) => ({ p, q, placar: curva(p, q, CENARIOS.curva, 5, BASE, lanc) }));
    r.lancCurva = lanc;
  }
  if (PARTES.has('campeoes')) {
    r.campeoes = [];
    for (const custo of [1, 2, 3, 4, 5] as const) for (const estrela of [1, 2] as const) {
      log(`campeões custo ${custo} ★${estrela}`);
      r.campeoes.push(...forcaPorCampeao(custo, estrela, BASE));
    }
  }
  if (PARTES.has('pacotes')) {
    log('pacotes de classe');
    r.pacotes = classes.flatMap(classe => ([1, 2] as const).map(estrela =>
      ({ classe, estrela, eq: valorDoPacote(classe, estrela, CENARIOS.pacotes, BASE) })));
  }
  if (PARTES.has('tracos')) {
    r.tracos = [];
    for (const [id, t] of Object.entries(TRACOS)) {
      log(`traço ${id}`);
      for (let nivel = 0; nivel < t.degraus.length; nivel++) {
        const eq = valorDoTraco(id, nivel, 2, CENARIOS.tracos, BASE);
        if (eq) r.tracos.push({ traco: id, nivel, estrela: 2, eq });
      }
    }
  }
  if (PARTES.has('itens')) {
    log('itens');
    r.itens = idsDosItens().map(item => ({ item, estrela: 2 as const, eq: valorDoItem(item, 2, CENARIOS.itens, BASE) }));
  }
  if (PARTES.has('partidas')) {
    log(`partidas de bots (${CENARIOS.partidas.length})`);
    r.partidas = jogarPartidas(CENARIOS.partidas.map(s => s + BASE), 120, { gravarUmaACada: 40 });
    // os invariantes valem em qualquer dificuldade: mais umas partidas só pra conferir, fora das estatísticas
    for (const dificuldade of ['facil', 'dificil'] as const) {
      log(`partidas de bots no ${dificuldade}, só invariantes`);
      const extra = jogarPartidas(CENARIOS.partidas.slice(0, Math.ceil(CENARIOS.partidas.length / 3)).map(s => s + BASE), 120, { dificuldade, gravarUmaACada: 40 });
      r.partidas.naoTerminaram += extra.naoTerminaram;
      r.partidas.errosConteudo.push(...extra.errosConteudo);
      for (const [k, x] of extra.violacoes) {
        const y = r.partidas.violacoes.get(k);
        if (y) y.n += x.n;
        else r.partidas.violacoes.set(k, x);
      }
    }
  }

  if (PARTES.has('origens')) {
    log('origem contra origem');
    r.origens = PONTOS_ORIGENS.map(([limite, estrela]) => ({ limite, estrela, placares: origemContraOrigem(limite, estrela, CENARIOS.origens, BASE) }));
    log('ganho de evoluir');
    r.evolucao = ORIGENS.filter(fr => fr !== 'jojo').flatMap(fr => ([1, 2] as const).map(de => {
      const soLinhas = COM_LINHAS.has(fr);
      return { fr, de, soLinhas, eq: ganhoDeEvoluir(fr, de, 6, CENARIOS.evolucao, BASE, soLinhas) };
    }));
  }
  if (PARTES.has('comps')) {
    const focos = focosDoSet(2);
    r.composicoes = {
      focos,
      oponentes: CENARIOS.comps,
      pontos: PONTOS_ORIGENS.map(([limite, estrela]) => {
        log(`composições forçadas (${focos.length} focos), ${limite} no tabuleiro, ★${estrela}`);
        return { limite, estrela, ...focosEmConfronto(focos, limite, estrela, CENARIOS.comps, BASE) };
      }),
      doisStands: ([4, 6, 8, 10] as const).map(limite => ({ limite, estrela: 2 as const, placar: doisStandsNoTime(limite, 2, CENARIOS.doisStands, BASE) })),
    };
  }

  const antigo = existsSync(SAIDA) ? readFileSync(SAIDA, 'utf8') : null;
  writeFileSync(SAIDA, juntarComHistorico(montarRelatorio(r), antigo));
  log(`gravado ${SAIDA}`);
  if (env.EQUILIBRIO_JSON) {
    const comoObjeto = (m: Map<string, unknown>) => Object.fromEntries(m);
    const json = { ...r, lancCurva: r.lancCurva && comoObjeto(r.lancCurva), partidas: r.partidas && {
      ...r.partidas, tracos: comoObjeto(r.partidas.tracos), itens: comoObjeto(r.partidas.itens), monstros: comoObjeto(r.partidas.monstros),
      lanc: comoObjeto(r.partidas.lanc), moedas: comoObjeto(r.partidas.moedas), colocacoes: comoObjeto(r.partidas.colocacoes),
      campo: comoObjeto(r.partidas.campo as unknown as Map<string, unknown>),
      almas: comoObjeto(r.partidas.almas as unknown as Map<string, unknown>),
      violacoes: comoObjeto(r.partidas.violacoes),
    }, origens: r.origens?.map(o => ({ ...o, placares: comoObjeto(o.placares as Map<string, unknown>) })),
    composicoes: r.composicoes && {
      ...r.composicoes,
      pontos: r.composicoes.pontos.map(p => ({ ...p, focos: comoObjeto(p.focos), campeoes: comoObjeto(p.campeoes) })),
    } };
    writeFileSync(env.EQUILIBRIO_JSON, JSON.stringify(json));
    log(`gravado ${env.EQUILIBRIO_JSON}`);
  }
});
