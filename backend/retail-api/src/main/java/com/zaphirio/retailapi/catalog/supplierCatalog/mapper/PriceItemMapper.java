package com.zaphirio.retailapi.catalog.supplierCatalog.mapper;

import com.zaphirio.retailapi.catalog.supplierCatalog.dto.PriceItemResponse;
import com.zaphirio.retailapi.catalog.supplierCatalog.model.SupplierPriceItem;
import org.springframework.stereotype.Component;

@Component
public class PriceItemMapper {

    public PriceItemResponse toDto(SupplierPriceItem supplierPriceItem) {
        if (supplierPriceItem == null) {
            return null;
        }

        return PriceItemResponse.builder()
                .id(supplierPriceItem.getId())
                .supplierId(supplierPriceItem.getSupplierId())
                .supplierCode(supplierPriceItem.getSupplierCode())
                .brand(supplierPriceItem.getBrand())
                .model(supplierPriceItem.getModel())
                .barcode(supplierPriceItem.getBarcode())
                .description(supplierPriceItem.getDescription())
                .category(supplierPriceItem.getCategory())
                .price(supplierPriceItem.getPrice())
                .suggestedPrice(supplierPriceItem.getSuggestedPrice())
                .suggestedWebPrice(supplierPriceItem.getSuggestedWebPrice())
                .currency(supplierPriceItem.getCurrency())
                .taxRate(supplierPriceItem.getTaxRate())
                .stockAvailable(supplierPriceItem.getStockRaw())
                .lastUpdate(supplierPriceItem.getLastUpdate())
                .build();
    }

}
