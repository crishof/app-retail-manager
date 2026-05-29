package com.zaphirio.retailapi.shared.client;

import com.zaphirio.retailapi.catalog.brand.dto.ImageResponse;
import com.zaphirio.retailapi.shared.exception.InvalidImageResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageServiceClient {

    // TODO: Integrate with image-sv or Cloudinary when available
    private static final String PLACEHOLDER_URL = "https://via.placeholder.com/300";

    public String uploadImage(MultipartFile file, String entityName) {
        try {
            log.info("Uploading image for entity={} filename={}", entityName, file.getOriginalFilename());
            // TODO: Implement actual image upload to image-sv or Cloudinary
            return PLACEHOLDER_URL;
        } catch (Exception e) {
            log.error("Error uploading image", e);
            throw new InvalidImageResponseException("Failed to upload image");
        }
    }

    public String replaceImage(MultipartFile file, String entityName, String oldUrl) {
        try {
            log.info("Replacing image for entity={} oldUrl={}", entityName, oldUrl);
            // TODO: Implement actual image replacement
            return PLACEHOLDER_URL;
        } catch (Exception e) {
            log.error("Error replacing image", e);
            throw new InvalidImageResponseException("Failed to replace image");
        }
    }

    public void deleteImageByUrl(String url, String entityName) {
        try {
            log.info("Deleting image url={} entity={}", url, entityName);
            // TODO: Implement actual image deletion
        } catch (Exception e) {
            log.error("Error deleting image", e);
        }
    }
}