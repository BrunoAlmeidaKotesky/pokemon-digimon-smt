import type { FranchiseKey, Source } from '../types';
import { pokemon } from './pokemon';
import { digimon } from './digimon';
import { smt } from './smt';
import { jojo } from './jojo';
import { ygo } from './ygo';
import { bakugan } from './bakugan';
import { lol } from './lol';
import { overwatch } from './overwatch';
import { deadlock } from './deadlock';
import { ff } from './ff';
import { sujimon } from './sujimon';

export { nice } from './text';
export { resolve } from './resolve';

/** Todas as franquias, na ordem em que aparecem no site. */
export const SOURCES: Source[] = [pokemon, digimon, smt, jojo, ygo, bakugan, lol, overwatch, deadlock, ff, sujimon];
export const KEYS: FranchiseKey[] = SOURCES.map(s => s.key);
export const LABELS: Record<string, string> = Object.fromEntries(SOURCES.map(s => [s.key, s.label]));
