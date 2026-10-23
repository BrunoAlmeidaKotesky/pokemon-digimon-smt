import { test, expect, type Page } from '@playwright/test';
import { prepare, abrir, aba, nomes, franquias, lerStorage, LABEL, type Stats } from './helpers';

// Trio: mesma regra do duelo com três lados. Quem vence fica (com coroa);
// os outros dois lados recebem desafiantes novos das suas franquias.

const ROW = '#trioRow';
const PADRAO = ['pokemon', 'digimon', 'smt'] as const;
const carta = (page: Page, i: number) => page.locator(`${ROW} .card`).nth(i);
const coroa = (page: Page, i: number) => carta(page, i).locator('.crown');
const vitorias = (n: number) => `♛ ${n} ${n === 1 ? 'vitória' : 'vitórias'}`;

interface Carta { fr: string; nome: string; coroa: string | null; tecla: string }
/** Estado das cartas na tela, na ordem dos seletores. */
const ler = (page: Page): Promise<Carta[]> => page.locator(`${ROW} .card`).evaluateAll(els => els.map(e => ({
  fr: (e as HTMLElement).dataset.fr ?? '',
  nome: (e.querySelector('.name')?.textContent ?? '').trim(),
  coroa: e.querySelector('.crown')?.textContent?.trim() ?? null,
  tecla: (e.querySelector('.key')?.textContent ?? '').trim(),
})));
const caixas = (page: Page, sel: string) => page.locator(sel).evaluateAll(els => els.map(e => {
  const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
}));

/** Abre o site com tudo carregado, vai pra aba Trio e devolve os três nomes iniciais. */
async function inicio(page: Page) {
  await prepare(page);
  await abrir(page);
  await aba(page, 'Trio');
  await expect(page.locator(`${ROW} .card`)).toHaveCount(3);
  return nomes(page, ROW);
}

/** Confere a rodada depois de `vencedor` ganhar: ele fica igual (com coroa), os outros mudam de nome e ficam sem coroa. */
function conferir(antes: Carta[], depois: Carta[], vencedor: number, n: number) {
  expect(depois.map(c => c.fr)).toEqual(antes.map(c => c.fr));
  expect(depois.map(c => c.tecla)).toEqual(['1', '2', '3']);
  depois.forEach((c, i) => {
    if (i === vencedor) expect(c).toEqual({ ...antes[i]!, coroa: vitorias(n) });
    else { expect(c.coroa).toBeNull(); expect(c.nome).not.toBe(antes[i]!.nome); }
  });
}

