package com.zaphirio.retailapi.catalog.product.messagging.consumer;

import com.zaphirio.retailapi.catalog.product.config.RabbitMQConfig;
import com.zaphirio.retailapi.catalog.product.messagging.event.BrandUpdatedEvent;
import com.zaphirio.retailapi.catalog.product.service.ProductBrandProjectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BrandEventConsumer {

    private final ProductBrandProjectionService projectionService;

    @RabbitListener(queues = RabbitMQConfig.BRAND_UPDATED_QUEUE)
    public void onBrandUpdated(BrandUpdatedEvent event) {
      log.info("Received BrandUpdatedEvent: {}", event);
        projectionService.handleBrandUpdated(event);
    }
}