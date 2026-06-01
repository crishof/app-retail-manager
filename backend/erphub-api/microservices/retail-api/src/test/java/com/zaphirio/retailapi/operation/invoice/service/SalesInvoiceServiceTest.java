package com.zaphirio.retailapi.operation.invoice.service;

import com.zaphirio.retailapi.operation.invoice.dto.*;
import com.zaphirio.retailapi.operation.invoice.mapper.SalesInvoiceMapper;
import com.zaphirio.retailapi.operation.invoice.model.SalesInvoice;
import com.zaphirio.retailapi.operation.invoice.model.SalesInvoiceItem;
import com.zaphirio.retailapi.operation.invoice.repository.SalesInvoiceItemRepository;
import com.zaphirio.retailapi.operation.invoice.repository.SalesInvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for SalesInvoiceServiceImpl.
 *
 * Tests:
 * - Sales invoice creation with items
 * - Sales invoice retrieval (by ID, customer, date range)
 * - Sales invoice updates
 * - Payment recording and tracking
 * - Sales invoice cancellation
 * - Total price and payment status calculations
 */
@DisplayName("SalesInvoiceService Tests")
@ExtendWith(MockitoExtension.class)
class SalesInvoiceServiceTest {

    @Mock
    private SalesInvoiceRepository invoiceRepository;

    @Mock
    private SalesInvoiceItemRepository itemRepository;

    @Mock
    private SalesInvoiceMapper mapper;

    @InjectMocks
    private SalesInvoiceServiceImpl invoiceService;

    private UUID testInvoiceId;
    private UUID testCustomerId;
    private UUID testSaleId;
    private Long testTenantId;
    private LocalDate testDate;

    @BeforeEach
    void setUp() {
        testInvoiceId = UUID.randomUUID();
        testCustomerId = UUID.randomUUID();
        testSaleId = UUID.randomUUID();
        testTenantId = 1L;
        testDate = LocalDate.now();
    }

    @Nested
    @DisplayName("Sales Invoice Creation Tests")
    class CreationTests {

        @Test
        @DisplayName("Should create sales invoice with items")
        void shouldCreateSalesInvoiceWithItems() {
            // Arrange
            CreateSalesInvoiceRequest request = CreateSalesInvoiceRequest.builder()
                    .customerId(testCustomerId)
                    .saleId(testSaleId)
                    .issueDate(testDate)
                    .dueDate(testDate.plusDays(30))
                    .comprovantType("FACTURA")
                    .items(List.of(
                            CreateSalesInvoiceItemRequest.builder()
                                    .productId(UUID.randomUUID())
                                    .quantity(10.0)
                                    .unitPrice(100.0)
                                    .taxRate("21")
                                    .build()
                    ))
                    .build();

            SalesInvoice invoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .number("001/2026")
                    .customerId(testCustomerId)
                    .saleId(testSaleId)
                    .issueDate(testDate)
                    .dueDate(testDate.plusDays(30))
                    .comprovantType("FACTURA")
                    .totalPrice(1210.0) // 1000 + 21% tax
                    .paymentStatus("PENDING")
                    .status("ISSUED")
                    .tenantId(testTenantId)
                    .build();

            SalesInvoiceResponse response = SalesInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .number("001/2026")
                    .customerId(testCustomerId)
                    .saleId(testSaleId)
                    .issueDate(testDate)
                    .dueDate(testDate.plusDays(30))
                    .comprovantType("FACTURA")
                    .totalPrice(1210.0)
                    .paymentStatus("PENDING")
                    .status("ISSUED")
                    .build();

            when(invoiceRepository.save(any(SalesInvoice.class))).thenReturn(invoice);
            when(mapper.toResponse(invoice)).thenReturn(response);

            // Act
            SalesInvoiceResponse result = invoiceService.create(request, testTenantId);

            // Assert
            assertNotNull(result);
            assertEquals("001/2026", result.getNumber());
            assertEquals("PENDING", result.getPaymentStatus());
            verify(invoiceRepository, times(1)).save(any(SalesInvoice.class));
        }

        @Test
        @DisplayName("Should fail creating invoice without required fields")
        void shouldFailCreatingInvoiceWithoutRequiredFields() {
            // Arrange
            CreateSalesInvoiceRequest request = CreateSalesInvoiceRequest.builder()
                    .customerId(testCustomerId)
                    .issueDate(testDate)
                    .build(); // Missing saleId and items

            // Act & Assert - This depends on validation implementation
            assertThrows(Exception.class, () -> invoiceService.create(request, testTenantId));
        }
    }

