// Inline copies of the Lucide icons (ISC license) so the library has no dependencies.
// Each shape carries a `sz-draw` / `sz-pop` class so styles.ts can animate it;
// pathLength="1" lets the draw effect use a 0..1 dash range for any shape.
const svg = (body: string, size: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`

const draw = (d: string, step = 1) => `<path class="sz-draw sz-d${step}" pathLength="1" d="${d}"/>`
const pop = (d: string) => `<path class="sz-pop" d="${d}"/>`
const circle = '<circle class="sz-draw sz-d0" pathLength="1" cx="12" cy="12" r="10"/>'

export const icons = {
  success: svg(`${circle}${draw('m9 12 2 2 4-4')}`, 22),
  error: svg(`${circle}${draw('m15 9-6 6')}${draw('m9 9 6 6', 2)}`, 22),
  info: svg(`${circle}${pop('M12 16v-4')}${pop('M12 8h.01')}`, 22),
  warning: svg(
    `${draw('m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 0)}${pop('M12 9v4')}${pop('M12 17h.01')}`,
    22,
  ),
  loading: svg('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>', 22),
  close: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 17),
}
