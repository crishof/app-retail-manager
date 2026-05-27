package com.zaphirio.retailapi.catalog.brand.dto;

import java.util.UUID;

public record BrandMergeResponse(
        UUID sourceBrandId,
        UUID targetBrandId,
        long productsReassigned
) {
}
