// Ranking às cegas (solo): um personagem por vez vai pra uma posição do top e fica travado lá.
import { test, expect, type Page } from '@playwright/test';
import { prepare, abrir, aba, lerStorage } from './helpers';

test.use({ reducedMotion: 'reduce' });

const nomeAtual = async (page: Page) => (await page.locator('#rankNow .card .name').textContent())!.trim();
const frAtual = (page: Page) => page.locator('#rankNow .card').getAttribute('data-fr');
const vaga = (page: Page, pos: number) => page.locator(`#rankBoard li[data-pos="${pos}"]`);
/** Nomes e franquias de um top da tela final, do 1º lugar ao último. */
const topFinal = async (page: Page, i: number) => {
  const top = page.locator('#rankTops .rank-top').nth(i);
  return {
    nomes: (await top.locator('li .nm').allTextContents()).map(s => s.trim()),
    frs: await top.locator('li').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.fr ?? '')),
  };
};
const contar = (xs: string[]) => xs.reduce<Record<string, number>>((m, x) => ({ ...m, [x]: (m[x] ?? 0) + 1 }), {});

async function abrirRanking(page: Page, opts: Parameters<typeof prepare>[1] = {}) {
  await prepare(page, opts);
  await abrir(page);
  await aba(page, 'Ranking');
  await expect(page.locator('#rankSetup')).toBeVisible();
}

