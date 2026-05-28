package com.zaphirio.retailapi.catalog.product.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String BRAND_EXCHANGE = "brand.exchange";
    public static final String BRAND_UPDATED_QUEUE = "product.brand.updated.queue";
    public static final String BRAND_UPDATED_ROUTING_KEY = "brand.updated";

    @Bean
    public TopicExchange brandExchange() {
        return new TopicExchange(BRAND_EXCHANGE);
    }

    @Bean
    public Queue brandUpdatedQueue() {
        return new Queue(BRAND_UPDATED_QUEUE, true);
    }

    @Bean
    public Binding brandUpdatedBinding(Queue brandUpdatedQueue, TopicExchange brandExchange) {
        return BindingBuilder.bind(brandUpdatedQueue).to(brandExchange).with(BRAND_UPDATED_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter);
        return factory;
    }
}