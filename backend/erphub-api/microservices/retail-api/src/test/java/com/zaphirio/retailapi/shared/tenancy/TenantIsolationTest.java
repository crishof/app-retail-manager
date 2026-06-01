package com.zaphirio.retailapi.shared.tenancy;

import com.zaphirio.retailapi.auth.model.Role;
import com.zaphirio.retailapi.auth.model.User;
import com.zaphirio.retailapi.auth.model.UserStatus;
import com.zaphirio.retailapi.auth.repository.UserRepository;
import com.zaphirio.retailapi.catalog.product.model.Product;
import com.zaphirio.retailapi.catalog.product.repository.ProductRepository;
import com.zaphirio.retailapi.shared.security.TenantContext;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for multi-tenant data isolation.
 *
 * Verifies that TenantAwareRepository correctly filters data by tenant_id
 * and prevents cross-tenant data access.
 *
 * Test Strategy:
 * 1. Create entities for Tenant A and Tenant B
 * 2. Set TenantContext to Tenant A
 * 3. Query repositories - should only return Tenant A data
 * 4. Switch TenantContext to Tenant B
 * 5. Query repositories - should only return Tenant B data
 * 6. Verify no data leakage between tenants
 */
@SpringBootTest
@ActiveProfiles("test")
@Slf4j
@DisplayName("Tenant Isolation Tests - Multi-Tenancy Data Isolation")
class TenantIsolationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    private static final Long TENANT_A_ID = 1001L;
    private static final Long TENANT_B_ID = 1002L;

    private UUID tenantAUser1Id;
    private UUID tenantAUser2Id;
    private UUID tenantBUser1Id;

    private UUID tenantAProduct1Id;
    private UUID tenantBProduct1Id;

    /**
     * Setup: Create test data for both tenants.
     */
    @BeforeEach
    void setUp() {
        log.info("=== Tenant Isolation Test Setup ===");

        // Create users for Tenant A
        tenantAUser1Id = createUser("tenant-a-user-1@test.com", TENANT_A_ID);
        tenantAUser2Id = createUser("tenant-a-user-2@test.com", TENANT_A_ID);

        // Create user for Tenant B
        tenantBUser1Id = createUser("tenant-b-user-1@test.com", TENANT_B_ID);

        // Create products for Tenant A
        tenantAProduct1Id = createProduct("Tenant A Product 1", TENANT_A_ID);

        // Create product for Tenant B
        tenantBProduct1Id = createProduct("Tenant B Product 1", TENANT_B_ID);

        log.info("Setup complete - Tenant A: 2 users, 1 product | Tenant B: 1 user, 1 product");
    }

    /**
     * Cleanup: Clear TenantContext after each test.
     */
    @AfterEach
    void cleanup() {
        TenantContext.clear();
        log.info("TenantContext cleared after test");
    }

    /**
     * Test 1: Verify Tenant A can only see its own users.
     */
    @Test
    @DisplayName("Test 1: Tenant A findAll() should return only Tenant A users")
    void testTenantACanOnlySeeTenantAUsers() {
        log.info("=== TEST 1: Tenant A Data Isolation ===");

        // Set context to Tenant A
        TenantContext.setContext(String.valueOf(TENANT_A_ID), tenantAUser1Id.toString());

        // Query should use currentTenant() to filter by Tenant A
        Specification<User> spec = userRepository.currentTenant();
        List<User> users = userRepository.findAll(spec);

        log.info("Tenant A query returned {} users", users.size());

        // Assertions
        assertThat(users).hasSize(2).extracting(User::getId).contains(tenantAUser1Id, tenantAUser2Id);
        assertThat(users).extracting(User::getTenantId).containsOnly(TENANT_A_ID);
        assertThat(users).noneMatch(u -> u.getId().equals(tenantBUser1Id));

        log.info("✓ Tenant A isolation verified - no cross-tenant data visible");
    }

    /**
     * Test 2: Verify Tenant B can only see its own users.
     */
    @Test
    @DisplayName("Test 2: Tenant B findAll() should return only Tenant B users")
    void testTenantBCanOnlySeeTenantBUsers() {
        log.info("=== TEST 2: Tenant B Data Isolation ===");

        // Set context to Tenant B
        TenantContext.setContext(String.valueOf(TENANT_B_ID), tenantBUser1Id.toString());

        // Query should use currentTenant() to filter by Tenant B
        Specification<User> spec = userRepository.currentTenant();
        List<User> users = userRepository.findAll(spec);

        log.info("Tenant B query returned {} users", users.size());

        // Assertions
        assertThat(users).hasSize(1).extracting(User::getId).containsOnly(tenantBUser1Id);
        assertThat(users).extracting(User::getTenantId).containsOnly(TENANT_B_ID);
        assertThat(users).noneMatch(u -> u.getId().equals(tenantAUser1Id) || u.getId().equals(tenantAUser2Id));

        log.info("✓ Tenant B isolation verified - no cross-tenant data visible");
    }

    /**
     * Test 3: Verify custom Specification combined with tenant filter.
     */
    @Test
    @DisplayName("Test 3: Custom Specification + tenant filter should isolate data")
    void testCustomSpecificationWithTenantFilter() {
        log.info("=== TEST 3: Custom Specification + Tenant Filter ===");

        TenantContext.setContext(String.valueOf(TENANT_A_ID), tenantAUser1Id.toString());

        // Create custom specification by email
        Specification<User> emailSpec = (root, query, cb) ->
                cb.equal(root.get("email"), "tenant-a-user-1@test.com");

        // Combine with tenant filter
        Specification<User> combinedSpec = userRepository.withCurrentTenant(emailSpec);
        List<User> users = userRepository.findAll(combinedSpec);

        log.info("Combined specification query returned {} users", users.size());

        // Should return only the matching Tenant A user, not Tenant B user with similar email
        assertThat(users).hasSize(1)
                .first()
                .extracting(User::getId, User::getTenantId, User::getEmail)
                .containsExactly(tenantAUser1Id, TENANT_A_ID, "tenant-a-user-1@test.com");

        log.info("✓ Custom Specification with tenant filter verified");
    }

    /**
     * Test 4: Verify tenant context enforcement - IllegalStateException if not set.
     */
    @Test
    @DisplayName("Test 4: Missing TenantContext should throw IllegalStateException")
    void testMissingTenantContextThrowsException() {
        log.info("=== TEST 4: TenantContext Enforcement ===");

        // Don't set TenantContext

        // Attempting to use currentTenant() without context should throw
        assertThatThrownBy(() -> {
            Specification<User> spec = userRepository.currentTenant();
            userRepository.findAll(spec);
        })
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Tenant ID not set in context");

        log.info("✓ TenantContext enforcement verified - exception thrown as expected");
    }

    /**
     * Test 5: Verify data isolation across different entity types.
     */
    @Test
    @DisplayName("Test 5: Data isolation should work across different repositories")
    void testDataIsolationAcrossRepositories() {
        log.info("=== TEST 5: Cross-Repository Data Isolation ===");

        TenantContext.setContext(String.valueOf(TENANT_A_ID), tenantAUser1Id.toString());

        // Query both repositories with Tenant A context
        Specification<User> userSpec = userRepository.currentTenant();
        Specification<Product> productSpec = productRepository.currentTenant();

        List<User> users = userRepository.findAll(userSpec);
        List<Product> products = productRepository.findAll(productSpec);

        log.info("Tenant A - Users: {}, Products: {}", users.size(), products.size());

        // All returned data should have Tenant A ID
        assertThat(users).allMatch(u -> u.getTenantId().equals(TENANT_A_ID));
        assertThat(products).allMatch(p -> p.getTenantId().equals(TENANT_A_ID));

        // Should not contain Tenant B data
        assertThat(users).noneMatch(u -> u.getTenantId().equals(TENANT_B_ID));
        assertThat(products).noneMatch(p -> p.getTenantId().equals(TENANT_B_ID));

        log.info("✓ Cross-repository isolation verified");
    }

    /**
     * Test 6: Verify tenant switch isolation - previous tenant context doesn't leak.
     */
    @Test
    @DisplayName("Test 6: Tenant context switch should not leak previous tenant data")
    void testTenantSwitchIsolation() {
        log.info("=== TEST 6: Tenant Context Switch Isolation ===");

        // Query as Tenant A
        TenantContext.setContext(String.valueOf(TENANT_A_ID), tenantAUser1Id.toString());
        Specification<User> specA = userRepository.currentTenant();
        List<User> usersA = userRepository.findAll(specA);
        log.info("Tenant A query: {} users", usersA.size());

        // Switch to Tenant B
        TenantContext.clear();
        TenantContext.setContext(String.valueOf(TENANT_B_ID), tenantBUser1Id.toString());
        Specification<User> specB = userRepository.currentTenant();
        List<User> usersB = userRepository.findAll(specB);
        log.info("Tenant B query: {} users", usersB.size());

        // Verify data is different
        assertThat(usersA).hasSize(2);
        assertThat(usersB).hasSize(1);
        assertThat(usersA).extracting(User::getId).doesNotContain(tenantBUser1Id);
        assertThat(usersB).extracting(User::getId).doesNotContain(tenantAUser1Id, tenantAUser2Id);

        log.info("✓ Tenant context switch isolation verified");
    }

    /**
     * Helper: Create a user for the given tenant.
     */
    private UUID createUser(String email, Long tenantId) {
        User user = new User();
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.ADMIN);
        user.setStatus(UserStatus.ACTIVE);
        user.setTenantId(tenantId);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());

        // Bypass tenant filtering for setup (set context temporarily)
        TenantContext.setContext(String.valueOf(tenantId), UUID.randomUUID().toString());
        User savedUser = userRepository.save(user);
        TenantContext.clear();

        log.debug("Created user {} for tenant {}", email, tenantId);
        return savedUser.getId();
    }

    /**
     * Helper: Create a product for the given tenant.
     */
    private UUID createProduct(String name, Long tenantId) {
        Product product = new Product();
        product.setModel(name);
        product.setBrandName("Test Brand");
        product.setDescription("Test product for tenant " + tenantId);
        product.setPublished(true);
        product.setTenantId(tenantId);
        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());

        // Bypass tenant filtering for setup (set context temporarily)
        TenantContext.setContext(String.valueOf(tenantId), UUID.randomUUID().toString());
        Product savedProduct = productRepository.save(product);
        TenantContext.clear();

        log.debug("Created product {} for tenant {}", name, tenantId);
        return savedProduct.getId();
    }
}
