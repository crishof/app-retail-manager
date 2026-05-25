package com.crishof.branchsv.service;

import com.crishof.branchsv.dto.CompanyRequest;
import com.crishof.branchsv.dto.CompanyResponse;
import com.crishof.branchsv.exception.CompanyNotFoundException;
import com.crishof.branchsv.exception.DuplicateNameException;
import com.crishof.branchsv.model.Company;
import com.crishof.branchsv.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyServiceImpl implements CompanyService {

    private final CompanyRepository companyRepository;

    @Override
    public List<CompanyResponse> getAllCompanies() {
        return companyRepository.findAll().stream().map(this::toCompanyResponse).toList();
    }

    @Override
    public CompanyResponse getCompanyById(UUID id) throws CompanyNotFoundException {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new CompanyNotFoundException(id));
        return toCompanyResponse(company);
    }

    @Override
    public CompanyResponse createCompany(CompanyRequest request) {
        if (companyRepository.findByNameIgnoreCase(request.getName()).isPresent()) {
            throw new DuplicateNameException("Company with name '" + request.getName() + "' already exists");
        }

        if (companyRepository.findByCuit(request.getCuit()).isPresent()) {
            throw new DuplicateNameException("Company with CUIT '" + request.getCuit() + "' already exists");
        }

        Company company = Company.builder()
                .name(request.getName())
                .cuit(request.getCuit())
            .ivaStatus(request.getIvaStatus())
            .startOfActivities(request.getStartOfActivities())
            .grossIncomeNumber(request.getGrossIncomeNumber())
                .legalName(request.getLegalName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .website(request.getWebsite())
                .active(request.isActive())
                .build();

        return toCompanyResponse(companyRepository.save(company));
    }

    @Override
    public CompanyResponse updateCompany(UUID companyId, CompanyRequest request) throws CompanyNotFoundException {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException(companyId));

        companyRepository.findByNameIgnoreCase(request.getName())
            .filter(existing -> !existing.getId().equals(companyId))
            .ifPresent(existing -> {
                throw new DuplicateNameException("Company with name '" + request.getName() + "' already exists");
            });

        companyRepository.findByCuit(request.getCuit())
            .filter(existing -> !existing.getId().equals(companyId))
            .ifPresent(existing -> {
                throw new DuplicateNameException("Company with CUIT '" + request.getCuit() + "' already exists");
            });

        company.setName(request.getName());
        company.setCuit(request.getCuit());
        company.setIvaStatus(request.getIvaStatus());
        company.setStartOfActivities(request.getStartOfActivities());
        company.setGrossIncomeNumber(request.getGrossIncomeNumber());
        company.setLegalName(request.getLegalName());
        company.setEmail(request.getEmail());
        company.setPhone(request.getPhone());
        company.setWebsite(request.getWebsite());
        company.setActive(request.isActive());

        return toCompanyResponse(companyRepository.save(company));
    }

    @Override
    public void deleteCompany(UUID companyId) throws CompanyNotFoundException {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException(companyId));
        companyRepository.delete(company);
    }

    // ── Mappers ────────────────────────────────────────────────────────────

    private CompanyResponse toCompanyResponse(Company company) {
        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .cuit(company.getCuit())
                .ivaStatus(company.getIvaStatus())
                .startOfActivities(company.getStartOfActivities())
                .grossIncomeNumber(company.getGrossIncomeNumber())
                .legalName(company.getLegalName())
                .email(company.getEmail())
                .phone(company.getPhone())
                .website(company.getWebsite())
                .active(company.isActive())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .build();
    }
}
