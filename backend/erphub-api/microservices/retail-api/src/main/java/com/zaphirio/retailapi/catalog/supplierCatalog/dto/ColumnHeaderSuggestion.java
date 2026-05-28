package com.zaphirio.retailapi.catalog.supplierCatalog.dto;

/**
 * Represent a raw Excel column header along with its suggested system attribute
 * based on the known HEADER_ALIASES map. {@code suggestedAttribute} is null
 * when no known alias matched the header.
 */
public record ColumnHeaderSuggestion(String rawHeader, String suggestedAttribute) {
}
