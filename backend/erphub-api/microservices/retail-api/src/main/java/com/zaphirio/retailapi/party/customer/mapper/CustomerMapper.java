package com.zaphirio.retailapi.party.customer.mapper;

import com.zaphirio.retailapi.party.customer.dto.CustomerRequest;
import com.zaphirio.retailapi.party.customer.dto.CustomerResponse;
import com.zaphirio.retailapi.party.customer.model.Customer;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface CustomerMapper {

    // CREATE
    @Mapping(target = "id", ignore = true)
    Customer toEntity(CustomerRequest request);

    // READ
    CustomerResponse toDto(Customer customer);

    // UPDATE (PATCH / PUT partial)

    @Mapping(target = "id", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(CustomerRequest request, @MappingTarget Customer customer);
}
