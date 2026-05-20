import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { IBranch } from "../../../model/branch.model";
import { ILocation } from "../../../model/location.model";
import { IInvoiceItem } from "../../../model/invoice-item.model";
import { IProduct } from "../../../model/product.model";
import { ICustomer } from "../../../model/customer.model";
import { CustomerInvoiceService } from "../../../services/customer-invoice.service";
import { Subscription } from "rxjs";
import { ProductService } from "../../../services/product.service";
import { BranchService } from "../../../services/branch.service";
import { CustomerService } from "../../../services/customer.service";
import { CashService, ICashSessionResponse } from "../../../services/cash.service";

@Component({
  selector: "app-customer-invoice",
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: "./customer-invoice.component.html",
  styleUrl: "./customer-invoice.component.css",
})
export class CustomerInvoiceComponent implements OnInit, OnDestroy {
  readonly voucherTypeOptions: Array<{ value: string; label: string }> = [
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

  private subscription?: Subscription;
  private routeSubscription?: Subscription;
  private invoicePrefillSubscription?: Subscription;
  private lastPrefilledProductId: string | null = null;
  private readonly _route = inject(ActivatedRoute);
  private readonly _productService = inject(ProductService);
  private readonly _customerInvoiceService = inject(CustomerInvoiceService);
  private readonly _branchService = inject(BranchService);
  private readonly _customerService = inject(CustomerService);
  private readonly _cashService = inject(CashService);

  dateControl = new FormControl(new Date());
  invoiceForm!: FormGroup;
  formBuilder = inject(FormBuilder);

  productList: IProduct[] = [];
  isFormSubmitted: boolean = false;
  productSearchQuery: string = "";
  showProductDropdown: boolean = false;

  selectedBranchId: string = "";

  branches: IBranch[] = [];
  locations: ILocation[] = [];

  invoiceItems: IInvoiceItem[] = [];
  totalInvoiceUnits: number = 0;

  isSaving = false;
  saveSuccess = false;
  saveError = '';

  customerSearchQuery = '';
  showCustomerDropdown = false;
  customerList: ICustomer[] = [];
  selectedCustomer: ICustomer | null = null;
  showCustomerForm = false;
  customerForm!: FormGroup;
  isSavingCustomer = false;
  customerSaveError = '';
  customerSaveSuccess = false;
  customerSearchLoading = false;
  customerSearchError = '';

  currentCashSession: ICashSessionResponse | null = null;
  cashSessionError = '';
  isCheckingCash = false;
  noCashOpen = false;

  defaultVoucherType = 'FACTURA_B';
  nextInvoiceNumbers: Record<string, { prefix: number; number: number }> = this.buildDefaultVoucherNumbers();

  vat21: number = 0.21;
  vat105: number = 0.105;
  vat27: number = 0.27;
  vat0: number = 0;

  ngOnInit(): void {
    this.initForm();
    this.initCustomerForm();
    this.loadBranches();
    this.dateControl.setValue(new Date());
    this.applyDefaultVoucherType();

    this.routeSubscription = this._route.queryParamMap.subscribe((params) => {
      const voucherType = params.get('voucherType')?.trim();
      if (voucherType) {
        this.applyVoucherType(voucherType);
      }

      const productId = (params.get("productId") ?? "").trim();
      if (!productId || productId === this.lastPrefilledProductId) {
        return;
      }

      this.invoicePrefillSubscription?.unsubscribe();
      this.invoicePrefillSubscription = this._productService.getProduct(productId).subscribe({
        next: (product) => {
          this.selectProduct(product);
          this.lastPrefilledProductId = productId;
        },
        error: (err) => {
          console.error("Failed to prefill invoice product", err);
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
    this.invoicePrefillSubscription?.unsubscribe();
  }

initForm(): void {
    this.invoiceForm = this.formBuilder.group({
      customerId: "",

      customerRequest: {
        name: "",
        lastname: "",
        dni: "",
        taxId: "",
        email: "",
        phone: "",
        addressRequest: {
          street: "",
          houseNumber: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
      },
      branchId: ["", Validators.required],
      locationId: ["", Validators.required],

      invoiceDate: [new Date().toISOString().split('T')[0], Validators.required],

      invoiceType: [this.defaultVoucherType, Validators.required],
      packingListPrefix: [0],
      packingListNumber: [0],
      invoicePrefix: [{ value: 1, disabled: true }],
      invoiceNumber: [{ value: this.nextInvoiceNumbers[this.defaultVoucherType].number, disabled: true }],

      taxSave: true,

      observations: "",

      subtotal1: 0,
      discount: 0,
      interest: 0,
      subtotal2: 0,

      netValue21: 0,
      netValue105: 0,
      netValue27: 0,
      netValue0: 0,

      vat21: 0,
      vat105: 0,
      vat27: 0,
      internalTax: 0,

      withholdingVat: 0,
      withholdingSuss: 0,
      withholdingGrossReceiptsTax: 0,
      withholdingIncome: 0,
      stateTax: 0,
      localTax: 0,
      rounding: 0,
      totalPrice: 0,
    });

    this.invoiceForm.get("branchId")!.valueChanges.subscribe((branchId) => {
      this.onBranchChange(branchId);
    });

    this.invoiceForm.get("invoiceType")!.valueChanges.subscribe((type) => {
      this.updateInvoiceNumber(type ?? this.defaultVoucherType);
    });

    this.updateInvoiceNumber(this.defaultVoucherType);
  }

  updateInvoiceNumber(type: string): void {
    const normalizedType = this.normalizeVoucherType(type || this.defaultVoucherType);
    const next = this.nextInvoiceNumbers[normalizedType] || { prefix: 1, number: 1 };
    this.invoiceForm.patchValue({
      invoicePrefix: next.prefix,
      invoiceNumber: next.number
    }, { emitEvent: false });
  }

  getTotalInvoiceUnits(): void {
    this.totalInvoiceUnits = Number(
      this.invoiceItems.reduce((total, item) => total + item.quantity, 0),
    );
  }

  getSubtotal1(): number {
    const subtotal1 = this.invoiceItems.reduce((total, item) => {
      const discount = item.discountRate ?? 0;
      const discountedPrice = item.price * ((100 - discount) / 100);
      return total + discountedPrice * item.quantity;
    }, 0);

    this.invoiceForm.patchValue({ subtotal1: subtotal1 }, { emitEvent: false });

    return subtotal1;
  }

  getSubtotal2(): number {
    const subtotal1 = this.invoiceForm.get("subtotal1")?.value;
    const discount = this.invoiceForm.get("discount")?.value;
    const interest = this.invoiceForm.get("interest")?.value;

    let subtotal2 = subtotal1;

    if (discount !== 0) {
      const discountPercentage = Math.min(Math.max(discount, 0), 100) / 100;
      subtotal2 *= 1 - discountPercentage;
    }

    if (interest !== 0) {
      const interestPercentage = Math.min(Math.max(interest, 0), 100) / 100;
      subtotal2 *= 1 + interestPercentage;
    }

    this.invoiceForm.patchValue({ subtotal2: subtotal2 }, { emitEvent: false });

    return subtotal2;
  }

  getNetVat(vat: number): number {
    return this.calculateNetVat(vat);
  }

  calculateNetVat(vat: number): number {
    const discount = Number.parseFloat(
      this.invoiceForm.get("discount")?.value || "0",
    );
    const interest = Number.parseFloat(
      this.invoiceForm.get("interest")?.value || "0",
    );

    const total = this.invoiceItems.reduce((acc, item) => {
      if (item.taxRate == vat) {
        const itemDiscount = item.discountRate ?? 0;
        return acc + item.price * item.quantity * ((100 - itemDiscount) / 100);
      } else {
        return acc;
      }
    }, 0);

    const netVat = total * ((100 - discount) / 100) * ((100 + interest) / 100);

    switch (vat) {
      case this.vat21:
        this.invoiceForm.patchValue({ netValue21: netVat }, { emitEvent: false });
        break;
      case this.vat105:
        this.invoiceForm.patchValue({ netValue105: netVat }, { emitEvent: false });
        break;
      case this.vat27:
        this.invoiceForm.patchValue({ netValue27: netVat }, { emitEvent: false });
        break;
      case this.vat0:
        this.invoiceForm.patchValue({ netValue0: netVat }, { emitEvent: false });
        break;
    }

    return netVat;
  }

  getVatAmount(vat: number): number {
    return this.calculateVat(vat);
  }

  calculateVat(vat: number): number {
    const netVat: number = this.getNetVat(vat);
    const calculatedVat: number = netVat * vat;

    switch (vat) {
      case this.vat21:
        this.invoiceForm.patchValue({ vat21: calculatedVat }, { emitEvent: false });
        break;
      case this.vat105:
        this.invoiceForm.patchValue({ vat105: calculatedVat }, { emitEvent: false });
        break;
      case this.vat27:
        this.invoiceForm.patchValue({ vat27: calculatedVat }, { emitEvent: false });
        break;
    }

    return calculatedVat;
  }

  getInternalTax(): number {
    return this.invoiceItems.reduce((total, item) => {
      const internalTaxRate = item.internalTaxRate ?? 0;
      const lineNet = item.price * item.quantity;
      return total + lineNet * (internalTaxRate / 100);
    }, 0);
  }

  getInvoiceTotal() {
    const total: number =
      Number.parseFloat(this.invoiceForm.get("subtotal2")?.value || "0") +
      Number.parseFloat(this.invoiceForm.get("vat21")?.value || "0") +
      Number.parseFloat(this.invoiceForm.get("vat105")?.value || "0") +
      Number.parseFloat(this.invoiceForm.get("vat27")?.value || "0") +
      Number.parseFloat(this.invoiceForm.get("withholdingVat")?.value || "0") +
      Number.parseFloat(this.invoiceForm.get("withholdingSuss")?.value || "0") +
      Number.parseFloat(
        this.invoiceForm.get("withholdingGrossReceiptsTax")?.value || "0",
      ) +
      Number.parseFloat(
        this.invoiceForm.get("withholdingIncome")?.value || "0",
      ) +
      Number.parseFloat(this.invoiceForm.get("stateTax")?.value || "0") +
      Number.parseFloat(this.invoiceForm.get("localTax")?.value || "0") +
      Number.parseFloat(this.invoiceForm.get("rounding")?.value || "0");

    this.invoiceForm.patchValue({ totalPrice: total }, { emitEvent: false });
    return total;
  }

  saveInvoice() {
    this.isFormSubmitted = true;
    if (!this.invoiceForm.valid || this.invoiceItems.length === 0) {
      Object.values(this.invoiceForm.controls).forEach(c => c.markAsTouched());
      return;
    }

    const branchId = this.invoiceForm.get('branchId')?.value;
    if (!branchId) {
      this.saveError = 'Debe seleccionar una sucursal.';
      return;
    }

    this.isCheckingCash = true;
    this._cashService.getCurrentSession({ branchId, central: false }).subscribe({
      next: (session) => {
        this.currentCashSession = session;
        this.isCheckingCash = false;
        this.processSaveInvoice();
      },
      error: () => {
        this.isCheckingCash = false;
        this.saveError = 'No hay una caja abierta para esta sucursal. Abra la caja diaria primero.';
      }
    });
  }

  private processSaveInvoice(): void {
    if (!this.currentCashSession) {
      this.saveError = 'No hay una caja abierta para esta sucursal.';
      return;
    }

    this.isSaving = true;
    this.saveError = '';
    this.saveSuccess = false;

    const rawForm = this.invoiceForm.getRawValue();
    const currentInvoiceType = this.normalizeVoucherType(rawForm.invoiceType ?? this.defaultVoucherType);

    const totalAmount = this.getInvoiceTotal();
    const movementReference = this.buildCashMovementReference(currentInvoiceType, rawForm.invoiceNumber);
    const customerName = rawForm.customerRequest?.name
      ? `${rawForm.customerRequest.name} ${rawForm.customerRequest.lastname}`
      : 'Venta';

    const formData = { ...rawForm, invoiceItemsRequest: this.invoiceItems };
    this._customerInvoiceService.saveInvoice(formData).subscribe({
      next: (invoice) => {
        this._cashService.addMovement(this.currentCashSession!.id, {
          type: 'SALE',
          amount: totalAmount,
          description: `${movementReference} - ${customerName}`,
          reference: invoice.id
        }).subscribe({
          next: () => {},
          error: () => {}
        });

        this.isSaving = false;
        this.saveSuccess = true;
        this.invoiceItems = [];
        this.incrementNextInvoiceNumber(currentInvoiceType);
        const branchId = this.selectedBranchId;
        this.invoiceForm.reset();
        this.initForm();
        if (branchId) {
          this.invoiceForm.patchValue({ branchId, invoiceType: currentInvoiceType });
        }
        // Refrescar productos para mostrar stock actualizado (incluyendo negativos)
        if (this.productSearchQuery.length >= 2) {
          this.searchProductsWithStock(this.productSearchQuery);
        }
        setTimeout(() => (this.saveSuccess = false), 4000);
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = err?.error?.message ?? 'Error al guardar la venta.';
      }
    });
  }

  private buildCashMovementReference(voucherType: string, invoiceNumber: number | string): string {
    const abbreviation = this.getVoucherAbbreviation(voucherType);
    const number = this.extractInvoiceNumberWithoutPrefix(invoiceNumber).padStart(6, '0');
    return `${abbreviation}${number}`;
  }

  private extractInvoiceNumberWithoutPrefix(invoiceNumber: number | string): string {
    const normalized = String(invoiceNumber ?? '').trim();
    if (!normalized) {
      return '000001';
    }

    const segments = normalized.split('-');
    const lastSegment = (segments.at(-1) ?? normalized).trim();
    const digitsOnly = lastSegment.replace(/\D/g, '');
    return digitsOnly || '000001';
  }

  private getVoucherAbbreviation(voucherType: string): string {
    const normalized = this.normalizeVoucherType(voucherType);
    const abbreviations: Record<string, string> = {
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

    return abbreviations[normalized] ?? 'COMP';
  }

  selectProduct(product: IProduct): void {
    const invoiceItem: IInvoiceItem = {
      id: product.id,
      brandName: product.brandName,
      model: product.model,
      description: product.description,
      price: product.priceResponse.purchasePrice,
      taxRate: product.priceResponse.taxRate,
      discountRate: product.priceResponse.discount,
      internalTaxRate: 0,
      quantity: 1,
    };
    this.invoiceItems.push(invoiceItem);
    this.productSearchQuery = "";
    this.productList = [];
    this.showProductDropdown = false;
    this.getTotalInvoiceUnits();
  }

  removeItem(index: number): void {
    this.invoiceItems.splice(index, 1);
    this.getTotalInvoiceUnits();
  }

  updateItem(
    index: number,
    field: "price" | "taxRate" | "discountRate" | "quantity",
    value: number,
  ): void {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return;
    }

    const item = this.invoiceItems[index];

    if (!item) {
      return;
    }

    if (field === "price") {
      item.price = Math.max(numericValue, 0);
      return;
    }

    if (field === "taxRate") {
      item.taxRate = Math.max(numericValue, 0);
      return;
    }

    if (field === "discountRate") {
      item.discountRate = Math.min(Math.max(numericValue, 0), 100);
      return;
    }

    item.quantity = Math.max(numericValue, 1);
    this.getTotalInvoiceUnits();
  }

  onSearchInput(searchTerm: string): void {
    this.productSearchQuery = searchTerm;
    this.isFormSubmitted = true;

    if (searchTerm.length >= 2) {
      this.searchProductsWithStock(searchTerm);
      this.showProductDropdown = true;
      return;
    }

    this.productList = [];
    this.showProductDropdown = false;
  }

  hideDropdown(): void {
    setTimeout(() => {
      this.showProductDropdown = false;
    }, 200);
  }

  searchProductsWithStock(searchTerm: string, supplierId?: string): void {
    this.subscription?.unsubscribe();

    this.subscription = this._productService
      .getProducts({
        search: searchTerm,
        supplierId: supplierId,
        page: 0,
        size: 20,
      })
      .subscribe({
        next: (page) => {
          this.productList = page.content;
        },
        error: (err) => {
          console.error("Failed to load products", err);
        },
      });
  }

  getProductTotalStock(product: IProduct): number {
    return product.stockResponses?.reduce((acc, stock) => acc + stock.quantity, 0) ?? 0;
  }

  isNegativeStock(product: IProduct): boolean {
    return this.getProductTotalStock(product) < 0;
  }

  loadBranches() {
    this._branchService.getBranches().subscribe({
      next: (branches: IBranch[]) => {
        this.branches = branches.filter((branch) => branch.active);
        if (this.branches.length > 0) {
          const firstBranchId = this.branches[0].id;
          this.invoiceForm.patchValue({ branchId: firstBranchId });
        }
      },
      error: (error) => {
        console.log("Error loading branches list", error);
      },
    });
  }

  onBranchChange(branchId: string) {
    if (!branchId) {
      this.locations = [];
      this.currentCashSession = null;
      this.cashSessionError = '';
      this.noCashOpen = false;
      return;
    }

    this.selectedBranchId = branchId;
    this.syncPrefixFromBranch(branchId);
    this.updateInvoiceNumber(this.invoiceForm.get('invoiceType')?.value ?? this.defaultVoucherType);
    this.getLocations(branchId);
    this.invoiceForm.get("locationId")!.setValue("");
    this.refreshNextInvoiceNumbers(branchId);
    this.checkCashSession(branchId);
  }

  checkCashSession(branchId: string): void {
    this.isCheckingCash = true;
    this.cashSessionError = '';
    this.currentCashSession = null;
    this.noCashOpen = false;
    this.invoiceForm.disable({ emitEvent: false });

    this._cashService.getCurrentSession({ branchId, central: false }).subscribe({
      next: (session) => {
        this.currentCashSession = session;
        this.isCheckingCash = false;
        this.noCashOpen = false;
        this.invoiceForm.enable({ emitEvent: false });
        // Siempre mantener invoicePrefix y invoiceNumber deshabilitados
        this.invoiceForm.get('invoicePrefix')?.disable({ emitEvent: false });
        this.invoiceForm.get('invoiceNumber')?.disable({ emitEvent: false });
      },
      error: () => {
        this.isCheckingCash = false;
        this.cashSessionError = '⚠️ Debe abrir la caja diaria para poder crear facturas';
        this.noCashOpen = true;
        this.invoiceForm.disable({ emitEvent: false });
      }
    });
  }

  private syncPrefixFromBranch(branchId: string): void {
    const branch = this.branches.find((item) => item.id === branchId);
    const prefix = branch?.pointOfSale ?? 1;

    this.voucherTypeOptions.forEach((option) => {
      this.nextInvoiceNumbers[option.value].prefix = prefix;
    });
  }

  private refreshNextInvoiceNumbers(branchId: string): void {
    const branch = this.branches.find((item) => item.id === branchId);
    const prefix = branch?.pointOfSale ?? 1;

    this._customerInvoiceService.getByBranchId(branchId).subscribe({
      next: (sales) => {
        this.voucherTypeOptions.forEach((option) => {
          this.nextInvoiceNumbers[option.value] = {
            prefix,
            number: this.calculateNextInvoiceNumber(sales, option.value, prefix),
          };
        });

        this.updateInvoiceNumber(this.invoiceForm.get('invoiceType')?.value ?? this.defaultVoucherType);
      },
      error: () => {
        this.voucherTypeOptions.forEach((option) => {
          this.nextInvoiceNumbers[option.value] = { prefix, number: 1 };
        });
        this.updateInvoiceNumber(this.invoiceForm.get('invoiceType')?.value ?? this.defaultVoucherType);
      },
    });
  }

  private calculateNextInvoiceNumber(
    sales: Array<{ saleType?: string; saleNumber?: string; invoiceType?: string; invoiceNumber?: string | number }>,
    type: string,
    expectedPrefix: number,
  ): number {
    const expectedType = this.normalizeVoucherType(type);
    const matches = sales
      .filter((sale) => this.normalizeVoucherType(sale.saleType ?? sale.invoiceType ?? '') === expectedType)
      .map((sale) => this.extractPrefixAndNumber(String(sale.saleNumber ?? sale.invoiceNumber ?? '')))
      .filter((value): value is { prefix: number; number: number } => value !== null)
      .filter((value) => value.prefix === expectedPrefix)
      .map((value) => value.number);

    if (!matches.length) {
      return 1;
    }

    return Math.max(...matches) + 1;
  }

  private extractPrefixAndNumber(rawSaleNumber: string): { prefix: number; number: number } | null {
    const match = /^(\d+)-(\d+)$/.exec(rawSaleNumber);
    if (!match) {
      return null;
    }

    const prefix = Number.parseInt(match[1], 10);
    const number = Number.parseInt(match[2], 10);
    if (!Number.isFinite(prefix) || !Number.isFinite(number)) {
      return null;
    }

    return { prefix, number };
  }

  private incrementNextInvoiceNumber(type: string): void {
    const normalizedType = this.normalizeVoucherType(type || this.defaultVoucherType);
    const current = this.nextInvoiceNumbers[normalizedType] ?? { prefix: 1, number: 1 };
    this.nextInvoiceNumbers[normalizedType] = {
      prefix: current.prefix,
      number: current.number + 1,
    };
  }

  get currentVoucherLabel(): string {
    const selectedType = this.normalizeVoucherType(this.invoiceForm?.get('invoiceType')?.value ?? this.defaultVoucherType);
    return this.voucherTypeOptions.find((option) => option.value === selectedType)?.label ?? 'Comprobante';
  }

  get formattedCurrentVoucherNumber(): string {
    const prefix = Number(this.invoiceForm?.get('invoicePrefix')?.value ?? 1);
    const number = Number(this.invoiceForm?.get('invoiceNumber')?.value ?? 1);
    return `${String(Number.isFinite(prefix) ? prefix : 1).padStart(3, '0')} - ${String(Number.isFinite(number) ? number : 1).padStart(6, '0')}`;
  }

  private buildDefaultVoucherNumbers(): Record<string, { prefix: number; number: number }> {
    return this.voucherTypeOptions.reduce((acc, option) => {
      acc[option.value] = { prefix: 1, number: 1 };
      return acc;
    }, {} as Record<string, { prefix: number; number: number }>);
  }

  private applyDefaultVoucherType(): void {
    const routeType = this.normalizeVoucherType(String(this._route.snapshot.data['voucherType'] ?? ''));
    if (routeType) {
      this.defaultVoucherType = routeType;
    }
    this.applyVoucherType(this.defaultVoucherType);
  }

  private applyVoucherType(type: string): void {
    const normalizedType = this.normalizeVoucherType(type);
    if (!normalizedType || !this.invoiceForm) {
      return;
    }
    this.invoiceForm.patchValue({ invoiceType: normalizedType }, { emitEvent: true });
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
        return this.voucherTypeOptions.some((option) => option.value === normalized)
          ? normalized
          : 'FACTURA_B';
    }
  }

  // setFormDisabled ya no es necesario, la lógica se maneja con enable()/disable() del formGroup completo

  getLocations(branchId: string) {
    const branch = this.branches.find((branch) => branch.id == branchId);
    this.locations = branch ? branch.locations : [];
  }

  initCustomerForm(): void {
    this.customerForm = this.formBuilder.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      dni: [''],
      taxId: [''],
      email: [''],
      phone: [''],
    });
  }

  onCustomerSearchInput(searchTerm: string): void {
    this.customerSearchQuery = searchTerm;
    if (searchTerm.length >= 2) {
      this.searchCustomers(searchTerm);
      this.showCustomerDropdown = true;
      return;
    }
    this.customerList = [];
    this.showCustomerDropdown = false;
  }

  hideCustomerDropdown(): void {
    setTimeout(() => {
      this.showCustomerDropdown = false;
    }, 200);
  }

  searchCustomers(searchTerm: string): void {
    this.customerSearchLoading = true;
    this.customerSearchError = '';
    this.subscription?.unsubscribe();
    this.subscription = this._customerService.getAll(searchTerm).subscribe({
      next: (customers) => {
        this.customerList = customers;
        this.customerSearchLoading = false;
      },
      error: (err) => {
        this.customerSearchLoading = false;
        this.customerSearchError = 'Error al buscar clientes';
        console.error('Failed to load customers', err);
      },
    });
  }

  selectCustomer(customer: ICustomer): void {
    this.selectedCustomer = customer;
    this.customerSearchQuery = '';
    this.customerList = [];
    this.showCustomerDropdown = false;
    this.invoiceForm.patchValue({
      customerId: customer.id,
      customerRequest: {
        name: customer.name,
        lastname: customer.lastname,
        dni: customer.dni,
        taxId: customer.taxId,
        email: customer.email,
        phone: customer.phone,
        addressRequest: {
          street: '',
          houseNumber: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
      },
    });
  }

  clearSelectedCustomer(): void {
    this.selectedCustomer = null;
    this.invoiceForm.patchValue({
      customerId: '',
      customerRequest: {
        name: '',
        lastname: '',
        dni: '',
        taxId: '',
        email: '',
        phone: '',
        addressRequest: {
          street: '',
          houseNumber: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
      },
    });
  }

  openCustomerForm(): void {
    this.initCustomerForm();
    this.customerSaveError = '';
    this.customerSaveSuccess = false;
    this.showCustomerForm = true;
  }

  cancelCustomerForm(): void {
    this.showCustomerForm = false;
    this.customerSaveError = '';
  }

  saveCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.isSavingCustomer = true;
    this.customerSaveError = '';

    const rawValue = this.customerForm.value;
    const payload = {
      ...rawValue,
      dni: this.normalizeNullableText(rawValue.dni),
      taxId: this.normalizeNullableText(rawValue.taxId),
      email: this.normalizeNullableText(rawValue.email),
      phone: this.normalizeNullableText(rawValue.phone),
    };

    this._customerService.create(payload).subscribe({
      next: (customer) => {
        this.isSavingCustomer = false;
        this.showCustomerForm = false;
        this.customerSaveSuccess = true;
        this.selectCustomer(customer);
        setTimeout(() => (this.customerSaveSuccess = false), 3000);
      },
      error: (err) => {
        this.isSavingCustomer = false;
        this.customerSaveError = err?.error?.message ?? 'Error al guardar el cliente.';
      },
    });
  }

  private normalizeNullableText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
}
