package com.zaphirio.retailapi.shared.client;

import com.zaphirio.retailapi.media.image.service.CloudinaryService;
import com.zaphirio.retailapi.shared.exception.InvalidImageResponseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageServiceClient {

    private final CloudinaryService cloudinaryService;

    public String uploadImage(MultipartFile file, String entityName) {
        try {
            log.info("Uploading image for entity={} filename={}", entityName, file.getOriginalFilename());
            return cloudinaryService.uploadImage(file, entityName);
        } catch (Exception e) {
            log.error("Error uploading image", e);
            throw new InvalidImageResponseException("Failed to upload image");
        }
    }

    public String replaceImage(MultipartFile file, String entityName, String oldUrl) {
        try {
            log.info("Replacing image for entity={} oldUrl={}", entityName, oldUrl);
            String newUrl = cloudinaryService.uploadImage(file, entityName);

            deletePreviousImageSafely(oldUrl, entityName);

            return newUrl;
        } catch (Exception e) {
            log.error("Error replacing image", e);
            throw new InvalidImageResponseException("Failed to replace image");
        }
    }

    public void deleteImageByUrl(String url, String entityName) {
        try {
            log.info("Deleting image url={} entity={}", url, entityName);
            if (isCloudinaryUrl(url)) {
                cloudinaryService.deleteImageByUrl(url, entityName);
            }
        } catch (Exception e) {
            log.error("Error deleting image", e);
        }
    }

    private void deletePreviousImageSafely(String oldUrl, String entityName) {
        if (!isCloudinaryUrl(oldUrl)) {
            return;
        }

        try {
            cloudinaryService.deleteImageByUrl(oldUrl, entityName);
        } catch (Exception e) {
            // Do not fail update after successful upload if old image cleanup fails.
            log.warn("Could not delete previous cloudinary image for entity={} oldUrl={}", entityName, oldUrl, e);
        }
    }

    private boolean isCloudinaryUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }

        try {
            cloudinaryService.extractPublicId(url);
            return true;
        } catch (Exception _) {
            return false;
        }
    }
}