package com.zaphirio.retailapi.operation.sales.controller;

import com.zaphirio.retailapi.operation.sales.dto.SaleRequest;
import com.zaphirio.retailapi.operation.sales.dto.SaleResponse;
import com.zaphirio.retailapi.operation.sales.service.SaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    @GetMapping
    public List<SaleResponse> getAll() {
        return saleService.getAll();
    }

    @GetMapping("/{id}")
    public SaleResponse getById(@PathVariable UUID id) {
        return saleService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SaleResponse save(@RequestBody SaleRequest request) {
        return saleService.save(request);
    }

    @GetMapping("/customer/{customerId}")
    public List<SaleResponse> getByCustomer(@PathVariable UUID customerId) {
        return saleService.getByCustomerId(customerId);
    }

    @GetMapping("/branch/{branchId}")
    public List<SaleResponse> getByBranch(@PathVariable UUID branchId) {
        return saleService.getByBranchId(branchId);
    }
}
