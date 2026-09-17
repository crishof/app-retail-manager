package com.zaphirio.retailapi.catalog.product.dto;

import java.util.UUID;

public record CategoryReplaceRequest(
        UUID from,
        UUID to
) {
}
