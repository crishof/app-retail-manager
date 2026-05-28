package com.zaphirio.retailapi.auth.repository;

import com.zaphirio.retailapi.auth.model.PasswordResetToken;
import com.zaphirio.retailapi.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);

    @Modifying
    @Transactional
    void deleteByUser(User user);
}
