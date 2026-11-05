import type { Source } from '../types';
import { listaLocal } from './lista-local';

export const MINECRAFT_URL = 'minecraft/list.json';

// Minecraft: mobs da Minecraft Wiki. A lista tem filtros por categoria e variantes escolhidas à mão (cada cor de gato,
// lobo, cavalo, ovelha, sapo e axolote é uma carta): fica em public/minecraft/list.json (gerada pelo minecraft.mjs) e
// só as imagens vêm de minecraft.wiki.
export const minecraft: Source = { key: 'minecraft', label: 'Minecraft', load: listaLocal(MINECRAFT_URL) };
