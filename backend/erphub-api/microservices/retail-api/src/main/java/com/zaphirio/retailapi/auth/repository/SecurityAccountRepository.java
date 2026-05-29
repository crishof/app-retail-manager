package com.zaphirio.retailapi.auth.repository;

import com.zaphirio.retailapi.auth.model.SecurityAccount;
import com.zaphirio.retailapi.auth.model.User;
import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;

import java.util.Optional;
import java.util.UUID;

public interface SecurityAccountRepository extends TenantAwareRepository<SecurityAccount, UUID> {

    Optional<SecurityAccount> findByUser(User user);

    Optional<SecurityAccount> findByUserEmailIgnoreCase(String email);
}
