import { Fragment } from 'react';
import type { OnlineConfig, OnlineMode, RoomView } from '../../online/types';
import { host } from '../../online/runtime';
import { app, label } from '../../state/app';
import { KEYS } from '../../sources';
import { DraftConfig } from './Draft';

const MODES: [OnlineMode, string][] = [['duel', 'Duelo'], ['trio', 'Trio'], ['quartet', 'Quarteto'], ['cup', 'Campeonato'], ['draft', 'Draft']];
const SIZES = [8, 16, 32, 64, 128];
/** Modos que já funcionam online. */
export const READY_MODES: OnlineMode[] = ['duel', 'trio', 'quartet', 'cup', 'draft'];

/** Lobby: o host configura a partida; os outros veem a mesma configuração, sem poder mudar. */
export function Lobby({ v }: { v: RoomView }) {
  const isHost = v.me === v.hostId;
  const c = v.cfg;
  const set = (patch: Partial<OnlineConfig>) => { if (isHost) host.config(patch); };
  const frs = KEYS.filter(k => app.avail.includes(k));
  const sel = (id: string, value: string, onChange: (k: string) => void, aria: string) => (
    <select id={id} aria-label={aria} value={value} disabled={!isHost} onChange={e => onChange(e.target.value)}>
      {frs.map(k => <option key={k} value={k}>{label(k)}</option>)}
    </select>
  );
  return (
    <div className="panel stack" id="onLobby">
      <h3 style={{ margin: 0 }}>{isHost ? 'Configure a partida' : 'Configuração da partida'}</h3>
      <div className="seg" role="group" aria-label="Modo">
        {MODES.map(([m, t]) => (
          <button key={m} data-modo={m} className={c.mode === m ? 'on' : ''} disabled={!isHost || !READY_MODES.includes(m)}
            title={READY_MODES.includes(m) ? undefined : 'Em breve'} onClick={() => set({ mode: m })}>{t}</button>
        ))}
      </div>
      {c.mode === 'duel' && (
        <div className="bar">{sel('onDuelA', c.duel[0], k => set({ duel: [k, c.duel[1]] }), 'Franquia da esquerda')} <span className="vsx">VS</span> {sel('onDuelB', c.duel[1], k => set({ duel: [c.duel[0], k] }), 'Franquia da direita')}</div>
      )}
      {c.mode === 'trio' && (
        <div className="bar">
          {sel('onTrio0', c.trio[0], k => set({ trio: [k, c.trio[1], c.trio[2]] }), 'Franquia 1')} <span className="vsx">VS</span>{' '}
          {sel('onTrio1', c.trio[1], k => set({ trio: [c.trio[0], k, c.trio[2]] }), 'Franquia 2')} <span className="vsx">VS</span>{' '}
          {sel('onTrio2', c.trio[2], k => set({ trio: [c.trio[0], c.trio[1], k] }), 'Franquia 3')}
        </div>
      )}
      {c.mode === 'quartet' && (
        <div className="bar">
          {c.quartet.map((fr, i) => (
            <Fragment key={i}>
              {i > 0 && <>{' '}<span className="vsx">VS</span>{' '}</>}
              {sel('onQuartet' + i, fr, k => set({ quartet: c.quartet.map((x, j) => (j === i ? k : x)) as OnlineConfig['quartet'] }), 'Franquia ' + (i + 1))}
            </Fragment>
          ))}
        </div>
      )}
      {c.mode === 'cup' && (
        <div className="stack">
          <label>Participantes <select id="onCupSize" value={c.cup.size} disabled={!isHost} onChange={e => set({ cup: { ...c.cup, size: +e.target.value } })}>
            {SIZES.map(n => <option key={n} value={n}>{n}</option>)}
          </select></label>
          <div className="bar" id="onCupFr">
            {frs.map(k => (
              <label key={k}><input type="checkbox" id={'onCup_' + k} disabled={!isHost} checked={c.cup.frs.includes(k)}
                onChange={e => set({ cup: { ...c.cup, frs: e.target.checked ? KEYS.filter(x => x === k || c.cup.frs.includes(x)) : c.cup.frs.filter(x => x !== k) } })} /> {label(k)}</label>
            ))}
          </div>
          <label><input type="checkbox" id="onCupEven" disabled={!isHost} checked={c.cup.even} onChange={e => set({ cup: { ...c.cup, even: e.target.checked } })} /> Dividir as vagas igualmente entre as franquias</label>
          <label><input type="checkbox" id="onCupMix" disabled={!isHost} checked={c.cup.mix} onChange={e => set({ cup: { ...c.cup, mix: e.target.checked } })} /> Evitar confronto entre a mesma franquia (os pares são refeitos a cada rodada)</label>
        </div>
      )}
      {c.mode === 'draft' && <DraftConfig c={c} isHost={isHost} set={set} frs={frs} />}
      <div className="stack opts">
        <label><input type="checkbox" id="onSecret" disabled={!isHost} checked={c.secret} onChange={e => set({ secret: e.target.checked })} /> Voto secreto (o resultado mostra só a contagem, sem quem votou em quem)</label>
        <label><input type="checkbox" id="onRoulette" disabled={!isHost} checked={c.roulette} onChange={e => set({ roulette: e.target.checked })} /> Roleta nas rodadas (o host pode girar a roleta em vez de esperar a votação)</label>
      </div>
      {isHost
        ? <div><button className="btn main" id="onStart" onClick={host.start}>Começar</button> <span className="mute">{v.players.length < 2 ? 'Mande o link pros amigos entrarem.' : `${v.players.length} jogadores na sala.`}</span></div>
        : <p className="mute" id="onWaiting" style={{ margin: 0 }}>Esperando o host começar a partida…</p>}
    </div>
  );
}
