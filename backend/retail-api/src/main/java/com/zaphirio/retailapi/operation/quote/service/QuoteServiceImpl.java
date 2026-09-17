package com.zaphirio.retailapi.operation.quote.service;

import com.zaphirio.retailapi.operation.quote.dto.*;
import com.zaphirio.retailapi.operation.quote.mapper.QuoteMapper;
import com.zaphirio.retailapi.operation.quote.model.Quote;
import com.zaphirio.retailapi.operation.quote.model.QuoteItem;
import com.zaphirio.retailapi.operation.quote.repository.QuoteRepository;
import com.zaphirio.retailapi.operation.quote.repository.QuoteItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of QuoteService.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class QuoteServiceImpl implements QuoteService {

    private final QuoteRepository quoteRepository;
    private final QuoteItemRepository itemRepository;
    private final QuoteMapper mapper;

    @Override
    public QuoteResponse create(CreateQuoteRequest request, Long tenantId) {
        log.info("Creating quote for customer {} in branch {}", request.getCustomerId(), request.getBranchId());

        // Convert request to entity
        Quote quote = mapper.toEntity(request);
        quote.setTenantId(tenantId);
        quote.setStatus(Quote.QuoteStatus.DRAFT);

        // Generate quote number
        int currentYear = request.getCreationDate().getYear();
        quote.setNumber(generateNextQuoteNumber(currentYear, tenantId));

        // Add items
        if (request.getItems() != null) {
            for (CreateQuoteItemRequest itemRequest : request.getItems()) {
                QuoteItem item = mapper.itemToEntity(itemRequest);
                item.setQuote(quote);
                quote.getItems().add(item);
            }
        }

        // Recalculate total
        recalculateQuoteTotal(quote);

        // Save quote
        Quote saved = quoteRepository.save(quote);
        log.info("Created quote with ID: {}", saved.getId());

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public QuoteResponse getById(UUID id, Long tenantId) {
        log.debug("Fetching quote by ID: {}", id);
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found: " + id));
        return mapper.toResponse(quote);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuoteResponse> getAll(Long tenantId) {
        log.debug("Fetching all quotes");
        return quoteRepository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuoteResponse> getByCustomerId(UUID customerId, Long tenantId) {
        log.debug("Fetching quotes for customer: {}", customerId);
        return quoteRepository.findByCustomerId(customerId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuoteResponse> getByCustomerIdAndBranchId(UUID customerId, UUID branchId, Long tenantId) {
        log.debug("Fetching quotes for customer: {} in branch: {}", customerId, branchId);
        return quoteRepository.findByCustomerIdAndBranchId(customerId, branchId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuoteResponse> getByStatus(String status, Long tenantId) {
        log.debug("Fetching quotes by status: {}", status);
        try {
            Quote.QuoteStatus quoteStatus = Quote.QuoteStatus.valueOf(status);
            return quoteRepository.findByStatus(quoteStatus).stream()
                    .map(mapper::toResponse)
                    .toList();
        } catch (IllegalArgumentException e) {
            log.warn("Invalid quote status: {}", status);
            return List.of();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuoteResponse> getActive(Long tenantId) {
        log.debug("Fetching active quotes");
        List<Quote.QuoteStatus> activeStatuses = List.of(
                Quote.QuoteStatus.DRAFT,
                Quote.QuoteStatus.SENT,
                Quote.QuoteStatus.ACCEPTED
        );
        return quoteRepository.findByStatusIn(activeStatuses).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuoteResponse> getByDateRange(LocalDate startDate, LocalDate endDate, Long tenantId) {
        log.debug("Fetching quotes between {} and {}", startDate, endDate);
        return quoteRepository.findByCreationDateBetween(startDate, endDate).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuoteResponse> getExpiringQuotes(int daysUntilExpiration, Long tenantId) {
        log.debug("Fetching quotes expiring in {} days", daysUntilExpiration);
        LocalDate expirationThreshold = LocalDate.now().plusDays(daysUntilExpiration);
        List<Quote.QuoteStatus> validStatuses = List.of(
                Quote.QuoteStatus.DRAFT,
                Quote.QuoteStatus.SENT,
                Quote.QuoteStatus.ACCEPTED
        );
        return quoteRepository.findByExpirationDateLessThanAndStatusIn(expirationThreshold, validStatuses).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public QuoteResponse update(UUID id, UpdateQuoteRequest request, Long tenantId) {
        log.info("Updating quote: {}", id);

        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found: " + id));

        // Check if quote is editable (DRAFT or SENT only)
        if (quote.getStatus() != Quote.QuoteStatus.DRAFT && quote.getStatus() != Quote.QuoteStatus.SENT) {
            throw new RuntimeException("Cannot update quote in status: " + quote.getStatus());
        }

        mapper.updateEntity(quote, request);

        // Update items if provided
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            // Delete old items
            itemRepository.deleteByQuoteId(id);
            quote.getItems().clear();

            // Add new items
            for (UpdateQuoteItemRequest itemRequest : request.getItems()) {
                QuoteItem item = new QuoteItem();
                mapper.updateItem(item, itemRequest);
                item.setQuote(quote);
                quote.getItems().add(item);
            }
        }

        // Recalculate total
        recalculateQuoteTotal(quote);

        Quote updated = quoteRepository.save(quote);
        log.info("Updated quote: {}", id);

        return mapper.toResponse(updated);
    }

    @Override
    public QuoteResponse sendQuote(UUID id, Long tenantId) {
        log.info("Sending quote: {}", id);

        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found: " + id));

        if (quote.getStatus() != Quote.QuoteStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT quotes can be sent");
        }

        quote.setStatus(Quote.QuoteStatus.SENT);
        Quote updated = quoteRepository.save(quote);

        log.info("Sent quote: {}", id);
        return mapper.toResponse(updated);
    }

    @Override
    public QuoteResponse acceptQuote(UUID id, Long tenantId) {
        log.info("Accepting quote: {}", id);

        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found: " + id));

        if (!quote.getStatus().isValid()) {
            throw new RuntimeException("Quote cannot be accepted in status: " + quote.getStatus());
        }

        if (quote.isExpired()) {
            quote.setStatus(Quote.QuoteStatus.EXPIRED);
            quoteRepository.save(quote);
            throw new RuntimeException("Quote has expired and cannot be accepted");
        }

        quote.setStatus(Quote.QuoteStatus.ACCEPTED);
        Quote updated = quoteRepository.save(quote);

        log.info("Accepted quote: {}", id);
        return mapper.toResponse(updated);
    }

    @Override
    public QuoteResponse rejectQuote(UUID id, Long tenantId) {
        log.info("Rejecting quote: {}", id);

        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found: " + id));

        if (!quote.getStatus().isValid()) {
            throw new RuntimeException("Quote cannot be rejected in status: " + quote.getStatus());
        }

        quote.setStatus(Quote.QuoteStatus.REJECTED);
        Quote updated = quoteRepository.save(quote);

        log.info("Rejected quote: {}", id);
        return mapper.toResponse(updated);
    }

    @Override
    public QuoteResponse convertToSale(UUID id, UUID saleId, Long tenantId) {
        log.info("Converting quote {} to sale {}", id, saleId);

        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found: " + id));

        if (quote.getStatus() != Quote.QuoteStatus.ACCEPTED) {
            throw new RuntimeException("Only ACCEPTED quotes can be converted to sales");
        }

        quote.convertToSale(saleId);
        Quote updated = quoteRepository.save(quote);

        log.info("Converted quote {} to sale {}", id, saleId);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(UUID id, Long tenantId) {
        log.info("Deleting quote: {}", id);

        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found: " + id));

        if (quote.getStatus() == Quote.QuoteStatus.CONVERTED_TO_SALE) {
            throw new RuntimeException("Cannot delete quote that has been converted to sale");
        }

        // Delete items first
        itemRepository.deleteByQuoteId(id);

        // Delete quote
        quoteRepository.delete(quote);
        log.info("Deleted quote: {}", id);
    }

    @Override
    public String generateNextQuoteNumber(int year, Long tenantId) {
        log.debug("Generating next quote number for year {}", year);

        LocalDate yearStart = LocalDate.of(year, 1, 1);
        LocalDate yearEnd = LocalDate.of(year, 12, 31);

        List<Quote> quotesByYear = quoteRepository.findByCreationDateBetween(yearStart, yearEnd);
        int nextSequence = quotesByYear.size() + 1;

        String quoteNumber = String.format("Q%03d/%d", nextSequence, year);
        log.debug("Generated quote number: {}", quoteNumber);

        return quoteNumber;
    }

    /**
     * Recalculate the total price of a quote based on its items.
     */
    private void recalculateQuoteTotal(Quote quote) {
        double total = quote.getItems().stream()
                .mapToDouble(QuoteItem::getLineTotalWithTax)
                .sum();
        quote.setTotalPrice(total);
    }
}
