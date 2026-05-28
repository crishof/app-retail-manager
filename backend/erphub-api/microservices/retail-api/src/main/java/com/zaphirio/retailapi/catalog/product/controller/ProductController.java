package com.zaphirio.retailapi.catalog.product.controller;

import com.zaphirio.retailapi.catalog.product.dto.ProductRequest;
import com.zaphirio.retailapi.catalog.product.dto.ProductResponse;
import com.zaphirio.retailapi.catalog.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Products", description = "Product management APIs")
@Validated
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    @GetMapping("/status")
    public String status() {
        return "Product service is running!";
    }

    private final ProductService productService;

    // ============================
    // GET ALL PRODUCTS (PAGINATED)
    // ============================
    @Operation(summary = "Get all products with optional filters (paginated)")
    @ApiResponse(responseCode = "200", description = "Products retrieved successfully")
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getAll(@RequestParam(required = false) UUID brandId,
                                                        @RequestParam(required = false) UUID categoryId,
                                                        @RequestParam(required = false) UUID supplierId,
                                                        @RequestParam(required = false) Boolean highlighted,
                                                        @RequestParam(required = false) Boolean published,
                                                        @RequestParam(required = false) Boolean inStock,
                                                        @RequestParam(required = false) String search,
                                                        Pageable pageable) {
        log.info("Fetching products with pagination ");

        // TODO add serch by stock
        Page<ProductResponse> page = productService.findAll(
                brandId, categoryId, supplierId, highlighted, published, search, pageable);
        return ResponseEntity.ok(page);
    }

    // ============================
    // GET PRODUCT BY ID
    // ============================
    @Operation(summary = "Get product by ID")
    @ApiResponse(responseCode = "200", description = "Product retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Product not found")
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getById(@PathVariable UUID id) {
        log.info("Fetching product | id={}", id);
        return ResponseEntity.ok(productService.getById(id));
    }

    // ============================
    // CREATE NEW PRODUCT
    // ============================
    @Operation(summary = "Create a new product")
    @ApiResponse(responseCode = "201", description = "Product created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest productRequest) {
        log.info("Creating new product {}", productRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(productRequest));
    }

    // ============================
    // UPDATE PRODUCT
    // ============================
    @Operation(summary = "Update an existing product")
    @ApiResponse(responseCode = "200", description = "Product updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid input")
    @ApiResponse(responseCode = "404", description = "Product not found")
    @PatchMapping("/{id}")
    public ProductResponse update(@PathVariable UUID id, @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    // ============================
    // DELETE PRODUCT
    // ============================
    @Operation(summary = "Soft delete a product by ID")
    @ApiResponse(responseCode = "204", description = "Product deleted successfully")
    @ApiResponse(responseCode = "404", description = "Product not found")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NotNull UUID id) {
        log.info("Deleting product | id={}", id);
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ============================
    // FORCE DELETE PRODUCT
    // ============================
    @Operation(summary = "Hard delete a product by ID")
    @ApiResponse(responseCode = "204", description = "Product deleted successfully")
    @ApiResponse(responseCode = "404", description = "Product not found")
    @DeleteMapping("/{id}/force")
    public ResponseEntity<Void> forceDelete(@PathVariable @NotNull UUID id) {
        log.info("Hard deleting product id={}", id);
        productService.forceDelete(id);
        return ResponseEntity.noContent().build();
    }

    // ============================
    // RESTORE PRODUCT
    // ============================
    @Operation(summary = "Restore a deleted product by ID")
    @PatchMapping("/{id}/restore")
    public ResponseEntity<ProductResponse> restore(@PathVariable UUID id) {

        return ResponseEntity.ok(productService.restore(id));
    }

    // ============================
    // COUNT PRODUCTS
    // ============================
    @Operation(summary = "Get total count of products with optional filters")
    @GetMapping("/count")
    public long count(@RequestParam(required = false) UUID brandId,
                      @RequestParam(required = false) UUID categoryId,
                      @RequestParam(required = false) UUID supplierId) {
        return productService.count(brandId, categoryId, supplierId);
    }
}
