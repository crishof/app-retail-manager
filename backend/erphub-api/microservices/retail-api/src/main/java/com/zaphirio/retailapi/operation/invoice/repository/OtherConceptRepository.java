package com.zaphirio.retailapi.operation.invoice.repository;

import com.zaphirio.retailapi.operation.invoice.model.OtherConcept;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OtherConceptRepository extends JpaRepository<OtherConcept, UUID> {
}
