package com.zaphirio.retailapi.operation.invoice.repository;

import com.zaphirio.retailapi.operation.invoice.model.SupplierPayment;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;

import java.util.List;
import java.util.UUID;

public interface SupplierPaymentRepository extends TenantAwareRepository<SupplierPayment, UUID> {

    List<SupplierPayment> findAllBySupplierIdOrderByPaymentDateDesc(UUID supplierId);
}
