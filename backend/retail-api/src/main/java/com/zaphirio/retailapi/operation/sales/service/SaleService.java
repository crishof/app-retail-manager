package com.zaphirio.retailapi.operation.sales.service;

import com.zaphirio.retailapi.operation.sales.dto.SaleRequest;
import com.zaphirio.retailapi.operation.sales.dto.SaleResponse;

import java.util.List;
import java.util.UUID;

public interface SaleService {
    List<SaleResponse> getAll();
    SaleResponse getById(UUID id);
    SaleResponse save(SaleRequest request);
    List<SaleResponse> getByCustomerId(UUID customerId);
    List<SaleResponse> getByBranchId(UUID branchId);
}
