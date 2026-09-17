package com.zaphirio.retailapi.operation.cash.service;

import com.zaphirio.retailapi.operation.cash.dto.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface CashService {

    CashSessionResponse openSession(OpenSessionRequest request);

    CashSessionResponse closeSession(UUID sessionId, CloseSessionRequest request);

    CashSessionResponse getCurrentSession(UUID branchId, boolean central);

    List<CashSessionResponse> getAllSessions(UUID branchId, boolean central);

    CashSessionResponse getSessionById(UUID sessionId);

    CashMovementResponse addMovement(UUID sessionId, CashMovementRequest request);

    List<CashMovementResponse> getMovements(UUID sessionId);

    Map<String, Double> getRatesToArs();
}
