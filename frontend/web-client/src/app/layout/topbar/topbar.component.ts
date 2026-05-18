import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  private readonly router = inject(Router);
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  notificationCount = 3;
  showUserMenu = false;
  showSearchInput = false;
  quickSearchTerm = '';

  onToggle() {
    this.toggleSidebar.emit();
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleSearchInput() {
    this.showSearchInput = !this.showSearchInput;
    if (!this.showSearchInput) {
      this.quickSearchTerm = '';
    }
  }

  onSearchButtonClick() {
    if (this.showSearchInput && this.quickSearchTerm.trim().length > 0) {
      this.submitQuickSearch();
      return;
    }

    this.toggleSearchInput();
  }

  submitQuickSearch() {
    const term = this.quickSearchTerm.trim();
    if (!term) {
      return;
    }

    this.router.navigate(['/products'], {
      queryParams: { q: term },
    });

    this.showSearchInput = false;
    this.quickSearchTerm = '';
  }
}
