package com.crishof.categorysv.client;


import com.crishof.categorysv.dto.ImageResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "image-sv", path = "/internal/images")
public interface ImageFeignClient {

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    ImageResponse uploadImage(
            @RequestPart("file") MultipartFile file,
            @RequestPart("entityName") String entityName
    );

    @PutMapping(
            value = "/replace",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    ImageResponse replaceImage(
            @RequestPart("file") MultipartFile file,
            @RequestPart("entityName") String entityName,
            @RequestPart("oldUrl") String oldUrl
    );

    @DeleteMapping("/delete")
    void deleteImage(
            @RequestParam("url") String url,
            @RequestParam("entityName") String entityName
    );
}