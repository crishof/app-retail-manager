package com.zaphirio.retailapi.media.image.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
@RequiredArgsConstructor
public class CloudinaryConfig {
    private final Environment environment;

    @Bean
    public Cloudinary cloudinaryBean() {
        return new Cloudinary(ObjectUtils.asMap("cloud_name",
                environment.getProperty("CLOUDINARY_CLOUD_NAME"), "api_secret",
                environment.getProperty("CLOUDINARY_API_SECRET"), "api_key",
                environment.getProperty("CLOUDINARY_API_KEY")));
    }
}
