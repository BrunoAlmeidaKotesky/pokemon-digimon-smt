import { useEffect, useMemo, useState } from 'react';
import type { AdivinhaView, OnlineConfig, RoomView } from '../../online/types';
import { host, online, player } from '../../online/runtime';
import { ADV_RODADAS, ADV_TEMPOS, advSettings, franquiaComRecorte, franquiasTxt, modosTxt, tempoTxt } from '../../online/adivinha';
import { app, useApp } from '../../state/app';
import { Segmented, Stepper } from '../../components/Controls';
import { Card } from '../../components/Card';
import { GRUPOS, SUBMODOS, corDoGrupo, grupoDe, rotuloSubmodo, type Grupo, type Submodo } from '../../adivinha/grupos';
import { estadoGrupo, pedirGrupo, poolAtual, useDadosAdivinha } from '../../adivinha/dados';
import { CampoChute, EscolhaRecorte, Errados, Legenda, LinhaEmoji, QuadroImagem, Revelado, TabelaClassico } from '../adivinha/comum';
import { useAgora } from '../adivinha/relogio';

const rodadasTxt = (n: number) => `${n} ${n === 1 ? 'rodada' : 'rodadas'}`;
const pontosTxt = (n: number) => `${n} ${n === 1 ? 'ponto' : 'pontos'}`;

/** Liga ou desliga um valor numa lista, na ordem de `ordem`; o último ligado não sai. */
function alternar<T>(lista: readonly T[], v: T, ordem: readonly T[]): T[] {
  const novo = lista.includes(v) ? lista.filter(x => x !== v) : [...lista, v];
  return novo.length ? ordem.filter(x => novo.includes(x)) : [...lista];
}

