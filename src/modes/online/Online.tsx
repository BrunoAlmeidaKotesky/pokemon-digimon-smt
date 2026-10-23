import { useEffect, useState } from 'react';
import { app } from '../../state/app';
import { useOnline, hostRoom, joinRoom, leave, dismiss, roomLink } from '../../online/runtime';
import { loadTurn, saveTurn, isValidTurn } from '../../online/config';
import { Players } from './Players';
import { Lobby } from './Lobby';
import { Play } from './Play';

/** Aba Online: entrar ou criar uma sala; dentro da sala, lobby ou partida. */
export function Online() {
  const on = useOnline();
  const inRoom = on.stage === 'host' || on.stage === 'jogador';
  useWakeLock(inRoom && !on.ended);
  return (
    <section id="online" hidden={app.mode !== 'online'}>
      {inRoom || on.ended ? <Room /> : <Entry />}
    </section>
  );
}

function Entry() {
  const on = useOnline();
  const [name, setName] = useState(on.name);
  const [code, setCode] = useState(on.code);
  const busy = on.stage === 'conectando';
  return (
    <div id="onEntry" className="panel stack">
      <h2>Jogar online</h2>
      <p className="mute" style={{ margin: 0 }}>Cada pessoa vota no próprio aparelho. A sala fica no navegador de quem cria: se essa pessoa fechar a página, a sala acaba.</p>
      <label className="field">Seu apelido <input id="onName" maxLength={16} autoComplete="nickname" value={name} onChange={e => setName(e.target.value)} /></label>
      <div className="bar">
        <button className="btn main" id="onCreate" disabled={busy} onClick={() => hostRoom(name)}>Criar sala</button>
        <span className="mute">ou</span>
        <label className="field">Código <input id="onCode" maxLength={4} autoCapitalize="characters" value={code}
          onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} onKeyDown={e => { if (e.key === 'Enter') joinRoom(code, name); }} /></label>
        <button className="btn" id="onJoin" disabled={busy} onClick={() => joinRoom(code, name)}>Entrar</button>
      </div>
      {busy && <p className="mute" id="onBusy" style={{ margin: 0 }}>Conectando…</p>}
      {on.error && <p className="note bad" id="onError" role="alert">{on.error}</p>}
      <Turn />
    </div>
  );
}

/** Lugar pra configurar um servidor TURN, pra redes que bloqueiam a conexão direta. */
function Turn() {
  const saved = loadTurn();
  const urls = (saved?.urls ?? '') as string;
  const [t, setT] = useState({ urls: Array.isArray(urls) ? urls.join(',') : urls, username: saved?.username ?? '', credential: (saved?.credential as string) ?? '' });
  const [ok, setOk] = useState('');
  return (
    <details id="onTurn">
      <summary>Problemas de conexão?</summary>
      <div className="stack" style={{ marginTop: 8 }}>
        <p className="mute" style={{ margin: 0 }}>Se aparecer erro dizendo que a rede bloqueou a conexão direta, tente outra rede (por exemplo, o 4G no lugar do Wi-Fi). O PeerJS já usa um servidor TURN público; se ele não der conta, crie um TURN (Metered, Twilio ou um coturn próprio) e preencha aqui, de preferência em todos os aparelhos.</p>
        <label className="field">URL do TURN <input value={t.urls} placeholder="turn:exemplo.com:3478" onChange={e => setT({ ...t, urls: e.target.value })} /></label>
        <label className="field">Usuário <input value={t.username} onChange={e => setT({ ...t, username: e.target.value })} /></label>
        <label className="field">Senha <input value={t.credential} onChange={e => setT({ ...t, credential: e.target.value })} /></label>
        <div className="bar">
          <button className="btn" onClick={() => {
            const novo = { urls: t.urls.trim(), username: t.username.trim(), credential: t.credential };
            if (!novo.urls) { saveTurn(null); setOk('Removido.'); return; }
            if (!isValidTurn(novo)) { setOk('Confira: a URL começa com turn:, turns: ou stun:, e o TURN precisa de usuário e senha.'); return; }
            saveTurn(novo); setOk('Salvo neste aparelho. Vale na próxima sala que você criar ou entrar.');
          }}>Salvar</button>
          <button className="btn" onClick={() => { saveTurn(null); setT({ urls: '', username: '', credential: '' }); setOk('Removido.'); }}>Limpar</button>
          <span className="mute">{ok}</span>
        </div>
      </div>
    </details>
  );
}

function Room() {
  const on = useOnline();
  const v = on.view;
  const [copied, setCopied] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const link = roomLink(on.code);
  const isHost = on.stage === 'host';
  const share = typeof navigator.share === 'function';
  if (on.ended) {
    return (
      <div id="onRoom" className="stack">
        <div className="note bad" id="onEnded" role="alert"><b>{on.ended}</b></div>
        <div><button className="btn main" onClick={dismiss}>Voltar</button></div>
      </div>
    );
  }
  return (
    <div id="onRoom" className="stack">
      <div className="bar room-bar">
        <h2 style={{ margin: 0 }}>Sala <span id="onRoomCode">{on.code}</span></h2>
        <input className="room-link" readOnly value={link} aria-label="Link da sala" onFocus={e => e.target.select()} />
        <button className="btn" id="onCopy" onClick={() => { navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => {}); }}>{copied ? 'Copiado!' : 'Copiar link'}</button>
        {share && <button className="btn" onClick={() => { navigator.share({ title: 'Quem Você Prefere', text: `Entra na sala ${on.code}!`, url: link }).catch(() => {}); }}>Convidar</button>}
        <span className="grow" />
        {isHost
          ? <button className="btn" id="onEnd" onClick={() => { if (confirmEnd) leave(); else { setConfirmEnd(true); setTimeout(() => setConfirmEnd(false), 3000); } }}>{confirmEnd ? 'Encerrar mesmo?' : 'Encerrar sala'}</button>
          : <button className="btn" id="onLeave" onClick={leave}>Sair</button>}
      </div>
      {on.banner && <p className="note" id="onBanner" role="status">{on.banner}</p>}
      {v?.notice && <p className="note" id="onNotice">{v.notice}</p>}
      {v ? <>
        <Players v={v} />
        {v.phase === 'lobby' ? <Lobby v={v} /> : <Play v={v} />}
      </> : <p className="mute">Esperando o host…</p>}
    </div>
  );
}

/** Mantém a tela do celular acesa enquanto está numa sala (se o navegador deixar). */
function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let vivo = true;
    const pedir = () => { navigator.wakeLock.request('screen').then(l => { if (vivo) lock = l; else l.release(); }, () => {}); };
    const vis = () => { if (document.visibilityState === 'visible') pedir(); };
    pedir();
    document.addEventListener('visibilitychange', vis);
    return () => { vivo = false; document.removeEventListener('visibilitychange', vis); lock?.release().catch(() => {}); };
  }, [on]);
}
