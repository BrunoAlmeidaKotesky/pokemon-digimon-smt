import { test, expect, type Page, type Locator } from '@playwright/test';
import { prepare, abrir, aba, nomes, franquias, lerStorage, LABEL, type Franquia, type MockOpts } from './helpers';

// Campeonato (mata-mata) e o chaveamento visual em #cupLogBody.

const TODAS = Object.keys(LABEL) as Franquia[];
interface Item { name: string; fr: string }
interface Jogo { w: Item; l: Item; par: [Item, Item] }

const rotulo = (it: Item) => `${it.name} (${LABEL[it.fr as Franquia]})`;
const ordenado = (xs: string[]) => [...xs].sort();

async function abrirCampeonato(page: Page, opts: MockOpts & { seed?: number; storage?: Record<string, unknown> } = {}) {
  await prepare(page, opts);
  await abrir(page);
  await aba(page, 'Campeonato');
  await expect(page.locator('#cupStart')).toBeVisible();
}

/** Configura e clica em Começar. `so` deixa marcadas só essas franquias. */
async function comecar(page: Page, cfg: { tamanho?: number; mix?: boolean; even?: boolean; so?: Franquia[] } = {}) {
  if (cfg.tamanho) await page.selectOption('#cupSize', String(cfg.tamanho));
  if (cfg.mix !== undefined) await page.locator('#cupMix').setChecked(cfg.mix);
  if (cfg.even !== undefined) await page.locator('#cupEven').setChecked(cfg.even);
  if (cfg.so) for (const k of TODAS) {
    const cb = page.locator(`#cup_${k}`);
    if (await cb.count()) await cb.setChecked(cfg.so.includes(k));
  }
  await page.locator('#cupStart').click();
  await expect(page.locator('#cupPlay')).toBeVisible();
}

/**
 * No site atual o #cupSetup tem a classe .stack (display:grid), que vence o [hidden] do navegador:
 * o atributo hidden é posto, mas o painel continua na tela. Aqui "escondido" aceita qualquer forma
 * (atributo hidden, fora do DOM ou invisível), pra valer também quando isso for corrigido.
 */
async function escondido(loc: Locator) {
  await expect.poll(async () => (await loc.count()) === 0 || (await loc.getAttribute('hidden')) !== null || !(await loc.isVisible())).toBe(true);
}
async function mostrando(loc: Locator) {
  await expect(loc).toBeVisible();
  await expect(loc).not.toHaveAttribute('hidden');
}

/** As duas cartas do confronto atual. */
async function cartas(page: Page): Promise<[Item, Item]> {
  await expect(page.locator('#cupRow .card')).toHaveCount(2);
  const n = await nomes(page, '#cupRow');
  const f = await franquias(page, '#cupRow');
  return [{ name: n[0]!, fr: f[0]! }, { name: n[1]!, fr: f[1]! }];
}

/** Clica na carta `idx` do confronto atual. */
async function escolher(page: Page, idx: number): Promise<Jogo> {
  const par = await cartas(page);
  await page.locator('#cupRow .card').nth(idx).click();
  return { w: par[idx]!, l: par[1 - idx]!, par };
}

const titulos = (page: Page) => page.locator('#cupLogBody .bk-col .bk-title');
const coluna = (page: Page, r: number) => page.locator(`#cupLogBody .match[data-r="${r}"]`);
const confronto = (page: Page, r: number, m: number) => page.locator(`#cupLogBody .match[data-r="${r}"][data-m="${m}"]`);
/** data-fr de todos os slots preenchidos de uma coluna. */
const frsDaColuna = (page: Page, r: number) =>
  page.locator(`#cupLogBody .match[data-r="${r}"] .slot:not(.empty)`).evaluateAll(els => els.map(e => (e as HTMLElement).dataset.fr ?? ''));
const nomesDaColuna = async (page: Page, r: number) =>
  (await page.locator(`#cupLogBody .match[data-r="${r}"] .slot:not(.empty) .nm`).allTextContents()).map(s => s.trim());
