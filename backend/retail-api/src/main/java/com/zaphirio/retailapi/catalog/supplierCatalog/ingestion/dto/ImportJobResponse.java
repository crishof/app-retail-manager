package com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.dto;

import com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.job.ImportJob;
import com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.job.ImportStatus;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

@Value
@Builder
public class ImportJobResponse {

    UUID id;
    UUID supplierId;
    ImportStatus status;

    int totalItems;
    int processedItems;
    int inserted;
    int updated;
    int failed;

    Instant startedAt;
    Instant finishedAt;
    String error;
    String fileName;

    public static ImportJobResponse from(ImportJob job) {
        return ImportJobResponse.builder()
                .id(job.getId())
                .supplierId(job.getSupplierId())
                .status(job.getStatus())
                .totalItems(job.getTotalItems())
                .processedItems(job.getProcessedItems())
                .inserted(job.getInserted())
                .updated(job.getUpdated())
                .failed(job.getFailed())
                .startedAt(job.getStartedAt())
                .finishedAt(job.getFinishedAt())
                .error(job.getError())
                .fileName(job.getFileName())
                .build();
    }
}