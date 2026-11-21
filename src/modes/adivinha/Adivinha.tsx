import { useEffect, useMemo } from 'react';
import { app, useApp } from '../../state/app';
import { Segmented } from '../../components/Controls';
import { Card } from '../../components/Card';
import { ETAPAS, GRUPOS, SUBMODOS, grupoDe, rotuloSubmodo, type Grupo, type Submodo } from '../../adivinha/grupos';
import { pistas } from '../../adivinha/comparar';
import { emojisVisiveis } from '../../adivinha/emoji';
import { dataBR, msAteAmanha, relogio } from '../../adivinha/dia';
import { chaveDe, chavePercurso, media, sequenciaAtual, type Escolha, type Rodada } from '../../adivinha/placar';
import { etapaSeguinte } from '../../adivinha/percurso';
import { estadoGrupo, pedirEmojis, pedirGrupo, poolAtual, useDadosAdivinha } from '../../adivinha/dados';
import {
  alternarEtapa, chutar, comDados, desistir, escolher, franquiaSeguinte, irParaFranquia, percursoDe, proximaEtapa, proximo,
  mudarRecorte, recomecarCiclo, recorteDe, salvoAtual, sessaoLivre, tela, useSolo, verEtapa, type Pools, type Tela,
} from '../../adivinha/solo';
import type { AdvItem } from '../../adivinha/pool';
import { CampoChute, EscolhaGrupo, EscolhaRecorte, Errados, Legenda, LinhaEmoji, QuadroImagem, Revelado, TabelaClassico } from './comum';
import { useAgora, useHoje } from './relogio';

const RODADAS: { value: Rodada; label: string }[] = [{ value: 'dia', label: 'Desafio do dia' }, { value: 'livre', label: 'Livre' }];
const ESCOLHAS: { value: Escolha; label: string }[] = [...SUBMODOS.map(s => ({ value: s.id as Escolha, label: s.rotulo })), { value: 'todos', label: 'Todos' }];
const DICA: Record<Submodo, string> = {
  classico: 'Cada chute mostra o que ele tem em comum com o personagem: verde é igual, amarelo é em parte, vermelho é diferente.',
  imagem: 'Um pedaço nítido da arte; cada chute errado abre um pouco mais da imagem.',
  blur: 'A imagem começa com zoom e desfocada; cada chute errado afasta e clareia um pouco.',
  emoji: 'Começa com 1 emoji; cada chute errado revela mais um.',
};
const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const chutesTxt = (n: number) => `${n} ${n === 1 ? 'chute' : 'chutes'}`;
/** Etapas com dados de uma franquia qualquer (pra pular as feitas): sem arquivo de emojis, sem Emoji. */
const dadosDe = (g: Grupo): Submodo[] => {
  const e = estadoGrupo(g);
  return ETAPAS.filter(s => s !== 'emoji' || e.semEmoji.length < g.frs.length);
};

/**
 * Aba Adivinha, sozinho: escolher a franquia e jogar o desafio do dia (percurso Clássico → Imagem → Blur → Emoji, o
 * mesmo personagem pra todo mundo em cada etapa) ou o livre (um submodo solto, ou "Todos" em ciclo). Só monta o
 * conteúdo com a aba aberta.
 */
export function Adivinha() {
  return <section id="adivinha" hidden={app.mode !== 'adivinha'}>{app.mode === 'adivinha' && <Conteudo />}</section>;
}

