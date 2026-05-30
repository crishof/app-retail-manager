package com.zaphirio.retailapi.shared.audit;

import com.zaphirio.retailapi.shared.persistence.TenantAwareRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for document versions.
 *
 * Manages all versions of documents, enabling version history tracking
 * and rollback capabilities.
 */
@Repository
public interface DocumentVersionRepository extends TenantAwareRepository<DocumentVersion, UUID> {

    /**
     * Find all versions of a document.
     *
     * @param tenantId The tenant ID
     * @param documentType Type of document
     * @param documentId ID of the document
     * @return List of versions ordered by version number (ascending)
     */
    List<DocumentVersion> findByTenantIdAndDocumentTypeAndDocumentIdOrderByVersionNumberAsc(
            Long tenantId, String documentType, String documentId
    );

    /**
     * Find the current (latest) version of a document.
     *
     * @param tenantId The tenant ID
     * @param documentType Type of document
     * @param documentId ID of the document
     * @return The current version, if it exists
     */
    Optional<DocumentVersion> findByTenantIdAndDocumentTypeAndDocumentIdAndIsCurrentVersionTrue(
            Long tenantId, String documentType, String documentId
    );

    /**
     * Find the finalized version of a document.
     *
     * @param tenantId The tenant ID
     * @param documentType Type of document
     * @param documentId ID of the document
     * @return The finalized version, if it exists
     */
    Optional<DocumentVersion> findByTenantIdAndDocumentTypeAndDocumentIdAndIsFinalizedVersionTrue(
            Long tenantId, String documentType, String documentId
    );

    /**
     * Find a specific version by version number.
     *
     * @param tenantId The tenant ID
     * @param documentType Type of document
     * @param documentId ID of the document
     * @param versionNumber Version number to find
     * @return The version if it exists
     */
    Optional<DocumentVersion> findByTenantIdAndDocumentTypeAndDocumentIdAndVersionNumber(
            Long tenantId, String documentType, String documentId, Integer versionNumber
    );

    /**
     * Count total versions for a document.
     *
     * @param tenantId The tenant ID
     * @param documentType Type of document
     * @param documentId ID of the document
     * @return Number of versions
     */
    Integer countByTenantIdAndDocumentTypeAndDocumentId(
            Long tenantId, String documentType, String documentId
    );
}
