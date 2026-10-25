import { test, expect, type Page } from '@playwright/test';
import { prepare, abrir, aba, nomes, lerStorage, statusEsperado, fixture, LABEL, type Stats } from './helpers';

const lerStats = (page: Page) => lerStorage<Stats>(page, 'pdx-stats');
const lerBags = (page: Page) => lerStorage<Record<string, unknown>>(page, 'pdx-bags');

const nice = (s: string) => s.split('-').map(w => w[0]!.toUpperCase() + w.slice(1)).join(' ');
const POKEMON = fixture<{ results: { name: string }[] }>('pokemon-species.json').results.map(x => nice(x.name));

/** Soma de todas as participações gravadas (0 se não houver placar ou se ele estiver ilegível). */
const somaN = (page: Page) => page.evaluate(() => {
  try {
    const s = JSON.parse(localStorage.getItem('pdx-stats') || 'null');
    return Object.values((s && s.n) || {}).reduce<number>((a, b) => a + Number(b), 0);
  } catch { return 0; }
});

/** Escolhe a carta `i` do duelo pela tecla e espera a escolha ser gravada. Devolve os nomes de antes. */
async function escolher(page: Page, i: number) {
  const antes = await nomes(page, '#duelRow');
  const soma = await somaN(page);
  await page.keyboard.press(String(i));
  await expect.poll(() => somaN(page)).toBe(soma + antes.length);
  return antes;
}

const blur = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
const nomeNoLado = (page: Page, i: number) => page.locator('#duelRow .card .name').nth(i);

/** Abre a página de novo (navegação nova, sem restaurar o estado dos seletores). O localStorage fica. */
const reabrir = (page: Page) => abrir(page, './?de-novo');

/** O valor gravado no saco tem o formato {franquia: [nomes]}. */
function confereFormatoBags(bags: Record<string, unknown> | null) {
  expect(bags).not.toBeNull();
  expect(typeof bags).toBe('object');
  expect(Array.isArray(bags)).toBe(false);
  for (const v of Object.values(bags!)) {
    expect(Array.isArray(v)).toBe(true);
    for (const n of v as unknown[]) expect(typeof n).toBe('string');
  }
}