function Conteudo() {
  useApp();
  useDadosAdivinha();
  const s = useSolo();
  const hoje = useHoje();
  const g = grupoDe(s.grupo) ?? (GRUPOS[0] as Grupo);
  useEffect(() => { void pedirGrupo(g); }, [g]);
  const est = estadoGrupo(g);
  // o recorte (gerações, partes) vale só no livre: o dia é o mesmo personagem pra todo mundo
  const livre = s.rodada === 'livre';
  const recorte = livre ? recorteDe(g.id) : null;
  const pools: Pools = {
    classico: poolAtual(g, 'classico', app.lists, recorte), imagem: poolAtual(g, 'imagem', app.lists, recorte),
    blur: poolAtual(g, 'blur', app.lists, recorte), emoji: poolAtual(g, 'emoji', app.lists, recorte),
  };
  const temLista = g.frs.some(fr => app.lists[fr]?.length);
  const percurso = s.rodada === 'dia' || s.submodo === 'todos';
  // espera tudo do grupo chegar: com metade da lista, o "do dia" sairia diferente do de todo mundo
  const pronto = temLista && !est.carregando && !g.frs.every(fr => est.catalogos[fr] === null);
  const t = pronto ? tela(pools, hoje) : null;
  let aviso = '';
  if (!temLista) aviso = g.frs.some(fr => app.st[fr] === 'carregando') ? `Carregando a lista de ${g.rotulo}…` : `Não consegui carregar a lista de ${g.rotulo}.`;
  else if (est.carregando) aviso = `Carregando as informações de ${g.rotulo}…`;
  else if (!pronto) aviso = `Não consegui carregar as informações de ${g.rotulo}: sem elas não dá pra jogar esta franquia.`;
  else if (!t && s.submodo === 'emoji') aviso = `${g.rotulo} ainda não tem os emojis prontos, então o Emoji desta franquia fica desligado por enquanto. Jogue o Clássico, a Imagem ou o Blur.`;
  else if (!t) aviso = `Ninguém de ${g.rotulo} pra adivinhar.`;
  const dados = comDados(pools);
  const desligadas = ETAPAS.filter(e => !s.etapas.includes(e));
  const semDados = pronto ? ETAPAS.filter(e => s.etapas.includes(e) && !dados.includes(e)) : [];
  return (
    <>
      <div className="panel stack adv-topo" id="advTopo">
        <EscolhaGrupo id="advGrupos" valor={g.id} onChange={grupo => escolher({ grupo })} />
        <div className="adv-config">
          <Segmented id="advRodada" ariaLabel="Rodada" value={s.rodada} options={RODADAS} onChange={rodada => escolher({ rodada })} />
          {s.rodada === 'livre' && <Segmented id="advSubmodo" ariaLabel="Modo" value={s.submodo} options={ESCOLHAS} onChange={submodo => escolher({ submodo })} />}
        </div>
        {percurso && (
          <div className="adv-etapas" id="advEtapas" role="group" aria-label="Etapas do percurso">
            <span className="mute">{s.rodada === 'dia' ? 'Etapas do percurso:' : 'Etapas do ciclo:'}</span>
            {ETAPAS.map(e => {
              const on = s.etapas.includes(e);
              return (
                <button key={e} type="button" data-etapa={e} aria-pressed={on} className={'adv-etapa-tg' + (on ? ' on' : '')}
                  disabled={on && s.etapas.length === 1} title={on && s.etapas.length === 1 ? 'Pelo menos uma etapa fica ligada' : on ? 'Tirar do percurso' : 'Pôr no percurso'}
                  onClick={() => alternarEtapa(pools, hoje, e)}>
                  <span className="ck" aria-hidden="true">{on ? '✓' : ''}</span>{rotuloSubmodo(e)}
                </button>
              );
            })}
          </div>
        )}
        {percurso && (desligadas.length > 0 || semDados.length > 0) && (
          <p className="adv-dica" id="advFora">
            Fora do {s.rodada === 'dia' ? 'percurso' : 'ciclo'}: {[...desligadas.map(e => `${rotuloSubmodo(e)} (desligado)`), ...semDados.map(e => `${rotuloSubmodo(e)} (sem ${e === 'emoji' ? 'emojis' : 'dados'} de ${g.rotulo})`)].join(', ')}.
            {s.rodada === 'dia' && ' O dia conta quando as etapas ligadas terminam.'}
          </p>
        )}
        {g.recorte && (
          <EscolhaRecorte id="advRecorte" grupo={g} ligados={recorteDe(g.id)} disabled={!livre} onMudar={r => mudarRecorte(g.id, r)}
            contagem={livre && pronto ? pools[t?.sub ?? 'classico'].length : undefined}
            nota={livre ? undefined : `No desafio do dia entra ${g.rotulo} inteiro, porque é o mesmo personagem pra todo mundo. A escolha de ${g.recorte.rotulo.toLowerCase()} vale no Livre.`} />
        )}
        {t && <p className="adv-dica mute">{DICA[t.sub]}</p>}
      </div>
      {aviso ? <p className="note" id="advAviso" role="status">{aviso}</p> : t && <Jogo g={g} pools={pools} t={t} hoje={hoje} />}
    </>
  );
}

