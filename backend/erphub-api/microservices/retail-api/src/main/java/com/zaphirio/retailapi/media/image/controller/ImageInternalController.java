package com.zaphirio.retailapi.media.image.controller;

import com.zaphirio.retailapi.media.image.dto.ImageResponse;
import com.zaphirio.retailapi.media.image.exception.InvalidImageUrlException;
import com.zaphirio.retailapi.media.image.service.CloudinaryService;
import com.zaphirio.retailapi.shared.exception.InvalidRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/internal/images")
@RequiredArgsConstructor
@Slf4j
public class ImageInternalController {

    private final CloudinaryService cloudinaryService;

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ImageResponse> uploadImage(@RequestParam MultipartFile file, @RequestParam String entityName) {
        validateFile(file);
        validateEntity(entityName);

        String url = cloudinaryService.uploadImage(file, entityName);

        log.info("Image uploaded successfully for entity '{}'", entityName);

        ImageResponse response = new ImageResponse(file.getOriginalFilename(), entityName, url);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/replace")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ImageResponse replaceImage(@RequestParam MultipartFile file, @RequestParam String entityName, @RequestParam String oldUrl) {
        validateFile(file);
        validateEntity(entityName);

        if (oldUrl == null || oldUrl.isBlank()) {
            throw new InvalidRequestException("oldUrl is required");
        }

        String newUrl = cloudinaryService.uploadImage(file, entityName);

        if (newUrl != null && !newUrl.isBlank()) {
            cloudinaryService.deleteImageByUrl(oldUrl, entityName);
            log.info("Image replaced successfully for entity '{}'", entityName);
            return new ImageResponse(file.getOriginalFilename(), entityName, newUrl);
        }

        throw new InvalidImageUrlException("Image upload failed, no URL returned");

    }

    @DeleteMapping("/delete")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteImage(@RequestParam("url") String url, @RequestParam("entityName") String entityName) {
        if (url == null || url.isBlank()) {
            throw new InvalidRequestException("URL is required");
        }
        if (entityName == null || entityName.isBlank()) {
            throw new InvalidRequestException("entityName is required");
        }
        cloudinaryService.deleteImageByUrl(url, entityName);
    }

    // -----------------------
    // Validations
    // -----------------------

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("File is missing or empty");
        }
    }

    private void validateEntity(String entityName) {
        if (entityName == null || entityName.isBlank()) {
            throw new InvalidRequestException("entityName is required");
        }
    }
}