test.describe('armazenamento: pdx-stats', () => {
  const SALVO = {
    w: { pokemon: 3 }, n: { pokemon: 5, digimon: 5 },
    hist: ['Pikachu (Pokémon) venceu Agumon (Digimon)'],
    best: { name: 'Pikachu', fr: 'pokemon', streak: 7 },
  };

  test('placar já salvo aparece no Placar e uma escolha nova soma em cima (mesmo formato)', async ({ page }) => {
    await prepare(page, { storage: { 'pdx-stats': SALVO } });
    await abrir(page);
    await aba(page, 'Placar');
    await expect(page.locator('#statsList .meter .n')).toHaveText(['60% · 3/5', '0% · 0/5', ...Array(Object.keys(LABEL).length - 2).fill('0% · 0/0')]);
    await expect(page.locator('#bestStreak')).toHaveText('Pikachu (Pokémon): 7 vitórias seguidas');
    await expect(page.locator('#bestStreak b')).toHaveText('Pikachu');
    await expect(page.locator('#histList li')).toHaveText(['Pikachu (Pokémon) venceu Agumon (Digimon)']);

    await aba(page, 'Duelo');
    const [a, b] = await escolher(page, 1);
    const novo = `${a} (Pokémon) venceu ${b} (Digimon)`;
    expect(await lerStats(page)).toEqual({
      w: { pokemon: 4 }, n: { pokemon: 6, digimon: 6 },
      hist: [novo, 'Pikachu (Pokémon) venceu Agumon (Digimon)'],
      best: { name: 'Pikachu', fr: 'pokemon', streak: 7 }, // sequência de 1 não passa a de 7
    });

    // continua lá depois de abrir a página de novo
    await reabrir(page);
    await aba(page, 'Placar');
    await expect(page.locator('#statsList .meter .n').nth(0)).toHaveText('67% · 4/6');
    await expect(page.locator('#statsList .meter .n').nth(1)).toHaveText('0% · 0/6');
    await expect(page.locator('#histList li')).toHaveText([novo, 'Pikachu (Pokémon) venceu Agumon (Digimon)']);
    await expect(page.locator('#bestStreak')).toHaveText('Pikachu (Pokémon): 7 vitórias seguidas');
  });

  test('formato antigo sem "best" carrega e ganha "best" na primeira escolha do Duelo', async ({ page }) => {
    const velho = { w: { digimon: 2 }, n: { digimon: 2, pokemon: 2 }, hist: ['Agumon (Digimon) venceu Pikachu (Pokémon)'] };
    await prepare(page, { storage: { 'pdx-stats': velho } });
    await abrir(page);
    await aba(page, 'Placar');
    await expect(page.locator('#statsList .meter .n').nth(1)).toHaveText('100% · 2/2');
    await expect(page.locator('#bestStreak')).toHaveText('Nenhuma sequência ainda.');
    await expect(page.locator('#histList li')).toHaveText(velho.hist);

    await aba(page, 'Duelo');
    const [a, b] = await escolher(page, 1);
    expect(await lerStats(page)).toEqual({
      w: { digimon: 2, pokemon: 1 }, n: { digimon: 3, pokemon: 3 },
      hist: [`${a} (Pokémon) venceu ${b} (Digimon)`, ...velho.hist],
      best: { name: a, fr: 'pokemon', streak: 1 },
    });
  });

  test('pdx-stats ilegível é ignorado: placar começa do zero e a primeira escolha regrava', async ({ page }) => {
    await prepare(page, { storage: { 'pdx-stats': '{quebrado' } });
    await abrir(page);
    await aba(page, 'Placar');
    await expect(page.locator('#statsList .meter .n')).toHaveText(Object.keys(LABEL).map(() => '0% · 0/0'));
    await expect(page.locator('#histList li')).toHaveText(['Nada ainda.']);

    await aba(page, 'Duelo');
    const [a, b] = await escolher(page, 1);
    expect(await lerStats(page)).toEqual({
      w: { pokemon: 1 }, n: { pokemon: 1, digimon: 1 },
      hist: [`${a} (Pokémon) venceu ${b} (Digimon)`], best: { name: a, fr: 'pokemon', streak: 1 },
    });
  });
});