const linhas = async (page: Page) => (await page.locator('#cupLogBody .bk-lines path').getAttribute('d')) ?? '';
/** Cada confronto ligado ao seguinte vira um "M..." no path. */
const segmentos = async (page: Page) => (await linhas(page)).split('M').length - 1;
/** drawLines roda num requestAnimationFrame. */
const doisFrames = (page: Page) => page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))));

const contar = (xs: string[]) => xs.reduce<Record<string, number>>((o, x) => ((o[x] = (o[x] ?? 0) + 1), o), {});

async function confrontoDecidido(page: Page, r: number, m: number, j: Jogo) {
  const mt = confronto(page, r, m);
  await expect(mt.locator('.slot.win')).toHaveCount(1);
  await expect(mt.locator('.slot.lose')).toHaveCount(1);
  await expect(mt.locator('.slot.win .nm')).toHaveText(j.w.name);
  await expect(mt.locator('.slot.win')).toHaveAttribute('data-fr', j.w.fr);
  await expect(mt.locator('.slot.lose .nm')).toHaveText(j.l.name);
  await expect(mt.locator('.slot.lose')).toHaveAttribute('data-fr', j.l.fr);
  await expect(mt.locator('.slot.win')).toHaveCSS('font-weight', '700');
  await expect(mt.locator('.slot.lose')).toHaveCSS('opacity', '0.4');
}

async function confrontoVazio(mt: Locator) {
  await expect(mt.locator('.slot')).toHaveCount(2);
  await expect(mt.locator('.slot.empty')).toHaveCount(2);
  await expect(mt.locator('.nm')).toHaveText(['???', '???']);
}

/** Joga `n` confrontos seguidos, alternando a carta escolhida. */
async function jogar(page: Page, n: number): Promise<Jogo[]> {
  const out: Jogo[] = [];
  for (let i = 0; i < n; i++) out.push(await escolher(page, i % 2));
  return out;
}

test.describe('campeonato: configuração', () => {
  test('valores padrão da configuração', async ({ page }) => {
    await abrirCampeonato(page);
    await mostrando(page.locator('#cupSetup'));
    await expect(page.locator('#cupSetup h2')).toHaveText('Novo campeonato');
    await expect(page.locator('#cupPlay')).toBeHidden();
    await expect(page.locator('#cupEnd')).toBeHidden();
    await expect(page.locator('#cupLog')).toBeHidden();
    await expect(page.locator('#cupSize option')).toHaveText(['8', '16', '32', '64', '128']);
    await expect(page.locator('#cupSize')).toHaveValue('16');
    const caixas = page.locator('#cupFr input[type=checkbox]');
    await expect(caixas).toHaveCount(TODAS.length);
    for (const k of TODAS) await expect(page.locator(`#cup_${k}`)).toBeChecked();
    expect((await page.locator('#cupFr label').allTextContents()).map(s => s.trim())).toEqual(TODAS.map(k => LABEL[k]));
    await expect(page.locator('#cupEven')).toBeChecked();
    await expect(page.locator('#cupMix')).toBeChecked();
    await expect(page.locator('#cupStart')).toHaveText('Começar');
  });

  test('sem franquia carregada marcada o botão avisa e volta a "Começar"', async ({ page }) => {
    await abrirCampeonato(page, { falha: ['pokemon'] });
    // só Pokémon (que falhou) marcado
    for (const k of TODAS) await page.locator(`#cup_${k}`).setChecked(k === 'pokemon');
    await page.locator('#cupStart').click();
    await expect(page.locator('#cupStart')).toHaveText('Marque uma franquia já carregada');
    await expect(page.locator('#cupPlay')).toBeHidden();
    await expect(page.locator('#cupLog')).toBeHidden();
    await mostrando(page.locator('#cupSetup'));
    await expect(page.locator('#cupStart')).toHaveText('Começar', { timeout: 5000 });
    // nenhuma marcada
    await page.locator('#cup_pokemon').uncheck();
    await page.locator('#cupStart').click();
    await expect(page.locator('#cupStart')).toHaveText('Marque uma franquia já carregada');
    await expect(page.locator('#cupPlay')).toBeHidden();
    await expect(page.locator('#cupStart')).toHaveText('Começar', { timeout: 5000 });
  });
});

