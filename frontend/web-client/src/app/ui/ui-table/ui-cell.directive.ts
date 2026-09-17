import { Directive, TemplateRef, inject, input } from '@angular/core';

/**
 * Plantilla de celda para una columna de <ui-table>. Permite contenido rico
 * (tags, links, importes) manteniendo la tabla config-driven.
 *
 *   <ng-template uiCell="estado" let-row let-value="value">
 *     <ui-tag [tone]="row.pagado ? 'ok' : 'attn'">{{ value }}</ui-tag>
 *   </ng-template>
 *
 * La clave especial "__actions" define la columna de acciones (sticky a la
 * derecha). Contexto expuesto: $implicit = row, value = row[key], index.
 */
@Directive({
  selector: 'ng-template[uiCell]',
  standalone: true,
})
export class UiCellDirective {
  /** Clave de la columna a la que aplica esta plantilla (o "__actions"). */
  readonly uiCell = input.required<string>();
  readonly template = inject(TemplateRef);
}
