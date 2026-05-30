# Fiscal Compliance Strategy – VeriFactu Ready Architecture

**Audience**: Technical architects, tax compliance officers  
**Scope**: Spanish fiscal requirements, VeriFactu compliance  
**Timeline**: Foundation now, full compliance in Phase 4-5  

---

## Spanish Fiscal Requirements Overview

### Legal Framework
- **Ley 36/1988** (Impuesto sobre la Renta de las Personas Físicas)
- **RD 1496/2003** (Contabilidad digital)
- **VeriFactu** (Sistema de Verificación de Facturas)
- **SII** (Suministro Inmediato de Información)

### Key Requirements for ERPHub
1. **Immutable Invoices** – Cannot edit after creation
2. **Sequential Numbering** – No gaps or duplicates
3. **Invoice Chaining** – Each invoice references previous
4. **Audit Trail** – Who created/modified what, when
5. **Electronic Signature** – Optional but recommended
6. **Traceability** – Link invoice → sale → stock → cash

---

## Current Architecture Gaps

### 🔴 CRITICAL Issues

| Issue | Impact | Fix Timeline |
|-------|--------|---|
| Mutable invoices (can edit post-creation) | TAX REJECTION | Phase 4 |
| No invoice chaining | VeriFactu non-compliance | Phase 4 |
| No audit trail for invoices | Auditor can't prove integrity | Phase 4 |
| No immutable cash movements | Financial tracking impossible | Phase 4 |
| No sequential invoice numbering | Gaps = red flag for auditors | Phase 4 |

---

## Solution Architecture

### 1. Immutable Invoice Pattern

#### Entity Design
```java
@Entity
@Table(name = "invoice")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // ===== IMMUTABLE FIELDS (set on creation only) =====
    @Column(nullable = false, updatable = false)
    private String invoiceNumber;  // e.g., "2024/000001"
    
    @Column(nullable = false, updatable = false)
    private String invoiceSeries;  // e.g., "2024" (per business area)
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime issuedAt;
    
    @Column(nullable = false, updatable = false)
    private Long customerId;
    
    @Column(nullable = false, updatable = false)
    private BigDecimal subtotal;
    
    @Column(nullable = false, updatable = false)
    private BigDecimal taxAmount;
    
    @Column(nullable = false, updatable = false)
    private BigDecimal totalAmount;
    
    @Column(nullable = false, updatable = false, length = 64)
    private String previousInvoiceHash;  // SHA-256 of previous invoice
    
    @Column(nullable = false, updatable = false, length = 64)
    private String currentInvoiceHash;   // SHA-256 of this invoice data
    
    // ===== MUTABLE FIELDS (only status, notes for tax authority) =====
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private InvoiceStatus status;  // DRAFT → ISSUED → PAID → CANCELLED
    
    @Column(updatable = true)
    private String adminNotes;  // For internal use only
    
    @Column(updatable = false)
    private Long tenantId;  // For multi-tenancy
    
    @Version
    private Long version;  // Optimistic locking
    
    // ===== NO SETTERS for immutable fields =====
    // Only getter methods for business fields
    // No update() method - only lifecycle transitions
    
    /**
     * Transition invoice from DRAFT to ISSUED.
     * This is the ONLY allowed change after creation.
     */
    public void issue() {
        if (this.status != InvoiceStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT invoices can be issued");
        }
        // Calculate invoice hash
        this.currentInvoiceHash = calculateInvoiceHash();
        this.status = InvoiceStatus.ISSUED;
        // Audit event published
        AuditEventPublisher.publishInvoiceIssued(this);
    }
    
    /**
     * Cancel invoice (only allowed in specific conditions).
     * Create credit note instead of deletion.
     */
    public void cancel(String reason) {
        if (this.status == InvoiceStatus.PAID) {
            throw new IllegalStateException("Cannot cancel PAID invoices");
        }
        this.status = InvoiceStatus.CANCELLED;
        AuditEventPublisher.publishInvoiceCancelled(this, reason);
    }
    
    private String calculateInvoiceHash() {
        // SHA-256 of: previousHash + invoiceNumber + customerId + totalAmount
        String data = this.previousInvoiceHash + 
                      this.invoiceNumber + 
                      this.customerId + 
                      this.totalAmount;
        return DigestUtils.sha256Hex(data);
    }
}

public enum InvoiceStatus {
    DRAFT,      // Can be edited, not visible to customer
    ISSUED,     // Published, immutable, visible to tax authority
    PAID,       // Payment received
    CANCELLED   // Marked as void (original retained)
}
```

