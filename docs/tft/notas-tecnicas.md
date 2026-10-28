# Modo estilo TFT: notas técnicas (internas)

Levantamento de 25/10/2026 do que cada fonte de dados permite usar como traço (origem, classe, custo) num modo
inspirado no Teamfight Tactics. As decisões de design ficam no doc compartilhado "Modo estilo TFT: planejamento"
(https://claude.ai/artifact/YZWHvKZY5tyVaJSqgz8Hx7); aqui ficam os detalhes de cada API pra quando for implementar.

Premissas já decididas: set fixo e curado (lista de unidades escolhida a dedo, não sorteada), cada unidade com origem
e classe. Como o set é curado, dado que falta na API pode ser preenchido à mão num arquivo do set.

Todas as fontes abaixo respondem com `access-control-allow-origin: *`, menos a MoogleAPI (Final Fantasy). Mesmo com
CORS, quase tudo é melhor salvo por script no repositório (como o `ff.mjs`): o set é fixo, então não há motivo pra
buscar categorias a cada visita.

## Pokémon (1025 espécies, medido 100%)

| Campo | Valores | Cobertura |
|---|---|---|
| Tipo | 18 (water 154, normal 131, grass 127, flying 109 … ice 48); 526 têm 2 tipos | 100% |
| Geração | 9 (V 156, I 151, III 135, IX 120, IV 107, II 100, VIII 96, VII 88, VI 72) | 100% |
| Lendário / mítico / bebê | 71 / 23 / 19 | 11% |
| Estágio da evolução (de `evolves_from`) | estágio 1/2/3 = 541/363/121; papéis final 367, básico 340, único 201, meio 117 | 100% |
| Cor, forma, grupo de ovo, crescimento | 10, 14, 15, 6 valores | 100% |
| Habitat | 9, só gerações I–III | 38% |

- GraphQL `https://graphql.pokeapi.co/v1beta2` (POST, CORS ok): tudo em 1 pedido (149 KB, ~10 KB comprimido), mas a
  documentação limita a 100 chamadas por hora por IP e o servidor reinicia todo dia: salvar por script. O endereço
  antigo `beta.pokeapi.co/graphql/v1beta` ainda responde, marcado pra sair.
- REST: `/pokemon-species/{id}` + `/pokemon/{id}` = ~2050 pedidos; as listas reversas (`/type/{x}`, `/generation`,
  cor, forma, grupo de ovo) somam ~66 pedidos; lendário/mítico não tem lista reversa.

- Megas, Primais e formas regionais (157: 97 Megas, 2 Primais, 58 de Alola, Galar, Hisui e Paldea) vêm da lista
  `/api/v2/pokemon?limit=2000` (variedades com id acima de 10000), com nome oficial em inglês (`formName` em
  src/sources/pokemon.ts: "Mega Charizard X", "Alolan Raichu") e arte oficial pelo id. No catálogo têm o campo Variante.
- Outras formas: a mesma lista tem mais 110 (Giratina Origin, Rotom, Deoxys, Zygarde 10% e Completo...). Entram só as
  54 que mudam de verdade, listadas em src/sources/pokemon-formas.json ("Giratina (Origin)"), lida pelo site e pelo
  catálogo (Variante "Forma alternativa"). As que só trocam de cor, tamanho, gênero ou roupa (Minior, Squawkabilly,
  Pumpkaboo, Pikachu de fantasia) ficam de fora.

## Digimon (1488, todos os detalhes buscados)

| Campo | Valores | Cobertura |
|---|---|---|
| Nível | 9 (Ultimate 406, Adult 389, Perfect 352, Child 214, Armor 77, Baby II 62, Baby I 48, Hybrid 32, Unknown 6); 173 têm 2 a 4 | 90,5% |
| Atributo | 7 (Virus 484, Data 416, Vaccine 407, Free 244, Unknown 59, Variable 33, No Data 2); 286 têm mais de um | 87,1% |
| Field | 10 (Nature Spirits 344, Nightmare Soldiers 254, Metal Empire 239, Wind Guardians 173, Virus Busters 172, Unknown 124, Deep Savers 121, Dragon's Roar 90, Dark Area 70, Jungle Troopers 49); até 6 por Digimon | 62,2% |
| Tipo | 154 (Cyborg 109, Mutation 63, Machine 55 …) | 90,6% |
| Ano de lançamento | 1997–2025 | 100% |
| X-Antibody | 171 sim | 100% |

- Níveis em japonês: Child = Rookie, Adult = Champion, Perfect = Ultimate, Ultimate = Mega.
- `?pageSize=2000` traz a lista toda em 1 pedido, sem categorias. A lista aceita filtro `level=` e `attribute=`
  (16 pedidos cobrem esses dois); `type=` e `field=` são ignorados em silêncio. Tipo, field e ano: 1488 pedidos de
  detalhe (7 s com cache, 6 em paralelo).

## SMT (297) e Persona (95): pacote megaten@2.3.1

`https://cdn.jsdelivr.net/npm/megaten@2.3.1/dist/demonData.js`, lido como texto (ver a skill `fontes-e-imagens`).
Todos os nomes de `smt.json` e `persona.json` batem. Zero pedidos: dá pra acrescentar os campos nesses JSONs.

- SMT: jogo (smt5 230, p4 45, p5 22); raça 42 valores, 99,3% (Tyrant 17, Femme 14, Megami 13, Fallen 12, Deity 12,
  Fury 12 …; 8 raças com um só; Byakhee e Hastur sem raça); mitologia (`origin`) 27 valores, 100% (Abrahamic 52,
  Japanese 51, European 32, Hindu 32, Greco-Roman 23, Chinese 18, Norse 13, Buddhist 13, Celtic 10 …); alinhamento
  97% (ético: Chaos 126, Neutral 94, Law 51, Unknown 17; moral: Light 115, Neutral 93, Dark 60, Unknown 20); arcana
  25 valores, 87% (falta em 38 do smt5); nível 1–99; fraqueza em 96% mas com vários valores (Ice 68, Fire 67,
  Elec 65, Force 54, Light 46, Dark 44).
- Persona: jogo (P5 57, P4 21, P3 17); arcana 20 valores, 100% (Fool 10, Chariot 9 …); dono (`user`) 37 valores,
  87% (as 12 Picaro não têm; sai do nome da persona base); mitologia 14 valores; estágio 1/2/3 = 37/28/18;
  fraqueza 80%; sem alinhamento.

## JoJo (205 Stands da lista do site)

| Campo | Valores | Cobertura |
|---|---|---|
| Parte (categoria) | Part 3 35, spin-off 29, Part 5 27, Part 8 27, Part 4 26, Part 6 24, Part 7 22, Part 9 15 (só a primeira Parte; Stands recorrentes aparecem em várias) | 100% |
| Alcance (`{{ST}}` na ficha) | Close 96, Range Irrelevant 54, Long 46, Automatic 35; 35 têm dois | 95,6% |
| Forma | Artificial Humanoid 58, Natural Humanoid 43, Natural Non-Humanoid 41, Artificial Non-Humanoid 40, Phenomenon 28 | 96,1% |
| Mecânica | Psychological 33, Materialized/Bound 30, Sentient 23, Recon 22, Evolved 18, Multi-User 15, Multi-Unit 12, Foresight 3 | 55,6% |
| Stats A–E | Partes 3–5 ~100%, Parte 6 58%, Parte 8 19%, Parte 9 0%, spin-offs 14% | ~55% |
| Usuário | 212 links, quase todos únicos | 97% |

- Ficha `Template:Stand Infobox`, campo `type` com códigos `{{ST|código}}` (normalizar por `Template:ST`). As
  categorias de alcance existem, mas "Range Irrelevant" não tem categoria: usar a ficha.
- Custo total: 11 pedidos de categoria + `prop=categories` em lotes de 50 + `prop=revisions` (wikitext) 50 por
  pedido = ~21 pedidos.

## Yu-Gi-Oh! (os 3000 monstros mais vistos, mesmo filtro do `ygo.ts`)

- Atributo 7 valores, 100% (DARK 1020, LIGHT 692, EARTH 530, WATER 272, WIND 248, FIRE 232, DIVINE 6).
- Raça 26 valores, 100% (Dragon 404, Warrior 363, Spellcaster 316, Fiend 301, Machine 290, Fairy 187, Cyberse 123,
  Beast 120 … Divine-Beast 5, Creator God 1).
- Tipo de carta: effect 1670, fusion 289, xyz 274, link 244, synchro 217, normal 172, pêndulo 85, ritual 49.
- Nível/rank 94%; link rating 8% (só links). Arquétipo 389 valores, 69,4% (Elemental HERO 56, Blue-Eyes 29,
  Archfiend 27 …; 174 com 5 ou mais). Ano no TCG 99,9%.
- Já vem no pedido que o site faz (25 MB, 3,5 MB comprimido); o cache `pdx-ygo-v1` guarda só `[nome, id]`. Pra usar
  os campos no site seria outra chave de cache (não mexer na `pdx-ygo-v1`).

## Bakugan (668 páginas da lista do site)

- Atributo (ficha + categoria): Pyrus 180, Darkus 169, Haos 154, Aquos 149, Ventus 137, Subterra 89, Aurelus 42.
  Algum atributo: 82,5%; exatamente um: 57,6% (25 páginas listam os 6, brinquedos lançados em todas as cores; 117
  sem nenhum).
- Série (categorias) 10 valores, 91% (G1 Mechtanium Surge 185, New Vestroia 162, Gundalian Invaders 120, BakuTech 76,
  Armored Alliance 74, Battle Brawlers 65, Geogan Rising 59, Battle Planet 46, Evolutions 30, 2023 5).
- Facção 14 valores, 55% (Battle Brawlers 144, Villains 120, Vexos 54, Castle Knights 53 …).
- Tipo: Guardian 250, Evolution 127, Mechanical 36, Hybrid 36 …; 134 páginas (20%) são equipamento, não criatura
  (Weapons 67, Battle Gear 52, Mechtogan 29, Traps 27, BakuNano 18): filtrar.
- Poder G: 46%. Custo: `embeddedin` (2) + categorias e wikitext em lotes de 50, ~37 pedidos. Repetir se vier HTML
  do Cloudflare.

## League of Legends (173 campeões, Data Dragon 16.21.1)

| Campo | Fonte | Valores | Cobertura |
|---|---|---|---|
| `tags` (1–2) | `champion.json`, 1 pedido | Mage 75, Fighter 60, Assassin 46, Tank 46, Support 43, Marksman 33 (só a primeira: Fighter 50, Mage 35, Marksman 29, Tank 24, Support 18, Assassin 17) | 100% |
| `partype` | idem | Mana 145, Energy 6, None 6, Fury 4 + 10 únicos | 100% |
| `info.difficulty` | idem | 0–10 | 100% |
| Corpo a corpo / à distância | `stats.attackrange` (≥ 300 = distância) | 90 / 83 | 100% |
| Região | `universe-meeps.leagueoflegends.com/v1/en_us/search/index.json`, 1 pedido (219 KB) | ionia 23, sem região 21, noxus 17, freljord 15, demacia 15, zaun 14, shurima 11, shadow-isles 10, void 9, piltover 8, bilgewater 8, ixtal 8, mount-targon 7, bandle-city 7 | 173/173 |
| `championTagInfo` | CommunityDragon `.../v1/champions/{key}.json`, 173 pedidos (~7,4 MB) | 19: Mobile 37, Crowd Control 37, Burst 35, Duelist 29, AoE 28, Auto-attack 27, Ally Protection 18, Dive 16 … | 170/173 |
| `damageType` | idem | Magic 87, Physical 78, Mixed 8 | 100% |

- Raça pelo Universe (`champions/{slug}/index.json`, 174 pedidos): só 13 campeões (Vastaya 8, Darkin 5); não vale.
- Os 21 sem região (Bard, Aurelion Sol, Kindred, Zilean, Ryze, Aatrox …) precisam de um balde à mão.

## Overwatch (54 heróis)

- OverFast `/heroes` (1 pedido): `role` damage 23, support 16, tank 15; `subrole` 10 (flanker 7, specialist 7,
  tactician 6, survivor 6, stalwart 6, sharpshooter 5, initiator 5, recon 4, medic 4, bruiser 4).
- `/heroes/{key}` (54 pedidos): sem nacionalidade nem afiliação; `location` em texto livre, `age` 53/54,
  `hitpoints` (13 com armadura, 9 com escudo).
- Overwatch Wiki, ficha (2 pedidos de 50 títulos): `nationality` com `{{flag|xx}}` em 46/54 (~30 países);
  `affiliation` em 44/54, poluída por "formerly". Categorias (2 pedidos), mais limpas: Overwatch members 26, Cyborgs
  11, Talon members 8, Junkers 4, Omnic characters 4, Animal characters 3, Shambali 3, Vishkar 3, Mech pilots 3,
  Gladiators 3.

## Deadlock (44 heróis jogáveis)

| Campo | Valores | Cobertura |
|---|---|---|
| `hero_type` | mystic 14, marksman 11, brawler 10, assassin 9 | 100% |
| `gun_tag` | 14 (Pistol 8, Spreadshot 8, Rapid Fire 5, Burst Fire 5, Projectile 5 …) | 42/44 (faltam Deadman Danny e Rem) |
| `complexity` | 1: 15, 2: 16, 3: 12, 4: 1 | 100% |
| `gender` | male 25, female 18 | 43/44 |
| `tags` | 116 palavras soltas, só 11 repetem | inútil |

- Deadlock Wiki, categorias (1 pedido): stamina (2: 8, 3: 32, 4: 4), velocidade do dash (lento 13, médio 20,
  rápido 11), arma (automática 31, spreadshot 10, rajada 4). Sem facção, espécie ou lore: origem só à mão.

## Final Fantasy (3573 monstros de `public/ff/list.json`)

- MoogleAPI sem CORS (já salvo pelo `ff.mjs`); o detalhe não acrescenta categoria. Não existe campo de família:
  `/api/battle/starters` tem "family", mas é só "mesmo nome em 5 ou mais jogos" (55 famílias).

| Campo | Valores | Cobertura |
|---|---|---|
| Jogo | 16 (XII 428 … IX 141, VIII 107, XIV 12, XVI 2) | 100% |
| Categoria | Enemy 2958, Boss 615 (FF XI sem chefe) | 100% |
| Fraqueza | 9 elementos (Fire 598, Thunder 491, Ice 471, Holy 385, Water 316, Wind 274, Earth 108, Dark 34, Gravity 27); por jogo: XII 91%, XV 85%, VII 32%, XIV 25%, XVI 0% | 54,7% |
| Absorve | 9 | 18,8% |
| Nível | 105 valores | 70,5% |
| Local | 2014 valores | 92,6% (fino demais) |

- Dá pra derivar: primeiro elemento da fraqueza; nome que se repete entre jogos (35,8% em 2 ou mais, 11,7% em 5 ou
  mais); família por palavra no nome (dragon, undead, insect, beast …), ~38,5% com regex grosseiro, precisa limpeza.

## Sujimon (314 da lista do site)

- Yakuza Wiki: a tabela do Sujidex só tem ícone, número e nome. Só 155 das 315 páginas ligadas existem; 132 têm a
  ficha `{{Sujimon}}`, todas do *Yakuza: Like a Dragon* (não do Infinite Wealth), com categoria em 14, raridade em 9
  e fraqueza em 10: inútil.
- No jogo: tipos Light, Shadow, Blaze, Frost, Nature; raridades Green, Bronze, Silver, Gold, Kiwami. A única lista
  por Sujimon achada (samurai-gamers.com, HTML) tem 133 linhas com nomes de pré-lançamento e erros; 104 dos 314
  batem (33%).
- Os screenshots em `sujimon/_orig` mostram os ícones de resistência e a aba de habitat (Japão/Havaí): dá pra
  catalogar à mão. Famílias de evolução saem de números consecutivos (Punkling → Steamed Punk → Overpunk).
- Não acessar gamerguides.com.

## Franquias personalizadas

Só nome e imagem: precisariam de traços escolhidos por quem cria, ou ficar fora do modo.

## Arquivos do Set 1

- `set1-escolhas-v1.json`: primeira exportação do Catálogo feita pelo usuário (26/10/2026), 500 personagens:
  Pokémon 192, SMT 73, Sujimon 45, Digimon 39, Persona 37, JoJo 37, LoL 32, Overwatch 24, Deadlock 21. Fora:
  Bakugan; Final Fantasy vira os monstros das rodadas (PvE) e chefes; Yu-Gi-Oh! ainda a escolher.
- `sugestoes-catalogo.json`: arquivo pra **Importar** no Catálogo (formato `{chave: [nomes]}`): 20 Digimon que
  completam as linhas de 4 formas (Rookie → Mega), 2 personas que completam linhas (Seiten Taisei - P5 e Vanadis;
  Persona evolui por estágio do mesmo dono, como Pokémon) e 70 monstros clássicos do anime de Yu-Gi-Oh! (todos na lista do
  site; Gamma The Magnet Warrior, Judge Man, Gilford the Lightning, Harpie's Pet Dragon e Perfectly Ultimate Great
  Moth ficaram de fora porque não estão entre os 3000 mais vistos). As linhas propostas estão no doc compartilhado.
- Nomes dos Digimon seguem a Digi-API (japonês): Holy Angemon = MagnaAngemon, Ofanimon = Ophanimon,
  Atlur Kabuterimon (Red) = MegaKabuterimon, Plotmon = Salamon, Tailmon = Gatomon, Pico Devimon = DemiDevimon,
  Candmon = Candlemon, Tyumon = Chuumon, Demon = Daemon.

## Rascunhos e dados brutos

Os scripts e downloads do levantamento ficaram no scratchpad da sessão de 25/10/2026 (`.../scratchpad/tft/` e
`.../scratchpad/tft2/`), que é temporário: ao implementar, refaça pelos endpoints acima e salve por script no repo.
