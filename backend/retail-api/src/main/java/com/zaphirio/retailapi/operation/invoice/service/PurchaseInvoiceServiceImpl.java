package com.zaphirio.retailapi.operation.invoice.service;

import com.zaphirio.retailapi.operation.invoice.dto.*;
import com.zaphirio.retailapi.operation.invoice.mapper.PurchaseInvoiceMapper;
import com.zaphirio.retailapi.operation.invoice.model.PurchaseInvoice;
import com.zaphirio.retailapi.operation.invoice.model.PurchaseInvoiceItem;
import com.zaphirio.retailapi.operation.invoice.repository.PurchaseInvoiceRepository;
import com.zaphirio.retailapi.operation.invoice.repository.PurchaseInvoiceItemRepository;
import com.zaphirio.retailapi.shared.fiscal.InvoiceStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of PurchaseInvoiceService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PurchaseInvoiceServiceImpl implements PurchaseInvoiceService {

    private final PurchaseInvoiceRepository purchaseInvoiceRepository;
    private final PurchaseInvoiceItemRepository itemRepository;
    private final PurchaseInvoiceMapper mapper;

    @Override
    public PurchaseInvoiceResponse create(CreatePurchaseInvoiceRequest request, Long tenantId) {
        log.info("Creating purchase invoice from supplier {}", request.getSupplierId());

        // Convert request to entity
        PurchaseInvoice invoice = mapper.toEntity(request);
        invoice.setTenantId(tenantId);
        invoice.setStatus(InvoiceStatus.DRAFT);

        // Add items
        if (request.getItems() != null) {
            for (CreatePurchaseInvoiceItemRequest itemRequest : request.getItems()) {
                PurchaseInvoiceItem item = mapper.itemToEntity(itemRequest);
                item.setPurchaseInvoice(invoice);
                invoice.getItems().add(item);
            }
        }

        // Recalculate retention if needed
        if (invoice.getRetentionPercentage() != null && invoice.getRetentionPercentage().compareTo(BigDecimal.ZERO) > 0) {
            invoice.recalculateRetention();
        }

        // Save invoice
        PurchaseInvoice saved = purchaseInvoiceRepository.save(invoice);
        log.info("Created purchase invoice with ID: {}", saved.getId());

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseInvoiceResponse getById(UUID id, Long tenantId) {
        log.debug("Fetching purchase invoice by ID: {}", id);
        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase invoice not found: " + id));
        return mapper.toResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseInvoiceResponse> getAll(Long tenantId) {
        log.debug("Fetching all purchase invoices");
        return purchaseInvoiceRepository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseInvoiceResponse> getBySupplierId(UUID supplierId, Long tenantId) {
        log.debug("Fetching purchase invoices for supplier: {}", supplierId);
        return purchaseInvoiceRepository.findBySupplierId(supplierId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseInvoiceResponse getBySupplierInvoiceNumber(String supplierInvoiceNumber, Long tenantId) {
        log.debug("Fetching purchase invoice by supplier number: {}", supplierInvoiceNumber);
        PurchaseInvoice invoice = purchaseInvoiceRepository.findBySupplierInvoiceNumber(supplierInvoiceNumber)
                .orElseThrow(() -> new RuntimeException("Purchase invoice not found: " + supplierInvoiceNumber));
        return mapper.toResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseInvoiceResponse> getUnpaid(Long tenantId) {
        log.debug("Fetching all unpaid purchase invoices");
        List<String> unpaidStatuses = List.of(
                InvoiceStatus.DRAFT.name(),
                InvoiceStatus.ISSUED.name(),
                InvoiceStatus.PENDING_PAYMENT.name()
        );
        return purchaseInvoiceRepository.findByStatusIn(unpaidStatuses).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseInvoiceResponse> getUnpaidBySupplierId(UUID supplierId, Long tenantId) {
        log.debug("Fetching unpaid invoices for supplier: {}", supplierId);
        List<String> unpaidStatuses = List.of(
                InvoiceStatus.DRAFT.name(),
                InvoiceStatus.ISSUED.name(),
                InvoiceStatus.PENDING_PAYMENT.name()
        );
        return purchaseInvoiceRepository.findBySupplierIdAndStatusIn(supplierId, unpaidStatuses).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseInvoiceResponse> getByDateRange(LocalDate startDate, LocalDate endDate, Long tenantId) {
        log.debug("Fetching purchase invoices between {} and {}", startDate, endDate);
        return purchaseInvoiceRepository.findByIssueDateBetween(startDate, endDate).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseInvoiceResponse> getWithWithholding(Long tenantId) {
        log.debug("Fetching invoices with withholding");
        return purchaseInvoiceRepository.findByRetentionPercentageGreaterThan(BigDecimal.ZERO).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public PurchaseInvoiceResponse update(UUID id, UpdatePurchaseInvoiceRequest request, Long tenantId) {
        log.info("Updating purchase invoice: {}", id);

        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase invoice not found: " + id));

        // Check if invoice is editable
        if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new RuntimeException("Cannot update paid or cancelled invoice");
        }

        if (request.getDueDate() != null) {
            invoice.setDueDate(request.getDueDate());
        }
        if (request.getRetentionPercentage() != null) {
            invoice.setRetentionPercentage(request.getRetentionPercentage());
            invoice.recalculateRetention();
        }
        if (request.getObservations() != null) {
            invoice.setObservations(request.getObservations());
        }

        PurchaseInvoice updated = purchaseInvoiceRepository.save(invoice);
        log.info("Updated purchase invoice: {}", id);

        return mapper.toResponse(updated);
    }

    @Override
    public PurchaseInvoiceResponse updateRetention(UUID id, BigDecimal retentionPercentage, Long tenantId) {
        log.info("Updating retention for invoice: {} to {}%", id, retentionPercentage);

        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase invoice not found: " + id));

        invoice.setRetentionPercentageAndRecalculate(retentionPercentage);

        PurchaseInvoice updated = purchaseInvoiceRepository.save(invoice);
        log.info("Updated retention for invoice: {}", id);

        return mapper.toResponse(updated);
    }

    @Override
    public PurchaseInvoiceResponse cancel(UUID id, Long tenantId) {
        log.info("Cancelling purchase invoice: {}", id);

        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase invoice not found: " + id));

        invoice.setStatus(InvoiceStatus.CANCELLED);

        PurchaseInvoice updated = purchaseInvoiceRepository.save(invoice);
        log.info("Cancelled purchase invoice: {}", id);

        return mapper.toResponse(updated);
    }

    @Override
    public void delete(UUID id, Long tenantId) {
        log.info("Deleting purchase invoice: {}", id);

        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase invoice not found: " + id));

        // Delete items first
        itemRepository.deleteByPurchaseInvoiceId(id);

        // Delete invoice
        purchaseInvoiceRepository.delete(invoice);
        log.info("Deleted purchase invoice: {}", id);
    }
}
