package com.zaphirio.retailapi.catalog.brand.service;

import com.zaphirio.retailapi.catalog.brand.model.Brand;
import com.zaphirio.retailapi.catalog.brand.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class BrandInternalService {

    private final BrandService brandService;
    private final BrandRepository brandRepository;

    public UUID getIdOrCreate(String brandName) {

        log.info("getting brand with name {}", brandName);
        Optional<Brand> optionalBrand = brandRepository.findByNameIncludingDeleted(brandName);

        if (optionalBrand.isPresent()) {
            Brand existingBrand = optionalBrand.get();
            if (existingBrand.isDeleted()) {
                brandService.restore(existingBrand.getId());
            }
            log.info("found brand with name {}", brandName);
            return existingBrand.getId();
        }
        log.info("brand with name {} not found, creating new one", brandName);
        Brand brand = new Brand();
        brand.setName(brandName);

        brandRepository.save(brand);
        return brand.getId();
    }
}
