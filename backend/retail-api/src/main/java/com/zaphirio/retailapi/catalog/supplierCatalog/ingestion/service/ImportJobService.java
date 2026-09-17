package com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.service;

import com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.job.ImportJob;
import com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.job.ImportJobRepository;
import com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.job.ImportStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportJobService {

    private final ImportJobRepository repository;
    private final PriceItemAsyncImporter asyncImporter;

    public ImportJob startImport(
            UUID supplierId,
            String filePath,
            String fileName,
            boolean updateExisting
    ) {

        ImportJob job = ImportJob.builder()
                .supplierId(supplierId)
                .filePath(filePath)
                .fileName(fileName)
                .updateExisting(updateExisting)
                .status(ImportStatus.PENDING)
                .startedAt(Instant.now())
                .build();

        job = repository.saveAndFlush(job);

        log.info("Import job created | jobId={} | supplierId={} | file={}", job.getId(), supplierId, fileName);

        asyncImporter.runImport(job.getId());

        return job;
    }

    public ImportJob getJob(UUID jobId) {
        return repository.findById(jobId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Import job not found: " + jobId)
                );
    }

    public List<ImportJob> listBySupplierId(UUID supplierId) {
        if (supplierId != null) {
            return repository.findTop50BySupplierId(supplierId);
        }
        return repository.findTop50ByOrderByStartedAtDesc();
    }
}