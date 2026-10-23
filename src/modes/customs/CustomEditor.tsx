import { useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
import type { CustomFranchise } from '../../customs/types';
import { CUSTOM_LIMITS } from '../../customs/types';
import { shrinkImage, labelFromFile, imagesFromDataTransfer } from '../../customs/image';

/** O que o editor pode fazer: criar/apagar grupos (dono), adicionar imagens e mudar rótulos (dono ou convidado). */
export interface CustomActions {
  /** criar, renomear e apagar grupos, e apagar imagens (null = não pode) */
  manage: null | {
    add: (label: string) => void;
    rename: (key: string, label: string) => void;
    remove: (key: string) => void;
    removeItem: (key: string, id: string) => void;
  };
  /** adicionar imagens e mudar rótulos (null = só ver) */
  edit: null | {
    addItems: (key: string, items: { name: string; data: string }[]) => void;
    renameItem: (key: string, id: string, name: string) => void;
  };
}

/** Editor das franquias customizadas: grupos com imagens arrastadas, coladas ou escolhidas, cada uma com rótulo. */
export function CustomEditor({ list, actions, idPrefix = 'cst' }: { list: CustomFranchise[]; actions: CustomActions; idPrefix?: string }) {
  const [novo, setNovo] = useState('');
  const podeCriar = !!actions.manage && list.length < CUSTOM_LIMITS.franchises;
  return (
    <div className="stack custom-editor" id={idPrefix + 'Editor'}>
      {list.length === 0 && <p className="mute" style={{ margin: 0 }}>Nenhum grupo ainda.</p>}
      {list.map(f => <Group key={f.key} f={f} actions={actions} idPrefix={idPrefix} />)}
      {actions.manage && (
        <form className="bar" id={idPrefix + 'NewGroup'} onSubmit={e => { e.preventDefault(); if (novo.trim() && podeCriar) { actions.manage!.add(novo); setNovo(''); } }}>
          <label className="field">Novo grupo <input value={novo} maxLength={CUSTOM_LIMITS.label} placeholder="ex.: Meus gatos" onChange={e => setNovo(e.target.value)} /></label>
          <button className="btn" type="submit" disabled={!podeCriar || !novo.trim()}>Criar grupo</button>
          {!podeCriar && <span className="mute">Limite de {CUSTOM_LIMITS.franchises} grupos.</span>}
        </form>
      )}
    </div>
  );
}

function Group({ f, actions, idPrefix }: { f: CustomFranchise; actions: CustomActions; idPrefix: string }) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [erro, setErro] = useState('');
  const [over, setOver] = useState(false);
  const cheio = f.items.length >= CUSTOM_LIMITS.items;

  async function receber(files: File[]) {
    if (!actions.edit || !files.length) return;
    const espaco = CUSTOM_LIMITS.items - f.items.length;
    const lote = files.slice(0, Math.max(0, espaco));
    setBusy(n => n + lote.length); setErro('');
    const out: { name: string; data: string }[] = [];
    let falhas = 0;
    for (const fl of lote) {
      try { out.push({ name: labelFromFile(fl.name), data: await shrinkImage(fl) }); } catch { falhas++; }
      setBusy(n => n - 1);
    }
    if (out.length) actions.edit.addItems(f.key, out);
    if (falhas) setErro(`${falhas} arquivo(s) não são imagem.`);
    if (files.length > lote.length) setErro(`Limite de ${CUSTOM_LIMITS.items} imagens por grupo.`);
  }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); receber(imagesFromDataTransfer(e.dataTransfer)); };
  const onPaste = (e: ClipboardEvent) => { const fs = imagesFromDataTransfer(e.clipboardData); if (fs.length) { e.preventDefault(); receber(fs); } };

  return (
    <section className={'panel stack custom-group' + (over ? ' over' : '')} data-key={f.key} style={{ borderLeftColor: f.color }}
      onDragOver={e => { if (actions.edit) { e.preventDefault(); setOver(true); } }} onDragLeave={() => setOver(false)} onDrop={onDrop} onPaste={onPaste} tabIndex={-1}>
      <div className="bar">
        <span className="dot" style={{ background: f.color }} aria-hidden="true" />
        {actions.manage
          ? <EditText className="group-name" label="Nome do grupo" value={f.label} onCommit={v => actions.manage!.rename(f.key, v)} />
          : <b className="group-name">{f.label}</b>}
        <span className="mute">{f.items.length} {f.items.length === 1 ? 'imagem' : 'imagens'}</span>
        <span className="grow" />
        {actions.manage && <button className="btn mini" onClick={() => actions.manage!.remove(f.key)}>Apagar grupo</button>}
      </div>
      {actions.edit && (
        <div className="drop" role="group" aria-label={`Adicionar imagens em ${f.label}`}>
          <span>Arraste ou cole imagens aqui</span>
          <button className="btn mini" disabled={cheio} onClick={() => file.current?.click()}>Escolher imagens</button>
          <input ref={file} type="file" accept="image/*" multiple hidden data-grupo={f.key}
            onChange={e => { receber([...(e.target.files ?? [])]); e.target.value = ''; }} />
          {busy > 0 && <span className="mute">reduzindo {busy}…</span>}
        </div>
      )}
      {erro && <p className="note bad" style={{ margin: 0 }}>{erro}</p>}
      {f.items.length > 0 && (
        <ul className="custom-items" id={`${idPrefix}-${f.key}`}>
          {f.items.map(it => (
            <li key={it.id} data-id={it.id}>
              <img src={it.data} alt="" />
              {actions.edit
                ? <EditText label={`Rótulo de ${it.name}`} value={it.name} onCommit={v => actions.edit!.renameItem(f.key, it.id, v)} />
                : <span className="nm">{it.name}</span>}
              {actions.manage && <button className="x" aria-label={`Tirar ${it.name}`} onClick={() => actions.manage!.removeItem(f.key, it.id)}>×</button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Campo de texto que só manda a mudança ao sair do campo ou apertar Enter (evita uma mensagem por tecla). */
function EditText({ value, onCommit, label, className }: { value: string; onCommit: (v: string) => void; label: string; className?: string }) {
  const [txt, setTxt] = useState(value);
  const [antes, setAntes] = useState(value);
  if (value !== antes) { setAntes(value); setTxt(value); }
  const commit = () => { const v = txt.trim(); if (v && v !== value) onCommit(v); else setTxt(value); };
  return (
    <input className={className} aria-label={label} value={txt} maxLength={CUSTOM_LIMITS.label}
      onChange={e => setTxt(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); } }} />
  );
}
