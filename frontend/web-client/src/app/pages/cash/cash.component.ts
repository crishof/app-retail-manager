import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  CashService,
  ICashQueryTarget,
  ICashSessionResponse,
  ICashMovementResponse,
  TCurrencyCode,
} from '../../services/cash.service';
import { BranchService } from '../../services/branch.service';
import { IBranch } from '../../model/branch.model';
import { ICustomerInvoice } from '../../model/customer-invoice.model';
import { CustomerInvoiceService } from '../../services/customer-invoice.service';
import { ProductService } from '../../services/product.service';
import { CompanyService } from '../../services/company.service';
import { CustomerService } from '../../services/customer.service';
import { ICompany } from '../../model/company.model';
import { ICustomer } from '../../model/customer.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
  selector: 'app-cash',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cash.component.html',
  styleUrls: ['./cash.component.css'],
})
export class CashComponent implements OnInit {
  private readonly cashService = inject(CashService);
  private readonly branchService = inject(BranchService);
  private readonly customerInvoiceService = inject(CustomerInvoiceService);
  private readonly productService = inject(ProductService);
  private readonly companyService = inject(CompanyService);
  private readonly customerService = inject(CustomerService);
  private readonly fb = inject(FormBuilder);

  branches: IBranch[] = [];
  selectedBranchId: string = '';
  selectedCashType: 'CENTRAL' | 'BRANCH' = 'BRANCH';

  currentSession: ICashSessionResponse | null = null;
  movements: ICashMovementResponse[] = [];
  historySessions: ICashSessionResponse[] = [];
  selectedHistorySession: ICashSessionResponse | null = null;
  historyMovements: ICashMovementResponse[] = [];

  loading = false;
  errorMessage = '';
  showVoucherModal = false;
  loadingVoucher = false;
  selectedVoucher: ICustomerInvoice | null = null;
  selectedVoucherItems: IVoucherPreviewItem[] = [];
  selectedVoucherBranch: IBranch | null = null;
  selectedVoucherCompany: ICompany | null = null;
  selectedVoucherCustomer: ICustomer | null = null;

  // Open session form
  showOpenForm = false;
  openForm: FormGroup = this.fb.group({
    openingBalance: [0, [Validators.required, Validators.min(0)]],
    notes: [''],
  });
  isOpening = false;
  openError = '';

  // Close session form
  showCloseForm = false;
  closeForm: FormGroup = this.fb.group({
    closingBalance: [0, [Validators.required, Validators.min(0)]],
    notes: [''],
  });
  isClosing = false;
  closeError = '';

