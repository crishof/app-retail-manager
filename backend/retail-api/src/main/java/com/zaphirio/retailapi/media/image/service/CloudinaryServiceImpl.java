package com.zaphirio.retailapi.media.image.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.zaphirio.retailapi.media.image.exception.FileDeletionException;
import com.zaphirio.retailapi.media.image.exception.FileUploadException;
import com.zaphirio.retailapi.media.image.exception.InvalidImageUrlException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryServiceImpl implements CloudinaryService {

    private final Cloudinary cloudinary;

    private static @NonNull String getPublicId(URI uri) {
        String path = uri.getPath(); // /image/upload/v123/folder/file.jpg

        int lastDot = path.lastIndexOf('.');
        if (lastDot == -1) {
            throw new InvalidImageUrlException("Invalid Cloudinary image URL");
        }

        String withoutExtension = path.substring(0, lastDot);

        int uploadIndex = withoutExtension.indexOf("/upload/");
        if (uploadIndex == -1) {
            throw new InvalidImageUrlException("Invalid Cloudinary upload URL format");
        }

        return withoutExtension.substring(uploadIndex + "/upload/".length());
    }

    @Override
    public String uploadImage(MultipartFile file, String entityName) {
        try {

            Map<String, Object> options = getOptions(entityName);

            Map<String, Object> uploadResult = uploadInternal(file.getBytes(), options);

            String url = (String) uploadResult.get("secure_url");

            if (url == null || url.isBlank()) {
                throw new FileUploadException("Cloudinary did not return a valid image URL");
            }

            log.info("Image uploaded successfully | entity={}", entityName);
            return url;

        } catch (IOException e) {
            log.error("Error uploading image | entity={}", entityName, e);
            throw new FileUploadException("Failed to upload image to Cloudinary", e);
        }
    }

    @Override
    public void deleteImageByUrl(String imageUrl, String entityName) {
        try {
            String publicId = extractPublicId(imageUrl);

            Map<String, Object> result = destroyInternal(publicId);

            String status = (String) result.get("result");

            if (!"ok".equalsIgnoreCase(status)) {
                throw new FileDeletionException(
                        "Cloudinary deletion failed with status: " + status
                );
            }

            log.info("Image deleted successfully | publicId={}", publicId);

        } catch (InvalidImageUrlException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting image | url={}", imageUrl, e);
            throw new FileDeletionException("Failed to delete image from Cloudinary", e);
        }
    }

    // =============================================
    // EXTRAER PUBLIC ID
    // =============================================
    @Override
    public String extractPublicId(String imageUrl) {
        try {
            URI uri = URI.create(imageUrl);
            String publicId = getPublicId(uri);

            // Eliminar versión (v12345)
            if (publicId.startsWith("v")) {
                publicId = publicId.substring(publicId.indexOf('/') + 1);
            }

            return publicId;

        } catch (Exception e) {
            log.error("Failed to extract publicId from URL: {}", imageUrl, e);
            throw new InvalidImageUrlException("Could not extract publicId from image URL");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getOptions(String entityName) {
        return ObjectUtils.asMap(
                "folder", entityName,
                "resource_type", "image"
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> uploadInternal(byte[] bytes, Map<String, Object> options)
            throws IOException {

        return cloudinary.uploader().upload(bytes, options);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> destroyInternal(String publicId)
            throws IOException {

        return cloudinary.uploader()
                .destroy(publicId, ObjectUtils.emptyMap());
    }
}