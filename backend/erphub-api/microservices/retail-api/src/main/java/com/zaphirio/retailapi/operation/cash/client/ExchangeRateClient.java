package com.zaphirio.retailapi.operation.cash.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;

@FeignClient(name = "exchange-sv", path = "/api/v1/exchange-rate")
public interface ExchangeRateClient {

    @GetMapping
    BigDecimal getExchangeRate(@RequestParam("from") String from, @RequestParam("to") String to);
}
