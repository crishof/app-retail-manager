package com.zaphirio.retailapi.catalog.supplierCatalog.dto;

import lombok.*;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ImportResult {

        private int total;
        private int imported;    // inserted + updated
        private int inserted;    // nuevos registros (para job tracking)
        private int updated;     // registros actualizados (para job tracking)
        private int skipped;
        private int failed;
        @Builder.Default
        private List<String> errors = List.of();
}