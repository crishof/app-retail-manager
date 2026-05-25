package com.crishof.branchsv.service;

import com.crishof.branchsv.dto.BranchRequest;
import com.crishof.branchsv.dto.BranchResponse;
import com.crishof.branchsv.dto.LocationRequest;
import com.crishof.branchsv.exception.BranchNotFoundException;
import com.crishof.branchsv.exception.CompanyNotFoundException;
import com.crishof.branchsv.model.Branch;

import java.util.List;
import java.util.UUID;

public interface BranchService {

    List<BranchResponse> getAllBranches();

    List<BranchResponse> getBranchesByCompanyId(UUID companyId);

    BranchResponse getBranchResponseById(UUID id) throws BranchNotFoundException;

    Branch getBranchById(UUID branchId) throws BranchNotFoundException;

    BranchResponse createBranch(BranchRequest branchRequest) throws CompanyNotFoundException;

    BranchResponse createBranchForCompany(UUID companyId, BranchRequest branchRequest) throws CompanyNotFoundException;

    BranchResponse updateBranch(UUID branchId, BranchRequest branchRequest) throws BranchNotFoundException, CompanyNotFoundException;

    void deleteBranch(UUID branchId) throws BranchNotFoundException;

    BranchResponse createLocation(UUID branchId, LocationRequest request);

    BranchResponse updateLocation(UUID branchId, UUID locationId, LocationRequest request) throws BranchNotFoundException;

    BranchResponse deleteLocation(UUID branchId, UUID locationId) throws BranchNotFoundException;
}