test.describe('armazenamento: pdx-bags', () => {
  test('próximo sorteado é o último da lista; nome que não existe é ignorado; regrava sem o sorteado', async ({ page }) => {
    // Pokémon carrega por último: assim nenhum Pokémon é pré-sorteado (e descartado) antes de o duelo começar.
    await prepare(page, { atraso: { pokemon: 500 }, storage: { 'pdx-bags': {
      pokemon: ['Ivysaur', 'Nome Inventado', 'Venusaur', 'Charmander', 'Outro Inventado'],
      jojo: ['Star Platinum'],
    } } });
    await abrir(page);
    await expect(nomeNoLado(page, 0)).toHaveText('Charmander');

    const bags = await lerBags(page);
    confereFormatoBags(bags);
    const resto = bags!.pokemon as string[];
    expect(resto).not.toContain('Charmander');
    expect(resto).not.toContain('Nome Inventado');
    expect(resto).not.toContain('Outro Inventado');
    // o que sobra é o começo da lista (sem os inventados), na mesma ordem
    expect(resto.length).toBeGreaterThanOrEqual(1);
    expect(resto).toEqual(['Ivysaur', 'Venusaur'].slice(0, resto.length));
    // franquia que ninguém sorteou fica como estava
    expect(bags!.jojo).toEqual(['Star Platinum']);
    expect(Array.isArray(bags!.digimon)).toBe(true);

    // o lado Pokémon perde duas vezes: vêm os próximos do fim da lista
    await escolher(page, 2);
    await expect(nomeNoLado(page, 0)).toHaveText('Venusaur');
    await escolher(page, 2);
    await expect(nomeNoLado(page, 0)).toHaveText('Ivysaur');

    // o saco acabou e recomeça com a lista inteira: tudo o que fica gravado existe e não se repete
    const depois = await lerBags(page);
    confereFormatoBags(depois);
    const nomesPokemon = depois!.pokemon as string[];
    for (const n of nomesPokemon) expect(POKEMON).toContain(n);
    expect(new Set(nomesPokemon).size).toBe(nomesPokemon.length);
    expect(depois!.jojo).toEqual(['Star Platinum']);
  });

  test('lado direito: trocar o seletor sorteia o último da lista daquela franquia', async ({ page }) => {
    await prepare(page, { storage: { 'pdx-bags': { bakugan: ['Gorem', 'Wavern', 'Drago', 'Nao Existe'] } } });
    await abrir(page);
    await page.selectOption('#duelB', 'bakugan');
    await expect(nomeNoLado(page, 1)).toHaveText('Drago');
    const bags = await lerBags(page);
    confereFormatoBags(bags);
    const resto = bags!.bakugan as string[];
    expect(resto).not.toContain('Drago');
    expect(resto).not.toContain('Nao Existe');
    expect(resto.length).toBeGreaterThanOrEqual(1);
    expect(resto).toEqual(['Gorem', 'Wavern'].slice(0, resto.length));

    await blur(page);
    await escolher(page, 1);
    await expect(nomeNoLado(page, 1)).toHaveText('Wavern');
    await escolher(page, 1);
    await expect(nomeNoLado(page, 1)).toHaveText('Gorem');
  });

  test('pdx-bags ilegível é ignorado e regravado no formato {franquia: [nomes]}', async ({ page }) => {
    await prepare(page, { storage: { 'pdx-bags': '[[quebrado' } });
    await abrir(page);
    await expect(page.locator('#duelRow .card')).toHaveCount(2);
    const bags = await lerBags(page);
    confereFormatoBags(bags);
    expect(Object.keys(bags!)).toEqual(expect.arrayContaining(['pokemon', 'digimon']));
    const mostrado = (await nomes(page, '#duelRow'))[0];
    expect(bags!.pokemon as string[]).not.toContain(mostrado);
  });
});

test.describe('armazenamento: pdx-ygo-v1', () => {
  test('cache válido: a API não é chamada; contagem e imagens vêm do cache', async ({ page }) => {
    const cache = { t: Date.now(), list: [['Monstro Um', 111], ['Monstro Dois', 222], ['Monstro Três', 333]] };
    const calls = await prepare(page, { storage: {
      'pdx-ygo-v1': cache,
      'pdx-bags': { ygo: ['Monstro Um', 'Monstro Três', 'Monstro Dois'] },
    } });
    await abrir(page);
    expect(calls.ygo ?? 0).toBe(0);
    await expect(page.locator('#status')).toHaveText(statusEsperado([], { ygo: 3 }));

    await page.selectOption('#duelA', 'ygo');
    const card = page.locator('#duelRow .card').nth(0);
    await expect(card.locator('.name')).toHaveText('Monstro Dois');
    await expect(card.locator('.fr')).toHaveText('Yu-Gi-Oh!');
    await expect(card.locator('img')).toHaveAttribute('src', 'https://images.ygoprodeck.com/images/cards_cropped/222.jpg');
    // o cache não é regravado
    expect(await lerStorage(page, 'pdx-ygo-v1')).toEqual(cache);
    expect(calls.ygo ?? 0).toBe(0);
  });

  const invalidos: [string, () => unknown][] = [
    ['vencido (8 dias)', () => ({ t: Date.now() - 8 * 864e5, list: [['Monstro Antigo', 999]] })],
    ['com a lista vazia', () => ({ t: Date.now(), list: [] })],
    ['ilegível', () => '{quebrado'],
  ];
  for (const [nome, valor] of invalidos) {
    test(`cache ${nome}: chama a API e regrava {t, list} com 45 monstros`, async ({ page }) => {
      const calls = await prepare(page, { storage: { 'pdx-ygo-v1': valor() } });
      const antes = Date.now();
      await abrir(page);
      expect(calls.ygo).toBe(1);
      await expect(page.locator('#status')).toHaveText(statusEsperado());

      const c = await lerStorage<{ t: number; list: [string, number][] }>(page, 'pdx-ygo-v1');
      expect(Object.keys(c!).sort()).toEqual(['list', 't']);
      expect(c!.t).toBeGreaterThanOrEqual(antes - 1000);
      expect(c!.t).toBeLessThanOrEqual(Date.now() + 1000);
      expect(c!.list).toHaveLength(45);
      for (const it of c!.list) {
        expect(it).toHaveLength(2);
        expect(typeof it[0]).toBe('string');
        expect(typeof it[1]).toBe('number');
      }
      expect(c!.list.map(x => x[0])).not.toContain('Monstro Antigo');

      // a carta usa o id gravado no endereço da imagem
      await page.selectOption('#duelA', 'ygo');
      const card = page.locator('#duelRow .card').nth(0);
      const nome = (await card.locator('.name').textContent())!.trim();
      const id = c!.list.find(x => x[0] === nome)?.[1];
      expect(id).toBeDefined();
      await expect(card.locator('img')).toHaveAttribute('src', `https://images.ygoprodeck.com/images/cards_cropped/${id}.jpg`);
    });
  }
});

