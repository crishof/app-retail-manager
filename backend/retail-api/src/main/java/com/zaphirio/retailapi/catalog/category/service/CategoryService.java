package com.zaphirio.retailapi.catalog.category.service;

import com.zaphirio.retailapi.catalog.category.dto.CategoryResponse;
import com.zaphirio.retailapi.catalog.category.dto.CategoryTreeResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface CategoryService {

    @Transactional
    CategoryResponse create(String name, UUID parentId, MultipartFile image);

    @Transactional(readOnly = true)
    Page<CategoryResponse> getAll(Pageable pageable);

    @Transactional(readOnly = true)
    CategoryResponse getById(UUID id);

    @Transactional
    CategoryResponse update(UUID id, String name, MultipartFile image);

    @Transactional
    void delete(UUID id);

    @Transactional
    void deleteCategoryImage(UUID id);

    @Transactional(readOnly = true)
    Long getCategoryCount();

    CategoryResponse changeParent(UUID id, UUID newParentId);

    List<CategoryTreeResponse> getTree();

    CategoryTreeResponse getSubTree(UUID id);

    UUID getIdOrCreateByName(String name);
}
