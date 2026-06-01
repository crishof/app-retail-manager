package com.zaphirio.retailapi.operation.quote.service;

import com.zaphirio.retailapi.operation.quote.dto.*;
import com.zaphirio.retailapi.operation.quote.mapper.QuoteMapper;
import com.zaphirio.retailapi.operation.quote.model.Quote;
import com.zaphirio.retailapi.operation.quote.model.QuoteItem;
import com.zaphirio.retailapi.operation.quote.repository.QuoteItemRepository;
import com.zaphirio.retailapi.operation.quote.repository.QuoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for QuoteServiceImpl.
 *
 * Tests:
 * - Quote creation with items
 * - Quote retrieval (by ID, customer, status, date range)
 * - Quote updates (only DRAFT/SENT quotes)
 * - Quote status transitions (DRAFT → SENT → ACCEPTED → CONVERTED_TO_SALE)
 * - Quote expiration logic
 * - Quote deletion restrictions
 * - Quote number generation (sequential per year)
 * - Total price calculation
 */
@DisplayName("QuoteService Tests")
@ExtendWith(MockitoExtension.class)
class QuoteServiceTest {

    @Mock
    private QuoteRepository quoteRepository;

    @Mock
    private QuoteItemRepository itemRepository;

    @Mock
    private QuoteMapper mapper;

    @InjectMocks
    private QuoteServiceImpl quoteService;

    private UUID testCustomerId;
    private UUID testBranchId;
    private UUID testQuoteId;
    private Long testTenantId;
    private LocalDate testDate;

    @BeforeEach
    void setUp() {
        testCustomerId = UUID.randomUUID();
        testBranchId = UUID.randomUUID();
        testQuoteId = UUID.randomUUID();
        testTenantId = 1L;
        testDate = LocalDate.now();
    }

    @Nested
    @DisplayName("Quote Creation Tests")
    class QuoteCreationTests {

        @Test
        @DisplayName("Should create quote with items")
        void shouldCreateQuoteWithItems() {
            // Arrange
            CreateQuoteRequest request = CreateQuoteRequest.builder()
                    .customerId(testCustomerId)
                    .branchId(testBranchId)
                    .creationDate(testDate)
                    .expirationDate(testDate.plusDays(30))
                    .validityDays(30)
                    .items(List.of(
                            CreateQuoteItemRequest.builder()
                                    .productId(UUID.randomUUID())
                                    .quantity(5.0)
                                    .unitPrice(100.0)
                                    .taxRate("21")
                                    .build()
                    ))
                    .build();

            QuoteItem quoteItem = QuoteItem.builder()
                    .quantity(5.0)
                    .unitPrice(100.0)
                    .taxRate("21")
                    .lineTotal(500.0)
                    .build();

            Quote quote = Quote.builder()
                    .id(testQuoteId)
                    .customerId(testCustomerId)
                    .branchId(testBranchId)
                    .creationDate(testDate)
                    .expirationDate(testDate.plusDays(30))
                    .validityDays(30)
                    .number("Q001/2026")
                    .status(Quote.QuoteStatus.DRAFT)
                    .tenantId(testTenantId)
                    .items(new ArrayList<>())
                    .totalPrice(500)
                    .build();

            QuoteResponse expectedResponse = QuoteResponse.builder()
                    .id(testQuoteId)
                    .build();

            when(mapper.toEntity(request)).thenReturn(quote);
            when(quoteRepository.findByCreationDateBetween(any(), any())).thenReturn(new ArrayList<>());
            when(quoteRepository.save(any(Quote.class))).thenReturn(quote);
            when(mapper.toResponse(quote)).thenReturn(expectedResponse);
            when(mapper.itemToEntity(any())).thenReturn(quoteItem);

            // Act
            QuoteResponse response = quoteService.create(request, testTenantId);

            // Assert
            assertNotNull(response);
            assertEquals(testQuoteId, response.getId());
            verify(quoteRepository, times(1)).save(any(Quote.class));
            verify(mapper, times(1)).toEntity(request);
        }