test.describe('armazenamento: sorteio sem repetição', () => {
  const SEIS: [string, string][] = [
    ['Sujimon Alfa', '101'], ['Sujimon Beta', '102'], ['Sujimon Gama', '103'],
    ['Sujimon Delta', '104'], ['Sujimon Épsilon', '105'], ['Sujimon Zeta', '106'],
  ];
  const NOMES = SEIS.map(x => x[0]);

  async function ladoBSujimon(page: Page) {
    await page.selectOption('#duelB', 'sujimon');
    await expect(page.locator('#duelRow .card').nth(1)).toHaveAttribute('data-fr', 'sujimon');
    await blur(page);
  }
  const desafiante = async (page: Page) => (await nomes(page, '#duelRow'))[1]!;

  test('os N desafiantes seguidos são todos diferentes; depois o saco recomeça', async ({ page }) => {
    await prepare(page, { sujimon: SEIS });
    await abrir(page);
    await expect(page.locator('#status')).toContainText('Sujimon: 6');
    await ladoBSujimon(page);
    const vistos = [await desafiante(page)];
    for (let i = 1; i < NOMES.length; i++) {
      await escolher(page, 1);
      vistos.push(await desafiante(page));
    }
    expect(new Set(vistos).size).toBe(NOMES.length);
    expect([...vistos].sort()).toEqual([...NOMES].sort());

    // 7º: o saco recomeça (pode repetir), mas vem um Sujimon da lista
    await escolher(page, 1);
    await expect(page.locator('#duelRow .card').nth(1)).toHaveAttribute('data-fr', 'sujimon');
    expect(NOMES).toContain(await desafiante(page));
    const bags = await lerBags(page);
    confereFormatoBags(bags);
    for (const n of bags!.sujimon as string[]) expect(NOMES).toContain(n);
  });

  test('o saco fica salvo: abrir de novo não repete quem já apareceu', async ({ page }) => {
    await prepare(page, { sujimon: SEIS });
    await abrir(page);
    await ladoBSujimon(page);
    const antes = [await desafiante(page)];
    for (let i = 0; i < 2; i++) { await escolher(page, 1); antes.push(await desafiante(page)); }
    expect(new Set(antes).size).toBe(3);
    const salvo = (await lerBags(page))!.sujimon as string[];
    for (const n of antes) expect(salvo).not.toContain(n);

    await reabrir(page);
    await expect(page.locator('#duelB')).toHaveValue('digimon');
    await ladoBSujimon(page);
    const depois = [await desafiante(page)];
    await escolher(page, 1);
    depois.push(await desafiante(page));
    expect(new Set(depois).size).toBe(2);
    for (const n of depois) expect(antes).not.toContain(n);
  });
});
