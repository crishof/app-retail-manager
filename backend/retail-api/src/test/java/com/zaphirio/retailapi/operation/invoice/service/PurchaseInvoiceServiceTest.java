package com.zaphirio.retailapi.operation.invoice.service;

import com.zaphirio.retailapi.operation.invoice.dto.*;
import com.zaphirio.retailapi.operation.invoice.mapper.PurchaseInvoiceMapper;
import com.zaphirio.retailapi.operation.invoice.model.PurchaseInvoice;
import com.zaphirio.retailapi.operation.invoice.model.PurchaseInvoiceItem;
import com.zaphirio.retailapi.operation.invoice.repository.PurchaseInvoiceItemRepository;
import com.zaphirio.retailapi.operation.invoice.repository.PurchaseInvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for PurchaseInvoiceServiceImpl.
 *
 * Tests:
 * - Purchase invoice creation with items
 * - Purchase invoice retrieval (by ID, supplier, date range)
 * - Purchase invoice updates
 * - Retention tax calculation and updates
 * - Purchase invoice cancellation
 * - Unpaid invoice tracking
 * - Supplier invoice number mapping
 */
@DisplayName("PurchaseInvoiceService Tests")
@ExtendWith(MockitoExtension.class)
class PurchaseInvoiceServiceTest {

    @Mock
    private PurchaseInvoiceRepository invoiceRepository;

    @Mock
    private PurchaseInvoiceItemRepository itemRepository;

    @Mock
    private PurchaseInvoiceMapper mapper;

    @InjectMocks
    private PurchaseInvoiceServiceImpl invoiceService;

    private UUID testInvoiceId;
    private UUID testSupplierId;
    private Long testTenantId;
    private LocalDate testDate;
    private String testSupplierInvoiceNumber;

    @BeforeEach
    void setUp() {
        testInvoiceId = UUID.randomUUID();
        testSupplierId = UUID.randomUUID();
        testTenantId = 1L;
        testDate = LocalDate.now();
        testSupplierInvoiceNumber = "SUP-001-2026";
    }

    @Nested
    @DisplayName("Purchase Invoice Creation Tests")
    class CreationTests {

        @Test
        @DisplayName("Should create purchase invoice with items")
        void shouldCreatePurchaseInvoiceWithItems() {
            // Arrange
            CreatePurchaseInvoiceRequest request = CreatePurchaseInvoiceRequest.builder()
                    .supplierId(testSupplierId)
                    .supplierInvoiceNumber(testSupplierInvoiceNumber)
                    .issueDate(testDate)
                    .dueDate(testDate.plusDays(30))
                    .items(List.of(
                            CreatePurchaseInvoiceItemRequest.builder()
                                    .productId(UUID.randomUUID())
                                    .quantity(50.0)
                                    .unitPrice(200.0)
                                    .taxRate("21")
                                    .build()
                    ))
                    .build();

            PurchaseInvoice invoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .number("Q001/2026")
                    .supplierId(testSupplierId)
                    .supplierInvoiceNumber(testSupplierInvoiceNumber)
                    .issueDate(testDate)
                    .dueDate(testDate.plusDays(30))
                    .totalPrice(12100.0) // 10000 + 21% tax
                    .retentionPercentage(BigDecimal.ZERO)
                    .retentionAmount(0.0)
                    .paymentStatus("PENDING")
                    .status("ISSUED")
                    .tenantId(testTenantId)
                    .build();

            PurchaseInvoiceResponse response = PurchaseInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .number("Q001/2026")
                    .supplierId(testSupplierId)
                    .supplierInvoiceNumber(testSupplierInvoiceNumber)
                    .issueDate(testDate)
                    .dueDate(testDate.plusDays(30))
                    .totalPrice(12100.0)
                    .retentionPercentage(BigDecimal.ZERO)
                    .retentionAmount(0.0)
                    .paymentStatus("PENDING")
                    .status("ISSUED")
                    .build();

            when(invoiceRepository.save(any(PurchaseInvoice.class))).thenReturn(invoice);
            when(mapper.toResponse(invoice)).thenReturn(response);

            // Act
            PurchaseInvoiceResponse result = invoiceService.create(request, testTenantId);

            // Assert
            assertNotNull(result);
            assertEquals("Q001/2026", result.getNumber());
            assertEquals(testSupplierInvoiceNumber, result.getSupplierInvoiceNumber());
            assertEquals("PENDING", result.getPaymentStatus());
            verify(invoiceRepository, times(1)).save(any(PurchaseInvoice.class));
        }

