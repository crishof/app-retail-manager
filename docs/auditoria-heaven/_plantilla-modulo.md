# <NN> — <Módulo> (Heaven)

> Estado: ⏳ Pendiente / 🟡 En curso / ✅ Cerrado
> Capturas: `docs/capturas-heaven/<bloque>/`

## Propósito
Qué resuelve este módulo en la operación de Hoffmann.

## Pantallas / vistas
Repetir por cada pantalla relevante:

### <Nombre de la pantalla>
- **Para qué sirve:**
- **Datos / campos:** (lo que muestra y lo que edita)
- **Acciones:** (botones, menús, atajos), **filtros**, **orden**, **búsqueda**
- **Patrón en Heaven:** pantalla completa / modal / pestaña
- **Reglas de negocio:** validaciones, cálculos, estados
- **Captura(s):** `archivo__estado.png`

## Flujos
Secuencias entre pantallas (p. ej. presupuesto → factura → cobro).

## Dependencias
Con otros módulos (stock, caja, fiscal ARCA, clientes, proveedores…).

## Veredicto por función
Por cada función/pantalla, una de:
- **Implementar tal cual** — por qué sirve como está.
- **Mejorar** — qué cambiar y por qué (incluye repensar Heaven-ismos:
  modal-como-pantalla, pestañas → proponer patrón web: página, modal real
  `MatDialog`, `ui-section`, `ui-table`, etc.).
- **Descartar** — por qué no va a la web app.

## Mapeo al código actual
| Función Heaven | Ruta/Componente/Servicio actual | Veredicto |
|---|---|---|
| … | `src/app/...` | reutilizar / refactorizar / rehacer / huérfano / no existe |

## Notas abiertas / preguntas al usuario
- …
