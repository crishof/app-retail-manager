package com.crishof.customersv.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SoftDelete;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tbl_customers", indexes = {@Index(name = "idx_customer_dni", columnList = "dni"),})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SoftDelete
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(nullable = false, length = 100)
    private String lastname;
    @Column(unique = true, length = 20)
    private String dni;
    @Column(length = 20)
    private String taxId;
    @Column(length = 150)
    private String email;
    @Column(length = 30)
    private String phone;

    private UUID addressId;

    @Column(name = "deleted", insertable = false, updatable = false)
    private boolean deleted;

    @Column(name = "deleted_at", insertable = false, updatable = false)
    private Instant deletedAt;
}
