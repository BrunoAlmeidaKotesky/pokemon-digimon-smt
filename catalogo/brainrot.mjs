// Brainrot: categoria e votos já vêm em public/brainrot/list.json (o brainrot.mjs da raiz lê tudo numa passada só).
// Este coletor não acessa o site: coletar de novo levaria meia hora e o site pede frequência semanal, no máximo.

import fs from 'node:fs/promises';

const LISTA = 'public/brainrot/list.json';

const CATEGORIA = {
  aquatic: 'Aquático', bird: 'Ave', digital: 'Digital', hybrid: 'Híbrido', legendary: 'Lendário', mammal: 'Mamífero',
  mechanical: 'Mecânico', mysterious: 'Misterioso', mythical: 'Mítico', 'plant-animal': 'Planta-animal', primate: 'Primata',
  reptile: 'Réptil', uncategorized: 'Sem categoria',
};

export default {
  chave: 'brainrot',
  fonte: 'Animal Brainrot',
  campos: [
    { id: 'categoria', rotulo: 'Categoria' },
    { id: 'votos', rotulo: 'Votos' },
  ],
  async gerar() {
    const lista = JSON.parse(await fs.readFile(LISTA, 'utf8'));
    const itens = {};
    for (const [nome, , categoria, votos] of lista) {
      itens[nome] = { votos };
      if (categoria) itens[nome].categoria = CATEGORIA[categoria.toLowerCase()] ?? categoria;
    }
    return { itens };
  },
};
