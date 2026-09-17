#!/usr/bin/env node
/**
 * Inventario de strings visibles de las plantillas, para comparar antes/después
 * de migrar una pantalla y garantizar que no se pierde ni cambia contenido.
 *
 * Extrae de cada .html: nodos de texto, y los atributos de texto visible
 * (placeholder, title, aria-label, alt). Ignora bindings {{ }} y [attr].
 *
 * Uso:
 *   node scripts/extract-strings.mjs "src/app/pages/product/**"   > before.json
 *   ...migrar...
 *   node scripts/extract-strings.mjs "src/app/pages/product/**"   > after.json
 *   diff <(jq -S . before.json) <(jq -S . after.json)
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const pattern = process.argv[2] ?? 'src/app/**';
// Node 22+ tiene fs.globSync; si no, caemos a un walk simple.
let files;
try {
  files = globSync(pattern.endsWith('.html') ? pattern : `${pattern}/**/*.html`.replace('****', '**'));
} catch {
  files = [];
}
if (!files || files.length === 0) {
  // Fallback: walk manual
  const { readdirSync, statSync } = await import('node:fs');
  const base = pattern.replace(/\*.*$/, '').replace(/\/$/, '') || 'src';
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d)) {
      const p = `${d}/${e}`;
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (p.endsWith('.html')) out.push(p);
    }
  };
  try { walk(base); } catch { /* noop */ }
  files = out;
}

const ATTR_RE = /\b(?:placeholder|title|aria-label|alt)\s*=\s*"([^"]*)"/g;

function extract(html) {
  const strings = new Set();

  // Atributos de texto visible (sólo los que no son binding [attr]).
  let m;
  while ((m = ATTR_RE.exec(html))) {
    const v = m[1].trim();
    if (v && !v.includes('{{') && !v.includes('(')) strings.add(v);
  }

  // Nodos de texto: primero neutralizar todo lo que pueda contener '>' o '<'
  // dentro de expresiones (valores de atributos entre comillas e interpolaciones),
  // y recién ahí quitar los tags. Así no se filtran fragmentos de bindings.
  const text = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\{\{[\s\S]*?\}\}/g, ' ')      // interpolaciones
    .replace(/"[^"]*"/g, '""')               // valores de atributo (comillas dobles)
    .replace(/'[^']*'/g, "''")               // valores de atributo (comillas simples)
    .replace(/<[^>]*>/g, '\n');              // ahora sí, tags
  for (const raw of text.split('\n')) {
    const s = raw.replace(/\s+/g, ' ').trim();
    if (!s || !/[a-zA-ZÀ-ÿ0-9]/.test(s)) continue;
    // Descartar restos de control-flow / bindings sueltos.
    if (/^[@}{)]/.test(s) || s === '} @else {' || /^@(if|for|else|switch|case|default|empty|let)\b/.test(s)) continue;
    strings.add(s);
  }
  return [...strings].sort((a, b) => a.localeCompare(b, 'es'));
}

const result = {};
for (const f of files.sort()) {
  try { result[f] = extract(readFileSync(f, 'utf8')); }
  catch { /* skip */ }
}
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
