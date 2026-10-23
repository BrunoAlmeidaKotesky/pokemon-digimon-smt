# Sujimon no site

Desde 23/10/2026 o site usa a lista local (`public/sujimon/`), feita com o `node sujimon.mjs recortar` a partir das
imagens que você baixou do Sujidex (`sujimon/_orig/`, fora do git):

- **295 Sujimon entraram**:
  - 162 recortados do screenshot do Sujidex (o painel do meio, só o personagem);
  - 133 a partir do retrato (rosto, 168px com fundo transparente, ampliado 2×), porque a página deles não tinha
    screenshot.
- Recorte próprio pros que são mais largos que o normal: 297 e 300 (escavadeiras), 298 (tubarão) e 299 (lula).
- **Ficaram de fora 22 números**, que não vieram no download (não estavam na tabela da página): 018, 020, 033, 034,
  036, 037, 038, 050, 051, 052, 053, 054, 055, 058, 059, 060, 066, 089, 090, 144, 233 e 248.

Pra incluir algum, coloque a imagem em `sujimon/_orig/` como `018 Nome.png` (ou o screenshot como `018.jpg`, com o
nome no `nomes.json`) e rode `node sujimon.mjs recortar` de novo.

A Yakuza Wiki continua como reserva: se `public/sujimon/list.json` sumir, o site volta a usar a wiki (154 Sujimon
com imagem).
