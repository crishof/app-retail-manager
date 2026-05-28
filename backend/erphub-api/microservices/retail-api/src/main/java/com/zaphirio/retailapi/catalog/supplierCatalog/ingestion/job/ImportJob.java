package com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.job;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tbl_import_job")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportJob {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private UUID supplierId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ImportStatus status;

    private int totalItems;
    private int processedItems;

    private int inserted;
    private int updated;
    private int failed;

    private Instant startedAt;
    private Instant finishedAt;

    @Column(length = 2000)
    private String error;

    @Column(nullable = false)
    private String filePath;

    /** Nombre original del archivo subido (para mostrar en historial). */
    @Column(length = 512)
    private String fileName;

    private boolean updateExisting;
}