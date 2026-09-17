package com.zaphirio.retailapi.media.image.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.FileNotFoundException;

public interface CloudinaryService {
    String uploadImage(MultipartFile file, String entityName);

    void deleteImageByUrl(String imageUrl, String entityName);

    String extractPublicId(String imageUrl) throws FileNotFoundException;
}
