package com.zaphirio.retailapi.operation.cash.repository;

import com.zaphirio.retailapi.operation.cash.model.CashMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CashMovementRepository extends JpaRepository<CashMovement, UUID> {

    List<CashMovement> findAllBySessionIdOrderByCreatedAtAsc(UUID sessionId);
}
