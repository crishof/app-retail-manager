package com.zaphirio.retailapi.operation.invoice.repository;

import com.zaphirio.retailapi.operation.invoice.model.Invoice;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends TenantAwareRepository<Invoice, UUID> {

    List<Invoice> findAllBySupplierId(UUID supplierId);

    boolean existsByInvoiceItemsProductId(UUID productId);
}
