import { Component, EventEmitter, Output, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';


@Component({
    selector: 'app-product-navbar',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './product-navbar.component.html',
    styleUrl: './product-navbar.component.css',
})
export class ProductNavbarComponent {
    @Output() newProduct    = new EventEmitter<void>();
    @Output() editProduct   = new EventEmitter<void>();
    @Output() deleteProduct = new EventEmitter<void>();
    @Output() billProduct   = new EventEmitter<void>();

    openMenu: string | null = null;

    toggleMenu(name: string) {
        this.openMenu = this.openMenu === name ? null : name;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (!target.closest('.pnav__dropdown')) {
            this.openMenu = null;
        }
    }
}