#### Usage Pattern
```java
@Service
@Transactional
public class InvoiceService {
    
    /**
     * Create invoice in DRAFT status.
     */
    public Invoice createDraft(CreateInvoiceRequest request) {
        Invoice invoice = new Invoice();
        invoice.invoiceNumber = generateNextInvoiceNumber();
        invoice.issuedAt = LocalDateTime.now();
        invoice.customerId = request.getCustomerId();
        invoice.subtotal = request.getSubtotal();
        invoice.taxAmount = request.calculateTax();
        invoice.totalAmount = request.getSubtotal().add(invoice.taxAmount);
        invoice.status = InvoiceStatus.DRAFT;
        invoice.previousInvoiceHash = getLastIssuedInvoiceHash();
        
        // Save DRAFT
        return invoiceRepository.save(invoice);
    }
    
    /**
     * Issue invoice (make permanent and immutable).
     * This is the ONLY allowed mutation after creation.
     */
    public Invoice issue(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId).orElseThrow();
        invoice.issue();  // Transition state
        invoiceRepository.save(invoice);
        
        // Trigger dependent operations
        this.generatePaymentTerm(invoice);
        this.publishInvoiceIssuedEvent(invoice);
        
        return invoice;
    }
    
    /**
     * Any attempt to UPDATE (edit) an issued invoice is forbidden.
     * Return 409 Conflict.
     */
    public Invoice update(Long invoiceId, UpdateInvoiceRequest request) {
        Invoice invoice = invoiceRepository.findById(invoiceId).orElseThrow();
        
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new InvoiceAlreadyIssuedException(
                "Cannot edit issued invoices. Invoice status: " + invoice.getStatus()
            );
        }
        
        // Only allow updates to DRAFT invoices
        invoice.updateDraftFields(request);
        return invoiceRepository.save(invoice);
    }
    
    /**
     * Invoices are never deleted. They are cancelled.
     */
    public void delete(Long invoiceId) {
        throw new UnsupportedOperationException(
            "Invoices cannot be deleted per Spanish fiscal law. Use cancel() instead."
        );
    }
}
```

---

### 2. Invoice Chaining (VeriFactu Requirement)

#### Database Schema
```sql
CREATE TABLE invoice (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(20) NOT NULL,
    invoice_series VARCHAR(10) NOT NULL,
    issued_at TIMESTAMP NOT NULL,
    customer_id BIGINT NOT NULL,
    
    -- Chaining fields (immutable)
    previous_invoice_hash VARCHAR(64),
    current_invoice_hash VARCHAR(64) NOT NULL UNIQUE,
    
    -- Amount fields (immutable)
    subtotal DECIMAL(19,2) NOT NULL,
    tax_amount DECIMAL(19,2) NOT NULL,
    total_amount DECIMAL(19,2) NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    
    -- Audit
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    modified_at TIMESTAMP,
    tenant_id BIGINT NOT NULL,
    
    CONSTRAINT fk_invoice_customer FOREIGN KEY(customer_id) REFERENCES customer(id),
    CONSTRAINT uk_invoice_number_series_tenant UNIQUE(invoice_number, invoice_series, tenant_id),
    CONSTRAINT fk_invoice_tenant FOREIGN KEY(tenant_id) REFERENCES tenant(id)
);

CREATE TABLE invoice_line_item (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(19,2) NOT NULL,
    total_amount DECIMAL(19,2) NOT NULL,
    
    created_at TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_invoice_line_invoice FOREIGN KEY(invoice_id) REFERENCES invoice(id) ON DELETE RESTRICT
);

-- Create index for chaining lookup
CREATE INDEX idx_invoice_hash ON invoice(current_invoice_hash);
CREATE INDEX idx_invoice_series_number ON invoice(invoice_series, invoice_number, tenant_id);
```

