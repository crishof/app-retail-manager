package com.zaphirio.retailapi.party.branch.controller;

import com.zaphirio.retailapi.party.branch.dto.BranchRequest;
import com.zaphirio.retailapi.party.branch.dto.BranchResponse;
import com.zaphirio.retailapi.party.branch.dto.LocationRequest;
import com.zaphirio.retailapi.party.branch.exception.BranchNotFoundException;
import com.zaphirio.retailapi.party.branch.exception.CompanyNotFoundException;
import com.zaphirio.retailapi.party.branch.service.BranchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<BranchResponse>> getAllBranches() {
        return ResponseEntity.ok(branchService.getAllBranches());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<BranchResponse> getBranchById(@PathVariable UUID id) throws BranchNotFoundException {
        return ResponseEntity.ok(branchService.getBranchResponseById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BranchResponse> createBranch(@Valid @RequestBody BranchRequest branchRequest) throws CompanyNotFoundException {
        return ResponseEntity.status(HttpStatus.CREATED).body(branchService.createBranch(branchRequest));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BranchResponse> updateBranch(
            @PathVariable UUID id,
            @Valid @RequestBody BranchRequest branchRequest) throws BranchNotFoundException, CompanyNotFoundException {
        return ResponseEntity.ok(branchService.updateBranch(id, branchRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBranch(@PathVariable UUID id) throws BranchNotFoundException {
        branchService.deleteBranch(id);
        return ResponseEntity.noContent().build();
    }

    // ── Locations ────────────────────────────────────────────────────────────

    @PostMapping("/{branchId}/locations")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BranchResponse> createLocation(
            @PathVariable UUID branchId,
            @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(branchService.createLocation(branchId, request));
    }

    @PatchMapping("/{branchId}/locations/{locationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BranchResponse> updateLocation(
            @PathVariable UUID branchId,
            @PathVariable UUID locationId,
            @Valid @RequestBody LocationRequest request) throws BranchNotFoundException {
        return ResponseEntity.ok(branchService.updateLocation(branchId, locationId, request));
    }

    @DeleteMapping("/{branchId}/locations/{locationId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BranchResponse> deleteLocation(
            @PathVariable UUID branchId,
            @PathVariable UUID locationId) throws BranchNotFoundException {
        return ResponseEntity.ok(branchService.deleteLocation(branchId, locationId));
    }

    // Alias: depósitos

    @PostMapping("/{branchId}/deposits")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BranchResponse> createDeposit(
            @PathVariable UUID branchId,
            @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(branchService.createLocation(branchId, request));
    }

    @PatchMapping("/{branchId}/deposits/{locationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BranchResponse> updateDeposit(
            @PathVariable UUID branchId,
            @PathVariable UUID locationId,
            @Valid @RequestBody LocationRequest request) throws BranchNotFoundException {
        return ResponseEntity.ok(branchService.updateLocation(branchId, locationId, request));
    }

    @DeleteMapping("/{branchId}/deposits/{locationId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BranchResponse> deleteDeposit(
            @PathVariable UUID branchId,
            @PathVariable UUID locationId) throws BranchNotFoundException {
        return ResponseEntity.ok(branchService.deleteLocation(branchId, locationId));
    }
}