/** Lobby do Adivinha: franquias e modos (dá pra marcar vários), rodadas e tempo por vez (só o host muda). */
export function AdivinhaConfig({ c, isHost, set, parte }: { c: OnlineConfig; isHost: boolean; set: (p: Partial<OnlineConfig>) => void; parte: 'franquia' | 'regras' }) {
  useApp();
  useDadosAdivinha();
  const a = advSettings(c.adivinha);
  const grupos = a.grupos.map(grupoDe).filter((g): g is Grupo => !!g);
  // o `recorte` solto é só pra versão antiga: aqui vale `recortes`, e advSettings acerta o resto
  const mudar = (p: Partial<OnlineConfig['adivinha']>) => set({ adivinha: advSettings({ ...a, ...p, recorte: undefined }) });
  // já baixa catálogo e emojis das franquias escolhidas (o host precisa deles pra começar; os outros, pro autocompletar)
  const chave = a.grupos.join(',');
  useEffect(() => { for (const id of chave.split(',')) { const g = grupoDe(id); if (g) void pedirGrupo(g); } }, [chave]);
  const estados = grupos.map(g => ({ g, est: estadoGrupo(g) }));
  const semEmoji = a.submodos.includes('emoji') && estados.every(({ g, est }) => !est.carregando && est.semEmoji.length === g.frs.length);
  const varios = a.grupos.length > 1 || a.submodos.length > 1;
  if (parte === 'franquia') {
    const comRecorte = grupos.filter(g => g.recorte);
    return (
      <div className="stack" id="onAdvCfg">
        <div className="adv-grupos" id="onAdvGrupos" role="group" aria-label="Franquias">
          {GRUPOS.map(g => {
            const on = a.grupos.includes(g.id);
            const ultimo = on && a.grupos.length === 1;
            return (
              <button key={g.id} type="button" role="checkbox" aria-checked={on} data-grupo={g.id} disabled={!isHost || ultimo}
                title={isHost && ultimo ? 'Pelo menos uma franquia fica ligada' : undefined}
                className={'adv-grupo' + (on ? ' on' : '')} style={{ ['--c' as string]: corDoGrupo(g) }}
                onClick={() => mudar({ grupos: alternar(a.grupos, g.id, GRUPOS.map(x => x.id)) })}>
                <span className="dot" aria-hidden="true" />{g.rotulo}
              </button>
            );
          })}
        </div>
        {comRecorte.map((g, i) => (
          <EscolhaRecorte key={g.id} id={i === 0 ? 'onAdvRecorte' : `onAdvRecorte-${g.id}`} grupo={g} ligados={a.recortes[g.id] ?? null} disabled={!isHost}
            onMudar={r => { const recortes = { ...a.recortes }; if (r) recortes[g.id] = r; else delete recortes[g.id]; mudar({ recortes }); }}
            contagem={estadoGrupo(g).carregando ? undefined : poolAtual(g, a.submodo, app.lists, a.recortes[g.id] ?? null).length} />
        ))}
        <p className="mute" style={{ margin: 0, fontSize: 13 }}>
          Marque uma ou mais franquias. O host sorteia um personagem secreto; cada um chuta na sua vez, todo mundo vê as pistas. Quem acertar ganha a rodada.
          {a.grupos.length > 1 && ' Com várias franquias, cada rodada sorteia uma delas.'}
        </p>
      </div>
    );
  }
  return (
    <div className="stack" id="onAdvRegras">
      <div className="row-label"><span>Modos</span>
        <div className="seg" id="onAdvSubmodo" role="group" aria-label="Modos">
          {SUBMODOS.map(x => {
            const on = a.submodos.includes(x.id);
            const ultimo = on && a.submodos.length === 1;
            return (
              <button key={x.id} type="button" role="checkbox" aria-checked={on} data-n={x.id} className={on ? 'on' : ''} disabled={!isHost || ultimo}
                title={isHost && ultimo ? 'Pelo menos um modo fica ligado' : undefined}
                onClick={() => mudar({ submodos: alternar<Submodo>(a.submodos, x.id, SUBMODOS.map(y => y.id)) })}>{x.rotulo}</button>
            );
          })}
        </div>
      </div>
      {semEmoji && <p className="note" id="onAdvSemEmoji" style={{ margin: 0 }}>{grupos.map(g => g.rotulo).join(' e ')} ainda não {grupos.length > 1 ? 'têm' : 'tem'} emojis: desligue o Emoji ou escolha outro modo.</p>}
      <div className="row-label"><span>Rodadas</span>
        <Stepper id="onAdvRodadas" ariaLabel="Rodadas" value={a.rodadas} min={ADV_RODADAS.min} max={ADV_RODADAS.max} disabled={!isHost} onChange={rodadas => mudar({ rodadas })} />
      </div>
      <div className="row-label"><span>Tempo por vez</span>
        <Segmented id="onAdvTempo" ariaLabel="Tempo por vez" value={a.tempo} disabled={!isHost} options={ADV_TEMPOS.map(n => ({ value: n, label: tempoTxt(n) }))} onChange={tempo => mudar({ tempo })} />
      </div>
      <p className="mute" style={{ margin: 0, fontSize: 13 }}>
        Um chute por vez, na ordem da sala. {a.tempo > 0 ? 'Tempo esgotado passa a vez; quem' : 'Sem limite de tempo: a vez só passa com um chute. Quem'} cair da sala é pulado.
        {' '}Na Imagem, no Blur e no Emoji, cada chute errado (de qualquer um) revela mais.
        {varios && a.submodos.length > 1 && ' Com vários modos, as rodadas alternam entre eles, na ordem.'}
      </p>
    </div>
  );
}

/** Resumo do lobby: "Adivinha · LoL + Pokémon · Clássico + Emoji · 5 rodadas · 40 s por vez". */
export function resumoAdivinha(c: OnlineConfig): string {
  const a = advSettings(c.adivinha);
  return `Adivinha · ${franquiasTxt(a)} · ${modosTxt(a.submodos)} · ${rodadasTxt(a.rodadas)} · ${a.tempo > 0 ? `${a.tempo} s por vez` : 'sem limite de tempo'}`;
}

