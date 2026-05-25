import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Output, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ISupplier } from '../../../model/supplier.model';
import { SupplierService } from '../../../services/supplier.service';

@Component({
    selector: 'app-supplier-navbar',
    imports: [CommonModule, RouterLink],
    templateUrl: './supplier-navbar.component.html',
    styleUrl: './supplier-navbar.component.css'
})
export class SupplierNavbarComponent implements OnInit {
  @Output() newSupplier = new EventEmitter<void>();
  @Output() editSupplier = new EventEmitter<void>();
  @Output() openAccountStatement = new EventEmitter<void>();
  selectedSupplier: ISupplier | null = null;
  openMenu: 'listados' | 'informes' | 'acciones' | null = null;
  readonly _supplierService = inject(SupplierService);

  ngOnInit(): void {
    this._supplierService.selectedSupplier$.subscribe((supplier) => {
      this.selectedSupplier = supplier;
    });
  }

  onOpenStatementClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.selectedSupplier) {
      return;
    }
    this.openAccountStatement.emit();
    this.closeMenu();
  }

  toggleMenu(menu: 'listados' | 'informes' | 'acciones'): void {
    this.openMenu = this.openMenu === menu ? null : menu;
  }

  onNewSupplierClick(event: MouseEvent): void {
    event.stopPropagation();
    this.newSupplier.emit();
  }

  onEditSupplierClick(event: MouseEvent): void {
    event.stopPropagation();
    this.editSupplier.emit();
  }

  closeMenu(): void {
    this.openMenu = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.snav__dropdown')) {
      this.closeMenu();
    }
  }
}
