package com.zaphirio.retailapi.catalog.product.service;

import com.zaphirio.retailapi.shared.client.ImageServiceClient;
import com.zaphirio.retailapi.shared.client.InventoryServiceClient;
import com.zaphirio.retailapi.shared.client.InvoiceServiceClient;
import com.zaphirio.retailapi.shared.client.OrderServiceClient;
import com.zaphirio.retailapi.shared.client.PricingServiceClient;
import com.zaphirio.retailapi.catalog.product.dto.PricingPriceResponse;
import com.zaphirio.retailapi.catalog.product.dto.ProductPriceResponse;
import com.zaphirio.retailapi.catalog.product.dto.ProductRequest;
import com.zaphirio.retailapi.catalog.product.dto.ProductResponse;
import com.zaphirio.retailapi.shared.exception.BusinessException;
import com.zaphirio.retailapi.shared.exception.ResourceNotFoundException;
import com.zaphirio.retailapi.catalog.product.mapper.ProductMapper;
import com.zaphirio.retailapi.catalog.product.model.Product;
import com.zaphirio.retailapi.catalog.product.repository.ProductRepository;
import com.zaphirio.retailapi.catalog.product.repository.ProductSpecifications;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Validated
public class ProductServiceImpl implements ProductService {

    private static final String PRODUCT_NOT_FOUND = "Product with id %s not found";
    private static final String ENTITY_NAME = "products";
    private static final String DELETING = "Deleting product | id={}";
    private static final String DELETED = "Product deleted successfully | id={}";

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final ImageServiceClient imageClient;
    private final OrderServiceClient orderClient;
    private final InvoiceServiceClient invoiceClient;
    private final InventoryServiceClient inventoryServiceClient;
    private final PricingServiceClient pricingClient;
    private final ProductPriceLinkService priceLinkService;

