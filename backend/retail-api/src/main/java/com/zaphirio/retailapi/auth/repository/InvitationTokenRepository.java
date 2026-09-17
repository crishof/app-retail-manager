package com.zaphirio.retailapi.auth.repository;

import com.zaphirio.retailapi.auth.model.InvitationToken;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;

import java.util.Optional;
import java.util.UUID;

public interface InvitationTokenRepository extends TenantAwareRepository<InvitationToken, UUID> {

    Optional<InvitationToken> findByToken(String token);

    Optional<InvitationToken> findTopByEmailIgnoreCaseAndUsedFalseOrderByCreatedAtDesc(String email);
}
