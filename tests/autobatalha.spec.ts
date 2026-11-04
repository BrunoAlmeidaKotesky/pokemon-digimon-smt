// Aba Autobatalha: tela inicial, partida (loja, banco, tabuleiro, Pronto, luta, próxima rodada, carrossel do 2-1),
// dica no hover e o planejador de times (pdx-autobatalha-planos). O set é o public/autobatalha/set1.json de verdade
// (servido junto com o site); as imagens externas viram o PNG cinza dos mocks. O relógio fica desligado
// (pdx-autobatalha-config) pra rodada só acabar no "Pronto".
import { test, expect, type Locator, type Page } from '@playwright/test';
import { prepare, abrir, aba, lerStorage } from './helpers';

const CONFIG = { relogio: false, segundos: 35, velocidade: 4 };

async function inicio(page: Page, storage: Record<string, unknown> = {}) {
  await prepare(page, { storage: { 'pdx-autobatalha-config': CONFIG, ...storage } });
  await abrir(page);
  await aba(page, 'Autobatalha');
  await expect(page.locator('section#autobatalha')).toBeVisible();
  await expect(page.locator('#abNova')).toBeEnabled({ timeout: 15000 });
}

/** arrasta com o mouse (pointer events) de um elemento pro centro de outro */
async function arrastar(page: Page, de: Locator, para: Locator) {
  await de.hover();
  await page.mouse.down();
  const b = (await para.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
  await page.mouse.up();
}

test.describe('Autobatalha', () => {
  test('a aba só monta com ela aberta e a página fica mais larga', async ({ page }) => {
    await prepare(page, { storage: { 'pdx-autobatalha-config': CONFIG } });
    await abrir(page);
    await expect(page.locator('section#autobatalha')).toBeHidden();
    await expect(page.locator('section#autobatalha *')).toHaveCount(0);
    const antes = (await page.locator('.wrap').boundingBox())!.width;
    await aba(page, 'Autobatalha');
    await expect(page.locator('nav button.on')).toHaveText('Autobatalha');
    await expect(page.locator('#abNova')).toBeEnabled({ timeout: 15000 });
    expect((await page.locator('.wrap').boundingBox())!.width).toBeGreaterThan(antes);
    await expect(page.locator('#abContinuar')).toHaveCount(0);
    await expect(page.locator('#abRelogio')).not.toBeChecked();
  });

  test('partida: 7 cartas, compra, põe no tabuleiro, Pronto, luta, pula e chega na próxima rodada', async ({ page }) => {
    await inicio(page);
    await page.locator('#abNova').click();
    await expect(page.locator('#abRodada')).toHaveAttribute('data-rodada', '1-1');
    await expect(page.locator('#abCartas > li')).toHaveCount(7);
    await expect(page.locator('#abCartas .ab-carta[data-campeao]')).toHaveCount(7);
    await expect(page.locator('#abJogadores .ab-jog')).toHaveCount(8);
    await expect(page.locator('#abJogadores .ab-jog.eu')).toHaveCount(1);

    // começa com um campeão de custo 1 de graça no tabuleiro e 1 de ouro: compra uma carta de custo 1
    const noBanco = page.locator('#abBanco .ab-peca');
    const noTab = page.locator('#abTabuleiro .ab-peca');
    await expect(noTab).toHaveCount(1);
    await expect(noBanco).toHaveCount(0);
    await expect(page.locator('#abLimite')).toHaveText('1/1');
    await expect(page.locator('#abTracos .ab-traco').first()).toBeVisible();
    await expect(page.locator('#abOuro')).toHaveText('1');
    await page.locator('#abCartas .ab-carta[data-custo="1"]').first().click();
    await expect(page.locator('#abOuro')).toHaveText('0');
    await expect(noBanco).toHaveCount(1);
    await expect(page.locator('#abCartas .ab-carta.vazia')).toHaveCount(1);

    // tabuleiro → banco e banco → tabuleiro
    await arrastar(page, noTab.first(), page.locator('#abBanco .ab-vaga[data-i="5"]'));
    await expect(noTab).toHaveCount(0);
    await expect(noBanco).toHaveCount(2);
    await expect(page.locator('#abBanco .ab-vaga[data-i="5"] .ab-peca')).toHaveCount(1);
    await expect(page.locator('#abLimite')).toHaveText('0/1');
    await arrastar(page, noBanco.first(), page.locator('#abTabuleiro .ab-casa[data-col="3"][data-lin="1"]'));
    await expect(noTab).toHaveCount(1);
    await expect(noBanco).toHaveCount(1);
    await expect(page.locator('#abLimite')).toHaveText('1/1');
    // a peça fica no centro da casa onde foi solta
    const casa = (await page.locator('#abTabuleiro .ab-casa[data-col="3"][data-lin="1"]').boundingBox())!;
    const peca = (await noTab.first().locator('.ab-foto').boundingBox())!;
    expect(Math.abs(peca.x + peca.width / 2 - (casa.x + casa.width / 2))).toBeLessThan(3);
    expect(Math.abs(peca.y + peca.height / 2 - (casa.y + casa.height / 2))).toBeLessThan(3);

    // Pronto: a luta aparece com os dois lados; pular mostra o placar; depois vem a 1-2
    await page.locator('#abPronto').click();
    await expect(page.locator('#abLuta')).toBeVisible();
    await expect(page.locator('#abLuta .ab-peca[data-lado="a"]').first()).toBeVisible();
    await expect(page.locator('#abLuta .ab-peca[data-lado="b"]').first()).toBeVisible();
    await page.locator('#abPular').click();
    await expect(page.locator('#abPlacar')).toBeVisible();
    await expect(page.locator('#abPlacar b')).toHaveText(/Vitória|Derrota|Empate/);
    await expect(page.locator('#abRodada')).toHaveAttribute('data-rodada', '1-2', { timeout: 10000 });
    await expect(page.locator('#abLuta')).toHaveCount(0);
    await expect(page.locator('#abTabuleiro')).toBeVisible();
    await expect(page.locator('#abPronto')).toBeVisible();
  });

  test('carrossel no começo do estágio 2: ordem, dica, pega uma opção na sua vez e vai pro planejamento', async ({ page }) => {
    test.setTimeout(90_000);
    // sem movimento o círculo não gira (o clique fica estável)
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await inicio(page);
    await page.locator('#abNova').click();
    for (const r of ['1-1', '1-2', '1-3']) {
      await expect(page.locator('#abRodada')).toHaveAttribute('data-rodada', r, { timeout: 10000 });
      await page.locator('#abPronto').click();
      await page.locator('#abPular').click();
    }
    const car = page.locator('#abCarrossel');
    await expect(car).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.ab-jogo')).toHaveAttribute('data-fase', 'carrossel');
    await expect(page.locator('#abRodada')).toHaveAttribute('data-rodada', '2-1');
    await expect(page.locator('#abPronto')).toHaveCount(0);
    await expect(car.locator('.ab-car-op')).toHaveCount(9);
    await expect(car.locator('#abCarOrdem .ab-car-jog')).toHaveCount(8);
    await expect(car.locator('#abCarOrdem .ab-car-jog.eu')).toHaveCount(1);

    // dica da opção: o campeão e o item que vem junto
    await car.locator('.ab-car-op').first().hover();
    const dica = page.locator('#abDica');
    await expect(dica).toContainText('no carrossel: estrela 1');
    await expect(dica).toContainText('Vem com');
    await page.mouse.move(5, 5);
    await expect(dica).toBeHidden();

    // espera a vez do humano (a 4ª dupla sai em ~12 s) e pega uma opção que sobrou
    await expect(car).toHaveClass(/\bpode\b/, { timeout: 20000 });
    await expect(page.locator('#abCarStatus')).toHaveText('Sua vez: clique num campeão');
    const itens = await page.locator('#abItens .ab-item-solto').count();
    const livre = car.locator('.ab-car-op.pode').first();
    const campeao = (await livre.getAttribute('data-campeao'))!;
    await livre.click();
    await expect(car.locator('.ab-car-op[data-pegou="voce"]')).toHaveCount(1);
    await expect(page.locator('#abCarStatus')).toContainText('Você pegou');
    await expect(car.locator('#abCarOrdem .ab-car-jog.eu')).toHaveClass(/pegou/);
    await expect(page.locator('#abItens .ab-item-solto')).toHaveCount(itens + 1);

    // acaba sozinho e vem o planejamento da 2-1, com o campeão pego
    await expect(page.locator('#abPronto')).toBeVisible({ timeout: 20000 });
    await expect(car).toHaveCount(0);
    await expect(page.locator('.ab-jogo')).toHaveAttribute('data-fase', 'planejamento');
    await expect(page.locator(`#abBanco .ab-peca[data-campeao="${campeao}"], #abTabuleiro .ab-peca[data-campeao="${campeao}"]`).first()).toBeVisible();
  });

  test('dica no hover: carta da loja, peça do banco e lutador na luta', async ({ page }) => {
    await inicio(page);
    await page.locator('#abNova').click();
    const carta = page.locator('#abCartas .ab-carta[data-campeao]').first();
    const nome = (await carta.locator('.faixa .nome').textContent())!.trim();
    await carta.hover();
    const dica = page.locator('#abDica');
    await expect(dica).toBeVisible();
    await expect(dica.locator('.ab-d-nome')).toHaveText(nome);
    await expect(dica).toContainText('Vida');
    await expect(dica).toContainText('na loja: estrela 1');
    // dentro da janela
    const b = (await dica.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(1280);
    expect(b.y + b.height).toBeLessThanOrEqual(800);

    await page.mouse.move(5, 5);
    await expect(dica).toBeHidden();
    await page.locator('#abTabuleiro .ab-peca').first().hover();
    await expect(dica).toBeVisible();
    await expect(dica.locator('.ab-d-at')).toContainText('Alcance');
    await expect(dica).not.toHaveClass(/fixa/);
    // clique (sem arrastar) fixa a dica; clique fora solta
    await page.locator('#abTabuleiro .ab-peca').first().click();
    await expect(dica).toHaveClass(/fixa/);
    await page.mouse.click(5, 5);
    await expect(dica).toBeHidden();

    await page.mouse.move(5, 5);
    await page.locator('#abPronto').click();
    await page.locator('#abLuta .ab-peca[data-lado="b"]').first().hover();
    await expect(dica).toBeVisible();
    await expect(dica).toContainText('Vida');
  });

  test('vender arrastando pra loja, atalho D atualiza a loja e olhar o tabuleiro de outro jogador', async ({ page }) => {
    await inicio(page);
    await page.locator('#abNova').click();
    const noTab = page.locator('#abTabuleiro .ab-peca');
    await expect(noTab).toHaveCount(1);
    await arrastar(page, noTab.first(), page.locator('#abCartas'));
    await expect(noTab).toHaveCount(0);
    await expect(page.locator('#abOuro')).toHaveText('2');
    const nomes = () => page.locator('#abCartas .ab-carta[data-campeao]').evaluateAll(els => els.map(e => e.getAttribute('data-campeao')).join());
    const antes = await nomes();
    await page.mouse.move(5, 5);
    await page.keyboard.press('d');
    await expect(page.locator('#abOuro')).toHaveText('0');
    await expect.poll(nomes).not.toBe(antes);

    // clicar num jogador mostra o tabuleiro dele só pra ver; "Voltar pro meu" volta
    const bot = page.locator('#abJogadores .ab-jog:not(.eu)').first();
    const nome = (await bot.locator('.nm').textContent())!.trim();
    await bot.click();
    await expect(page.locator('.ab-olhando')).toContainText(nome);
    await expect(page.locator('#abTabuleiro')).not.toHaveClass(/editavel/);
    await expect(bot).toHaveClass(/vendo/);
    await page.locator('#abVoltar').click();
    await expect(page.locator('.ab-olhando')).toHaveCount(0);
    await expect(page.locator('#abTabuleiro')).toHaveClass(/editavel/);
  });

  test('planejador: escolhe campeões, salva, marca na loja e fica no localStorage', async ({ page }) => {
    await inicio(page);
    await page.locator('#abAbrirPlanejador').click();
    const painel = page.locator('#abPlanejadorPainel');
    await expect(painel).toBeVisible();
    const grade = painel.locator('#abPlanGrade .ab-plan-c');
    expect(await grade.count()).toBeGreaterThan(10);
    await grade.nth(0).click();
    await grade.nth(5).click();
    await expect(painel.locator('.ab-plan-escolhidos .ab-plan-c')).toHaveCount(2);
    await expect(painel.locator('.ab-plan-conta')).toHaveText('2/10');
    await painel.locator('#abPlanNome').fill('Meu time');
    await painel.locator('#abPlanSalvar').click();
    await painel.locator('#abPlanAtivo').click();
    await expect(painel.locator('#abPlanAtivo')).toHaveAttribute('aria-pressed', 'true');
    const salvo = await lerStorage<{ planos: { nome: string; campeoes: string[] }[]; ativo: string | null }>(page, 'pdx-autobatalha-planos');
    expect(salvo?.planos).toHaveLength(1);
    expect(salvo?.planos[0]).toMatchObject({ nome: 'Meu time' });
    expect(salvo?.planos[0]!.campeoes).toHaveLength(2);
    expect(salvo?.ativo).toBeTruthy();

    // busca filtra a grade
    await painel.locator('#abPlanBusca').fill('zzzz-ninguem');
    await expect(grade).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(painel).toBeHidden();
  });
});