        @Test
        @DisplayName("Should generate correct quote number per year")
        void shouldGenerateCorrectQuoteNumber() {
            // Arrange
            int currentYear = testDate.getYear();
            Quote existingQuote1 = Quote.builder().number("Q001/2026").build();
            Quote existingQuote2 = Quote.builder().number("Q002/2026").build();

            when(quoteRepository.findByCreationDateBetween(
                    LocalDate.of(currentYear, 1, 1),
                    LocalDate.of(currentYear, 12, 31)
            )).thenReturn(List.of(existingQuote1, existingQuote2));

            // Act
            String nextNumber = quoteService.generateNextQuoteNumber(currentYear, testTenantId);

            // Assert
            assertEquals("Q003/2026", nextNumber);
        }

        @Test
        @DisplayName("Should set DRAFT status on creation")
        void shouldSetDraftStatusOnCreation() {
            // Arrange
            CreateQuoteRequest request = CreateQuoteRequest.builder()
                    .customerId(testCustomerId)
                    .branchId(testBranchId)
                    .creationDate(testDate)
                    .expirationDate(testDate.plusDays(30))
                    .build();

            Quote quote = Quote.builder()
                    .id(testQuoteId)
                    .customerId(testCustomerId)
                    .branchId(testBranchId)
                    .creationDate(testDate)
                    .expirationDate(testDate.plusDays(30))
                    .status(Quote.QuoteStatus.DRAFT)
                    .items(new ArrayList<>())
                    .build();

            when(mapper.toEntity(request)).thenReturn(quote);
            when(quoteRepository.findByCreationDateBetween(any(), any())).thenReturn(new ArrayList<>());
            when(quoteRepository.save(any(Quote.class))).thenReturn(quote);
            when(mapper.toResponse(quote)).thenReturn(QuoteResponse.builder().build());

            // Act
            quoteService.create(request, testTenantId);

            // Assert
            verify(quoteRepository).save(argThat(q -> q.getStatus() == Quote.QuoteStatus.DRAFT));
        }
    }

    @Nested
    @DisplayName("Quote Retrieval Tests")
    class QuoteRetrievalTests {

        @Test
        @DisplayName("Should retrieve quote by ID")
        void shouldRetrieveQuoteById() {
            // Arrange
            Quote quote = Quote.builder()
                    .id(testQuoteId)
                    .customerId(testCustomerId)
                    .build();

            QuoteResponse expectedResponse = QuoteResponse.builder()
                    .id(testQuoteId)
                    .build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(quote));
            when(mapper.toResponse(quote)).thenReturn(expectedResponse);

            // Act
            QuoteResponse response = quoteService.getById(testQuoteId, testTenantId);

            // Assert
            assertNotNull(response);
            assertEquals(testQuoteId, response.getId());
            verify(quoteRepository, times(1)).findById(testQuoteId);
        }

        @Test
        @DisplayName("Should throw exception when quote not found")
        void shouldThrowExceptionWhenQuoteNotFound() {
            // Arrange
            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(RuntimeException.class, () -> quoteService.getById(testQuoteId, testTenantId));
        }

        @Test
        @DisplayName("Should retrieve all quotes")
        void shouldRetrieveAllQuotes() {
            // Arrange
            Quote quote1 = Quote.builder().id(UUID.randomUUID()).build();
            Quote quote2 = Quote.builder().id(UUID.randomUUID()).build();

            when(quoteRepository.findAll()).thenReturn(List.of(quote1, quote2));
            when(mapper.toResponse(quote1)).thenReturn(QuoteResponse.builder().build());
            when(mapper.toResponse(quote2)).thenReturn(QuoteResponse.builder().build());

            // Act
            List<QuoteResponse> responses = quoteService.getAll(testTenantId);

            // Assert
            assertEquals(2, responses.size());
            verify(quoteRepository, times(1)).findAll();
        }

