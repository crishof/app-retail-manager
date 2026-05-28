package com.zaphirio.retailapi.catalog.product.client;

import com.zaphirio.retailapi.catalog.product.dto.ImageResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "image-sv", path = "/internal/images")
public interface ImageClient {

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ImageResponse upload(@RequestPart("file") MultipartFile file, @RequestPart("entityName") String entityName);

    @PutMapping(value = "/replace", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ImageResponse replace(@RequestPart("file") MultipartFile file, @RequestPart("entityName") String entityName, @RequestPart("oldUrl") String oldUrl);

    @DeleteMapping("/delete")
    void delete(@RequestParam String url, @RequestParam("entityName") String entityName);
}