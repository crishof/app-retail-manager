package com.zaphirio.retailapi.operation.cash.repository;

import com.zaphirio.retailapi.operation.cash.model.CashMovement;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;

import java.util.List;
import java.util.UUID;

public interface CashMovementRepository extends TenantAwareRepository<CashMovement, UUID> {

    List<CashMovement> findAllBySessionIdOrderByCreatedAtAsc(UUID sessionId);
}
