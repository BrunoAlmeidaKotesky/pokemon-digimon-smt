// Franquias personalizadas: grupos de imagens com rótulo, só na sessão, usados no solo e nas salas online.
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { prepare, abrir, aba, mockApis, seedRandom, PNG } from './helpers';

test.use({ reducedMotion: 'reduce' });

const arquivo = (name: string) => ({ name, mimeType: 'image/png', buffer: PNG });

async function criarGrupo(page: Page, scope: string, nome: string, arquivos: string[]) {
  const ed = page.locator(scope);
  await ed.locator('form input').fill(nome);
  await ed.locator('form button[type=submit]').click();
  const grupo = ed.locator('.custom-group').last();
  await expect(grupo.locator('.group-name')).toHaveValue(nome);
  await grupo.locator('input[type=file]').setInputFiles(arquivos.map(arquivo));
  await expect(grupo.locator('.custom-items li')).toHaveCount(arquivos.length);
  return grupo;
}

test.describe('franquias personalizadas no solo', () => {
  test('cria um grupo, rotula as imagens e usa no Duelo; nada fica salvo', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await aba(page, 'Personalizar');
    const grupo = await criarGrupo(page, '#cstEditor', 'Meus gatos', ['gato_preto.png', 'Mimi.png', 'frajola-1.png']);
    await expect.poll(() => grupo.locator('.custom-items input').evaluateAll(els => els.map(e => (e as HTMLInputElement).value))).toEqual(['gato preto', 'Mimi', 'frajola 1']);
    // rótulo novo vale ao sair do campo
    const mimi = grupo.locator('.custom-items input').nth(1);
    await mimi.fill('Mimizinha');
    await mimi.press('Enter');
    await expect(grupo.locator('.custom-items input').nth(1)).toHaveValue('Mimizinha');
    // arrastar e soltar uma imagem também funciona
    await grupo.evaluate((el, bytes) => {
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array(bytes)], 'tom.png', { type: 'image/png' }));
    el.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, [...PNG]);
  await expect(grupo.locator('.custom-items li')).toHaveCount(4);
    await expect(grupo.locator('.custom-items input').nth(3)).toHaveValue('tom');

    // vira franquia nos seletores e no campeonato
    await aba(page, 'Duelo');
    const chave = await page.locator('#duelA option', { hasText: 'Meus gatos' }).getAttribute('value');
    expect(chave).toMatch(/^c-[a-z0-9]+$/);
    await page.selectOption('#duelA', chave!);
    const carta = page.locator('#duelRow .card').nth(0);
    await expect(carta).toHaveAttribute('data-fr', chave!);
    await expect(carta.locator('.fr')).toHaveText('Meus gatos');
    await expect(carta.locator('.name')).toHaveText(/^(gato preto|Mimizinha|frajola 1|tom)$/);
    await expect(carta.locator('img')).toHaveAttribute('src', /^data:image\//);
    // confronto com franquia personalizada não entra no Placar
    await carta.click();
    await expect(carta.locator('.crown')).toHaveText('♛ 1 vitória');
    expect(await page.evaluate(() => localStorage.getItem('pdx-stats'))).toBeNull();
    await aba(page, 'Campeonato');
    await expect(page.locator(`#cup_${chave}`)).toBeChecked();

    // nada das imagens ou dos nomes foi pro localStorage; recarregar apaga tudo
    const salvo = await page.evaluate(() => Object.keys(localStorage).map(k => k + '=' + localStorage.getItem(k)).join('\n'));
    expect(salvo).not.toContain('Meus gatos');
    expect(salvo).not.toContain('data:image');
    expect(salvo).not.toContain(chave!);
    await page.reload();
    await expect(page.locator('#status')).not.toContainText('carregando');
    await expect(page.locator('#duelA option', { hasText: 'Meus gatos' })).toHaveCount(0);
  });

  test('apagar o grupo tira a franquia dos seletores e volta o lado pra primeira franquia', async ({ page }) => {
    await prepare(page);
    await abrir(page);
    await aba(page, 'Personalizar');
    const grupo = await criarGrupo(page, '#cstEditor', 'Times', ['a.png', 'b.png']);
    await aba(page, 'Duelo');
    const chave = (await page.locator('#duelB option', { hasText: 'Times' }).getAttribute('value'))!;
    await page.selectOption('#duelB', chave);
    await expect(page.locator('#duelRow .card').nth(1)).toHaveAttribute('data-fr', chave);
    await aba(page, 'Personalizar');
    await grupo.getByRole('button', { name: 'Apagar grupo' }).click();
    await aba(page, 'Duelo');
    await expect(page.locator('#duelB')).toHaveValue('pokemon');
    await expect(page.locator('#duelRow .card').nth(1)).toHaveAttribute('data-fr', 'pokemon');
  });
});

