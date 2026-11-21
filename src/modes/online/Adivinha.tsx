import { useEffect, useMemo, useState } from 'react';
import type { AdivinhaView, OnlineConfig, RoomView } from '../../online/types';
import { host, online, player } from '../../online/runtime';
import { ADV_RODADAS, ADV_TEMPOS, advSettings } from '../../online/adivinha';
import { app, useApp } from '../../state/app';
import { Segmented, Stepper } from '../../components/Controls';
import { Card } from '../../components/Card';
import { SUBMODOS, grupoDe, rotuloSubmodo } from '../../adivinha/grupos';
import { estadoGrupo, pedirGrupo, poolAtual, useDadosAdivinha } from '../../adivinha/dados';
import { CampoChute, EscolhaGrupo, Errados, Legenda, LinhaEmoji, QuadroImagem, Revelado, TabelaClassico } from '../adivinha/comum';
import { useAgora } from '../adivinha/relogio';

const rodadasTxt = (n: number) => `${n} ${n === 1 ? 'rodada' : 'rodadas'}`;
const pontosTxt = (n: number) => `${n} ${n === 1 ? 'ponto' : 'pontos'}`;

/** Lobby do Adivinha: franquia, submodo, rodadas e segundos por vez (só o host muda). */
export function AdivinhaConfig({ c, isHost, set, parte }: { c: OnlineConfig; isHost: boolean; set: (p: Partial<OnlineConfig>) => void; parte: 'franquia' | 'regras' }) {
  useDadosAdivinha();
  const a = advSettings(c.adivinha);
  const g = grupoDe(a.grupo);
  const mudar = (p: Partial<OnlineConfig['adivinha']>) => set({ adivinha: { ...a, ...p } });
  // já baixa catálogo e emojis da franquia escolhida (o host precisa deles pra começar; os outros, pro autocompletar)
  useEffect(() => { if (g) void pedirGrupo(g); }, [g]);
  const est = g ? estadoGrupo(g) : null;
  const semEmoji = a.submodo === 'emoji' && est && !est.carregando && g && est.semEmoji.length === g.frs.length;
  if (parte === 'franquia') {
    return (
      <div className="stack" id="onAdvCfg">
        <EscolhaGrupo id="onAdvGrupos" valor={a.grupo} disabled={!isHost} onChange={grupo => mudar({ grupo })} />
        <p className="mute" style={{ margin: 0, fontSize: 13 }}>O host sorteia um personagem secreto; cada um chuta na sua vez, todo mundo vê as pistas. Quem acertar ganha a rodada.</p>
      </div>
    );
  }
  return (
    <div className="stack" id="onAdvRegras">
      <div className="row-label"><span>Modo</span>
        <Segmented id="onAdvSubmodo" ariaLabel="Modo" value={a.submodo} disabled={!isHost} options={SUBMODOS.map(x => ({ value: x.id, label: x.rotulo }))} onChange={submodo => mudar({ submodo })} />
      </div>
      {semEmoji && <p className="note" id="onAdvSemEmoji" style={{ margin: 0 }}>{g.rotulo} ainda não tem emojis: escolha o Clássico, a Imagem ou o Blur.</p>}
      <div className="row-label"><span>Rodadas</span>
        <Stepper id="onAdvRodadas" ariaLabel="Rodadas" value={a.rodadas} min={ADV_RODADAS.min} max={ADV_RODADAS.max} disabled={!isHost} onChange={rodadas => mudar({ rodadas })} />
      </div>
      <div className="row-label"><span>Tempo por vez</span>
        <Segmented id="onAdvTempo" ariaLabel="Tempo por vez" value={a.tempo} disabled={!isHost} options={ADV_TEMPOS.map(n => ({ value: n, label: `${n} s` }))} onChange={tempo => mudar({ tempo })} />
      </div>
      <p className="mute" style={{ margin: 0, fontSize: 13 }}>Um chute por vez, na ordem da sala. Tempo esgotado passa a vez; quem cair da sala é pulado. Na Imagem, no Blur e no Emoji, cada chute errado (de qualquer um) revela mais.</p>
    </div>
  );
}

/** Resumo do lobby: "Adivinha · LoL · Clássico · 5 rodadas · 40 s". */
export function resumoAdivinha(c: OnlineConfig): string {
  const a = advSettings(c.adivinha);
  return `Adivinha · ${grupoDe(a.grupo)?.rotulo ?? a.grupo} · ${rotuloSubmodo(a.submodo)} · ${rodadasTxt(a.rodadas)} · ${a.tempo} s por vez`;
}

/** Partida: vez e tempo, pistas (tabela, imagem ou emojis), campo de chute, resultado e placar. */
export function AdivinhaPlay({ v }: { v: RoomView }) {
  useApp();
  useDadosAdivinha();
  const g = v.game as AdivinhaView;
  const grupo = grupoDe(g.grupo);
  useEffect(() => { if (grupo) void pedirGrupo(grupo); }, [grupo]);
  const pool = grupo ? poolAtual(grupo, g.submodo, app.lists) : [];
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
        {' · '}<span className="mute">{grupo?.rotulo ?? g.grupo} · {rotuloSubmodo(g.submodo)}</span>
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
  const resta = Math.max(0, g.restante - Math.max(0, agora - online.recebido));
  const seg = Math.ceil(resta / 1000);
  const minha = g.vez === v.me;
  const on = new Map(v.players.map(p => [p.id, p.online] as const));
  return (
    <div className={'adv-vez' + (minha ? ' minha' : '') + (seg <= 5 ? ' pouco' : '')} id="onAdvVez" data-vez={g.vez ?? ''} role="status">
      <p><b id="onAdvVezNome">{minha ? 'Sua vez!' : `Vez de ${nome(g.vez)}`}</b><span className="mute">{minha ? 'um chute' : 'espere a sua vez'}</span><span className="seg-s" id="onAdvTempoResta">{seg} s</span></p>
      <div className="adv-barra" aria-hidden="true"><span style={{ width: `${Math.min(100, (resta / (g.tempo * 1000)) * 100)}%` }} /></div>
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
        <p className="mute">{rodadasTxt(g.rodadas)} de {grupoDe(g.grupo)?.rotulo ?? g.grupo}, modo {rotuloSubmodo(g.submodo)}.</p>
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
