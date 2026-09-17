package com.zaphirio.retailapi.catalog.category.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class CategoryInternalService {

    private final CategoryService categoryService;

    public UUID getIdOrCreate(String categoryName) {
        return categoryService.getIdOrCreateByName(categoryName);
    }
}