/** Partida: vez e tempo, pistas (tabela, imagem ou emojis), campo de chute, resultado e placar. */
export function AdivinhaPlay({ v }: { v: RoomView }) {
  useApp();
  useDadosAdivinha();
  const g = v.game as AdivinhaView;
  const grupo = grupoDe(g.grupo);
  // já baixa todas as franquias da sala (a da rodada muda), pro autocompletar não esperar
  const todas = (g.grupos?.length ? g.grupos : [g.grupo]).join(',');
  useEffect(() => { for (const id of todas.split(',')) { const x = grupoDe(id); if (x) void pedirGrupo(x); } }, [todas]);
  // o recorte da sala (host antigo não manda: todos)
  const pool = grupo ? poolAtual(grupo, g.submodo, app.lists, g.recorte ?? null) : [];
  const isHost = v.me === v.hostId;
  const aberta = g.passo === 'chute';
  const minha = aberta && g.vez === v.me;
  const nome = (id: string | null) => (id && (v.players.find(p => p.id === id)?.name ?? g.placar.find(p => p.id === id)?.nome)) || '?';
  const usados = useMemo(() => new Set(g.chutes.flatMap(c => (c.alvo ? [c.alvo.name] : []))), [g.chutes]);
  const linhas = g.chutes.map((c, i) => ({ chave: `${g.rodada}:${i}`, it: c.alvo, pistas: c.pistas, certo: c.certo, por: c.por === v.me ? 'você' : c.porNome })).reverse();
  return (
    <div className="stack" id="onAdv" data-passo={g.passo} data-rodada={g.rodada}>
      <p className="draft-round" id="onAdvRodada">
        {g.passo === 'fim' ? 'Placar final' : <>Rodada {g.rodada} de {g.rodadas}</>}
        {' · '}<span className="mute" id="onAdvFranquia">{franquiaComRecorte({ grupo: g.grupo, recorte: g.recorte })} · {rotuloSubmodo(g.submodo)}</span>
      </p>
      {g.passo === 'fim' ? <Final v={v} g={g} /> : (
        <>
          {aberta && <Vez v={v} g={g} nome={nome} />}
          {(g.submodo === 'imagem' || g.submodo === 'blur') && g.imagem && <QuadroImagem modo={g.submodo} img={g.imagem} semente={g.foco} erros={g.erros} fim={!aberta} />}
          {g.submodo === 'emoji' && <LinhaEmoji emojis={g.emoji} total={g.totalEmoji} />}
          {aberta && (
            <CampoChute key={`${g.rodada}`} id="onAdvChute" pool={pool} usados={usados} disabled={!minha} foco={minha} varias={(grupo?.frs.length ?? 1) > 1}
              placeholder={minha ? 'Sua vez: digite o nome de um personagem' : `Vez de ${nome(g.vez)}…`} onChute={n => player.chute(g.rodada, n)} />
          )}
          {g.passo === 'resultado' && g.secreto && (
            <Revelado id="onAdvFim" titulo={g.vencedor ? (g.vencedor === v.me ? 'Você acertou! +1 ponto' : `${nome(g.vencedor)} acertou! +1 ponto`) : 'Ninguém acertou. Era este:'}>
              <Card it={g.secreto} index={0} isStatic hideKey />
              {isHost
                ? <div className="adv-acoes"><button className="btn main big" id="onAdvProxima" onClick={host.next}>{g.rodada >= g.rodadas ? 'Ver o placar final' : 'Próxima rodada'}</button></div>
                : <p className="mute">Esperando {nome(v.hostId)} (host) continuar…</p>}
            </Revelado>
          )}
          {g.submodo === 'classico' && grupo
            ? <TabelaClassico grupo={grupo} linhas={linhas} />
            : <Errados itens={linhas.filter(l => !l.certo).map(l => ({ chave: l.chave, it: l.it, por: l.por }))} />}
          {g.submodo === 'classico' && linhas.some(l => l.it) && <Legenda />}
          {isHost && aberta && <Revelar />}
        </>
      )}
      <Placar g={g} v={v} />
    </div>
  );
}

