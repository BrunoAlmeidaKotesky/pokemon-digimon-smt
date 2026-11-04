// Habilidade genérica dos chefes do Final Fantasy (os monstros comuns só atacam).
import type { Habilidade } from '../tipos';

export const HABILIDADE_CHEFE: Habilidade = {
  id: 'chefe',
  nome: 'Pancada do Chefe',
  texto: 'Golpeia o alvo e quem está em volta dele (1 casa): 200% do dano de ataque e atordoa por 1 s.',
  mana: 100,
  lancar(ctx, eu, alvo) {
    const centro = alvo ?? eu;
    const atingidos = ctx.emVolta(centro, 1, eu, 'inimigos');
    ctx.visual('terra', [centro, ...atingidos.filter(x => x !== centro)], eu);
    for (const x of atingidos) {
      ctx.dano(eu, x, 2);
      ctx.status(eu, x, 'atordoado', 1);
    }
  },
};
