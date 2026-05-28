package com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.job;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ImportJobRepository extends JpaRepository<ImportJob, UUID> {

    List<ImportJob> findTop50BySupplierId(UUID supplierId);

    List<ImportJob> findTop50ByOrderByStartedAtDesc();
}