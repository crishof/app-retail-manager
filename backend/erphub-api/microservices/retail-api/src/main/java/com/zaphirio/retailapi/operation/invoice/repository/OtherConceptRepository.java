package com.zaphirio.retailapi.operation.invoice.repository;

import com.zaphirio.retailapi.operation.invoice.model.OtherConcept;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OtherConceptRepository extends TenantAwareRepository<OtherConcept, UUID> {
}
