package com.zaphirio.retailapi.operation.cash.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaphirio.retailapi.operation.cash.client.ExchangeRateClient;
import com.zaphirio.retailapi.operation.cash.dto.*;
import com.zaphirio.retailapi.operation.cash.model.*;
import com.zaphirio.retailapi.operation.cash.repository.CashMovementRepository;
import com.zaphirio.retailapi.operation.cash.repository.CashSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class CashServiceImpl implements CashService {

        private static final String SESSION_NOT_FOUND = "Sesión no encontrada: ";
        private static final String BASE_CURRENCY = "ARS";
        private static final TypeReference<Map<String, Double>> MAP_TYPE = new TypeReference<>() {};
        private static final Map<String, Double> FALLBACK_RATES_TO_ARS = Map.of(
                        "ARS", 1d,
                        "USD", 1100d,
                        "EUR", 1200d
        );

    private final CashSessionRepository sessionRepository;
    private final CashMovementRepository movementRepository;
        private final ObjectMapper objectMapper;
        private final ExchangeRateClient exchangeRateClient;

    @Override
    public CashSessionResponse openSession(OpenSessionRequest request) {
        if (request.getBranchId() == null) {
            sessionRepository.findFirstByBranchIdIsNullAndStatusOrderByOpenedAtDesc(SessionStatus.OPEN)
                    .ifPresent(s -> {
                        throw new IllegalStateException("Ya existe una sesión abierta para la caja central");
                    });
        } else {
            sessionRepository.findFirstByBranchIdAndStatusOrderByOpenedAtDesc(request.getBranchId(), SessionStatus.OPEN)
                    .ifPresent(s -> {
                        throw new IllegalStateException("Ya existe una sesión abierta para la sucursal indicada");
                    });
        }

        CashSession session = CashSession.builder()
                .branchId(request.getBranchId())
                .userId(request.getUserId())
                .sessionDate(LocalDate.now())
                .openedAt(LocalDateTime.now())
                .openingBalance(request.getOpeningBalance())
                .closingBalance(0)
                .status(SessionStatus.OPEN)
                .notes(request.getNotes())
                .build();

        session = sessionRepository.save(session);

        // Opening movement
        CashMovement openingMovement = CashMovement.builder()
                .sessionId(session.getId())
                .branchId(session.getBranchId())
                .type(MovementType.OPENING)
                .currency(BASE_CURRENCY)
                .originalAmount(request.getOpeningBalance())
                .exchangeRateToArs(1d)
                .amount(request.getOpeningBalance())
                .description(session.getBranchId() == null ? "Apertura de caja central" : "Apertura de caja")
                .createdAt(LocalDateTime.now())
                .build();
        movementRepository.save(openingMovement);

        return toSessionResponse(session);
    }

    @Override
    public CashSessionResponse closeSession(UUID sessionId, CloseSessionRequest request) {
        CashSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException(SESSION_NOT_FOUND + sessionId));

        double closingBalanceArs = calculateClosingBalanceArs(request);

        session.setClosedAt(LocalDateTime.now());
        session.setClosingBalance(closingBalanceArs);
        session.setStatus(SessionStatus.CLOSED);
        if (request.getCountedTotalsByCurrency() != null && !request.getCountedTotalsByCurrency().isEmpty()) {
            session.setCountedTotalsByCurrencyJson(writeJson(request.getCountedTotalsByCurrency()));
        }
        if (request.getExchangeRatesToArs() != null && !request.getExchangeRatesToArs().isEmpty()) {
            session.setExchangeRatesToArsJson(writeJson(request.getExchangeRatesToArs()));
        }
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            session.setNotes(request.getNotes());
        }

        session = sessionRepository.save(session);

        // Closing movement
        CashMovement closingMovement = CashMovement.builder()
                .sessionId(session.getId())
                .branchId(session.getBranchId())
                .type(MovementType.CLOSING)
                .currency(BASE_CURRENCY)
                .originalAmount(closingBalanceArs)
                .exchangeRateToArs(1d)
                .amount(closingBalanceArs)
                .description("Cierre de caja")
                .createdAt(LocalDateTime.now())
                .build();
        movementRepository.save(closingMovement);

        return toSessionResponse(session);
    }

    @Override
        public CashSessionResponse getCurrentSession(UUID branchId, boolean central) {
                CashSession session;
                if (central) {
                        session = sessionRepository
                                        .findFirstByBranchIdIsNullAndStatusOrderByOpenedAtDesc(SessionStatus.OPEN)
                                        .orElseThrow(() -> new NoSuchElementException("No hay sesión abierta para la caja central"));
                } else {
                        session = sessionRepository
                                        .findFirstByBranchIdAndStatusOrderByOpenedAtDesc(branchId, SessionStatus.OPEN)
                                        .orElseThrow(() -> new NoSuchElementException("No hay sesión abierta para la sucursal: " + branchId));
                }
        return toSessionResponse(session);
    }

    @Override
        public List<CashSessionResponse> getAllSessions(UUID branchId, boolean central) {
                List<CashSession> sessions = central
                                ? sessionRepository.findAllByBranchIdIsNullOrderByOpenedAtDesc()
                                : sessionRepository.findAllByBranchIdOrderByOpenedAtDesc(branchId);

                return sessions
                .stream()
                .map(this::toSessionResponse)
                .toList();
    }

    @Override
    public CashSessionResponse getSessionById(UUID sessionId) {
        CashSession session = sessionRepository.findById(sessionId)
                                .orElseThrow(() -> new NoSuchElementException(SESSION_NOT_FOUND + sessionId));
        return toSessionResponse(session);
    }

    @Override
    public CashMovementResponse addMovement(UUID sessionId, CashMovementRequest request) {
        CashSession session = sessionRepository.findById(sessionId)
                                .orElseThrow(() -> new NoSuchElementException(SESSION_NOT_FOUND + sessionId));

        if (session.getStatus() == SessionStatus.CLOSED) {
            throw new IllegalStateException("No se puede agregar movimientos a una sesión cerrada");
        }

        String currency = request.getCurrency() == null || request.getCurrency().isBlank()
                ? BASE_CURRENCY
                : request.getCurrency().toUpperCase();

        double exchangeRateToArs = resolveMovementRateToArs(currency, request.getExchangeRateToArs());

        if (exchangeRateToArs <= 0) {
            throw new IllegalArgumentException("La cotización a ARS debe ser mayor que 0");
        }

        double originalAmount = request.getAmount();
        double amountInArs = originalAmount * exchangeRateToArs;

        CashMovement movement = CashMovement.builder()
                .sessionId(sessionId)
                .branchId(session.getBranchId())
                .type(MovementType.valueOf(request.getType()))
                .currency(currency)
                .originalAmount(originalAmount)
                .exchangeRateToArs(exchangeRateToArs)
                .amount(amountInArs)
                .description(request.getDescription())
                .reference(request.getReference())
                .createdAt(LocalDateTime.now())
                .build();

        movement = movementRepository.save(movement);
        return toMovementResponse(movement);
    }

        @Override
        public Map<String, Double> getRatesToArs() {
                Map<String, Double> rates = new HashMap<>();
                rates.put("ARS", 1d);
                rates.put("USD", fetchRateFromExchangeOrFallback("USD"));
                rates.put("EUR", fetchRateFromExchangeOrFallback("EUR"));
                return rates;
        }

    @Override
    public List<CashMovementResponse> getMovements(UUID sessionId) {
        return movementRepository.findAllBySessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(this::toMovementResponse)
                .toList();
    }

    // ---- Mappers ----

    private CashSessionResponse toSessionResponse(CashSession session) {
        List<CashMovement> movements = movementRepository.findAllBySessionIdOrderByCreatedAtAsc(session.getId());

        double totalIncome = movements.stream()
                .filter(m -> m.getType() == MovementType.INCOME
                        || m.getType() == MovementType.SALE
                        || m.getType() == MovementType.CUSTOMER_PAYMENT)
                .mapToDouble(CashMovement::getAmount)
                .sum();

        double totalExpense = movements.stream()
                .filter(m -> m.getType() == MovementType.EXPENSE
                        || m.getType() == MovementType.SUPPLIER_PAYMENT)
                .mapToDouble(CashMovement::getAmount)
                .sum();

        double expectedBalance = session.getOpeningBalance() + totalIncome - totalExpense;

        return CashSessionResponse.builder()
                .id(session.getId())
                .branchId(session.getBranchId())
                .userId(session.getUserId())
                .sessionDate(session.getSessionDate())
                .openedAt(session.getOpenedAt())
                .closedAt(session.getClosedAt())
                .openingBalance(session.getOpeningBalance())
                .closingBalance(session.getClosingBalance())
                .status(session.getStatus())
                .notes(session.getNotes())
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .expectedBalance(expectedBalance)
                .countedTotalsByCurrency(readJsonMap(session.getCountedTotalsByCurrencyJson()))
                .exchangeRatesToArs(readJsonMap(session.getExchangeRatesToArsJson()))
                .build();
    }

    private CashMovementResponse toMovementResponse(CashMovement m) {
        return CashMovementResponse.builder()
                .id(m.getId())
                .sessionId(m.getSessionId())
                .type(m.getType())
                .amount(m.getAmount())
                                .currency(m.getCurrency() == null || m.getCurrency().isBlank() ? BASE_CURRENCY : m.getCurrency())
                                .originalAmount(m.getOriginalAmount() == 0d ? m.getAmount() : m.getOriginalAmount())
                                .exchangeRateToArs(m.getExchangeRateToArs() <= 0d ? 1d : m.getExchangeRateToArs())
                .description(m.getDescription())
                .reference(m.getReference())
                .createdAt(m.getCreatedAt())
                .build();
    }

        private double calculateClosingBalanceArs(CloseSessionRequest request) {
                Map<String, Double> countedTotals = request.getCountedTotalsByCurrency();
                if (countedTotals == null || countedTotals.isEmpty()) {
                        return request.getClosingBalance();
                }

                Map<String, Double> exchangeRates = new HashMap<>(getRatesToArs());
                if (request.getExchangeRatesToArs() != null && !request.getExchangeRatesToArs().isEmpty()) {
                        exchangeRates.putAll(normalizeUppercaseMap(request.getExchangeRatesToArs()));
                }

                double totalArs = 0d;
                for (Map.Entry<String, Double> entry : countedTotals.entrySet()) {
                        String currency = entry.getKey() == null ? BASE_CURRENCY : entry.getKey().toUpperCase();
                        double subtotal = entry.getValue() == null ? 0d : entry.getValue();

                        if (BASE_CURRENCY.equals(currency)) {
                                totalArs += subtotal;
                                continue;
                        }

                        double rate = exchangeRates.getOrDefault(currency, FALLBACK_RATES_TO_ARS.getOrDefault(currency, 0d));
                        if (rate <= 0) {
                                throw new IllegalArgumentException("Falta cotización válida para la moneda " + currency);
                        }
                        totalArs += subtotal * rate;
                }

                return totalArs;
        }

        private double resolveMovementRateToArs(String currency, double requestRate) {
                if (BASE_CURRENCY.equals(currency)) {
                        return 1d;
                }
                if (requestRate > 0) {
                        return requestRate;
                }
                return fetchRateFromExchangeOrFallback(currency);
        }

        private double fetchRateFromExchangeOrFallback(String currency) {
                try {
                        var response = exchangeRateClient.getExchangeRate(BASE_CURRENCY, currency);
                        if (response != null && response.doubleValue() > 0d) {
                                return response.doubleValue();
                        }
                } catch (Exception ex) {
                        log.warn("No se pudo obtener cotización {}->{} desde exchange-sv. Se usa fallback.", BASE_CURRENCY, currency);
                }
                return FALLBACK_RATES_TO_ARS.getOrDefault(currency, 1d);
        }

        private String writeJson(Map<String, Double> data) {
                try {
                        return objectMapper.writeValueAsString(normalizeUppercaseMap(data));
                } catch (Exception ex) {
                        throw new IllegalStateException("No se pudo serializar la información de arqueo", ex);
                }
        }

        private Map<String, Double> readJsonMap(String json) {
                if (json == null || json.isBlank()) {
                        return Collections.emptyMap();
                }

                try {
                        return objectMapper.readValue(json, MAP_TYPE);
                } catch (Exception ex) {
                        return Collections.emptyMap();
                }
        }

        private Map<String, Double> normalizeUppercaseMap(Map<String, Double> source) {
                Map<String, Double> normalized = new HashMap<>();
                for (Map.Entry<String, Double> entry : source.entrySet()) {
                        if (entry.getKey() == null || entry.getKey().isBlank()) {
                                continue;
                        }
                        normalized.put(entry.getKey().toUpperCase(), entry.getValue() == null ? 0d : entry.getValue());
                }
                return normalized;
        }
}
