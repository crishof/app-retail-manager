package com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.job;

import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;

import java.util.List;
import java.util.UUID;

public interface ImportJobRepository extends TenantAwareRepository<ImportJob, UUID> {

    List<ImportJob> findTop50BySupplierId(UUID supplierId);

    List<ImportJob> findTop50ByOrderByStartedAtDesc();
}