package com.zaphirio.retailapi.operation.invoice.repository;

import com.zaphirio.retailapi.operation.invoice.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    List<Invoice> findAllBySupplierId(UUID supplierId);

    boolean existsByInvoiceItemsProductId(UUID productId);
}
