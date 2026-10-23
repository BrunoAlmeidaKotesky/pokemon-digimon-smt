import { test, expect, type Page } from '@playwright/test';
import { prepare, abrir, nomes, franquias, lerStorage, LABEL, type Stats } from './helpers';

// Duelo "rei do morro": quem é escolhido fica no seu lado (com coroa e sequência);
// o lado perdedor recebe um desafiante novo da franquia escolhida naquele lado.

const ROW = '#duelRow';
const carta = (page: Page, i: number) => page.locator(`${ROW} .card`).nth(i);
const coroa = (page: Page, i: number) => carta(page, i).locator('.crown');
const vitorias = (n: number) => `♛ ${n} ${n === 1 ? 'vitória' : 'vitórias'}`;

interface Carta { fr: string; nome: string; coroa: string | null; tecla: string }
/** Estado das cartas na tela, da esquerda pra direita. */
const ler = (page: Page): Promise<Carta[]> => page.locator(`${ROW} .card`).evaluateAll(els => els.map(e => ({
  fr: (e as HTMLElement).dataset.fr ?? '',
  nome: (e.querySelector('.name')?.textContent ?? '').trim(),
  coroa: e.querySelector('.crown')?.textContent?.trim() ?? null,
  tecla: (e.querySelector('.key')?.textContent ?? '').trim(),
})));

/** Abre o site com tudo carregado e devolve os dois nomes iniciais. */
async function inicio(page: Page, opts: Parameters<typeof prepare>[1] = {}) {
  await prepare(page, opts);
  await abrir(page);
  await expect(page.locator(`${ROW} .card`)).toHaveCount(2);
  return nomes(page, ROW);
}

