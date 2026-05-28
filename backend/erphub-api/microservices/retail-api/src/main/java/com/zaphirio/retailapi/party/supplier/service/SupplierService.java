package com.zaphirio.retailapi.party.supplier.service;


import com.zaphirio.retailapi.party.supplier.dto.SupplierRequest;
import com.zaphirio.retailapi.party.supplier.dto.SupplierResponse;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface SupplierService {

    SupplierResponse create(SupplierRequest supplierRequest);

    List<SupplierResponse> findAll();

    SupplierResponse findById(UUID id);

    SupplierResponse update(UUID id, SupplierRequest supplierRequest);

    void delete(UUID id);

    @Transactional
    void forceDelete(UUID id);

    Long getSupplierCount();

    SupplierResponse restore(UUID id);
}