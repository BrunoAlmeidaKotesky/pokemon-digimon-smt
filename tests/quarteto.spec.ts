import { test, expect, type Page } from '@playwright/test';
import { prepare, abrir, aba, nomes, franquias, lerStorage, LABEL, type Franquia, type Stats } from './helpers';

// Quarteto: a regra do Trio com quatro lados. Quem vence fica (com coroa);
// os outros três lados recebem desafiantes novos das suas franquias.

const ROW = '#quartetRow';
const PADRAO = ['pokemon', 'digimon', 'smt', 'jojo'] as const;
const DICA = 'Quem você escolhe fica; os outros três lados mandam novos desafiantes. Teclas 1 a 4 escolhem; R gira a roleta.';
const carta = (page: Page, i: number) => page.locator(`${ROW} .card`).nth(i);
const coroa = (page: Page, i: number) => carta(page, i).locator('.crown');
const vitorias = (n: number) => `♛ ${n} ${n === 1 ? 'vitória' : 'vitórias'}`;
const historico = async (page: Page) => (await lerStorage<Stats>(page, 'pdx-stats'))?.hist ?? [];
const esperarHist = (page: Page, n: number, timeout = 3000) =>
  expect.poll(async () => (await historico(page)).length, { timeout }).toBe(n);

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
/** Texto do histórico do Placar: "X (A) venceu Y (B), Z (C), W (D)". */
const linha = (c: Carta[], v: number) =>
  `${c[v]!.nome} (${LABEL[c[v]!.fr as Franquia]}) venceu ` +
  c.filter((_, i) => i !== v).map(x => `${x.nome} (${LABEL[x.fr as Franquia]})`).join(', ');

/** Abre o site com tudo carregado, vai pra aba Quarteto e devolve os quatro nomes iniciais. */
async function inicio(page: Page) {
  await prepare(page);
  await abrir(page);
  await aba(page, 'Quarteto');
  await expect(page.locator(`${ROW} .card`)).toHaveCount(4);
  return nomes(page, ROW);
}

/** Confere a rodada depois de `vencedor` ganhar: ele fica igual (com coroa), os outros mudam de nome e ficam sem coroa. */
function conferir(antes: Carta[], depois: Carta[], vencedor: number, n: number) {
  expect(depois.map(c => c.fr)).toEqual(antes.map(c => c.fr));
  expect(depois.map(c => c.tecla)).toEqual(['1', '2', '3', '4']);
  depois.forEach((c, i) => {
    if (i === vencedor) expect(c).toEqual({ ...antes[i]!, coroa: vitorias(n) });
    else { expect(c.coroa).toBeNull(); expect(c.nome).not.toBe(antes[i]!.nome); }
  });
}

