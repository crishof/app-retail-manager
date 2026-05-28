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

    private final ImageFeignClient imageFeignClient;

    public String uploadImage(MultipartFile file, String entityName) {
        ImageResponse response = imageFeignClient.uploadImage(file, entityName);
        validate(response);
        return response.url();
    }

    public String replaceImage(MultipartFile file, String entityName, String oldUrl) {
        ImageResponse response = imageFeignClient.replaceImage(file, entityName, oldUrl);
        validate(response);
        return response.url();
    }

    public void deleteImageByUrl(String url, String entityName) {
        imageFeignClient.deleteImage(url, entityName);
    }

    private void validate(ImageResponse response) {
        if (response == null || response.url() == null || response.url().isBlank()) {
            throw new InvalidImageResponseException("Image service returned empty response");
        }
    }
}