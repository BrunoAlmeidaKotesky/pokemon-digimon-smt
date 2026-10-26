// Aba Catálogo: lista de cada franquia com as informações da fonte (public/catalogo/<chave>.json, aqui as fixtures
// catalogo-<chave>.json), marcações do Set 1 salvas em pdx-set1, filtros, exportar, copiar e importar.
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { prepare, abrir, aba, lerStorage, type MockOpts } from './helpers';

test.use({ reducedMotion: 'reduce' });

type Marcas = Record<string, string[]>;
const linha = (page: Page, nome: string) => page.locator(`#catList .cat-row[data-nome="${nome}"]`);
const caixa = (page: Page, nome: string) => linha(page, nome).locator('input[type=checkbox]');
const chip = (page: Page, k: string) => page.locator(`#catFr .cat-fr[data-fr="${k}"]`);
const nomes = async (page: Page) => (await page.locator('#catList .cat-row .nm').allTextContents()).map(s => s.trim());
const marcas = (page: Page) => lerStorage<Marcas>(page, 'pdx-set1');
const opcoes = (page: Page, id: string) => page.locator(`#catCampo_${id} option`).allTextContents();
const FOGO = ['Charmander', 'Charmeleon', 'Charizard', 'Vulpix', 'Ninetales'];
const FRANQUIAS = ['Pokémon', 'Digimon', 'SMT', 'Persona', 'JoJo', 'Yu-Gi-Oh!', 'Bakugan', 'LoL', 'Overwatch', 'Deadlock', 'Final Fantasy', 'Sujimon'];

/** Escolhe um valor no filtro de um campo (no celular os seletores ficam recolhidos atrás de um botão). */
async function campo(page: Page, id: string, valor: string) {
  const btn = page.locator('#catCamposBtn');
  if (await btn.isVisible() && (await btn.getAttribute('aria-expanded')) === 'false') await btn.click();
  await page.selectOption(`#catCampo_${id}`, valor);
}

/** Abre o site com tudo carregado e vai pra aba Catálogo. */
async function inicio(page: Page, opts: MockOpts & { storage?: Record<string, unknown> } = {}) {
  const calls = await prepare(page, opts);
  await abrir(page);
  await aba(page, 'Catálogo');
  await expect(page.locator('section#catalog')).toBeVisible();
  return calls;
}

