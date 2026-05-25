import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ICustomerInvoice } from '../../../model/customer-invoice.model';
import { IBranch } from '../../../model/branch.model';
import { ICompany } from '../../../model/company.model';
import { ICustomer } from '../../../model/customer.model';
import { CustomerInvoiceService } from '../../../services/customer-invoice.service';
import { ProductService } from '../../../services/product.service';
import { BranchService } from '../../../services/branch.service';
import { CompanyService } from '../../../services/company.service';
import { CustomerService } from '../../../services/customer.service';

interface IVoucherPreviewItem {
  id: string;
  brandName: string;
  model: string;
  description: string;
  quantity: number;
  price: number;
  taxRate: number;
  discountRate: number;
}

@Component({
  selector: 'app-customer-voucher-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-voucher-list.component.html',
  styleUrl: './customer-voucher-list.component.css',
})
export class CustomerVoucherListComponent implements OnInit {
  private readonly invoiceService = inject(CustomerInvoiceService);
  private readonly productService = inject(ProductService);
  private readonly branchService = inject(BranchService);
  private readonly companyService = inject(CompanyService);
  private readonly customerService = inject(CustomerService);

  vouchers: ICustomerInvoice[] = [];
  filteredVouchers: ICustomerInvoice[] = [];

  loading = false;
  errorMessage = '';
  showVoucherModal = false;
  loadingVoucher = false;
  selectedVoucher: ICustomerInvoice | null = null;
  selectedVoucherItems: IVoucherPreviewItem[] = [];
  selectedVoucherBranch: IBranch | null = null;
  selectedVoucherCompany: ICompany | null = null;
  selectedVoucherCustomer: ICustomer | null = null;

  filterType: string = 'ALL';
  filterFrom = '';
  filterTo = '';
  filterSearch = '';

  readonly typeOptions: Array<{ value: string; label: string }> = [
    { value: 'ALL', label: 'Todos' },
    { value: 'FACTURA_A', label: 'Factura A' },
    { value: 'FACTURA_B', label: 'Factura B' },
    { value: 'FACTURA_C', label: 'Factura C' },
    { value: 'NC_A', label: 'Nota de credito A' },
    { value: 'NC_B', label: 'Nota de credito B' },
    { value: 'NC_C', label: 'Nota de credito C' },
    { value: 'ND_A', label: 'Nota de debito A' },
    { value: 'ND_B', label: 'Nota de debito B' },
    { value: 'ND_C', label: 'Nota de debito C' },
    { value: 'PRESUPUESTO', label: 'Presupuesto' },
  ];

  ngOnInit(): void {
    this.loadVouchers();
  }

  loadVouchers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.invoiceService.getAll().subscribe({
      next: (data) => {
        this.vouchers = [...data].sort((a, b) => {
          const dateA = new Date(a.saleDate ?? a.invoiceDate ?? '').getTime();
          const dateB = new Date(b.saleDate ?? b.invoiceDate ?? '').getTime();
          return dateB - dateA;
        });
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudieron cargar los comprobantes.';
      },
    });
  }

  applyFilters(): void {
    const search = this.filterSearch.trim().toLowerCase();

    this.filteredVouchers = this.vouchers.filter((voucher) => {
      const type = this.normalizeVoucherType(voucher.saleType ?? voucher.invoiceType ?? '');
      const saleDate = voucher.saleDate ?? voucher.invoiceDate ?? '';
      const number = String(voucher.saleNumber ?? voucher.invoiceNumber ?? '');

      if (this.filterType !== 'ALL' && type !== this.filterType) {
        return false;
      }

      if (this.filterFrom && saleDate < this.filterFrom) {
        return false;
      }

      if (this.filterTo && saleDate > this.filterTo) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        this.getVoucherTypeLabel(type).toLowerCase().includes(search)
        || number.toLowerCase().includes(search)
        || String(voucher.observations ?? '').toLowerCase().includes(search)
      );
    });
  }

  getVoucherTypeLabel(type: string): string {
    const normalized = this.normalizeVoucherType(type);
    return this.typeOptions.find((item) => item.value === normalized)?.label ?? normalized;
  }

  getFormattedVoucherNumber(voucher: ICustomerInvoice): string {
    const raw = String(voucher.saleNumber ?? voucher.invoiceNumber ?? '');
    const match = /^(\d+)-(\d+)$/.exec(raw);
    if (!match) {
      return raw || '-';
    }

    return `${match[1].padStart(3, '0')} - ${match[2].padStart(6, '0')}`;
  }

  openVoucher(voucherId: string | undefined): void {
    if (!voucherId) {
      return;
    }

    this.loadingVoucher = true;
    this.selectedVoucher = null;
    this.showVoucherModal = true;

    this.invoiceService.getById(voucherId).subscribe({
      next: (voucher) => {
        this.selectedVoucher = voucher;
        this.loadVoucherContext(voucher);
      },
      error: () => {
        this.loadingVoucher = false;
      },
    });
  }

  closeVoucherModal(): void {
    this.showVoucherModal = false;
    this.loadingVoucher = false;
    this.selectedVoucher = null;
    this.selectedVoucherItems = [];
    this.selectedVoucherBranch = null;
    this.selectedVoucherCompany = null;
    this.selectedVoucherCustomer = null;
  }

  getVoucherLineSubtotal(item: { price: number; quantity: number; discountRate: number }): number {
    return item.price * item.quantity * ((100 - item.discountRate) / 100);
  }

  private loadVoucherContext(voucher: ICustomerInvoice): void {
    const itemRequests = (voucher.items ?? []).map((item) =>
      this.productService.getProduct(item.id).pipe(catchError(() => of(null)))
    );

    forkJoin({
      products: itemRequests.length ? forkJoin(itemRequests) : of([]),
      branch: voucher.branchId ? this.branchService.getBranch(voucher.branchId).pipe(catchError(() => of(null))) : of(null),
      customer: voucher.customerId ? this.customerService.getById(voucher.customerId).pipe(catchError(() => of(null))) : of(null),
    }).subscribe({
      next: ({ products, branch, customer }) => {
        this.selectedVoucherItems = (voucher.items ?? []).map((item, index) => {
          const product = products[index];
          return {
            id: item.id,
            brandName: product?.brandName ?? item.brandName ?? '-',
            model: product?.model ?? item.model ?? '-',
            description: product?.description ?? item.description ?? '-',
            quantity: item.quantity,
            price: item.price,
            taxRate: item.taxRate,
            discountRate: item.discountRate,
          };
        });

        this.selectedVoucherBranch = branch;
        this.selectedVoucherCustomer = customer;

        if (branch?.companyId) {
          this.companyService.getCompany(branch.companyId).pipe(catchError(() => of(null))).subscribe({
            next: (company) => {
              this.selectedVoucherCompany = company;
              this.loadingVoucher = false;
            },
            error: () => {
              this.loadingVoucher = false;
            },
          });
          return;
        }

        this.selectedVoucherCompany = null;
        this.loadingVoucher = false;
      },
      error: () => {
        this.loadingVoucher = false;
      },
    });
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
