// Peças da aba Catálogo usadas em mais de uma vista (lista, linhas, classes).
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import type { Item } from '../../types';
import { resolve } from '../../sources/resolve';
import { app, frColor } from '../../state/app';
import * as cat from '../../catalog/store';
import { normalizar, type Linha } from '../../catalog/model';

export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
export const style = (k: string) => ({ ['--c' as string]: frColor(k) });

/** Assina o estado do Catálogo (marcações, plano, base, catálogos baixados, filtros). */
export function useCatalogo() {
  useSyncExternalStore(cat.assinar, cat.versao);
}

// nome -> item da lista do site, montado uma vez por lista
const mapas = new WeakMap<readonly Item[], Map<string, Item>>();
function mapaDe(lista: readonly Item[]): Map<string, Item> {
  let m = mapas.get(lista);
  if (!m) {
    m = new Map(lista.map(it => [it.name, it]));
    mapas.set(lista, m);
  }
  return m;
}
/** O item da lista do site com esse nome (undefined = lista não carregou ou ele não está nela). */
export const itemDe = (k: string, nome: string): Item | undefined => {
  const l = app.lists[k];
  return l ? mapaDe(l).get(nome) : undefined;
};
const posicoes = new WeakMap<readonly Item[], Map<string, number>>();
/** Posição na lista do site (pra ordenar como ela); quem não está nela vai pro fim. */
export function posicaoDe(k: string, nome: string): number {
  const l = app.lists[k];
  if (!l) return Infinity;
  let m = posicoes.get(l);
  if (!m) {
    m = new Map(l.map((it, i) => [it.name, i]));
    posicoes.set(l, m);
  }
  return m.get(nome) ?? Infinity;
}

/**
 * Um personagem pra miniatura fora da lista principal (linhas, classes): o item da lista do site (ou só o nome, se
 * ele não estiver nela) e a imagem do catálogo, se já tiver chegado.
 */
export function linhaAvulsa(k: string, nome: string): Linha {
  const c = cat.catalogo(k);
  const imgFonte = c && c !== 'carregando' ? c.imagens.get(nome) ?? '' : '';
  return { nome, item: itemDe(k, nome) ?? { name: nome, img: '' }, info: null, imgFonte, busca: '' };
}
/** O catálogo da franquia já chegou (ou não existe)? Antes disso a miniatura não busca o detalhe do Digimon. */
export const catalogoPronto = (k: string) => {
  const c = cat.catalogo(k);
  return c !== undefined && c !== 'carregando';
};

/**
 * Miniatura: a imagem da lista, senão a do catálogo; o Digimon sem as duas busca o detalhe (só depois de o catálogo
 * chegar, que pode trazer a imagem). Imagem quebrada tenta a outra.
 */
export function Thumb({ l, pronto }: { l: Linha; pronto: boolean }) {
  const it = l.item;
  const [, setBuscou] = useState(0);
  const [falhas, setFalhas] = useState<string[]>([]);
  useEffect(() => {
    if (!pronto || it.img || l.imgFonte || !it.href) return;
    let vivo = true;
    resolve(it).then(() => { if (vivo) setBuscou(n => n + 1); });
    return () => { vivo = false; };
  }, [it, l.imgFonte, pronto]);
  const src = [it.img, l.imgFonte].find(s => s && !falhas.includes(s));
  return (
    <span className="th">
      {src ? <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFalhas(x => [...x, src])} /> : null}
    </span>
  );
}

/**
 * Texto que salva enquanto digita (depois de `atraso` ms parado), ao sair do campo e ao sumir da tela. Quando o valor
 * salvo muda por fora (importação), o campo acompanha.
 */
export function useTextoSalvo(valor: string, salvar: (t: string) => void, atraso = 400) {
  const [txt, setTxt] = useState(valor);
  const [prev, setPrev] = useState(valor);
  if (prev !== valor) {
    setPrev(valor);
    setTxt(valor);
  }
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendente = useRef<string | null>(null);
  const salvarRef = useRef(salvar);
  useEffect(() => {
    salvarRef.current = salvar;
  });
  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const t = pendente.current;
    pendente.current = null;
    if (t !== null) salvarRef.current(t);
  }, []);
  // saiu da tela (outra página da lista, outra franquia) com texto por salvar: salva
  useEffect(() => flush, [flush]);
  const mudar = (t: string) => {
    setTxt(t);
    pendente.current = t;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, atraso);
  };
  return { txt, mudar, flush };
}

