package com.zaphirio.retailapi.party.branch.service;

import com.zaphirio.retailapi.party.branch.dto.CompanyRequest;
import com.zaphirio.retailapi.party.branch.dto.CompanyResponse;
import com.zaphirio.retailapi.party.branch.exception.CompanyNotFoundException;

import java.util.List;
import java.util.UUID;

public interface CompanyService {

    List<CompanyResponse> getAllCompanies();

    CompanyResponse getCompanyById(UUID id) throws CompanyNotFoundException;

    CompanyResponse createCompany(CompanyRequest request);

    CompanyResponse updateCompany(UUID companyId, CompanyRequest request) throws CompanyNotFoundException;

    void deleteCompany(UUID companyId) throws CompanyNotFoundException;
}