    @Override
    public Page<ProductResponse> findAll(UUID brandId, UUID categoryId, UUID supplierId, Boolean highlighted,
                                         Boolean published, String search, Pageable pageable) {

        Specification<Product> spec = ProductSpecifications
                .filter(brandId, categoryId, supplierId, highlighted, published, search);
        // TODO Replace per-product pricing calls with a batch endpoint in pricing-sv to avoid N+1 on paginated lists.
        return productRepository.findAll(spec, pageable)
            .map(productMapper::toResponse)
            .map(this::enrichWithPrice)
            .map(this::enrichWithStock);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getById(UUID id) {
        return enrichWithStock(enrichWithPrice(productMapper.toResponse(getProductOrThrow(id))));
    }

    @Override
    @Transactional
    public ProductResponse create(ProductRequest productRequest) {
        Product product = productMapper.toEntity(productRequest);
        Product savedProduct = productRepository.save(product);
        return enrichWithStock(enrichWithPrice(productMapper.toResponse(savedProduct)));
    }

    @Override
    @Transactional
    public ProductResponse update(UUID id, ProductRequest productRequest) {
        Product existingProduct = getProductOrThrow(id);
        productMapper.updateEntityFromRequest(productRequest, existingProduct);
        Product updatedProduct = productRepository.save(existingProduct);
        return enrichWithStock(enrichWithPrice(productMapper.toResponse(updatedProduct)));
    }

    @Transactional
    @Override
    public void delete(UUID id) {
        Product existingProduct = getProductOrThrow(id);
        productRepository.delete(existingProduct);
    }

    @Transactional
    @Override
    public void forceDelete(UUID id) {

        deleteLog(DELETING, id);

        Product product = getProductOrThrow(id);

        // Validate stock movements
         boolean hasStockMovements = inventoryServiceClient.hasMovementsForProduct(id);
         if (hasStockMovements) {
             throw new BusinessException("Cannot delete product with stock movements");
         }

        // Commercial validations
        if (orderClient.hasOrdersForProduct(id) || invoiceClient.hasInvoicesForProduct(id)) {
            throw new BusinessException("Cannot delete product with orders or invoices");
        }

        // Delete associated images
        if (!product.getImageUrls().isEmpty()) {
            product.getImageUrls().forEach(this::deleteProductImage);
        }

        // Delete product
        int deleted = productRepository.forceDelete(id);

        if (deleted > 0) {
            deleteLog(DELETED, id);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Override
    public void deleteProductImage(String imageUrl) {
        try {
            imageClient.deleteImageByUrl(imageUrl, ENTITY_NAME);
        } catch (Exception ex) {
            log.warn("Failed to delete image {}. Reason: {}", imageUrl, ex.getMessage());
        }
    }

    @Transactional
    @Override
    public ProductResponse restore(UUID id) {
        log.info("Restoring product id={}", id);
        productRepository.findByIdIncludingDeleted(id).orElseThrow(EntityNotFoundException::new);

        if (!productRepository.existsDeletedById(id)) {
            throw new BusinessException("Product with id " + id + " is not deleted");
        }
        int updated = productRepository.restoreById(id);

        if (updated == 0) {
            throw new BusinessException("Failed to restore product with id " + id);
        }
        log.info("Product restored successfully");

        Product restored = productRepository.findById(id).orElseThrow(
                () -> new IllegalStateException("Product restored by not found"));

        return enrichWithStock(enrichWithPrice(productMapper.toResponse(restored)));

    }

    @Override
    public long count(UUID brandId, UUID categoryId, UUID supplierId) {
        return productRepository.countWithFilters(
                brandId,
                categoryId,
                supplierId
        );
    }

    @Override
    public boolean hasProductsForBrand(UUID brandId) {
        List<Product> products = productRepository.findAllByBrandId(brandId);
        return !products.isEmpty();
    }


    private Product getProductOrThrow(UUID id) {
        return productRepository.findById(id).orElseThrow(
                () -> new ResourceNotFoundException(String.format(PRODUCT_NOT_FOUND, id)));
    }

    @Transactional
    public void removeCategory(UUID categoryId) {
        int updated = productRepository.clearCategory(categoryId);
        if (updated == 0) {
            throw new EntityNotFoundException("No products found for category " + categoryId);
        }
    }

    @Transactional
    public void replaceCategory(UUID from, UUID to) {
        int updated = productRepository.replaceCategory(from, to);

        if (updated == 0) {
            throw new EntityNotFoundException("No products found for category " + from);
        }
    }

    @Override
    public int replaceBrand(UUID brandId, UUID newBrandId) {
        int updated = productRepository.replaceBrand(brandId, newBrandId);

        if (updated == 0) {
            throw new EntityNotFoundException("No products found for brand " + brandId);
        }
        return updated;
    }

    @Transactional
    @Override
    public int clearCategory(UUID categoryId) {
        return productRepository.clearCategory(categoryId);
    }


    private void deleteLog(String status, UUID id) {

        if (DELETING.equals(status)) {
            log.info(DELETING, id);
        } else {
            log.info(DELETED, id);
        }
    }

    @Override
    public Boolean existBySupplier(@NotNull UUID id) {
        return productRepository.existsBySupplierIdIncludingDeleted(id);
    }

    @Override
    public boolean existsBySupplier(UUID supplierId, UUID productId) {
        return productRepository.existBySupplier(supplierId, productId);
    }

    @Transactional
    public void attachPrice(UUID productId, UUID priceId) {
        Product product = productRepository.findById(productId).orElseThrow(
                () -> new ResourceNotFoundException("Product not found"));

        product.setPriceId(priceId);
        productRepository.save(product);
    }

    private ProductResponse enrichWithPrice(ProductResponse response) {
        if (response == null || response.getId() == null) {
            return response;
        }

        response.setPriceResponse(resolvePrice(response.getId()));
        response.setPriceAlerts(priceLinkService.getPriceAlertsForProduct(response.getId()));
        return response;
    }

    private ProductResponse enrichWithStock(ProductResponse response) {
        if (response == null || response.getId() == null) {
            return response;
        }
        response.setStockResponses(inventoryServiceClient.getProductStock(response.getId()));
         return response;
    }

    private ProductPriceResponse resolvePrice(UUID productId) {
        List<PricingPriceResponse> prices = pricingClient.getProductPrices(productId);

        if (prices == null || prices.isEmpty()) {
            return null;
        }

        PricingPriceResponse purchase = findByType(prices, "PURCHASE");
        PricingPriceResponse list = findByType(prices, "LIST");
        PricingPriceResponse web = findByType(prices, "WEB");
        PricingPriceResponse sellingRef = list != null ? list : web;
        PricingPriceResponse baseRef = sellingRef != null ? sellingRef : purchase;

        if (baseRef == null) {
            return null;
        }

        return ProductPriceResponse.builder()
                .purchasePrice(toDouble(purchase != null ? purchase.getAmount() : null))
            .sellingPrice(toDouble(baseRef.getAmount()))
            .taxRate(toDouble(baseRef.getTaxRate()))
            .discount(toDouble(baseRef.getDiscountRate()))
                .build();
    }

    private PricingPriceResponse findByType(List<PricingPriceResponse> prices, String expectedType) {
        return prices.stream()
                .filter(price -> price != null && price.getType() != null)
                .filter(price -> expectedType.equals(price.getType().toUpperCase(Locale.ROOT)))
                .findFirst()
                .orElse(null);
    }

    private double toDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : 0d;
    }

}

