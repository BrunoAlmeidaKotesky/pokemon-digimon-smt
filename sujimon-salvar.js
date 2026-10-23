// Ajudante pra salvar, UMA PÁGINA POR VEZ, o screenshot do Sujimon que você está vendo no navegador, já com o nome
// que o `node sujimon.mjs recortar` entende ("001 Burnout Bully.png"). Não navega sozinho nem visita outras
// páginas: você abre cada Sujimon e clica no favorito.
//
// Como usar:
// 1. Crie um favorito no navegador e cole como endereço a linha "javascript:..." que o comando abaixo imprime:
//      node sujimon-salvar.js
// 2. Abra a página de um Sujimon, deixe a aba "Screenshot" visível e clique no favorito.
// 3. O arquivo vai pra pasta de downloads. Mova os arquivos pra sujimon/_orig/ e rode
//    `node sujimon.mjs recortar --teste`.
// Se o site não deixar baixar a imagem direto, o ajudante abre a imagem numa aba nova e copia o nome do arquivo:
// salve com Ctrl+S e cole o nome.

async function salvarSujimon() {
  const slug = location.pathname.split('/').filter(Boolean).pop() ?? '';
  const num = (slug.match(/^(\d{1,3})-/)?.[1] ?? prompt('Número deste Sujimon (ex.: 7):') ?? '').padStart(3, '0');
  const nome = (document.querySelector('h1')?.textContent ?? '').replace(/\s+/g, ' ').trim()
    || prompt('Nome deste Sujimon:') || 'Sem nome';
  const limpo = nome.replace(/[\\/:*?"<>|]/g, '').trim();
  const arquivo = `${num} ${limpo}`;

  // a imagem da aba "Screenshot": pela descrição, pelo endereço ou pelo bloco onde está
  const imgs = [...document.querySelectorAll('img')].filter(i => i.currentSrc || i.src);
  const contexto = i => [i.alt, i.title, i.currentSrc || i.src, i.closest('[id],[class],[data-tab],[aria-labelledby]')?.outerHTML.slice(0, 300)].join(' ');
  const shot = imgs.find(i => /screenshot/i.test(contexto(i)))
    ?? imgs.sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight))[0];
  if (!shot) { alert('Não achei a imagem do screenshot nesta página. Deixe a aba "Screenshot" aberta e tente de novo.'); return; }
  const url = shot.currentSrc || shot.src;
  const ext = (url.split('?')[0].match(/\.(png|jpe?g|webp)$/i)?.[1] ?? 'png').toLowerCase();

  try {
    const blob = await (await fetch(url)).blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${arquivo}.${ext}`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } catch {
    // imagem de outro domínio sem permissão: abre pra salvar à mão, com o nome já copiado
    await navigator.clipboard?.writeText(`${arquivo}.${ext}`).catch(() => {});
    window.open(url, '_blank');
    alert(`Abri a imagem numa aba nova. Salve com Ctrl+S; o nome "${arquivo}.${ext}" já está copiado.`);
  }
}

// Rodando no Node: imprime o bookmarklet (a mesma função, numa linha só).
if (typeof window === 'undefined') {
  const corpo = salvarSujimon.toString().replace(/^\s*\/\/.*$/gm, '').replace(/\s*\n\s*/g, ' ');
  console.log('javascript:' + encodeURIComponent(`(${corpo})()`));
} else {
  salvarSujimon();
}
