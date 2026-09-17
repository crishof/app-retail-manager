package com.zaphirio.retailapi.catalog.product.service;

import com.zaphirio.retailapi.catalog.product.dto.ProductRequest;
import com.zaphirio.retailapi.catalog.product.dto.ProductResponse;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

public interface ProductService {

    Page<ProductResponse> findAll(UUID brandId, UUID categoryId, UUID supplierId,
                                  Boolean highlighted, Boolean published, String search, Pageable pageable);

    ProductResponse getById(UUID id);

    ProductResponse create(ProductRequest request);

    ProductResponse update(UUID id, ProductRequest request);

    void delete(UUID id);

    @Transactional
    void forceDelete(UUID id);

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    void deleteProductImage(String imageUrl);

    ProductResponse restore(UUID id);

    long count(UUID brandId, UUID categoryId, UUID supplierId);

    boolean hasProductsForBrand(UUID brandId);

    void removeCategory(UUID categoryId);

    void replaceCategory(UUID from, UUID uuid);

    int replaceBrand(UUID brandId, UUID newBrandId);

    @Transactional
    int clearCategory(UUID categoryId);

    Boolean existBySupplier(@NotNull UUID id);

    boolean existsBySupplier(UUID supplierId, UUID productId);

    void attachPrice(UUID productId, UUID priceId);
}