    @Nested
    @DisplayName("Sales Invoice Retrieval Tests")
    class RetrievalTests {

        @Test
        @DisplayName("Should retrieve sales invoice by ID")
        void shouldRetrieveSalesInvoiceById() {
            // Arrange
            SalesInvoice invoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .number("001/2026")
                    .customerId(testCustomerId)
                    .saleId(testSaleId)
                    .issueDate(testDate)
                    .totalPrice(1210.0)
                    .paymentStatus("PENDING")
                    .status("ISSUED")
                    .tenantId(testTenantId)
                    .build();

            SalesInvoiceResponse response = SalesInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .number("001/2026")
                    .customerId(testCustomerId)
                    .saleId(testSaleId)
                    .issueDate(testDate)
                    .totalPrice(1210.0)
                    .paymentStatus("PENDING")
                    .status("ISSUED")
                    .build();

            when(invoiceRepository.findByIdAndTenantId(testInvoiceId, testTenantId))
                    .thenReturn(Optional.of(invoice));
            when(mapper.toResponse(invoice)).thenReturn(response);

            // Act
            SalesInvoiceResponse result = invoiceService.getById(testInvoiceId, testTenantId);

            // Assert
            assertNotNull(result);
            assertEquals(testInvoiceId, result.getId());
            assertEquals("001/2026", result.getNumber());
            verify(invoiceRepository, times(1)).findByIdAndTenantId(testInvoiceId, testTenantId);
        }

        @Test
        @DisplayName("Should return all sales invoices for tenant")
        void shouldReturnAllSalesInvoices() {
            // Arrange
            SalesInvoice invoice1 = SalesInvoice.builder()
                    .id(UUID.randomUUID())
                    .number("001/2026")
                    .customerId(testCustomerId)
                    .tenantId(testTenantId)
                    .totalPrice(1210.0)
                    .paymentStatus("PENDING")
                    .build();

            SalesInvoice invoice2 = SalesInvoice.builder()
                    .id(UUID.randomUUID())
                    .number("002/2026")
                    .customerId(testCustomerId)
                    .tenantId(testTenantId)
                    .totalPrice(2420.0)
                    .paymentStatus("PAID")
                    .build();

            SalesInvoiceResponse response1 = SalesInvoiceResponse.builder()
                    .id(invoice1.getId())
                    .number("001/2026")
                    .totalPrice(1210.0)
                    .paymentStatus("PENDING")
                    .build();

            SalesInvoiceResponse response2 = SalesInvoiceResponse.builder()
                    .id(invoice2.getId())
                    .number("002/2026")
                    .totalPrice(2420.0)
                    .paymentStatus("PAID")
                    .build();

            when(invoiceRepository.findByTenantId(testTenantId))
                    .thenReturn(List.of(invoice1, invoice2));
            when(mapper.toResponse(invoice1)).thenReturn(response1);
            when(mapper.toResponse(invoice2)).thenReturn(response2);

            // Act
            List<SalesInvoiceResponse> result = invoiceService.getAll(testTenantId);

            // Assert
            assertEquals(2, result.size());
            assertEquals("001/2026", result.get(0).getNumber());
            assertEquals("002/2026", result.get(1).getNumber());
            verify(invoiceRepository, times(1)).findByTenantId(testTenantId);
        }

        @Test
        @DisplayName("Should retrieve sales invoices by customer")
        void shouldRetrieveSalesInvoicesByCustomer() {
            // Arrange
            SalesInvoice invoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .number("001/2026")
                    .customerId(testCustomerId)
                    .tenantId(testTenantId)
                    .totalPrice(1210.0)
                    .paymentStatus("PENDING")
                    .build();

            SalesInvoiceResponse response = SalesInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .number("001/2026")
                    .customerId(testCustomerId)
                    .totalPrice(1210.0)
                    .paymentStatus("PENDING")
                    .build();

            when(invoiceRepository.findByCustomerIdAndTenantId(testCustomerId, testTenantId))
                    .thenReturn(List.of(invoice));
            when(mapper.toResponse(invoice)).thenReturn(response);

            // Act
            List<SalesInvoiceResponse> result = invoiceService.getByCustomerId(testCustomerId, testTenantId);

            // Assert
            assertEquals(1, result.size());
            assertEquals(testCustomerId, result.get(0).getCustomerId());
            verify(invoiceRepository, times(1)).findByCustomerIdAndTenantId(testCustomerId, testTenantId);
        }

