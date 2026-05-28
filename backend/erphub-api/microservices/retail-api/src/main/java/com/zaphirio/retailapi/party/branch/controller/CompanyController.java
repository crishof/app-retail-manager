package com.zaphirio.retailapi.party.branch.controller;

import com.zaphirio.retailapi.party.branch.dto.CompanyRequest;
import com.zaphirio.retailapi.party.branch.dto.CompanyResponse;
import com.zaphirio.retailapi.party.branch.dto.BranchRequest;
import com.zaphirio.retailapi.party.branch.dto.BranchResponse;
import com.zaphirio.retailapi.party.branch.exception.CompanyNotFoundException;
import com.zaphirio.retailapi.party.branch.service.BranchService;
import com.zaphirio.retailapi.party.branch.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;
    private final BranchService branchService;

    @GetMapping
    public ResponseEntity<List<CompanyResponse>> getAllCompanies() {
        return ResponseEntity.ok(companyService.getAllCompanies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyResponse> getCompanyById(@PathVariable UUID id) throws CompanyNotFoundException {
        return ResponseEntity.ok(companyService.getCompanyById(id));
    }

    @GetMapping("/{id}/branches")
    public ResponseEntity<List<BranchResponse>> getBranchesByCompany(@PathVariable UUID id) {
        return ResponseEntity.ok(branchService.getBranchesByCompanyId(id));
    }

    @PostMapping("/{id}/branches")
    public ResponseEntity<BranchResponse> createBranchByCompany(
            @PathVariable UUID id,
            @Valid @RequestBody BranchRequest branchRequest) throws CompanyNotFoundException {
        return ResponseEntity.status(HttpStatus.CREATED).body(branchService.createBranchForCompany(id, branchRequest));
    }

    @PostMapping
    public ResponseEntity<CompanyResponse> createCompany(@Valid @RequestBody CompanyRequest companyRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(companyService.createCompany(companyRequest));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CompanyResponse> updateCompany(
            @PathVariable UUID id,
            @Valid @RequestBody CompanyRequest companyRequest) throws CompanyNotFoundException {
        return ResponseEntity.ok(companyService.updateCompany(id, companyRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCompany(@PathVariable UUID id) throws CompanyNotFoundException {
        companyService.deleteCompany(id);
        return ResponseEntity.noContent().build();
    }
}