#### Chain Verification Query
```java
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    
    /**
     * Get the last issued invoice for this tenant and series.
     * Used to get previousHash for next invoice.
     */
    Optional<Invoice> findFirstByTenantIdAndInvoiceSeriesAndStatusNotOrderByIssuedAtDesc(
        Long tenantId,
        String invoiceSeries,
        InvoiceStatus excludedStatus);
    
    /**
     * Verify chain integrity for auditing.
     * Returns all invoices in sequence.
     */
    @Query("""
        SELECT i FROM Invoice i
        WHERE i.tenantId = :tenantId 
          AND i.invoiceSeries = :series
          AND i.status = 'ISSUED'
        ORDER BY i.issuedAt ASC
        """)
    List<Invoice> findInvoiceChain(
        @Param("tenantId") Long tenantId,
        @Param("series") String series);
}

@Service
public class InvoiceAuditService {
    
    /**
     * Verify invoice chain integrity.
     * Ensures no invoice was modified or deleted.
     */
    public boolean verifyChainIntegrity(Long tenantId, String series) {
        List<Invoice> chain = invoiceRepository.findInvoiceChain(tenantId, series);
        
        String previousHash = null;
        for (Invoice invoice : chain) {
            if (previousHash != null && !invoice.getPreviousInvoiceHash().equals(previousHash)) {
                log.error("Chain break detected at invoice {}", invoice.getInvoiceNumber());
                return false;  // Chain integrity violated
            }
            previousHash = invoice.getCurrentInvoiceHash();
        }
        
        return true;
    }
    
    /**
     * Detect tampering by recalculating hashes.
     */
    public List<String> detectTamperedInvoices(Long tenantId, String series) {
        List<Invoice> chain = invoiceRepository.findInvoiceChain(tenantId, series);
        List<String> tamperedNumbers = new ArrayList<>();
        
        String previousHash = null;
        for (Invoice invoice : chain) {
            String expectedHash = calculateExpectedHash(previousHash, invoice);
            
            if (!expectedHash.equals(invoice.getCurrentInvoiceHash())) {
                tamperedNumbers.add(invoice.getInvoiceNumber());
                log.error("Tampering detected: invoice {} hash mismatch", invoice.getInvoiceNumber());
            }
            
            previousHash = invoice.getCurrentInvoiceHash();
        }
        
        return tamperedNumbers;
    }
}
```

---

### 3. Comprehensive Audit Logging

#### Audit Entity
```java
@Entity
@Table(name = "audit_log")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String entityType;  // "Invoice", "Sale", "Stock", etc.
    
    @Column(nullable = false)
    private Long entityId;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AuditAction action;  // CREATE, READ, UPDATE, DELETE, ISSUE, CANCEL
    
    @Column(nullable = false)
    private Long userId;  // Who performed the action
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    @Column
    private String oldValue;  // JSON of previous state
    
    @Column
    private String newValue;  // JSON of new state
    
    @Column
    private String reason;  // Why was this done
    
    @Column
    private String ipAddress;
    
    @Column(nullable = false)
    private Long tenantId;
    
    @Column
    private String sessionId;
}

public enum AuditAction {
    CREATE,
    READ,
    UPDATE,
    DELETE,
    ISSUE,      // Invoice issued
    CANCEL,     // Invoice cancelled
    APPROVE,    // Invoice approved for payment
    PAY        // Payment received
}
```

#### AOP Interceptor for Auto-Logging
```java
@Aspect
@Component
@Slf4j
public class AuditLoggingAspect {
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    /**
     * Log all invoice operations.
     */
    @After("execution(public * com.zaphirio.retailapi.operation.service.InvoiceService.*(..))")
    public void auditInvoiceOperations(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();
        
        String action = mapMethodToAction(methodName);
        Long entityId = extractEntityId(args);
        
        AuditLog log = AuditLog.builder()
            .entityType("Invoice")
            .entityId(entityId)
            .action(AuditAction.valueOf(action))
            .userId(getCurrentUserId())
            .timestamp(LocalDateTime.now())
            .tenantId(TenantContext.getTenantId())
            .ipAddress(getCurrentIpAddress())
            .sessionId(getSessionId())
            .build();
        
        auditLogRepository.save(log);
        log.info("Audit logged: {} - Invoice {}", action, entityId);
    }
    
    /**
     * Log all financial movements.
     */
    @After("execution(public * com.zaphirio.retailapi.operation.service.CashMovementService.*(..))")
    public void auditCashOperations(JoinPoint joinPoint) { 
        // Similar implementation
    }
}
```

---

### 4. Immutable CashMovement Pattern

```java
@Entity
@Table(name = "cash_movement")
public class CashMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Immutable fields
    @Column(nullable = false, updatable = false)
    private MovementType type;  // INBOUND, OUTBOUND
    
    @Column(nullable = false, updatable = false)
    private BigDecimal amount;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime movementDate;
    
    @Column(nullable = false, updatable = false)
    private String description;
    
    @Column(nullable = false, updatable = false)
    private Long relatedInvoiceId;  // Link to invoice
    
    // Tracking fields (immutable)
    @Column(nullable = false, updatable = false)
    private Long userId;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false, updatable = false)
    private Long tenantId;
    
    // No setters
    // Only construction via builder pattern
    
    public static CashMovementBuilder builder() {
        return new CashMovementBuilder();
    }
    
    public static class CashMovementBuilder {
        // builder implementation
    }
}
```

---

### 5. Sequential Invoice Numbering

