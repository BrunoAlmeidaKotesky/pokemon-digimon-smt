// Autobatalha online: várias abas do mesmo navegador como pessoas diferentes, com o transporte local
// (?transporte=local&jogador=N, BroadcastChannel, sem rede). O anfitrião cria a sala, os convidados entram pelo link
// (?autobatalha=ABCD), escolhem ícone e tabuleiro, todos compram e posicionam, votam pronto, a luta aparece em todas
// as abas, o carrossel com dois humanos, e quem fecha a aba volta pro mesmo lugar (um bot joga enquanto isso).
// O relógio fica desligado (a rodada só acaba quando todos votam) e a luta é pulada.
import { test, expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { mockApis, presetStorage, seedRandom } from './helpers';

test.use({ reducedMotion: 'reduce' });

const CONFIG = { relogio: false, segundos: 35, velocidade: 4, dificuldade: 'facil', volume: 0 };
const NOMES = ['Bia', 'Ana', 'Caio'];

async function preparar(ctx: BrowserContext) {
  await mockApis(ctx);
  await seedRandom(ctx, 7);
  // a configuração de cada aba (o ?jogador=N separa a chave nos testes)
  await presetStorage(ctx, Object.fromEntries(NOMES.map((nome, i) => [`pdx-autobatalha-config-${i + 1}`, { ...CONFIG, nome }])));
}

/** Aba do jogador n; com `codigo`, abre o link da sala. */
async function abrirAba(ctx: BrowserContext, n: number, codigo?: string): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`./?transporte=local&jogador=${n}&${codigo ? `autobatalha=${codigo}` : 'aba=autobatalha'}`);
  await expect(page.locator('nav button.on')).toHaveText('Autobatalha');
  return page;
}

/** O anfitrião (Bia) cria a sala; devolve a aba e o código. */
async function criarSala(ctx: BrowserContext): Promise<{ host: Page; codigo: string }> {
  await preparar(ctx);
  const host = await abrirAba(ctx, 1);
  await expect(host.locator('#abJogarAmigos')).toBeEnabled({ timeout: 15000 });
  await host.locator('#abJogarAmigos').click();
  await expect(host.locator('#abSalaCodigo')).toHaveText(/^[A-Z]{4}$/);
  const codigo = (await host.locator('#abSalaCodigo').textContent())!;
  await expect(host.locator('#abSalaLink')).toHaveValue(new RegExp(`autobatalha=${codigo}`));
  return { host, codigo };
}

async function entrar(ctx: BrowserContext, n: number, codigo: string): Promise<Page> {
  const page = await abrirAba(ctx, n, codigo);
  await expect(page.locator('#abLobby')).toHaveAttribute('data-online', 'convidado', { timeout: 15000 });
  await expect(page.locator(`#abSala .ab-lugar.eu[data-jogador="h${n}"]`)).toBeVisible({ timeout: 15000 });
  return page;
}

