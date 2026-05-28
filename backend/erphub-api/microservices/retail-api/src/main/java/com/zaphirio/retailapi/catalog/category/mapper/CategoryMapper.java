package com.zaphirio.retailapi.catalog.category.mapper;

import com.zaphirio.retailapi.catalog.category.dto.CategoryResponse;
import com.zaphirio.retailapi.catalog.category.model.Category;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",
        unmappedSourcePolicy = ReportingPolicy.IGNORE,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface CategoryMapper {

    CategoryResponse toDto(Category category);

}
