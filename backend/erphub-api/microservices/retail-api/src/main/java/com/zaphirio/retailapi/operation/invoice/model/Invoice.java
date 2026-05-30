package com.zaphirio.retailapi.operation.invoice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.zaphirio.retailapi.shared.fiscal.DocumentFinalizationStatus;
import com.zaphirio.retailapi.shared.fiscal.ImmutableField;
import com.zaphirio.retailapi.shared.fiscal.TaxRegime;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Table(name = "tbl_supplier_invoice")
public class Invoice {

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    List<InvoiceItem> invoiceItems = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    List<OtherConcept> otherConcepts = new ArrayList<>();

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private UUID supplierId;
    private String location;
    private UUID branchId;
    private UUID locationId;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private LocalDate receptionDate;
    private LocalDate savedDate;
    private String invoiceType;
    private String invoiceNumber;
    private String packingListNumber;
    private boolean fixedAsset;
    private boolean taxSave;

    private String observations;

    private double subtotal1;
    private Double discount;
    private double interest;
    private double subtotal2;

    private double netValue21;
    private double vat21;
    private double netValue105;
    private double vat105;
    private double netValue27;
    private double vat27;
    private double netValue0;

    private double internalTax;

    private double withholdingVat;
    private double withholdingSuss;
    private double withholdingGrossReceiptsTax;
    private double withholdingIncome;
    private double stateTax;
    private double localTax;

    private double rounding;

    private double totalPrice;

    private String currency;

    @Column(name = "tenant_id", nullable = true)
    private Long tenantId;

    /**
     * Tax regime for this invoice (required for fiscal compliance).
     * Determines VAT rates, withholding obligations, and reporting requirements.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "tax_regime", nullable = false)
    @ImmutableField(editableBeforeFinalization = true)
    private TaxRegime taxRegime;

    /**
     * Finalization status of this invoice.
     * Controls the invoice lifecycle: DRAFT -> PENDING_APPROVAL -> APPROVED -> FINALIZED -> CANCELED
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "finalization_status", nullable = false)
    private DocumentFinalizationStatus finalizationStatus = DocumentFinalizationStatus.DRAFT;

    /**
     * Timestamp when invoice was finalized (immutable after finalization).
     * Used to determine when invoice became immutable for fiscal compliance.
     */
    @Column(name = "finalized_at")
    @ImmutableField(editableBeforeFinalization = false)
    private Instant finalizedAt;

    /**
     * User ID who finalized this invoice (for audit trail).
     */
    @Column(name = "finalized_by_user_id")
    @ImmutableField(editableBeforeFinalization = false)
    private UUID finalizedByUserId;

}
