import { useEffect, useMemo } from 'react';
import { app, label, useApp } from '../../state/app';
import { Segmented } from '../../components/Controls';
import { Card } from '../../components/Card';
import { GRUPOS, SUBMODOS, grupoDe, type Grupo, type Submodo } from '../../adivinha/grupos';
import { pistas } from '../../adivinha/comparar';
import { emojisVisiveis } from '../../adivinha/emoji';
import { dataBR, msAteAmanha, relogio } from '../../adivinha/dia';
import { chaveDe, media, sequenciaAtual, type Rodada } from '../../adivinha/placar';
import { estadoGrupo, pedirGrupo, poolAtual, useDadosAdivinha } from '../../adivinha/dados';
import { chutar, desistir, escolher, jogoAtual, proximo, salvoAtual, sessaoLivre, useSolo, type JogoSolo } from '../../adivinha/solo';
import type { AdvItem } from '../../adivinha/pool';
import { CampoChute, EscolhaGrupo, Errados, Legenda, LinhaEmoji, QuadroImagem, Revelado, TabelaClassico } from './comum';
import { useAgora, useHoje } from './relogio';

const RODADAS: { value: Rodada; label: string }[] = [{ value: 'dia', label: 'Desafio do dia' }, { value: 'livre', label: 'Livre' }];
const DICA: Record<Submodo, string> = {
  classico: 'Cada chute mostra o que ele tem em comum com o personagem: verde é igual, amarelo é em parte, vermelho é diferente.',
  imagem: 'A imagem começa com zoom e desfocada; cada chute errado afasta e clareia um pouco.',
  emoji: 'Começa com 1 emoji; cada chute errado revela mais um.',
};
const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const chutesTxt = (n: number) => `${n} ${n === 1 ? 'chute' : 'chutes'}`;

/**
 * Aba Adivinha, sozinho: escolher a franquia, o submodo (Clássico, Imagem, Emoji) e o desafio do dia (o mesmo
 * personagem pra todo mundo) ou o livre (um atrás do outro). Só monta o conteúdo com a aba aberta.
 */
export function Adivinha() {
  return <section id="adivinha" hidden={app.mode !== 'adivinha'}>{app.mode === 'adivinha' && <Conteudo />}</section>;
}

function Conteudo() {
  useApp();
  useDadosAdivinha();
  const s = useSolo();
  const g = grupoDe(s.grupo) ?? (GRUPOS[0] as Grupo);
  useEffect(() => { void pedirGrupo(g); }, [g]);
  const est = estadoGrupo(g);
  const pool = poolAtual(g, s.submodo, app.lists);
  const temLista = g.frs.some(fr => app.lists[fr]?.length);
  let aviso = '';
  if (!temLista) aviso = g.frs.some(fr => app.st[fr] === 'carregando') ? `Carregando a lista de ${g.rotulo}…` : `Não consegui carregar a lista de ${g.rotulo}.`;
  // espera tudo do grupo chegar: com metade da lista, o "do dia" sairia diferente do de todo mundo
  else if (est.carregando) aviso = `Carregando as informações de ${g.rotulo}…`;
  else if (g.frs.every(fr => est.catalogos[fr] === null)) aviso = `Não consegui carregar as informações de ${g.rotulo}: sem elas não dá pra jogar esta franquia.`;
  else if (s.submodo === 'emoji' && !pool.length) aviso = `${g.rotulo} ainda não tem os emojis prontos, então o Emoji desta franquia fica desligado por enquanto. Jogue o Clássico ou a Imagem.`;
  else if (!pool.length) aviso = `Ninguém de ${g.rotulo} pra adivinhar.`;
  const semEmoji = s.submodo === 'emoji' && pool.length && est.semEmoji.length ? est.semEmoji.map(label) : [];
  return (
    <>
      <div className="panel stack adv-topo" id="advTopo">
        <EscolhaGrupo id="advGrupos" valor={g.id} onChange={grupo => escolher({ grupo })} />
        <div className="adv-config">
          <Segmented id="advSubmodo" ariaLabel="Modo" value={s.submodo} options={SUBMODOS.map(x => ({ value: x.id, label: x.rotulo }))} onChange={submodo => escolher({ submodo })} />
          <Segmented id="advRodada" ariaLabel="Rodada" value={s.rodada} options={RODADAS} onChange={rodada => escolher({ rodada })} />
        </div>
        <p className="adv-dica mute">{DICA[s.submodo]}</p>
      </div>
      {semEmoji.length > 0 && <p className="note" id="advSemEmoji">{semEmoji.join(' e ')} ainda sem emojis: só {g.frs.filter(fr => !est.semEmoji.includes(fr)).map(label).join(' e ')} no Emoji por enquanto.</p>}
      {aviso ? <p className="note" id="advAviso" role="status">{aviso}</p> : <Jogo g={g} pool={pool} />}
    </>
  );
}

