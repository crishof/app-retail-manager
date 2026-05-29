package com.zaphirio.retailapi.auth.repository;

import com.zaphirio.retailapi.auth.model.RefreshToken;
import com.zaphirio.retailapi.auth.model.User;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends TenantAwareRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenAndRevokedFalse(String token);

    List<RefreshToken> findAllByUserAndRevokedFalse(User user);
}