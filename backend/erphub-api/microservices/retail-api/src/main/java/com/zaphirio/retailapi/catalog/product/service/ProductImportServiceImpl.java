package com.zaphirio.retailapi.catalog.product.service;

import com.zaphirio.retailapi.shared.client.BrandServiceClient;
import com.zaphirio.retailapi.shared.client.CategoryServiceClient;
import com.zaphirio.retailapi.shared.client.PricingServiceClient;
import com.zaphirio.retailapi.catalog.product.dto.*;
import com.zaphirio.retailapi.catalog.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductImportServiceImpl implements ProductImportService {

    private final ProductService productService;
    private final BrandServiceClient brandClient;
    private final CategoryServiceClient categoryClient;
    private final PricingServiceClient pricingClient;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public ImportResult importFromSupplier(List<SupplierProductRequest> supplierProductRequests) {

        int imported = 0;
        int skipped = 0;
        int failed = 0;

        List<ImportItemError> errors = new ArrayList<>();

        for (SupplierProductRequest item : supplierProductRequests) {
            UUID createdProductId = null;

            try {
                // ============================
                // Idempotency
                // ============================
                if (productService.existsBySupplier(item.getSupplierId(), item.getId())) {
                    skipped++;
                    continue;
                }

                // ============================
                // Solve references
                // ============================
                //TODO handle brand creation async
                UUID brandId = brandClient.getIdOrCreate(item.getBrand());

                UUID categoryId = null;
                if (item.getCategory() != null && !item.getCategory().isBlank()) {
                    categoryId = categoryClient.getIdOrCreate(item.getCategory());
                }

                // ============================
                // Create product
                // ============================

                ProductRequest productRequest = ProductRequest.builder()
                        .code(item.getCode())
                        .brandId(brandId)
                        .model(item.getModel())
                        .brandName(item.getBrand())
                        .description(item.getDescription())
                        .categoryId(categoryId)
                        .supplierId(item.getSupplierId())
                        .supplierProductId(item.getId())
                        .active(true)
                        .published(false)
                        .highlighted(false)
                        .gtin(item.getBarcode())
                        .build();

                ProductResponse product = productService.create(productRequest);
                createdProductId = product.getId();

                // ============================
                // Create price snapshot
                // ============================
                UUID priceId = pricingClient.createSnapshot(product.getId(), item.getPrice(),
                        item.getSuggestedPrice(), item.getSuggestedWebPrice(), item.getTaxRate());

                // ============================
                // Assign price snapshot to product
                // ============================
                productService.attachPrice(product.getId(), priceId);

                imported++;

            } catch (Exception ex) {
                failed++;

                if (createdProductId != null) {
                    try {
                        // Compensation: avoid keeping a product without pricing snapshot attached.
                        productRepository.forceDelete(createdProductId);
                    } catch (Exception cleanupEx) {
                        log.error("Failed to cleanup product after import error [productId={}]", createdProductId, cleanupEx);
                    }
                }

                errors.add(ImportItemError.builder()
                        .supplierProductId(item.getId())
                        .code(item.getCode())
                        .reason(ex.getMessage())
                        .build());

                log.error("Error importing supplier product [supplierProductId={}, code={}]",
                        item.getId(), item.getCode(), ex);
            }
        }

        return ImportResult.builder()
                .total(supplierProductRequests.size())
                .imported(imported)
                .skipped(skipped)
                .failed(failed)
                .errors(errors)
                .build();
    }
}
