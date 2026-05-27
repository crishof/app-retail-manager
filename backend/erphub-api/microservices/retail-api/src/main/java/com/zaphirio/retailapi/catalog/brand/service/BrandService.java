package com.zaphirio.retailapi.catalog.brand.service;

import com.zaphirio.retailapi.catalog.brand.dto.BrandMergeResponse;
import com.zaphirio.retailapi.catalog.brand.dto.BrandResponse;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface BrandService {

    BrandResponse create(String name, MultipartFile logo);

    Page<BrandResponse> getAll(Pageable pageable);

    BrandResponse getById(UUID id);

    BrandResponse update(UUID id, String name, MultipartFile logo);

    void delete(UUID id);

    void forceDelete(UUID id);

    Long getBrandCount();

    void deleteBrandLogo(UUID id);

    BrandResponse restore(UUID id);

    BrandMergeResponse mergeBrandInto(@NotNull UUID id, @NotNull UUID targetBrandId);
}
