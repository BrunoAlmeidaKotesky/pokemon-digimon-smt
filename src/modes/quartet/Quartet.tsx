import { SidesMode } from '../../components/SidesMode';

/** Quarteto: a regra do Trio com quatro lados. Quem vence fica; os outros três mandam novos desafiantes. */
export function Quartet() {
  return (
    <SidesMode m="quartet" arena="four" skip="Trocar os quatro"
      hint="Quem você escolhe fica; os outros três lados mandam novos desafiantes. Teclas 1 a 4 escolhem; R gira a roleta." />
  );
}
