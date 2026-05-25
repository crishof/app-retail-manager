import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ICustomerInvoice } from '../../../model/customer-invoice.model';
import { CustomerInvoiceService } from '../../../services/customer-invoice.service';

@Component({
  selector: 'app-customer-voucher-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-voucher-detail.component.html',
  styleUrl: './customer-voucher-detail.component.css',
})
export class CustomerVoucherDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly invoiceService = inject(CustomerInvoiceService);

  voucher: ICustomerInvoice | null = null;
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'No se recibio un id de comprobante.';
      return;
    }
    this.loadVoucher(id);
  }

  loadVoucher(id: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.invoiceService.getById(id).subscribe({
      next: (data) => {
        this.voucher = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudo cargar el comprobante.';
      },
    });
  }

  getVoucherTypeLabel(type: string): string {
    const normalized = this.normalizeVoucherType(type);
    const labels: Record<string, string> = {
      FACTURA_A: 'Factura A',
      FACTURA_B: 'Factura B',
      FACTURA_C: 'Factura C',
      NC_A: 'Nota de credito A',
      NC_B: 'Nota de credito B',
      NC_C: 'Nota de credito C',
      ND_A: 'Nota de debito A',
      ND_B: 'Nota de debito B',
      ND_C: 'Nota de debito C',
      PRESUPUESTO: 'Presupuesto',
    };

    return labels[normalized] ?? normalized;
  }

  formatVoucherNumber(voucher: ICustomerInvoice | null): string {
    const raw = String(voucher?.saleNumber ?? voucher?.invoiceNumber ?? '');
    const match = /^(\d+)-(\d+)$/.exec(raw);
    if (!match) {
      return raw || '-';
    }

    return `${match[1].padStart(3, '0')} - ${match[2].padStart(6, '0')}`;
  }

  getLineTotal(item: { price: number; quantity: number; discountRate?: number }): number {
    const discount = item.discountRate ?? 0;
    return item.price * item.quantity * ((100 - discount) / 100);
  }

  private normalizeVoucherType(type: string): string {
    const normalized = (type || '').toUpperCase().trim();
    switch (normalized) {
      case 'A':
        return 'FACTURA_A';
      case 'B':
        return 'FACTURA_B';
      case 'C':
        return 'FACTURA_C';
      default:
        return normalized;
    }
  }
}
