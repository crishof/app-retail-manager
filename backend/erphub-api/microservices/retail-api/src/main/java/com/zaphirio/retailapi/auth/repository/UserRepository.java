package com.zaphirio.retailapi.auth.repository;

import com.zaphirio.retailapi.auth.model.User;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends TenantAwareRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
