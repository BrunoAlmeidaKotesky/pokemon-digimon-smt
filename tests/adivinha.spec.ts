// Aba Adivinha, sozinho: desafio do dia (determinístico pela data em Brasília) e livre, nos submodos Clássico,
// Imagem e Emoji; autocompletar, pistas, estatísticas em pdx-adivinha-v1 e os filtros (Pokémon só espécies).
import { test, expect, type Page } from '@playwright/test';
import { abrir, fixture, lerStorage, prepare, type MockOpts } from './helpers';
import { indiceDoDia } from '../src/adivinha/dia';

test.use({ reducedMotion: 'reduce' });

// 21/11/2026, 15:30 em Brasília: faltam 8h30 pro próximo desafio
const AGORA = new Date('2026-11-21T15:30:00-03:00');
const HOJE = '2026-11-21';
type Info = Record<string, string | number | string[]>;
const LOL = fixture<{ itens: Record<string, Info> }>('adivinha-catalogo-lol.json').itens;
const porNome = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const NOMES_LOL = Object.keys(LOL).sort(porNome);
const doDia = (sub: string) => NOMES_LOL[indiceDoDia(HOJE, 'lol', sub, NOMES_LOL.length)]!;

async function inicio(page: Page, opts: MockOpts & { seed?: number; storage?: Record<string, unknown> } = {}, path = './?aba=adivinha') {
  await page.clock.setFixedTime(AGORA);
  await prepare(page, { adivinha: true, ...opts });
  await abrir(page, path);
  await expect(page.locator('#adivinha')).toBeVisible();
}
const chip = (page: Page, g: string) => page.locator(`#advGrupos [data-grupo="${g}"]`);
const sub = (page: Page, s: 'classico' | 'imagem' | 'emoji') => page.locator(`#advSubmodo button[data-n="${s}"]`);
const rodada = (page: Page, r: 'dia' | 'livre') => page.locator(`#advRodada button[data-n="${r}"]`);
const sugestoes = async (page: Page) => (await page.locator('#advChuteLista li .nm').allTextContents()).map(s => s.trim());
/** Digita e escolhe a primeira sugestão com Enter. */
async function chutar(page: Page, nome: string) {
  await page.locator('#advChute').fill(nome);
  await expect(page.locator('#advChuteLista li').first()).toHaveAttribute('data-nome', nome);
  await page.locator('#advChute').press('Enter');
}
const linhas = (page: Page) => page.locator('#advTabela tbody tr');

