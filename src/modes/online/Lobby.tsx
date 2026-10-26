import type { ReactNode } from 'react';
import type { OnlineConfig, OnlineMode, RoomView } from '../../online/types';
import { host, player } from '../../online/runtime';
import { app, label } from '../../state/app';
import { isCustomKey } from '../../customs/model';
import { DraftConfig } from './Draft';
import { useCustoms, mineActions } from '../customs/Customs';
import { CustomEditor, type CustomActions } from '../customs/CustomEditor';
import { Segmented, Switch, FranchiseToggle, SideSelect, Stepper } from '../../components/Controls';
import { RANK_SIZE } from '../../core/rank';

/** Mini desenho de cada modo: cartas lado a lado, chave ou time. */
function ModeIcon({ m }: { m: OnlineMode }) {
  const card = (x: number, y: number, w = 9, h = 12) => <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="1.5" />;
  const body: Record<OnlineMode, ReactNode> = {
    duel: [card(6, 6), card(21, 6)],
    trio: [card(2, 6, 8), card(14, 6, 8), card(26, 6, 8)],
    quartet: [card(8, 2, 9, 7), card(19, 2, 9, 7), card(8, 13, 9, 7), card(19, 13, 9, 7)],
    cup: <path d="M3 4h7v5H3zM3 15h7v5H3zM10 6.5h4v11h-4M14 12h5M19 9.5h7v5h-7" fill="none" strokeWidth="1.6" />,
    draft: [card(4, 9, 8, 11), card(11, 5, 8, 11), card(18, 2, 8, 11), <path key="c" d="M28 15l2.5 2.5L35 12" fill="none" strokeWidth="2" />],
    // pódio: 2º, 1º e 3º lugar
    rank: [card(4, 11, 9, 11), card(14.5, 4, 9, 18), card(25, 15, 9, 7)],
  };
  return <svg className="mode-icon" viewBox="0 0 38 24" aria-hidden="true">{body[m]}</svg>;
}

const MODES: { m: OnlineMode; t: string; d: string }[] = [
  { m: 'duel', t: 'Duelo', d: '2 cartas, quem vence fica' },
  { m: 'trio', t: 'Trio', d: '3 cartas, quem vence fica' },
  { m: 'quartet', t: 'Quarteto', d: '4 cartas, quem vence fica' },
  { m: 'cup', t: 'Campeonato', d: 'mata-mata de 8 a 128' },
  { m: 'draft', t: 'Draft', d: 'cada um monta um time em segredo' },
  { m: 'rank', t: 'Ranking', d: 'monte um top às cegas, um por vez' },
];
const SIZES = [8, 16, 32, 64, 128];
/** Modos que já funcionam online. */
export const READY_MODES: OnlineMode[] = ['duel', 'trio', 'quartet', 'cup', 'draft', 'rank'];
const SIDE_IDS = { duel: ['onDuelA', 'onDuelB'], trio: ['onTrio0', 'onTrio1', 'onTrio2'], quartet: ['onQuartet0', 'onQuartet1', 'onQuartet2', 'onQuartet3'] } as const;

/** Resumo de uma linha da configuração (barra do "Começar"). */
function resumo(c: OnlineConfig): string {
  const vs = (ks: readonly string[]) => ks.map(label).join(' × ');
  switch (c.mode) {
    case 'duel': return `Duelo · ${vs(c.duel)}`;
    case 'trio': return `Trio · ${vs(c.trio)}`;
    case 'quartet': return `Quarteto · ${vs(c.quartet)}`;
    case 'cup': return `Campeonato de ${c.cup.size} · ${c.cup.frs.length} ${c.cup.frs.length === 1 ? 'franquia' : 'franquias'}`;
    case 'draft': return `Draft · ${c.draft.rounds} ${c.draft.rounds === 1 ? 'rodada' : 'rodadas'} · ${c.draft.frs.map(label).join(', ')}`;
    case 'rank': {
      const r = c.rank, n = r.frs.length;
      if (!n) return 'Ranking · marque uma franquia';
      return `Ranking · ${r.mix || n === 1 ? 'top' : n + ' tops'} de ${r.size}${r.mix && n > 1 ? ' misturado' : ''} · ${r.frs.map(label).join(', ')}`;
    }
  }
}