test.describe('quarteto', () => {
  test('aba entre Trio e Campeonato; quatro seletores e quatro cartas (Pokémon, Digimon, SMT e JoJo) com teclas 1 a 4', async ({ page }) => {
    const iniciais = await inicio(page);
    await expect(page.locator('nav button')).toHaveText(['Duelo', 'Trio', 'Quarteto', 'Campeonato', 'Placar', 'Online']);
    await expect(page.locator('nav button[data-mode="quartet"]')).toHaveClass(/\bon\b/);
    await expect(page.locator('section#quartet')).toBeVisible();
    for (const s of ['duel', 'trio', 'cup', 'stats']) await expect(page.locator(`section#${s}`)).toBeHidden();
    for (const [i, fr] of PADRAO.entries()) {
      await expect(page.locator(`#quartet${i}`)).toHaveValue(fr);
      await expect(page.locator(`#quartet${i}`)).toHaveAttribute('aria-label', `Franquia ${i + 1}`);
    }
    await expect(page.locator('#quartet .bar .vsx')).toHaveText(['VS', 'VS', 'VS']);
    await expect(page.locator('#quartetSkip')).toHaveText('Trocar os quatro');
    expect(await franquias(page, ROW)).toEqual([...PADRAO]);
    for (const [i, fr] of PADRAO.entries()) {
      const c = carta(page, i);
      expect(iniciais[i]).not.toBe('');
      await expect(c.locator('.key')).toHaveText(String(i + 1));
      await expect(c.locator('.fr')).toHaveText(LABEL[fr]);
      await expect(c.locator('.img img')).toHaveAttribute('alt', iniciais[i]!);
      await expect(c.locator('.crown')).toHaveCount(0);
    }
    expect(new Set(iniciais).size).toBe(4);
    await expect(page.locator(`${ROW} .vs`)).toHaveCount(3);
    await expect(page.locator(`${ROW} .vs`)).toHaveText(['VS', 'VS', 'VS']);
    // roleta embaixo das cartas e a dica
    const btn = page.locator('#quartet .spin');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('Roleta');
    const b = (await btn.boundingBox())!, r = (await page.locator(ROW).boundingBox())!;
    expect(b.y).toBeGreaterThanOrEqual(r.y + r.height - 1);
    await expect(page.locator('#quartet .hint')).toHaveText(DICA);
  });

  test('quem vence fica com coroa; os outros três recebem desafiantes novos; o Placar grava como no Trio', async ({ page }) => {
    await inicio(page);
    const rodadas: string[] = [];
    let antes = await ler(page);

    await carta(page, 3).click();
    await expect(coroa(page, 3)).toHaveText(vitorias(1));
    let depois = await ler(page);
    conferir(antes, depois, 3, 1);
    rodadas.unshift(linha(antes, 3));

    antes = depois;
    await carta(page, 3).click();
    await expect(coroa(page, 3)).toHaveText(vitorias(2));
    depois = await ler(page);
    conferir(antes, depois, 3, 2);
    rodadas.unshift(linha(antes, 3));

    // outro lado vence: a coroa passa pra ele e o antigo campeão é trocado
    antes = depois;
    await carta(page, 0).click();
    await expect(coroa(page, 0)).toHaveText(vitorias(1));
    depois = await ler(page);
    conferir(antes, depois, 0, 1);
    rodadas.unshift(linha(antes, 0));
    expect(depois.map(c => c.fr)).toEqual([...PADRAO]);

    // placar: w pro vencedor, n pros quatro; a sequência não vira recorde (stats.best é só do Duelo)
    const s = (await lerStorage<Stats>(page, 'pdx-stats'))!;
    expect(s.w).toEqual({ jojo: 2, pokemon: 1 });
    expect(s.n).toEqual({ pokemon: 3, digimon: 3, smt: 3, jojo: 3 });
    expect(s.best ?? null).toBeNull();
    expect(s.hist).toEqual(rodadas);
    expect(s.hist[0]).toMatch(/^.+ \(Pokémon\) venceu .+ \(Digimon\), .+ \(SMT\/Persona\), .+ \(JoJo\)$/);

    await aba(page, 'Placar');
    await expect(page.locator('#stats')).toContainText('Duelo, Trio e Quarteto. Salvo neste navegador.');
    await expect(page.locator('#histList li')).toHaveText(rodadas);
    await expect(page.locator('#statsList .meter', { hasText: 'JoJo' }).locator('.n')).toHaveText('67% · 2/3');
    await expect(page.locator('#bestStreak')).toHaveText('Nenhuma sequência ainda.');
  });

  test('trocar um seletor troca só aquele lado; os outros mantêm nome e coroa', async ({ page }) => {
    await inicio(page);
    await carta(page, 0).click();
    await expect(coroa(page, 0)).toHaveText(vitorias(1));
    const antes = await ler(page);

    // lado 4 vira Yu-Gi-Oh!
    await page.selectOption('#quartet3', 'ygo');
    await expect(carta(page, 3)).toHaveAttribute('data-fr', 'ygo');
    await expect(carta(page, 3).locator('.fr')).toHaveText(LABEL.ygo);
    let depois = await ler(page);
    for (const i of [0, 1, 2]) expect(depois[i]).toEqual(antes[i]);
    expect(depois[3]).toMatchObject({ fr: 'ygo', coroa: null, tecla: '4' });

    // lado 1 (o da coroa) vira Bakugan: perde a coroa, os outros ficam iguais
    const meio = depois;
    await page.selectOption('#quartet0', 'bakugan');
    await expect(carta(page, 0)).toHaveAttribute('data-fr', 'bakugan');
    depois = await ler(page);
    expect(depois[0]).toMatchObject({ fr: 'bakugan', coroa: null, tecla: '1' });
    for (const i of [1, 2, 3]) expect(depois[i]).toEqual(meio[i]);

    // os desafiantes seguintes vêm das franquias novas
    await carta(page, 2).click();
    await expect(coroa(page, 2)).toHaveText(vitorias(1));
    conferir(depois, await ler(page), 2, 1);
    expect(await franquias(page, ROW)).toEqual(['bakugan', 'digimon', 'smt', 'ygo']);
    // o Trio não muda com os seletores do Quarteto
    await aba(page, 'Trio');
    for (const [i, fr] of ['pokemon', 'digimon', 'smt'].entries()) await expect(page.locator(`#trio${i}`)).toHaveValue(fr);
  });

  test('"Trocar os quatro" recomeça: nomes novos nos quatro lados e sem coroa', async ({ page }) => {
    await inicio(page);
    await carta(page, 1).click();
    await carta(page, 1).click();
    await expect(coroa(page, 1)).toHaveText(vitorias(2));
    const antes = await ler(page);

    await page.locator('#quartetSkip').click();
    await expect(page.locator(`${ROW} .crown`)).toHaveCount(0);
    const depois = await ler(page);
    expect(depois.map(c => c.fr)).toEqual([...PADRAO]);
    depois.forEach((c, i) => expect(c.nome).not.toBe(antes[i]!.nome));

    // a contagem recomeça do zero
    await carta(page, 1).click();
    await expect(coroa(page, 1)).toHaveText(vitorias(1));
    await expect(carta(page, 1).locator('.name')).toHaveText(depois[1]!.nome);
  });

  test('Trio e Quarteto são independentes: trocar de aba mantém as cartas e a coroa de cada um', async ({ page }) => {
    await inicio(page);
    await carta(page, 2).click();
    await expect(coroa(page, 2)).toHaveText(vitorias(1));
    const quarteto = await ler(page);
    await aba(page, 'Trio');
    await expect(page.locator('#trioRow .card')).toHaveCount(3);
    await expect(page.locator('#trioRow .crown')).toHaveCount(0);
    await page.locator('#trioRow .card').nth(0).click();
    await expect(page.locator('#trioRow .card').nth(0).locator('.crown')).toHaveText(vitorias(1));
    await aba(page, 'Quarteto');
    expect(await ler(page)).toEqual(quarteto);
    expect(await historico(page)).toHaveLength(2);
  });

  test('teclas 1 a 4 escolhem; são ignoradas com foco num <select>; 5 não faz nada', async ({ page }) => {
    await inicio(page);
    let total = 0;
    for (const [tecla, i] of [['4', 3], ['1', 0], ['3', 2], ['2', 1]] as const) {
      const antes = await ler(page);
      await page.keyboard.press(tecla);
      await expect(coroa(page, i)).toHaveText(vitorias(1));
      conferir(antes, await ler(page), i, 1);
      await esperarHist(page, ++total);
      expect((await historico(page))[0]).toBe(linha(antes, i));
    }
    const antes = await ler(page);

    // com foco no seletor, 1 a 4 não escolhem (nem mudam a franquia)
    await page.locator('#quartet3').focus();
    for (const t of ['1', '2', '3', '4']) await page.keyboard.press(t);
    for (const [i, fr] of PADRAO.entries()) await expect(page.locator(`#quartet${i}`)).toHaveValue(fr);
    await page.locator('#quartet3').evaluate(e => (e as HTMLSelectElement).blur());
    // tecla sem carta correspondente também não faz nada
    for (const t of ['5', '0', '9']) await page.keyboard.press(t);
    await page.waitForTimeout(300);
    expect(await ler(page)).toEqual(antes);
    expect(await historico(page)).toHaveLength(4);

    // se alguma das teclas acima tivesse contado, aqui não seriam 2 vitórias do mesmo nome
    await page.keyboard.press('2');
    await expect(coroa(page, 1)).toHaveText(vitorias(2));
    conferir(antes, await ler(page), 1, 2);
  });

  test.describe('roleta com movimento reduzido', () => {
    test.use({ reducedMotion: 'reduce' });

    test('o botão e a tecla R escolhem uma das quatro cartas, que conta como escolha normal', async ({ page }) => {
      await inicio(page);
      for (const [n, girar] of [[1, () => page.locator('#quartet .spin').click()], [2, () => page.keyboard.press('r')]] as const) {
        const antes = await ler(page);
        await girar();
        await esperarHist(page, n);
        await expect(page.locator('body')).not.toHaveClass(/spinning/);
        const depois = await ler(page);
        const v = depois.findIndex(c => c.coroa !== null);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(depois.filter(c => c.coroa !== null)).toHaveLength(1);
        // quem a roleta escolheu ficou com a coroa; os outros três foram trocados
        conferir(antes, depois, v, antes[v]!.coroa ? 2 : 1);
        expect((await historico(page))[0]).toBe(linha(antes, v));
        await expect(page.locator(`${ROW} .card.lit, ${ROW} .card.picked`)).toHaveCount(0);
        await expect(page.locator('#quartet .spin')).toBeEnabled();
      }
    });
  });

  test('no celular as cartas ficam numa grade 2×2, menores, sem VS', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 560, 'layout de tela estreita (< 560px)');
    await inicio(page);
    await expect(page.locator(ROW)).toHaveCSS('display', 'grid');
    const vs = page.locator(`${ROW} .vs`);
    await expect(vs).toHaveCount(3);
    for (let i = 0; i < 3; i++) await expect(vs.nth(i)).toBeHidden();
    await page.mouse.move(0, 0); await page.waitForTimeout(200); // carta com :hover sobe 3px (com transição)
    const c = await caixas(page, `${ROW} .card`);
    expect(c).toHaveLength(4);
    // 1 e 2 em cima, 3 e 4 embaixo, nas mesmas colunas
    expect(Math.abs(c[0]!.y - c[1]!.y)).toBeLessThan(2);
    expect(Math.abs(c[2]!.y - c[3]!.y)).toBeLessThan(2);
    expect(c[1]!.x).toBeGreaterThanOrEqual(c[0]!.x + c[0]!.w);
    expect(c[2]!.y).toBeGreaterThanOrEqual(c[0]!.y + c[0]!.h);
    expect(Math.abs(c[2]!.x - c[0]!.x)).toBeLessThan(2);
    expect(Math.abs(c[3]!.x - c[1]!.x)).toBeLessThan(2);
    for (const k of c) expect(Math.abs(k.w - c[0]!.w)).toBeLessThan(2);
    // a grade cabe na tela, sem rolagem lateral
    const largura = page.viewportSize()!.width;
    expect(c[1]!.x + c[1]!.w).toBeLessThanOrEqual(largura);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(largura);
    // menores que as cartas empilhadas do Trio
    await aba(page, 'Trio');
    await expect(page.locator('#trioRow .card')).toHaveCount(3);
    const t = await caixas(page, '#trioRow .card');
    expect(c[0]!.w).toBeLessThan(t[0]!.w);
  });

  test('no computador as quatro cartas ficam lado a lado com VS entre elas', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 560, 'layout de tela larga (>= 560px)');
    await inicio(page);
    await expect(page.locator(ROW)).toHaveCSS('display', 'flex');
    await expect(page.locator(ROW)).toHaveCSS('flex-direction', 'row');
    const vs = page.locator(`${ROW} .vs`);
    await expect(vs).toHaveCount(3);
    for (let i = 0; i < 3; i++) await expect(vs.nth(i)).toBeVisible();
    await page.mouse.move(0, 0); await page.waitForTimeout(200); // carta com :hover sobe 3px (com transição)
    const c = await caixas(page, `${ROW} .card`);
    const v = await caixas(page, `${ROW} .vs`);
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(c[i + 1]!.y - c[i]!.y)).toBeLessThan(4);
      expect(v[i]!.x).toBeGreaterThanOrEqual(c[i]!.x + c[i]!.w - 1);
      expect(c[i + 1]!.x).toBeGreaterThanOrEqual(v[i]!.x + v[i]!.w - 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  });
});
