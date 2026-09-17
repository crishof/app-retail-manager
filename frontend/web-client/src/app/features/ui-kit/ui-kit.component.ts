import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import {
  UiButtonComponent, UiTagComponent, UiChipComponent, UiSwitchComponent,
  UiCheckboxComponent, UiFieldComponent, UiSheetComponent, UiSectionComponent,
  UiDetailRowComponent, UiMoneyRowComponent, UiNoteComponent, UiEmptyStateComponent,
  UiSkeletonComponent, UiStepperComponent, UiTechDetailsComponent, UiBulkBarComponent,
  UiTableComponent, UiCellDirective, UiStep, UiColumn,
} from '../../ui';

interface DemoRow {
  id: number; codigo: string; producto: string; stock: number; precio: string; estado: 'ok' | 'attn' | 'stop';
}

/**
 * /ui-kit — galería del Design System. Muestra todos los átomos con sus
 * variantes y estados, en claro y oscuro. Es donde se discuten los ajustes
 * finos antes de construir pantallas reales.
 */
@Component({
  selector: 'app-ui-kit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UiButtonComponent, UiTagComponent, UiChipComponent, UiSwitchComponent,
    UiCheckboxComponent, UiFieldComponent, UiSheetComponent, UiSectionComponent,
    UiDetailRowComponent, UiMoneyRowComponent, UiNoteComponent, UiEmptyStateComponent,
    UiSkeletonComponent, UiStepperComponent, UiTechDetailsComponent, UiBulkBarComponent,
    UiTableComponent, UiCellDirective,
  ],
  template: `
    <div class="kit">
      <header class="kit__top">
        <div>
          <h1 class="kit__title">RetailManager · Design System</h1>
          <p class="kit__sub">Átomos, variantes y estados — claro y oscuro</p>
        </div>
        <div class="kit__theme" role="group" aria-label="Tema">
          <button [class.on]="theme.preference()==='light'"  (click)="theme.set('light')">Claro</button>
          <button [class.on]="theme.preference()==='dark'"   (click)="theme.set('dark')">Oscuro</button>
          <button [class.on]="theme.preference()==='system'" (click)="theme.set('system')">Sistema</button>
        </div>
      </header>

      <!-- Botones -->
      <ui-section label="ui-button" class="kit__block">
        <div class="row">
          <ui-button variant="primary">Primario</ui-button>
          <ui-button variant="secondary">Secundario</ui-button>
          <ui-button variant="quiet">Quiet</ui-button>
          <ui-button variant="danger">Peligro</ui-button>
          <ui-button variant="secondary" size="sm">Pequeño</ui-button>
          <ui-button variant="primary" [loading]="true">Cargando</ui-button>
          <ui-button variant="secondary" [disabled]="true">Deshabilitado</ui-button>
          <ui-button variant="secondary" size="icon" aria-label="Editar">
            <span class="material-icons" aria-hidden="true">edit</span>
          </ui-button>
        </div>
      </ui-section>

      <!-- Tags y chips -->
      <ui-section label="ui-tag · ui-chip" class="kit__block">
        <div class="row">
          <ui-tag>Neutro</ui-tag>
          <ui-tag tone="ok">Pagado</ui-tag>
          <ui-tag tone="attn">Pendiente</ui-tag>
          <ui-tag tone="stop">Vencido</ui-tag>
          <ui-tag tone="accent">Nuevo</ui-tag>
        </div>
        <div class="row">
          <ui-chip [count]="128">Todos</ui-chip>
          <ui-chip [count]="12" [active]="true">Activos</ui-chip>
          <ui-chip [count]="3">Sin stock</ui-chip>
        </div>
      </ui-section>

      <!-- Controles -->
      <ui-section label="ui-switch · ui-checkbox" class="kit__block">
        <div class="row">
          <ui-switch label="Notificaciones" [checked]="true" />
          <ui-switch label="Modo mayorista" />
          <ui-switch label="Bloqueado" [disabled]="true" />
        </div>
        <div class="row">
          <ui-checkbox label="Opción A" [checked]="true" />
          <ui-checkbox label="Seleccionar todo" [indeterminate]="true" />
          <ui-checkbox label="Deshabilitado" [disabled]="true" />
        </div>
      </ui-section>

      <!-- Campos -->
      <ui-section label="ui-field" class="kit__block">
        <div class="grid2">
          <ui-field label="Razón social" hint="Como figura en AFIP">
            <input class="ui-control" placeholder="Hoffmann S.A." />
          </ui-field>
          <ui-field label="CUIT" [required]="true" error="El CUIT es obligatorio">
            <input class="ui-control ui-control--mono" placeholder="30-12345678-9" />
          </ui-field>
          <ui-field label="Condición IVA">
            <select class="ui-control">
              <option>Responsable Inscripto</option>
              <option>Monotributo</option>
              <option>Exento</option>
            </select>
          </ui-field>
          <ui-field label="Observaciones">
            <textarea class="ui-control" placeholder="Notas internas…"></textarea>
          </ui-field>
        </div>
      </ui-section>

      <!-- Avisos -->
      <ui-section label="ui-note" class="kit__block">
        <div class="stack">
          <ui-note tone="info" title="Sincronización con ARCA">Los comprobantes se envían automáticamente al emitir.</ui-note>
          <ui-note tone="ok">Backup diario activo.</ui-note>
          <ui-note tone="attn" title="Stock bajo">3 artículos por debajo del mínimo.
            <ui-button actions variant="quiet" size="sm">Ver</ui-button>
          </ui-note>
          <ui-note tone="stop" title="Certificado por vencer">Renovar antes del 30/09.
            <ui-button actions variant="secondary" size="sm">Renovar</ui-button>
          </ui-note>
        </div>
      </ui-section>

      <!-- Sheet + detail + money -->
      <div class="grid2 kit__block">
        <ui-sheet>
          <h3 class="kit__h3">Ficha (ui-detail-row)</h3>
          <ui-detail-row label="Proveedor">Distribuidora Andina</ui-detail-row>
          <ui-detail-row label="CUIT" [mono]="true">30-71234567-8</ui-detail-row>
          <ui-detail-row label="Condición">Cuenta corriente 30 días</ui-detail-row>
          <ui-detail-row label="Estado"><ui-tag tone="ok">Al día</ui-tag></ui-detail-row>
        </ui-sheet>
        <ui-sheet>
          <h3 class="kit__h3">Totales (ui-money-row)</h3>
          <ui-money-row label="Subtotal" prefix="$ " amount="124.500,00" />
          <ui-money-row label="IVA 21%" prefix="$ " amount="26.145,00" />
          <ui-money-row label="Percepción IIBB" prefix="$ " amount="1.245,00" />
          <ui-money-row label="Total" prefix="$ " amount="151.890,00" [total]="true" />
        </ui-sheet>
      </div>

      <!-- Stepper -->
      <ui-section label="ui-stepper" class="kit__block">
        <ui-stepper [steps]="steps" />
      </ui-section>

      <!-- Skeleton -->
      <ui-section label="ui-skeleton" class="kit__block">
        <div class="grid2">
          <ui-skeleton [rows]="4" />
          <div class="row" style="align-items:center">
            <ui-skeleton variant="circle" width="2.5rem" height="2.5rem" />
            <ui-skeleton variant="text" width="12rem" />
          </div>
        </div>
      </ui-section>

      <!-- Tech details -->
      <ui-section label="ui-tech-details" class="kit__block">
        <ui-tech-details label="Respuesta de ARCA (error 10016)"
          content='{"code":10016,"msg":"CUIT no habilitado para el punto de venta"}' />
      </ui-section>

      <!-- Empty state -->
      <ui-section label="ui-empty-state" class="kit__block">
        <ui-empty-state icon="inventory_2" title="Sin artículos"
          description="Todavía no cargaste productos en este depósito.">
          <ui-button actions variant="primary">Nuevo artículo</ui-button>
        </ui-empty-state>
      </ui-section>

      <!-- Tabla -->
      <ui-section label="ui-table" class="kit__block">
        <ui-table
          [columns]="cols"
          [rows]="rows"
          [selectable]="true"
          [pageSize]="5"
          (selectionChange)="tableSel.set($event.length)"
        >
          <ng-template uiCell="estado" let-row>
            <ui-tag [tone]="row.estado">
              {{ row.estado === 'ok' ? 'En stock' : row.estado === 'attn' ? 'Bajo' : 'Sin stock' }}
            </ui-tag>
          </ng-template>
          <ng-template uiCell="__actions" let-row>
            <button type="button" class="kit__menuitem">Editar {{ row.codigo }}</button>
            <button type="button" class="kit__menuitem">Duplicar</button>
            <button type="button" class="kit__menuitem kit__menuitem--danger">Eliminar</button>
          </ng-template>
        </ui-table>
        @if (tableSel() > 0) {
          <ui-bulk-bar [count]="tableSel()" (clear)="tableSel.set(0)">
            <ui-button variant="quiet" size="sm">Exportar</ui-button>
            <ui-button variant="danger" size="sm">Eliminar</ui-button>
          </ui-bulk-bar>
        }
      </ui-section>

      <!-- Bulk bar -->
      <ui-section label="ui-bulk-bar" class="kit__block">
        <div class="row">
          <ui-button variant="secondary" size="sm" (pressed)="selected.set(selected() ? 0 : 3)">
            {{ selected() ? 'Limpiar' : 'Simular selección' }}
          </ui-button>
        </div>
        <ui-bulk-bar [count]="selected()" (clear)="selected.set(0)">
          <ui-button variant="quiet" size="sm">Exportar</ui-button>
          <ui-button variant="quiet" size="sm">Etiquetas</ui-button>
          <ui-button variant="danger" size="sm">Eliminar</ui-button>
        </ui-bulk-bar>
      </ui-section>
    </div>
  `,
  styles: [`
    .kit { max-width: 1100px; margin: 0 auto; padding: var(--pad); display: flex; flex-direction: column; gap: 1.25rem; }
    .kit__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .kit__title { margin: 0; font-size: var(--fs-xl); font-weight: 700; color: var(--ink); }
    .kit__sub { margin: .25rem 0 0; font-size: var(--fs-sm); color: var(--ink-3); }
    .kit__theme { display: inline-flex; border: 1px solid var(--border-strong); border-radius: 999px; overflow: hidden; }
    .kit__theme button { border: none; background: var(--surface); color: var(--ink-2); padding: .375rem .75rem; font-size: var(--fs-sm); cursor: pointer; }
    .kit__theme button.on { background: var(--accent-fill); color: var(--accent); font-weight: 600; }
    .kit__block { display: block; }
    .kit__h3 { margin: 0 0 .75rem; font-size: var(--fs-base); font-weight: 600; color: var(--ink); }
    .row { display: flex; flex-wrap: wrap; gap: .625rem; align-items: center; }
    .row + .row { margin-top: .75rem; }
    .stack { display: flex; flex-direction: column; gap: .625rem; }
    .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr)); gap: 1rem; }
    .kit__menuitem {
      text-align: left; background: none; border: none; cursor: pointer;
      padding: .4375rem .5rem; border-radius: var(--r-sm); font-size: var(--fs-sm); color: var(--ink-2);
    }
    .kit__menuitem:hover { background: var(--surface-2); color: var(--ink); }
    .kit__menuitem--danger { color: var(--stop); }
  `],
})
export class UiKitComponent {
  readonly theme = inject(ThemeService);
  readonly selected = signal(0);
  readonly tableSel = signal(0);