test.describe('campeonato: partidas e chaveamento', () => {
  test('8 participantes evitando a mesma franquia, até o campeão', async ({ page }) => {
    await abrirCampeonato(page);
    await comecar(page, { tamanho: 8 });
    await escondido(page.locator('#cupSetup'));
    await expect(page.locator('#cupEnd')).toBeHidden();
    await mostrando(page.locator('#cupLog'));
    await expect(titulos(page)).toHaveText(['Quartas de final', 'Semifinal', 'Final', 'Campeão']);
    await expect(coluna(page, 0)).toHaveCount(4);
    await expect(coluna(page, 1)).toHaveCount(2);
    await expect(coluna(page, 2)).toHaveCount(1);
    const campeaoBk = page.locator('#cupLogBody .match.champ');
    await expect(campeaoBk).toHaveCount(1);
    await expect(campeaoBk).toHaveAttribute('data-r', '3');
    await expect(campeaoBk).toHaveAttribute('data-m', '0');
    await expect(campeaoBk.locator('.slot.empty .nm')).toHaveText('???');

    // ---- quartas
    const quartas: Jogo[] = [];
    for (let i = 0; i < 4; i++) {
      await expect(page.locator('#cupRound')).toHaveText('Quartas de final');
      await expect(page.locator('#cupCount')).toHaveText(`confronto ${i + 1} de 4`);
      const par = await cartas(page);
      expect(par[0].fr, 'mesma franquia na 1ª rodada').not.toBe(par[1].fr);
      const now = page.locator('#cupLogBody .match.now');
      await expect(now).toHaveCount(1);
      await expect(now).toHaveAttribute('data-r', '0');
      await expect(now).toHaveAttribute('data-m', String(i));
      await expect(now.locator('.nm')).toHaveText(par.map(p => p.name));
      await expect(now.locator('.slot.win, .slot.lose, .slot.empty')).toHaveCount(0);
      for (let m = 0; m < 4; m++) {
        if (m < i) await confrontoDecidido(page, 0, m, quartas[m]!);
        if (m > i) await confrontoVazio(confronto(page, 0, m));
      }
      // modo misto: as rodadas seguintes só se formam depois, então ficam todas "???"
      await expect(page.locator('#cupLogBody .match[data-r="1"] .slot.empty')).toHaveCount(4);
      await expect(page.locator('#cupLogBody .match[data-r="2"] .slot.empty')).toHaveCount(2);
      await expect(campeaoBk.locator('.slot.empty')).toHaveCount(1);
      await expect(page.locator('#cupLogBody .match[data-r="1"] .slot:not(.empty), #cupLogBody .match[data-r="2"] .slot:not(.empty)')).toHaveCount(0);

      const j = await escolher(page, i % 2);
      quartas.push(j);
      await confrontoDecidido(page, 0, i, j);
      if (i < 3) {
        // modo misto: sem linha enquanto a próxima rodada não existe
        await doisFrames(page);
        expect(await linhas(page)).toBe('');
      }
    }
    // dividir igualmente: 8 vagas pras 12 franquias, então 8 franquias diferentes com 1 cada
    const fr0 = await frsDaColuna(page, 0);
    expect(fr0).toHaveLength(8);
    expect(Object.keys(contar(fr0))).toHaveLength(8);
    Object.keys(contar(fr0)).forEach(k => expect(TODAS).toContain(k));
    expect(Object.values(contar(fr0))).toEqual(Array(8).fill(1));

    // ---- semifinal
    await expect(page.locator('#cupRound')).toHaveText('Semifinal');
    await expect(page.locator('#cupCount')).toHaveText('confronto 1 de 2');
    await expect(titulos(page)).toHaveText(['Quartas de final', 'Semifinal', 'Final', 'Campeão']);
    await expect(page.locator('#cupLogBody .match[data-r="0"] .slot.win')).toHaveCount(4);
    await expect(page.locator('#cupLogBody .match[data-r="0"] .slot.lose')).toHaveCount(4);
    await expect(page.locator('#cupLogBody .match[data-r="0"] .slot.empty')).toHaveCount(0);
    await expect(confronto(page, 1, 0)).toHaveClass(/\bnow\b/);
    await confrontoVazio(confronto(page, 1, 1));
    await confrontoVazio(confronto(page, 2, 0));
    // as quartas agora ligam até a semifinal
    await expect.poll(() => segmentos(page)).toBe(4);
    expect(await linhas(page)).not.toContain('NaN');

    const semis: Jogo[] = [];
    for (let i = 0; i < 2; i++) {
      await expect(page.locator('#cupRound')).toHaveText('Semifinal');
      await expect(page.locator('#cupCount')).toHaveText(`confronto ${i + 1} de 2`);
      const now = page.locator('#cupLogBody .match.now');
      await expect(now).toHaveCount(1);
      await expect(now).toHaveAttribute('data-r', '1');
      await expect(now).toHaveAttribute('data-m', String(i));
      const j = await escolher(page, 1 - (i % 2));
      semis.push(j);
    }
    // a semifinal tem exatamente os vencedores das quartas
    expect(ordenado(await nomesDaColuna(page, 1))).toEqual(ordenado(quartas.map(q => q.w.name)));
    semis.forEach(s => expect(quartas.map(q => q.w.name)).toContain(s.w.name));
    await confrontoDecidido(page, 1, 0, semis[0]!);
    await confrontoDecidido(page, 1, 1, semis[1]!);

    // ---- final
    await expect(page.locator('#cupRound')).toHaveText('Final');
    await expect(page.locator('#cupCount')).toHaveText('confronto 1 de 1');
    await expect(page.locator('#cupLogBody .match.now')).toHaveAttribute('data-r', '2');
    await expect.poll(() => segmentos(page)).toBe(6);
    const final = await escolher(page, 0);
    expect(ordenado(final.par.map(p => p.name))).toEqual(ordenado(semis.map(s => s.w.name)));

    // ---- fim
    await expect(page.locator('#cupPlay')).toBeHidden();
    await mostrando(page.locator('#cupEnd'));
    await expect(page.locator('#cupEnd h2')).toHaveText('Campeão');
    const champ = page.locator('#champRow .card');
    await expect(champ).toHaveCount(1);
    await expect(champ.locator('.name')).toHaveText(final.w.name);
    await expect(champ).toHaveAttribute('data-fr', final.w.fr);
    await expect(champ.locator('.fr')).toHaveText(LABEL[final.w.fr as Franquia]);
    await expect(champ.locator('.crown')).toHaveText('♛ campeão');
    await expect(champ.locator('.key')).toHaveCount(0);
    await expect(page.locator('#cupEnd p').nth(0)).toHaveText(`2º lugar: ${rotulo(final.l)}`);
    await expect(page.locator('#cupEnd p').nth(1)).toHaveText(`Semifinalistas: ${semis.map(s => rotulo(s.l)).join(', ')}`);
    // chaveamento completo
    await mostrando(page.locator('#cupLog'));
    await expect(titulos(page)).toHaveText(['Quartas de final', 'Semifinal', 'Final', 'Campeão']);
    await expect(page.locator('#cupLogBody .match.now')).toHaveCount(0);
    await expect(page.locator('#cupLogBody .slot.empty')).toHaveCount(0);
    await expect(page.locator('#cupLogBody .slot.win')).toHaveCount(7);
    await expect(page.locator('#cupLogBody .slot.lose')).toHaveCount(7);
    await confrontoDecidido(page, 2, 0, final);
    await expect(campeaoBk.locator('.nm')).toHaveText(final.w.name);
    await expect(campeaoBk.locator('.slot')).toHaveAttribute('data-fr', final.w.fr);
    await expect.poll(() => segmentos(page)).toBe(7);

    // novo campeonato volta pra configuração
    await page.locator('#cupAgain').click();
    await mostrando(page.locator('#cupSetup'));
    await expect(page.locator('#cupEnd')).toBeHidden();
    await expect(page.locator('#cupLog')).toBeHidden();
    await expect(page.locator('#cupPlay')).toBeHidden();
    await expect(page.locator('#cupStart')).toHaveText('Começar');
  });

  test('16 participantes com chave fixa (sem evitar a mesma franquia), até o campeão', async ({ page }) => {
    await abrirCampeonato(page);
    await comecar(page, { mix: false });
    const nomesRodadas = ['Rodada de 16', 'Quartas de final', 'Semifinal', 'Final'];
    await expect(titulos(page)).toHaveText([...nomesRodadas, 'Campeão']);
    for (const [r, n] of [8, 4, 2, 1].entries()) await expect(coluna(page, r)).toHaveCount(n);
    await expect(page.locator('#cupLogBody .match.champ')).toHaveAttribute('data-r', '4');

    let anteriores: Item[] | null = null;
    let decididos = 0;
    const rodadas: Jogo[][] = [];
    for (const [r, n] of [8, 4, 2, 1].entries()) {
      const jogos: Jogo[] = [];
      for (let i = 0; i < n; i++) {
        await expect(page.locator('#cupRound')).toHaveText(nomesRodadas[r]!);
        await expect(page.locator('#cupCount')).toHaveText(`confronto ${i + 1} de ${n}`);
        const now = page.locator('#cupLogBody .match.now');
        await expect(now).toHaveAttribute('data-r', String(r));
        await expect(now).toHaveAttribute('data-m', String(i));
        if (i === 0 && r > 0) {
          // Comportamento atual: na nova rodada só o 1º confronto aparece; os outros voltam a "???",
          // embora já tenham aparecido com nome na coluna enquanto a rodada anterior era jogada.
          for (let m = 1; m < n; m++) await confrontoVazio(confronto(page, r, m));
        }
        const j = await escolher(page, (i + r) % 2);
        // chave fixa: quem joga é o par de vencedores dos confrontos 2i e 2i+1 da rodada anterior
        if (anteriores) expect(j.par.map(p => p.name)).toEqual([anteriores[2 * i]!.name, anteriores[2 * i + 1]!.name]);
        jogos.push(j);
        decididos++;
        await confrontoDecidido(page, r, i, j);
        // a linha aparece logo depois de decidir (na chave fixa o destino já é conhecido)
        await expect.poll(() => segmentos(page)).toBe(decididos);
        if (r < 3 && i < n - 1) {
          // a coluna da próxima rodada já mostra quem passou, sem win/lose
          const prox = confronto(page, r + 1, i >> 1);
          const s = prox.locator('.slot').nth(i % 2);
          await expect(s.locator('.nm')).toHaveText(j.w.name);
          await expect(s).toHaveAttribute('data-fr', j.w.fr);
          await expect(s).not.toHaveClass(/\b(win|lose|empty)\b/);
          if (i % 2 === 0) await expect(prox.locator('.slot').nth(1)).toHaveClass(/\bempty\b/);
          // e o restante da rodada atual continua "???"
          for (let m = i + 2; m < n; m++) await confrontoVazio(confronto(page, r, m));
        }
      }
      rodadas.push(jogos);
      anteriores = jogos.map(j => j.w);
    }
    const final = rodadas[3]![0]!;
    await mostrando(page.locator('#cupEnd'));
    await expect(page.locator('#champRow .card .name')).toHaveText(final.w.name);
    await expect(page.locator('#cupEnd p').nth(0)).toHaveText(`2º lugar: ${rotulo(final.l)}`);
    await expect(page.locator('#cupEnd p').nth(1)).toHaveText(`Semifinalistas: ${rodadas[2]!.map(s => rotulo(s.l)).join(', ')}`);
    await expect(page.locator('#cupLogBody .match.champ .nm')).toHaveText(final.w.name);
    await expect(page.locator('#cupLogBody .slot.empty')).toHaveCount(0);
    await expect(page.locator('#cupLogBody .slot.win')).toHaveCount(15);
    await expect.poll(() => segmentos(page)).toBe(15);
  });

  test('evitar a mesma franquia e dividir igualmente valem em 16 e 32', async ({ page }) => {
    await abrirCampeonato(page);
    for (const tamanho of [16, 32]) {
      await comecar(page, { tamanho });
      await expect(page.locator('#cupRound')).toHaveText(`Rodada de ${tamanho}`);
      for (let i = 0; i < tamanho / 2; i++) {
        await expect(page.locator('#cupCount')).toHaveText(`confronto ${i + 1} de ${tamanho / 2}`);
        const j = await escolher(page, i % 2);
        expect(j.par[0].fr, 'mesma franquia na 1ª rodada').not.toBe(j.par[1].fr);
      }
      const frs = await frsDaColuna(page, 0);
      expect(frs).toHaveLength(tamanho);
      const c = Object.values(contar(frs));
      expect(c).toHaveLength(TODAS.length);
      expect(Math.max(...c) - Math.min(...c)).toBeLessThanOrEqual(1);
      await page.locator('#cupQuit').click();
      await mostrando(page.locator('#cupSetup'));
    }
  });

  test('Abandonar volta pra configuração e esconde o jogo e o chaveamento', async ({ page }) => {
    await abrirCampeonato(page);
    await comecar(page, { tamanho: 8 });
    await escolher(page, 0);
    await expect(page.locator('#cupCount')).toHaveText('confronto 2 de 4');
    await page.locator('#cupQuit').click();
    await mostrando(page.locator('#cupSetup'));
    await expect(page.locator('#cupPlay')).toBeHidden();
    await expect(page.locator('#cupLog')).toBeHidden();
    await expect(page.locator('#cupEnd')).toBeHidden();
    await expect(page.locator('#cupStart')).toHaveText('Começar');
    // as teclas não escolhem mais nada
    await page.keyboard.press('1');
    await expect(page.locator('#cupPlay')).toBeHidden();
    // a configuração continua como estava (8)
    await expect(page.locator('#cupSize')).toHaveValue('8');
    // começar de novo é um campeonato do zero
    await comecar(page);
    await expect(page.locator('#cupRound')).toHaveText('Quartas de final');
    await expect(page.locator('#cupCount')).toHaveText('confronto 1 de 4');
    await expect(page.locator('#cupLogBody .slot.win')).toHaveCount(0);
    await expect(page.locator('#cupLogBody .match.now')).toHaveAttribute('data-m', '0');
  });

  test('trocar de aba no meio mantém o campeonato', async ({ page }) => {
    await abrirCampeonato(page);
    await comecar(page, { tamanho: 8 });
    const j = await escolher(page, 1);
    const par = await cartas(page);
    await aba(page, 'Duelo');
    await aba(page, 'Campeonato');
    await expect(page.locator('#cupRound')).toHaveText('Quartas de final');
    await expect(page.locator('#cupCount')).toHaveText('confronto 2 de 4');
    expect(await cartas(page)).toEqual(par);
    await confrontoDecidido(page, 0, 0, j);
    await expect(page.locator('#cupLogBody .match.now')).toHaveAttribute('data-m', '1');
  });

  test('campeonato não grava no Placar', async ({ page }) => {
    await abrirCampeonato(page);
    await comecar(page, { tamanho: 8 });
    await jogar(page, 7);
    await mostrando(page.locator('#cupEnd'));
    expect(await lerStorage(page, 'pdx-stats')).toBeNull();
    await aba(page, 'Placar');
    await expect(page.locator('#histList li')).toHaveText(['Nada ainda.']);
    await expect(page.locator('#bestStreak')).toHaveText('Nenhuma sequência ainda.');
    await expect(page.locator('#statsList .n')).toHaveText(TODAS.map(() => '0% · 0/0'));
  });
});