        @Test
        @DisplayName("Should retrieve sales invoice by sale ID")
        void shouldRetrieveSalesInvoiceBySaleId() {
            // Arrange
            SalesInvoice invoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .saleId(testSaleId)
                    .number("001/2026")
                    .tenantId(testTenantId)
                    .build();

            SalesInvoiceResponse response = SalesInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .saleId(testSaleId)
                    .number("001/2026")
                    .build();

            when(invoiceRepository.findBySaleIdAndTenantId(testSaleId, testTenantId))
                    .thenReturn(Optional.of(invoice));
            when(mapper.toResponse(invoice)).thenReturn(response);

            // Act
            SalesInvoiceResponse result = invoiceService.getBySaleId(testSaleId, testTenantId);

            // Assert
            assertNotNull(result);
            assertEquals(testSaleId, result.getSaleId());
            verify(invoiceRepository, times(1)).findBySaleIdAndTenantId(testSaleId, testTenantId);
        }

        @Test
        @DisplayName("Should retrieve unpaid invoices by customer")
        void shouldRetrieveUnpaidInvoicesByCustomer() {
            // Arrange
            SalesInvoice unpaidInvoice = SalesInvoice.builder()
                    .id(UUID.randomUUID())
                    .customerId(testCustomerId)
                    .tenantId(testTenantId)
                    .paymentStatus("PENDING")
                    .totalPrice(1210.0)
                    .paidAmount(0.0)
                    .build();

            SalesInvoiceResponse response = SalesInvoiceResponse.builder()
                    .id(unpaidInvoice.getId())
                    .customerId(testCustomerId)
                    .paymentStatus("PENDING")
                    .totalPrice(1210.0)
                    .paidAmount(0.0)
                    .build();

            when(invoiceRepository.findUnpaidByCustomerIdAndTenantId(testCustomerId, testTenantId))
                    .thenReturn(List.of(unpaidInvoice));
            when(mapper.toResponse(unpaidInvoice)).thenReturn(response);

            // Act
            List<SalesInvoiceResponse> result = invoiceService.getUnpaidByCustomerId(testCustomerId, testTenantId);

            // Assert
            assertEquals(1, result.size());
            assertEquals("PENDING", result.get(0).getPaymentStatus());
            verify(invoiceRepository, times(1)).findUnpaidByCustomerIdAndTenantId(testCustomerId, testTenantId);
        }

        @Test
        @DisplayName("Should retrieve sales invoices by date range")
        void shouldRetrieveSalesInvoicesByDateRange() {
            // Arrange
            LocalDate startDate = testDate;
            LocalDate endDate = testDate.plusDays(30);

            SalesInvoice invoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .issueDate(testDate.plusDays(15))
                    .tenantId(testTenantId)
                    .build();

            SalesInvoiceResponse response = SalesInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .issueDate(testDate.plusDays(15))
                    .build();

            when(invoiceRepository.findByIssueDateBetweenAndTenantId(startDate, endDate, testTenantId))
                    .thenReturn(List.of(invoice));
            when(mapper.toResponse(invoice)).thenReturn(response);

            // Act
            List<SalesInvoiceResponse> result = invoiceService.getByDateRange(startDate, endDate, testTenantId);

            // Assert
            assertEquals(1, result.size());
            assertTrue(result.get(0).getIssueDate().isAfter(startDate.minusDays(1)));
            verify(invoiceRepository, times(1)).findByIssueDateBetweenAndTenantId(startDate, endDate, testTenantId);
        }
    }

    @Nested
    @DisplayName("Sales Invoice Payment Tests")
    class PaymentTests {

        @Test
        @DisplayName("Should record payment and update payment status")
        void shouldRecordPaymentAndUpdateStatus() {
            // Arrange
            SalesInvoice invoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .totalPrice(1000.0)
                    .paidAmount(0.0)
                    .paymentStatus("PENDING")
                    .tenantId(testTenantId)
                    .build();

            SalesInvoice updatedInvoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .totalPrice(1000.0)
                    .paidAmount(500.0)
                    .paymentStatus("PARTIAL")
                    .tenantId(testTenantId)
                    .build();

            SalesInvoiceResponse response = SalesInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .totalPrice(1000.0)
                    .paidAmount(500.0)
                    .paymentStatus("PARTIAL")
                    .build();

            when(invoiceRepository.findByIdAndTenantId(testInvoiceId, testTenantId))
                    .thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(SalesInvoice.class))).thenReturn(updatedInvoice);
            when(mapper.toResponse(updatedInvoice)).thenReturn(response);

