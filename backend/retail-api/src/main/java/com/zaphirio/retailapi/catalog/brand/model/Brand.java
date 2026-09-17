package com.zaphirio.retailapi.catalog.brand.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SoftDelete;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tbl_brands", indexes = {@Index(name = "idx_brand_name", columnList = "name")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SoftDelete
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "deleted", insertable = false, updatable = false)
    private boolean deleted;

    @Column(name = "deleted_at", insertable = false, updatable = false)
    private Instant deletedAt;

    @Column(name = "tenant_id", nullable = true)
    private Long tenantId;

}