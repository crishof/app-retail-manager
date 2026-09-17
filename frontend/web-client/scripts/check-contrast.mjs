#!/usr/bin/env node
/**
 * Gate de contraste del Design System.
 *
 * Calcula el contraste WCAG 2.1 de cada token de TEXTO contra las superficies
 * sobre las que se usa, en modo claro y oscuro. Falla (exit 1) si algún par
 * requerido baja de 4,5:1.
 *
 * Los valores replican src/styles/design-system.css. Si cambian los tokens,
 * actualizar aquí (o el gate deja de proteger lo real).
 *
 * Uso:  node scripts/check-contrast.mjs
 */

const FLOOR = 4.5;

// ── Tokens resueltos por modo (deben espejar design-system.css) ────────────
const LIGHT = {
  canvas: '#EDEBE6', surface: '#FFFFFF', 'surface-2': '#F8F7F4', sunken: '#F0EEE9',
  ink: '#171614', 'ink-2': '#4B4A45', 'ink-3': '#6E6C65', 'ink-4': '#9B988F',
  accent: '#2A5E7C', ok: '#2E7A50', attn: '#8A6512', stop: '#A34438',
};
const DARK = {
  canvas: '#121212', surface: '#1A1A1A', 'surface-2': '#212121', sunken: '#161616',
  ink: '#F1F1F1', 'ink-2': '#C2C2C2', 'ink-3': '#919191', 'ink-4': '#6E6E6E',
  'accent-hi': '#3DE0F0', ok: '#57AE7C', attn: '#CFA548', stop: '#DE8073',
};
const NAV = {
  rail: '#0B0B0B', nav: '#161616',
  'rail-ink': '#ABABAB', 'rail-ink-hi': '#FFFFFF',
  'nav-ink': '#C9C9C9', 'nav-lbl': '#919191',
};

// ── Pares requeridos (texto → fondo). Todos deben cumplir >= 4,5:1 ─────────
// ink-3 es el piso de texto: se usa sobre surface / surface-2, no sobre canvas.
const surfacesFor = (m) => ['surface', 'surface-2'];

function textChecks(mode) {
  const checks = [];
  const inkTokens = ['ink', 'ink-2', 'ink-3'];
  for (const t of inkTokens) {
    for (const bg of ['surface', 'surface-2', 'sunken']) {
      checks.push([t, bg]);
    }
  }
  // ink + ink-2 además deben leerse sobre el canvas (backdrop de la app).
  for (const t of ['ink', 'ink-2']) checks.push([t, 'canvas']);
  // Señales usadas como texto sobre superficie.
  for (const t of ['ok', 'attn', 'stop']) checks.push([t, 'surface']);
  // Acento interactivo: petróleo sobre claro, neón sobre oscuro.
  if (mode === 'light') checks.push(['accent', 'surface'], ['accent', 'surface-2']);
  else checks.push(['accent-hi', 'surface'], ['accent-hi', 'surface-2']);
  return checks;
}

// Navegación (oscura en ambos modos): labels e ink sobre rail/nav.
const NAV_CHECKS = [
  ['rail-ink', 'rail'], ['rail-ink-hi', 'rail'],
  ['nav-ink', 'nav'], ['nav-lbl', 'nav'],
];

// ── WCAG ───────────────────────────────────────────────────────────────────
function toRGB(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}
function relLuminance(hex) {
  const [r, g, b] = toRGB(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const l1 = relLuminance(a), l2 = relLuminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ── Ejecución ────────────────────────────────────────────────────────────
let failures = 0;
function run(label, palette, navPalette, checks, navChecks) {
  console.log(`\n── ${label} ${'─'.repeat(Math.max(0, 40 - label.length))}`);
  const all = [
    ...checks.map(([t, bg]) => [t, bg, palette]),
    ...navChecks.map(([t, bg]) => [t, bg, navPalette]),
  ];
  for (const [t, bg, pal] of all) {
    const fg = pal[t] ?? palette[t] ?? NAV[t];
    const back = pal[bg] ?? palette[bg] ?? NAV[bg];
    const ratio = contrast(fg, back);
    const ok = ratio >= FLOOR;
    if (!ok) failures++;
    const mark = ok ? '✓' : '✗ FALLA';
    console.log(`  ${mark}  ${t.padEnd(12)} on ${bg.padEnd(10)} = ${ratio.toFixed(2)}:1`);
  }
}

console.log('Gate de contraste — piso WCAG 4,5:1 para texto');
run('MODO CLARO', LIGHT, NAV, textChecks('light'), NAV_CHECKS);
run('MODO OSCURO', DARK, NAV, textChecks('dark'), NAV_CHECKS);

// Nota informativa: ink-4 es sólo íconos/bordes (no texto).
console.log('\nℹ ink-4 y nav-icon son SÓLO íconos/bordes: no se validan como texto.');

if (failures > 0) {
  console.error(`\n✗ ${failures} par(es) por debajo de ${FLOOR}:1. Revisar tokens.`);
  process.exit(1);
}
console.log('\n✓ Todos los pares de texto cumplen el piso de contraste en ambos modos.');
