import { test, expect, type Page } from '@playwright/test';
import { prepare, abrir, aba, nomes, lerStorage, LABEL, type Franquia, type Stats } from './helpers';

// Ordem fixa das franquias no placar.
const ORDEM: Franquia[] = ['pokemon', 'digimon', 'smt', 'jojo', 'ygo', 'bakugan', 'lol', 'overwatch', 'deadlock', 'ff', 'sujimon'];
const VAZIO = { w: {}, n: {}, hist: [], best: null };

const lerStats = (page: Page) => lerStorage<Stats>(page, 'pdx-stats');

/** Soma de todas as participações gravadas (0 se não houver placar ou se ele estiver ilegível). */
const somaN = (page: Page) => page.evaluate(() => {
  try {
    const s = JSON.parse(localStorage.getItem('pdx-stats') || 'null');
    return Object.values((s && s.n) || {}).reduce<number>((a, b) => a + Number(b), 0);
  } catch { return 0; }
});

/**
 * Escolhe a carta `i` (1, 2, 3) pela tecla ou pelo clique e espera a escolha ser gravada
 * (cada participante soma 1 em n). Devolve os nomes que estavam na arena antes da escolha.
 */
async function escolher(page: Page, row: string, i: number, via: 'tecla' | 'clique' = 'tecla') {
  const antes = await nomes(page, row);
  const soma = await somaN(page);
  if (via === 'tecla') await page.keyboard.press(String(i));
  else await page.locator(`${row} .card`).nth(i - 1).click();
  await expect.poll(() => somaN(page)).toBe(soma + antes.length);
  return antes;
}

/** Linhas do placar: rótulo, texto da direita e largura declarada da barra. */
async function barras(page: Page) {
  await expect(page.locator('#statsList .meter')).toHaveCount(ORDEM.length);
  return page.locator('#statsList .meter').evaluateAll(ms => ms.map(m => ({
    rotulo: m.querySelector('b')?.textContent?.trim() ?? '',
    texto: m.querySelector('.n')?.textContent?.trim() ?? '',
    largura: (m.querySelector('.fill') as HTMLElement | null)?.style.width ?? '',
  })));
}

const zerado = ORDEM.map(k => ({ rotulo: LABEL[k], texto: '0% · 0/0', largura: '0%' }));

async function recarregar(page: Page) {
  await page.reload();
  await expect(page.locator('#status')).not.toContainText('carregando', { timeout: 15000 });
}

