package com.zaphirio.retailapi.catalog.supplierCatalog.service;

import com.zaphirio.retailapi.catalog.supplierCatalog.dto.ImportResult;
import com.zaphirio.retailapi.catalog.supplierCatalog.dto.PriceItemResponse;
import com.zaphirio.retailapi.catalog.supplierCatalog.dto.ColumnHeaderSuggestion;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface PriceItemService {

    ImportResult importFile(
            MultipartFile file,
            UUID supplierId,
            boolean updateExisting
    );

    ImportResult importFile(
        MultipartFile file,
        UUID supplierId,
        boolean updateExisting,
        Map<String, String> columnMapping
    );

    List<ColumnHeaderSuggestion> extractHeaders(MultipartFile file);

    List<PriceItemResponse> getAllByFilter(UUID supplierId, String brand, String filter);

    PriceItemResponse getById(UUID id);

    List<String> getBrandsBySupplier(UUID supplierId);

    List<String> getAllBrands();
}
