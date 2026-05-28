package com.zaphirio.retailapi.party.customer.dto;

import java.util.UUID;

public record CustomerMergeResponse(UUID sourceCustomerId, UUID targetCustomerId, long ordersReassigned) {
}
