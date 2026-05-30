package com.zaphirio.retailapi.operation.sales.repository;

import com.zaphirio.retailapi.operation.sales.model.Sale;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;

import java.util.List;
import java.util.UUID;

public interface SaleRepository extends TenantAwareRepository<Sale, UUID> {
    List<Sale> findAllByCustomerIdOrderBySaleDateDesc(UUID customerId);
    List<Sale> findAllByBranchIdOrderBySaleDateDesc(UUID branchId);
}