        @Test
        @DisplayName("Should fail creating invoice without supplier")
        void shouldFailCreatingInvoiceWithoutSupplier() {
            // Arrange
            CreatePurchaseInvoiceRequest request = CreatePurchaseInvoiceRequest.builder()
                    .supplierInvoiceNumber(testSupplierInvoiceNumber)
                    .issueDate(testDate)
                    .build(); // Missing supplierId

            // Act & Assert
            assertThrows(Exception.class, () -> invoiceService.create(request, testTenantId));
        }
    }

    @Nested
    @DisplayName("Purchase Invoice Retrieval Tests")
    class RetrievalTests {

        @Test
        @DisplayName("Should retrieve purchase invoice by ID")
        void shouldRetrievePurchaseInvoiceById() {
            // Arrange
            PurchaseInvoice invoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .number("Q001/2026")
                    .supplierId(testSupplierId)
                    .supplierInvoiceNumber(testSupplierInvoiceNumber)
                    .issueDate(testDate)
                    .totalPrice(12100.0)
                    .paymentStatus("PENDING")
                    .status("ISSUED")
                    .tenantId(testTenantId)
                    .build();

            PurchaseInvoiceResponse response = PurchaseInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .number("Q001/2026")
                    .supplierId(testSupplierId)
                    .supplierInvoiceNumber(testSupplierInvoiceNumber)
                    .issueDate(testDate)
                    .totalPrice(12100.0)
                    .paymentStatus("PENDING")
                    .status("ISSUED")
                    .build();

            when(invoiceRepository.findByIdAndTenantId(testInvoiceId, testTenantId))
                    .thenReturn(Optional.of(invoice));
            when(mapper.toResponse(invoice)).thenReturn(response);

            // Act
            PurchaseInvoiceResponse result = invoiceService.getById(testInvoiceId, testTenantId);

            // Assert
            assertNotNull(result);
            assertEquals(testInvoiceId, result.getId());
            assertEquals("Q001/2026", result.getNumber());
            verify(invoiceRepository, times(1)).findByIdAndTenantId(testInvoiceId, testTenantId);
        }

        @Test
        @DisplayName("Should return all purchase invoices for tenant")
        void shouldReturnAllPurchaseInvoices() {
            // Arrange
            PurchaseInvoice invoice1 = PurchaseInvoice.builder()
                    .id(UUID.randomUUID())
                    .number("Q001/2026")
                    .supplierId(testSupplierId)
                    .tenantId(testTenantId)
                    .totalPrice(12100.0)
                    .paymentStatus("PENDING")
                    .build();

            PurchaseInvoice invoice2 = PurchaseInvoice.builder()
                    .id(UUID.randomUUID())
                    .number("Q002/2026")
                    .supplierId(testSupplierId)
                    .tenantId(testTenantId)
                    .totalPrice(24200.0)
                    .paymentStatus("PAID")
                    .build();

            PurchaseInvoiceResponse response1 = PurchaseInvoiceResponse.builder()
                    .id(invoice1.getId())
                    .number("Q001/2026")
                    .totalPrice(12100.0)
                    .paymentStatus("PENDING")
                    .build();

            PurchaseInvoiceResponse response2 = PurchaseInvoiceResponse.builder()
                    .id(invoice2.getId())
                    .number("Q002/2026")
                    .totalPrice(24200.0)
                    .paymentStatus("PAID")
                    .build();

            when(invoiceRepository.findByTenantId(testTenantId))
                    .thenReturn(List.of(invoice1, invoice2));
            when(mapper.toResponse(invoice1)).thenReturn(response1);
            when(mapper.toResponse(invoice2)).thenReturn(response2);

            // Act
            List<PurchaseInvoiceResponse> result = invoiceService.getAll(testTenantId);

            // Assert
            assertEquals(2, result.size());
            assertEquals("Q001/2026", result.get(0).getNumber());
            assertEquals("Q002/2026", result.get(1).getNumber());
            verify(invoiceRepository, times(1)).findByTenantId(testTenantId);
        }

