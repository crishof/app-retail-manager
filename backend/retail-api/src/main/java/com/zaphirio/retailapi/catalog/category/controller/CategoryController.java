package com.zaphirio.retailapi.catalog.category.controller;

import com.zaphirio.retailapi.catalog.category.dto.CategoryResponse;
import com.zaphirio.retailapi.catalog.category.dto.CategoryTreeResponse;
import com.zaphirio.retailapi.catalog.category.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Tag(name = "Categories", description = "Category management APIs")
@Validated
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;

    // ============================
    // CREATE CATEGORY
    // ============================
    @Operation(summary = "Create a new category (root or child)")
    @ApiResponse(responseCode = "201", description = "Category created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CategoryResponse> create(@RequestParam @NotBlank String name,
                                                   @RequestParam(required = false) UUID parentId,
                                                   @RequestPart(required = false) MultipartFile logo) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(name, parentId, logo));
    }

    // ============================
    // GET ALL CATEGORIES (PAGINATED)
    // ============================
    @Operation(summary = "Get all categories (paginated)")
    @ApiResponse(responseCode = "200", description = "Categories retrieved successfully")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<Page<CategoryResponse>> getAll(Pageable pageable) {
        log.info("Fetching all categories with pagination");
        Page<CategoryResponse> page = categoryService.getAll(pageable);
        return ResponseEntity.ok(page);
    }

    // ============================
    // GET CATEGORY BY ID
    // ============================
    @Operation(summary = "Get category by ID")
    @ApiResponse(responseCode = "200", description = "Category retrieved successfully")
    @ApiResponse(responseCode = "400", description = "Category not found")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<CategoryResponse> getById(@PathVariable @NotNull UUID id) {
        log.info("Fetching category by id={}", id);
        return ResponseEntity.ok(categoryService.getById(id));
    }

    // ============================
    // GET CATEGORY BY NAME
    // ============================
    //TODO implement get by name containing


    // ============================
    // UPDATE CATEGORY
    // ============================
    @Operation(summary = "Update an existing category (name and/or image")
    @ApiResponse(responseCode = "200", description = "Category updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @ApiResponse(responseCode = "400", description = "Category not found")
    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CategoryResponse> update(@PathVariable @NotNull UUID id,
                                                   @RequestPart(required = false) String name,
                                                   @RequestPart(required = false) MultipartFile logo) {
        log.info("Updating category id={} | name present={}", id, name == null);
        return ResponseEntity.ok(categoryService.update(id, name, logo));
    }

    // ============================
    // DELETE CATEGORY
    // ============================
    @Operation(summary = "Delete a category by ID")
    @ApiResponse(responseCode = "204", description = "Category deleted successfully")
    @ApiResponse(responseCode = "404", description = "Category not found")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable @NotNull UUID id) {
        log.info("Deleting category id={}", id);
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ============================
    // DELETE CATEGORY IMAGE
    // ============================
    @Operation(summary = "Delete category image")
    @ApiResponse(responseCode = "204", description = "Category image deleted successfully")
    @ApiResponse(responseCode = "404", description = "Category not found")
    @PatchMapping("/{id}/image")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteImage(@PathVariable @NotNull UUID id) {
        log.info("Deleting category image={}", id);
        categoryService.deleteCategoryImage(id);
        return ResponseEntity.noContent().build();
    }

    // ============================
    // COUNT CATEGORIES
    // ============================
    @Operation(summary = "Get total count of categories")
    @ApiResponse(responseCode = "200", description = "Category count retrieved successfully")
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<Long> getCategoryCount() {
        log.info("Getting total count of categories");
        return ResponseEntity.ok(categoryService.getCategoryCount());
    }

    // ============================
    // CHANGE CATEGORY LEVEL
    // ============================
    @Operation(summary = "Move a category to a new parent")
    @PatchMapping("/{id}/parent")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CategoryResponse> changeParent(@PathVariable UUID id,
                                                         @RequestParam(required = false) UUID newParentId) {
        log.info("Moving category {} under parent {}", id, newParentId);
        return ResponseEntity.ok(categoryService.changeParent(id, newParentId));
    }

    // ============================
    // GET CATEGORY TREE
    // ============================
    @Operation(summary = "Get full category tree")
    @GetMapping("/tree")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<CategoryTreeResponse>> getTree() {
        return ResponseEntity.ok(categoryService.getTree());
    }

    // ============================
    // GET SUB CATEGORY TREE
    // ============================
    @Operation(summary = "Get category subtree")
    @GetMapping("/{id}/tree")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<CategoryTreeResponse> getSubTree(@PathVariable UUID id) {
        return ResponseEntity.ok(categoryService.getSubTree(id));
    }
}
