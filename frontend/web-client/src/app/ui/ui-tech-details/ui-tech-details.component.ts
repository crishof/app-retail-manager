import { ChangeDetectionStrategy, Component, inject, input, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Desplegable con detalle técnico y botón de copiar. Para trazas, payloads,
 * IDs de error: colapsado por defecto, mono, con copia al portapapeles.
 */
@Component({
  selector: 'ui-tech-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="ui-tech" [open]="open()">
      <summary class="ui-tech__summary" (click)="toggle($event)">
        <span class="material-icons ui-tech__chevron" aria-hidden="true">chevron_right</span>
        <span>{{ label() }}</span>
      </summary>
      <div class="ui-tech__body">
        <button type="button" class="ui-tech__copy" (click)="copy()" [attr.aria-label]="copied() ? 'Copiado' : 'Copiar'">
          <span class="material-icons" aria-hidden="true">{{ copied() ? 'check' : 'content_copy' }}</span>
          {{ copied() ? 'Copiado' : 'Copiar' }}
        </button>
        <pre class="ui-tech__pre"><code>{{ content() }}</code></pre>
      </div>
    </details>
  `,
  styles: [`
    :host { display: block; }
    .ui-tech { border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--surface-2); overflow: hidden; }
    .ui-tech__summary {
      display: flex; align-items: center; gap: .375rem; cursor: pointer; list-style: none;
      padding: .5rem .75rem; font-size: var(--fs-sm); font-weight: 600; color: var(--ink-2);
    }
    .ui-tech__summary::-webkit-details-marker { display: none; }
    .ui-tech__chevron { font-size: 1.125rem; transition: transform var(--t); }
    .ui-tech[open] .ui-tech__chevron { transform: rotate(90deg); }
    .ui-tech__body { position: relative; padding: 0 .75rem .75rem; }
    .ui-tech__copy {
      position: absolute; top: .25rem; right: .5rem;
      display: inline-flex; align-items: center; gap: .25rem;
      background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--r-sm);
      padding: .1875rem .4375rem; font-size: var(--fs-xs); color: var(--ink-2); cursor: pointer;
    }
    .ui-tech__copy .material-icons { font-size: .875rem; }
    .ui-tech__pre {
      margin: 0; padding: .625rem; overflow-x: auto;
      font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--ink); line-height: 1.5;
      background: var(--sunken); border-radius: var(--r-sm);
    }
  `],
})
export class UiTechDetailsComponent {
  readonly label = input<string>('Detalle técnico');
  readonly content = input.required<string>();

  protected readonly open = signal(false);
  protected readonly copied = signal(false);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected toggle(e: Event): void {
    e.preventDefault();
    this.open.set(!this.open());
  }

  protected async copy(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      await navigator.clipboard.writeText(this.content());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch {
      /* clipboard no disponible */
    }
  }
}
