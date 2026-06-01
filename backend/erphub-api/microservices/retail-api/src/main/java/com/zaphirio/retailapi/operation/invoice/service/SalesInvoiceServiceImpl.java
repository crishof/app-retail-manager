package com.zaphirio.retailapi.operation.invoice.service;

import com.zaphirio.retailapi.operation.invoice.dto.*;
import com.zaphirio.retailapi.operation.invoice.mapper.SalesInvoiceMapper;
import com.zaphirio.retailapi.operation.invoice.model.SalesInvoice;
import com.zaphirio.retailapi.operation.invoice.model.SalesInvoiceItem;
import com.zaphirio.retailapi.operation.invoice.repository.SalesInvoiceRepository;
import com.zaphirio.retailapi.operation.invoice.repository.SalesInvoiceItemRepository;
import com.zaphirio.retailapi.shared.fiscal.InvoiceStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of SalesInvoiceService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SalesInvoiceServiceImpl implements SalesInvoiceService {

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final SalesInvoiceItemRepository itemRepository;
    private final SalesInvoiceMapper mapper;

    @Override
    public SalesInvoiceResponse create(CreateSalesInvoiceRequest request, Long tenantId) {
        log.info("Creating sales invoice for sale {} by customer {}", request.getSaleId(), request.getCustomerId());

        // Convert request to entity
        SalesInvoice invoice = mapper.toEntity(request);
        invoice.setTenantId(tenantId);
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setPaymentStatus(SalesInvoice.PaymentStatus.PENDING);

        // Add items
        if (request.getItems() != null) {
            for (CreateSalesInvoiceItemRequest itemRequest : request.getItems()) {
                SalesInvoiceItem item = mapper.itemToEntity(itemRequest);
                item.setSalesInvoice(invoice);
                invoice.getItems().add(item);
            }
        }

        // Save invoice
        SalesInvoice saved = salesInvoiceRepository.save(invoice);
        log.info("Created sales invoice with ID: {}", saved.getId());

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SalesInvoiceResponse getById(UUID id, Long tenantId) {
        log.debug("Fetching sales invoice by ID: {}", id);
        SalesInvoice invoice = salesInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales invoice not found: " + id));
        return mapper.toResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesInvoiceResponse> getAll(Long tenantId) {
        log.debug("Fetching all sales invoices");
        return salesInvoiceRepository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesInvoiceResponse> getByCustomerId(UUID customerId, Long tenantId) {
        log.debug("Fetching sales invoices for customer: {}", customerId);
        return salesInvoiceRepository.findByCustomerId(customerId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SalesInvoiceResponse getBySaleId(UUID saleId, Long tenantId) {
        log.debug("Fetching sales invoice for sale: {}", saleId);
        SalesInvoice invoice = salesInvoiceRepository.findBySaleId(saleId)
                .orElseThrow(() -> new RuntimeException("Sales invoice not found for sale: " + saleId));
        return mapper.toResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesInvoiceResponse> getUnpaidByCustomerId(UUID customerId, Long tenantId) {
        log.debug("Fetching unpaid invoices for customer: {}", customerId);
        List<SalesInvoice.PaymentStatus> unpaidStatuses = List.of(
                SalesInvoice.PaymentStatus.PENDING,
                SalesInvoice.PaymentStatus.PARTIAL
        );
        return salesInvoiceRepository.findByCustomerIdAndPaymentStatusIn(customerId, unpaidStatuses).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesInvoiceResponse> getByDateRange(LocalDate startDate, LocalDate endDate, Long tenantId) {
        log.debug("Fetching sales invoices between {} and {}", startDate, endDate);
        return salesInvoiceRepository.findByIssueDateBetween(startDate, endDate).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public SalesInvoiceResponse update(UUID id, UpdateSalesInvoiceRequest request, Long tenantId) {
        log.info("Updating sales invoice: {}", id);

        SalesInvoice invoice = salesInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales invoice not found: " + id));

        // Check if invoice is editable (not finalized/paid)
        if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new RuntimeException("Cannot update paid or cancelled invoice");
        }

        if (request.getDueDate() != null) {
            invoice.setDueDate(request.getDueDate());
        }
        if (request.getPaymentMethod() != null) {
            invoice.setPaymentMethod(request.getPaymentMethod());
        }
        if (request.getObservations() != null) {
            invoice.setObservations(request.getObservations());
        }

        SalesInvoice updated = salesInvoiceRepository.save(invoice);
        log.info("Updated sales invoice: {}", id);

        return mapper.toResponse(updated);
    }

    @Override
    public SalesInvoiceResponse recordPayment(UUID id, double paymentAmount, Long tenantId) {
        log.info("Recording payment of {} for invoice: {}", paymentAmount, id);

        SalesInvoice invoice = salesInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales invoice not found: " + id));

        if (paymentAmount <= 0) {
            throw new RuntimeException("Payment amount must be positive");
        }

        double remaining = invoice.recordPayment(paymentAmount);
        log.info("Payment recorded. Remaining: {}", remaining);

        SalesInvoice updated = salesInvoiceRepository.save(invoice);
        return mapper.toResponse(updated);
    }

    @Override
    public SalesInvoiceResponse cancel(UUID id, Long tenantId) {
        log.info("Cancelling sales invoice: {}", id);

        SalesInvoice invoice = salesInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales invoice not found: " + id));

        invoice.setStatus(InvoiceStatus.CANCELLED);

        SalesInvoice updated = salesInvoiceRepository.save(invoice);
        log.info("Cancelled sales invoice: {}", id);

        return mapper.toResponse(updated);
    }

    @Override
    public void delete(UUID id, Long tenantId) {
        log.info("Deleting sales invoice: {}", id);

        SalesInvoice invoice = salesInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales invoice not found: " + id));

        // Delete items first
        itemRepository.deleteBySalesInvoiceId(id);

        // Delete invoice
        salesInvoiceRepository.delete(invoice);
        log.info("Deleted sales invoice: {}", id);
    }
}
