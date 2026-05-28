package com.zaphirio.retailapi.operation.cash.controller;

import com.zaphirio.retailapi.operation.cash.dto.*;
import com.zaphirio.retailapi.operation.cash.service.CashService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cash")
@RequiredArgsConstructor
public class CashController {

    private final CashService cashService;

    // ---- Sessions ----

    @PostMapping("/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public CashSessionResponse openSession(@RequestBody OpenSessionRequest request) {
        return cashService.openSession(request);
    }

    @PutMapping("/sessions/{sessionId}/close")
    public ResponseEntity<CashSessionResponse> closeSession(
            @PathVariable UUID sessionId,
            @RequestBody CloseSessionRequest request) {
        return ResponseEntity.ok(cashService.closeSession(sessionId, request));
    }

    @GetMapping("/sessions/current")
    public ResponseEntity<CashSessionResponse> getCurrentSession(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(defaultValue = "false") boolean central) {
        if (!central && branchId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "branchId es obligatorio para caja de sucursal");
        }
        return ResponseEntity.ok(cashService.getCurrentSession(branchId, central));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<CashSessionResponse>> getAllSessions(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(defaultValue = "false") boolean central) {
        if (!central && branchId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "branchId es obligatorio para caja de sucursal");
        }
        return ResponseEntity.ok(cashService.getAllSessions(branchId, central));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<CashSessionResponse> getSessionById(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(cashService.getSessionById(sessionId));
    }

    // ---- Movements ----

    @PostMapping("/sessions/{sessionId}/movements")
    @ResponseStatus(HttpStatus.CREATED)
    public CashMovementResponse addMovement(
            @PathVariable UUID sessionId,
            @RequestBody CashMovementRequest request) {
        return cashService.addMovement(sessionId, request);
    }

    @GetMapping("/sessions/{sessionId}/movements")
    public ResponseEntity<List<CashMovementResponse>> getMovements(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(cashService.getMovements(sessionId));
    }

    @GetMapping("/exchange-rates")
    public ResponseEntity<Map<String, Double>> getExchangeRatesToArs() {
        return ResponseEntity.ok(cashService.getRatesToArs());
    }
}