test.describe('catálogo do Set 1', () => {
  test('aba depois de Personalizar; uma subaba por franquia; Pokémon com as informações da fonte e a imagem', async ({ page }) => {
    const calls = await prepare(page);
    await abrir(page);
    // o catálogo só é baixado quando a aba abre
    expect(calls.catalogo).toBeUndefined();
    await expect(page.locator('nav button')).toHaveText(['Duelo', 'Trio', 'Quarteto', 'Campeonato', 'Ranking', 'Placar', 'Personalizar', 'Catálogo', 'Online']);
    await aba(page, 'Catálogo');
    await expect(page.locator('nav button.on')).toHaveText('Catálogo');
    await expect(page.locator('section#catalog')).toBeVisible();
    for (const s of ['duel', 'trio', 'quartet', 'cup', 'rank', 'stats', 'customs', 'online']) await expect(page.locator(`section#${s}`)).toBeHidden();

    await expect(page.locator('#catFr .cat-fr')).toHaveText(FRANQUIAS.map(f => `${f} · 0`));
    await expect(chip(page, 'pokemon')).toHaveAttribute('aria-selected', 'true');
    await expect(chip(page, 'lol')).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#catTotal')).toHaveText('Nada marcado ainda');
    await expect(page.locator('#catExport')).toBeDisabled();
    await expect(page.locator('#catCopy')).toBeDisabled();

    await expect(page.locator('#catFonte')).toHaveText('Informações: PokeAPI (GraphQL) (gerado em 25/10/2026) · 11 de 40 com informação');
    await expect(page.locator('#catCount')).toHaveText('40 de 40');
    await expect(page.locator('#catList .cat-row')).toHaveCount(40);
    await expect(page.locator('#catMais')).toHaveCount(0);
    expect((await nomes(page)).slice(0, 4)).toEqual(['Bulbasaur', 'Ivysaur', 'Venusaur', 'Charmander']);
    await expect(linha(page, 'Bulbasaur').locator('.campos')).toHaveText('Tipo: Grass, Poison · Geração: I · Habitat: grassland');
    await expect(linha(page, 'Vulpix').locator('.campos')).toHaveText('Tipo: Fire · Geração: I');
    await expect(linha(page, 'Wartortle').locator('.campos')).toHaveText('Sem informação da fonte');
    // quem só está no catálogo (Mew) não aparece: a lista do site manda
    await expect(linha(page, 'Mew')).toHaveCount(0);
    const img = linha(page, 'Bulbasaur').locator('.th img');
    await expect(img).toHaveAttribute('src', /official-artwork\/1\.png$/);
    await expect(img).toHaveAttribute('loading', 'lazy');
    await expect(caixa(page, 'Bulbasaur')).not.toBeChecked();

    // um seletor por campo, com os valores e quantos têm cada um
    expect(await opcoes(page, 'tipo')).toEqual(['Todos', 'Electric (1)', 'Fire (5)', 'Flying (2)', 'Grass (3)', 'Normal (1)', 'Poison (3)', 'Water (1)', 'Sem informação (29)']);
    expect(await opcoes(page, 'geracao')).toEqual(['Todos', 'I (11)', 'Sem informação (29)']);
    await expect(page.locator('.cat-filters select')).toHaveCount(3);
    expect(calls.catalogo).toBe(1);
  });

  test('filtra por campo (lista: basta um dos valores) e pela busca; contagem "N de M"; limpar filtros', async ({ page }) => {
    await inicio(page);
    await campo(page, 'tipo', 'Fire');
    await expect(page.locator('#catCount')).toHaveText('5 de 40');
    expect(await nomes(page)).toEqual(FOGO);
    // a contagem dos outros campos acompanha o filtro
    expect(await opcoes(page, 'habitat')).toEqual(['Todos', 'mountain (3)', 'Sem informação (2)']);
    await campo(page, 'habitat', '__sem__');
    expect(await nomes(page)).toEqual(['Vulpix', 'Ninetales']);
    await campo(page, 'habitat', '');

    await page.fill('#catBusca', 'CHAR');
    await expect(page.locator('#catCount')).toHaveText('3 de 40');
    expect(await nomes(page)).toEqual(['Charmander', 'Charmeleon', 'Charizard']);
    await page.fill('#catBusca', 'ninetales charizard');
    await expect(page.locator('#catVazio')).toHaveText('Ninguém com esses filtros.');
    await expect(page.locator('#catCount')).toHaveText('0 de 40');

    await page.locator('#catLimparFiltros').click();
    await expect(page.locator('#catCount')).toHaveText('40 de 40');
    await expect(page.locator('#catBusca')).toHaveValue('');
    await expect(page.locator('#catCampo_tipo')).toHaveValue('');
    await expect(page.locator('#catLimparFiltros')).toHaveCount(0);

    // a busca também olha as informações; campo com lista casa com qualquer valor
    await page.fill('#catBusca', 'flying');
    expect(await nomes(page)).toEqual(['Charizard', 'Pidgey']);
    await page.fill('#catBusca', '');
    await campo(page, 'tipo', 'Flying');
    expect(await nomes(page)).toEqual(['Charizard', 'Pidgey']);
  });

  test('marca e desmarca; contagem na subaba; salvo em pdx-set1 e continua depois de recarregar', async ({ page }) => {
    await inicio(page);
    await caixa(page, 'Pikachu').check();
    await caixa(page, 'Charizard').check();
    await expect(linha(page, 'Pikachu')).toHaveClass(/\bon\b/);
    await expect(chip(page, 'pokemon')).toHaveText('Pokémon · 2');
    await expect(chip(page, 'pokemon')).toHaveClass(/\bhas\b/);
    await expect(page.locator('#catTotal')).toHaveText('2 personagens em 1 franquia marcados');
    expect(await marcas(page)).toEqual({ pokemon: ['Pikachu', 'Charizard'] });
    // clicar no nome também marca (a linha inteira é o rótulo da caixa)
    await linha(page, 'Pikachu').locator('.nm').click();
    await expect(caixa(page, 'Pikachu')).not.toBeChecked();
    await expect(linha(page, 'Pikachu')).not.toHaveClass(/\bon\b/);
    expect(await marcas(page)).toEqual({ pokemon: ['Charizard'] });

    await chip(page, 'lol').click();
    await expect(chip(page, 'lol')).toHaveAttribute('aria-selected', 'true');
    await caixa(page, 'Ahri').check();
    await expect(chip(page, 'lol')).toHaveText('LoL · 1');
    await expect(page.locator('#catTotal')).toHaveText('2 personagens em 2 franquias marcados');
    expect(await marcas(page)).toEqual({ pokemon: ['Charizard'], lol: ['Ahri'] });

    await page.reload();
    await expect(page.locator('#status')).not.toContainText('carregando', { timeout: 15000 });
    await aba(page, 'Catálogo');
    await expect(chip(page, 'pokemon')).toHaveText('Pokémon · 1');
    await expect(chip(page, 'lol')).toHaveText('LoL · 1');
    await expect(caixa(page, 'Charizard')).toBeChecked();
    await expect(caixa(page, 'Pikachu')).not.toBeChecked();
    await chip(page, 'lol').click();
    await expect(caixa(page, 'Ahri')).toBeChecked();
    // o Catálogo não mexe no placar
    expect(await lerStorage(page, 'pdx-stats')).toBeNull();
  });

  test('troca de franquia: cada uma com as suas informações e os seus filtros; sem catálogo, só nome e imagem', async ({ page }) => {
    await inicio(page);
    await campo(page, 'tipo', 'Fire');

    await chip(page, 'lol').click();
    await expect(page.locator('#catFonte')).toHaveText('Informações: Data Dragon (Riot) (gerado em 24/10/2026) · 8 de 40 com informação');
    await expect(page.locator('#catCount')).toHaveText('40 de 40');
    await expect(linha(page, 'Ahri').locator('.campos')).toHaveText('Classe: Mage, Assassin · Região: Ionia · Alcance: À distância');
    await expect(page.locator('.cat-filters select')).toHaveCount(3);
    await campo(page, 'classe', 'Marksman');
    expect(await nomes(page)).toEqual(['Ashe', 'Caitlyn', 'Jinx']);
    await campo(page, 'regiao', 'Zaun');
    expect(await nomes(page)).toEqual(['Jinx']);

    // Bakugan não tem catálogo: lista igual, sem informações nem seletores de campo
    await chip(page, 'bakugan').click();
    await expect(page.locator('#catFonte')).toHaveText('Sem informações da fonte pra Bakugan: a lista mostra só nome e imagem, e dá pra marcar do mesmo jeito.');
    await expect(page.locator('#catCount')).toHaveText('49 de 49');
    await expect(page.locator('#catList .cat-row')).toHaveCount(49);
    await expect(page.locator('#catList .campos')).toHaveCount(0);
    await expect(page.locator('.cat-filters select')).toHaveCount(0);
    await expect(page.locator('#catBusca')).toBeVisible();

    // Digimon sem imagem na lista: a do catálogo (Vademon) ou a do detalhe da API (Betamon)
    await chip(page, 'digimon').click();
    await expect(linha(page, 'Vademon').locator('.th img')).toHaveAttribute('src', 'https://catalogo.test/vademon.png');
    await expect(linha(page, 'Betamon').locator('.th img')).toHaveAttribute('src', 'https://digi-api.com/images/digimon/w/Betamon.png');
    await expect(linha(page, 'Vademon').locator('.campos')).toHaveText('Nível: Perfect · Atributo: Virus');

    // cada franquia guardou os seus filtros
    await chip(page, 'pokemon').click();
    await expect(page.locator('#catCampo_tipo')).toHaveValue('Fire');
    expect(await nomes(page)).toEqual(FOGO);
    await chip(page, 'lol').click();
    expect(await nomes(page)).toEqual(['Jinx']);
  });

  test('lista grande: mostra 60 por vez com "Mostrar mais"; filtrar volta pro começo', async ({ page }) => {
    await inicio(page);
    await chip(page, 'smt').click();
    await expect(page.locator('#catCount')).toHaveText('297 de 297');
    await expect(page.locator('#catList .cat-row')).toHaveCount(60);
    await expect(page.locator('#catMais')).toHaveText('Mostrar mais (237 restantes)');
    await page.locator('#catMais').click();
    await expect(page.locator('#catList .cat-row')).toHaveCount(120);
    await expect(page.locator('#catMais')).toHaveText('Mostrar mais (177 restantes)');
    for (let i = 0; i < 3; i++) await page.locator('#catMais').click();
    await expect(page.locator('#catList .cat-row')).toHaveCount(297);
    await expect(page.locator('#catMais')).toHaveCount(0);
    // as imagens ficam pra quando aparecerem (loading=lazy)
    await expect(page.locator('#catList .th img[loading="lazy"]')).toHaveCount(297);

    await page.fill('#catBusca', 'jack');
    expect(await nomes(page)).toEqual(['Jack Frost', "Jack-o'-Lantern"]);
    await page.fill('#catBusca', '');
    await expect(page.locator('#catList .cat-row')).toHaveCount(60);
  });

  test('"Só marcados", marcar e desmarcar os filtrados, e limpar marcações com dois cliques', async ({ page }) => {
    await inicio(page);
    await expect(page.locator('#catDesmarcar')).toBeDisabled();
    await expect(page.locator('#catLimpar')).toBeDisabled();
    await campo(page, 'tipo', 'Fire');
    await page.locator('#catMarcar').click();
    await expect(chip(page, 'pokemon')).toHaveText('Pokémon · 5');
    for (const n of FOGO) await expect(caixa(page, n)).toBeChecked();
    await expect(page.locator('#catMarcar')).toBeDisabled();
    await expect(page.locator('#catDesmarcar')).toBeEnabled();
    expect(await marcas(page)).toEqual({ pokemon: FOGO });

    await page.locator('#catLimparFiltros').click();
    await caixa(page, 'Pikachu').check();
    await page.locator('#catSoMarcados').check();
    await expect(page.locator('#catCount')).toHaveText('6 de 40');
    expect(await nomes(page)).toEqual([...FOGO.slice(0, 3), 'Pikachu', ...FOGO.slice(3)]);
    // desmarcado some da lista de marcados (click: uncheck() reclamaria da caixa que sumiu)
    await caixa(page, 'Pikachu').click();
    await expect(page.locator('#catCount')).toHaveText('5 de 40');

    await page.fill('#catBusca', 'char');
    await page.locator('#catDesmarcar').click();
    await expect(page.locator('#catVazio')).toBeVisible();
    await expect(chip(page, 'pokemon')).toHaveText('Pokémon · 2');
    expect(await marcas(page)).toEqual({ pokemon: ['Vulpix', 'Ninetales'] });

    // limpar: o primeiro clique só pede confirmação
    await page.locator('#catLimpar').click();
    await expect(page.locator('#catLimpar')).toHaveText('Confirmar: desmarcar 2');
    await expect(page.locator('#catLimpar')).toHaveClass(/\bdanger\b/);
    expect(await marcas(page)).toEqual({ pokemon: ['Vulpix', 'Ninetales'] });
    await page.locator('#catLimpar').click();
    await expect(chip(page, 'pokemon')).toHaveText('Pokémon · 0');
    await expect(page.locator('#catLimpar')).toHaveText('Limpar marcações');
    await expect(page.locator('#catLimpar')).toBeDisabled();
    expect(await marcas(page)).toEqual({});
  });

  test('limpar marcações só vale para a franquia aberta e a confirmação expira', async ({ page }) => {
    await page.clock.install();
    await inicio(page, { storage: { 'pdx-set1': { pokemon: ['Pikachu'], lol: ['Ahri', 'Jinx'] } } });
    await chip(page, 'lol').click();
    await page.locator('#catLimpar').click();
    await expect(page.locator('#catLimpar')).toHaveText('Confirmar: desmarcar 2');
    await page.clock.runFor(4100);
    await expect(page.locator('#catLimpar')).toHaveText('Limpar marcações');
    await page.locator('#catLimpar').click();
    await page.locator('#catLimpar').click();
    await expect(chip(page, 'lol')).toHaveText('LoL · 0');
    await expect(chip(page, 'pokemon')).toHaveText('Pokémon · 1');
    expect(await marcas(page)).toEqual({ pokemon: ['Pikachu'] });
  });

  test('Exportar baixa o set1.json com os marcados e as informações; Copiar põe o mesmo JSON na área de transferência', async ({ page, context }) => {
    // marcações já salvas (inclusive Digimon que vêm sem imagem, sem nunca abrir a lista deles)
    await inicio(page, { storage: { 'pdx-set1': { pokemon: ['Charizard', 'Wartortle', 'Bulbasaur'], lol: ['Ahri'], digimon: ['Betamon', 'Vademon'], smt: ['Pixie'] } } });
    await expect(page.locator('#catTotal')).toHaveText('7 personagens em 4 franquias marcados');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#catExport').click()]);
    expect(dl.suggestedFilename()).toBe('set1.json');
    const set1 = JSON.parse(fs.readFileSync((await dl.path())!, 'utf8'));
    await expect(page.locator('#catMsg')).toHaveText('Baixado o set1.json: 7 personagens em 4 franquias.');

    expect(new Date(set1.geradoEm).toISOString()).toBe(set1.geradoEm);
    expect(Object.keys(set1.franquias)).toEqual(['pokemon', 'digimon', 'smt', 'lol']);
    expect(set1.franquias.pokemon).toEqual({
      rotulo: 'Pokémon',
      fonte: 'PokeAPI (GraphQL)',
      campos: [{ id: 'tipo', rotulo: 'Tipo' }, { id: 'geracao', rotulo: 'Geração' }, { id: 'habitat', rotulo: 'Habitat' }],
      // na ordem da lista do site, não na das marcações
      personagens: [
        { nome: 'Bulbasaur', img: expect.stringMatching(/official-artwork\/1\.png$/), tipo: ['Grass', 'Poison'], geracao: 'I', habitat: 'grassland' },
        { nome: 'Charizard', img: expect.stringMatching(/official-artwork\/6\.png$/), tipo: ['Fire', 'Flying'], geracao: 'I', habitat: 'mountain' },
        { nome: 'Wartortle', img: expect.stringMatching(/official-artwork\/8\.png$/) },
      ],
    });
    expect(set1.franquias.digimon.personagens).toEqual([
      { nome: 'Betamon', img: 'https://digi-api.com/images/digimon/w/Betamon.png', nivel: 'Child', atributo: 'Vaccine' },
      { nome: 'Vademon', img: 'https://catalogo.test/vademon.png', nivel: 'Perfect', atributo: 'Virus' },
    ]);
    expect(set1.franquias.smt).toEqual({ rotulo: 'SMT', fonte: null, campos: [], personagens: [{ nome: 'Pixie', img: expect.stringMatching(/^smt\/.+\.webp$/) }] });
    expect(set1.franquias.lol.personagens).toEqual([{ nome: 'Ahri', img: expect.stringContaining('communitydragon'), classe: ['Mage', 'Assassin'], regiao: 'Ionia', alcance: 'À distância' }]);

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('#catCopy').click();
    await expect(page.locator('#catMsg')).toHaveText('Copiado: 7 personagens em 4 franquias.');
    const copiado = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    expect({ ...copiado, geradoEm: '' }).toEqual({ ...set1, geradoEm: '' });
    await expect(page.locator('#catCopyText')).toHaveCount(0);
  });

  test('Copiar sem área de transferência mostra o JSON pra copiar à mão', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
      document.execCommand = () => false;
    });
    await inicio(page, { storage: { 'pdx-set1': { lol: ['Jinx'] } } });
    await page.locator('#catCopy').click();
    await expect(page.locator('#catMsg')).toHaveText('Não deu pra copiar sozinho: selecione o texto abaixo e copie.');
    await expect(page.locator('#catMsg')).toHaveClass(/\bbad\b/);
    const txt = await page.locator('#catCopyText').inputValue();
    expect(JSON.parse(txt).franquias.lol.personagens).toEqual([{ nome: 'Jinx', img: expect.any(String), classe: ['Marksman'], regiao: 'Zaun', alcance: 'À distância' }]);
  });

  test('Importar soma as marcações de um set1.json às de agora; arquivo inválido só avisa', async ({ page }) => {
    await inicio(page, { storage: { 'pdx-set1': { pokemon: ['Pikachu'] } } });
    const set1 = {
      geradoEm: '2026-10-25T10:00:00.000Z',
      franquias: {
        pokemon: { rotulo: 'Pokémon', fonte: 'PokeAPI (GraphQL)', campos: [], personagens: [{ nome: 'Charizard', img: '' }, { nome: 'Pikachu', img: '' }] },
        lol: { rotulo: 'LoL', fonte: null, campos: [], personagens: [{ nome: 'Ahri', img: '' }, { nome: 'Jinx', img: '' }] },
        'c-abc': { rotulo: 'Meus gatos', fonte: null, campos: [], personagens: [{ nome: 'Mimi', img: '' }] },
      },
    };
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('#catImport').click()]);
    await chooser.setFiles({ name: 'set1.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(set1)) });
    await expect(page.locator('#catMsg')).toHaveText('Importado set1.json: 4 personagens em 2 franquias, 3 novos. Franquias desconhecidas ignoradas: c-abc.');
    await expect(page.locator('#catMsg')).not.toHaveClass(/\bbad\b/);
    expect(await marcas(page)).toEqual({ pokemon: ['Pikachu', 'Charizard'], lol: ['Ahri', 'Jinx'] });
    await expect(chip(page, 'pokemon')).toHaveText('Pokémon · 2');
    await expect(chip(page, 'lol')).toHaveText('LoL · 2');
    await expect(caixa(page, 'Charizard')).toBeChecked();

    // de novo o mesmo arquivo: nada novo
    await page.setInputFiles('#catImportFile', { name: 'set1.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(set1)) });
    await expect(page.locator('#catMsg')).toHaveText('Importado set1.json: 4 personagens em 2 franquias, 0 novos. Franquias desconhecidas ignoradas: c-abc.');

    await page.setInputFiles('#catImportFile', { name: 'foto.json', mimeType: 'application/json', buffer: Buffer.from('não é json') });
    await expect(page.locator('#catMsg')).toHaveText('foto.json não é um arquivo JSON.');
    await expect(page.locator('#catMsg')).toHaveClass(/\bbad\b/);
    await page.setInputFiles('#catImportFile', { name: 'outro.json', mimeType: 'application/json', buffer: Buffer.from('{"pokemon": "Pikachu"}') });
    await expect(page.locator('#catMsg')).toHaveText('outro.json não parece um set1.json exportado daqui.');
    expect(await marcas(page)).toEqual({ pokemon: ['Pikachu', 'Charizard'], lol: ['Ahri', 'Jinx'] });
  });

  test('lista ainda carregando ou que falhou', async ({ page }) => {
    await prepare(page, { atraso: { lol: 2500 }, falha: ['ygo'] });
    await page.goto('./');
    await aba(page, 'Catálogo');
    await chip(page, 'lol').click();
    await expect(page.locator('#catLista')).toHaveText('Carregando a lista de LoL…');
    // as informações da fonte já aparecem
    await expect(page.locator('#catFonte')).toContainText('Data Dragon (Riot)');
    await expect(page.locator('#catList .cat-row')).toHaveCount(40, { timeout: 10_000 });
    await chip(page, 'ygo').click();
    await expect(page.locator('#catLista')).toHaveText('A lista de Yu-Gi-Oh! não carregou. Recarregue a página pra tentar de novo.');
  });

  test('cabe na tela: sem rolagem horizontal; uma coluna no celular, duas no computador', async ({ page }, info) => {
    await inicio(page, { storage: { 'pdx-set1': { pokemon: ['Bulbasaur'] } } });
    const celular = info.project.name === 'celular';
    const btn = page.locator('#catCamposBtn');
    if (celular) {
      // no celular os seletores dos campos ficam recolhidos; o botão diz quantos estão ativos
      await expect(page.locator('#catCampo_tipo')).toBeHidden();
      await expect(btn).toHaveText('Filtros por campo (3)');
      await btn.click();
      await expect(btn).toHaveAttribute('aria-expanded', 'true');
      await expect(btn).toHaveText('Esconder os filtros por campo');
      await page.selectOption('#catCampo_tipo', 'Grass');
      await btn.click();
      await expect(page.locator('#catCampo_tipo')).toBeHidden();
      await expect(btn).toHaveText('Filtros por campo (3) · 1 ativo');
    } else {
      await expect(btn).toBeHidden();
      await expect(page.locator('#catCampo_tipo')).toBeVisible();
      await campo(page, 'tipo', 'Grass');
    }
    await expect(page.locator('#catList .cat-row')).toHaveCount(3);
    const largura = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, tela: window.innerWidth }));
    expect(largura.doc).toBeLessThanOrEqual(largura.tela);
    const caixas = await page.locator('#catList .cat-row').evaluateAll(els => els.map(e => e.getBoundingClientRect().x));
    if (celular) expect(new Set(caixas).size).toBe(1);
    else expect(new Set(caixas).size).toBe(2);
    // a caixa de marcar é grande o bastante pra tocar e o rótulo inteiro marca
    const cx = await caixa(page, 'Ivysaur').boundingBox();
    expect(cx!.width).toBeGreaterThanOrEqual(20);
    await linha(page, 'Ivysaur').locator('.th').click();
    await expect(caixa(page, 'Ivysaur')).toBeChecked();
    // ainda sem rolagem lateral com o maior conteúdo (subabas, filtros e mensagem)
    await chip(page, 'ff').click();
    const depois = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(depois).toBe(true);
  });
});
