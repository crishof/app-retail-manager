package com.zaphirio.retailapi.party.branch.repository;

import com.zaphirio.retailapi.party.branch.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {

    Optional<Company> findByNameIgnoreCase(String name);

    Optional<Company> findByCuit(String cuit);
}