function Jogo({ g, pool }: { g: Grupo; pool: readonly AdvItem[] }) {
  const s = useSolo();
  const hoje = useHoje();
  const j = jogoAtual(pool, hoje) as JogoSolo;
  const usados = useMemo(() => new Set(j.chutes), [j.chutes]);
  const fim = j.fim !== null;
  const itens = j.chutes.map(n => pool.find(x => x.name === n)).filter((x): x is AdvItem => !!x).reverse();
  const erros = j.chutes.filter(n => n !== j.alvo.name).length;
  const total = j.alvo.emoji?.length ?? 0;
  return (
    <div className="stack" id="advJogo" data-grupo={g.id} data-submodo={s.submodo} data-rodada={s.rodada}>
      <div className="adv-cab">
        <h2 id="advTitulo">{s.rodada === 'dia' ? 'Desafio do dia' : 'Livre'}</h2>
        <span className="mute">{s.rodada === 'dia' ? `${dataBR(hoje)} · o mesmo personagem pra todo mundo` : 'um personagem atrás do outro'}</span>
        <span className="grow" />
        <span className="mute" id="advContagem">{chutesTxt(j.chutes.length)}</span>
      </div>
      {s.submodo === 'imagem' && <QuadroImagem img={j.alvo.img} semente={j.semente} erros={erros} fim={fim} />}
      {s.submodo === 'emoji' && <LinhaEmoji emojis={(j.alvo.emoji ?? []).slice(0, emojisVisiveis(total, erros, fim))} total={total} />}
      {fim
        ? <Resultado g={g} j={j} pool={pool} hoje={hoje} />
        : <CampoChute key={j.id + ':' + j.alvo.name} id="advChute" pool={pool} usados={usados} foco varias={g.frs.length > 1}
          placeholder={`Digite o nome de um personagem de ${g.rotulo}`} onChute={n => chutar(pool, n, hoje)} />}
      {s.submodo === 'classico'
        ? <TabelaClassico grupo={g} linhas={itens.map(it => ({ chave: it.name, it, pistas: pistas(g, it, j.alvo), certo: it.name === j.alvo.name }))} />
        : <Errados itens={itens.filter(it => it.name !== j.alvo.name).map(it => ({ chave: it.name, it }))} />}
      {s.submodo === 'classico' && itens.length > 0 && <Legenda />}
      {s.rodada === 'livre' && !fim && (
        <div className="adv-acoes"><button className="btn" id="advDesistir" onClick={() => desistir(pool, hoje)}>Desistir e ver quem era</button></div>
      )}
      <Estatisticas g={g} />
    </div>
  );
}

function Resultado({ g, j, pool, hoje }: { g: Grupo; j: JogoSolo; pool: readonly AdvItem[]; hoje: string }) {
  const s = useSolo();
  const acertou = j.fim === 'acertou';
  return (
    <Revelado id="advFim" titulo={acertou ? `Acertou em ${chutesTxt(j.chutes.length)}!` : 'Era este personagem:'}>
      <Card it={j.alvo} index={0} isStatic hideKey />
      {s.rodada === 'dia'
        ? <p>Próximo desafio de {g.rotulo} em <span className="adv-relogio" id="advRelogio"><Contagem /></span></p>
        : <div className="adv-acoes"><button className="btn main big" id="advProximo" autoFocus onClick={() => proximo(pool)}>Próximo personagem</button></div>}
      {s.rodada === 'dia' && <p className="mute" style={{ fontSize: 13 }}>Desafio de {dataBR(hoje)}. Os outros modos e franquias têm o próprio desafio.</p>}
    </Revelado>
  );
}

/** Quanto falta pra meia-noite em Brasília. */
function Contagem() {
  const agora = useAgora();
  return <>{relogio(msAteAmanha(agora))}</>;
}

function Estatisticas({ g }: { g: Grupo }) {
  const s = useSolo();
  const hoje = useHoje();
  if (s.rodada === 'livre') {
    const x = sessaoLivre(g.id, s.submodo);
    return (
      <div className="adv-stats" id="advStats" aria-label="Nesta sessão">
        <div><b>{x.acertos}</b><small>acertos nesta sessão</small></div>
        <div><b>{x.acertos ? fmt(x.chutes / x.acertos) : '–'}</b><small>chutes em média</small></div>
      </div>
    );
  }
  const e = salvoAtual().stats[chaveDe(g.id, s.submodo)];
  const m = media(e);
  return (
    <div className="adv-stats" id="advStats" aria-label="Estatísticas do desafio do dia">
      <div><b data-n="seq">{sequenciaAtual(e, hoje)}</b><small>dias seguidos</small></div>
      <div><b data-n="melhor">{e?.melhor ?? 0}</b><small>melhor sequência</small></div>
      <div><b data-n="jogos">{e?.jogos ?? 0}</b><small>desafios resolvidos</small></div>
      <div><b data-n="media">{m === null ? '–' : fmt(m)}</b><small>chutes em média</small></div>
    </div>
  );
}
