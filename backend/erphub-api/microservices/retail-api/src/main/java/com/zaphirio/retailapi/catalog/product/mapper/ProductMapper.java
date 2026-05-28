package com.zaphirio.retailapi.catalog.product.mapper;

import com.zaphirio.retailapi.catalog.product.dto.ProductRequest;
import com.zaphirio.retailapi.catalog.product.dto.ProductResponse;
import com.zaphirio.retailapi.catalog.product.model.Product;
import org.mapstruct.*;

@Mapper(
        componentModel = "spring",
        unmappedTargetPolicy = ReportingPolicy.IGNORE,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface ProductMapper {

    @Mapping(target = "id", ignore = true)
    Product toEntity(ProductRequest request);

    ProductResponse toResponse(Product entity);

    @Mapping(target = "id", ignore = true)
    void updateEntityFromRequest(
            ProductRequest request,
            @MappingTarget Product entity);
}
