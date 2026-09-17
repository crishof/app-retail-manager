package com.zaphirio.retailapi.party.supplier.mapper;

import com.zaphirio.retailapi.party.supplier.dto.SupplierRequest;
import com.zaphirio.retailapi.party.supplier.dto.SupplierResponse;
import com.zaphirio.retailapi.party.supplier.model.Supplier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class SupplierMapperManualImpl implements SupplierMapper {

    @Override
    public Supplier toEntity(SupplierRequest request) {
        if (request == null) {
            return null;
        }
        Supplier supplier = new Supplier();
        supplier.setName(request.getName());
        supplier.setTaxId(request.getTaxId());
        supplier.setLegalName(request.getLegalName());
        supplier.setAddressId(request.getAddressId());
        return supplier;
    }

    @Override
    public SupplierResponse toDto(Supplier supplier) {
        if (supplier == null) {
            return null;
        }
        SupplierResponse response = new SupplierResponse();
        response.setId(supplier.getId());
        response.setName(supplier.getName());
        response.setTaxId(supplier.getTaxId());
        response.setLegalName(supplier.getLegalName());
        response.setAddressId(supplier.getAddressId());
        return response;
    }

    @Override
    public void updateEntityFromRequest(SupplierRequest request, Supplier supplier) {
        if (request == null || supplier == null) {
            return;
        }
        if (request.getName() != null) {
            supplier.setName(request.getName());
        }
        if (request.getTaxId() != null) {
            supplier.setTaxId(request.getTaxId());
        }
        if (request.getLegalName() != null) {
            supplier.setLegalName(request.getLegalName());
        }
        if (request.getAddressId() != null) {
            supplier.setAddressId(request.getAddressId());
        }
    }
}

