// Persona: personas dos personagens de P3, P4 e P5 no pacote megaten@2.3.1 (o leitor do demonData.js fica em smt.mjs).
// As versões Picaro (P5 Royal) não têm dono no pacote: herdam o da persona base ("Ariadne Picaro" -> "Ariadne").

import { enxuto, JOGOS, megaten, porNome } from './smt.mjs';

export default {
  chave: 'persona',
  fonte: 'Pacote megaten 2.3.1 (dados de Persona 3, 4 e 5)',
  campos: [
    { id: 'jogo', rotulo: 'Jogo' },
    { id: 'arcana', rotulo: 'Arcana' },
    { id: 'dono', rotulo: 'Dono' },
    { id: 'mitologia', rotulo: 'Mitologia' },
    { id: 'estagio', rotulo: 'Estágio' },
    { id: 'nivel', rotulo: 'Nível' },
    { id: 'fraco', rotulo: 'Fraqueza' },
  ],
  async gerar() {
    const todos = new Map((await megaten()).map(d => [d.name, d]));
    const itens = {};
    for (const [nome, d] of await porNome('persona')) {
      const base = d.race === 'Picaro' ? todos.get(nome.replace(/ Picaro$/, '')) : undefined;
      itens[nome] = enxuto({
        jogo: JOGOS[d.game] ?? d.game,
        arcana: d.arcana,
        dono: d.user ?? base?.user,
        mitologia: d.origin,
        estagio: d.stage,
        nivel: d.level,
        fraco: d.resistances?.weak,
      });
    }
    return { itens };
  },
};
