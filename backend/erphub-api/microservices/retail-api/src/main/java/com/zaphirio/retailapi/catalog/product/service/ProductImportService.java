package com.zaphirio.retailapi.catalog.product.service;

import com.zaphirio.retailapi.catalog.product.dto.ImportResult;
import com.zaphirio.retailapi.catalog.product.dto.SupplierProductRequest;

import java.util.List;

public interface ProductImportService {
    ImportResult importFromSupplier(List<SupplierProductRequest> productRequests);
}
