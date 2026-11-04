// Quando tocar cada som da Autobatalha: compara o estado da tela antes e depois de cada mudança (EstadoTela) e toca o
// som do que aconteceu (comprar, vender, evoluir, juntar item, começo e fim da luta, golpes...). Comparar estados vale
// pra qualquer origem da ação (clique, arrasto, atalho, o próprio controle), sem espalhar chamadas pela tela. Os sons
// em si estão em som.ts; o volume vem da configuração.
import { useEffect, useRef } from 'react';
import type { EstadoTela } from '../../autobatalha/api';
import type { EfeitoVisual, Jogador } from '../../autobatalha/tipos';
import { CUSTO_ATUALIZAR, CUSTO_XP } from '../../autobatalha/partida';
import { eventosEntre } from './reproducao';
import { definirVolume, prepararAudio, tocar, tocarHabilidade, type Som } from './som';

/** maior estrela de cada campeão */
function estrelas(j: Jogador): Map<string, number> {
  const m = new Map<string, number>();
  for (const u of Object.values(j.unidades)) m.set(u.campeao, Math.max(m.get(u.campeao) ?? 0, u.estrela));
  return m;
}
const itensNasUnidades = (j: Jogador) => Object.values(j.unidades).map(u => `${u.uid}:${u.itens.join('|')}`).sort().join(',');
const posicoes = (j: Jogador) => JSON.stringify([j.banco, Object.entries(j.tabuleiro).sort()]);

/** Sons do que o jogador fez entre dois estados. `mesmaRodada` = a renda, o XP e a loja nova da virada não contam. */
export function sonsDoJogador(a: Jogador, b: Jogador, mesmaRodada: boolean): Som[] {
  const out: Som[] = [];
  const sumiu = Object.keys(a.unidades).some(uid => !(uid in b.unidades));
  const novo = Object.keys(b.unidades).some(uid => !(uid in a.unidades));
  // evolução vale sempre (compra, carrossel, Sujimon de graça)
  const antes = estrelas(a);
  let evoluiu = 0;
  for (const [c, e] of estrelas(b)) if (e > (antes.get(c) ?? 0) && e >= 2) evoluiu = Math.max(evoluiu, e);
  if (b.nivel > a.nivel) out.push('nivel');
  if (mesmaRodada) {
    const gastou = a.ouro - b.ouro;
    const comprou = gastou > 0 && a.loja.some((id, i) => id != null && b.loja[i] == null);
    const lojaNova = !comprou && a.loja.some((id, i) => id !== b.loja[i]);
    if (comprou) out.push('comprar');
    else if (sumiu && b.ouro > a.ouro) out.push('vender');
    if (lojaNova && gastou === CUSTO_ATUALIZAR) out.push('atualizar');
    if (b.nivel === a.nivel && b.xp !== a.xp && gastou === CUSTO_XP) out.push('xp');
    if ((a.moedas?.length ?? 0) > (b.moedas?.length ?? 0) && b.ouro > a.ouro) out.push('moeda');
    const unidadesIguais = !sumiu && !novo;
    if (unidadesIguais && b.itens.length === a.itens.length - 1) {
      out.push(itensNasUnidades(a) === itensNasUnidades(b) ? 'juntar' : 'equipar');
    }
    if (unidadesIguais && !comprou && posicoes(a) !== posicoes(b)) out.push('posicionar');
  }
  if (evoluiu) out.push(evoluiu >= 3 ? 'evoluir3' : 'evoluir2');
  return out;
}

export interface SonsDaMudanca { sons: Som[]; habilidades: (EfeitoVisual | null)[] }

/** Tudo o que soa entre dois estados da tela: ações do jogador, luta (apresentação, golpes, habilidades, mortes,
 *  moedas, fim), carrossel, relógio nos últimos segundos e avisos. */
