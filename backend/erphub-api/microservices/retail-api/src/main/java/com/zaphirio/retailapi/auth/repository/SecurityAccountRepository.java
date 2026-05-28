package com.zaphirio.retailapi.auth.repository;

import com.zaphirio.retailapi.auth.model.SecurityAccount;
import com.zaphirio.retailapi.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SecurityAccountRepository extends JpaRepository<SecurityAccount, UUID> {

    Optional<SecurityAccount> findByUser(User user);

    Optional<SecurityAccount> findByUserEmailIgnoreCase(String email);
}
