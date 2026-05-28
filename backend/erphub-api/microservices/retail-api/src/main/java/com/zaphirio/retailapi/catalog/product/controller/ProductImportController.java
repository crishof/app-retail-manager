package com.zaphirio.retailapi.catalog.product.controller;

import com.zaphirio.retailapi.catalog.product.dto.ImportResult;
import com.zaphirio.retailapi.catalog.product.dto.SupplierProductRequest;
import com.zaphirio.retailapi.catalog.product.service.ProductImportService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products/import")
@RequiredArgsConstructor
@Slf4j
public class ProductImportController {

    private final ProductImportService importService;

    // ============================
    // IMPORT PRODUCTS FROM SUPPLIERS
    // ============================
    @Operation(summary = "Import products from supplier item list")
    @PostMapping("/supplier")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ImportResult> importFromSupplier(@RequestBody List<SupplierProductRequest> productRequests) {
        log.info("Importing products from supplier item list");
        return ResponseEntity.ok(importService.importFromSupplier(productRequests));
    }
}
