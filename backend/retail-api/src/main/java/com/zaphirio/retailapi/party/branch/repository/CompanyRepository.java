package com.zaphirio.retailapi.party.branch.repository;

import com.zaphirio.retailapi.party.branch.model.Company;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyRepository extends TenantAwareRepository<Company, UUID> {

    Optional<Company> findByNameIgnoreCase(String name);

    Optional<Company> findByCuit(String cuit);
}
