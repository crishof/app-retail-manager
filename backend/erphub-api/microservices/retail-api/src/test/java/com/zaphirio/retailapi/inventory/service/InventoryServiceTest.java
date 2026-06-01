package com.zaphirio.retailapi.inventory.service;

import com.zaphirio.retailapi.inventory.dto.*;
import com.zaphirio.retailapi.inventory.mapper.InventoryMapper;
import com.zaphirio.retailapi.inventory.model.InventorySession;
import com.zaphirio.retailapi.inventory.model.InventoryItem;
import com.zaphirio.retailapi.inventory.repository.InventoryItemRepository;
import com.zaphirio.retailapi.inventory.repository.InventorySessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for InventoryService.
 *
 * Tests:
 * - Inventory session CRUD operations
 * - Session status transitions (DRAFT → IN_PROGRESS → COMPLETED → CONFIRMED)
 * - Item management within sessions
 * - Zone counting and discrepancy calculations
 * - Session filtering and retrieval
 * - Item lifecycle management
 */
@DisplayName("InventoryService Tests")
@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private InventorySessionRepository sessionRepository;

    @Mock
    private InventoryItemRepository itemRepository;

    @Mock
    private InventoryMapper mapper;

    @InjectMocks
    private InventoryService inventoryService;

    private UUID testSessionId;
    private UUID testItemId;
    private UUID testBranchId;
    private UUID testDepositId;
    private UUID testUserId;
    private Long testTenantId;
    private LocalDate testDate;

    @BeforeEach
    void setUp() {
        testSessionId = UUID.randomUUID();
        testItemId = UUID.randomUUID();
        testBranchId = UUID.randomUUID();
        testDepositId = UUID.randomUUID();
        testUserId = UUID.randomUUID();
        testTenantId = 1L;
        testDate = LocalDate.now();
    }

    @Nested
    @DisplayName("Session Creation Tests")
    class SessionCreationTests {

        @Test
        @DisplayName("Should create inventory session with items")
        void shouldCreateInventorySessionWithItems() {
            // Arrange
            CreateInventorySessionRequest request = CreateInventorySessionRequest.builder()
                    .branchId(testBranchId)
                    .depositId(testDepositId)
                    .sessionDate(testDate)
                    .observations("Initial count")
                    .items(List.of(
                            CreateInventoryItemRequest.builder()
                                    .productId(UUID.randomUUID())
                                    .systemQuantity(100)
                                    .zonaACount(30)
                                    .zonaBCount(35)
                                    .zonaCCount(35)
                                    .build()
                    ))
                    .build();

            InventorySession session = InventorySession.builder()
                    .id(testSessionId)
                    .branchId(testBranchId)
                    .depositId(testDepositId)
                    .sessionDate(testDate)
                    .status(InventorySession.InventorySessionStatus.DRAFT)
                    .tenantId(testTenantId)
                    .items(new ArrayList<>())
                    .build();

            InventorySessionResponse expectedResponse = InventorySessionResponse.builder()
                    .id(testSessionId)
                    .status("DRAFT")
                    .build();

            when(mapper.toEntity(request)).thenReturn(session);
            when(sessionRepository.save(any(InventorySession.class))).thenReturn(session);
            when(mapper.sessionToResponse(session)).thenReturn(expectedResponse);
            when(mapper.itemToEntity(any())).thenReturn(new InventoryItem());

            // Act
            InventorySessionResponse response = inventoryService.createSession(request, testTenantId);

            // Assert
            assertNotNull(response);
            assertEquals(testSessionId, response.getId());
            assertEquals("DRAFT", response.getStatus());
            verify(sessionRepository, times(1)).save(any(InventorySession.class));
        }

        @Test
        @DisplayName("Should set DRAFT status on creation")
        void shouldSetDraftStatusOnCreation() {
            // Arrange
            CreateInventorySessionRequest request = CreateInventorySessionRequest.builder()
                    .branchId(testBranchId)
                    .depositId(testDepositId)
                    .sessionDate(testDate)
                    .build();

            InventorySession session = InventorySession.builder()
                    .id(testSessionId)
                    .branchId(testBranchId)
                    .depositId(testDepositId)
                    .sessionDate(testDate)
                    .status(InventorySession.InventorySessionStatus.DRAFT)
                    .items(new ArrayList<>())
                    .build();

            when(mapper.toEntity(request)).thenReturn(session);
            when(sessionRepository.save(any(InventorySession.class))).thenReturn(session);
            when(mapper.sessionToResponse(session)).thenReturn(InventorySessionResponse.builder().build());

            // Act
            inventoryService.createSession(request, testTenantId);

            // Assert
            verify(sessionRepository).save(argThat(s -> 
                    s.getStatus() == InventorySession.InventorySessionStatus.DRAFT));
        }
    }

    @Nested
    @DisplayName("Session Retrieval Tests")
    class SessionRetrievalTests {

        @Test
        @DisplayName("Should retrieve session by ID")
        void shouldRetrieveSessionById() {
            // Arrange
            InventorySession session = InventorySession.builder()
                    .id(testSessionId)
                    .branchId(testBranchId)
                    .build();

            InventorySessionResponse expectedResponse = InventorySessionResponse.builder()
                    .id(testSessionId)
                    .build();

            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(session));
            when(mapper.sessionToResponse(session)).thenReturn(expectedResponse);

            // Act
            InventorySessionResponse response = inventoryService.getSessionById(testSessionId, testTenantId);

            // Assert
            assertNotNull(response);
            assertEquals(testSessionId, response.getId());
            verify(sessionRepository, times(1)).findById(testSessionId);
        }

        @Test
        @DisplayName("Should throw exception when session not found")
        void shouldThrowExceptionWhenSessionNotFound() {
            // Arrange
            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(RuntimeException.class, 
                    () -> inventoryService.getSessionById(testSessionId, testTenantId));
        }

        @Test
        @DisplayName("Should retrieve all sessions")
        void shouldRetrieveAllSessions() {
            // Arrange
            InventorySession session1 = InventorySession.builder().id(UUID.randomUUID()).build();
            InventorySession session2 = InventorySession.builder().id(UUID.randomUUID()).build();

            when(sessionRepository.findAll()).thenReturn(List.of(session1, session2));
            when(mapper.sessionToResponse(any())).thenReturn(InventorySessionResponse.builder().build());

            // Act
            List<InventorySessionResponse> responses = inventoryService.getAllSessions(testTenantId);

            // Assert
            assertEquals(2, responses.size());
            verify(sessionRepository, times(1)).findAll();
        }

        @Test
        @DisplayName("Should retrieve sessions by branch")
        void shouldRetrieveSessionsByBranch() {
            // Arrange
            InventorySession session = InventorySession.builder()
                    .id(testSessionId)
                    .branchId(testBranchId)
                    .build();

            when(sessionRepository.findByBranchId(testBranchId)).thenReturn(List.of(session));
            when(mapper.sessionToResponse(session)).thenReturn(InventorySessionResponse.builder().build());

            // Act
            List<InventorySessionResponse> responses = inventoryService.getSessionsByBranch(testBranchId, testTenantId);

            // Assert
            assertEquals(1, responses.size());
            verify(sessionRepository, times(1)).findByBranchId(testBranchId);
        }

        @Test
        @DisplayName("Should retrieve sessions by deposit")
        void shouldRetrieveSessionsByDeposit() {
            // Arrange
            InventorySession session = InventorySession.builder()
                    .id(testSessionId)
                    .depositId(testDepositId)
                    .build();

            when(sessionRepository.findByDepositId(testDepositId)).thenReturn(List.of(session));
            when(mapper.sessionToResponse(session)).thenReturn(InventorySessionResponse.builder().build());

            // Act
            List<InventorySessionResponse> responses = inventoryService.getSessionsByDeposit(testDepositId, testTenantId);

            // Assert
            assertEquals(1, responses.size());
            verify(sessionRepository, times(1)).findByDepositId(testDepositId);
        }

        @Test
        @DisplayName("Should retrieve sessions by status")
        void shouldRetrieveSessionsByStatus() {
            // Arrange
            InventorySession session = InventorySession.builder()
                    .id(testSessionId)
                    .status(InventorySession.InventorySessionStatus.IN_PROGRESS)
                    .build();

            when(sessionRepository.findByStatus(InventorySession.InventorySessionStatus.IN_PROGRESS))
                    .thenReturn(List.of(session));
            when(mapper.sessionToResponse(session)).thenReturn(InventorySessionResponse.builder().build());

            // Act
            List<InventorySessionResponse> responses = inventoryService.getSessionsByStatus("IN_PROGRESS", testTenantId);

            // Assert
            assertEquals(1, responses.size());
        }

        @Test
        @DisplayName("Should return empty list for invalid status")
        void shouldReturnEmptyListForInvalidStatus() {
            // Act
            List<InventorySessionResponse> responses = inventoryService.getSessionsByStatus("INVALID", testTenantId);

            // Assert
            assertTrue(responses.isEmpty());
        }

        @Test
        @DisplayName("Should retrieve active sessions")
        void shouldRetrieveActiveSessions() {
            // Arrange
            InventorySession draftSession = InventorySession.builder()
                    .id(UUID.randomUUID())
                    .status(InventorySession.InventorySessionStatus.DRAFT)
                    .build();
            InventorySession inProgressSession = InventorySession.builder()
                    .id(UUID.randomUUID())
                    .status(InventorySession.InventorySessionStatus.IN_PROGRESS)
                    .build();

            when(sessionRepository.findByStatusIn(List.of(
                    InventorySession.InventorySessionStatus.DRAFT,
                    InventorySession.InventorySessionStatus.IN_PROGRESS
            ))).thenReturn(List.of(draftSession, inProgressSession));
            when(mapper.sessionToResponse(any())).thenReturn(InventorySessionResponse.builder().build());

            // Act
            List<InventorySessionResponse> responses = inventoryService.getActiveSessions(testTenantId);

            // Assert
            assertEquals(2, responses.size());
        }

        @Test
        @DisplayName("Should retrieve sessions by date range")
        void shouldRetrieveSessionsByDateRange() {
            // Arrange
            LocalDate startDate = testDate;
            LocalDate endDate = testDate.plusDays(30);
            InventorySession session = InventorySession.builder()
                    .id(testSessionId)
                    .sessionDate(testDate)
                    .build();

            when(sessionRepository.findBySessionDateBetween(startDate, endDate))
                    .thenReturn(List.of(session));
            when(mapper.sessionToResponse(session)).thenReturn(InventorySessionResponse.builder().build());

            // Act
            List<InventorySessionResponse> responses = inventoryService.getSessionsByDateRange(startDate, endDate, testTenantId);

            // Assert
            assertEquals(1, responses.size());
            verify(sessionRepository, times(1)).findBySessionDateBetween(startDate, endDate);
        }
    }

    @Nested
    @DisplayName("Session Update Tests")
    class SessionUpdateTests {

        @Test
        @DisplayName("Should update IN_PROGRESS session")
        void shouldUpdateInProgressSession() {
            // Arrange
            InventorySession session = InventorySession.builder()
                    .id(testSessionId)
                    .status(InventorySession.InventorySessionStatus.IN_PROGRESS)
                    .items(new ArrayList<>())
                    .build();

            UpdateInventorySessionRequest request = UpdateInventorySessionRequest.builder()
                    .observations("Updated observations")
                    .items(new ArrayList<>())
                    .build();

            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(session));
            when(sessionRepository.save(any(InventorySession.class))).thenReturn(session);
            when(mapper.sessionToResponse(session)).thenReturn(InventorySessionResponse.builder().build());
            doNothing().when(mapper).updateEntity(any(InventorySession.class), any(UpdateInventorySessionRequest.class));

            // Act
            InventorySessionResponse response = inventoryService.updateSession(testSessionId, request, testTenantId);

            // Assert
            assertNotNull(response);
            verify(sessionRepository, times(1)).save(any(InventorySession.class));
        }

        @Test
        @DisplayName("Should reject update for COMPLETED session")
        void shouldRejectUpdateForCompletedSession() {
            // Arrange
            InventorySession session = InventorySession.builder()
                    .id(testSessionId)
                    .status(InventorySession.InventorySessionStatus.COMPLETED)
                    .build();

            UpdateInventorySessionRequest request = UpdateInventorySessionRequest.builder().build();

            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(session));

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> inventoryService.updateSession(testSessionId, request, testTenantId));
            verify(sessionRepository, never()).save(any(InventorySession.class));
        }
    }

    @Nested
    @DisplayName("Session Status Transition Tests")
    class SessionStatusTransitionTests {

        @Test
        @DisplayName("Should transition from DRAFT to IN_PROGRESS")
        void shouldTransitionFromDraftToInProgress() {
            // Arrange
            InventorySession draftSession = InventorySession.builder()
                    .id(testSessionId)
                    .status(InventorySession.InventorySessionStatus.DRAFT)
                    .build();

            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(draftSession));
            when(sessionRepository.save(any(InventorySession.class))).thenReturn(draftSession);
            when(mapper.sessionToResponse(draftSession)).thenReturn(InventorySessionResponse.builder().build());

            // Act
            inventoryService.startSession(testSessionId, testUserId, testTenantId);

            // Assert
            verify(sessionRepository).save(argThat(s -> 
                    s.getStatus() == InventorySession.InventorySessionStatus.IN_PROGRESS &&
                    s.getInitiatedByUserId().equals(testUserId)));
        }

        @Test
        @DisplayName("Should reject start for non-DRAFT session")
        void shouldRejectStartForNonDraftSession() {
            // Arrange
            InventorySession inProgressSession = InventorySession.builder()
                    .id(testSessionId)
                    .status(InventorySession.InventorySessionStatus.IN_PROGRESS)
                    .build();

            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(inProgressSession));

            // Act & Assert
            assertThrows(IllegalStateException.class,
                    () -> inventoryService.startSession(testSessionId, testUserId, testTenantId));
        }

        @Test
        @DisplayName("Should transition from IN_PROGRESS to COMPLETED")
        void shouldTransitionFromInProgressToCompleted() {
            // Arrange
            InventorySession inProgressSession = InventorySession.builder()
                    .id(testSessionId)
                    .status(InventorySession.InventorySessionStatus.IN_PROGRESS)
                    .build();

            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(inProgressSession));
            when(sessionRepository.save(any(InventorySession.class))).thenReturn(inProgressSession);
            when(mapper.sessionToResponse(inProgressSession)).thenReturn(InventorySessionResponse.builder().build());

            // Act
            inventoryService.completeSession(testSessionId, testTenantId);

            // Assert
            verify(sessionRepository).save(argThat(s -> 
                    s.getStatus() == InventorySession.InventorySessionStatus.COMPLETED));
        }

        @Test
        @DisplayName("Should transition from COMPLETED to CONFIRMED")
        void shouldTransitionFromCompletedToConfirmed() {
            // Arrange
            InventorySession completedSession = InventorySession.builder()
                    .id(testSessionId)
                    .status(InventorySession.InventorySessionStatus.COMPLETED)
                    .build();

            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(completedSession));
            when(sessionRepository.save(any(InventorySession.class))).thenReturn(completedSession);
            when(mapper.sessionToResponse(completedSession)).thenReturn(InventorySessionResponse.builder().build());

            // Act
            inventoryService.confirmSession(testSessionId, testUserId, testTenantId);

            // Assert
            verify(sessionRepository).save(argThat(s -> 
                    s.getStatus() == InventorySession.InventorySessionStatus.CONFIRMED &&
                    s.getConfirmedByUserId().equals(testUserId)));
        }
    }

    @Nested
    @DisplayName("Session Deletion Tests")
    class SessionDeletionTests {

        @Test
        @DisplayName("Should delete DRAFT session")
        void shouldDeleteDraftSession() {
            // Arrange
            InventorySession draftSession = InventorySession.builder()
                    .id(testSessionId)
                    .status(InventorySession.InventorySessionStatus.DRAFT)
                    .build();

            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(draftSession));

            // Act
            inventoryService.deleteSession(testSessionId, testTenantId);

            // Assert
            verify(itemRepository, times(1)).deleteBySessionId(testSessionId);
            verify(sessionRepository, times(1)).delete(any(InventorySession.class));
        }

        @Test
        @DisplayName("Should reject deletion of IN_PROGRESS session")
        void shouldRejectDeletionOfInProgressSession() {
            // Arrange
            InventorySession inProgressSession = InventorySession.builder()
                    .id(testSessionId)
                    .status(InventorySession.InventorySessionStatus.IN_PROGRESS)
                    .build();

            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(inProgressSession));

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> inventoryService.deleteSession(testSessionId, testTenantId));
            verify(sessionRepository, never()).delete(any(InventorySession.class));
        }

        @Test
        @DisplayName("Should throw exception for non-existent session deletion")
        void shouldThrowExceptionForNonExistentSession() {
            // Arrange
            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> inventoryService.deleteSession(testSessionId, testTenantId));
        }
    }

    @Nested
    @DisplayName("Item Management Tests")
    class ItemManagementTests {

        @Test
        @DisplayName("Should add item to active session")
        void shouldAddItemToActiveSession() {
            // Arrange
            InventorySession inProgressSession = InventorySession.builder()
                    .id(testSessionId)
                    .status(InventorySession.InventorySessionStatus.IN_PROGRESS)
                    .items(new ArrayList<>())
                    .build();

            CreateInventoryItemRequest itemRequest = CreateInventoryItemRequest.builder()
                    .productId(UUID.randomUUID())
                    .systemQuantity(100)
                    .zonaACount(30)
                    .zonaBCount(35)
                    .zonaCCount(35)
                    .build();

            InventoryItem item = InventoryItem.builder()
                    .id(testItemId)
                    .productId(itemRequest.getProductId())
                    .systemQuantity(100)
                    .build();

            InventoryItemResponse expectedResponse = InventoryItemResponse.builder()
                    .id(testItemId)
                    .build();

            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(inProgressSession));
            when(mapper.itemToEntity(itemRequest)).thenReturn(item);
            when(itemRepository.save(any(InventoryItem.class))).thenReturn(item);
            when(mapper.itemToResponse(item)).thenReturn(expectedResponse);

            // Act
            InventoryItemResponse response = inventoryService.addItem(testSessionId, itemRequest, testTenantId);

            // Assert
            assertNotNull(response);
            assertEquals(testItemId, response.getId());
            verify(itemRepository, times(1)).save(any(InventoryItem.class));
        }

        @Test
        @DisplayName("Should reject adding item to inactive session")
        void shouldRejectAddingItemToInactiveSession() {
            // Arrange
            InventorySession completedSession = InventorySession.builder()
                    .id(testSessionId)
                    .status(InventorySession.InventorySessionStatus.COMPLETED)
                    .build();

            CreateInventoryItemRequest itemRequest = CreateInventoryItemRequest.builder().build();

            when(sessionRepository.findById(testSessionId)).thenReturn(Optional.of(completedSession));

            // Act & Assert
            assertThrows(RuntimeException.class,
                    () -> inventoryService.addItem(testSessionId, itemRequest, testTenantId));
            verify(itemRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should retrieve item by ID")
        void shouldRetrieveItemById() {
            // Arrange
            InventoryItem item = InventoryItem.builder()
                    .id(testItemId)
                    .productId(UUID.randomUUID())
                    .build();

            InventoryItemResponse expectedResponse = InventoryItemResponse.builder()
                    .id(testItemId)
                    .build();

            when(itemRepository.findById(testItemId)).thenReturn(Optional.of(item));
            when(mapper.itemToResponse(item)).thenReturn(expectedResponse);

            // Act
            InventoryItemResponse response = inventoryService.getItemById(testItemId, testTenantId);

            // Assert
            assertNotNull(response);
            assertEquals(testItemId, response.getId());
        }

        @Test
        @DisplayName("Should retrieve items by session")
        void shouldRetrieveItemsBySession() {
            // Arrange
            InventoryItem item1 = InventoryItem.builder().id(UUID.randomUUID()).build();
            InventoryItem item2 = InventoryItem.builder().id(UUID.randomUUID()).build();

            when(itemRepository.findBySessionIdOrderByOrderIndex(testSessionId))
                    .thenReturn(List.of(item1, item2));
            when(mapper.itemToResponse(any())).thenReturn(InventoryItemResponse.builder().build());

            // Act
            List<InventoryItemResponse> responses = inventoryService.getItemsBySession(testSessionId, testTenantId);

            // Assert
            assertEquals(2, responses.size());
        }

        @Test
        @DisplayName("Should retrieve items with discrepancies")
        void shouldRetrieveItemsWithDiscrepancies() {
            // Arrange
            InventoryItem discrepancyItem = InventoryItem.builder()
                    .id(testItemId)
                    .variance(10)
                    .build();

            when(itemRepository.findBySessionIdAndVarianceNot(testSessionId, 0))
                    .thenReturn(List.of(discrepancyItem));
            when(mapper.itemToResponse(discrepancyItem)).thenReturn(InventoryItemResponse.builder().build());

            // Act
            List<InventoryItemResponse> responses = inventoryService.getDiscrepanciesBySession(testSessionId, testTenantId);

            // Assert
            assertEquals(1, responses.size());
        }

        @Test
        @DisplayName("Should update inventory item")
        void shouldUpdateInventoryItem() {
            // Arrange
            InventoryItem item = InventoryItem.builder()
                    .id(testItemId)
                    .systemQuantity(100)
                    .build();

            UpdateInventoryItemRequest request = UpdateInventoryItemRequest.builder()
                    .zonaACount(35)
                    .zonaBCount(35)
                    .zonaCCount(30)
                    .build();

            when(itemRepository.findById(testItemId)).thenReturn(Optional.of(item));
            when(itemRepository.save(any(InventoryItem.class))).thenReturn(item);
            when(mapper.itemToResponse(item)).thenReturn(InventoryItemResponse.builder().build());
            doNothing().when(mapper).updateItem(any(InventoryItem.class), any(UpdateInventoryItemRequest.class));

            // Act
            InventoryItemResponse response = inventoryService.updateItem(testItemId, request, testTenantId);

            // Assert
            assertNotNull(response);
            verify(itemRepository, times(1)).save(any(InventoryItem.class));
        }

        @Test
        @DisplayName("Should delete inventory item")
        void shouldDeleteInventoryItem() {
            // Arrange
            InventoryItem item = InventoryItem.builder()
                    .id(testItemId)
                    .build();

            when(itemRepository.findById(testItemId)).thenReturn(Optional.of(item));

            // Act
            inventoryService.deleteItem(testItemId, testTenantId);

            // Assert
            verify(itemRepository, times(1)).delete(any(InventoryItem.class));
        }
    }

    @Nested
    @DisplayName("Session Active State Tests")
    class SessionActiveStateTests {

        @Test
        @DisplayName("DRAFT session should not be active")
        void draftSessionShouldNotBeActive() {
            // Arrange
            InventorySession session = InventorySession.builder()
                    .status(InventorySession.InventorySessionStatus.DRAFT)
                    .build();

            // Act & Assert
            assertFalse(session.isActive());
        }

        @Test
        @DisplayName("IN_PROGRESS session should be active")
        void inProgressSessionShouldBeActive() {
            // Arrange
            InventorySession session = InventorySession.builder()
                    .status(InventorySession.InventorySessionStatus.IN_PROGRESS)
                    .build();

            // Act & Assert
            assertTrue(session.isActive());
        }

        @Test
        @DisplayName("COMPLETED session should not be active")
        void completedSessionShouldNotBeActive() {
            // Arrange
            InventorySession session = InventorySession.builder()
                    .status(InventorySession.InventorySessionStatus.COMPLETED)
                    .build();

            // Act & Assert
            assertFalse(session.isActive());
        }

        @Test
        @DisplayName("CONFIRMED session should not be active")
        void confirmedSessionShouldNotBeActive() {
            // Arrange
            InventorySession session = InventorySession.builder()
                    .status(InventorySession.InventorySessionStatus.CONFIRMED)
                    .build();

            // Act & Assert
            assertFalse(session.isActive());
        }
    }
}