        @Test
        @DisplayName("Should retrieve quotes by customer ID")
        void shouldRetrieveQuotesByCustomerId() {
            // Arrange
            Quote quote = Quote.builder()
                    .id(testQuoteId)
                    .customerId(testCustomerId)
                    .build();

            when(quoteRepository.findByCustomerId(testCustomerId)).thenReturn(List.of(quote));
            when(mapper.toResponse(quote)).thenReturn(QuoteResponse.builder().build());

            // Act
            List<QuoteResponse> responses = quoteService.getByCustomerId(testCustomerId, testTenantId);

            // Assert
            assertEquals(1, responses.size());
            verify(quoteRepository, times(1)).findByCustomerId(testCustomerId);
        }

        @Test
        @DisplayName("Should retrieve quotes by customer and branch")
        void shouldRetrieveQuotesByCustomerAndBranch() {
            // Arrange
            Quote quote = Quote.builder()
                    .id(testQuoteId)
                    .customerId(testCustomerId)
                    .branchId(testBranchId)
                    .build();

            when(quoteRepository.findByCustomerIdAndBranchId(testCustomerId, testBranchId))
                    .thenReturn(List.of(quote));
            when(mapper.toResponse(quote)).thenReturn(QuoteResponse.builder().build());

            // Act
            List<QuoteResponse> responses = quoteService.getByCustomerIdAndBranchId(testCustomerId, testBranchId, testTenantId);

            // Assert
            assertEquals(1, responses.size());
            verify(quoteRepository, times(1)).findByCustomerIdAndBranchId(testCustomerId, testBranchId);
        }

        @Test
        @DisplayName("Should retrieve quotes by status")
        void shouldRetrieveQuotesByStatus() {
            // Arrange
            Quote quote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.SENT)
                    .build();

            when(quoteRepository.findByStatus(Quote.QuoteStatus.SENT)).thenReturn(List.of(quote));
            when(mapper.toResponse(quote)).thenReturn(QuoteResponse.builder().build());

            // Act
            List<QuoteResponse> responses = quoteService.getByStatus("SENT", testTenantId);

