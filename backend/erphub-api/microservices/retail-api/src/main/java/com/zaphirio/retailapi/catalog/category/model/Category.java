package com.zaphirio.retailapi.catalog.category.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
        name = "tbl_categories",
        indexes = {
                @Index(name = "idx_category_parent", columnList = "parent_id"),
                @Index(name = "idx_category_slug", columnList = "slug", unique = true)
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String slug;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;
    @OneToMany(mappedBy = "parent")
    private List<Category> children = new ArrayList<>();

    private Integer level; //0=root, 1=child, 2=grandchild
    private Boolean leaf;

    @Column(name = "image_url")
    private String imageUrl;

    @PrePersist
    public void prePersist() {
        if (level == null) level = parent == null ? 0 : parent.getLevel() + 1;
        if (leaf == null) leaf = true;
    }
}