```java
@Entity
@Table(name = "invoice_series_sequence")
public class InvoiceSeriesSequence {
    @Id
    private String id;  // "tenant_123/2024"
    
    @Column(nullable = false)
    private Long nextNumber;
    
    @Version
    private Long version;  // Optimistic locking for concurrency
}

@Service
public class InvoiceNumberingService {
    
    /**
     * Generate next sequential invoice number.
     * Uses pessimistic locking to prevent duplicates.
     */
    @Transactional
    public String generateNextInvoiceNumber(Long tenantId, String series) {
        String sequenceId = tenantId + "/" + series;
        
        InvoiceSeriesSequence sequence = sequenceRepository
            .findByIdWithLock(sequenceId)  // Pessimistic WRITE lock
            .orElseGet(() -> InvoiceSeriesSequence.builder()
                .id(sequenceId)
                .nextNumber(1L)
                .build());
        
        long nextNumber = sequence.getNextNumber();
        sequence.setNextNumber(nextNumber + 1);
        sequenceRepository.save(sequence);
        
        return String.format("%s/%06d", series, nextNumber);  // "2024/000001"
    }
}

@Repository
public interface InvoiceSeriesSequenceRepository 
        extends JpaRepository<InvoiceSeriesSequence, String> {
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT iss FROM InvoiceSeriesSequence iss WHERE iss.id = :id")
    Optional<InvoiceSeriesSequence> findByIdWithLock(@Param("id") String id);
}
```

---

### 6. Tax Compliance Export

```java
@Service
public class TaxComplianceExportService {
    
    /**
     * Export invoice data for VeriFactu submission.
     * Format: CSV with required columns for tax authority.
     */
    public String exportInvoicesToCsv(
            Long tenantId,
            LocalDate fromDate,
            LocalDate toDate) {
        
        List<Invoice> invoices = invoiceRepository
            .findByTenantIdAndIssuedAtBetweenAndStatus(
                tenantId, fromDate.atStartOfDay(), toDate.atTime(23, 59, 59),
                InvoiceStatus.ISSUED);
        
        StringBuilder csv = new StringBuilder();
        csv.append("InvoiceNumber,InvoiceSeries,IssuedAt,CustomerId,TotalAmount,");
        csv.append("PreviousInvoiceHash,CurrentInvoiceHash,Status\n");
        
        for (Invoice invoice : invoices) {
            csv.append(invoice.getInvoiceNumber()).append(",")
               .append(invoice.getInvoiceSeries()).append(",")
               .append(invoice.getIssuedAt()).append(",")
               .append(invoice.getCustomerId()).append(",")
               .append(invoice.getTotalAmount()).append(",")
               .append(invoice.getPreviousInvoiceHash()).append(",")
               .append(invoice.getCurrentInvoiceHash()).append(",")
               .append(invoice.getStatus()).append("\n");
        }
        
        return csv.toString();
    }
    
    /**
     * Generate audit report for tax authority.
     */
    public String generateAuditReport(Long tenantId, LocalDate fromDate, LocalDate toDate) {
        List<AuditLog> logs = auditLogRepository
            .findByTenantIdAndTimestampBetweenOrderByTimestamp(
                tenantId, fromDate.atStartOfDay(), toDate.atTime(23, 59, 59));
        
        // Format with all required fields
        return formatAuditLogs(logs);
    }
}
```

---

## Implementation Roadmap

### Phase 4: Fiscal Compliance (Days 11-14)
- [ ] **Day 11**: Implement Invoice immutability + status transitions
- [ ] **Day 12**: Add invoice chaining + hash calculation
- [ ] **Day 13**: Implement CashMovement immutability + AuditLog
- [ ] **Day 14**: Tax export + chain verification

### Phase 5: Production (Days 15-21)
- [ ] Flyway migration for new schema
- [ ] Compliance audit by tax specialist
- [ ] VeriFactu testing with mock authority API

---

## Compliance Verification

### Before MVP Launch
- [ ] Invoices are immutable (cannot edit after ISSUED)
- [ ] Invoice chain verified (no gaps or modifications)
- [ ] Audit trail complete (all financial operations logged)
- [ ] Sequential numbering enforced (no duplicates/gaps)
- [ ] CashMovements immutable
- [ ] Tax export working
- [ ] Tax authority can verify chain integrity
- [ ] No manual database edits bypass audit

---

## Future: Full VeriFactu Integration

**Out of scope for MVP but architecture supports**:
- Digital signatures on invoices
- Real-time reporting to tax authority API
- Electronic invoice transmission (e-factura)
- Tax authority verification response handling

---

**Status**: Architecture ready for Phase 4 implementation
