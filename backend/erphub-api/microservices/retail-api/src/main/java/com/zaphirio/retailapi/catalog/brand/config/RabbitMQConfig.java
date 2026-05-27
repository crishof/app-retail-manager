package com.zaphirio.retailapi.catalog.brand.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String BRAND_EXCHANGE = "brand.exchange";
    public static final String BRAND_UPDATED_ROUTING_KEY = "brand.updated";

    @Bean
    public TopicExchange brandExchange() {
        return new TopicExchange(BRAND_EXCHANGE);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}