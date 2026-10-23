import { SidesMode } from '../../components/SidesMode';

/** Trio: quem vence fica; os outros dois lados mandam novos desafiantes. */
export function Trio() {
  return (
    <SidesMode m="trio" arena="three" skip="Trocar os três"
      hint="Quem você escolhe fica; os outros dois lados mandam novos desafiantes. Teclas 1, 2 e 3 escolhem; R gira a roleta." />
  );
}