test.describe('campeonato: franquia com poucos personagens', () => {
  const SUJI5: [string, string][] = [['Suji Um', '001'], ['Suji Dois', '002'], ['Suji Três', '003'], ['Suji Quatro', '004'], ['Suji Cinco', '005']];
  const sujiNomes = SUJI5.map(x => x[0]);

  test('Sujimon (5) + JoJo em 16 com divisão igual: as outras completam as vagas', async ({ page }) => {
    await abrirCampeonato(page, { sujimon: SUJI5 });
    await expect(page.locator('#status')).toContainText('Sujimon: 5');
    await comecar(page, { so: ['sujimon', 'jojo'] });
    await expect(page.locator('#cupRound')).toHaveText('Rodada de 16');
    await expect(page.locator('#cupCount')).toHaveText('confronto 1 de 8');
    await jogar(page, 8);
    await expect(page.locator('#cupRound')).toHaveText('Quartas de final');
    const frs = await frsDaColuna(page, 0);
    expect(frs).toHaveLength(16);
    expect(contar(frs)).toEqual({ sujimon: 5, jojo: 11 });
    const suji = (await page.locator('#cupLogBody .match[data-r="0"] .slot[data-fr=sujimon] .nm').allTextContents()).map(s => s.trim());
    expect(ordenado(suji)).toEqual(ordenado(sujiNomes));
    // ninguém repetido
    const todos = await nomesDaColuna(page, 0);
    expect(new Set(todos).size).toBe(16);
  });

  test('só Sujimon (5) em 8: cai pra 4 participantes', async ({ page }) => {
    await abrirCampeonato(page, { sujimon: SUJI5 });
    await comecar(page, { tamanho: 8, so: ['sujimon'] });
    await expect(page.locator('#cupRound')).toHaveText('Semifinal');
    await expect(page.locator('#cupCount')).toHaveText('confronto 1 de 2');
    await expect(titulos(page)).toHaveText(['Semifinal', 'Final', 'Campeão']);
    await expect(coluna(page, 0)).toHaveCount(2);
    expect(await franquias(page, '#cupRow')).toEqual(['sujimon', 'sujimon']);
    const semis = await jogar(page, 2);
    const nomes4 = await nomesDaColuna(page, 0);
    expect(nomes4).toHaveLength(4);
    expect(new Set(nomes4).size).toBe(4);
    nomes4.forEach(n => expect(sujiNomes).toContain(n));
    await expect(page.locator('#cupRound')).toHaveText('Final');
    await expect(page.locator('#cupCount')).toHaveText('confronto 1 de 1');
    const [final] = await jogar(page, 1);
    await mostrando(page.locator('#cupEnd'));
    await expect(page.locator('#champRow .card .name')).toHaveText(final!.w.name);
    await expect(page.locator('#cupEnd p').nth(1)).toHaveText(`Semifinalistas: ${semis.map(s => rotulo(s.l)).join(', ')}`);
  });
});

test.describe('campeonato: rolagem do chaveamento', () => {
  test('chaveamento rola na horizontal quando não cabe', async ({ page }, info) => {
    await abrirCampeonato(page);
    // 16 no celular; no computador 16 quase cabe, então usa 64
    await comecar(page, { tamanho: info.project.name === 'celular' ? 16 : 64 });
    const bk = page.locator('#cupLogBody');
    await expect(bk).toHaveClass(/\bbracket\b/);
    await expect(bk).toHaveCSS('overflow-x', 'auto');
    const m = await bk.evaluate(e => ({ sw: e.scrollWidth, cw: e.clientWidth }));
    expect(m.sw).toBeGreaterThan(m.cw);
    await bk.evaluate(e => { e.scrollLeft = 150; });
    expect(await bk.evaluate(e => e.scrollLeft)).toBeGreaterThan(0);
    // quem rola é o chaveamento, não a página
    const doc = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(doc.sw).toBeLessThanOrEqual(doc.cw);
  });
});