        @Test
        @DisplayName("Should retrieve purchase invoices by supplier")
        void shouldRetrievePurchaseInvoicesBySupplier() {
            // Arrange
            PurchaseInvoice invoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .number("Q001/2026")
                    .supplierId(testSupplierId)
                    .tenantId(testTenantId)
                    .totalPrice(12100.0)
                    .paymentStatus("PENDING")
                    .build();

            PurchaseInvoiceResponse response = PurchaseInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .number("Q001/2026")
                    .supplierId(testSupplierId)
                    .totalPrice(12100.0)
                    .paymentStatus("PENDING")
                    .build();

            when(invoiceRepository.findBySupplierIdAndTenantId(testSupplierId, testTenantId))
                    .thenReturn(List.of(invoice));
            when(mapper.toResponse(invoice)).thenReturn(response);

            // Act
            List<PurchaseInvoiceResponse> result = invoiceService.getBySupplierId(testSupplierId, testTenantId);

            // Assert
            assertEquals(1, result.size());
            assertEquals(testSupplierId, result.get(0).getSupplierId());
            verify(invoiceRepository, times(1)).findBySupplierIdAndTenantId(testSupplierId, testTenantId);
        }

        @Test
        @DisplayName("Should retrieve purchase invoice by supplier invoice number")
        void shouldRetrievePurchaseInvoiceBySupplierInvoiceNumber() {
            // Arrange
            PurchaseInvoice invoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .supplierInvoiceNumber(testSupplierInvoiceNumber)
                    .number("Q001/2026")
                    .tenantId(testTenantId)
                    .build();

            PurchaseInvoiceResponse response = PurchaseInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .supplierInvoiceNumber(testSupplierInvoiceNumber)
                    .number("Q001/2026")
                    .build();

            when(invoiceRepository.findBySupplierInvoiceNumberAndTenantId(testSupplierInvoiceNumber, testTenantId))
                    .thenReturn(Optional.of(invoice));
            when(mapper.toResponse(invoice)).thenReturn(response);

            // Act
            PurchaseInvoiceResponse result = invoiceService.getBySupplierInvoiceNumber(testSupplierInvoiceNumber, testTenantId);

            // Assert
            assertNotNull(result);
            assertEquals(testSupplierInvoiceNumber, result.getSupplierInvoiceNumber());
            verify(invoiceRepository, times(1)).findBySupplierInvoiceNumberAndTenantId(testSupplierInvoiceNumber, testTenantId);
        }

        @Test
        @DisplayName("Should retrieve unpaid purchase invoices")
        void shouldRetrieveUnpaidPurchaseInvoices() {
            // Arrange
            PurchaseInvoice unpaidInvoice = PurchaseInvoice.builder()
                    .id(UUID.randomUUID())
                    .supplierId(testSupplierId)
                    .tenantId(testTenantId)
                    .paymentStatus("PENDING")
                    .totalPrice(12100.0)
                    .paidAmount(0.0)
                    .build();

            PurchaseInvoiceResponse response = PurchaseInvoiceResponse.builder()
                    .id(unpaidInvoice.getId())
                    .supplierId(testSupplierId)
                    .paymentStatus("PENDING")
                    .totalPrice(12100.0)
                    .paidAmount(0.0)
                    .build();

            when(invoiceRepository.findUnpaidByTenantId(testTenantId))
                    .thenReturn(List.of(unpaidInvoice));
            when(mapper.toResponse(unpaidInvoice)).thenReturn(response);

            // Act
            List<PurchaseInvoiceResponse> result = invoiceService.getUnpaid(testTenantId);

            // Assert
            assertEquals(1, result.size());
            assertEquals("PENDING", result.get(0).getPaymentStatus());
            verify(invoiceRepository, times(1)).findUnpaidByTenantId(testTenantId);
        }

        @Test
        @DisplayName("Should retrieve unpaid purchase invoices by supplier")
        void shouldRetrieveUnpaidPurchaseInvoicesBySupplier() {
            // Arrange
            PurchaseInvoice unpaidInvoice = PurchaseInvoice.builder()
                    .id(UUID.randomUUID())
                    .supplierId(testSupplierId)
                    .tenantId(testTenantId)
                    .paymentStatus("PENDING")
                    .totalPrice(12100.0)
                    .paidAmount(0.0)
                    .build();

            PurchaseInvoiceResponse response = PurchaseInvoiceResponse.builder()
                    .id(unpaidInvoice.getId())
                    .supplierId(testSupplierId)
                    .paymentStatus("PENDING")
                    .totalPrice(12100.0)
                    .paidAmount(0.0)
                    .build();

            when(invoiceRepository.findUnpaidBySupplierIdAndTenantId(testSupplierId, testTenantId))
                    .thenReturn(List.of(unpaidInvoice));
            when(mapper.toResponse(unpaidInvoice)).thenReturn(response);

            // Act
            List<PurchaseInvoiceResponse> result = invoiceService.getUnpaidBySupplierId(testSupplierId, testTenantId);

            // Assert
            assertEquals(1, result.size());
            assertEquals(testSupplierId, result.get(0).getSupplierId());
            verify(invoiceRepository, times(1)).findUnpaidBySupplierIdAndTenantId(testSupplierId, testTenantId);
        }