export function sonsDaMudanca(a: EstadoTela, b: EstadoTela): SonsDaMudanca {
  const sons: Som[] = [];
  const habilidades: (EfeitoVisual | null)[] = [];
  const pa = a.partida, pb = b.partida;
  if (!pa || !pb || pa.semente !== pb.semente) return { sons, habilidades };
  const ja = pa.jogadores.find(j => j.id === pa.voce);
  const jb = pb.jogadores.find(j => j.id === pb.voce);
  if (ja && jb && ja !== jb) sons.push(...sonsDoJogador(ja, jb, pa.estagio === pb.estagio && pa.rodada === pb.rodada));

  // luta
  const ra = a.reproducao, rb = b.reproducao;
  if (rb && (!ra || ra.resultado !== rb.resultado) && !rb.comecou) sons.push('clash');
  if (rb && ra?.resultado === rb.resultado) {
    if (!ra.comecou && rb.comecou && !rb.acabou) sons.push('luta');
    const g = rb.resultado.gravacao;
    // pular a luta não despeja os golpes que faltavam
    if (g && rb.comecou && rb.t > ra.t && rb.t - ra.t < 1) {
      const evs = eventosEntre(g, ra.t, rb.t);
      for (const { ev } of evs) {
        if (ev.tipo === 'dano') sons.push(ev.critico ? 'critico' : 'golpe');
        else if (ev.tipo === 'morte') sons.push('morte');
        else if (ev.tipo === 'moeda') sons.push('moeda');
        else if (ev.tipo === 'habilidade') {
          const v = eventosEntre(g, ev.t - 0.001, ev.t + 0.15).find(x => x.ev.tipo === 'visual' && x.ev.de === ev.de);
          habilidades.push(v?.ev.tipo === 'visual' ? v.ev.efeito : null);
        }
      }
    }
    if (rb.acabou && !ra.acabou) {
      const v = rb.resultado.vencedor;
      sons.push(v === 'a' ? 'vitoria' : v === 'b' ? 'derrota' : 'empate');
    }
  }

  // carrossel
  const ca = a.carrossel, cb = b.carrossel;
  if (!ca && cb) sons.push('abrir');
  if (cb && !ca?.podePegar && cb.podePegar) sons.push('carrosselVez');
  if (ca && cb && !ca.opcoes.some(o => o.pegou === pa.voce) && cb.opcoes.some(o => o.pegou === pb.voce)) sons.push('carrosselPegou');

  // relógio
  if (b.relogio != null && b.relogio !== a.relogio && b.relogio > 0 && b.relogio <= 5) sons.push(b.relogio <= 3 ? 'relogioFim' : 'relogio');

  // aviso de algo que não deu (o "levou ao acaso" do carrossel não é erro)
  if (b.aviso && b.aviso !== a.aviso && !/^Você levou/.test(b.aviso)) sons.push('erro');
  return { sons, habilidades };
}

/** Liga os sons na tela: prepara o áudio (só começa depois do primeiro gesto), segue o volume da configuração, toca o
 *  que muda a cada estado e um clique discreto nos botões da aba. */
export function useSons(e: EstadoTela): void {
  const antes = useRef<EstadoTela | null>(null);
  useEffect(() => { prepararAudio(); }, []);
  useEffect(() => { definirVolume(e.config.volume); }, [e.config.volume]);
  useEffect(() => {
    const a = antes.current;
    antes.current = e;
    if (!a || a === e) return;
    const m = sonsDaMudanca(a, e);
    for (const s of new Set(m.sons)) tocar(s);
    for (const h of m.habilidades) tocarHabilidade(h);
  }, [e]);
  useEffect(() => {
    const el = document.getElementById('autobatalha');
    if (!el) return;
    const clique = (ev: MouseEvent) => {
      const t = ev.target instanceof Element ? ev.target.closest('.btn, .ab-chip, .seg button, .ab-info-aba, .ab-ico') : null;
      if (t && !t.matches(':disabled')) tocar('clique');
    };
    el.addEventListener('click', clique);
    return () => el.removeEventListener('click', clique);
  }, []);
}