/** De quem é a vez, ordem e quanto tempo falta (contado a partir da última visão que chegou do host). */
function Vez({ v, g, nome }: { v: RoomView; g: AdivinhaView; nome: (id: string | null) => string }) {
  const agora = useAgora();
  const semLimite = g.tempo <= 0;
  const resta = Math.max(0, g.restante - Math.max(0, agora - online.recebido));
  const seg = Math.ceil(resta / 1000);
  const minha = g.vez === v.me;
  const on = new Map(v.players.map(p => [p.id, p.online] as const));
  return (
    <div className={'adv-vez' + (minha ? ' minha' : '') + (!semLimite && seg <= 5 ? ' pouco' : '')} id="onAdvVez" data-vez={g.vez ?? ''} role="status">
      <p><b id="onAdvVezNome">{minha ? 'Sua vez!' : `Vez de ${nome(g.vez)}`}</b><span className="mute">{minha ? 'um chute' : 'espere a sua vez'}</span><span className="seg-s" id="onAdvTempoResta">{semLimite ? 'sem limite' : `${seg} s`}</span></p>
      {!semLimite && <div className="adv-barra" aria-hidden="true"><span style={{ width: `${Math.min(100, (resta / (g.tempo * 1000)) * 100)}%` }} /></div>}
      <ol className="adv-ordem" aria-label="Ordem">
        {g.ordem.filter(id => on.has(id)).map(id => <li key={id} className={(id === g.vez ? 'vez' : '') + (on.get(id) ? '' : ' off')}>{nome(id)}</li>)}
      </ol>
    </div>
  );
}

/** Host: revela o secreto e fecha a rodada (com confirmação). */
function Revelar() {
  const [certeza, setCerteza] = useState(false);
  return (
    <div className="bar host-ctl">
      <button className="btn" id="onAdvRevelar" title="Mostra quem era e fecha a rodada sem vencedor"
        onClick={() => { if (certeza) { setCerteza(false); host.skip(); } else { setCerteza(true); setTimeout(() => setCerteza(false), 3000); } }}>
        {certeza ? 'Revelar mesmo?' : 'Revelar a resposta'}
      </button>
    </div>
  );
}

function Placar({ g, v }: { g: AdivinhaView; v: RoomView }) {
  const max = Math.max(0, ...g.placar.map(p => p.pontos));
  return (
    <div className="panel stack" id="onAdvPlacar">
      <h3 style={{ margin: 0 }}>Placar</h3>
      <ol className="adv-placar">
        {g.placar.map((p, i) => (
          <li key={p.id} data-nome={p.nome} className={max > 0 && p.pontos === max ? 'lider' : undefined}>
            <span className="pos">{i + 1}º</span><span className="nm">{p.nome}{p.id === v.me && <span className="mute"> (você)</span>}</span><b>{p.pontos}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Final({ v, g }: { v: RoomView; g: AdivinhaView }) {
  const max = Math.max(0, ...g.placar.map(p => p.pontos));
  const lideres = g.placar.filter(p => p.pontos === max && max > 0).map(p => p.nome);
  return (
    <div className="stack">
      <Revelado id="onAdvFinal" titulo={lideres.length ? (lideres.length === 1 ? `${lideres[0]} venceu com ${pontosTxt(max)}!` : `Empate entre ${lideres.join(' e ')}, com ${pontosTxt(max)}!`) : 'Ninguém acertou nenhuma.'}>
        <p className="mute">{rodadasTxt(g.rodadas)} de {(g.grupos?.length ? g.grupos : [g.grupo]).map(id => grupoDe(id)?.rotulo ?? id).join(' + ')}, {(g.submodos?.length ?? 1) > 1 ? 'modos' : 'modo'} {modosTxt(g.submodos?.length ? g.submodos : [g.submodo])}.</p>
        {v.me === v.hostId && <p className="mute" style={{ fontSize: 13 }}>Volte ao lobby pra jogar de novo.</p>}
      </Revelado>
      {g.historico.length > 0 && (
        <div className="panel stack" id="onAdvHistorico">
          <h3 style={{ margin: 0 }}>Rodadas</h3>
          <ol className="adv-hist">
            {g.historico.map(h => (
              <li key={h.rodada} data-rodada={h.rodada}>
                <span className="mute">{h.rodada}.</span> <b>{h.secreto.name}</b>
                <span className="mute">{h.vencedor ? `acertado por ${h.vencedorNome}` : 'ninguém acertou'} · {h.chutes} {h.chutes === 1 ? 'chute' : 'chutes'}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
