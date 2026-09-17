# Plan de desarrollo por bloques

Este documento define que se debe construir, en que orden, y como validar cada bloque.

## Objetivo general

Implementar primero el flujo mostrador (operacion diaria), dejando base lista para sumar ecommerce, multi-tenant y fiscalidad (AFIP/VERIFACTU) en fases posteriores.

## Reglas de ejecucion

1. No abrir un bloque nuevo sin cerrar criterios del bloque actual.
2. Cada bloque debe cerrar backend + frontend + pruebas minimas.
3. Toda funcionalidad nueva debe mapearse en `estructura.txt` con ID y estado.
4. Mantener contratos API consistentes (`/api/v1/...`) y tipado fuerte en frontend.

---

## Bloque 0 - Fundacion tecnica (obligatorio)

### Alcance

1. Ordenar frontend por dominios funcionales (catalog, suppliers, purchases, customers, sales, cash, settings).
2. Normalizar servicios HTTP y modelos tipados (evitar `any`, endpoints legacy y respuestas ambiguas).
3. Definir manejo de errores comun (mensajes de negocio + errores tecnicos).
4. Definir convencion de estados para procesos async (importaciones, recalculos, etc).

### Entregables

1. Estructura base por features en frontend.
2. Guia de contratos API (request/response y codigos de error).
3. Lista de deudas tecnicas criticas resueltas.

### Criterio de cierre

1. Compila sin errores.
2. Rutas actuales siguen funcionando.
3. Servicios principales usan contratos tipados.

---

## Bloque 1 - Empresas, sucursales y depositos

### Alcance

1. Crear ABM de empresas.
2. Crear ABM de sucursales.
3. Crear ABM de depositos por sucursal.
4. Definir sucursal/deposito por defecto para operaciones.
5. Preparar permisos por sucursal (base, sin multi-tenant completo aun).

### Entidades

1. Company
2. Branch
3. Warehouse

### Entregables

1. Pantalla `Configuracion > General > Empresas y Sucursales`.
2. APIs CRUD para empresa/sucursal/deposito.
3. Selector de contexto activo (sucursal/deposito).

### Criterio de cierre

1. Se puede crear y editar sucursales/depositos.
2. Compras y ventas pueden leer sucursal/deposito activo.
3. Datos persisten correctamente en backend.

---

## Bloque 2 - Catalogo proveedor por Excel

### Alcance

1. Importar Excel de proveedor con mapeo de columnas.
2. Guardar plantilla de mapeo por proveedor.
3. Validar columnas obligatorias (brand, model, code, price).
4. Versionar importaciones (fecha, archivo, usuario, resultado).

### Entregables

1. Workspace de importacion estable.
2. Resumen de importacion (insertados, actualizados, omitidos, fallidos).
3. Historial de importaciones por proveedor.

### Criterio de cierre

1. Importa listas reales sin romper datos existentes.
2. Muestra errores por fila con motivo.
3. Permite reprocesar con nuevo mapeo.

---

## Bloque 3 - Relacion proveedor-producto propio + alertas de precio

### Alcance

1. Relacionar item de proveedor con producto propio.
2. Detectar cambios de precio en nuevas importaciones.
3. Mostrar alertas de suba/baja de precio.
4. Exponer filtro de productos con alerta pendiente.

### Entregables

1. Tabla de relaciones proveedor -> producto.
2. Estado de variacion de precio (`up`, `down`, `same`).
3. Indicadores visuales en catalogo de productos.

### Criterio de cierre

1. Cambios de precio se detectan en cada importacion.
2. El usuario ve alerta antes de comprar o vender.
3. Se conserva historial de precio importado.

---

## Bloque 4 - Proveedores + factura de compra con ingreso de stock

### Alcance

1. Completar ABM de proveedores.
2. Registrar factura de compra.
3. Ingresar stock al deposito seleccionado.
4. Registrar movimiento de inventario trazable por comprobante.

### Entregables

1. Flujo de compra end-to-end funcional.
2. Kardex basico por producto/sucursal/deposito.
3. Validaciones de datos fiscales minimos (sin fiscalidad final).

### Criterio de cierre

1. Al guardar compra, el stock aumenta en deposito correcto.
2. Se puede auditar movimiento por numero de comprobante.
3. Totales de compra consistentes con lineas de detalle.

---

## Bloque 5 - Clientes + venta mostrador

### Alcance

1. Crear ABM de clientes.
2. Implementar venta mostrador (busqueda, carrito, totales, guardado).
3. Descontar stock del deposito/sucursal activos.
4. Ver comprobantes emitidos.

### Entregables

1. Flujo de venta operativo.
2. Pantalla de comprobantes con filtros.
3. Base para agregar luego fiscalidad AR/ES.

### Criterio de cierre

1. Se puede vender con cliente y productos reales.
2. Se descuenta stock correctamente.
3. Comprobante queda registrado y consultable.

---

## Bloque 6 - Cuenta corriente proveedores

### Alcance

1. Mostrar movimientos (facturas, pagos, ajustes).
2. Calcular saldo acumulado.
3. Permitir imputaciones basicas.

### Entregables

1. Vista de cuenta corriente por proveedor.
2. Totales y saldo al cierre.
3. Filtros por fecha/tipo.

### Criterio de cierre

1. Saldos coinciden con compras/pagos registrados.
2. La vista soporta auditoria operativa.

---

## Bloque 7 - Flujo de caja

### Alcance

1. Apertura de caja.
2. Ingresos/egresos manuales.
3. Cierre de caja con resumen.
4. Relacion con ventas y cobros.

### Entregables

1. Modulo de caja diario funcional.
2. Reporte de movimientos por sesion.

### Criterio de cierre

1. Se puede abrir y cerrar caja correctamente.
2. Los movimientos quedan trazables.

---

## Bloques posteriores (fase avanzada)

1. Ecommerce y MercadoLibre.
2. Multi-tenant completo.
3. Fiscalidad AR (AFIP) y ES (VERIFACTU).
4. Contabilidad avanzada y reportes extendidos.

---

## Orden sugerido de ejecucion

1. Bloque 0
2. Bloque 1
3. Bloque 2
4. Bloque 3
5. Bloque 4
6. Bloque 5
7. Bloque 6
8. Bloque 7

---

## Inicio inmediato (proximo paso)

Comenzar por Bloque 1 con estas tareas:

1. Definir modelos y endpoints de empresa/sucursal/deposito.
2. Implementar CRUD backend.
3. Implementar pantalla de administracion en frontend.
4. Conectar selector de sucursal/deposito activo.
5. Validar impacto en compra/venta (lectura de contexto activo).
