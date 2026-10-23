/** 'mr-mime' -> 'Mr Mime' (nomes da PokéAPI). */
export function nice(s: string): string {
  return s.split('-').map(w => (w[0] as string).toUpperCase() + w.slice(1)).join(' ');
}