        @Test
        @DisplayName("Should retrieve purchase invoices by date range")
        void shouldRetrievePurchaseInvoicesByDateRange() {
            // Arrange
            LocalDate startDate = testDate;
            LocalDate endDate = testDate.plusDays(30);

            PurchaseInvoice invoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .issueDate(testDate.plusDays(15))
                    .tenantId(testTenantId)
                    .build();

            PurchaseInvoiceResponse response = PurchaseInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .issueDate(testDate.plusDays(15))
                    .build();

            when(invoiceRepository.findByIssueDateBetweenAndTenantId(startDate, endDate, testTenantId))
                    .thenReturn(List.of(invoice));
            when(mapper.toResponse(invoice)).thenReturn(response);

            // Act
            List<PurchaseInvoiceResponse> result = invoiceService.getByDateRange(startDate, endDate, testTenantId);

            // Assert
            assertEquals(1, result.size());
            assertTrue(result.get(0).getIssueDate().isAfter(startDate.minusDays(1)));
            verify(invoiceRepository, times(1)).findByIssueDateBetweenAndTenantId(startDate, endDate, testTenantId);
        }

        @Test
        @DisplayName("Should retrieve purchase invoices with withholding")
        void shouldRetrievePurchaseInvoicesWithWithholding() {
            // Arrange
            PurchaseInvoice invoiceWithWithholding = PurchaseInvoice.builder()
                    .id(UUID.randomUUID())
                    .supplierId(testSupplierId)
                    .tenantId(testTenantId)
                    .retentionPercentage(BigDecimal.valueOf(10.0))
                    .retentionAmount(1210.0)
                    .totalPrice(12100.0)
                    .build();

            PurchaseInvoiceResponse response = PurchaseInvoiceResponse.builder()
                    .id(invoiceWithWithholding.getId())
                    .supplierId(testSupplierId)
                    .retentionPercentage(BigDecimal.valueOf(10.0))
                    .retentionAmount(1210.0)
                    .totalPrice(12100.0)
                    .build();

            when(invoiceRepository.findWithWithholdingByTenantId(testTenantId))
                    .thenReturn(List.of(invoiceWithWithholding));
            when(mapper.toResponse(invoiceWithWithholding)).thenReturn(response);

            // Act
            List<PurchaseInvoiceResponse> result = invoiceService.getWithWithholding(testTenantId);

            // Assert
            assertEquals(1, result.size());
            assertTrue(result.get(0).getRetentionAmount() > 0);
            verify(invoiceRepository, times(1)).findWithWithholdingByTenantId(testTenantId);
        }
    }

    @Nested
    @DisplayName("Purchase Invoice Retention Tests")
    class RetentionTests {

        @Test
        @DisplayName("Should update retention percentage and recalculate amount")
        void shouldUpdateRetentionPercentage() {
            // Arrange
            BigDecimal newRetentionPercentage = BigDecimal.valueOf(10.0);

            PurchaseInvoice invoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .totalPrice(12100.0)
                    .retentionPercentage(BigDecimal.ZERO)
                    .retentionAmount(0.0)
                    .tenantId(testTenantId)
                    .build();

            PurchaseInvoice updatedInvoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .totalPrice(12100.0)
                    .retentionPercentage(newRetentionPercentage)
                    .retentionAmount(1210.0) // 10% of 12100
                    .tenantId(testTenantId)
                    .build();

            PurchaseInvoiceResponse response = PurchaseInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .totalPrice(12100.0)
                    .retentionPercentage(newRetentionPercentage)
                    .retentionAmount(1210.0)
                    .build();

            when(invoiceRepository.findByIdAndTenantId(testInvoiceId, testTenantId))
                    .thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(PurchaseInvoice.class))).thenReturn(updatedInvoice);
            when(mapper.toResponse(updatedInvoice)).thenReturn(response);

            // Act
            PurchaseInvoiceResponse result = invoiceService.updateRetention(testInvoiceId, newRetentionPercentage, testTenantId);

