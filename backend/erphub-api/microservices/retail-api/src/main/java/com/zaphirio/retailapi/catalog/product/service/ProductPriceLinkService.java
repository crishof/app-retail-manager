package com.zaphirio.retailapi.catalog.product.service;

import com.zaphirio.retailapi.catalog.product.dto.ProductPriceLinkResponse;
import com.zaphirio.retailapi.catalog.product.dto.ProductPriceHistoryResponse;
import com.zaphirio.retailapi.catalog.product.model.Product;
import com.zaphirio.retailapi.catalog.product.model.ProductPriceLink;
import com.zaphirio.retailapi.catalog.product.model.ProductPriceHistory;
import com.zaphirio.retailapi.catalog.product.repository.ProductPriceLinkRepository;
import com.zaphirio.retailapi.catalog.product.repository.ProductPriceHistoryRepository;
import com.zaphirio.retailapi.catalog.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductPriceLinkService {

    private final ProductPriceLinkRepository linkRepository;
    private final ProductPriceHistoryRepository historyRepository;
    private final ProductRepository productRepository;

    @Transactional
    public ProductPriceLinkResponse linkSupplierProduct(String supplierProductId, UUID productId, String supplierCode, BigDecimal importedPrice) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        ProductPriceLink link = linkRepository.findBySupplierProductIdAndProductId(supplierProductId, productId)
                .orElse(null);

        if (link == null) {
            // Nuevo vínculo
            link = ProductPriceLink.builder()
                    .supplierProductId(supplierProductId)
                    .product(product)
                    .supplierCode(supplierCode)
                    .lastImportedPrice(importedPrice)
                    .previousImportedPrice(null)
                    .priceChangeStatus(ProductPriceLink.PriceChangeStatus.NEW)
                    .build();
        } else {
            // Actualizar vínculo existente
            BigDecimal previous = link.getLastImportedPrice();
            link.setPreviousImportedPrice(previous);
            link.setLastImportedPrice(importedPrice);

            // Detectar cambio de precio
            ProductPriceLink.PriceChangeStatus status = detectPriceChange(previous, importedPrice);
            link.setPriceChangeStatus(status);
            link.setLastPriceChangeAt(LocalDateTime.now());

            // Registrar en historial
            if (previous != null && !previous.equals(importedPrice)) {
                BigDecimal changePercent = calculateChangePercent(previous, importedPrice);
                ProductPriceHistory history = ProductPriceHistory.builder()
                        .link(link)
                        .priceFrom(previous)
                        .priceTo(importedPrice)
                        .changePercent(changePercent)
                        .changeType(status)
                        .importedAt(LocalDateTime.now())
                        .build();
                historyRepository.save(history);
                log.info("Price change recorded | link={} | from={} | to={} | status={}", link.getId(), previous, importedPrice, status);
            }
        }

        link = linkRepository.save(link);
        return toResponse(link);
    }

    public List<ProductPriceLinkResponse> getPriceAlerts() {
        return linkRepository.findAllWithPriceAlerts().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ProductPriceLinkResponse> getPriceAlertsForProduct(UUID productId) {
        return linkRepository.findPriceAlertsForProduct(productId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ProductPriceHistoryResponse> getPriceHistory(UUID linkId) {
        return historyRepository.findByLinkIdOrderByRecordedAtDesc(linkId).stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    public ProductPriceLinkResponse getLink(UUID linkId) {
        ProductPriceLink link = linkRepository.findById(linkId)
                .orElseThrow(() -> new IllegalArgumentException("Link not found: " + linkId));
        return toResponse(link);
    }

    /**
     * Actualiza el precio en todos los vínculos que referencian el item de proveedor dado.
     * Llamado desde supplier-catalog-sv durante la importación de precios.
     */
    @Transactional
    public void notifyPriceUpdate(String supplierProductId, BigDecimal newPrice) {
        List<ProductPriceLink> links = linkRepository.findBySupplierProductId(supplierProductId);
        for (ProductPriceLink link : links) {
            BigDecimal previous = link.getLastImportedPrice();
            link.setPreviousImportedPrice(previous);
            link.setLastImportedPrice(newPrice);

            ProductPriceLink.PriceChangeStatus status = detectPriceChange(previous, newPrice);
            link.setPriceChangeStatus(status);
            link.setLastPriceChangeAt(LocalDateTime.now());

            if (previous != null && previous.compareTo(newPrice) != 0) {
                BigDecimal changePercent = calculateChangePercent(previous, newPrice);
                ProductPriceHistory history = ProductPriceHistory.builder()
                        .link(link)
                        .priceFrom(previous)
                        .priceTo(newPrice)
                        .changePercent(changePercent)
                        .changeType(status)
                        .importedAt(LocalDateTime.now())
                        .build();
                historyRepository.save(history);
                log.info("Import price change | supplierProductId={} | from={} | to={} | status={}", supplierProductId, previous, newPrice, status);
            }
            linkRepository.save(link);
        }
    }

    private ProductPriceLink.PriceChangeStatus detectPriceChange(BigDecimal previous, BigDecimal current) {
        if (previous == null || current == null) return ProductPriceLink.PriceChangeStatus.NEW;
        
        int comparison = current.compareTo(previous);
        return switch (comparison) {
            case 0 -> ProductPriceLink.PriceChangeStatus.SAME;
            case 1 -> ProductPriceLink.PriceChangeStatus.UP;
            default -> ProductPriceLink.PriceChangeStatus.DOWN;
        };
    }

    private BigDecimal calculateChangePercent(BigDecimal from, BigDecimal to) {
        if (from.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return to.subtract(from).divide(from, 2, java.math.RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
    }

    private ProductPriceLinkResponse toResponse(ProductPriceLink link) {
        return ProductPriceLinkResponse.builder()
                .id(link.getId())
                .supplierProductId(link.getSupplierProductId())
                .productId(link.getProduct().getId())
                .productName(link.getProduct().getModel())
                .supplierCode(link.getSupplierCode())
                .lastImportedPrice(link.getLastImportedPrice())
                .priceChangeStatus(link.getPriceChangeStatus().name())
                .previousImportedPrice(link.getPreviousImportedPrice())
                .lastPriceChangeAt(link.getLastPriceChangeAt())
                .createdAt(link.getCreatedAt())
                .updatedAt(link.getUpdatedAt())
                .build();
    }

    private ProductPriceHistoryResponse toHistoryResponse(ProductPriceHistory history) {
        return ProductPriceHistoryResponse.builder()
                .id(history.getId())
                .linkId(history.getLink().getId())
                .priceFrom(history.getPriceFrom())
                .priceTo(history.getPriceTo())
                .changePercent(history.getChangePercent())
                .changeType(history.getChangeType().name())
                .importedAt(history.getImportedAt())
                .recordedAt(history.getRecordedAt())
                .build();
    }
}
