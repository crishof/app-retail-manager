import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { Toast } from '../../../core/models';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-live="polite" aria-label="Notificaciones">
      @for (toast of toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type">
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close" (click)="dismiss(toast.id)" aria-label="Cerrar">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }
    .toast {
      background: #1a1a2e;
      color: #fff;
      padding: 11px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: toastIn .28s cubic-bezier(.21,1.02,.73,1);
      border-left: 3px solid var(--red);
      pointer-events: all;
      max-width: 320px;
      box-shadow: 0 4px 16px rgba(0,0,0,.3);
    }
    .toast-success { border-left-color: #16a34a; }
    .toast-error   { border-left-color: #dc2626; }
    .toast-info    { border-left-color: #3b82f6; }
    .toast-msg { flex: 1; line-height: 1.4; }
    .toast-close {
      background: none;
      border: none;
      color: #ffffff80;
      cursor: pointer;
      font-size: 11px;
      padding: 0;
      flex-shrink: 0;
    }
    .toast-close:hover { color: #fff; }
    @keyframes toastIn {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: none; opacity: 1; }
    }
  `]
})
export class ToastComponent {
  private toastSvc = inject(ToastService);
  readonly toasts  = this.toastSvc.toasts;

  dismiss(id: number): void {
    this.toastSvc.dismiss(id);
  }
}
