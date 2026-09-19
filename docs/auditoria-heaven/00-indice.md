# Auditoría de Heaven — Índice

Objetivo: relevar todas las funcionalidades de Heaven (el ERP Windows de Hoffmann)
para definir la **arquitectura de información (IA) objetivo** de la web app y, a
partir de ahí, **reconstruir la presentación por feature** sobre los servicios y
el design system existentes. Ver el plan completo en el plan aprobado de la sesión.

> Estado del código: se **conserva** la capa de servicios/HTTP/auth y el design
> system (Fases 0–4). Se **repiensa** IA, navegación, layout y los patrones
> heredados de Heaven (modal-como-pantalla, pestañas). Fiscal = Argentina/ARCA.

## Cómo aportar capturas
Subir capturas por bloque a `docs/capturas-heaven/<bloque>/` (carpeta ignorada en
Git). Convención de archivo: `<pantalla>__<estado>.png`
(estados: `lista`, `detalle`, `nueva`, `edicion`, `modal-*`, `pestaña-*`,
`reporte`, `impresion`). Incluir también capturas de menús/navegación de Heaven.
Cuando un flujo no se ve en una imagen, agregar una nota breve describiéndolo.

Cadencia: subís un bloque y avisás → reviso y redacto el doc del módulo → lo
iteramos → siguiente bloque. No hace falta tener todo junto.

## Módulos (estado)
Los bloques son una propuesta inicial derivada del menú actual (que imita a
Heaven); ajustalos a los menús reales de Heaven a medida que subas material.

| # | Módulo | Carpeta de capturas | Doc | Estado |
|---|--------|---------------------|-----|--------|
| 01 | Ventas / Comprobantes | `01-ventas/` | `01-ventas.md` | ⏳ Pendiente |
| 02 | Compras | `02-compras/` | `02-compras.md` | ⏳ Pendiente |
| 03 | Almacén (catálogo, stock, inventario, remitos) | `03-almacen/` | `03-almacen.md` | ⏳ Pendiente |
| 04 | Caja / Finanzas | `04-caja-finanzas/` | `04-caja-finanzas.md` | ⏳ Pendiente |
| 05 | Clientes | `05-clientes/` | `05-clientes.md` | ⏳ Pendiente |
| 06 | Proveedores | `06-proveedores/` | `06-proveedores.md` | ⏳ Pendiente |
| 07 | Fiscal (ARCA/AFIP, Libro IVA, retenciones) | `07-fiscal/` | `07-fiscal.md` | ⏳ Pendiente |
| 08 | Informes | `08-informes/` | `08-informes.md` | ⏳ Pendiente |
| 09 | Servicio Técnico | `09-servicio-tecnico/` | `09-servicio-tecnico.md` | ⏳ Pendiente |
| 10 | Ecommerce | `10-ecommerce/` | `10-ecommerce.md` | ⏳ Pendiente |
| 11 | Configuración (usuarios, empresa/sucursal, maestros) | `11-configuracion/` | `11-configuracion.md` | ⏳ Pendiente |
| 12 | Dashboard / Inicio | `12-dashboard-inicio/` | `12-dashboard-inicio.md` | ⏳ Pendiente |

Leyenda de estado: ⏳ Pendiente · 🟡 En curso · ✅ Cerrado (revisado por el usuario).

## Entregables de la auditoría
- Este índice (`00-indice.md`).
- Un doc por módulo (`NN-<modulo>.md`), según `_plantilla-modulo.md`.
- `_mapa-ia.md` — IA objetivo (secciones, pantallas, relaciones, duplicados a unificar).
- `_plan-reconstruccion.md` — plan por features (orden por dependencias; reutilizar
  / refactorizar / rehacer / descartar).

## Insumos a cruzar (código actual)
- Rutas y navegación: `frontend/web-client/src/app/app.routes.ts`,
  `frontend/web-client/src/app/layout/navigation/navigation.config.ts`.
- Pantallas/features: `frontend/web-client/src/app/pages/**`, `.../features/**`.
- Lógica reutilizable: `.../src/app/services/**`, `.../src/app/core/**`.
- Design system: `.../src/app/ui/**`, `.../src/styles/design-system.css`.
- Auditoría previa (huérfanos/gaps): `Legacy/docs/audit/00-arquitectura.md`,
  `Legacy/docs/audit/02-frontend-huerfanos-y-visual.md`.