test.describe('franquias personalizadas numa sala online', () => {
  async function sala(ctx: BrowserContext) {
    await mockApis(ctx);
    await seedRandom(ctx, 5);
    const abrirP = async (n: number, code?: string) => {
      const p = await ctx.newPage();
      await p.goto(`./?transporte=local&jogador=${n}${code ? '&sala=' + code : ''}`);
      await expect(p.locator('#status')).not.toContainText('carregando', { timeout: 15000 });
      return p;
    };
    const host = await abrirP(1);
    await host.locator('nav button', { hasText: 'Online' }).click();
    await host.locator('#onName').fill('Ana');
    await host.locator('#onCreate').click();
    await expect(host.locator('#onRoomCode')).toHaveText(/^[A-Z]{4}$/);
    const code = (await host.locator('#onRoomCode').textContent())!;
    const beto = await abrirP(2, code);
    await beto.locator('#onName').fill('Beto'); await beto.locator('#onJoin').click();
    await expect(host.locator('#onPlayers .chip')).toHaveCount(2);
    return { host, beto };
  }

  test('o host cria no lobby, joga com ela e o convidado vê as imagens; com permissão, o convidado adiciona e renomeia', async ({ context }) => {
    const { host, beto } = await sala(context);
    await criarGrupo(host, '#onCstEditor', 'Amigos', ['carlos.png', 'duda.png']);
    // o convidado recebe o grupo (só pra ver)
    await expect(beto.locator('#onCustoms .custom-group .group-name')).toHaveText('Amigos');
    await expect(beto.locator('#onCustoms .custom-items .nm')).toHaveText(['carlos', 'duda']);
    await expect(beto.locator('#onCustoms input[type=file]')).toHaveCount(0);

    // com permissão, o convidado adiciona uma imagem e muda um rótulo
    await host.locator('#onCustomEdit').check();
    await expect(beto.locator('#onCustoms input[type=file]')).toHaveCount(1);
    await beto.locator('#onCustoms input[type=file]').setInputFiles([arquivo('eva.png')]);
    await expect(host.locator('#onCustoms .custom-items li')).toHaveCount(3);
    const rotulo = beto.locator('#onCustoms .custom-items input').nth(0);
    await rotulo.fill('Carlão');
    await rotulo.press('Enter');
    await expect(host.locator('#onCustoms .custom-items input').nth(0)).toHaveValue('Carlão');

    // vale nos modos: Duelo com o grupo de um lado
    const chave = (await host.locator('#onDuelA option', { hasText: 'Amigos' }).getAttribute('value'))!;
    await host.locator('#onDuelA').selectOption(chave);
    await expect(beto.locator('#onDuelA')).toHaveValue(chave);
    await host.locator('#onStart').click();
    const carta = beto.locator('#onArena .card').nth(0);
    await expect(carta.locator('.fr')).toHaveText('Amigos');
    await expect(carta.locator('.name')).toHaveText(/^(Carlão|duda|eva)$/);
    await expect(carta.locator('img')).toHaveAttribute('src', /^data:image\//);
    await host.locator('#onArena .card').nth(0).click();
    await carta.click();
    await expect(beto.locator('#onResult')).toContainText('venceu com 2 votos');
  });
});