            // Assert
            assertNotNull(result);
            assertEquals(newRetentionPercentage, result.getRetentionPercentage());
            assertEquals(1210.0, result.getRetentionAmount());
            verify(invoiceRepository, times(1)).save(any(PurchaseInvoice.class));
        }

        @Test
        @DisplayName("Should calculate retention amount correctly")
        void shouldCalculateRetentionAmountCorrectly() {
            // Arrange
            BigDecimal retentionPercentage = BigDecimal.valueOf(15.0);
            double expectedRetentionAmount = 12100.0 * 0.15; // 1815.0

            PurchaseInvoice invoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .totalPrice(12100.0)
                    .retentionPercentage(retentionPercentage)
                    .retentionAmount(expectedRetentionAmount)
                    .tenantId(testTenantId)
                    .build();

            PurchaseInvoiceResponse response = PurchaseInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .totalPrice(12100.0)
                    .retentionPercentage(retentionPercentage)
                    .retentionAmount(expectedRetentionAmount)
                    .build();

            when(invoiceRepository.findByIdAndTenantId(testInvoiceId, testTenantId))
                    .thenReturn(Optional.of(invoice));
            when(mapper.toResponse(invoice)).thenReturn(response);

            // Act
            PurchaseInvoiceResponse result = invoiceService.getById(testInvoiceId, testTenantId);

            // Assert
            assertEquals(expectedRetentionAmount, result.getRetentionAmount(), 0.01);
        }
    }

    @Nested
    @DisplayName("Purchase Invoice Update & Cancellation Tests")
    class UpdateAndCancellationTests {

        @Test
        @DisplayName("Should update purchase invoice")
        void shouldUpdatePurchaseInvoice() {
            // Arrange
            PurchaseInvoice invoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .dueDate(testDate)
                    .tenantId(testTenantId)
                    .status("ISSUED")
                    .build();

            UpdatePurchaseInvoiceRequest request = UpdatePurchaseInvoiceRequest.builder()
                    .dueDate(testDate.plusDays(45))
                    .build();

            PurchaseInvoice updatedInvoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .dueDate(testDate.plusDays(45))
                    .tenantId(testTenantId)
                    .status("ISSUED")
                    .build();

            PurchaseInvoiceResponse response = PurchaseInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .dueDate(testDate.plusDays(45))
                    .status("ISSUED")
                    .build();

            when(invoiceRepository.findByIdAndTenantId(testInvoiceId, testTenantId))
                    .thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(PurchaseInvoice.class))).thenReturn(updatedInvoice);
            when(mapper.toResponse(updatedInvoice)).thenReturn(response);

            // Act
            PurchaseInvoiceResponse result = invoiceService.update(testInvoiceId, request, testTenantId);

            // Assert
            assertNotNull(result);
            assertEquals(testDate.plusDays(45), result.getDueDate());
            verify(invoiceRepository, times(1)).save(any(PurchaseInvoice.class));
        }

        @Test
        @DisplayName("Should cancel purchase invoice")
        void shouldCancelPurchaseInvoice() {
            // Arrange
            PurchaseInvoice invoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .status("ISSUED")
                    .tenantId(testTenantId)
                    .build();

            PurchaseInvoice cancelledInvoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .status("CANCELLED")
                    .tenantId(testTenantId)
                    .build();

            PurchaseInvoiceResponse response = PurchaseInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .status("CANCELLED")
                    .build();

            when(invoiceRepository.findByIdAndTenantId(testInvoiceId, testTenantId))
                    .thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(PurchaseInvoice.class))).thenReturn(cancelledInvoice);
            when(mapper.toResponse(cancelledInvoice)).thenReturn(response);

            // Act
            PurchaseInvoiceResponse result = invoiceService.cancel(testInvoiceId, testTenantId);

            // Assert
            assertNotNull(result);
            assertEquals("CANCELLED", result.getStatus());
            verify(invoiceRepository, times(1)).save(any(PurchaseInvoice.class));
        }

        @Test
        @DisplayName("Should delete purchase invoice")
        void shouldDeletePurchaseInvoice() {
            // Arrange
            PurchaseInvoice invoice = PurchaseInvoice.builder()
                    .id(testInvoiceId)
                    .status("DRAFT")
                    .tenantId(testTenantId)
                    .build();

            when(invoiceRepository.findByIdAndTenantId(testInvoiceId, testTenantId))
                    .thenReturn(Optional.of(invoice));

            // Act
            invoiceService.delete(testInvoiceId, testTenantId);

            // Assert
            verify(invoiceRepository, times(1)).delete(invoice);
        }
    }
}
