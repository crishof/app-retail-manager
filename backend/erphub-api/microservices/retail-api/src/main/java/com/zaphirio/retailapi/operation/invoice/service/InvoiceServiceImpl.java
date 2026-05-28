package com.zaphirio.retailapi.operation.invoice.service;

import com.zaphirio.retailapi.shared.client.InventoryClient;
import com.zaphirio.retailapi.operation.invoice.dto.InvoiceStockMovementRequest;
import com.zaphirio.retailapi.operation.invoice.dto.*;
import com.zaphirio.retailapi.operation.invoice.exception.InvoiceNotFoundException;
import com.zaphirio.retailapi.operation.invoice.model.Invoice;
import com.zaphirio.retailapi.operation.invoice.model.InvoiceItem;
import com.zaphirio.retailapi.operation.invoice.model.OtherConcept;
import com.zaphirio.retailapi.operation.invoice.model.StockMovementReason;
import com.zaphirio.retailapi.operation.invoice.model.SupplierPayment;
import com.zaphirio.retailapi.operation.invoice.repository.InvoiceRepository;
import com.zaphirio.retailapi.operation.invoice.repository.SupplierPaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InventoryClient inventoryClient;
    private final SupplierPaymentRepository supplierPaymentRepository;

    @Override
    public List<InvoiceResponse> getAll() {
        return invoiceRepository.findAll().stream()
                .map(this::toInvoiceResponse).toList();
    }

    @Override
    public List<InvoiceResponse> getAllBySupplierId(UUID supplierId) {
        return invoiceRepository.findAllBySupplierId(supplierId).stream()
                .map(this::toInvoiceResponse).toList();
    }

    @Override
    public InvoiceResponse getById(UUID id) {

        Optional<Invoice> invoice = invoiceRepository.findById(id);
        if (invoice.isPresent()) {
            return this.toInvoiceResponse(invoice.get());
        }
        throw new InvoiceNotFoundException(id);
    }

    @Override
    @Transactional
    public InvoiceResponse save(InvoiceRequest invoiceRequest) {

        Invoice invoice = this.toInvoice(invoiceRequest);
        invoice.getInvoiceItems().forEach(item -> item.setInvoice(invoice));
        Invoice saved = invoiceRepository.save(invoice);

        if (invoiceRequest.isSaveStocks()) {
            invoiceRequest.getInvoiceItemsRequest().forEach(item -> {
                try {
                    inventoryClient.registerMovement(InvoiceStockMovementRequest.builder()
                            .productId(item.getId())
                            .branchId(invoiceRequest.getBranchId())
                            .locationId(invoiceRequest.getLocationId())
                            .quantity(item.getQuantity())
                            .reason(StockMovementReason.INVOICE)
                            .referenceId(saved.getId())
                            .build());
                } catch (Exception ex) {
                    log.warn("Could not register stock movement for product={}: {}", item.getId(), ex.getMessage());
                }
            });
        }

        return this.toInvoiceResponse(saved);
    }

    @Override
    public void deleteById(UUID id) {
        // TODO implement rollback
    }

    @Override
    public List<TransactionResponse> getAllTransactionsBySupplier(UUID supplierId) {
        return invoiceRepository.findAllBySupplierId(supplierId).stream().map(this::toTransactionResponse).toList();
    }

    private String formatInvoiceNumber(String prefix, String number) {
        if (prefix == null || number == null) return null;
        try {
            String formatedPrefix = String.format("%03d", Integer.parseInt(prefix));
            String formatedNumber = String.format("%03d", Integer.parseInt(number));
            return formatedPrefix + " - " + formatedNumber;
        } catch (NumberFormatException e) {
            return prefix + " - " + number;
        }
    }

    private TransactionResponse toTransactionResponse(Invoice invoice) {
        return TransactionResponse.builder()
                .transactionId(invoice.getId())
                .date(invoice.getInvoiceDate())
                .type(invoice.getInvoiceType())
                .transactionNumber(invoice.getInvoiceNumber())
                .taxSave(invoice.isTaxSave())
                .description(invoice.getObservations())
                .amount(invoice.getTotalPrice())
                .build();
    }

    private Invoice toInvoice(InvoiceRequest invoiceRequest) {

        return Invoice.builder()
                .supplierId(invoiceRequest.getSupplierId())

                .location(invoiceRequest.getLocation())

                .branchId(invoiceRequest.getBranchId())
                .locationId(invoiceRequest.getLocationId())

                .invoiceDate(invoiceRequest.getInvoiceDate())
                .dueDate(invoiceRequest.getDueDate())
                .receptionDate(invoiceRequest.getReceptionDate())
                .savedDate(invoiceRequest.getSavedDate())

                .invoiceType(invoiceRequest.getInvoiceType())
                .invoiceNumber(this.formatInvoiceNumber(
                        invoiceRequest.getInvoicePrefix(), invoiceRequest.getInvoiceNumber()
                ))
                .packingListNumber(this.formatInvoiceNumber(
                        invoiceRequest.getPackingListPrefix(), invoiceRequest.getPackingListNumber()
                ))

                .invoiceItems(invoiceRequest.getInvoiceItemsRequest().stream()
                        .map(this::toInvoiceItem).toList())

                .otherConcepts(invoiceRequest.getOtherConceptsRequest() != null
                        ? invoiceRequest.getOtherConceptsRequest().stream()
                        .map(this::toOtherConcept).toList()
                        : new ArrayList<>())

                .taxSave(invoiceRequest.isTaxSave())
                .fixedAsset(invoiceRequest.isFixedAsset())
                .observations(invoiceRequest.getObservations())
                .subtotal1(invoiceRequest.getSubtotal1())
                .discount(invoiceRequest.getDiscount())
                .interest(invoiceRequest.getInterest())
                .subtotal2(invoiceRequest.getSubtotal2())
                .netValue0(invoiceRequest.getNetValue0())
                .netValue105(invoiceRequest.getNetValue105())
                .netValue21(invoiceRequest.getNetValue21())
                .netValue27(invoiceRequest.getNetValue27())
                .vat105(invoiceRequest.getVat105())
                .vat21(invoiceRequest.getVat21())
                .vat27(invoiceRequest.getVat27())

                .internalTax(invoiceRequest.getInternalTax())

                .withholdingVat(invoiceRequest.getWithholdingVat())
                .withholdingSuss(invoiceRequest.getWithholdingSuss())
                .withholdingGrossReceiptsTax(invoiceRequest.getWithholdingGrossReceiptsTax())
                .withholdingIncome(invoiceRequest.getWithholdingIncome())
                .stateTax(invoiceRequest.getStateTax())
                .localTax(invoiceRequest.getLocalTax())

                .rounding(invoiceRequest.getRounding())

                .totalPrice(invoiceRequest.getTotalPrice())
                .currency(invoiceRequest.getCurrency())

                .build();
    }

    private InvoiceItem toInvoiceItem(InvoiceItemRequest invoiceItemRequest) {

        return InvoiceItem.builder()
                .productId(invoiceItemRequest.getId())
                .price(invoiceItemRequest.getPrice())
                .quantity(invoiceItemRequest.getQuantity())
                .discountRate(invoiceItemRequest.getDiscountRate())
                .taxRate(invoiceItemRequest.getTaxRate())
                .build();
    }

    private InvoiceItemResponse toInvoiceItemResponse(InvoiceItem invoiceItem) {
        return InvoiceItemResponse.builder()
                .productId(invoiceItem.getProductId())
                .price(invoiceItem.getPrice())
                .discountRate(invoiceItem.getDiscountRate())
                .taxRate(invoiceItem.getTaxRate())
                .quantity(invoiceItem.getQuantity())
                .build();
    }

    private OtherConcept toOtherConcept(OtherConceptRequest request) {
        return OtherConcept.builder()
                .description(request.getDescription())
                .price(request.getPrice())
                .taxRate(request.getTaxRate())
                .internalTaxRate(request.getInternalTaxRate())
                .discountRate(request.getDiscountRate())
                .build();
    }


    private InvoiceResponse toInvoiceResponse(Invoice invoice) {
        return InvoiceResponse.builder()

                .supplierId(invoice.getSupplierId())

                .branchId(invoice.getBranchId())
                .locationId(invoice.getLocationId())

                .invoiceDate(invoice.getInvoiceDate())
                .dueDate(invoice.getDueDate())
                .receptionDate(invoice.getReceptionDate())
                .savedDate(invoice.getSavedDate())

                .invoiceType(invoice.getInvoiceType())
                .invoiceNumber(invoice.getInvoiceNumber())
                .packingListNumber(invoice.getPackingListNumber())

                .invoiceItems(invoice.getInvoiceItems().stream()
                        .map(this::toInvoiceItemResponse).toList())

                .fixedAsset(invoice.isFixedAsset())
                .observations(invoice.getObservations())
                .subtotal1(invoice.getSubtotal1())
                .discount(invoice.getDiscount())
                .interest(invoice.getInterest())
                .subtotal2(invoice.getSubtotal2())
                .netValue0(invoice.getNetValue0())
                .netValue105(invoice.getNetValue105())
                .netValue21(invoice.getNetValue21())
                .netValue27(invoice.getNetValue27())
                .vat105(invoice.getVat105())
                .vat21(invoice.getVat21())
                .vat27(invoice.getVat27())

                .internalTax(invoice.getInternalTax())

                .withholdingVat(invoice.getWithholdingVat())
                .withholdingSuss(invoice.getWithholdingSuss())
                .withholdingGrossReceiptsTax(invoice.getWithholdingGrossReceiptsTax())
                .withholdingIncome(invoice.getWithholdingIncome())
                .stateTax(invoice.getStateTax())
                .localTax(invoice.getLocalTax())

                .rounding(invoice.getRounding())

                .totalPrice(invoice.getTotalPrice())
                .currency(invoice.getCurrency())

                .build();
    }

    @Override
    @Transactional
    public SupplierPaymentResponse savePayment(SupplierPaymentRequest request) {
        SupplierPayment payment = SupplierPayment.builder()
                .supplierId(request.getSupplierId())
                .branchId(request.getBranchId())
                .paymentDate(request.getPaymentDate())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .reference(request.getReference())
                .description(request.getDescription())
                .build();
        SupplierPayment saved = supplierPaymentRepository.save(payment);
        return toPaymentResponse(saved);
    }

    @Override
    public List<AccountMovementResponse> getAccountStatement(UUID supplierId) {
        List<AccountMovementResponse> movements = new ArrayList<>();

        invoiceRepository.findAllBySupplierId(supplierId).forEach(inv ->
                movements.add(AccountMovementResponse.builder()
                        .id(inv.getId())
                        .type("INVOICE")
                        .date(inv.getInvoiceDate())
                        .reference(inv.getInvoiceNumber())
                        .description(inv.getObservations())
                        .amount(inv.getTotalPrice())
                        .build())
        );

        supplierPaymentRepository.findAllBySupplierIdOrderByPaymentDateDesc(supplierId).forEach(pay ->
                movements.add(AccountMovementResponse.builder()
                        .id(pay.getId())
                        .type("PAYMENT")
                        .date(pay.getPaymentDate())
                        .reference(pay.getReference())
                        .description(pay.getDescription())
                        .amount(-pay.getAmount())
                        .build())
        );

        movements.sort(Comparator.comparing(AccountMovementResponse::getDate));

        double running = 0;
        for (AccountMovementResponse m : movements) {
            running += m.getAmount();
            m.setBalance(running);
        }

        return movements;
    }

    private SupplierPaymentResponse toPaymentResponse(SupplierPayment p) {
        return SupplierPaymentResponse.builder()
                .id(p.getId())
                .supplierId(p.getSupplierId())
                .branchId(p.getBranchId())
                .paymentDate(p.getPaymentDate())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .reference(p.getReference())
                .description(p.getDescription())
                .build();
    }
}
