package com.crishof.branchsv.service;

import com.crishof.branchsv.dto.CompanyRequest;
import com.crishof.branchsv.dto.CompanyResponse;
import com.crishof.branchsv.exception.CompanyNotFoundException;

import java.util.List;
import java.util.UUID;

public interface CompanyService {

    List<CompanyResponse> getAllCompanies();

    CompanyResponse getCompanyById(UUID id) throws CompanyNotFoundException;

    CompanyResponse createCompany(CompanyRequest request);

    CompanyResponse updateCompany(UUID companyId, CompanyRequest request) throws CompanyNotFoundException;

    void deleteCompany(UUID companyId) throws CompanyNotFoundException;
}
