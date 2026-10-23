import { useSyncExternalStore } from 'react';
import { app } from '../../state/app';
import * as store from '../../customs/store';
import { addFranchise, renameFranchise, removeFranchise, addItems, renameItem, removeItem } from '../../customs/model';
import { CustomEditor, type CustomActions } from './CustomEditor';

/** Assina o registro de franquias customizadas (re-render a cada mudança). */
export function useCustoms() {
  useSyncExternalStore(store.subscribe, store.version);
  return store;
}

/** Ações sobre as MINHAS franquias (as que eu criei, no solo e como host). */
export const mineActions: CustomActions = {
  manage: {
    add: label => store.setMine(addFranchise(store.getMine(), label)),
    rename: (key, label) => store.setMine(renameFranchise(store.getMine(), key, label)),
    remove: key => store.setMine(removeFranchise(store.getMine(), key)),
    removeItem: (key, id) => store.setMine(removeItem(store.getMine(), key, id)),
  },
  edit: {
    addItems: (key, items) => store.setMine(addItems(store.getMine(), key, items)),
    renameItem: (key, id, name) => store.setMine(renameItem(store.getMine(), key, id, name)),
  },
};

/** Aba "Personalizar": grupos de imagens da pessoa, que viram franquias em todos os modos. */
export function Customs() {
  const s = useCustoms();
  return (
    <section id="customs" hidden={app.mode !== 'customs'}>
      <div className="panel stack">
        <h2 style={{ margin: 0 }}>Franquias personalizadas</h2>
        <p className="mute" style={{ margin: 0 }}>
          Crie grupos com as suas imagens (arraste, cole ou escolha os arquivos) e dê um nome a cada uma. Cada grupo vira uma
          franquia nos seletores do Duelo, Trio, Quarteto e Campeonato, e no lobby das salas online que você criar.
          Fica só nesta aba enquanto ela estiver aberta: nada é salvo.
        </p>
      </div>
      <CustomEditor list={s.getMine()} actions={mineActions} idPrefix="cst" />
    </section>
  );
}
