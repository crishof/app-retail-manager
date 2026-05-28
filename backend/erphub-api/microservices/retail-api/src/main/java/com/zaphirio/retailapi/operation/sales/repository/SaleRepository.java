package com.zaphirio.retailapi.operation.sales.repository;

import com.zaphirio.retailapi.operation.sales.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SaleRepository extends JpaRepository<Sale, UUID> {
    List<Sale> findAllByCustomerIdOrderBySaleDateDesc(UUID customerId);
    List<Sale> findAllByBranchIdOrderBySaleDateDesc(UUID branchId);
}
