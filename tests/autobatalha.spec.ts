// Aba Autobatalha: lobby (regras da sala, nome, estilo do tabuleiro e ícone), partida (loja, banco, tabuleiro,
// Pronto, apresentação e luta, próxima rodada, carrossel do 2-1), dica no hover e fixa, itens (equipar e juntar),
// moedas no chão, atalhos, traços, informações, configuração e o planejador de times (pdx-autobatalha-planos).
// O set é o public/autobatalha/set1.json de verdade
// (servido junto com o site); as imagens externas viram o PNG cinza dos mocks. O relógio fica desligado
// (pdx-autobatalha-config) pra rodada só acabar no "Pronto".
import { test, expect, type Locator, type Page } from '@playwright/test';
import { prepare, abrir, aba, lerStorage } from './helpers';

const CONFIG = { relogio: false, segundos: 35, velocidade: 4, dificuldade: 'facil', volume: 0.6 };

/** limite do tabuleiro mostrado agora ("3/4" → 4) */
async function limite(page: Page): Promise<number> {
  return Number((await page.locator('#abLimite b').textContent())!.split('/')[1]);
}

/** Partida nova com o jogador mudado no salvo (ouro, nível, itens, moedas no chão), carregada pela "Continuar". */
async function partidaMexida(page: Page, mudar: Record<string, unknown>) {
  await inicio(page);
  await page.locator('#abNova').click();
  await expect(page.locator('#abPronto')).toBeVisible();
  await page.evaluate(m => {
    const p = JSON.parse(localStorage.getItem('pdx-autobatalha-v1')!) as { voce: string; jogadores: { id: string }[] };
    Object.assign(p.jogadores.find(j => j.id === p.voce)!, m);
    localStorage.setItem('pdx-autobatalha-v1', JSON.stringify(p));
  }, mudar);
  await abrir(page);
  await aba(page, 'Autobatalha');
  await page.locator('#abContinuar').click();
  await expect(page.locator('#abPronto')).toBeVisible();
}

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
    // o limite vem da partida (nível + o que ela der a mais): a tela só mostra
    const lim = await limite(page);
    expect(lim).toBeGreaterThanOrEqual(1);
    await expect(page.locator('#abLimite b')).toHaveText(`1/${lim}`);
    await expect(page.locator('#abTracos .ab-traco').first()).toBeVisible();
    await expect(page.locator('#abOuro')).toHaveText('1');
    await expect(page.locator('#abJuros')).toHaveText('+0 juros');
    await page.locator('#abCartas .ab-carta[data-custo="1"]').first().click();
    await expect(page.locator('#abOuro')).toHaveText('0');
    await expect(noBanco).toHaveCount(1);
    await expect(page.locator('#abCartas .ab-carta.vazia')).toHaveCount(1);

    // tabuleiro → banco e banco → tabuleiro
    await arrastar(page, noTab.first(), page.locator('#abBanco .ab-vaga[data-i="5"]'));
    await expect(noTab).toHaveCount(0);
    await expect(noBanco).toHaveCount(2);
    await expect(page.locator('#abBanco .ab-vaga[data-i="5"] .ab-peca')).toHaveCount(1);
    await expect(page.locator('#abLimite b')).toHaveText(`0/${lim}`);
    await arrastar(page, noBanco.first(), page.locator('#abTabuleiro .ab-casa[data-col="3"][data-lin="1"]'));
    await expect(noTab).toHaveCount(1);
    await expect(noBanco).toHaveCount(1);
    await expect(page.locator('#abLimite b')).toHaveText(`1/${lim}`);
    // a peça fica no centro da casa onde foi solta
    const casa = (await page.locator('#abTabuleiro .ab-casa[data-col="3"][data-lin="1"]').boundingBox())!;
    const peca = (await noTab.first().locator('.ab-foto').boundingBox())!;
    expect(Math.abs(peca.x + peca.width / 2 - (casa.x + casa.width / 2))).toBeLessThan(3);
    expect(Math.abs(peca.y + peca.height / 2 - (casa.y + casa.height / 2))).toBeLessThan(3);

    // Pronto: a apresentação (você VS o adversário) e a luta com os dois lados; pular mostra o placar; depois vem a 1-2
    await page.locator('#abPronto').click();
    await expect(page.locator('#abLuta')).toBeVisible();
    await expect(page.locator('#abClash')).toContainText('VS');
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
    await expect(dica).toContainText('na loja: estrela 1');
    // passando o mouse, só o essencial (alcance sim, a tabela de atributos não); o botão direito mostra tudo
    await expect(dica.locator('.ab-d-alcance')).toBeVisible();
    await expect(dica.locator('.ab-d-at')).toHaveCount(0);
    await expect(dica).toContainText('Botão direito: todos os detalhes');
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
    await expect(dica.locator('.ab-d-alcance')).toBeVisible();
    await expect(dica).not.toHaveClass(/fixa/);
    // clique (sem arrastar) fixa a dica, com todos os detalhes; clique fora solta
    await page.locator('#abTabuleiro .ab-peca').first().click();
    await expect(dica).toHaveClass(/fixa/);
    await expect(dica.locator('.ab-d-at')).toContainText('Alcance');
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

  test('lobby: o anfitrião muda as regras, escolhe nome, tabuleiro e ícone (com filtros) e a partida usa tudo', async ({ page }) => {
    await inicio(page);
    // 8 jogadores: você, o anfitrião, e 7 bots com ícone e tabuleiro
    const lugares = page.locator('#abSala .ab-lugar');
    await expect(lugares).toHaveCount(8);
    await expect(page.locator('#abSala .ab-lugar.bot')).toHaveCount(7);
    await expect(page.locator('#abSala .ab-tag.anfitriao')).toHaveCount(1);
    await expect(page.locator('#abSala .ab-lugar.eu .ab-tag.anfitriao')).toBeVisible();
    await expect(page.locator('#abSala .ab-lugar.bot .ab-mini-tab')).toHaveCount(7);
    await expect(page.locator('#abRegrasNota')).toContainText('Você é o anfitrião');

    // regras da sala: relógio, tempo e dificuldade
    await page.locator('#abRelogio').setChecked(true);
    await page.locator('#abSegundosMais').click();
    await expect(page.locator('#abSegundos')).toHaveValue('36');
    await page.locator('#abDificuldade button', { hasText: 'Difícil' }).click();
    await expect(page.locator('#abSala .ab-lugar.bot').first()).toContainText('Difícil');

    // o seu nome e o seu tabuleiro
    await page.locator('#abNome').fill('Bruno');
    await expect(page.locator('#abSala .ab-lugar.eu .nm')).toHaveText('Bruno');
    await page.locator('#abEstilos [data-estilo-op="deserto"]').click();
    await expect(page.locator('#abEstilos [data-estilo-op="deserto"]')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#abSala .ab-lugar.eu')).toHaveAttribute('data-estilo-lugar', 'deserto');

    // o ícone: grade de todos os personagens, filtrada por origem, custo e nome
    await page.locator('#abIcone').click();
    const janela = page.locator('#abIcones');
    await expect(janela).toBeVisible();
    const grade = janela.locator('#abIconeGrade .ab-icone');
    const total = await grade.count();
    expect(total).toBeGreaterThan(300);
    await janela.locator('#abIconeOrigens [data-origem="pokemon"]').click();
    await expect.poll(() => grade.count()).toBeLessThan(total);
    expect(await grade.evaluateAll(els => els.every(e => e.getAttribute('data-origem') === 'pokemon'))).toBe(true);
    await janela.locator('.ab-chip.custo[data-custo="1"]').click();
    expect(await grade.evaluateAll(els => els.every(e => e.getAttribute('data-custo') === '1'))).toBe(true);
    await janela.locator('#abIconeBusca').fill('zzzz-ninguem');
    await expect(grade).toHaveCount(0);
    await janela.locator('#abIconeBusca').fill('pika');
    await expect(grade.first()).toBeVisible();
    const forma = (await grade.first().getAttribute('data-forma'))!;
    await grade.first().click();
    await expect(janela).toBeHidden();
    await expect(page.locator('#abIconeAtual')).toContainText('Pika');
    const img = (await page.locator('#abSala .ab-lugar.eu .ab-foto img').getAttribute('src'))!;
    expect(img).toBeTruthy();
    const cfg = await lerStorage<Record<string, unknown>>(page, 'pdx-autobatalha-config');
    expect(cfg).toMatchObject({ nome: 'Bruno', avatar: forma, estilo: 'deserto', dificuldade: 'dificil', segundos: 36, relogio: true });

    // a partida: o seu nome e ícone na lista, o seu estilo no tabuleiro, o relógio ligado
    await page.locator('#abNova').click();
    await expect(page.locator('.ab-jogo')).toHaveAttribute('data-estilo', 'deserto');
    await expect(page.locator('.ab-area')).toHaveAttribute('data-estilo', 'deserto');
    await expect(page.locator('#abJogadores .ab-jog.eu .nm')).toContainText('Bruno');
    await expect(page.locator('#abJogadores .ab-jog.eu .ab-foto img')).toHaveAttribute('src', img);
    await expect(page.locator('#abContagem')).toBeVisible();

    // olhar o tabuleiro de um bot mostra o estilo dele
    const salva = await lerStorage<{ dificuldade: string; jogadores: { id: string; estilo: string }[] }>(page, 'pdx-autobatalha-v1');
    expect(salva?.dificuldade).toBe('dificil');
    const pyrus = salva!.jogadores.find(j => j.id === 'pyrus')!;
    await page.locator('#abJogadores .ab-jog[data-jogador="pyrus"]').click();
    await expect(page.locator('.ab-area')).toHaveAttribute('data-estilo', pyrus.estilo);
    await page.locator('#abVoltar').click();

    // a luta (contra monstros na 1-1): você no "VS" com o seu ícone; a metade de cima fica com o seu estilo, no tom "deles"
    await page.locator('#abPronto').click();
    await expect(page.locator('#abClash .lado.eu .ab-foto img')).toHaveAttribute('src', img);
    await expect(page.locator('#abClash .lado.eu')).toContainText('Bruno');
    await expect(page.locator('#abLuta .ab-estilo-deles')).toHaveAttribute('data-estilo', 'deserto');
    await expect(page.locator('#abLuta')).toHaveClass(/mesmo-estilo/);
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

  test('a partida ocupa a janela inteira, abaixo das abas do site', async ({ page }) => {
    await inicio(page);
    await page.locator('#abNova').click();
    const jogo = (await page.locator('.ab-jogo').boundingBox())!;
    const nav = (await page.locator('nav').boundingBox())!;
    expect(jogo.x).toBe(0);
    expect(jogo.width).toBe(1280);
    expect(Math.abs(jogo.y - (nav.y + nav.height))).toBeLessThan(2);
    expect(jogo.y + jogo.height).toBe(800);
    await expect(page.locator('header')).toBeHidden();
    // nada passa da janela: sem barra de rolagem na página
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(800);
    // o tabuleiro usa a largura da área (casas grandes)
    const area = (await page.locator('.ab-palco').boundingBox())!;
    const tab = (await page.locator('#abTabuleiro').boundingBox())!;
    expect(tab.width).toBeGreaterThan(area.width * 0.9);
  });

  test('itens: um componente solto em cima de outro vira o completo; equipa arrastando; moeda no chão recolhe no mouse', async ({ page }) => {
    await partidaMexida(page, { itens: ['pyrus', 'aquos', 'haos+darkus'], moedas: [{ casa: { col: 6, lin: 2 }, valor: 2 }] });
    const itens = page.locator('#abItens .ab-item-solto');
    await expect(itens).toHaveCount(3);
    await arrastar(page, itens.nth(1), itens.nth(0));
    await expect(itens).toHaveCount(2);
    await expect(itens.nth(0)).toHaveAttribute('data-item', 'pyrus+aquos');
    // completo não junta com nada
    await arrastar(page, itens.nth(0), itens.nth(1));
    await expect(itens).toHaveCount(2);
    // equipa na unidade do tabuleiro
    await arrastar(page, itens.nth(0), page.locator('#abTabuleiro .ab-peca').first());
    await expect(itens).toHaveCount(1);
    await expect(page.locator('#abTabuleiro .ab-peca').first().locator('.itens .ab-item')).toHaveCount(1);

    await page.mouse.move(5, 300);
    const ouro = Number(await page.locator('#abOuro').textContent());
    const moeda = page.locator('#abTabuleiro .ab-moeda-chao');
    await expect(moeda).toHaveCount(1);
    await moeda.hover();
    await expect(page.locator('#abOuro')).toHaveText(String(ouro + 2));
    await expect(moeda).toHaveCount(0);
  });

  test('tecla W, traço em foco, campeões do traço e dica fixa com a arte grande', async ({ page }) => {
    await partidaMexida(page, { ouro: 20, nivel: 4 });
    await page.locator('#abCartas .ab-carta[data-campeao]').first().click();
    const banco = page.locator('#abBanco .ab-peca');
    const noTab = page.locator('#abTabuleiro .ab-peca');
    await expect(banco).toHaveCount(1);
    const n = await noTab.count();
    await banco.first().hover();
    await page.keyboard.press('w');
    await expect(noTab).toHaveCount(n + 1);
    await expect(banco).toHaveCount(0);
    await noTab.first().hover();
    await page.keyboard.press('w');
    await expect(banco).toHaveCount(1);
    await expect(noTab).toHaveCount(n);

    // passar o mouse no traço destaca as unidades dele; o botão abre a lista de campeões (os seus marcados)
    const traco = page.locator('#abTracos .ab-traco').first();
    await traco.hover();
    await expect(page.locator('#abTabuleiro.focando .ab-peca.em-foco').first()).toBeVisible();
    await traco.locator('.ab-ver').click();
    const pop = page.locator('#abCampeoesTraco');
    await expect(pop).toBeVisible();
    await expect(pop.locator('.ab-ct-c.tem').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(pop).toBeHidden();

    // botão direito na carta fixa a dica sem comprar; clicar na foto abre a arte grande
    await page.mouse.move(5, 300);
    const ouro = await page.locator('#abOuro').textContent();
    await page.locator('#abCartas .ab-carta[data-campeao]').first().click({ button: 'right' });
    const dica = page.locator('#abDica');
    await expect(dica).toHaveClass(/fixa/);
    await expect(page.locator('#abOuro')).toHaveText(ouro!);
    await dica.locator('.ab-d-foto-btn').click();
    await expect(page.locator('#abImagem')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#abImagem')).toBeHidden();
    await expect(dica).toBeHidden();
  });

  test('informações, configuração (dificuldade e mudo) e a contagem grande do relógio', async ({ page }) => {
    await inicio(page, { 'pdx-autobatalha-config': { ...CONFIG, relogio: true, segundos: 90 } });
    await page.locator('#abNova').click();
    await expect(page.locator('#abContagem b')).toHaveText(/^\d+$/);

    await page.locator('#abInfoBtn').click();
    const info = page.locator('#abInfo');
    await expect(info).toBeVisible();
    await expect(info.locator('.ab-info-traco').first()).toBeVisible();
    await info.locator('[data-aba="bakugan"]').click();
    await expect(info.locator('#abInfoReceitas td[data-item]')).toHaveCount(49);
    await info.locator('[data-aba="loja"]').click();
    expect(await info.locator('#abInfoChances tr[data-nivel]').count()).toBeGreaterThanOrEqual(10);
    await expect(info.locator('#abInfoChances tr.eu')).toHaveAttribute('data-nivel', '1');
    await info.locator('#abInfoFechar').click();
    await expect(info).toBeHidden();

    await page.locator('#abConfigBtn').click();
    await expect(page.locator('#abConfig')).toBeVisible();
    await page.locator('#abDificuldade button', { hasText: 'Difícil' }).click();
    await page.locator('#abConfigFechar').click();
    await page.locator('#abMudo').click();
    const cfg = await lerStorage<{ dificuldade: string; volume: number }>(page, 'pdx-autobatalha-config');
    expect(cfg).toMatchObject({ dificuldade: 'dificil', volume: 0 });
    await page.locator('#abMudo').click();
    expect((await lerStorage<{ volume: number }>(page, 'pdx-autobatalha-config'))?.volume).toBeGreaterThan(0);

    // a apresentação some sozinha e a luta corre
    await page.locator('#abPronto').click();
    await expect(page.locator('#abClash')).toBeVisible();
    await expect(page.locator('#abClash')).toBeHidden({ timeout: 4000 });
    await expect(page.locator('#abLuta')).toBeVisible();
  });
});
