import { Component, Input } from '@angular/core';

import { IProductPriceLink } from '../../model/product-price-link.model';
import { PriceAlertBadgeComponent } from '../price-alert-badge/price-alert-badge.component';
import { PriceHistoryModalComponent } from '../price-history-modal/price-history-modal.component';

@Component({
  selector: 'app-price-alerts-with-history',
  standalone: true,
  imports: [PriceAlertBadgeComponent, PriceHistoryModalComponent],
  templateUrl: './price-alerts-with-history.component.html',
  styleUrl: './price-alerts-with-history.component.css'
})
export class PriceAlertsWithHistoryComponent {
  @Input() alerts: IProductPriceLink[] = [];
  
  selectedLink: IProductPriceLink | null = null;
  showHistoryModal = false;

  onBadgeClick(alert: IProductPriceLink): void {
    this.selectedLink = alert;
    this.showHistoryModal = true;
  }

  onCloseModal(): void {
    this.showHistoryModal = false;
    this.selectedLink = null;
  }
}
