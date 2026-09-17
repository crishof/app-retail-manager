package com.zaphirio.retailapi.catalog.brand.mapper;

import com.zaphirio.retailapi.catalog.brand.dto.BrandResponse;
import com.zaphirio.retailapi.catalog.brand.model.Brand;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;


@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE,
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface BrandMapper {

    BrandResponse toDto(Brand brand);

}