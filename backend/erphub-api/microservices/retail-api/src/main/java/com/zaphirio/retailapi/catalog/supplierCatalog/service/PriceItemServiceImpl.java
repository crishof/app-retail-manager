package com.zaphirio.retailapi.catalog.supplierCatalog.service;


import com.zaphirio.retailapi.catalog.supplierCatalog.dto.ImportResult;
import com.zaphirio.retailapi.catalog.supplierCatalog.dto.ColumnHeaderSuggestion;
import com.zaphirio.retailapi.catalog.supplierCatalog.dto.PriceItemResponse;
import com.zaphirio.retailapi.catalog.supplierCatalog.exception.PriceItemNotFoundException;
import com.zaphirio.retailapi.catalog.supplierCatalog.importer.ExcelPriceItemReader;
import com.zaphirio.retailapi.catalog.supplierCatalog.importer.PriceItemImportService;
import com.zaphirio.retailapi.catalog.supplierCatalog.mapper.PriceItemMapper;
import com.zaphirio.retailapi.catalog.supplierCatalog.model.SupplierPriceItem;
import com.zaphirio.retailapi.catalog.supplierCatalog.repository.SupplierPriceItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceItemServiceImpl implements PriceItemService {

    final SupplierPriceItemRepository supplierPriceItemRepository;
    private final ExcelPriceItemReader excelReader;
    private final PriceItemImportService importService;
    private final PriceItemMapper priceItemMapper;

    @Override
    public ImportResult importFile(
            MultipartFile file,
            UUID supplierId,
            boolean updateExisting
    ) {

        log.info("Starting price list import | supplierId={}", supplierId);

        List<SupplierPriceItem> items = excelReader.read(file);

        ImportResult result =
                importService.importItems(items, supplierId, updateExisting);

        log.info("Import finished | total={} | imported={} | inserted={} | updated={} | skipped={} | failed={}",
            result.getTotal(), result.getImported(), result.getInserted(), result.getUpdated(), result.getSkipped(), result.getFailed());

        return result;
    }

        @Override
        public ImportResult importFile(
            MultipartFile file,
            UUID supplierId,
            boolean updateExisting,
            Map<String, String> columnMapping
        ) {
        if (columnMapping == null || columnMapping.isEmpty()) {
            return importFile(file, supplierId, updateExisting);
        }

        log.info("Starting price list import with custom mapping | supplierId={}", supplierId);

        List<SupplierPriceItem> items = excelReader.readWithMapping(file, columnMapping);

        ImportResult result = importService.importItems(items, supplierId, updateExisting);

        log.info("Import finished | total={} | imported={} | inserted={} | updated={} | skipped={} | failed={}", //TODO imported e inserted son el mismo dato?
            result.getTotal(), result.getImported(), result.getInserted(), result.getUpdated(), result.getSkipped(), result.getFailed());

        return result;
        }

        @Override
        public List<ColumnHeaderSuggestion> extractHeaders(MultipartFile file) {
        return excelReader.readHeaderSuggestions(file);
        }

    @Override
    public List<PriceItemResponse> getAllByFilter(UUID supplierId, String brand, String filter) {
        List<SupplierPriceItem> products = new ArrayList<>();

        if (supplierId == null) {
            if (brand == null && filter == null) {
                log.info("// Supplier null && brand null && filter null");
                products = supplierPriceItemRepository.findAll();
            } else if (brand == null) {
                log.info("// Supplier null && brand null && filter");
                products = supplierPriceItemRepository.findAllByBrandContainingOrModelContainingOrDescriptionContaining(filter);
            } else if (filter == null) {
                log.info("// Supplier null && brand && filter null");
                products = supplierPriceItemRepository.findAllByBrand(brand);
            } else {
                log.info("// Supplier null && brand && filter");
                products = supplierPriceItemRepository.findAllByBrandAndModelContainingOrDescriptionContaining(brand, filter);
            }
        }

        if (supplierId != null) {
            if (brand == null && filter == null) {
                log.info("// Supplier && brand null && filter null");
                products = supplierPriceItemRepository.findAllBySupplierId(supplierId);
            } else if (brand == null) {
                log.info("// Supplier && brand null && filter");
                products = supplierPriceItemRepository.findAllBySupplierIdAndBrandContainingOrModelContainingOrDescriptionContaining(supplierId, filter);
            } else if (filter == null) {
                log.info("// Supplier && brand && filter null");
                products = supplierPriceItemRepository.findAllBySupplierIdAndBrand(supplierId, brand);
            } else {
                log.info("// Supplier && brand && filter");
                products = supplierPriceItemRepository.findAllBySupplierIdAndBrandAndCodeContainingOrDescriptionContaining(supplierId, brand, filter);
            }
        }
        return products.stream().map(priceItemMapper::toDto).toList();
    }

    @Override
    public PriceItemResponse getById(UUID id) {

        SupplierPriceItem priceItem = supplierPriceItemRepository.findById(id)
                .orElseThrow(() -> new PriceItemNotFoundException(id));

        return priceItemMapper.toDto(priceItem);
    }

    @Override
    public List<String> getBrandsBySupplier(UUID supplierId) {

        List<SupplierPriceItem> products = supplierPriceItemRepository.findAllBySupplierId(supplierId);

        return products.stream()
                .map(SupplierPriceItem::getBrand)
                .distinct().sorted()
                .toList();
    }

    @Override
    public List<String> getAllBrands() {
        List<SupplierPriceItem> products = supplierPriceItemRepository.findAll();

        return products.stream()
                .map(SupplierPriceItem::getBrand)
                .distinct()
                .sorted()
                .toList();
    }
}