test.describe('Ranking', () => {
  test('configuração: aba depois do Campeonato, top 10 de Pokémon e Digimon, tamanho de 3 a 20', async ({ page }) => {
    await abrirRanking(page);
    expect(await page.locator('nav button').allTextContents()).toEqual(['Duelo', 'Trio', 'Quarteto', 'Campeonato', 'Ranking', 'Placar', 'Personalizar', 'Online']);
    await expect(page.locator('nav button.on')).toHaveText('Ranking');
    await expect(page.locator('#rankSize')).toHaveValue('10');
    await expect(page.locator('#rank_pokemon')).toBeChecked();
    await expect(page.locator('#rank_digimon')).toBeChecked();
    await expect(page.locator('#rank_smt')).not.toBeChecked();
    await expect(page.locator('#rankMix')).not.toBeChecked();
    await expect(page.locator('#rankResumo')).toHaveText('2 tops de 10, um depois do outro: Pokémon e Digimon.');

    // − e +, e o que for digitado fora dos limites ajusta ao sair do campo
    await page.locator('#rankSizeMais').click();
    await expect(page.locator('#rankSize')).toHaveValue('11');
    await page.locator('#rankSize').fill('25');
    await page.locator('#rankSize').blur();
    await expect(page.locator('#rankSize')).toHaveValue('20');
    await expect(page.locator('#rankSizeMais')).toBeDisabled();
    await page.locator('#rankSize').fill('1');
    await page.locator('#rankSize').press('Enter');
    await expect(page.locator('#rankSize')).toHaveValue('3');
    await expect(page.locator('#rankSizeMenos')).toBeDisabled();
    await page.locator('#rankSize').fill('7');
    await expect(page.locator('#rankSizeMenos')).toBeEnabled();

    await page.locator('#rankMix').check();
    await expect(page.locator('#rankResumo')).toHaveText('Um top de 7 com Pokémon e Digimon misturados (3 ou 4 de cada, em ordem sorteada).');
    await page.locator('#rank_smt').check();
    await expect(page.locator('#rankResumo')).toContainText('Pokémon, Digimon e SMT misturados (2 ou 3 de cada');

    // nada marcado: o botão avisa e o ranking não começa
    for (const k of ['pokemon', 'digimon', 'smt']) await page.locator('#rank_' + k).uncheck();
    await expect(page.locator('#rankResumo')).toHaveText('Marque pelo menos uma franquia.');
    await page.locator('#rankStart').click();
    await expect(page.locator('#rankStart')).toHaveText('Marque uma franquia já carregada');
    await expect(page.locator('#rankPlay')).toHaveCount(0);
    await expect(page.locator('#rankStart')).toHaveText('Começar', { timeout: 4000 });
  });

  test('só conta franquia já carregada: com o Pokémon fora do ar, sobra o top de Digimon', async ({ page }) => {
    await abrirRanking(page, { falha: ['pokemon'] });
    await expect(page.locator('#status')).toContainText('Pokémon: falhou');
    await expect(page.locator('#rankResumo')).toHaveText('Top 10 de Digimon.');
    await page.locator('#rankStart').click();
    await expect(page.locator('#rankTitle')).toHaveText('Top 10 de Digimon');
    await expect(page.locator('#rankCount')).toHaveText('1 de 10');
    await page.locator('#rankQuit').click();
    await page.locator('#rank_digimon').uncheck();
    await page.locator('#rankStart').click();
    await expect(page.locator('#rankStart')).toHaveText('Marque uma franquia já carregada');
  });

  test('separado: top de Pokémon e depois o de Digimon, cada um na posição escolhida; nada é salvo', async ({ page }) => {
    await abrirRanking(page);
    const chaves = await page.evaluate(() => Object.keys(localStorage).sort());
    const stats = await lerStorage(page, 'pdx-stats');
    await page.locator('#rankSize').fill('4');
    await page.locator('#rankStart').click();

    const tops: string[][] = [[], []];
    for (const [t, fr, titulo] of [[0, 'pokemon', 'Top 4 de Pokémon'], [1, 'digimon', 'Top 4 de Digimon']] as const) {
      await expect(page.locator('#rankTitle')).toHaveText(titulo);
      await expect(page.locator('#rankBoard li')).toHaveCount(4);
      await expect(page.locator('#rankBoard li.filled')).toHaveCount(0);
      await expect(page.locator('#rankBoard li.free button')).toHaveCount(4);
      for (const [i, pos] of [2, 0, 3, 1].entries()) {
        await expect(page.locator('#rankCount')).toHaveText(`${i + 1} de 4 · top ${t + 1} de 2`);
        await expect(page.locator('#rankNow .card')).toHaveAttribute('data-fr', fr);
        const nome = await nomeAtual(page);
        tops[t]![pos] = nome;
        await vaga(page, pos).locator('button').click();
        if (i < 3) {
          await expect(vaga(page, pos)).toHaveClass(/filled/);
          await expect(vaga(page, pos).locator('.nm')).toHaveText(nome);
          await expect(vaga(page, pos)).toHaveAttribute('data-fr', fr);
        }
      }
      // o primeiro top pronto fica guardado embaixo enquanto se monta o segundo
      if (t === 0) await expect(page.locator('#rankDoneTops summary')).toHaveText('Top pronto');
    }

    await expect(page.locator('#rankEnd')).toBeVisible();
    await expect(page.locator('#rankPlay')).toHaveCount(0);
    await expect(page.locator('#rankTops .rank-top h3')).toHaveText(['Top 4 de Pokémon', 'Top 4 de Digimon']);
    for (const t of [0, 1]) {
      const fim = await topFinal(page, t);
      expect(fim.nomes).toEqual(tops[t]);
      expect(fim.frs).toEqual(Array(4).fill(t === 0 ? 'pokemon' : 'digimon'));
    }
    expect(new Set(tops.flat()).size).toBe(8);
    // nada no placar e nenhuma chave nova no localStorage
    expect(await lerStorage(page, 'pdx-stats')).toEqual(stats);
    expect(await page.evaluate(() => Object.keys(localStorage).sort())).toEqual(chaves);
  });

  test('misturado: um top só, com as vagas divididas igualmente e em ordem sorteada', async ({ page }) => {
    await abrirRanking(page);
    await page.locator('#rankMix').check();
    await page.locator('#rankStart').click();
    await expect(page.locator('#rankTitle')).toHaveText('Top 10 misturado');
    await expect(page.locator('#rankCount')).toHaveText('1 de 10');
    const ordem: string[] = [];
    for (let i = 0; i < 10; i++) {
      await expect(page.locator('#rankCount')).toHaveText(`${i + 1} de 10`);
      ordem.push((await frAtual(page))!);
      await page.locator('#rankBoard li.free button').first().click();
    }
    await expect(page.locator('#rankTops .rank-top h3')).toHaveText(['Top 10 misturado']);
    const fim = await topFinal(page, 0);
    expect(fim.frs).toEqual(ordem);
    expect(contar(ordem)).toEqual({ pokemon: 5, digimon: 5 });
    // a ordem é sorteada: não vêm todos os Pokémon e depois todos os Digimon
    expect(new Set(ordem.slice(0, 5)).size).toBe(2);

    // três franquias num top de 10: 4, 3 e 3
    await page.locator('#rankSetupBtn').click();
    await page.locator('#rank_smt').check();
    await page.locator('#rankStart').click();
    for (let i = 0; i < 10; i++) {
      await expect(page.locator('#rankCount')).toHaveText(`${i + 1} de 10`);
      await page.locator('#rankBoard li.free button').last().click();
    }
    const tres = contar((await topFinal(page, 0)).frs);
    expect(Object.keys(tres).sort()).toEqual(['digimon', 'pokemon', 'smt']);
    expect(Object.values(tres).sort()).toEqual([3, 3, 4]);
  });

  test('posição ocupada fica travada: clicar ou apertar a tecla dela não faz nada', async ({ page }) => {
    await abrirRanking(page);
    await page.locator('#rank_digimon').uncheck();
    await page.locator('#rankStart').click();
    await expect(page.locator('#rankTitle')).toHaveText('Top 10 de Pokémon');
    const a = await nomeAtual(page);
    await vaga(page, 0).locator('button').click();
    await expect(page.locator('#rankCount')).toHaveText('2 de 10');
    const b = await nomeAtual(page);
    expect(b).not.toBe(a);
    await expect(vaga(page, 0).locator('button')).toHaveCount(0);
    await vaga(page, 0).click();
    await page.keyboard.press('1');
    await expect(page.locator('#rankCount')).toHaveText('2 de 10');
    expect(await nomeAtual(page)).toBe(b);
    await expect(vaga(page, 0).locator('.nm')).toHaveText(a);
    await expect(page.locator('#rankBoard li.filled')).toHaveCount(1);
  });

  test('teclado: 1 a 9 põem nas posições 1 a 9 e 0 põe na 10ª', async ({ page }) => {
    await abrirRanking(page);
    await page.locator('#rank_digimon').uncheck();
    await page.locator('#rankStart').click();
    await expect(page.locator('#rankBoard li .k')).toHaveText(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
    const esperado: string[] = [];
    for (const tecla of ['0', '5', '1', '9', '2', '8', '3', '7', '4', '6']) {
      const pos = tecla === '0' ? 9 : +tecla - 1;
      const nome = await nomeAtual(page);
      esperado[pos] = nome;
      await page.keyboard.press(tecla);
      if (esperado.filter(Boolean).length < 10) {
        await expect(vaga(page, pos).locator('.nm')).toHaveText(nome);
        await expect(vaga(page, pos).locator('.k')).toHaveCount(0);
      }
    }
    await expect(page.locator('#rankEnd')).toBeVisible();
    expect((await topFinal(page, 0)).nomes).toEqual(esperado);
  });

  test('fim: Jogar de novo repete a configuração; Abandonar e Mudar configuração voltam pra configuração', async ({ page }) => {
    await abrirRanking(page);
    await page.locator('#rank_digimon').uncheck();
    await page.locator('#rankSize').fill('3');
    await page.locator('#rankStart').click();
    for (let i = 0; i < 3; i++) await page.locator('#rankBoard li.free button').first().click();
    await expect(page.locator('#rankEnd h2')).toHaveText('Seu top');
    const antes = (await topFinal(page, 0)).nomes;

    await page.locator('#rankAgain').click();
    await expect(page.locator('#rankTitle')).toHaveText('Top 3 de Pokémon');
    await expect(page.locator('#rankCount')).toHaveText('1 de 3');
    await expect(page.locator('#rankBoard li.filled')).toHaveCount(0);
    // o saco de sorteio não repete quem acabou de aparecer
    expect(antes).not.toContain(await nomeAtual(page));

    // abandonar no meio volta pra configuração, que continua igual
    await vaga(page, 1).locator('button').click();
    await page.locator('#rankQuit').click();
    await expect(page.locator('#rankSetup')).toBeVisible();
    await expect(page.locator('#rankSize')).toHaveValue('3');
    await expect(page.locator('#rank_digimon')).not.toBeChecked();

    // trocar de aba e voltar mantém o ranking em andamento
    await page.locator('#rankStart').click();
    await vaga(page, 2).locator('button').click();
    await aba(page, 'Duelo');
    await aba(page, 'Ranking');
    await expect(page.locator('#rankCount')).toHaveText('2 de 3');
    for (let i = 0; i < 2; i++) await page.locator('#rankBoard li.free button').first().click();
    await page.locator('#rankSetupBtn').click();
    await expect(page.locator('#rankSetup')).toBeVisible();
    await expect(page.locator('#rankEnd')).toHaveCount(0);
  });

  test('layout: no celular a carta fica em cima da lista; no computador, à esquerda; sem rolagem lateral', async ({ page }) => {
    await abrirRanking(page);
    const largura = page.viewportSize()!.width;
    const semRolagem = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(largura);
    await semRolagem();
    await page.locator('#rankStart').click();
    await expect(page.locator('#rankNow .card .img img')).toBeVisible();
    const carta = (await page.locator('#rankNow .card').boundingBox())!;
    const lista = (await page.locator('#rankBoard').boundingBox())!;
    if (largura < 560) {
      expect(lista.y).toBeGreaterThanOrEqual(carta.y + carta.height - 1);
      // a carta fica menor no celular pra lista aparecer logo
      expect(carta.width).toBeLessThanOrEqual(210);
    } else {
      expect(lista.x).toBeGreaterThanOrEqual(carta.x + carta.width - 1);
      expect(Math.abs(lista.y - carta.y)).toBeLessThan(40);
    }
    await semRolagem();
    for (let i = 0; i < 20; i++) await page.locator('#rankBoard li.free button').first().click();
    await expect(page.locator('#rankEnd')).toBeVisible();
    await semRolagem();
    const [a, b] = await page.locator('#rankTops .rank-top').evaluateAll(els => els.map(e => e.getBoundingClientRect().toJSON() as DOMRect));
    // dois tops: lado a lado no computador, um embaixo do outro no celular
    if (largura < 560) expect(b!.y).toBeGreaterThanOrEqual(a!.y + a!.height - 1);
    else expect(Math.abs(b!.y - a!.y)).toBeLessThan(2);
  });
});
