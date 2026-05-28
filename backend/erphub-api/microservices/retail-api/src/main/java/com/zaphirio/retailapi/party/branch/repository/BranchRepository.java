package com.zaphirio.retailapi.party.branch.repository;

import com.zaphirio.retailapi.party.branch.model.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BranchRepository extends JpaRepository<Branch, UUID> {

    Optional<Branch> findByNameIgnoreCase(String name);

    List<Branch> findByCompanyId(UUID companyId);
}
