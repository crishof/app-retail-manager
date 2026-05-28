package com.zaphirio.retailapi.media.image.dto;

public record ImageResponse(
        String filename,
        String entityName,
        String url
) {
}