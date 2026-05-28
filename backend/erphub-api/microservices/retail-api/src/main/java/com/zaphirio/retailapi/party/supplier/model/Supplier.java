package com.zaphirio.retailapi.party.supplier.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SoftDelete;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tbl_suppliers", indexes = {@Index(name = "idx_supplier_tax_id", columnList = "taxId")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SoftDelete
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String taxId;

    private String legalName;

    private UUID addressId;

    @Column(name = "deleted", insertable = false, updatable = false)
    private boolean deleted;

    @Column(name = "deleted_at", insertable = false, updatable = false)
    private Instant deletedAt;
}
