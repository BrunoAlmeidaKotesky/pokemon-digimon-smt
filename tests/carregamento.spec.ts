import { test, expect } from '@playwright/test';
import { prepare, abrir, statusEsperado, nomes, franquias, aba, fixture } from './helpers';

test.describe('carregamento e status', () => {
  test('carrega todas as franquias e mostra a contagem', async ({ page }) => {
    const calls = await prepare(page);
    await abrir(page);
    await expect(page.locator('#status')).toHaveText(statusEsperado());
    await expect(page.locator('h1')).toHaveText('Pokémon x Digimon x SMT x JoJo x Yu-Gi-Oh! x Bakugan x Sujimon');
    await expect(page.locator('#h1suji')).toBeVisible();
    await expect(page.locator('meta[name=referrer]')).toHaveAttribute('content', 'no-referrer');
    await expect(page).toHaveTitle('Quem Você Prefere');
    // duelo padrão: Pokémon x Digimon
    await expect(page.locator('#duelRow .card')).toHaveCount(2);
    expect(await franquias(page, '#duelRow')).toEqual(['pokemon', 'digimon']);
    expect(calls.bloqueado ?? 0).toBe(0);
    // Digimon em duas páginas, JoJo e Bakugan com paginação "continue"
    expect(calls.digimon).toBe(2);
    expect(calls.bakugan).toBe(2);
  });

  test('status mostra "carregando" enquanto a lista não chega', async ({ page }) => {
    await prepare(page, { atraso: { ygo: 2500 } });
    await page.goto('./');
    await expect(page.locator('#status')).toContainText('Yu-Gi-Oh!: carregando');
    await expect(page.locator('#status')).toHaveText(statusEsperado(), { timeout: 10000 });
  });

  test('franquia que falha mostra "falhou" e não impede as outras', async ({ page }) => {
    await prepare(page, { falha: ['pokemon', 'bakugan'] });
    await abrir(page);
    await expect(page.locator('#status')).toHaveText(statusEsperado([], { pokemon: 'falhou', bakugan: 'falhou' }));
    // o duelo padrão usa Pokémon, que falhou: fica esperando
    await expect(page.locator('#duelRow')).toContainText('Esperando as listas carregarem…');
    await page.selectOption('#duelA', 'smt');
    await expect(page.locator('#duelRow .card')).toHaveCount(2);
    expect(await franquias(page, '#duelRow')).toEqual(['smt', 'digimon']);
  });

  test('sem sujimon/list.json e sem a Yakuza Wiki o Sujimon some de tudo', async ({ page }) => {
    await prepare(page, { sujimon: 'ausente' });
    await abrir(page);
    await expect(page.locator('#status')).toHaveText(statusEsperado(['sujimon']));
    await expect(page.locator('#h1suji')).toBeHidden();
    await expect(page.locator('h1')).not.toContainText('Sujimon', { useInnerText: true });
    await expect(page.locator('option[value=sujimon]')).toHaveCount(0);
    await aba(page, 'Campeonato');
    await expect(page.locator('#cup_sujimon')).toHaveCount(0);
    await expect(page.locator('#cupFr label')).toHaveCount(6);
  });

  test('sem sujimon/list.json o Sujimon vem da Yakuza Wiki', async ({ page }) => {
    const calls = await prepare(page, { sujimon: 'ausente', sujimonWiki: true, atraso: { pokemon: 300, digimon: 300 } });
    await abrir(page);
    await expect(page.locator('#status')).toContainText('Sujimon: ');
    const n = Number((await page.locator('#status').textContent())!.match(/Sujimon: (\d+)/)![1]);
    expect(n).toBeGreaterThan(20);
    expect(calls.sujidex).toBeGreaterThanOrEqual(3);
    await expect(page.locator('#h1suji')).toBeVisible();
    await page.selectOption('#duelB', 'sujimon');
    const card = page.locator('#duelRow .card').nth(1);
    await expect(card).toHaveAttribute('data-fr', 'sujimon');
    await expect(card.locator('img')).toHaveAttribute('src', /^https:\/\/static\.wikia\.nocookie\.net\/yakuza\//);
    await aba(page, 'Campeonato');
    await expect(page.locator('#cup_sujimon')).toBeChecked();
  });

  test('com list.json o Sujimon aparece nos seletores, no campeonato e no título', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    for (const sel of ['#duelA', '#duelB', '#trio0', '#trio1', '#trio2'])
      await expect(page.locator(`${sel} option[value=sujimon]`)).toHaveText('Sujimon');
    await page.selectOption('#duelB', 'sujimon');
    await expect(page.locator('#duelRow .card').nth(1)).toHaveAttribute('data-fr', 'sujimon');
    await expect(page.locator('#duelRow .card').nth(1).locator('.fr')).toHaveText('Sujimon');
    const lista = fixture<[string, string][]>('sujimon-list.json').map(x => x[0]);
    expect(lista).toContain((await nomes(page, '#duelRow'))[1]);
    await aba(page, 'Campeonato');
    await expect(page.locator('#cup_sujimon')).toBeChecked();
  });

  test('Digimon sem imagem busca o detalhe (resolve)', async ({ page }) => {
    // o saco de Digimon começa com o Betamon (sem imagem na listagem) no topo
    // Digimon carrega por último: assim nenhum desafiante é pré-sorteado (e descartado) antes de o duelo começar.
    const calls = await prepare(page, { atraso: { digimon: 500 }, storage: { 'pdx-bags': { digimon: ['Agumon', 'Betamon'] } } });
    await abrir(page);
    const card = page.locator('#duelRow .card').nth(1);
    await expect(card.locator('.name')).toHaveText('Betamon');
    await expect(card.locator('img')).toHaveAttribute('src', 'https://digi-api.com/images/digimon/w/Betamon.png');
    expect(calls['digimon-detalhe']).toBeGreaterThanOrEqual(1);
  });

  test('nomes de Pokémon passam por nice() e os filtros de JoJo/YGO/Bakugan valem', async ({ page }) => {
    // No topo de cada saco fica um nome que o filtro deveria ter tirado da lista: draw() ignora nome que não existe.
    await prepare(page, { atraso: { pokemon: 500 }, storage: { 'pdx-bags': {
      pokemon: ['Bulbasaur', 'Nidoran F'],
      jojo: ['Star Platinum', 'Star Platinum/Gallery', 'List of Stands', 'Stand sem imagem'],
      ygo: ['Dark Magician', 'Speed Duel Only Monster', 'Sheep Token', 'Spell Card'],
      bakugan: ['Drago', 'Angelo/Diablo Preyas'],
    } } });
    await abrir(page);
    await expect(page.locator('#duelRow .card').nth(0).locator('.name')).toHaveText('Nidoran F');
    await page.selectOption('#duelA', 'jojo');
    await expect(page.locator('#duelRow .card').nth(0).locator('.name')).toHaveText('Star Platinum');
    await page.selectOption('#duelA', 'ygo');
    await expect(page.locator('#duelRow .card').nth(0).locator('.name')).toHaveText('Dark Magician');
    await expect(page.locator('#duelRow .card').nth(0).locator('img')).toHaveAttribute('src', 'https://images.ygoprodeck.com/images/cards_cropped/900001.jpg');
    await page.selectOption('#duelA', 'bakugan');
    await expect(page.locator('#duelRow .card').nth(0).locator('.name')).toHaveText('Drago');
  });
});