/** Quantos resultados a busca de personagem mostra. */
const MAX_RESULTADOS = 8;

/**
 * Campo de busca na lista de uma franquia, com os resultados embaixo (miniatura, nome e uma nota). Enter escolhe o
 * primeiro; setas andam entre o campo e os resultados; Esc limpa e, vazio, chama onFechar. Ordem: `prioridade`
 * (menor primeiro), depois quem começa com o texto, depois a ordem da lista. `children` fica ao lado do campo.
 */
export function BuscaPersonagem({ porNome, pronto, inputRef, rotulo, placeholder, vazio, prioridade, nota, onEscolher, onFechar, children }: {
  porNome: ReadonlyMap<string, Linha>;
  pronto: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  rotulo: string;
  placeholder: string;
  /** texto quando ninguém tem o nome */
  vazio: string;
  prioridade?: (nome: string) => number;
  nota?: (nome: string) => string;
  onEscolher: (nome: string) => void;
  onFechar: () => void;
  children?: ReactNode;
}) {
  const [q, setQ] = useState('');
  const proprio = useRef<HTMLInputElement>(null);
  const campo = inputRef ?? proprio;
  const lista = useRef<HTMLUListElement>(null);
  const t = normalizar(q.trim());
  const res: string[] = [];
  if (t) {
    const achados: { nome: string; ordem: number }[] = [];
    let i = 0;
    for (const nome of porNome.keys()) {
      const p = normalizar(nome).indexOf(t);
      if (p >= 0) achados.push({ nome, ordem: (prioridade?.(nome) ?? 0) + (p === 0 ? 0 : 1) + i++ / 1e6 });
    }
    res.push(...achados.sort((a, b) => a.ordem - b.ordem).slice(0, MAX_RESULTADOS).map(a => a.nome));
  }

  function escolher(nome: string) {
    onEscolher(nome);
    setQ('');
    campo.current?.focus();
  }
  /** Setas sobem e descem entre o campo e os resultados. */
  function setas(e: KeyboardEvent, i: number) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const bs = lista.current ? [...lista.current.querySelectorAll('button')] : [];
    const j = i + (e.key === 'ArrowDown' ? 1 : -1);
    if (j < 0) campo.current?.focus();
    else bs[Math.min(j, bs.length - 1)]?.focus();
  }

  return (
    <div className="lin-add">
      <div className="lin-add-campos">
        <input ref={campo} type="search" className="lin-busca" autoFocus placeholder={placeholder} aria-label={rotulo}
          value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && res[0]) { e.preventDefault(); escolher(res[0]); }
            else if (e.key === 'Escape') { if (q) setQ(''); else onFechar(); }
            else setas(e, -1);
          }} />
        {children}
      </div>
      {t && (res.length ? (
        <ul ref={lista} className="lin-res" aria-label="Resultados">
          {res.map((nome, i) => {
            const n = nota?.(nome);
            return (
              <li key={nome}>
                <button type="button" className="lin-res-it" data-nome={nome} onClick={() => escolher(nome)} onKeyDown={e => setas(e, i)}>
                  <Thumb l={porNome.get(nome)!} pronto={pronto} />
                  <span className="txt">
                    <span className="nm">{nome}</span>
                    {n && <small>{n}</small>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : <p className="mute lin-res-vazio">{vazio}</p>)}
    </div>
  );
}

/**
 * Botão de ação que apaga algo: o primeiro clique só troca o texto pelo pedido de confirmação, o segundo (em até
 * 4 s) faz.
 */
export function BotaoConfirmar({ id, className = '', rotulo, confirmar, onConfirm, disabled, title }: {
  id?: string;
  className?: string;
  rotulo: string;
  confirmar: string;
  onConfirm: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const [confirma, setConfirma] = useState(false);
  useEffect(() => {
    if (!confirma) return;
    const t = setTimeout(() => setConfirma(false), 4000);
    return () => clearTimeout(t);
  }, [confirma]);
  return (
    <button type="button" id={id} className={'btn mini ' + className + (confirma ? ' danger' : '')} disabled={disabled} title={title}
      onClick={() => { if (confirma) onConfirm(); setConfirma(!confirma); }}>
      {confirma ? confirmar : rotulo}
    </button>
  );
}
