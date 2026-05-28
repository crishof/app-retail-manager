package com.zaphirio.retailapi.catalog.brand.controller;

import com.zaphirio.retailapi.catalog.brand.service.BrandInternalService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/internal/brands")
@RequiredArgsConstructor
@Slf4j
@Hidden
public class BrandInternalController {

    private final BrandInternalService brandInternalService;

    @GetMapping("/getByNameOrCreate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public UUID getByNameOrCreate(@RequestParam String brandName) {
        log.info("Obtaining existing brand id or creating a new one");
        return brandInternalService.getIdOrCreate(brandName);
    }
}