test.describe('placar', () => {
  test('placar vazio: tudo zerado, "Nenhuma sequência ainda." e "Nada ainda."', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await aba(page, 'Placar');
    expect(await barras(page)).toEqual(zerado);
    await expect(page.locator('#bestStreak')).toHaveText('Nenhuma sequência ainda.');
    await expect(page.locator('#histList li')).toHaveText(['Nada ainda.']);
    // só abrir o site não grava nada
    expect(await lerStats(page)).toBeNull();
  });

  test('Duelo grava: w pra franquia vencedora, n pras duas, histórico e maior sequência', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    const [a, b] = await escolher(page, '#duelRow', 1);
    const h1 = `${a} (Pokémon) venceu ${b} (Digimon)`;
    expect(await lerStats(page)).toEqual({
      w: { pokemon: 1 }, n: { pokemon: 1, digimon: 1 }, hist: [h1], best: { name: a, fr: 'pokemon', streak: 1 },
    });

    // agora o lado Digimon vence: quem escolhi antes ainda estava na arena
    const [a2, c] = await escolher(page, '#duelRow', 2);
    expect(a2).toBe(a);
    const h2 = `${c} (Digimon) venceu ${a} (Pokémon)`;
    expect(await lerStats(page)).toEqual({
      w: { pokemon: 1, digimon: 1 }, n: { pokemon: 2, digimon: 2 }, hist: [h2, h1],
      best: { name: a, fr: 'pokemon', streak: 1 }, // empate de sequência não substitui
    });

    await aba(page, 'Placar');
    const linhas = await barras(page);
    expect(linhas.slice(0, 2)).toEqual([
      { rotulo: 'Pokémon', texto: '50% · 1/2', largura: '50%' },
      { rotulo: 'Digimon', texto: '50% · 1/2', largura: '50%' },
    ]);
    expect(linhas.slice(2)).toEqual(zerado.slice(2));
    await expect(page.locator('#histList li')).toHaveText([h2, h1]);
    // comportamento atual: não há singular aqui ("1 vitórias seguidas")
    await expect(page.locator('#bestStreak')).toHaveText(`${a} (Pokémon): 1 vitórias seguidas`);
    await expect(page.locator('#bestStreak b')).toHaveText(a);
  });

  test('Trio grava: w pro vencedor, n pros três; não conta pra maior sequência', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await aba(page, 'Trio');
    await expect(page.locator('#trioRow .card')).toHaveCount(3);
    const [a, b, c] = await escolher(page, '#trioRow', 2, 'clique');
    const h1 = `${b} (Digimon) venceu ${a} (Pokémon), ${c} (SMT/Persona)`;
    expect(await lerStats(page)).toEqual({
      w: { digimon: 1 }, n: { pokemon: 1, digimon: 1, smt: 1 }, hist: [h1], best: null,
    });

    // o mesmo Digimon vence mais duas pela tecla 2
    const [, b2] = await escolher(page, '#trioRow', 2);
    expect(b2).toBe(b);
    await escolher(page, '#trioRow', 2);
    const s = await lerStats(page);
    expect(s!.w).toEqual({ digimon: 3 });
    expect(s!.n).toEqual({ pokemon: 3, digimon: 3, smt: 3 });
    expect(s!.hist).toHaveLength(3);
    expect(s!.hist[0]!.startsWith(`${b} (Digimon) venceu `)).toBe(true);
    expect(s!.hist[0]).toMatch(/ venceu .+ \(Pokémon\), .+ \(SMT\/Persona\)$/);
    expect(s!.best).toBeNull();

    await aba(page, 'Placar');
    const linhas = await barras(page);
    expect(linhas.slice(0, 3)).toEqual([
      { rotulo: 'Pokémon', texto: '0% · 0/3', largura: '0%' },
      { rotulo: 'Digimon', texto: '100% · 3/3', largura: '100%' },
      { rotulo: 'SMT/Persona', texto: '0% · 0/3', largura: '0%' },
    ]);
    await expect(page.locator('#histList li')).toHaveCount(3);
    await expect(page.locator('#histList li').last()).toHaveText(h1);
    await expect(page.locator('#bestStreak')).toHaveText('Nenhuma sequência ainda.');
  });

  test('mesma franquia nos dois lados: cada participante soma em n', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await page.selectOption('#duelB', 'pokemon');
    await expect(page.locator('#duelRow .card').nth(1)).toHaveAttribute('data-fr', 'pokemon');
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    const [a, b] = await escolher(page, '#duelRow', 1);
    expect(await lerStats(page)).toEqual({
      w: { pokemon: 1 }, n: { pokemon: 2 }, hist: [`${a} (Pokémon) venceu ${b} (Pokémon)`], best: { name: a, fr: 'pokemon', streak: 1 },
    });
    await aba(page, 'Placar');
    expect((await barras(page))[0]).toEqual({ rotulo: 'Pokémon', texto: '50% · 1/2', largura: '50%' });
  });

  test('Campeonato não grava nada no placar (jogado de 8 até o campeão)', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    const [a, b] = await escolher(page, '#duelRow', 1);
    const antes = await lerStats(page);
    expect(antes!.hist).toEqual([`${a} (Pokémon) venceu ${b} (Digimon)`]);

    await aba(page, 'Campeonato');
    await page.selectOption('#cupSize', '8');
    await page.locator('#cupStart').click();
    const rodadas = [
      ['Quartas de final', 'confronto 1 de 4'], ['Quartas de final', 'confronto 2 de 4'],
      ['Quartas de final', 'confronto 3 de 4'], ['Quartas de final', 'confronto 4 de 4'],
      ['Semifinal', 'confronto 1 de 2'], ['Semifinal', 'confronto 2 de 2'], ['Final', 'confronto 1 de 1'],
    ];
    for (const [rodada, confronto] of rodadas) {
      await expect(page.locator('#cupRound')).toHaveText(rodada!);
      await expect(page.locator('#cupCount')).toHaveText(confronto!);
      await expect(page.locator('#cupRow .card')).toHaveCount(2);
      await page.keyboard.press('1');
    }
    await expect(page.locator('#cupEnd')).toBeVisible();
    await expect(page.locator('#cupEnd')).toContainText('Campeão');

    expect(await lerStats(page)).toEqual(antes);
    await aba(page, 'Placar');
    expect(await barras(page)).toEqual([
      { rotulo: 'Pokémon', texto: '100% · 1/1', largura: '100%' },
      { rotulo: 'Digimon', texto: '0% · 0/1', largura: '0%' },
      ...zerado.slice(2),
    ]);
    await expect(page.locator('#histList li')).toHaveText([`${a} (Pokémon) venceu ${b} (Digimon)`]);
    await expect(page.locator('#bestStreak')).toHaveText(`${a} (Pokémon): 1 vitórias seguidas`);
  });

  test('barras: todas as franquias na ordem, largura pct% na cor da franquia, texto "pct% · w/n"', async ({ page }) => {
    await prepare(page, { storage: { 'pdx-stats': {
      w: { pokemon: 3, digimon: 1, smt: 2, ygo: 1, lol: 1, deadlock: 2, ff: 3 },
      n: { pokemon: 5, digimon: 8, smt: 3, jojo: 4, ygo: 1, lol: 4, overwatch: 2, deadlock: 2, ff: 4 },
      hist: [], best: null,
    } } });
    await abrir(page);
    await aba(page, 'Placar');
    expect(await barras(page)).toEqual([
      { rotulo: 'Pokémon', texto: '60% · 3/5', largura: '60%' },
      { rotulo: 'Digimon', texto: '13% · 1/8', largura: '13%' }, // 12,5% arredonda pra 13
      { rotulo: 'SMT/Persona', texto: '67% · 2/3', largura: '67%' },
      { rotulo: 'JoJo', texto: '0% · 0/4', largura: '0%' },
      { rotulo: 'Yu-Gi-Oh!', texto: '100% · 1/1', largura: '100%' },
      { rotulo: 'Bakugan', texto: '0% · 0/0', largura: '0%' },
      { rotulo: 'LoL', texto: '25% · 1/4', largura: '25%' },
      { rotulo: 'Overwatch', texto: '0% · 0/2', largura: '0%' },
      { rotulo: 'Deadlock', texto: '100% · 2/2', largura: '100%' },
      { rotulo: 'Final Fantasy', texto: '75% · 3/4', largura: '75%' },
      { rotulo: 'Sujimon', texto: '0% · 0/0', largura: '0%' },
    ]);

    // a barra ocupa de fato essa fração do trilho
    const fracoes = await page.locator('#statsList .meter').evaluateAll(ms => ms.map(m =>
      m.querySelector('.fill')!.getBoundingClientRect().width / m.querySelector('.track')!.getBoundingClientRect().width));
    [0.6, 0.13, 0.67, 0, 1, 0, 0.25, 0, 1, 0.75, 0].forEach((p, i) => expect(fracoes[i]).toBeCloseTo(p, 2));

    // cor: a mesma de var(--franquia)
    const cores = await page.locator('#statsList .meter .fill').evaluateAll((fills, ks) => fills.map((f, i) => {
      const ref = document.createElement('div');
      ref.style.backgroundColor = `var(--${ks[i]})`;
      document.body.appendChild(ref);
      const esperada = getComputedStyle(ref).backgroundColor;
      ref.remove();
      return { tem: getComputedStyle(f).backgroundColor, esperada };
    }), ORDEM);
    expect(cores).toHaveLength(ORDEM.length);
    for (const c of cores) {
      expect(c.esperada).not.toBe('rgba(0, 0, 0, 0)');
      expect(c.tem).toBe(c.esperada);
    }
    expect(new Set(cores.map(c => c.tem)).size).toBe(ORDEM.length);
  });

  test('maior sequência: "<b>nome</b> (Franquia): N vitórias seguidas"; empate não substitui', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    const [a] = await escolher(page, '#duelRow', 1);
    await escolher(page, '#duelRow', 1);
    await escolher(page, '#duelRow', 1);
    expect((await lerStats(page))!.best).toEqual({ name: a, fr: 'pokemon', streak: 3 });
    await aba(page, 'Placar');
    await expect(page.locator('#bestStreak')).toHaveText(`${a} (Pokémon): 3 vitórias seguidas`);
    await expect(page.locator('#bestStreak b')).toHaveText(a);

    // voltar pro Duelo não zera a sequência; o lado Digimon vence 3 seguidas e empata
    await aba(page, 'Duelo');
    await expect(page.locator('#duelRow .card .name').nth(0)).toHaveText(a);
    const [, d] = await escolher(page, '#duelRow', 2);
    await escolher(page, '#duelRow', 2);
    await escolher(page, '#duelRow', 2);
    expect((await lerStats(page))!.best).toEqual({ name: a, fr: 'pokemon', streak: 3 });
    // a 4ª passa à frente
    await escolher(page, '#duelRow', 2);
    expect((await lerStats(page))!.best).toEqual({ name: d, fr: 'digimon', streak: 4 });
    await aba(page, 'Placar');
    await expect(page.locator('#bestStreak')).toHaveText(`${d} (Digimon): 4 vitórias seguidas`);
    await expect(page.locator('#bestStreak b')).toHaveText(d);
  });

  test('histórico: mais recente primeiro, no máximo 30 (32 escolhas com a tecla 1)', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    const esperado: string[] = [];
    let rei = '';
    for (let i = 0; i < 32; i++) {
      const [a, b] = await escolher(page, '#duelRow', 1);
      rei = a!;
      esperado.unshift(`${a} (Pokémon) venceu ${b} (Digimon)`);
    }
    const s = await lerStats(page);
    expect(s!.hist).toEqual(esperado.slice(0, 30));
    expect(s!.w).toEqual({ pokemon: 32 });
    expect(s!.n).toEqual({ pokemon: 32, digimon: 32 });
    expect(s!.best).toEqual({ name: rei, fr: 'pokemon', streak: 32 });

    await aba(page, 'Placar');
    await expect(page.locator('#histList li')).toHaveText(esperado.slice(0, 30));
    expect((await barras(page))[0]).toEqual({ rotulo: 'Pokémon', texto: '100% · 32/32', largura: '100%' });
    await expect(page.locator('#bestStreak')).toHaveText(`${rei} (Pokémon): 32 vitórias seguidas`);
  });

  test('"Zerar placar" zera tudo e grava {w:{},n:{},hist:[],best:null}', async ({ page }) => {
    await prepare(page, { storage: { 'pdx-stats': {
      w: { pokemon: 3, smt: 1 }, n: { pokemon: 5, digimon: 4, smt: 2 },
      hist: ['Pikachu (Pokémon) venceu Agumon (Digimon)', 'Jack Frost (SMT/Persona) venceu Pikachu (Pokémon)'],
      best: { name: 'Pikachu', fr: 'pokemon', streak: 3 },
    } } });
    await abrir(page);
    await aba(page, 'Placar');
    expect((await barras(page))[0]).toEqual({ rotulo: 'Pokémon', texto: '60% · 3/5', largura: '60%' });
    await expect(page.locator('#histList li')).toHaveCount(2);

    await page.locator('#statsReset').click();
    expect(await lerStats(page)).toEqual(VAZIO);
    expect(await barras(page)).toEqual(zerado);
    await expect(page.locator('#bestStreak')).toHaveText('Nenhuma sequência ainda.');
    await expect(page.locator('#histList li')).toHaveText(['Nada ainda.']);

    // continua zerado depois de recarregar
    await recarregar(page);
    await aba(page, 'Placar');
    expect(await barras(page)).toEqual(zerado);
    await expect(page.locator('#histList li')).toHaveText(['Nada ainda.']);
    expect(await lerStats(page)).toEqual(VAZIO);
  });

  test('"Zerar placar" não zera a sequência do duelo em andamento (comportamento atual)', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    const [a] = await escolher(page, '#duelRow', 1);
    await escolher(page, '#duelRow', 1);
    await escolher(page, '#duelRow', 1);
    await aba(page, 'Placar');
    await page.locator('#statsReset').click();
    expect(await lerStats(page)).toEqual(VAZIO);

    await aba(page, 'Duelo');
    await expect(page.locator('#duelRow .card .name').nth(0)).toHaveText(a);
    await escolher(page, '#duelRow', 1);
    const s = await lerStats(page);
    expect(s!.w).toEqual({ pokemon: 1 });
    expect(s!.n).toEqual({ pokemon: 1, digimon: 1 });
    expect(s!.hist).toHaveLength(1);
    // a sequência continua de onde estava (3 antes de zerar + 1)
    expect(s!.best).toEqual({ name: a, fr: 'pokemon', streak: 4 });
  });

  test('textos do placar aparecem como texto (sem virar HTML)', async ({ page }) => {
    const h = '<b>Negrito</b> & "aspas" (Pokémon) venceu <i>X</i> (Digimon)';
    await prepare(page, { storage: { 'pdx-stats': {
      w: {}, n: {}, hist: [h], best: { name: '<i>Itálico</i>', fr: 'digimon', streak: 2 },
    } } });
    await abrir(page);
    await aba(page, 'Placar');
    await expect(page.locator('#histList li')).toHaveText([h]);
    await expect(page.locator('#histList li b, #histList li i')).toHaveCount(0);
    await expect(page.locator('#bestStreak')).toHaveText('<i>Itálico</i> (Digimon): 2 vitórias seguidas');
    await expect(page.locator('#bestStreak b')).toHaveText('<i>Itálico</i>');
    await expect(page.locator('#bestStreak i')).toHaveCount(0);
  });

  test('sem Sujimon carregado, o placar ainda lista a linha do Sujimon (comportamento atual)', async ({ page }) => {
    await prepare(page, { sujimon: 'ausente' });
    await abrir(page);
    await expect(page.locator('option[value=sujimon]')).toHaveCount(0);
    await aba(page, 'Placar');
    expect(await barras(page)).toEqual(zerado);
  });
});
