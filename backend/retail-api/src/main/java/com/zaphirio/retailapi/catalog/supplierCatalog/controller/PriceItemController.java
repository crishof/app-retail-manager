package com.zaphirio.retailapi.catalog.supplierCatalog.controller;

import com.zaphirio.retailapi.catalog.supplierCatalog.dto.ImportResult;
import com.zaphirio.retailapi.catalog.supplierCatalog.dto.PriceItemResponse;
import com.zaphirio.retailapi.catalog.supplierCatalog.dto.ColumnHeaderSuggestion;
import com.zaphirio.retailapi.catalog.supplierCatalog.service.PriceItemService;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/price-items")
@RequiredArgsConstructor
@Slf4j
public class PriceItemController {

    private final PriceItemService priceItemService;
    private final ObjectMapper objectMapper;

    // ============================
    // IMPORT PRICE ITEMS
    // ============================
    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ImportResult importPriceItems(
            @RequestParam MultipartFile file,
            @RequestParam UUID supplierId,
            @RequestParam(defaultValue = "false") boolean updateExisting, //TODO update existing debe ser true - revisar form también al cambiar
            @RequestParam(required = false) String columnMapping
    ) {
        Map<String, String> mapping = parseColumnMapping(columnMapping);
        return priceItemService.importFile(file, supplierId, updateExisting, mapping);
    }

    // ============================
    // PARSE EXCEL HEADERS
    // ============================
    @PostMapping("/parse-headers")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<ColumnHeaderSuggestion> parseHeaders(@RequestParam MultipartFile file) {
        return priceItemService.extractHeaders(file);
    }

    // ============================
    // SEARCH FILTERED ITEMS
    // ============================
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public List<PriceItemResponse> findAll(
            @RequestParam(required = false) UUID supplierId,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String filter
    ) {
        return priceItemService.getAllByFilter(supplierId, brand, filter);
    }

    // ============================
    // GET ITEM BY ID
    // ============================
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public PriceItemResponse findById(@PathVariable UUID id) {
        return priceItemService.getById(id);
    }

    // ============================
    // GET BRANDS BY SUPPLIER
    // ============================
    @GetMapping("/brands")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public List<String> getBrands(
            @RequestParam(required = false) UUID supplierId
    ) {
        return supplierId == null
                ? priceItemService.getAllBrands()
                : priceItemService.getBrandsBySupplier(supplierId);
    }

    // ============================
    // HELPERS
    // ============================
    private Map<String, String> parseColumnMapping(String columnMappingJson) {
        if (columnMappingJson == null || columnMappingJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(columnMappingJson, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse columnMapping JSON: {}", columnMappingJson, e);
            return Map.of();
        }
    }
}