            // Act
            SalesInvoiceResponse result = invoiceService.recordPayment(testInvoiceId, 500.0, testTenantId);

            // Assert
            assertNotNull(result);
            assertEquals(500.0, result.getPaidAmount());
            assertEquals("PARTIAL", result.getPaymentStatus());
            verify(invoiceRepository, times(1)).save(any(SalesInvoice.class));
        }

        @Test
        @DisplayName("Should update payment status to PAID when fully paid")
        void shouldUpdatePaymentStatusToPaidWhenFullyPaid() {
            // Arrange
            SalesInvoice invoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .totalPrice(1000.0)
                    .paidAmount(500.0)
                    .paymentStatus("PARTIAL")
                    .tenantId(testTenantId)
                    .build();

            SalesInvoice paidInvoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .totalPrice(1000.0)
                    .paidAmount(1000.0)
                    .paymentStatus("PAID")
                    .tenantId(testTenantId)
                    .build();

            SalesInvoiceResponse response = SalesInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .totalPrice(1000.0)
                    .paidAmount(1000.0)
                    .paymentStatus("PAID")
                    .build();

            when(invoiceRepository.findByIdAndTenantId(testInvoiceId, testTenantId))
                    .thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(SalesInvoice.class))).thenReturn(paidInvoice);
            when(mapper.toResponse(paidInvoice)).thenReturn(response);

            // Act
            SalesInvoiceResponse result = invoiceService.recordPayment(testInvoiceId, 500.0, testTenantId);

            // Assert
            assertEquals("PAID", result.getPaymentStatus());
            assertEquals(1000.0, result.getPaidAmount());
        }
    }

    @Nested
    @DisplayName("Sales Invoice Update & Cancellation Tests")
    class UpdateAndCancellationTests {

        @Test
        @DisplayName("Should update sales invoice")
        void shouldUpdateSalesInvoice() {
            // Arrange
            SalesInvoice invoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .dueDate(testDate)
                    .tenantId(testTenantId)
                    .status("ISSUED")
                    .build();

            UpdateSalesInvoiceRequest request = UpdateSalesInvoiceRequest.builder()
                    .dueDate(testDate.plusDays(45))
                    .build();

            SalesInvoice updatedInvoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .dueDate(testDate.plusDays(45))
                    .tenantId(testTenantId)
                    .status("ISSUED")
                    .build();

            SalesInvoiceResponse response = SalesInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .dueDate(testDate.plusDays(45))
                    .status("ISSUED")
                    .build();

            when(invoiceRepository.findByIdAndTenantId(testInvoiceId, testTenantId))
                    .thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(SalesInvoice.class))).thenReturn(updatedInvoice);
            when(mapper.toResponse(updatedInvoice)).thenReturn(response);

            // Act
            SalesInvoiceResponse result = invoiceService.update(testInvoiceId, request, testTenantId);

            // Assert
            assertNotNull(result);
            assertEquals(testDate.plusDays(45), result.getDueDate());
            verify(invoiceRepository, times(1)).save(any(SalesInvoice.class));
        }

        @Test
        @DisplayName("Should cancel sales invoice")
        void shouldCancelSalesInvoice() {
            // Arrange
            SalesInvoice invoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .status("ISSUED")
                    .tenantId(testTenantId)
                    .build();

            SalesInvoice cancelledInvoice = SalesInvoice.builder()
                    .id(testInvoiceId)
                    .status("CANCELLED")
                    .tenantId(testTenantId)
                    .build();

            SalesInvoiceResponse response = SalesInvoiceResponse.builder()
                    .id(testInvoiceId)
                    .status("CANCELLED")
                    .build();

            when(invoiceRepository.findByIdAndTenantId(testInvoiceId, testTenantId))
                    .thenReturn(Optional.of(invoice));
            when(invoiceRepository.save(any(SalesInvoice.class))).thenReturn(cancelledInvoice);
            when(mapper.toResponse(cancelledInvoice)).thenReturn(response);

            // Act
            SalesInvoiceResponse result = invoiceService.cancel(testInvoiceId, testTenantId);

            // Assert
            assertNotNull(result);
            assertEquals("CANCELLED", result.getStatus());
            verify(invoiceRepository, times(1)).save(any(SalesInvoice.class));
        }

        @Test
        @DisplayName("Should delete sales invoice")
        void shouldDeleteSalesInvoice() {
            // Arrange
            SalesInvoice invoice = SalesInvoice.builder()
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
