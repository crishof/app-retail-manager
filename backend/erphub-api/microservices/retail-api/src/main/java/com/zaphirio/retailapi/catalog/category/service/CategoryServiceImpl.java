package com.zaphirio.retailapi.catalog.category.service;

import com.zaphirio.retailapi.catalog.category.client.ImageServiceClient;
import com.zaphirio.retailapi.catalog.category.client.ProductServiceClient;
import com.zaphirio.retailapi.catalog.category.dto.CategoryResponse;
import com.zaphirio.retailapi.catalog.category.dto.CategoryTreeResponse;
import com.zaphirio.retailapi.shared.exception.BusinessException;
import com.zaphirio.retailapi.shared.exception.ResourceNotFoundException;
import com.zaphirio.retailapi.catalog.category.mapper.CategoryMapper;
import com.zaphirio.retailapi.catalog.category.model.Category;
import com.zaphirio.retailapi.catalog.category.repository.CategoryRepository;
import com.zaphirio.retailapi.catalog.category.utils.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryServiceImpl implements CategoryService {

    private static final String CATEGORY_NOT_FOUND = "Category with id %s not found";
    private static final String ENTITY_NAME = "Categories";

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    private final ImageServiceClient imageClient;
    private final ProductServiceClient productClient;

    @Transactional
    @Override
    public CategoryResponse create(String name, UUID parentId, MultipartFile image) {

        if (name == null || name.isBlank()) {
            throw new BusinessException("Category name cannot be empty");
        }

        Category parent = null;
        if (parentId != null) {
            parent = getCategoryOrThrow(parentId);
        }

        String normalizedName = name.trim();
        String baseSlug = SlugUtils.toSlug(normalizedName);

        String slug = baseSlug;
        int counter = 1;
        while (categoryRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }

        Category category = new Category();
        category.setName(normalizedName);
        category.setSlug(slug);
        category.setParent(parent);
        category.setLevel(parent == null ? 0 : parent.getLevel() + 1);
        category.setLeaf(true);

        if (parent != null) {
            parent.setLeaf(false);
        }

        if (image != null) {
            category.setImageUrl(imageClient.uploadImage(image, ENTITY_NAME));
        }

        return categoryMapper.toDto(categoryRepository.save(category));
    }

    @Transactional
    @Override
    public UUID getIdOrCreateByName(String name) {

        if (name == null || name.isBlank()) {
            throw new BusinessException("Category name cannot be empty");
        }

        return categoryRepository.findByName(name.trim())
                .map(Category::getId)
                .orElseGet(() ->
                        create(name.trim(), null, null).getId()
                );
    }

    @Transactional(readOnly = true)
    @Override
    public Page<CategoryResponse> getAll(Pageable pageable) {

        log.debug("Fetching categories | page={} size{}", pageable.getPageNumber(), pageable.getPageSize());

        return categoryRepository.findAll(pageable).map(categoryMapper::toDto);
    }

    @Transactional(readOnly = true)
    @Override
    public CategoryResponse getById(UUID id) {
        return categoryMapper.toDto(getCategoryOrThrow(id));
    }

    @Transactional
    @Override
    public CategoryResponse update(UUID id, String name, MultipartFile image) {

        log.info("Updating category | id={} | updateName={} | updateLogo={}", id, name != null, image != null);

        Category category = getCategoryOrThrow(id);

        if (image != null) {

            String imageUrl;

            if (category.getImageUrl() == null) {
                log.debug("Uploading new image for category | id={}", id);
                imageUrl = imageClient.uploadImage(image, ENTITY_NAME);
            } else {
                log.debug("Replacing image for category | id={}", id);
                imageUrl = imageClient.replaceImage(image, ENTITY_NAME, category.getImageUrl());
            }

            category.setImageUrl(imageUrl);
        }

        if (name != null) {
            String normalizedName = name.trim();
            if (normalizedName.isBlank()) {
                throw new BusinessException("Category name cannot be empty");
            }
            log.debug("Updating category name | id={} | to newName={}", id, name);
            category.setName(name);
        }

        Category updated = categoryRepository.save(category);

        log.info("Category updated successfully | id={}", id);

        return categoryMapper.toDto(updated);
    }

    @Transactional
    @Override
    public void delete(UUID id) {

        log.info("Deleting category | id={}", id);

        Category category = getCategoryOrThrow(id);

        int affected = productClient.clearCategory(category.getId());
        log.info("Cleared category {} from {} products", id, affected);

        if (categoryRepository.existsByParent(category)) {
            throw new BusinessException("Cannot delete category with subcategories");
        }
        categoryRepository.delete(category);

        log.info("Category deleted successfully | id={}", id);
    }

    @Transactional
    @Override
    public void deleteCategoryImage(UUID id) {

        Category category = getCategoryOrThrow(id);
        log.info("Deleting image for category | name={}", category.getName());

        if (category.getImageUrl() != null) {
            log.debug("Deleting category image ");
            imageClient.deleteImageByUrl(category.getImageUrl(), ENTITY_NAME);
        }
        category.setImageUrl(null);
        categoryRepository.save(category);
        log.info("Category image deleted successfully | id={}", id);
    }

    @Override
    public Long getCategoryCount() {
        return categoryRepository.count();
    }

    @Transactional
    @Override
    public CategoryResponse changeParent(UUID id, UUID newParentId) {

        Category category = getCategoryOrThrow(id);
        Category newParent = newParentId == null ? null : getCategoryOrThrow(newParentId);

        if (newParent != null) {

            if (category.getId().equals(newParent.getId())) {
                throw new BusinessException("Category cannot be its own parent");
            }

            if (isDescendant(category, newParent)) {
                throw new BusinessException("Cannot move category under its own descendant");
            }
        }

        category.setParent(newParent);
        return categoryMapper.toDto(categoryRepository.save(category));
    }

    @Transactional(readOnly = true)
    @Override
    public List<CategoryTreeResponse> getTree() {

        List<Category> roots = categoryRepository.findByParentIsNull();

        return roots.stream().map(this::mapToTree).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public CategoryTreeResponse getSubTree(UUID id) {
        Category root = getCategoryOrThrow(id);
        return mapToTree(root);
    }

    // =========================
    // PRIVATE HELPERS
    // =========================
    private Category getCategoryOrThrow(UUID id) {
        return categoryRepository.findById(id).orElseThrow(
                () -> new ResourceNotFoundException(String.format(CATEGORY_NOT_FOUND, id)));
    }

    private boolean isDescendant(Category category, Category possibleChild) {
        Category current = possibleChild;
        while (current != null) {
            if (current.getId().equals(category.getId())) {
                return true;
            }
            current = current.getParent();
        }
        return false;
    }

    private CategoryTreeResponse mapToTree(Category category) {

        List<CategoryTreeResponse> children = category.getChildren().stream()
                .map(this::mapToTree)
                .toList();

        return new CategoryTreeResponse(
                category.getId(), category.getName(), category.getImageUrl(), children);
    }
}
