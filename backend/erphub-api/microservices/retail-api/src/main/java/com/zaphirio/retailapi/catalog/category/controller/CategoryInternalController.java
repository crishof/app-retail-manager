package com.zaphirio.retailapi.catalog.category.controller;

import com.zaphirio.retailapi.catalog.category.service.CategoryInternalService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/internal/categories")
@RequiredArgsConstructor
@Slf4j
@Hidden
public class CategoryInternalController {

    private final CategoryInternalService categoryInternalService;

    // ============================
    // GET ID BY NAME OR CREATE NEW CATEGORY
    // ============================
    @GetMapping("/getByNameOrCreate")
    public UUID getByNameOrCreate(@RequestParam String categoryName) {
        log.info("Obtaining existing category or creating a new one");
        return categoryInternalService.getIdOrCreate(categoryName);
    }

}