test.describe('duelo (rei do morro)', () => {
  test('duas cartas Pokémon x Digimon com VS no meio; cada carta tem tecla, imagem, nome e franquia', async ({ page }) => {
    const iniciais = await inicio(page);
    await expect(page.locator('#duelA')).toHaveValue('pokemon');
    await expect(page.locator('#duelB')).toHaveValue('digimon');
    expect(await franquias(page, ROW)).toEqual(['pokemon', 'digimon']);

    for (const [i, fr] of (['pokemon', 'digimon'] as const).entries()) {
      const c = carta(page, i);
      expect(iniciais[i]).not.toBe('');
      await expect(c.locator('.key')).toHaveText(String(i + 1));
      await expect(c.locator('.name')).toHaveText(iniciais[i]!);
      await expect(c.locator('.fr')).toHaveText(LABEL[fr]);
      await expect(c.locator('.img img')).toHaveAttribute('alt', iniciais[i]!);
      await expect(c.locator('.img img')).toBeVisible();
      await expect(c.locator('.crown')).toHaveCount(0);
    }

    const vs = page.locator(`${ROW} .vs`);
    await expect(vs).toHaveCount(1);
    await expect(vs).toHaveText('VS');
    await expect(vs).toBeVisible();
    // VS entre as cartas, e as cartas lado a lado (também no celular)
    const a = (await carta(page, 0).boundingBox())!, v = (await vs.boundingBox())!, b = (await carta(page, 1).boundingBox())!;
    expect(v.x).toBeGreaterThanOrEqual(a.x + a.width - 1);
    expect(b.x).toBeGreaterThanOrEqual(v.x + v.width - 1);
    expect(Math.abs(a.y - b.y)).toBeLessThan(4);
  });

  test('quem é escolhido fica no lado com o mesmo nome e ganha coroa; o outro lado recebe desafiante novo da mesma franquia', async ({ page }) => {
    const [a, b] = await inicio(page);
    const direita = [b!];

    for (let n = 1; n <= 3; n++) {
      await carta(page, 0).click();
      await expect(coroa(page, 0)).toHaveText(vitorias(n));
      const [esq, dir] = await ler(page);
      expect(esq).toEqual({ fr: 'pokemon', nome: a, coroa: vitorias(n), tecla: '1' });
      // desafiante novo: mesma franquia, sem coroa, nome que ainda não apareceu desse lado
      expect(dir).toMatchObject({ fr: 'digimon', coroa: null, tecla: '2' });
      expect(direita).not.toContain(dir!.nome);
      await expect(carta(page, 1).locator('.fr')).toHaveText('Digimon');
      direita.push(dir!.nome);
    }
  });

  test('escolher o outro lado dá a coroa pra ele e zera a sequência do primeiro', async ({ page }) => {
    const [a] = await inicio(page);
    await carta(page, 0).click();
    await carta(page, 0).click();
    await expect(coroa(page, 0)).toHaveText(vitorias(2));
    const desafiante = (await ler(page))[1]!.nome;

    await carta(page, 1).click();
    await expect(coroa(page, 1)).toHaveText(vitorias(1));
    const [esq, dir] = await ler(page);
    expect(dir).toEqual({ fr: 'digimon', nome: desafiante, coroa: vitorias(1), tecla: '2' });
    expect(esq).toMatchObject({ fr: 'pokemon', coroa: null });
    expect(esq!.nome).not.toBe(a);

    await carta(page, 1).click();
    await expect(coroa(page, 1)).toHaveText(vitorias(2));
    await expect(carta(page, 1).locator('.name')).toHaveText(desafiante);
    await expect(coroa(page, 0)).toHaveCount(0);
  });

  test('trocar o seletor de um lado troca só aquele lado; o outro mantém nome e coroa', async ({ page }) => {
    const [a] = await inicio(page);
    await carta(page, 0).click();
    await expect(coroa(page, 0)).toHaveText(vitorias(1));

    // lado direito vira SMT: só ele muda
    await page.selectOption('#duelB', 'smt');
    await expect(carta(page, 1)).toHaveAttribute('data-fr', 'smt');
    await expect(carta(page, 1).locator('.fr')).toHaveText(LABEL.smt);
    let [esq, dir] = await ler(page);
    expect(esq).toEqual({ fr: 'pokemon', nome: a, coroa: vitorias(1), tecla: '1' });
    expect(dir!.coroa).toBeNull();
    const smt1 = dir!.nome;

    // os próximos desafiantes da direita já vêm da franquia nova
    await carta(page, 0).click();
    await expect(coroa(page, 0)).toHaveText(vitorias(2));
    [esq, dir] = await ler(page);
    expect(dir).toMatchObject({ fr: 'smt', coroa: null });
    expect(dir!.nome).not.toBe(smt1);
    const smt2 = dir!.nome;

    // lado esquerdo (o da coroa) vira JoJo: perde a coroa, a direita fica igual
    await page.selectOption('#duelA', 'jojo');
    await expect(carta(page, 0)).toHaveAttribute('data-fr', 'jojo');
    await expect(carta(page, 0).locator('.fr')).toHaveText(LABEL.jojo);
    [esq, dir] = await ler(page);
    expect(esq!.coroa).toBeNull();
    expect(esq!.nome).not.toBe(a);
    expect(dir).toEqual({ fr: 'smt', nome: smt2, coroa: null, tecla: '2' });
  });

  test('"Trocar os dois" recomeça: nomes novos nos dois lados e sem coroa', async ({ page }) => {
    await inicio(page);
    await carta(page, 0).click();
    await carta(page, 0).click();
    await expect(coroa(page, 0)).toHaveText(vitorias(2));
    const antes = await ler(page);

    await page.locator('#duelSkip').click();
    await expect(page.locator(`${ROW} .crown`)).toHaveCount(0);
    const depois = await ler(page);
    expect(depois.map(c => c.fr)).toEqual(['pokemon', 'digimon']);
    expect(depois[0]!.nome).not.toBe(antes[0]!.nome);
    expect(depois[1]!.nome).not.toBe(antes[1]!.nome);

    // a contagem recomeça do zero
    await carta(page, 1).click();
    await expect(coroa(page, 1)).toHaveText(vitorias(1));
    await expect(carta(page, 1).locator('.name')).toHaveText(depois[1]!.nome);
  });

  test('o desafiante novo não repete quem está na tela', async ({ page }) => {
    // Saco de Digimon com nomes repetidos: o sorteio "puro" mandaria de volta quem está na tela.
    // draw() tira do fim: Agumon, Agumon, Gabumon, Devimon, Gabumon, Elecmon.
    // Digimon carrega por último: nenhum desafiante de Digimon é pré-sorteado (e descartado) antes de o duelo começar.
    await inicio(page, { atraso: { digimon: 500 }, storage: { 'pdx-bags': { digimon: ['Elecmon', 'Gabumon', 'Devimon', 'Gabumon', 'Agumon', 'Agumon'] } } });
    await expect(carta(page, 1).locator('.name')).toHaveText('Agumon');

    // Agumon perde: o próximo do saco seria Agumon de novo, mas ele estava na tela -> Gabumon
    await carta(page, 0).click();
    await expect(coroa(page, 0)).toHaveText(vitorias(1));
    await expect(carta(page, 1).locator('.name')).toHaveText('Gabumon');

    // Esquerda vira Digimon: o próximo do saco seria Gabumon, que está do outro lado -> Elecmon
    await page.selectOption('#duelA', 'digimon');
    await expect(carta(page, 0)).toHaveAttribute('data-fr', 'digimon');
    await expect(carta(page, 0).locator('.name')).toHaveText('Elecmon');
    await expect(carta(page, 1).locator('.name')).toHaveText('Gabumon');
  });

  test('teclas 1 e 2 escolhem; são ignoradas com foco num <select>', async ({ page }) => {
    const [a] = await inicio(page);

    await page.keyboard.press('1');
    await expect(coroa(page, 0)).toHaveText(vitorias(1));
    await expect(carta(page, 0).locator('.name')).toHaveText(a!);
    await expect(coroa(page, 1)).toHaveCount(0);
    const b = (await ler(page))[1]!.nome;

    await page.keyboard.press('2');
    await expect(coroa(page, 1)).toHaveText(vitorias(1));
    await expect(carta(page, 1).locator('.name')).toHaveText(b);
    await expect(coroa(page, 0)).toHaveCount(0);
    const antes = await ler(page);

    // com foco no seletor, 1 e 2 não escolhem (nem mudam a franquia)
    await page.locator('#duelB').focus();
    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await expect(page.locator('#duelA')).toHaveValue('pokemon');
    await expect(page.locator('#duelB')).toHaveValue('digimon');
    await page.locator('#duelB').evaluate(e => (e as HTMLSelectElement).blur());
    // tecla sem carta correspondente também não faz nada
    await page.keyboard.press('3');
    await page.keyboard.press('0');
    expect(await ler(page)).toEqual(antes);

    // se alguma das teclas acima tivesse contado, aqui não seriam 2 vitórias do mesmo nome
    await page.keyboard.press('2');
    await expect(coroa(page, 1)).toHaveText(vitorias(2));
    await expect(carta(page, 1).locator('.name')).toHaveText(b);
    await expect(coroa(page, 0)).toHaveCount(0);
  });

  test('stats.best (pdx-stats) guarda a maior sequência; empate não substitui', async ({ page }) => {
    const [a] = await inicio(page);
    const best = async () => (await lerStorage<Stats>(page, 'pdx-stats'))?.best ?? null;

    await carta(page, 0).click();
    await expect(coroa(page, 0)).toHaveText(vitorias(1));
    expect(await best()).toEqual({ name: a, fr: 'pokemon', streak: 1 });
    await carta(page, 0).click();
    await expect(coroa(page, 0)).toHaveText(vitorias(2));
    expect(await best()).toEqual({ name: a, fr: 'pokemon', streak: 2 });

    // a direita vence 1 e 2 vezes: não passa do recorde, que fica com o primeiro
    const c = (await ler(page))[1]!.nome;
    await carta(page, 1).click();
    await expect(coroa(page, 1)).toHaveText(vitorias(1));
    expect(await best()).toEqual({ name: a, fr: 'pokemon', streak: 2 });
    await carta(page, 1).click();
    await expect(coroa(page, 1)).toHaveText(vitorias(2));
    expect(await best()).toEqual({ name: a, fr: 'pokemon', streak: 2 });
    // 3 vitórias: novo recorde
    await carta(page, 1).click();
    await expect(coroa(page, 1)).toHaveText(vitorias(3));
    expect(await best()).toEqual({ name: c, fr: 'digimon', streak: 3 });

    // vitórias e participações por franquia
    const s = (await lerStorage<Stats>(page, 'pdx-stats'))!;
    expect(s.w).toEqual({ pokemon: 2, digimon: 3 });
    expect(s.n).toEqual({ pokemon: 5, digimon: 5 });

    // "Trocar os dois" não apaga o recorde
    await page.locator('#duelSkip').click();
    await expect(page.locator(`${ROW} .crown`)).toHaveCount(0);
    expect(await best()).toEqual({ name: c, fr: 'digimon', streak: 3 });
  });
});
