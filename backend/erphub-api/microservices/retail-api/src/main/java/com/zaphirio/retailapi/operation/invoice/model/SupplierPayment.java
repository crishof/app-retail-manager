package com.zaphirio.retailapi.operation.invoice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "tbl_supplier_payment")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SupplierPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID supplierId;
    private UUID branchId;

    private LocalDate paymentDate;
    private double amount;
    private String paymentMethod;
    private String reference;
    private String description;
}
