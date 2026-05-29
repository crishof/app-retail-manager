package com.zaphirio.retailapi.operation.cash.repository;

import com.zaphirio.retailapi.operation.cash.model.CashSession;
import com.zaphirio.retailapi.operation.cash.model.SessionStatus;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CashSessionRepository extends TenantAwareRepository<CashSession, UUID> {

    Optional<CashSession> findFirstByBranchIdAndStatusOrderByOpenedAtDesc(UUID branchId, SessionStatus status);

    Optional<CashSession> findFirstByBranchIdIsNullAndStatusOrderByOpenedAtDesc(SessionStatus status);

    List<CashSession> findAllByBranchIdOrderByOpenedAtDesc(UUID branchId);

    List<CashSession> findAllByBranchIdIsNullOrderByOpenedAtDesc();
}