  // Movement form
  showMovementForm = false;
  movementForm: FormGroup = this.fb.group({
    type: ['INCOME', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['ARS', Validators.required],
    exchangeRateToArs: [1, [Validators.required, Validators.min(0.000001)]],
    description: ['', Validators.required],
    reference: [''],
  });
  isSavingMovement = false;
  movementError = '';
  movementSuccess = false;

  activeView: 'session' | 'history' = 'session';
  selectedArqueoCurrency: TCurrencyCode = 'ARS';

  readonly currencies: TCurrencyCode[] = ['ARS', 'USD', 'EUR'];
  readonly exchangeRatesToArs: Record<TCurrencyCode, number> = {
    ARS: 1,
    USD: 1100,
    EUR: 1200,
  };

  readonly denominations: Record<TCurrencyCode, number[]> = {
    ARS: [20000, 10000, 2000, 1000, 500, 200, 100, 50, 20, 10],
    USD: [100, 50, 20, 10, 5, 1],
    EUR: [500, 200, 100, 50, 20, 10, 5],
  };

  readonly arqueoCounts: Record<TCurrencyCode, Record<number, number>> = {
    ARS: {},
    USD: {},
    EUR: {},
  };

  readonly movementTypes = [
    { value: 'INCOME', label: 'Ingreso' },
    { value: 'EXPENSE', label: 'Egreso' },
    { value: 'CUSTOMER_PAYMENT', label: 'Cobro recibido' },
    { value: 'SUPPLIER_PAYMENT', label: 'Pago realizado' },
  ];

  readonly typeLabels: Record<string, string> = {
    INCOME: 'Ingreso',
    EXPENSE: 'Egreso',
    SALE: 'Venta',
    CUSTOMER_PAYMENT: 'Cobro cliente',
    SUPPLIER_PAYMENT: 'Pago proveedor',
    OPENING: 'Apertura',
    CLOSING: 'Cierre',
  };

  ngOnInit(): void {
    this.closeForm.get('closingBalance')?.disable({ emitEvent: false });
    this.refreshExchangeRates();

    this.branchService.getBranches().subscribe({
      next: (branches) => {
        this.branches = branches.filter((b) => b.active);
        if (this.branches.length > 0) {
          this.selectedBranchId = this.branches[0].id;
        }
        this.loadCurrentSession();
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las sucursales.';
      },
    });
  }

  onCashTypeChange(event: Event): void {
    this.selectedCashType = (event.target as HTMLSelectElement).value as 'CENTRAL' | 'BRANCH';
    this.resetStateAndLoad();
  }

  onBranchChange(event: Event): void {
    this.selectedBranchId = (event.target as HTMLSelectElement).value;
    this.resetStateAndLoad();
  }

  loadCurrentSession(): void {
    if (this.selectedCashType === 'BRANCH' && !this.selectedBranchId) return;

    this.loading = true;
    this.cashService.getCurrentSession(this.getQueryTarget()).subscribe({
      next: (session) => {
        this.currentSession = session;
        this.loading = false;
        this.loadMovements(session.id);
      },
      error: () => {
        this.currentSession = null;
        this.movements = [];
        this.loading = false;
      },
    });
  }

  loadMovements(sessionId: string): void {
    this.cashService.getMovements(sessionId).subscribe({
      next: (mvs) => {
        this.movements = mvs;
        this.hydrateSaleMovementDescriptions(this.movements);
      },
    });
  }

  loadHistory(): void {
    if (this.selectedCashType === 'BRANCH' && !this.selectedBranchId) return;

    this.cashService.getAllSessions(this.getQueryTarget()).subscribe({
      next: (sessions) => {
        this.historySessions = sessions;
        if (
          this.selectedHistorySession &&
          !sessions.some((session) => session.id === this.selectedHistorySession!.id)
        ) {
          this.selectedHistorySession = null;
          this.historyMovements = [];
        }
      },
    });
  }

  selectHistorySession(session: ICashSessionResponse): void {
    this.selectedHistorySession = session;
    this.cashService.getMovements(session.id).subscribe({
      next: (mvs) => {
        this.historyMovements = mvs;
        this.hydrateSaleMovementDescriptions(this.historyMovements);
      },
    });
  }

  switchView(view: 'session' | 'history'): void {
    this.activeView = view;
    if (view === 'history') {
      this.loadHistory();
    }
  }

  // Open session
  onOpenSession(): void {
    if (this.openForm.invalid) return;
    if (this.selectedCashType === 'BRANCH' && !this.selectedBranchId) {
      this.openError = 'Seleccione una sucursal para abrir caja.';
      return;
    }

    this.isOpening = true;
    this.openError = '';

    const request = {
      openingBalance: this.openForm.value.openingBalance,
      notes: this.openForm.value.notes || undefined,
      ...(this.selectedCashType === 'BRANCH' ? { branchId: this.selectedBranchId } : {}),
    };

    this.cashService
      .openSession(request)
      .subscribe({
        next: (session) => {
          this.currentSession = session;
          this.loadMovements(session.id);
          this.showOpenForm = false;
          this.openForm.reset({ openingBalance: 0, notes: '' });
          this.isOpening = false;
        },
        error: () => {
          this.openError = 'Error al abrir la sesión de caja.';
          this.isOpening = false;
        },
      });
  }

  // Close session
  onCloseSession(): void {
    if (!this.currentSession) return;

    const closingBalance = this.arqueoTotalArs;
    this.closeForm.get('closingBalance')?.setValue(closingBalance, { emitEvent: false });

    if (closingBalance < 0) {
      this.closeError = 'El arqueo no puede ser negativo.';
      return;
    }

    this.isClosing = true;
    this.closeError = '';

    const countedTotalsByCurrency: Partial<Record<TCurrencyCode, number>> = {
      ARS: this.getCurrencyTotal('ARS'),
      USD: this.getCurrencyTotal('USD'),
      EUR: this.getCurrencyTotal('EUR'),
    };

    this.cashService
      .closeSession(this.currentSession.id, {
        closingBalance,
        countedTotalsByCurrency,
        exchangeRatesToArs: this.exchangeRatesToArs,
        notes: this.closeForm.value.notes || undefined,
      })
      .subscribe({
        next: (session) => {
          this.currentSession = null;
          this.movements = [];
          this.showCloseForm = false;
          this.closeForm.reset({ closingBalance: 0, notes: '' });
          this.closeForm.get('closingBalance')?.disable({ emitEvent: false });
          this.resetArqueo();
          this.isClosing = false;
          this.loadHistory();
        },
        error: () => {
          this.closeError = 'Error al cerrar la sesión de caja.';
          this.isClosing = false;
        },
      });
  }

  // Add movement
  onAddMovement(): void {
    if (!this.currentSession || this.movementForm.invalid) return;
    this.isSavingMovement = true;
    this.movementError = '';
    this.movementSuccess = false;
    this.cashService
      .addMovement(this.currentSession.id, {
        type: this.movementForm.value.type,
        amount: this.movementForm.value.amount,
        currency: this.selectedMovementCurrency,
        exchangeRateToArs: this.selectedMovementRate,
        description: this.movementForm.value.description,
        reference: this.movementForm.value.reference || undefined,
      })
      .subscribe({
        next: (mv) => {
          this.movements.push(mv);
          this.movementSuccess = true;
          this.movementForm.reset({
            type: 'INCOME',
            amount: 0,
            currency: 'ARS',
            exchangeRateToArs: 1,
            description: '',
            reference: '',
          });
          this.showMovementForm = false;
          this.isSavingMovement = false;
          // Refresh session totals
          this.cashService.getSessionById(this.currentSession!.id).subscribe({
            next: (s) => (this.currentSession = s),
          });
          setTimeout(() => (this.movementSuccess = false), 3000);
        },
        error: () => {
          this.movementError = 'Error al registrar el movimiento.';
          this.isSavingMovement = false;
        },
      });
  }

  isIncome(type: string): boolean {
    return ['INCOME', 'SALE', 'CUSTOMER_PAYMENT', 'OPENING'].includes(type);
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  canOpenVoucher(type: string, reference: string | null): boolean {
    return type === 'SALE' && !!reference;
  }

  openVoucher(reference: string | null): void {
    if (!reference) {
      return;
    }

    this.showVoucherModal = true;
    this.loadingVoucher = true;
    this.selectedVoucher = null;

    this.customerInvoiceService.getById(reference).subscribe({
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

  getVoucherTypeLabel(type: string): string {
    const normalized = (type || '').toUpperCase().trim();
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
      A: 'Factura A',
      B: 'Factura B',
      C: 'Factura C',
    };

    return labels[normalized] ?? normalized;
  }

  getFormattedVoucherNumber(voucher: ICustomerInvoice | null): string {
    const raw = String(voucher?.saleNumber ?? voucher?.invoiceNumber ?? '');
    const match = /^(\d+)-(\d+)$/.exec(raw);
    if (!match) {
      return raw || '-';
    }

    return `${match[1].padStart(3, '0')} - ${match[2].padStart(6, '0')}`;
  }

  getVoucherLineSubtotal(item: { price: number; quantity: number; discountRate: number }): number {
    return item.price * item.quantity * ((100 - item.discountRate) / 100);
  }

  private loadVoucherContext(voucher: ICustomerInvoice): void {
    const itemRequests = (voucher.items ?? []).map((item: any) =>
      this.productService.getProduct(String(item.productId || item.id)).pipe(catchError(() => of(null)))
    );

    forkJoin({
      products: itemRequests.length ? forkJoin(itemRequests) : of([]),
      branch: voucher.branchId ? this.branchService.getBranch(voucher.branchId).pipe(catchError(() => of(null))) : of(null),
      customer: voucher.customerId ? this.customerService.getById(voucher.customerId).pipe(catchError(() => of(null))) : of(null),
    }).subscribe({
      next: ({ products, branch, customer }) => {
        this.selectedVoucherItems = (voucher.items ?? []).map((item: any, index) => {
          const product = products[index];
          return {
            id: String(item.productId || item.id),
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

  private hydrateSaleMovementDescriptions(movements: ICashMovementResponse[]): void {
    const saleMovements = movements.filter((mv) => mv.type === 'SALE' && !!mv.reference);
    if (saleMovements.length === 0) {
      return;
    }

    const requests = saleMovements.map((mv) =>
      this.customerInvoiceService.getById(mv.reference!).pipe(catchError(() => of(null)))
    );

    forkJoin(requests).subscribe({
      next: (vouchers) => {
        saleMovements.forEach((movement, index) => {
          const voucher = vouchers[index];
          if (!voucher) {
            return;
          }

          const customerName = this.extractCustomerNameFromMovementDescription(movement.description);
          const formattedRef = this.buildSaleReferenceForMovement(voucher);
          movement.description = customerName ? `${formattedRef} - ${customerName}` : formattedRef;
        });
      },
    });
  }

  private buildSaleReferenceForMovement(voucher: ICustomerInvoice): string {
    const voucherType = String(voucher.saleType ?? voucher.invoiceType ?? '').toUpperCase();
    const saleNumberRaw = String(voucher.saleNumber ?? voucher.invoiceNumber ?? '');
    const voucherNumber = this.extractVoucherCorrelative(saleNumberRaw).padStart(6, '0');
    return `${this.getVoucherAbbreviation(voucherType)}${voucherNumber}`;
  }

  private extractVoucherCorrelative(raw: string): string {
    const value = String(raw ?? '').trim();
    if (!value) {
      return '000001';
    }

    const parts = value.split('-');
    const lastPart = (parts.at(-1) ?? value).trim();
    const digits = lastPart.replace(/\D/g, '');
    return digits || '000001';
  }

  private extractCustomerNameFromMovementDescription(description: string): string {
    const raw = String(description ?? '').trim();
    if (!raw) {
      return '';
    }

    const segments = raw.split(' - ');
    if (segments.length < 2) {
      return '';
    }

    return segments.slice(1).join(' - ').trim();
  }

  private getVoucherAbbreviation(voucherType: string): string {
    const map: Record<string, string> = {
      FACTURA_A: 'FA',
      FACTURA_B: 'FB',
      FACTURA_C: 'FC',
      NC_A: 'NCA',
      NC_B: 'NCB',
      NC_C: 'NCC',
      ND_A: 'NDA',
      ND_B: 'NDB',
      ND_C: 'NDC',
      PRESUPUESTO: 'PRES',
    };

    return map[voucherType] ?? 'COMP';
  }

  onMovementCurrencyChange(event: Event): void {
    const currency = (event.target as HTMLSelectElement).value as TCurrencyCode;
    this.movementForm.patchValue({
      currency,
      exchangeRateToArs: currency === 'ARS' ? 1 : this.exchangeRatesToArs[currency],
    });
  }

  onRateChange(currency: TCurrencyCode, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    this.exchangeRatesToArs[currency] = value;
    if (this.selectedMovementCurrency === currency) {
      this.movementForm.patchValue({ exchangeRateToArs: value });
    }
  }

  refreshExchangeRates(): void {
    this.cashService.getExchangeRatesToArs().subscribe({
      next: (rates) => {
        if (rates.USD && rates.USD > 0) {
          this.exchangeRatesToArs.USD = rates.USD;
        }
        if (rates.EUR && rates.EUR > 0) {
          this.exchangeRatesToArs.EUR = rates.EUR;
        }

        if (this.selectedMovementCurrency !== 'ARS') {
          this.movementForm.patchValue({
            exchangeRateToArs: this.exchangeRatesToArs[this.selectedMovementCurrency],
          });
        }
      },
      error: () => {
        // Fallback ya cargado en exchangeRatesToArs; no cortamos el flujo de caja.
      },
    });
  }

  onArqueoCountChange(currency: TCurrencyCode, denomination: number, event: Event): void {
    const qty = Math.max(0, Math.floor(Number((event.target as HTMLInputElement).value) || 0));
    this.arqueoCounts[currency][denomination] = qty;
    this.closeForm.get('closingBalance')?.setValue(this.arqueoTotalArs, { emitEvent: false });
  }

  selectArqueoCurrency(currency: TCurrencyCode): void {
    this.selectedArqueoCurrency = currency;
  }

  getDenominationsFor(currency: TCurrencyCode): number[] {
    return this.denominations[currency];
  }

  getCount(currency: TCurrencyCode, denomination: number): number {
    return this.arqueoCounts[currency][denomination] ?? 0;
  }

  getSubtotalForDenomination(currency: TCurrencyCode, denomination: number): number {
    return this.getCount(currency, denomination) * denomination;
  }

  getCurrencyTotal(currency: TCurrencyCode): number {
    return this.denominations[currency].reduce(
      (acc, denomination) => acc + this.getSubtotalForDenomination(currency, denomination),
      0
    );
  }

  get arqueoTotalArs(): number {
    return this.currencies.reduce((acc, currency) => {
      const subtotal = this.getCurrencyTotal(currency);
      return acc + subtotal * this.exchangeRatesToArs[currency];
    }, 0);
  }

  get selectedMovementCurrency(): TCurrencyCode {
    return (this.movementForm.value.currency as TCurrencyCode) ?? 'ARS';
  }

  get selectedMovementRate(): number {
    const rate = Number(this.movementForm.value.exchangeRateToArs) || 0;
    if (this.selectedMovementCurrency === 'ARS') {
      return 1;
    }
    return rate > 0 ? rate : this.exchangeRatesToArs[this.selectedMovementCurrency];
  }

  get movementArsAmount(): number {
    const amount = Number(this.movementForm.value.amount) || 0;
    return amount * this.selectedMovementRate;
  }

  get closeDifference(): number {
    const expected = this.currentSession?.expectedBalance ?? 0;
    return this.arqueoTotalArs - expected;
  }

  get hasSelectedHistoryArqueo(): boolean {
    return this.currencies.some((currency) => this.getHistoryCountedTotal(currency) > 0);
  }

  get historyArqueoTotalArs(): number {
    if (!this.selectedHistorySession) {
      return 0;
    }

    if (!this.hasSelectedHistoryArqueo) {
      return this.selectedHistorySession.closingBalance;
    }

    return this.currencies.reduce((acc, currency) => acc + this.getHistoryConvertedTotal(currency), 0);
  }

  get historyCloseDifference(): number {
    if (!this.selectedHistorySession) {
      return 0;
    }
    return this.historyArqueoTotalArs - this.selectedHistorySession.expectedBalance;
  }

  getHistoryCountedTotal(currency: TCurrencyCode): number {
    if (!this.selectedHistorySession?.countedTotalsByCurrency) {
      return 0;
    }
    return Number(this.selectedHistorySession.countedTotalsByCurrency[currency] ?? 0);
  }

  getHistoryRate(currency: TCurrencyCode): number {
    if (currency === 'ARS') {
      return 1;
    }
    return Number(this.selectedHistorySession?.exchangeRatesToArs?.[currency] ?? 0);
  }

  getHistoryConvertedTotal(currency: TCurrencyCode): number {
    return this.getHistoryCountedTotal(currency) * this.getHistoryRate(currency);
  }

  get showBranchSelector(): boolean {
    return this.selectedCashType === 'BRANCH';
  }

  get currentCashLabel(): string {
    if (this.selectedCashType === 'CENTRAL') {
      return 'Caja central de empresa';
    }
    return 'Caja de sucursal';
  }

  get currentTargetName(): string {
    if (this.selectedCashType === 'CENTRAL') {
      return 'Caja central';
    }
    return this.branches.find((branch) => branch.id === this.selectedBranchId)?.name ?? 'Sucursal';
  }

  private resetStateAndLoad(): void {
    this.currentSession = null;
    this.movements = [];
    this.historySessions = [];
    this.selectedHistorySession = null;
    this.historyMovements = [];
    this.errorMessage = '';
    this.showOpenForm = false;
    this.showCloseForm = false;
    this.showMovementForm = false;
    this.resetArqueo();
    this.loadCurrentSession();
    if (this.activeView === 'history') {
      this.loadHistory();
    }
  }

  private getQueryTarget(): ICashQueryTarget {
    if (this.selectedCashType === 'CENTRAL') {
      return { central: true };
    }

    return {
      central: false,
      branchId: this.selectedBranchId,
    };
  }

  private resetArqueo(): void {
    this.selectedArqueoCurrency = 'ARS';
    this.arqueoCounts.ARS = {};
    this.arqueoCounts.USD = {};
    this.arqueoCounts.EUR = {};
    this.closeForm.get('closingBalance')?.setValue(0, { emitEvent: false });
  }
}