  readonly cols: UiColumn[] = [
    { key: 'codigo', header: 'Código', type: 'mono', sortable: true, width: '8rem' },
    { key: 'producto', header: 'Producto', sortable: true },
    { key: 'stock', header: 'Stock', type: 'number', sortable: true, width: '7rem' },
    { key: 'precio', header: 'Precio', type: 'mono', align: 'right', sortable: true, width: '9rem' },
    { key: 'estado', header: 'Estado', width: '9rem' },
  ];
  readonly rows: DemoRow[] = [
    { id: 1, codigo: 'GTR-001', producto: 'Guitarra criolla Fonseca', stock: 12, precio: '$ 189.900', estado: 'ok' },
    { id: 2, codigo: 'TEC-044', producto: 'Teclado Yamaha PSR-E373', stock: 3, precio: '$ 412.500', estado: 'attn' },
    { id: 3, codigo: 'BAT-010', producto: 'Batería acústica Mapex', stock: 0, precio: '$ 1.240.000', estado: 'stop' },
    { id: 4, codigo: 'MIC-207', producto: 'Micrófono Shure SM58', stock: 27, precio: '$ 98.400', estado: 'ok' },
    { id: 5, codigo: 'AMP-133', producto: 'Amplificador Marshall MG15', stock: 6, precio: '$ 274.000', estado: 'ok' },
    { id: 6, codigo: 'CAB-090', producto: 'Cable Plug-Plug 6m', stock: 2, precio: '$ 12.900', estado: 'attn' },
    { id: 7, codigo: 'UKU-015', producto: 'Ukelele soprano Mahalo', stock: 18, precio: '$ 46.700', estado: 'ok' },
  ];

  readonly steps: UiStep[] = [
    { label: 'Presupuesto', state: 'done' },
    { label: 'Facturado', state: 'done' },
    { label: 'En preparación', state: 'active' },
    { label: 'Entregado', state: 'todo' },
  ];
}
