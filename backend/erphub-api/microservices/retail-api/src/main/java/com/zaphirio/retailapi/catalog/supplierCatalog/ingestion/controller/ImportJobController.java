package com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.controller;

import com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.dto.ImportJobResponse;
import com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.job.ImportJob;
import com.zaphirio.retailapi.catalog.supplierCatalog.ingestion.service.ImportJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/import-jobs")
@RequiredArgsConstructor
public class ImportJobController {

    private final ImportJobService service;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ImportJobResponse start(
            @RequestParam MultipartFile file,
            @RequestParam UUID supplierId,
            @RequestParam(defaultValue = "false") boolean updateExisting
    ) throws IOException {

        Path tempFile = Files.createTempFile("price-import-", ".xlsx");
        file.transferTo(tempFile.toFile());

        ImportJob job = service.startImport(
                supplierId,
                tempFile.toString(),
                file.getOriginalFilename(),
                updateExisting
        );

        return ImportJobResponse.from(job);
    }

    @GetMapping("/{jobId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ImportJobResponse status(@PathVariable UUID jobId) {
        return ImportJobResponse.from(service.getJob(jobId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public List<ImportJobResponse> list(
            @RequestParam(required = false) UUID supplierId
    ) {
        return service.listBySupplierId(supplierId).stream()
                .map(ImportJobResponse::from)
                .toList();
    }
}