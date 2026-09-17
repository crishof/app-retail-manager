package com.zaphirio.retailapi.catalog.product.dto;

public record ImageResponse(
        String filename,
        String entityName,
        String url
) {
}
