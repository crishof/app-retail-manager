package com.zaphirio.retailapi.catalog.supplierCatalog.importer;

import com.zaphirio.retailapi.catalog.product.service.ProductPriceLinkService;
import com.zaphirio.retailapi.catalog.supplierCatalog.dto.ImportResult;
import com.zaphirio.retailapi.catalog.supplierCatalog.model.SupplierPriceItem;
import com.zaphirio.retailapi.catalog.supplierCatalog.repository.SupplierPriceItemRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceItemImportService {

    private final SupplierPriceItemRepository repository;
    private final ProductPriceLinkService productPriceLinkService;

    @Transactional
    public ImportResult importItems(
            List<SupplierPriceItem> items,
            UUID supplierId,
            boolean updateExisting
    ) {

        int inserted = 0;
        int updated = 0;
        int skipped = 0;
        int failed = 0;
        List<String> errors = new ArrayList<>();

        for (SupplierPriceItem item : items) {

            try {
                SupplierPriceItem existing =
                        repository.findProductByBrandAndSupplierCodeAndSupplierId(
                                item.getBrand(),
                                item.getSupplierCode(),
                                supplierId
                        );

                if (existing != null) {
                    if (!updateExisting) {
                        skipped++;
                        continue;
                    }
                    BigDecimal previousPrice = existing.getPrice();
                    merge(existing, item);
                    repository.save(existing);
                    updated++;

                    // Notificar a product-sv si el precio cambió
                     if (existing.getPrice() != null &&
                             (previousPrice == null || previousPrice.compareTo(existing.getPrice()) != 0)) {
                         try {
                             productPriceLinkService.notifyPriceUpdate(
                                     existing.getId().toString(),
                                     existing.getPrice()
                             );
                         } catch (Exception e) {
                             log.warn("Price link notification failed | item={} | error={}", existing.getId(), e.getMessage());
                         }
                     }
                } else {
                    item.setSupplierId(supplierId);
                    repository.save(item);
                    inserted++;
                }
            } catch (Exception e) {
                failed++;
                String ref = item.getSupplierCode() != null ? item.getSupplierCode() : item.getModel();
                String msg = "[" + ref + "]: " + e.getMessage();
                errors.add(msg);
                log.error("Error importing item [code={}]", item.getSupplierCode(), e);
            }
        }

        return ImportResult.builder()
                .total(items.size())
                .imported(inserted + updated)
                .inserted(inserted)
                .updated(updated)
                .skipped(skipped)
                .failed(failed)
                .errors(errors)
                .build();
    }

    private void merge(SupplierPriceItem target, SupplierPriceItem source) {
        // Para productos existentes solo se actualizan precios e impuestos.
        if (source.getPrice() != null) target.setPrice(source.getPrice());
        if (source.getSuggestedPrice() != null) target.setSuggestedPrice(source.getSuggestedPrice());
        if (source.getSuggestedWebPrice() != null) target.setSuggestedWebPrice(source.getSuggestedWebPrice());
        if (source.getTaxRate() != null) target.setTaxRate(source.getTaxRate());
        if (source.getInternalTax() != null) target.setInternalTax(source.getInternalTax());
        target.setLastUpdate(Instant.now());
    }
}