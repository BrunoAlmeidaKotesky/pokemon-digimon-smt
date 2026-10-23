import { useState } from 'react';
import type { RoomView } from '../../online/types';
import { host } from '../../online/runtime';

/** Lista de jogadores: quem está fora do ar, quem já votou e, pro host, o botão de remover (com confirmação). */
export function Players({ v }: { v: RoomView }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const isHost = v.me === v.hostId;
  const voting = !!v.vote && !v.vote.result;
  const draft = v.game?.mode === 'draft' && v.game.step === 'pick' ? v.game : null;
  const estado = (id: string) => draft?.progress.find(p => p.id === id)?.state;
  return (
    <ul className="chips" id="onPlayers" aria-label="Jogadores">
      {v.players.map(p => (
        <li key={p.id} className={'chip' + (p.online ? '' : ' off') + (voting && p.voted ? ' voted' : '')} data-id={p.id} data-nome={p.name}>
          <span className="dot" aria-hidden="true" />
          <span className="nm">{p.name}</span>
          {p.host && <span className="tag">host</span>}
          {p.id === v.me && <span className="tag">você</span>}
          {!p.online && <span className="tag off">fora do ar</span>}
          {voting && <span className="tag vt">{p.voted ? '✓ votou' : 'votando…'}</span>}
          {draft && estado(p.id) && <span className={'tag dr ' + estado(p.id)}>{estado(p.id) === 'pronto' ? '✓ pronto' : estado(p.id) === 'pulado' ? 'fora da rodada' : 'escolhendo…'}</span>}
          {isHost && !p.host && (
            <button className="x" title={`Remover ${p.name}`} aria-label={`Remover ${p.name}`}
              onClick={() => { if (confirm === p.id) { host.kick(p.id); setConfirm(null); } else { setConfirm(p.id); setTimeout(() => setConfirm(c => (c === p.id ? null : c)), 3000); } }}>
              {confirm === p.id ? 'remover?' : '×'}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
