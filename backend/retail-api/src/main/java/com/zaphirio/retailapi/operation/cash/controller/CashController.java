package com.zaphirio.retailapi.operation.cash.controller;

import com.zaphirio.retailapi.operation.cash.dto.*;
import com.zaphirio.retailapi.operation.cash.service.CashService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.CREATED)
    public CashSessionResponse openSession(@RequestBody OpenSessionRequest request) {
        return cashService.openSession(request);
    }

    @PutMapping("/sessions/{sessionId}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CashSessionResponse> closeSession(
            @PathVariable UUID sessionId,
            @RequestBody CloseSessionRequest request) {
        return ResponseEntity.ok(cashService.closeSession(sessionId, request));
    }

    @GetMapping("/sessions/current")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<CashSessionResponse> getCurrentSession(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(defaultValue = "false") boolean central) {
        if (!central && branchId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "branchId es obligatorio para caja de sucursal");
        }
        return ResponseEntity.ok(cashService.getCurrentSession(branchId, central));
    }

    @GetMapping("/sessions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<CashSessionResponse>> getAllSessions(
            @RequestParam(required = false) UUID branchId,
            @RequestParam(defaultValue = "false") boolean central) {
        if (!central && branchId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "branchId es obligatorio para caja de sucursal");
        }
        return ResponseEntity.ok(cashService.getAllSessions(branchId, central));
    }

    @GetMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<CashSessionResponse> getSessionById(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(cashService.getSessionById(sessionId));
    }

    // ---- Movements ----

    @PostMapping("/sessions/{sessionId}/movements")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.CREATED)
    public CashMovementResponse addMovement(
            @PathVariable UUID sessionId,
            @RequestBody CashMovementRequest request) {
        return cashService.addMovement(sessionId, request);
    }

    @GetMapping("/sessions/{sessionId}/movements")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<List<CashMovementResponse>> getMovements(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(cashService.getMovements(sessionId));
    }

    @GetMapping("/exchange-rates")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<Map<String, Double>> getExchangeRatesToArs() {
        return ResponseEntity.ok(cashService.getRatesToArs());
    }
}