/** Lobby: o host configura a partida em 3 passos (modo, franquias, regras); os outros veem a mesma coisa sem mudar. */
export function Lobby({ v }: { v: RoomView }) {
  const isHost = v.me === v.hostId;
  const c = v.cfg;
  const set = (patch: Partial<OnlineConfig>) => { if (isHost) host.config(patch); };
  const cs = useCustoms();
  // franquias que dá pra escolher: as fixas e as customizadas do host (o host usa as dele; o jogador recebe as do host)
  const frs = isHost ? app.avail : [...app.avail.filter(k => !isCustomKey(k)), ...(cs.getRoom() ?? []).map(f => f.key)];
  const sides = c.mode === 'duel' || c.mode === 'trio' || c.mode === 'quartet' ? c[c.mode] : null;
  const setSide = (i: number, k: string) => {
    if (c.mode === 'duel') set({ duel: c.duel.map((x, j) => (j === i ? k : x)) as OnlineConfig['duel'] });
    if (c.mode === 'trio') set({ trio: c.trio.map((x, j) => (j === i ? k : x)) as OnlineConfig['trio'] });
    if (c.mode === 'quartet') set({ quartet: c.quartet.map((x, j) => (j === i ? k : x)) as OnlineConfig['quartet'] });
  };
  return (
    <div className="lobby stack" id="onLobby">
      {!isHost && <p className="note" id="onWaiting" style={{ margin: 0 }}>Esperando o host começar a partida… A configuração aparece aqui conforme ele escolhe.</p>}

      <section className="panel stack lobby-step">
        <h3 className="step"><span>1</span>Modo</h3>
        <div className="modes" role="radiogroup" aria-label="Modo">
          {MODES.map(({ m, t, d }) => (
            <button key={m} type="button" role="radio" aria-checked={c.mode === m} data-modo={m} className={'mode-card' + (c.mode === m ? ' on' : '')}
              disabled={!isHost || !READY_MODES.includes(m)} onClick={() => set({ mode: m })}>
              <ModeIcon m={m} />
              <b>{t}</b>
              <small>{d}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel stack lobby-step">
        <h3 className="step"><span>2</span>Franquias</h3>
        {sides && (
          <div className={'sides n' + sides.length}>
            {sides.map((k, i) => <SideSelect key={i} id={SIDE_IDS[c.mode as keyof typeof SIDE_IDS][i]!} n={i + 1} value={k} frs={frs} disabled={!isHost} onChange={x => setSide(i, x)} />)}
          </div>
        )}
        {c.mode === 'cup' && (
          <div className="stack">
            <div className="row-label"><span>Participantes</span>
              <Segmented id="onCupSize" ariaLabel="Participantes" value={c.cup.size} disabled={!isHost}
                options={SIZES.map(n => ({ value: n, label: n }))} onChange={n => set({ cup: { ...c.cup, size: n } })} />
            </div>
            <div className="fr-toggles" id="onCupFr">
              {frs.map(k => (
                <FranchiseToggle key={k} k={k} id={'onCup_' + k} disabled={!isHost} checked={c.cup.frs.includes(k)}
                  onChange={on => set({ cup: { ...c.cup, frs: on ? frs.filter(x => x === k || c.cup.frs.includes(x)) : c.cup.frs.filter(x => x !== k) } })} />
              ))}
            </div>
            <Switch id="onCupEven" title="Dividir as vagas igualmente" checked={c.cup.even} disabled={!isHost} onChange={on => set({ cup: { ...c.cup, even: on } })}>
              Cada franquia marcada recebe o mesmo número de participantes.
            </Switch>
            <Switch id="onCupMix" title="Evitar confronto da mesma franquia" checked={c.cup.mix} disabled={!isHost} onChange={on => set({ cup: { ...c.cup, mix: on } })}>
              Os pares são refeitos a cada rodada.
            </Switch>
          </div>
        )}
        {c.mode === 'draft' && <DraftConfig c={c} isHost={isHost} set={set} frs={frs} />}
        {c.mode === 'rank' && (
          <div className="stack" id="onRankCfg">
            <div className="row-label"><span>Tamanho do top</span>
              <Stepper id="onRankSize" ariaLabel="Tamanho do top" value={c.rank.size} min={RANK_SIZE.min} max={RANK_SIZE.max} disabled={!isHost}
                onChange={n => set({ rank: { ...c.rank, size: n } })} />
            </div>
            <div className="fr-toggles" id="onRankFr">
              {frs.map(k => (
                <FranchiseToggle key={k} k={k} id={'onRank_' + k} disabled={!isHost} checked={c.rank.frs.includes(k)}
                  onChange={on => set({ rank: { ...c.rank, frs: on ? frs.filter(x => x === k || c.rank.frs.includes(x)) : c.rank.frs.filter(x => x !== k) } })} />
              ))}
            </div>
            <Switch id="onRankMix" title="Misturar as franquias" checked={c.rank.mix} disabled={!isHost} onChange={on => set({ rank: { ...c.rank, mix: on } })}>
              Um top só, com as vagas divididas igualmente. Desligado, cada franquia tem o próprio top, um depois do outro.
            </Switch>
            <p className="mute" style={{ margin: 0, fontSize: 13 }}>Aparece um personagem por vez e todos votam na posição dele, sem saber quem vem depois. A posição mais votada fica com ele, travada.</p>
          </div>
        )}
      </section>

      <section className="panel stack lobby-step">
        <h3 className="step"><span>3</span>Regras</h3>
        <Switch id="onSecret" title="Voto secreto" checked={c.secret} disabled={!isHost} onChange={on => set({ secret: on })}>
          O resultado mostra só a contagem, sem quem votou em quem. Vale pra todas as votações, inclusive as do Draft.
        </Switch>
        <Switch id="onRoulette" title="Roleta nas rodadas" checked={c.roulette} disabled={!isHost} onChange={on => set({ roulette: on })}>
          O host pode girar a roleta em vez de esperar a votação. Empate sempre vai pra roleta, ligado ou não.
        </Switch>
      </section>

      <CustomsPanel v={v} />

      <div className="start-bar" id="onStartBar">
        <span className="resumo"><b>{resumo(c)}</b><small className="mute">{v.players.length} {v.players.length === 1 ? 'jogador' : 'jogadores'}{v.players.length < 2 && isHost ? ' · mande o link pros amigos entrarem' : ''}</small></span>
        {isHost && <button className="btn main big" id="onStart" onClick={host.start}>Começar</button>}
      </div>
    </div>
  );
}

/** Pedidos do jogador ao host (adicionar imagens e mudar rótulos), quando o host deixa. */
const guestActions: CustomActions = {
  manage: null,
  edit: {
    addItems: (key, items) => player.custom({ op: 'add', key, items }),
    renameItem: (key, id, name) => player.custom({ op: 'label', key, id, name }),
  },
};

/** Franquias customizadas da sala: o host cria e edita (as mesmas da aba Personalizar); os jogadores veem e,
 * se o host deixar, adicionam imagens e mudam rótulos. Tudo só durante a sessão. */
function CustomsPanel({ v }: { v: RoomView }) {
  const isHost = v.me === v.hostId;
  const cs = useCustoms();
  const list = isHost ? cs.getMine() : cs.getRoom() ?? [];
  if (!isHost && !list.length) return null;
  return (
    <details className="panel lobby-step" id="onCustoms" open={isHost || list.length > 0}>
      <summary><h3 className="step"><span>4</span>Franquias personalizadas <small className="mute">({list.length})</small></h3></summary>
      <div className="stack" style={{ marginTop: 8 }}>
        {isHost
          ? <>
            <p className="mute" style={{ margin: 0 }}>Grupos de imagens que viram franquias nesta sala (são os mesmos da aba Personalizar). Ficam só enquanto a sala existir.</p>
            <Switch id="onCustomEdit" title="Jogadores podem adicionar imagens e mudar rótulos" checked={v.cfg.customEdit} onChange={on => host.config({ customEdit: on })}>
              Criar e apagar grupos continua só com você.
            </Switch>
          </>
          : <p className="mute" style={{ margin: 0 }}>{v.cfg.customEdit ? 'O host deixou você adicionar imagens e mudar os rótulos.' : 'Só o host muda estas franquias.'}</p>}
        <CustomEditor list={list} actions={isHost ? mineActions : v.cfg.customEdit ? guestActions : { manage: null, edit: null }} idPrefix="onCst" />
      </div>
    </details>
  );
}