test.describe('Adivinha sozinho', () => {
  test('link direto; Clássico do dia: autocompletar, pistas, acertar, estatísticas salvas e o mesmo desafio depois de recarregar', async ({ page }) => {
    await inicio(page);
    await expect(page.locator('nav button.on')).toHaveText('Adivinha');
    await expect(chip(page, 'lol')).toHaveAttribute('aria-checked', 'true');
    await expect(sub(page, 'classico')).toHaveAttribute('aria-checked', 'true');
    await expect(rodada(page, 'dia')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#advTitulo')).toHaveText('Desafio do dia');
    await expect(page.locator('#advJogo .adv-cab .mute').first()).toContainText('21/11/2026');
    await expect(page.locator('#advChute')).toBeFocused();

    // autocompletar: sem diferenciar maiúscula, começa-com primeiro, com miniatura
    await page.locator('#advChute').fill('AK');
    expect(await sugestoes(page)).toEqual(['Akali', 'Akshan']);
    await expect(page.locator('#advChuteLista li').first().locator('.adv-th img')).toHaveCount(1);
    await page.locator('#advChute').fill('sol');
    expect(await sugestoes(page)).toEqual(['Aurelion Sol']);
    await page.locator('#advChute').fill('xyz');
    await expect(page.locator('#advChuteNada')).toBeVisible();

    const alvo = doDia('classico');
    const errados = NOMES_LOL.filter(n => n !== alvo).slice(0, 2);
    await chutar(page, errados[0]!);
    await expect(linhas(page)).toHaveCount(1);
    // setas pra cima/pra baixo leva até o secreto na dificuldade
    const dif = (n: string) => LOL[n]!.dificuldade as number;
    const celDif = linhas(page).first().locator('td').nth(6);
    if (dif(errados[0]!) === dif(alvo)) await expect(celDif).toHaveAttribute('data-cor', 'certo');
    else await expect(celDif.locator('.adv-seta')).toHaveText(dif(errados[0]!) < dif(alvo) ? '▲' : '▼');
    await expect(linhas(page).first().locator('td.adv-c')).toHaveCount(6);
    await expect(page.locator('#advLegenda')).toBeVisible();
    // quem já foi chutado sai do autocompletar
    await page.locator('#advChute').fill(errados[0]!);
    expect(await sugestoes(page)).not.toContain(errados[0]);

    // setas do teclado escolhem a sugestão
    await page.locator('#advChute').fill(alvo.slice(0, 1));
    const lista = await sugestoes(page);
    const pos = lista.indexOf(errados[1]!);
    if (pos >= 0) {
      for (let i = 0; i < pos; i++) await page.locator('#advChute').press('ArrowDown');
      await page.locator('#advChute').press('Enter');
    } else await chutar(page, errados[1]!);
    await expect(linhas(page)).toHaveCount(2);
    await expect(linhas(page).first()).toHaveAttribute('data-nome', errados[1]!);

    await chutar(page, alvo);
    await expect(linhas(page)).toHaveCount(3);
    await expect(linhas(page).first()).toHaveClass(/certo/);
    await expect(linhas(page).first().locator('td.adv-c[data-cor="certo"]')).toHaveCount(6);
    await expect(page.locator('#advFim h3')).toHaveText('Acertou em 3 chutes!');
    await expect(page.locator('#advFim .card .name')).toHaveText(alvo);
    await expect(page.locator('#advRelogio')).toHaveText('08:30:00');
    await expect(page.locator('#advChute')).toHaveCount(0);
    await expect(page.locator('#advStats [data-n="seq"]')).toHaveText('1');
    await expect(page.locator('#advStats [data-n="jogos"]')).toHaveText('1');
    await expect(page.locator('#advStats [data-n="media"]')).toHaveText('3');

    expect(await lerStorage(page, 'pdx-adivinha-v1')).toEqual({
      dia: { 'lol:classico': { data: HOJE, alvo, chutes: [errados[0], errados[1], alvo], acertou: true } },
      stats: { 'lol:classico': { jogos: 1, chutes: 3, seq: 1, melhor: 1, ultimo: HOJE } },
      // a escolha da tela só é guardada quando muda
      cfg: null,
    });
    // o Adivinha não mexe no placar nem no saco de sorteio
    expect(await lerStorage(page, 'pdx-stats')).toBeNull();

    // recarregar: o desafio continua resolvido, com os chutes
    await page.reload();
    await expect(page.locator('#status')).not.toContainText('carregando', { timeout: 15000 });
    await expect(page.locator('#advFim h3')).toHaveText('Acertou em 3 chutes!');
    await expect(linhas(page)).toHaveCount(3);
  });

  test('sequência de dias: ontem resolvido conta; o Imagem do dia tem o próprio personagem', async ({ page }) => {
    await inicio(page, { storage: { 'pdx-adivinha-v1': { dia: {}, stats: { 'lol:classico': { jogos: 4, chutes: 20, seq: 2, melhor: 5, ultimo: '2026-11-20' } }, cfg: null } } });
    await expect(page.locator('#advStats [data-n="seq"]')).toHaveText('2');
    await expect(page.locator('#advStats [data-n="melhor"]')).toHaveText('5');
    await expect(page.locator('#advStats [data-n="media"]')).toHaveText('5');
    await chutar(page, doDia('classico'));
    await expect(page.locator('#advStats [data-n="seq"]')).toHaveText('3');
    await expect(page.locator('#advStats [data-n="media"]')).toHaveText('4,2');

    await sub(page, 'imagem').click();
    await expect(page.locator('#advStats [data-n="jogos"]')).toHaveText('0');
    await chutar(page, doDia('imagem'));
    await expect(page.locator('#advFim .card .name')).toHaveText(doDia('imagem'));
  });

  test('Imagem: zoom e desfoque diminuem a cada erro; no livre, desistir mostra quem era e o próximo começa de novo', async ({ page }) => {
    await inicio(page);
    await sub(page, 'imagem').click();
    const img = page.locator('#advImagem img');
    await expect(page.locator('#advImagem')).toHaveAttribute('data-nivel', '0');
    await expect(img).toHaveAttribute('style', /scale\(6\)/);
    await expect(img).toHaveAttribute('style', /blur\(/);
    await expect(img).toHaveAttribute('alt', '');
    const alvo = doDia('imagem');
    const errados = NOMES_LOL.filter(n => n !== alvo);
    await chutar(page, errados[0]!);
    await expect(page.locator('#advImagem')).toHaveAttribute('data-nivel', '1');
    await expect(img).toHaveAttribute('style', /scale\(4\.6\)/);
    await expect(page.locator('#advErrados li')).toHaveCount(1);
    await expect(page.locator('#advErrados li').first()).toHaveAttribute('data-nome', errados[0]!);

    await rodada(page, 'livre').click();
    await expect(page.locator('#advTitulo')).toHaveText('Livre');
    await expect(page.locator('#advImagem')).toHaveAttribute('data-nivel', '0');
    await page.locator('#advDesistir').click();
    await expect(page.locator('#advFim h3')).toHaveText('Era este personagem:');
    await expect(img).toHaveAttribute('style', /scale\(1\)/);
    await expect(img).toHaveAttribute('style', /filter: none/);
    const primeiro = (await page.locator('#advFim .card .name').textContent())!.trim();
    await page.locator('#advProximo').click();
    await expect(page.locator('#advImagem')).toHaveAttribute('data-nivel', '0');
    await expect(page.locator('#advChute')).toBeVisible();
    await page.locator('#advDesistir').click();
    expect((await page.locator('#advFim .card .name').textContent())!.trim()).not.toBe(primeiro);
    // voltar pro do dia: o desafio de hoje continua com o chute errado
    await rodada(page, 'dia').click();
    await expect(page.locator('#advImagem')).toHaveAttribute('data-nivel', '1');
  });

  test('Emoji: 1 emoji no começo e mais 1 a cada erro; franquia sem arquivo de emojis fica desligada, com aviso', async ({ page }) => {
    await inicio(page);
    await sub(page, 'emoji').click();
    const emojis = fixture<Record<string, string>>('adivinha-emoji-lol.json');
    const alvo = doDia('emoji');
    await expect(page.locator('#advEmoji .vis')).toHaveCount(1);
    const total = await page.locator('#advEmoji span').count();
    expect(total).toBeGreaterThanOrEqual(3);
    expect(emojis[alvo]!.startsWith((await page.locator('#advEmoji .vis').first().textContent())!)).toBe(true);
    await chutar(page, NOMES_LOL.find(n => n !== alvo)!);
    await expect(page.locator('#advEmoji .vis')).toHaveCount(2);
    await chutar(page, alvo);
    await expect(page.locator('#advEmoji .vis')).toHaveCount(total);
    await expect(page.locator('#advEmoji .oculto')).toHaveCount(0);

    // Deadlock não tem arquivo de emojis (nos testes): o Emoji fica desligado
    await chip(page, 'deadlock').click();
    await expect(page.locator('#advAviso')).toContainText('Deadlock ainda não tem os emojis prontos');
    await expect(page.locator('#advChute')).toHaveCount(0);
    // os outros modos de Deadlock funcionam (catálogo da fixture)
    await sub(page, 'classico').click();
    await expect(page.locator('#advChute')).toBeVisible();
    await page.locator('#advChute').fill('inf');
    expect(await sugestoes(page)).toEqual(['Infernus']);
  });

  test('Pokémon só com as espécies (sem Mega, Gigantamax nem formas, em todos os modos); SMT + Persona juntos', async ({ page }) => {
    await inicio(page, { pokemonFormas: true });
    await expect(page.locator('#status')).toContainText('Pokémon: 47');
    await chip(page, 'pokemon').click();
    await page.locator('#advChute').fill('char');
    expect(await sugestoes(page)).toEqual(['Charizard', 'Charmander', 'Charmeleon']);
    await page.locator('#advChute').fill('raichu');
    expect(await sugestoes(page)).toEqual(['Raichu']);
    await sub(page, 'imagem').click();
    await page.locator('#advChute').fill('mega');
    await expect(page.locator('#advChuteNada')).toBeVisible();
    await page.locator('#advChute').fill('Gigantamax');
    await expect(page.locator('#advChuteNada')).toBeVisible();

    // SMT + Persona: as duas listas no mesmo jogo, com a franquia na sugestão
    await sub(page, 'classico').click();
    await chip(page, 'megaten').click();
    await page.locator('#advChute').fill('jack fr');
    await expect(page.locator('#advChuteLista li').first()).toHaveAttribute('data-nome', 'Jack Frost');
    await expect(page.locator('#advChuteLista li').first().locator('.fr')).toHaveText('SMT');
    await page.locator('#advChute').fill('arsen');
    await expect(page.locator('#advChuteLista li').first().locator('.fr')).toHaveText('Persona');
    await page.locator('#advChute').press('Enter');
    await expect(linhas(page)).toHaveCount(1);
    await expect(page.locator('#advTabela thead th')).toHaveText(['Personagem', 'Jogo', 'Raça', 'Arcana', 'Mitologia', 'Nível', 'Fraqueza']);
    // Persona não tem raça: aparece "Persona"
    await expect(linhas(page).first().locator('td').nth(2)).toContainText('Persona');
  });
});
