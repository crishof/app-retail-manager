package com.zaphirio.retailapi.auth.repository;

import com.zaphirio.retailapi.auth.model.EmailVerificationToken;
import com.zaphirio.retailapi.auth.model.User;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationTokenRepository extends TenantAwareRepository<EmailVerificationToken, UUID> {

    Optional<EmailVerificationToken> findTopByUserAndCodeAndUsedFalseOrderByCreatedAtDesc(User user, String code);

    @Modifying
    @Transactional
    void deleteByUser(User user);
}
