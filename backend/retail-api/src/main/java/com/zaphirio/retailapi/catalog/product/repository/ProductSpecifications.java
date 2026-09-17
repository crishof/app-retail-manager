package com.zaphirio.retailapi.catalog.product.repository;

import com.zaphirio.retailapi.catalog.product.model.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class ProductSpecifications {

    private ProductSpecifications() {
        // Private constructor to prevent instantiation
    }

    public static Specification<Product> filter(
            UUID brandId,
            UUID categoryId,
            UUID supplierId,
            Boolean highlighted,
            Boolean published,
            String search
    ) {
        return (root, _, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (brandId != null)
                predicates.add(cb.equal(root.get("brandId"), brandId));

            if (categoryId != null)
                predicates.add(cb.equal(root.get("categoryId"), categoryId));

            if (supplierId != null)
                predicates.add(cb.equal(root.get("supplierId"), supplierId));

            if (highlighted != null)
                predicates.add(cb.equal(root.get("highlighted"), highlighted));

            if (published != null)
                predicates.add(cb.equal(root.get("published"), published));

            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(
                        cb.or(
                                cb.like(cb.lower(root.get("brandName")), like),
                                cb.like(cb.lower(root.get("model")), like),
                                cb.like(cb.lower(root.get("description")), like)
                        )
                );
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}