function Jogo({ g, pools, t, hoje }: { g: Grupo; pools: Pools; t: Tela; hoje: string }) {
  const j = t.jogo, pool = pools[t.sub];
  const usados = useMemo(() => new Set(j.chutes), [j.chutes]);
  const fim = j.fim !== null;
  const itens = j.chutes.map(n => pool.find(x => x.name === n)).filter((x): x is AdvItem => !!x).reverse();
  const erros = j.chutes.filter(n => n !== j.alvo.name).length;
  const total = j.alvo.emoji?.length ?? 0;
  const pos = t.etapas.indexOf(t.sub);
  return (
    <div className="stack" id="advJogo" data-grupo={g.id} data-submodo={t.sub} data-modo={t.modo}>
      <div className="adv-cab">
        <h2 id="advTitulo">{t.modo === 'dia' ? 'Desafio do dia' : t.modo === 'todos' ? 'Livre · Todos' : 'Livre'}</h2>
        <span className="mute">
          {t.modo === 'dia' ? `${dataBR(hoje)} · o mesmo personagem pra todo mundo` : t.modo === 'todos' ? 'um personagem por etapa, em ciclo' : 'um personagem atrás do outro'}
        </span>
        <span className="grow" />
        <span className="mute" id="advContagem">{chutesTxt(j.chutes.length)}</span>
      </div>
      {t.modo !== 'livre' && <Trilha t={t} pools={pools} hoje={hoje} />}
      {t.modo !== 'livre' && <p className="adv-etapa-txt" id="advEtapa">Etapa {pos + 1} de {t.etapas.length}: <b>{rotuloSubmodo(t.sub)}</b></p>}
      {(t.sub === 'imagem' || t.sub === 'blur') && <QuadroImagem modo={t.sub} img={j.alvo.img} semente={j.semente} erros={erros} fim={fim} />}
      {t.sub === 'emoji' && <LinhaEmoji emojis={(j.alvo.emoji ?? []).slice(0, emojisVisiveis(total, erros, fim))} total={total} />}
      {fim
        ? <Resultado g={g} t={t} pools={pools} hoje={hoje} />
        : <CampoChute key={`${j.id}:${j.alvo.name}:${j.ciclo ?? 0}`} id="advChute" pool={pool} usados={usados} foco varias={g.frs.length > 1}
          placeholder={`Digite o nome de um personagem de ${g.rotulo}`} onChute={n => chutar(pools, n, hoje)} />}
      {t.sub === 'classico'
        ? <TabelaClassico grupo={g} linhas={itens.map(it => ({ chave: it.name, it, pistas: pistas(g, it, j.alvo), certo: it.name === j.alvo.name }))} />
        : <Errados itens={itens.filter(it => it.name !== j.alvo.name).map(it => ({ chave: it.name, it }))} />}
      {t.sub === 'classico' && <Legenda />}
      {t.modo !== 'dia' && !fim && (
        <div className="adv-acoes"><button className="btn" id="advDesistir" onClick={() => desistir(pools, hoje)}>Desistir e ver quem era</button></div>
      )}
      <Estatisticas g={g} t={t} hoje={hoje} />
    </div>
  );
}

