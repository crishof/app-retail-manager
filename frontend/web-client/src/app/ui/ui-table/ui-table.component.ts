import {
  ChangeDetectionStrategy, Component, computed, contentChildren, input, output, signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiCellDirective } from './ui-cell.directive';
import { UiCheckboxComponent } from '../ui-checkbox/ui-checkbox.component';
import { UiEmptyStateComponent } from '../ui-empty-state/ui-empty-state.component';
import { UiSkeletonComponent } from '../ui-skeleton/ui-skeleton.component';

export interface UiColumn {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  type?: 'text' | 'number' | 'mono' | 'date';
  sortable?: boolean;
  width?: string;
}

export type SortDir = 'asc' | 'desc' | null;

/**
 * Tabla del Design System. Config-driven (columns + rows) con celdas ricas vía
 * <ng-template uiCell="key">. Cubre: header sticky, fila de 36px, alineación por
 * tipo, selección múltiple con indeterminado + barra masiva, orden, paginación,
 * estado vacío, skeleton, scroll horizontal y columna de acciones con menú.
 *
 * Orden y paginación son LOCALES por defecto (client-side). Para modo servidor,
 * escuchar (sortChange)/(pageChange) y pasar los datos ya ordenados/paginados.
 */
@Component({
  selector: 'ui-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, UiCheckboxComponent, UiEmptyStateComponent, UiSkeletonComponent],
  host: {
    '(document:click)': 'closeMenu()',
    '(window:scroll)': 'closeMenu()',
    '(window:resize)': 'closeMenu()',
  },
  template: `
    <div class="uit__wrap">
      <table class="uit" [style.min-width]="minWidth()">
        <thead class="uit__head">
          <tr>
            @if (selectable()) {
              <th class="uit__cell uit__cell--check" scope="col">
                <ui-checkbox
                  [checked]="allSelected()"
                  [indeterminate]="someSelected()"
                  (checkedChange)="toggleAll($event)"
                  ariaLabel="Seleccionar todo" />
              </th>
            }
            @for (col of columns(); track col.key) {
              <th
                class="uit__cell uit__th"
                scope="col"
                [style.width]="col.width || null"
                [class.uit__cell--right]="alignOf(col) === 'right'"
                [class.uit__cell--center]="alignOf(col) === 'center'"
                [class.uit__th--sortable]="col.sortable"
                [attr.aria-sort]="ariaSort(col)"
                (click)="col.sortable && toggleSort(col.key)"
              >
                <span class="uit__th-inner">
                  {{ col.header }}
                  @if (col.sortable) {
                    <span class="material-icons uit__sort" aria-hidden="true">{{ sortIcon(col.key) }}</span>
                  }
                </span>
              </th>
            }
            @if (hasActions()) { <th class="uit__cell uit__cell--actions" scope="col"><span class="uit__sr">Acciones</span></th> }
          </tr>
        </thead>

        <tbody>
          @if (loading()) {
            @for (r of skeletonRows(); track $index) {
              <tr class="uit__row">
                @if (selectable()) { <td class="uit__cell uit__cell--check"><ui-skeleton width="1rem" height="1rem" /></td> }
                @for (col of columns(); track col.key) { <td class="uit__cell"><ui-skeleton variant="text" width="80%" /></td> }
                @if (hasActions()) { <td class="uit__cell uit__cell--actions"><ui-skeleton width="1.5rem" height="1rem" /></td> }
              </tr>
            }
          } @else {
            @for (row of pagedRows(); track rowId()(row)) {
              <tr class="uit__row" [class.uit__row--selected]="isSelected(row)" (click)="rowClick.emit(row)">
                @if (selectable()) {
                  <td class="uit__cell uit__cell--check" (click)="$event.stopPropagation()">
                    <ui-checkbox [checked]="isSelected(row)" (checkedChange)="toggleRow(row)"
                      ariaLabel="Seleccionar fila" />
                  </td>
                }
                @for (col of columns(); track col.key) {
                  <td
                    class="uit__cell"
                    [class.uit__cell--right]="alignOf(col) === 'right'"
                    [class.uit__cell--center]="alignOf(col) === 'center'"
                    [class.uit__cell--mono]="col.type === 'mono' || col.type === 'number'"
                  >
                    @if (tpl(col.key); as t) {
                      <ng-container [ngTemplateOutlet]="t" [ngTemplateOutletContext]="ctx(row, col)" />
                    } @else {
                      {{ valueOf(row, col.key) }}
                    }
                  </td>
                }
                @if (hasActions()) {
                  <td class="uit__cell uit__cell--actions" (click)="$event.stopPropagation()">
                    <button type="button" class="uit__kebab" aria-label="Acciones"
                      [attr.aria-expanded]="menuRow() === rowId()(row)"
                      (click)="toggleMenu(rowId()(row), $event)">
                      <span class="material-icons" aria-hidden="true">more_vert</span>
                    </button>
                    @if (menuRow() === rowId()(row)) {
                      <div class="uit__menu" role="menu"
                        [style.top.px]="menuPos().top" [style.left.px]="menuPos().left"
                        (click)="$event.stopPropagation()">
                        <ng-container [ngTemplateOutlet]="actionsTpl()!" [ngTemplateOutletContext]="ctx(row, null)" />
                      </div>
                    }
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>

      @if (!loading() && pagedRows().length === 0) {
        <ui-empty-state [icon]="emptyIcon()" [title]="emptyTitle()" [description]="emptyDescription()">
          <ng-content select="[empty-actions]" />
        </ui-empty-state>
      }
    </div>

    @if (pageSize() > 0 && totalPages() > 1 && !loading()) {
      <div class="uit__pager">
        <span class="uit__pager-info">
          {{ pageStart() }}–{{ pageEnd() }} de <span [attr.data-numeric]="''">{{ sortedRows().length }}</span>
        </span>
        <div class="uit__pager-ctrls">
          <button type="button" class="uit__pager-btn" [disabled]="page() === 0" (click)="goPage(page() - 1)" aria-label="Anterior">
            <span class="material-icons" aria-hidden="true">chevron_left</span>
          </button>
          <span class="uit__pager-page" [attr.data-numeric]="''">{{ page() + 1 }} / {{ totalPages() }}</span>
          <button type="button" class="uit__pager-btn" [disabled]="page() >= totalPages() - 1" (click)="goPage(page() + 1)" aria-label="Siguiente">
            <span class="material-icons" aria-hidden="true">chevron_right</span>
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './ui-table.component.css',
})
export class UiTableComponent<T = Record<string, unknown>> {
  readonly columns = input.required<UiColumn[]>();
  readonly rows = input.required<T[]>();
  readonly selectable = input(false);
  readonly loading = input(false);
  readonly pageSize = input(0);
  readonly emptyTitle = input('Sin resultados');
  readonly emptyDescription = input('');
  readonly emptyIcon = input('inbox');
  /** Identidad de fila para selección y track (default: row.id ?? row). */
  readonly rowId = input<(row: T) => unknown>((row: T) => (row as Record<string, unknown>)?.['id'] ?? row);

  readonly selectionChange = output<T[]>();
  readonly sortChange = output<{ key: string; dir: SortDir }>();
  readonly pageChange = output<{ page: number; pageSize: number }>();
  readonly rowClick = output<T>();

  private readonly cells = contentChildren(UiCellDirective);

  private readonly sortKey = signal<string | null>(null);
  private readonly sortDir = signal<SortDir>(null);
  protected readonly page = signal(0);
  private readonly selection = signal<Set<unknown>>(new Set());
  protected readonly menuRow = signal<unknown>(null);
  protected readonly menuPos = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // ── Plantillas de celda ────────────────────────────────────────────────
  protected tpl(key: string) {
    return this.cells().find((c) => c.uiCell() === key)?.template ?? null;
  }
  protected actionsTpl() {
    return this.cells().find((c) => c.uiCell() === '__actions')?.template ?? null;
  }
  protected hasActions = computed(() => !!this.cells().find((c) => c.uiCell() === '__actions'));
  protected ctx(row: T, col: UiColumn | null) {
    return { $implicit: row, value: col ? this.valueOf(row, col.key) : undefined, row };
  }

  // ── Alineación / formato ───────────────────────────────────────────────
  protected alignOf(col: UiColumn): 'left' | 'right' | 'center' {
    return col.align ?? (col.type === 'number' || col.type === 'mono' ? 'right' : 'left');
  }
  protected valueOf(row: T, key: string): unknown {
    return (row as Record<string, unknown>)?.[key];
  }
  protected minWidth = computed(() => {
    // Suma de anchos reales: columnas con width fijo + 9rem por flexible +
    // selección (2.5) + acciones (3). Fuerza scroll sólo cuando de verdad no entra.
    let rem = (this.selectable() ? 2.5 : 0) + (this.hasActions() ? 3 : 0);
    for (const c of this.columns()) {
      const m = /^([\d.]+)rem$/.exec(c.width ?? '');
      rem += m ? parseFloat(m[1]) : 9;
    }
    return `${Math.max(rem, 24)}rem`;
  });

  // ── Orden ──────────────────────────────────────────────────────────────
  protected toggleSort(key: string): void {
    if (this.sortKey() !== key) { this.sortKey.set(key); this.sortDir.set('asc'); }
    else if (this.sortDir() === 'asc') { this.sortDir.set('desc'); }
    else if (this.sortDir() === 'desc') { this.sortKey.set(null); this.sortDir.set(null); }
    else { this.sortDir.set('asc'); }
    this.page.set(0);
    this.sortChange.emit({ key: this.sortKey() ?? key, dir: this.sortDir() });
  }
  protected sortIcon(key: string): string {
    if (this.sortKey() !== key) return 'unfold_more';
    return this.sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }
  protected ariaSort(col: UiColumn): string | null {
    if (!col.sortable || this.sortKey() !== col.key) return col.sortable ? 'none' : null;
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }
  protected readonly sortedRows = computed<T[]>(() => {
    const key = this.sortKey(); const dir = this.sortDir();
    const data = this.rows();
    if (!key || !dir) return data;
    const col = this.columns().find((c) => c.key === key);
    const numeric = col?.type === 'number' || col?.type === 'mono';
    const sorted = [...data].sort((a, b) => {
      const av = this.valueOf(a, key); const bv = this.valueOf(b, key);
      let cmp: number;
      if (numeric) cmp = (this.num(av) - this.num(bv));
      else cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'es', { numeric: true });
      return dir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  });
  private num(v: unknown): number {
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v ?? '').replace(/[^\d.-]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  // ── Paginación ─────────────────────────────────────────────────────────
  protected readonly totalPages = computed(() => {
    const ps = this.pageSize();
    return ps > 0 ? Math.max(1, Math.ceil(this.sortedRows().length / ps)) : 1;
  });
  protected readonly pagedRows = computed<T[]>(() => {
    const ps = this.pageSize();
    if (ps <= 0) return this.sortedRows();
    const start = this.page() * ps;
    return this.sortedRows().slice(start, start + ps);
  });
  protected pageStart = computed(() => this.sortedRows().length === 0 ? 0 : this.page() * this.pageSize() + 1);
  protected pageEnd = computed(() => Math.min((this.page() + 1) * this.pageSize(), this.sortedRows().length));
  protected goPage(p: number): void {
    const clamped = Math.max(0, Math.min(p, this.totalPages() - 1));
    this.page.set(clamped);
    this.pageChange.emit({ page: clamped, pageSize: this.pageSize() });
  }

  // ── Selección ──────────────────────────────────────────────────────────
  protected isSelected(row: T): boolean { return this.selection().has(this.rowId()(row)); }
  protected toggleRow(row: T): void {
    const id = this.rowId()(row);
    const next = new Set(this.selection());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selection.set(next);
    this.emitSelection();
  }
  protected toggleAll(checked: boolean): void {
    if (checked) this.selection.set(new Set(this.rows().map((r) => this.rowId()(r))));
    else this.selection.set(new Set());
    this.emitSelection();
  }
  protected allSelected = computed(() => {
    const rows = this.rows();
    return rows.length > 0 && rows.every((r) => this.selection().has(this.rowId()(r)));
  });
  protected someSelected = computed(() => this.selection().size > 0 && !this.allSelected());
  private emitSelection(): void {
    const sel = this.selection();
    this.selectionChange.emit(this.rows().filter((r) => sel.has(this.rowId()(r))));
  }

  // ── Menú de acciones ───────────────────────────────────────────────────
  protected toggleMenu(id: unknown, e: Event): void {
    e.stopPropagation();
    if (this.menuRow() === id) { this.menuRow.set(null); return; }
    const btn = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // Menú fijo, alineado a la derecha del kebab, para escapar del scroll de la tabla.
    this.menuPos.set({ top: Math.round(btn.bottom + 4), left: Math.round(btn.right) });
    this.menuRow.set(id);
  }
  protected closeMenu(): void { if (this.menuRow() !== null) this.menuRow.set(null); }

  // ── Skeleton ───────────────────────────────────────────────────────────
  protected skeletonRows(): number[] { return Array.from({ length: 6 }, (_, i) => i); }
}
