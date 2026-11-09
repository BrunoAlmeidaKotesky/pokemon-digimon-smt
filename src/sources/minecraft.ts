import type { Source } from '../types';
import { listaLocal } from './lista-local';

export const MINECRAFT_URL = 'minecraft/list.json';

// Minecraft: mobs da Minecraft Wiki, sem variantes de cor. A lista tem filtros por categoria: fica em
// public/minecraft/list.json (gerada pelo minecraft.mjs) e só as imagens vêm de minecraft.wiki.
export const minecraft: Source = { key: 'minecraft', label: 'Minecraft', load: listaLocal(MINECRAFT_URL) };