/** Etapas do percurso (dia: feitas, a da vez e as trancadas; dá pra rever as feitas) ou do ciclo do Todos. */
function Trilha({ t, pools, hoje }: { t: Tela; pools: Pools; hoje: string }) {
  const p = t.percurso;
  return (
    <ol className="adv-trilha" id="advPercurso" aria-label={t.modo === 'dia' ? 'Percurso do dia' : 'Ciclo'}>
      {t.etapas.map((e, i) => {
        const et = p?.etapas.find(x => x.sub === e);
        const feita = p ? !!et?.feita : i < t.etapas.indexOf(t.sub) || (e === t.sub && t.jogo.fim !== null);
        const atual = p ? p.atual === e : e === t.sub;
        const aberta = !p || feita || atual;
        const estado = feita ? 'feita' : atual ? 'atual' : 'trancada';
        return (
          <li key={e} data-etapa={e} data-estado={estado} className={estado + (e === t.sub ? ' vista' : '')}>
            <button type="button" disabled={!p || !aberta} onClick={() => verEtapa(pools, hoje, e)} aria-current={e === t.sub ? 'step' : undefined}>
              <span className="n" aria-hidden="true">{feita ? '✓' : !aberta ? '🔒' : i + 1}</span>
              <span>{rotuloSubmodo(e)}</span>
              {feita && et && <small>{chutesTxt(et.chutes)}</small>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Resultado({ g, t, pools, hoje }: { g: Grupo; t: Tela; pools: Pools; hoje: string }) {
  const j = t.jogo;
  const acertou = j.fim === 'acertou';
  const p = t.percurso;
  const completo = t.modo === 'dia' && !!p?.completo;
  const ultimaTodos = t.modo === 'todos' && !etapaSeguinte(t.etapas, t.sub);
  // pra pular as franquias já feitas, precisa saber quais têm Emoji
  useEffect(() => { if (completo) GRUPOS.forEach(x => x.frs.forEach(fr => void pedirEmojis(fr))); }, [completo]);
  const seguinte = completo || ultimaTodos ? franquiaSeguinte(x => percursoDe(x, hoje, dadosDe(grupoDe(x) as Grupo)).completo) : null;
  const prox = t.modo === 'dia' ? p?.atual : etapaSeguinte(t.etapas, t.sub);
  return (
    <Revelado id="advFim" titulo={acertou ? `Acertou em ${chutesTxt(j.chutes.length)}!` : 'Era este personagem:'}>
      <Card it={j.alvo} index={0} isStatic hideKey />
      {t.modo === 'livre' && <div className="adv-acoes"><button className="btn main big" id="advProximo" autoFocus onClick={() => proximo(pools, hoje)}>Próximo personagem</button></div>}
      {t.modo !== 'livre' && prox && (
        <div className="adv-acoes"><button className="btn main big" id="advProximaEtapa" autoFocus onClick={() => proximaEtapa(pools, hoje)}>Próxima etapa: {rotuloSubmodo(prox)}</button></div>
      )}
      {completo && p && (
        <>
          <p id="advPercursoFeito"><b>Percurso de {g.rotulo} concluído:</b> {chutesTxt(p.chutes)} em {p.etapas.length} {p.etapas.length === 1 ? 'etapa' : 'etapas'}.</p>
          {seguinte
            ? <div className="adv-acoes"><button className="btn main big" id="advProximaFranquia" autoFocus onClick={() => irParaFranquia(seguinte)}>Próxima franquia: {grupoDe(seguinte)?.rotulo}</button></div>
            : <ResumoDia hoje={hoje} />}
          <p>Próximo desafio em <span className="adv-relogio" id="advRelogio"><Contagem /></span></p>
        </>
      )}
      {ultimaTodos && (
        <>
          <p id="advCicloFeito"><b>Ciclo completo!</b></p>
          <div className="adv-acoes">
            <button className="btn big" id="advRecomecar" onClick={() => recomecarCiclo(pools)}>Recomeçar o ciclo</button>
            {seguinte && <button className="btn main big" id="advProximaFranquia" autoFocus onClick={() => irParaFranquia(seguinte)}>Próxima franquia: {grupoDe(seguinte)?.rotulo}</button>}
          </div>
        </>
      )}
    </Revelado>
  );
}

/** Todas as franquias com o percurso de hoje feito: quantos chutes em cada. */
function ResumoDia({ hoje }: { hoje: string }) {
  const linhas = GRUPOS.map(g => ({ g, p: percursoDe(g.id, hoje, dadosDe(g)) }));
  return (
    <div className="adv-resumo" id="advResumoDia">
      <p><b>Todas as franquias feitas hoje!</b></p>
      <ul>
        {linhas.map(({ g, p }) => (
          <li key={g.id} data-grupo={g.id}><span>{g.rotulo}</span> <span className="mute">{chutesTxt(p.chutes)} em {p.etapas.length} {p.etapas.length === 1 ? 'etapa' : 'etapas'}</span></li>
        ))}
      </ul>
    </div>
  );
}

/** Quanto falta pra meia-noite em Brasília. */
function Contagem() {
  const agora = useAgora();
  return <>{relogio(msAteAmanha(agora))}</>;
}

function Estatisticas({ g, t, hoje }: { g: Grupo; t: Tela; hoje: string }) {
  if (t.modo !== 'dia') {
    const x = sessaoLivre(g.id, t.modo === 'todos' ? 'todos' : t.sub);
    return (
      <div className="adv-stats" id="advStats" aria-label="Nesta sessão">
        <div><b>{x.acertos}</b><small>acertos nesta sessão</small></div>
        <div><b>{x.acertos ? fmt(x.chutes / x.acertos) : '–'}</b><small>chutes em média</small></div>
      </div>
    );
  }
  const s = salvoAtual();
  const e = s.stats[chavePercurso(g.id)];
  const m = media(e), me = media(s.stats[chaveDe(g.id, t.sub)]);
  return (
    <div className="stack" style={{ gap: 4 }}>
      <div className="adv-stats" id="advStats" aria-label="Estatísticas do desafio do dia">
        <div><b data-n="seq">{sequenciaAtual(e, hoje)}</b><small>dias seguidos</small></div>
        <div><b data-n="melhor">{e?.melhor ?? 0}</b><small>melhor sequência</small></div>
        <div><b data-n="jogos">{e?.jogos ?? 0}</b><small>percursos completos</small></div>
        <div><b data-n="media">{m === null ? '–' : fmt(m)}</b><small>chutes por percurso</small></div>
      </div>
      <p className="adv-dica mute" style={{ textAlign: 'center' }} id="advStatsEtapa">
        {me === null ? `${rotuloSubmodo(t.sub)}: nenhum desafio resolvido ainda.` : `${rotuloSubmodo(t.sub)}: média de ${fmt(me)} chutes por desafio.`}
      </p>
    </div>
  );
}
