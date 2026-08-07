package com.zaphirio.retailapi.catalog.brand.messagging.publisher;

import com.zaphirio.retailapi.shared.config.RabbitMQConfig;
import com.zaphirio.retailapi.catalog.brand.messagging.event.BrandUpdatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "rabbitmq.event-sync", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class BrandEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishBrandUpdated(BrandUpdatedEvent event) {

        log.info("Publishing brand-updated event: {}", event);
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.BRAND_EXCHANGE,
                RabbitMQConfig.BRAND_UPDATED_ROUTING_KEY,
                event);
    }
}