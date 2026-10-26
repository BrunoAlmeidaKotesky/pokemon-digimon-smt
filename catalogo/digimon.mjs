// Digimon: lista da Digi-API (1 pedido com pageSize=2000) e o detalhe de cada um (um pedido por Digimon, 6 por vez).
// O nome é o `name` da lista, como em src/sources/digimon.ts. Níveis com os nomes da API, que são os japoneses
// (Child = Rookie, Adult = Champion, Perfect = Ultimate, Ultimate = Mega).
// Quem vem sem imagem na lista ganha a imagem do detalhe em `imagens`.

import { getJson, pool } from './util.mjs';

const API = 'https://digi-api.com/api/v1/digimon';

export default {
  chave: 'digimon',
  fonte: 'Digi-API',
  campos: [
    { id: 'nivel', rotulo: 'Nível' },
    { id: 'atributo', rotulo: 'Atributo' },
    { id: 'field', rotulo: 'Field' },
    { id: 'tipo', rotulo: 'Tipo' },
    { id: 'ano', rotulo: 'Ano' },
    { id: 'x', rotulo: 'X-Antibody' },
  ],
  async gerar() {
    const lista = (await getJson(`${API}?pageSize=2000&page=0`)).content;
    if (!lista?.length) throw new Error('lista vazia');
    let falhas = 0;
    const detalhes = await pool(lista, 6, d => getJson(`${API}/${d.id}`).catch(e => {
      falhas++;
      console.error(`  digimon: sem detalhe de ${d.name} (${e.message})`);
      return null;
    }));
    if (falhas > lista.length / 20) throw new Error(`${falhas} detalhes falharam`);
    const itens = {};
    const imagens = {};
    lista.forEach((d, k) => {
      const j = detalhes[k];
      if (!j || itens[d.name]) return; // nome repetido: fica o primeiro, como no saco do site
      const nomes = (a, c) => [...new Set((a ?? []).map(x => x[c]).filter(Boolean))];
      const info = {
        nivel: nomes(j.levels, 'level'),
        atributo: nomes(j.attributes, 'attribute'),
        field: nomes(j.fields, 'field'),
        tipo: nomes(j.types, 'type'),
        ano: /^\d{4}$/.test(j.releaseDate ?? '') ? Number(j.releaseDate) : j.releaseDate,
        x: j.xAntibody ? 'Sim' : undefined,
      };
      itens[d.name] = Object.fromEntries(Object.entries(info).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && !v.length)));
      const img = j.images?.find(i => i.href)?.href;
      if (!d.image && img) imagens[d.name] = img;
    });
    return { itens, imagens };
  },
};