            // Assert
            assertEquals(1, responses.size());
            verify(quoteRepository, times(1)).findByStatus(Quote.QuoteStatus.SENT);
        }

        @Test
        @DisplayName("Should return empty list for invalid status")
        void shouldReturnEmptyListForInvalidStatus() {
            // Act
            List<QuoteResponse> responses = quoteService.getByStatus("INVALID_STATUS", testTenantId);

            // Assert
            assertTrue(responses.isEmpty());
        }

        @Test
        @DisplayName("Should retrieve active quotes")
        void shouldRetrieveActiveQuotes() {
            // Arrange
            Quote draftQuote = Quote.builder().id(UUID.randomUUID()).status(Quote.QuoteStatus.DRAFT).build();
            Quote sentQuote = Quote.builder().id(UUID.randomUUID()).status(Quote.QuoteStatus.SENT).build();

            when(quoteRepository.findByStatusIn(List.of(
                    Quote.QuoteStatus.DRAFT,
                    Quote.QuoteStatus.SENT,
                    Quote.QuoteStatus.ACCEPTED
            ))).thenReturn(List.of(draftQuote, sentQuote));
            when(mapper.toResponse(any())).thenReturn(QuoteResponse.builder().build());

            // Act
            List<QuoteResponse> responses = quoteService.getActive(testTenantId);

            // Assert
            assertEquals(2, responses.size());
        }

        @Test
        @DisplayName("Should retrieve quotes by date range")
        void shouldRetrieveQuotesByDateRange() {
            // Arrange
            LocalDate startDate = testDate;
            LocalDate endDate = testDate.plusDays(30);
            Quote quote = Quote.builder().id(testQuoteId).creationDate(testDate).build();

            when(quoteRepository.findByCreationDateBetween(startDate, endDate)).thenReturn(List.of(quote));
            when(mapper.toResponse(quote)).thenReturn(QuoteResponse.builder().build());

            // Act
            List<QuoteResponse> responses = quoteService.getByDateRange(startDate, endDate, testTenantId);

            // Assert
            assertEquals(1, responses.size());
            verify(quoteRepository, times(1)).findByCreationDateBetween(startDate, endDate);
        }

        @Test
        @DisplayName("Should retrieve expiring quotes")
        void shouldRetrieveExpiringQuotes() {
            // Arrange
            LocalDate futureDate = LocalDate.now().plusDays(5);
            Quote expiringQuote = Quote.builder()
                    .id(testQuoteId)
                    .expirationDate(futureDate)
                    .status(Quote.QuoteStatus.SENT)
                    .build();

            when(quoteRepository.findByExpirationDateLessThanAndStatusIn(any(), any()))
                    .thenReturn(List.of(expiringQuote));
            when(mapper.toResponse(expiringQuote)).thenReturn(QuoteResponse.builder().build());

            // Act
            List<QuoteResponse> responses = quoteService.getExpiringQuotes(10, testTenantId);

            // Assert
            assertEquals(1, responses.size());
        }
    }

    @Nested
    @DisplayName("Quote Update Tests")
    class QuoteUpdateTests {

        @Test
        @DisplayName("Should update DRAFT quote without items")
        void shouldUpdateDraftQuoteWithoutItems() {
            // Arrange
            Quote draftQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.DRAFT)
                    .items(new ArrayList<>())
                    .totalPrice(0)
                    .build();

            UpdateQuoteRequest request = UpdateQuoteRequest.builder()
                    .expirationDate(testDate.plusDays(60))
                    .observations("Updated notes")
                    .items(null)
                    .build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(draftQuote));
            when(quoteRepository.save(any(Quote.class))).thenReturn(draftQuote);
            when(mapper.toResponse(draftQuote)).thenReturn(QuoteResponse.builder().build());
            doNothing().when(mapper).updateEntity(any(Quote.class), any(UpdateQuoteRequest.class));

            // Act
            QuoteResponse response = quoteService.update(testQuoteId, request, testTenantId);

            // Assert
            assertNotNull(response);
            verify(quoteRepository, times(1)).save(any(Quote.class));
            verify(itemRepository, never()).deleteByQuoteId(testQuoteId);
        }

        @Test
        @DisplayName("Should update DRAFT quote with items")
        void shouldUpdateDraftQuoteWithItems() {
            // Arrange
            Quote draftQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.DRAFT)
                    .items(new ArrayList<>())
                    .totalPrice(0)
                    .build();

            UpdateQuoteItemRequest itemRequest = UpdateQuoteItemRequest.builder()
                    .productId(UUID.randomUUID())
                    .quantity(10.0)
                    .unitPrice(100.0)
                    .taxRate("21")
                    .build();

            UpdateQuoteRequest request = UpdateQuoteRequest.builder()
                    .expirationDate(testDate.plusDays(60))
                    .observations("Updated notes")
                    .items(List.of(itemRequest))
                    .build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(draftQuote));
            when(quoteRepository.save(any(Quote.class))).thenReturn(draftQuote);
            when(mapper.toResponse(draftQuote)).thenReturn(QuoteResponse.builder().build());
            doNothing().when(mapper).updateEntity(any(Quote.class), any(UpdateQuoteRequest.class));
            
            // Mock updateItem to actually set the tax rate on the item
            doAnswer(invocation -> {
                QuoteItem item = invocation.getArgument(0);
                UpdateQuoteItemRequest itemReq = invocation.getArgument(1);
                item.setQuantity(itemReq.getQuantity());
                item.setUnitPrice(itemReq.getUnitPrice());
                item.setTaxRate(itemReq.getTaxRate());
                item.setDescription(itemReq.getDescription());
                item.setProductId(itemReq.getProductId());
                item.setDiscountPercentage(itemReq.getDiscountPercentage() != 0 ? itemReq.getDiscountPercentage() : 0);
                item.updateLineTotal();
                return null;
            }).when(mapper).updateItem(any(QuoteItem.class), any(UpdateQuoteItemRequest.class));

            // Act
            QuoteResponse response = quoteService.update(testQuoteId, request, testTenantId);

            // Assert
            assertNotNull(response);
            verify(quoteRepository, times(1)).save(any(Quote.class));
            verify(itemRepository, times(1)).deleteByQuoteId(testQuoteId);
        }

        @Test
        @DisplayName("Should update SENT quote")
        void shouldUpdateSentQuote() {
            // Arrange
            Quote sentQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.SENT)
                    .items(new ArrayList<>())
                    .build();

            UpdateQuoteRequest request = UpdateQuoteRequest.builder()
                    .expirationDate(testDate.plusDays(60))
                    .items(new ArrayList<>())
                    .build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(sentQuote));
            when(quoteRepository.save(any(Quote.class))).thenReturn(sentQuote);
            when(mapper.toResponse(sentQuote)).thenReturn(QuoteResponse.builder().build());

            // Act
            QuoteResponse response = quoteService.update(testQuoteId, request, testTenantId);

            // Assert
            assertNotNull(response);
            verify(quoteRepository, times(1)).save(any(Quote.class));
        }

        @Test
        @DisplayName("Should reject update for ACCEPTED quote")
        void shouldRejectUpdateForAcceptedQuote() {
            // Arrange
            Quote acceptedQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.ACCEPTED)
                    .build();

            UpdateQuoteRequest request = UpdateQuoteRequest.builder().build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(acceptedQuote));

            // Act & Assert
            assertThrows(RuntimeException.class, () -> quoteService.update(testQuoteId, request, testTenantId));
            verify(quoteRepository, never()).save(any(Quote.class));
        }

        @Test
        @DisplayName("Should reject update for CONVERTED_TO_SALE quote")
        void shouldRejectUpdateForConvertedQuote() {
            // Arrange
            Quote convertedQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.CONVERTED_TO_SALE)
                    .build();

            UpdateQuoteRequest request = UpdateQuoteRequest.builder().build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(convertedQuote));

            // Act & Assert
            assertThrows(RuntimeException.class, () -> quoteService.update(testQuoteId, request, testTenantId));
        }
    }

    @Nested
    @DisplayName("Quote Status Transition Tests")
    class QuoteStatusTransitionTests {

        @Test
        @DisplayName("Should transition from DRAFT to SENT")
        void shouldTransitionFromDraftToSent() {
            // Arrange
            Quote draftQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.DRAFT)
                    .build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(draftQuote));
            when(quoteRepository.save(any(Quote.class))).thenReturn(draftQuote);
            when(mapper.toResponse(draftQuote)).thenReturn(QuoteResponse.builder().build());

            // Act
            quoteService.sendQuote(testQuoteId, testTenantId);

            // Assert
            verify(quoteRepository).save(argThat(q -> q.getStatus() == Quote.QuoteStatus.SENT));
        }

        @Test
        @DisplayName("Should reject send for already SENT quote")
        void shouldRejectSendForSentQuote() {
            // Arrange
            Quote sentQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.SENT)
                    .build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(sentQuote));

            // Act & Assert
            assertThrows(RuntimeException.class, () -> quoteService.sendQuote(testQuoteId, testTenantId));
        }

        @Test
        @DisplayName("Should transition to ACCEPTED")
        void shouldTransitionToAccepted() {
            // Arrange
            Quote sentQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.SENT)
                    .expirationDate(testDate.plusDays(30))
                    .build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(sentQuote));
            when(quoteRepository.save(any(Quote.class))).thenReturn(sentQuote);
            when(mapper.toResponse(sentQuote)).thenReturn(QuoteResponse.builder().build());

            // Act
            quoteService.acceptQuote(testQuoteId, testTenantId);

            // Assert
            verify(quoteRepository).save(argThat(q -> q.getStatus() == Quote.QuoteStatus.ACCEPTED));
        }

        @Test
        @DisplayName("Should reject accept for expired quote")
        void shouldRejectAcceptForExpiredQuote() {
            // Arrange
            Quote expiredQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.SENT)
                    .expirationDate(testDate.minusDays(1))
                    .build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(expiredQuote));

            // Act & Assert
            assertThrows(RuntimeException.class, () -> quoteService.acceptQuote(testQuoteId, testTenantId));
        }

        @Test
        @DisplayName("Should transition to REJECTED")
        void shouldTransitionToRejected() {
            // Arrange
            Quote sentQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.SENT)
                    .expirationDate(testDate.plusDays(30))
                    .build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(sentQuote));
            when(quoteRepository.save(any(Quote.class))).thenReturn(sentQuote);
            when(mapper.toResponse(sentQuote)).thenReturn(QuoteResponse.builder().build());

            // Act
            quoteService.rejectQuote(testQuoteId, testTenantId);

            // Assert
            verify(quoteRepository).save(argThat(q -> q.getStatus() == Quote.QuoteStatus.REJECTED));
        }

        @Test
        @DisplayName("Should convert ACCEPTED quote to sale")
        void shouldConvertAcceptedQuoteToSale() {
            // Arrange
            UUID saleId = UUID.randomUUID();
            Quote acceptedQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.ACCEPTED)
                    .build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(acceptedQuote));
            when(quoteRepository.save(any(Quote.class))).thenReturn(acceptedQuote);
            when(mapper.toResponse(acceptedQuote)).thenReturn(QuoteResponse.builder().build());

            // Act
            quoteService.convertToSale(testQuoteId, saleId, testTenantId);

            // Assert
            verify(quoteRepository).save(argThat(q ->
                    q.getStatus() == Quote.QuoteStatus.CONVERTED_TO_SALE &&
                    q.getSaleId().equals(saleId)
            ));
        }

        @Test
        @DisplayName("Should reject conversion for non-ACCEPTED quote")
        void shouldRejectConversionForNonAcceptedQuote() {
            // Arrange
            Quote sentQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.SENT)
                    .build();

            UUID saleId = UUID.randomUUID();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(sentQuote));

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> quoteService.convertToSale(testQuoteId, saleId, testTenantId));
        }
    }

    @Nested
    @DisplayName("Quote Deletion Tests")
    class QuoteDeletionTests {

        @Test
        @DisplayName("Should delete DRAFT quote")
        void shouldDeleteDraftQuote() {
            // Arrange
            Quote draftQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.DRAFT)
                    .build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(draftQuote));

            // Act
            quoteService.delete(testQuoteId, testTenantId);

            // Assert
            verify(itemRepository, times(1)).deleteByQuoteId(testQuoteId);
            verify(quoteRepository, times(1)).delete(any(Quote.class));
        }

        @Test
        @DisplayName("Should reject deletion of converted quote")
        void shouldRejectDeletionOfConvertedQuote() {
            // Arrange
            Quote convertedQuote = Quote.builder()
                    .id(testQuoteId)
                    .status(Quote.QuoteStatus.CONVERTED_TO_SALE)
                    .build();

            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.of(convertedQuote));

            // Act & Assert
            assertThrows(RuntimeException.class, () -> quoteService.delete(testQuoteId, testTenantId));
            verify(quoteRepository, never()).delete(any(Quote.class));
        }

        @Test
        @DisplayName("Should throw exception for non-existent quote deletion")
        void shouldThrowExceptionForNonExistentQuote() {
            // Arrange
            when(quoteRepository.findById(testQuoteId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(RuntimeException.class, () -> quoteService.delete(testQuoteId, testTenantId));
        }
    }

    @Nested
    @DisplayName("Quote Expiration Tests")
    class QuoteExpirationTests {

        @Test
        @DisplayName("Quote should not be expired before expiration date")
        void shouldNotBeExpiredBeforeExpirationDate() {
            // Arrange
            LocalDate futureDate = testDate.plusDays(30);
            Quote quote = Quote.builder()
                    .id(testQuoteId)
                    .expirationDate(futureDate)
                    .build();

            // Act
            boolean isExpired = quote.isExpired();

            // Assert
            assertFalse(isExpired);
        }

        @Test
        @DisplayName("Quote should be expired after expiration date")
        void shouldBeExpiredAfterExpirationDate() {
            // Arrange
            LocalDate pastDate = testDate.minusDays(1);
            Quote quote = Quote.builder()
                    .id(testQuoteId)
                    .expirationDate(pastDate)
                    .build();

            // Act
            boolean isExpired = quote.isExpired();

            // Assert
            assertTrue(isExpired);
        }

        @Test
        @DisplayName("QuoteStatus.isValid should return false for EXPIRED")
        void statusIsValidShouldReturnFalseForExpired() {
            // Act & Assert
            assertFalse(Quote.QuoteStatus.EXPIRED.isValid());
        }

        @Test
        @DisplayName("QuoteStatus.isValid should return false for REJECTED")
        void statusIsValidShouldReturnFalseForRejected() {
            // Act & Assert
            assertFalse(Quote.QuoteStatus.REJECTED.isValid());
        }

        @Test
        @DisplayName("QuoteStatus.isValid should return false for CONVERTED_TO_SALE")
        void statusIsValidShouldReturnFalseForConvertedToSale() {
            // Act & Assert
            assertFalse(Quote.QuoteStatus.CONVERTED_TO_SALE.isValid());
        }

        @Test
        @DisplayName("QuoteStatus.isValid should return true for DRAFT")
        void statusIsValidShouldReturnTrueForDraft() {
            // Act & Assert
            assertTrue(Quote.QuoteStatus.DRAFT.isValid());
        }

        @Test
        @DisplayName("QuoteStatus.isValid should return true for SENT")
        void statusIsValidShouldReturnTrueForSent() {
            // Act & Assert
            assertTrue(Quote.QuoteStatus.SENT.isValid());
        }

        @Test
        @DisplayName("QuoteStatus.isValid should return true for ACCEPTED")
        void statusIsValidShouldReturnTrueForAccepted() {
            // Act & Assert
            assertTrue(Quote.QuoteStatus.ACCEPTED.isValid());
        }
    }

    @Nested
    @DisplayName("Quote Number Generation Tests")
    class QuoteNumberGenerationTests {

        @Test
        @DisplayName("First quote of year should be Q001")
        void firstQuoteOfYearShouldBeQ001() {
            // Arrange
            int year = testDate.getYear();
            when(quoteRepository.findByCreationDateBetween(
                    LocalDate.of(year, 1, 1),
                    LocalDate.of(year, 12, 31)
            )).thenReturn(new ArrayList<>());

            // Act
            String number = quoteService.generateNextQuoteNumber(year, testTenantId);

            // Assert
            assertEquals("Q001/" + year, number);
        }

        @Test
        @DisplayName("Should increment quote number sequentially")
        void shouldIncrementQuoteNumberSequentially() {
            // Arrange
            int year = testDate.getYear();
            Quote quote1 = Quote.builder().number("Q001/2026").build();
            Quote quote2 = Quote.builder().number("Q002/2026").build();
            Quote quote3 = Quote.builder().number("Q003/2026").build();

            when(quoteRepository.findByCreationDateBetween(
                    LocalDate.of(year, 1, 1),
                    LocalDate.of(year, 12, 31)
            )).thenReturn(List.of(quote1, quote2, quote3));

            // Act
            String number = quoteService.generateNextQuoteNumber(year, testTenantId);

            // Assert
            assertEquals("Q004/2026", number);
        }

        @Test
        @DisplayName("Quote numbers should be zero-padded to 3 digits")
        void quoteNumbersShouldBeZeroPadded() {
            // Arrange
            int year = testDate.getYear();
            List<Quote> existingQuotes = new ArrayList<>();
            for (int i = 0; i < 99; i++) {
                existingQuotes.add(Quote.builder().number(String.format("Q%03d/2026", i + 1)).build());
            }

            when(quoteRepository.findByCreationDateBetween(
                    LocalDate.of(year, 1, 1),
                    LocalDate.of(year, 12, 31)
            )).thenReturn(existingQuotes);

            // Act
            String number = quoteService.generateNextQuoteNumber(year, testTenantId);

            // Assert
            assertEquals("Q100/2026", number);
        }
    }
}
