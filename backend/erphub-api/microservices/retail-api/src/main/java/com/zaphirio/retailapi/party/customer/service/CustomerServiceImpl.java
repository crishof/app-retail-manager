package com.zaphirio.retailapi.party.customer.service;

import com.zaphirio.retailapi.shared.client.OrderServiceClient;
import com.zaphirio.retailapi.party.customer.dto.CustomerMergeResponse;
import com.zaphirio.retailapi.party.customer.dto.CustomerRequest;
import com.zaphirio.retailapi.party.customer.dto.CustomerResponse;
import com.zaphirio.retailapi.party.customer.dto.ReassignCustomerResponse;
import com.zaphirio.retailapi.shared.exception.BusinessException;
import com.zaphirio.retailapi.shared.exception.ResourceNotFoundException;
import com.zaphirio.retailapi.party.customer.mapper.CustomerMapper;
import com.zaphirio.retailapi.party.customer.model.Customer;
import com.zaphirio.retailapi.party.customer.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerServiceImpl implements CustomerService {

    private static final String CUSTOMER_NOT_FOUND = "Customer with id %s not found";
    private static final String DELETING = "Deleting customer | id={}";
    private static final String DELETED = "Customer deleted successfully | id={}";
    private final CustomerRepository customerRepository;
    private final CustomerDeletionService customerDeletionService;
    private final CustomerMapper customerMapper;
    private final OrderServiceClient orderServiceClient;

    @Override
    @Transactional
    public CustomerResponse create(CustomerRequest customerRequest) {

        log.info("Creating customer | lastname={} | name={}", customerRequest.getLastname(), customerRequest.getName());

        String normalizedDni = normalizeNullable(customerRequest.getDni());
        customerRequest.setDni(normalizedDni);

        if (normalizedDni != null) {
            Optional<Customer> existing = customerRepository.findByDniIncludingDeleted(normalizedDni);

            if (existing.isPresent()) {
                Customer customer = existing.get();
                if (customerRepository.existsDeletedById(customer.getId())) {
                    log.info("Restoring previously deleted customer | id={} | dni={}", customer.getId(), normalizedDni);
                    customerRepository.restoreById(customer.getId());
                    return customerMapper.toDto(customerRepository.save(customer));
                }
                throw new IllegalArgumentException("Customer with DNI '" + normalizedDni + "' already exists.");
            }
        }

        Customer customer = customerMapper.toEntity(customerRequest);

        Customer saved = customerRepository.save(customer);
        log.info("Customer created | id={} | dni={}", saved.getId(), saved.getDni());
        return customerMapper.toDto(saved);
    }

    @Override
    public Page<CustomerResponse> getAll(Pageable pageable) {

        log.debug("Fetching customers | page={} size={}", pageable.getPageNumber(), pageable.getPageSize());

        return customerRepository.findAll(pageable).map(customerMapper::toDto);
    }

    @Override
    public CustomerResponse getById(UUID id) {
        Customer customer = getCustomerOrThrow(id);
        return customerMapper.toDto(customer);
    }

    @Override
    @Transactional
    public CustomerResponse update(UUID id, CustomerRequest customerRequest) {
        log.info("Updating customer | id={} | name={}", id, customerRequest.getName());
        Customer customer = getCustomerOrThrow(id);
        customerMapper.updateEntityFromRequest(customerRequest, customer);
        return customerMapper.toDto(customerRepository.save(customer));
    }

    @Override
    @Transactional
    public void delete(UUID id) {

        deleteLog(DELETING, id);

        Customer customer = getCustomerOrThrow(id);

        boolean hasOrders = orderServiceClient.hasOrdersForCustomer(id);
         if (hasOrders) {
             throw new BusinessException("Cannot delete customer because it has orders");
         }

         customerRepository.delete(customer);
        int deleted = customerRepository.setDeletedAt(id);

        if (deleted > 0) {
            deleteLog(DELETED, id);
        }
    }

    @Override
    @Transactional
    public void forceDelete(UUID id) {

        deleteLog(DELETING, id);

        getCustomerOrThrow(id);

        boolean hasOrders = orderServiceClient.hasOrdersForCustomer(id);
         if (hasOrders) {
             throw new BusinessException("Cannot delete customer because it has orders");
         }

         int deleted = customerRepository.forceDelete(id);

        if (deleted > 0) {
            deleteLog(DELETED, id);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Long getCustomerCount() {
        return customerRepository.count();
    }

    @Override
    @Transactional
    public CustomerResponse restore(UUID id) {

        log.info("Restoring customer | id={}", id);
        customerRepository.findByIdIncludingDeleted(id).orElseThrow(() -> new ResourceNotFoundException(String.format(CUSTOMER_NOT_FOUND, id)));
        if (!customerRepository.existsById(id)) {
            throw new BusinessException("Customer with id '" + id + "' is not deleted.");
        }
        int updated = customerRepository.restoreById(id);

        if (updated == 0) {
            throw new BusinessException("Failed to restore customer with id '" + id + "'.");
        }
        log.info("Customer restored | id={}", id);

        Customer restored = customerRepository.findById(id).orElseThrow(() -> new IllegalStateException("Customer restored but not found"));
        return customerMapper.toDto(restored);
    }

    @Override
    public CustomerMergeResponse mergeCustomerInto(UUID sourceCustomerId, UUID targetCustomerId) {

        if (sourceCustomerId.equals(targetCustomerId)) {
            throw new BusinessException("Source and target customer must be different");
        }

        getCustomerOrThrow(sourceCustomerId);
        getCustomerOrThrow(targetCustomerId);

        log.info("Merging customer {} into {}", sourceCustomerId, targetCustomerId);

        ReassignCustomerResponse result = orderServiceClient.replaceCustomer(sourceCustomerId, targetCustomerId);

        if (result == null || result.affectedOrders() == 0) {
            throw new BusinessException("No orders were reassigned");
        }

        customerDeletionService.forceDelete(sourceCustomerId);

        log.info("Customer merged successfully | source={} target={} ordersMoved?{}", sourceCustomerId, targetCustomerId, result.affectedOrders());
        return new CustomerMergeResponse(sourceCustomerId, targetCustomerId, result.affectedOrders());
    }

    @Override
    public java.util.List<CustomerResponse> search(String searchTerm) {
        log.debug("Searching customers | term={}", searchTerm);
        return customerRepository.searchByTerm(searchTerm).stream()
                .map(customerMapper::toDto)
                .toList();
    }

    // =========================
    // PRIVATE HELPERS
    // =========================
    private Customer getCustomerOrThrow(UUID id) {
        return customerRepository.findById(id).orElseThrow(() -> new IllegalArgumentException(String.format(CUSTOMER_NOT_FOUND, id)));
    }

    private void deleteLog(String status, UUID id) {

        if (DELETING.equals(status)) {
            log.info(DELETING, id);
        } else {
            log.info(DELETED, id);
        }
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        return trimmed;
    }
}