test.describe('trio', () => {
  test('três cartas Pokémon, Digimon e SMT com teclas 1, 2 e 3, imagem, nome e franquia', async ({ page }) => {
    const iniciais = await inicio(page);
    for (const [i, fr] of PADRAO.entries()) await expect(page.locator(`#trio${i}`)).toHaveValue(fr);
    expect(await franquias(page, ROW)).toEqual([...PADRAO]);
    for (const [i, fr] of PADRAO.entries()) {
      const c = carta(page, i);
      expect(iniciais[i]).not.toBe('');
      await expect(c.locator('.key')).toHaveText(String(i + 1));
      await expect(c.locator('.fr')).toHaveText(LABEL[fr]);
      await expect(c.locator('.img img')).toHaveAttribute('alt', iniciais[i]!);
      await expect(c.locator('.crown')).toHaveCount(0);
    }
    await expect(page.locator(`${ROW} .vs`)).toHaveCount(2);
    await expect(page.locator(`${ROW} .vs`)).toHaveText(['VS', 'VS']);
  });

  test('quem vence fica com coroa; os outros dois recebem desafiantes novos das suas franquias', async ({ page }) => {
    await inicio(page);
    let antes = await ler(page);

    await carta(page, 1).click();
    await expect(coroa(page, 1)).toHaveText(vitorias(1));
    let depois = await ler(page);
    conferir(antes, depois, 1, 1);

    antes = depois;
    await carta(page, 1).click();
    await expect(coroa(page, 1)).toHaveText(vitorias(2));
    depois = await ler(page);
    conferir(antes, depois, 1, 2);

    // outro lado vence: a coroa passa pra ele e o antigo campeão é trocado
    antes = depois;
    await carta(page, 2).click();
    await expect(coroa(page, 2)).toHaveText(vitorias(1));
    depois = await ler(page);
    expect(depois[2]).toEqual({ ...antes[2]!, coroa: vitorias(1) });
    expect(depois[1]!.coroa).toBeNull();
    expect(depois[1]!.nome).not.toBe(antes[1]!.nome);
    expect(depois[0]!.coroa).toBeNull();
    expect(depois[0]!.nome).not.toBe(antes[0]!.nome);
    expect(depois.map(c => c.fr)).toEqual([...PADRAO]);

    // o placar conta as rodadas do trio, mas a sequência do trio não vira recorde (stats.best é só do duelo)
    const s = (await lerStorage<Stats>(page, 'pdx-stats'))!;
    expect(s.w).toEqual({ digimon: 2, smt: 1 });
    expect(s.n).toEqual({ pokemon: 3, digimon: 3, smt: 3 });
    expect(s.best ?? null).toBeNull();
  });

  test('trocar um seletor troca só aquele lado; os outros mantêm nome e coroa', async ({ page }) => {
    await inicio(page);
    await carta(page, 0).click();
    await expect(coroa(page, 0)).toHaveText(vitorias(1));
    const antes = await ler(page);

    // lado 3 vira JoJo
    await page.selectOption('#trio2', 'jojo');
    await expect(carta(page, 2)).toHaveAttribute('data-fr', 'jojo');
    await expect(carta(page, 2).locator('.fr')).toHaveText(LABEL.jojo);
    let depois = await ler(page);
    expect(depois[0]).toEqual(antes[0]);
    expect(depois[1]).toEqual(antes[1]);
    expect(depois[2]).toMatchObject({ fr: 'jojo', coroa: null, tecla: '3' });

    // lado 1 (o da coroa) vira Bakugan: perde a coroa, os outros ficam iguais
    const meio = depois;
    await page.selectOption('#trio0', 'bakugan');
    await expect(carta(page, 0)).toHaveAttribute('data-fr', 'bakugan');
    depois = await ler(page);
    expect(depois[0]).toMatchObject({ fr: 'bakugan', coroa: null, tecla: '1' });
    expect(depois[1]).toEqual(meio[1]);
    expect(depois[2]).toEqual(meio[2]);

    // os desafiantes seguintes vêm das franquias novas
    await carta(page, 1).click();
    await expect(coroa(page, 1)).toHaveText(vitorias(1));
    conferir(depois, await ler(page), 1, 1);
    expect(await franquias(page, ROW)).toEqual(['bakugan', 'digimon', 'jojo']);
  });

  test('"Trocar os três" recomeça: nomes novos nos três lados e sem coroa', async ({ page }) => {
    await inicio(page);
    await carta(page, 2).click();
    await carta(page, 2).click();
    await expect(coroa(page, 2)).toHaveText(vitorias(2));
    const antes = await ler(page);

    await page.locator('#trioSkip').click();
    await expect(page.locator(`${ROW} .crown`)).toHaveCount(0);
    const depois = await ler(page);
    expect(depois.map(c => c.fr)).toEqual([...PADRAO]);
    depois.forEach((c, i) => expect(c.nome).not.toBe(antes[i]!.nome));

    // a contagem recomeça do zero
    await carta(page, 2).click();
    await expect(coroa(page, 2)).toHaveText(vitorias(1));
    await expect(carta(page, 2).locator('.name')).toHaveText(depois[2]!.nome);
  });

  test('teclas 1, 2 e 3 escolhem; são ignoradas com foco num <select>', async ({ page }) => {
    await inicio(page);
    for (const [tecla, i] of [['3', 2], ['1', 0], ['2', 1]] as const) {
      const antes = await ler(page);
      await page.keyboard.press(tecla);
      await expect(coroa(page, i)).toHaveText(vitorias(1));
      conferir(antes, await ler(page), i, 1);
    }
    const antes = await ler(page);

    // com foco no seletor, 1, 2 e 3 não escolhem (nem mudam a franquia)
    await page.locator('#trio0').focus();
    for (const t of ['1', '2', '3']) await page.keyboard.press(t);
    for (const [i, fr] of PADRAO.entries()) await expect(page.locator(`#trio${i}`)).toHaveValue(fr);
    await page.locator('#trio0').evaluate(e => (e as HTMLSelectElement).blur());
    // tecla sem carta correspondente também não faz nada
    await page.keyboard.press('4');
    expect(await ler(page)).toEqual(antes);

    // se alguma das teclas acima tivesse contado, aqui não seriam 2 vitórias do mesmo nome
    await page.keyboard.press('2');
    await expect(coroa(page, 1)).toHaveText(vitorias(2));
    conferir(antes, await ler(page), 1, 2);
  });

  test('no celular as cartas ficam empilhadas e o VS some', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 560, 'layout de tela estreita (< 560px)');
    await inicio(page);
    await expect(page.locator(ROW)).toHaveCSS('flex-direction', 'column');
    const vs = page.locator(`${ROW} .vs`);
    await expect(vs).toHaveCount(2);
    for (let i = 0; i < 2; i++) await expect(vs.nth(i)).toBeHidden();
    // uma embaixo da outra, alinhadas no centro
    const c = await caixas(page, `${ROW} .card`);
    expect(c).toHaveLength(3);
    for (let i = 0; i < 2; i++) {
      expect(c[i + 1]!.y).toBeGreaterThanOrEqual(c[i]!.y + c[i]!.h - 4);
      expect(Math.abs((c[i + 1]!.x + c[i + 1]!.w / 2) - (c[i]!.x + c[i]!.w / 2))).toBeLessThan(2);
    }
    // o duelo continua lado a lado no celular
    await aba(page, 'Duelo');
    const d = await caixas(page, '#duelRow .card');
    expect(Math.abs(d[0]!.y - d[1]!.y)).toBeLessThan(4);
    expect(d[1]!.x).toBeGreaterThan(d[0]!.x + d[0]!.w);
  });

  test('no computador as cartas ficam lado a lado com VS entre elas', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 560, 'layout de tela larga (>= 560px)');
    await inicio(page);
    await expect(page.locator(ROW)).toHaveCSS('flex-direction', 'row');
    const vs = page.locator(`${ROW} .vs`);
    await expect(vs).toHaveCount(2);
    for (let i = 0; i < 2; i++) await expect(vs.nth(i)).toBeVisible();
    const c = await caixas(page, `${ROW} .card`);
    const v = await caixas(page, `${ROW} .vs`);
    for (let i = 0; i < 2; i++) {
      expect(Math.abs(c[i + 1]!.y - c[i]!.y)).toBeLessThan(4);
      expect(v[i]!.x).toBeGreaterThanOrEqual(c[i]!.x + c[i]!.w - 1);
      expect(c[i + 1]!.x).toBeGreaterThanOrEqual(v[i]!.x + v[i]!.w - 1);
    }
  });
});