/** arrasta com o mouse (pointer events) de um elemento pro centro de outro */
async function arrastar(page: Page, de: Locator, para: Locator) {
  // o mouse só arrasta na aba da frente
  await page.bringToFront();
  await de.hover();
  await page.mouse.down();
  const b = (await para.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
  await page.mouse.up();
}

const rodada = (p: Page, r: string) => expect(p.locator('#abRodada')).toHaveAttribute('data-rodada', r, { timeout: 15000 });

/** Todos votam pronto e pulam a luta; espera a próxima rodada. As abas andam juntas (a luta tem limite de tempo). */
async function jogarRodada(abas: Page[], proxima: string) {
  for (const p of abas) await p.locator('#abPronto').click();
  await Promise.all(abas.map(async p => {
    await expect(p.locator('#abLuta')).toBeVisible({ timeout: 15000 });
    await p.locator('#abPular').click();
  }));
  await Promise.all(abas.map(p => rodada(p, proxima)));
}

test.describe('Autobatalha online (transporte local)', () => {
  test('sala com 3 pessoas: lobby, compra e posição, voto de pronto, luta em todas as abas, quem fecha volta', async ({ context }) => {
    test.setTimeout(120_000);
    const { host, codigo } = await criarSala(context);
    const ana = await entrar(context, 2, codigo);
    const caio = await entrar(context, 3, codigo);
    const todos = [host, ana, caio];

    // lobby: todos veem os 3 humanos e 5 bots; o anfitrião com a coroa
    for (const p of todos) {
      await expect(p.locator('#abSala .ab-lugar')).toHaveCount(8);
      await expect(p.locator('#abSala .ab-lugar:not(.bot)')).toHaveCount(3);
      await expect(p.locator('#abSala .ab-lugar[data-jogador="h1"] .ab-tag.anfitriao')).toBeVisible();
      await expect(p.locator('#abSala .ab-lugar[data-nome="Ana"]')).toBeVisible();
    }
    // só o anfitrião muda as regras e começa
    await expect(ana.locator('#abRelogio')).toBeDisabled();
    await expect(ana.locator('#abNova')).toHaveCount(0);
    await expect(ana.locator('#abEsperando')).toContainText('Esperando o anfitrião');
    await expect(host.locator('#abNova')).toContainText('3 pessoas');
    // o convidado escolhe o tabuleiro e o ícone: todo mundo vê
    await ana.locator('[data-estilo-op="neve"]').click();
    await expect(host.locator('#abSala .ab-lugar[data-jogador="h2"]')).toHaveAttribute('data-estilo-lugar', 'neve');
    await expect(caio.locator('#abSala .ab-lugar[data-jogador="h2"]')).toHaveAttribute('data-estilo-lugar', 'neve');
    const imgAna = (p: Page) => p.locator('#abSala .ab-lugar[data-jogador="h2"] img').first();
    const sorteado = (await imgAna(ana).getAttribute('src'))!;
    await ana.locator('#abIcone').click();
    await ana.locator('#abIconeGrade .ab-icone').nth(3).click();
    await expect(ana.locator('#abIconeAtual b')).not.toHaveText('sorteado a cada partida');
    // a escolha vai pro anfitrião, que manda a sala de volta pra todos
    await expect(imgAna(ana)).not.toHaveAttribute('src', sorteado);
    const escolhido = (await imgAna(ana).getAttribute('src'))!;
    await expect(imgAna(host)).toHaveAttribute('src', escolhido);
    await expect(imgAna(caio)).toHaveAttribute('src', escolhido);
    // o anfitrião vê o "Tirar" nos convidados, não em si
    await expect(host.locator('#abSala [data-tirar]')).toHaveCount(2);
    await expect(ana.locator('#abSala [data-tirar]')).toHaveCount(0);

    // começa: todos na 1-1, cada um com a própria loja
    await host.locator('#abNova').click();
    for (const p of todos) {
      await rodada(p, '1-1');
      await expect(p.locator('#abJogadores .ab-jog')).toHaveCount(8);
      await expect(p.locator('#abJogadores .ab-jog.eu')).toHaveCount(1);
      await expect(p.locator('#abCartas .ab-carta[data-campeao]')).toHaveCount(7);
      await expect(p.locator('#abSalaTopo')).toContainText(codigo);
    }
    await expect(ana.locator('#abJogadores .ab-jog.eu')).toHaveAttribute('data-jogador', 'h2');

    // a Ana compra uma carta de custo 1 e põe no tabuleiro
    await ana.locator('#abCartas .ab-carta[data-custo="1"]').first().click();
    await expect(ana.locator('#abOuro')).toHaveText('0');
    await expect(ana.locator('#abBanco .ab-peca')).toHaveCount(1);
    await arrastar(ana, ana.locator('#abBanco .ab-peca').first(), ana.locator('#abTabuleiro .ab-casa[data-col="2"][data-lin="0"]'));
    await expect(ana.locator('#abTabuleiro .ab-peca')).toHaveCount(2);
    // o Caio olha o tabuleiro da Ana: as duas peças
    await caio.locator('#abJogadores .ab-jog[data-jogador="h2"]').click();
    await expect(caio.locator('.ab-olhando')).toContainText('Ana');
    await expect(caio.locator('#abTabuleiro .ab-peca')).toHaveCount(2);
    await caio.locator('#abVoltar').click();
    // o anfitrião também compra
    await host.locator('#abCartas .ab-carta[data-custo="1"]').first().click();
    await expect(host.locator('#abBanco .ab-peca')).toHaveCount(1);

    // voto de pronto: a luta só começa quando os três votam
    await host.locator('#abPronto').click();
    await ana.locator('#abPronto').click();
    await expect(caio.locator('#abVotos b')).toHaveText('7/8');
    await expect(ana.locator('#abPronto')).toHaveClass(/\bon\b/);
    await expect(caio.locator('.ab-jogo')).toHaveAttribute('data-fase', 'planejamento');
    await caio.locator('#abPronto').click();
    // a luta aparece nas três abas, cada uma com a sua (os dois lados); a da Ana com as duas peças dela embaixo
    await Promise.all(todos.map(async p => {
      await expect(p.locator('#abLuta')).toBeVisible({ timeout: 15000 });
      await expect(p.locator('#abLuta .ab-peca[data-lado="a"]').first()).toBeVisible();
      await expect(p.locator('#abLuta .ab-peca[data-lado="b"]').first()).toBeVisible();
    }));
    await expect(ana.locator('#abLuta .ab-peca[data-lado="a"]')).toHaveCount(2);
    // quem pula vê o placar e espera os outros; a rodada segue quando todos viram
    await host.locator('#abPular').click();
    await expect(host.locator('#abPlacar')).toBeVisible();
    await Promise.all([ana, caio].map(p => p.locator('#abPular').click()));
    await Promise.all(todos.map(p => rodada(p, '1-2')));

    // a Ana fecha a aba: fica fora do ar (um bot joga por ela) e a partida segue
    await ana.close();
    await expect(host.locator('#abJogadores .ab-jog[data-jogador="h2"]')).toHaveClass(/ausente/, { timeout: 15000 });
    await expect(caio.locator('#abJogadores .ab-jog[data-jogador="h2"] .ab-tag.ausente')).toBeVisible();
    await jogarRodada([host, caio], '1-3');
    // volta pelo link no mesmo aparelho: o mesmo lugar, na rodada certa
    const volta = await abrirAba(context, 2, codigo);
    await rodada(volta, '1-3');
    await expect(volta.locator('#abJogadores .ab-jog.eu')).toHaveAttribute('data-jogador', 'h2');
    await expect(host.locator('#abJogadores .ab-jog[data-jogador="h2"]')).not.toHaveClass(/ausente/);
    await expect(volta.locator('#abVotos b')).toHaveText('5/8');
  });

  test('carrossel com dois humanos: cada um pega na sua vez e as duas abas veem quem pegou o quê', async ({ context }) => {
    test.setTimeout(150_000);
    const { host, codigo } = await criarSala(context);
    const ana = await entrar(context, 2, codigo);
    await host.locator('#abNova').click();
    await rodada(ana, '1-1');
    await jogarRodada([host, ana], '1-2');
    await jogarRodada([host, ana], '1-3');
    await jogarRodada([host, ana], '2-1');
    for (const p of [host, ana]) {
      await expect(p.locator('#abCarrossel')).toBeVisible({ timeout: 15000 });
      await expect(p.locator('#abCarrossel .ab-car-op')).toHaveCount(9);
      await expect(p.locator('#abCarOrdem .ab-car-jog')).toHaveCount(8);
    }
    for (const [p, id] of [[host, 'h1'], [ana, 'h2']] as const) {
      const car = p.locator('#abCarrossel');
      await expect(car).toHaveClass(/\bpode\b/, { timeout: 30000 });
      await car.locator('.ab-car-op.pode').first().click();
      await expect(car.locator(`.ab-car-op[data-pegou="${id}"]`)).toHaveCount(1);
    }
    // cada aba vê as duas escolhas
    for (const p of [host, ana]) {
      await expect(p.locator('#abCarrossel .ab-car-op[data-pegou="h1"]')).toHaveCount(1);
      await expect(p.locator('#abCarrossel .ab-car-op[data-pegou="h2"]')).toHaveCount(1);
    }
    for (const p of [host, ana]) {
      await expect(p.locator('.ab-jogo')).toHaveAttribute('data-fase', 'planejamento', { timeout: 30000 });
      await expect(p.locator('#abPronto')).toBeVisible();
    }
  });

  test('o anfitrião tira um convidado do lobby; fechar a sala avisa quem ficou', async ({ context }) => {
    const { host, codigo } = await criarSala(context);
    const ana = await entrar(context, 2, codigo);
    const caio = await entrar(context, 3, codigo);
    const tirar = host.locator('#abSala [data-tirar="h3"]');
    await tirar.click();
    await expect(tirar).toHaveText('Tirar mesmo?');
    await tirar.click();
    await expect(caio.locator('#abSalaEncerrada')).toContainText('tirou você');
    await expect(host.locator('#abSala .ab-lugar:not(.bot)')).toHaveCount(2);
    await expect(ana.locator('#abSala .ab-lugar:not(.bot)')).toHaveCount(2);
    // "Voltar pro jogo sozinho": o Caio volta pro lobby solo
    await caio.locator('#abSalaVoltar').click();
    await expect(caio.locator('#abLobby')).not.toHaveAttribute('data-online', /.+/);
    await expect(caio.locator('#abJogarAmigos')).toBeVisible();
    expect(caio.url()).not.toContain('autobatalha=');

    // o anfitrião fecha a sala
    await host.locator('#abFecharSala').click();
    await host.locator('#abFecharSala').click();
    await expect(ana.locator('#abSalaEncerrada')).toContainText('O anfitrião fechou a sala');
    await expect(host.locator('#abJogarAmigos')).toBeVisible();
  });

  test('anfitrião fecha a página no meio da partida: o convidado vê que a sala acabou', async ({ context }) => {
    const { host, codigo } = await criarSala(context);
    const ana = await entrar(context, 2, codigo);
    await host.locator('#abNova').click();
    await rodada(ana, '1-1');
    await host.close();
    await expect(ana.locator('#abSalaEncerrada')).toContainText('A sala acabou', { timeout: 15000 });
    await expect(ana.locator('#abSalaMotivo')).toContainText('anfitrião');
  });

  test('link de sala que não existe: aviso e volta pro solo', async ({ context }) => {
    await preparar(context);
    const p = await abrirAba(context, 2, 'ZZZZ');
    await expect(p.locator('#abSalaEncerrada')).toContainText('Não achei a sala ZZZZ', { timeout: 15000 });
    await p.locator('#abSalaVoltar').click();
    await expect(p.locator('#abNova')).toBeEnabled();
  });
});
