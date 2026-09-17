import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from './shared/components/topbar/topbar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { MegamenuComponent } from './shared/components/megamenu/megamenu.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { TenantService } from './core/services/tenant.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    TopbarComponent,
    NavbarComponent,
    MegamenuComponent,
    FooterComponent,
    ToastComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private tenantSvc = inject(TenantService);

  ngOnInit(): void {
    // Ensure CSS variables are applied from persisted tenant on startup
    this.tenantSvc.current();
  }
}
