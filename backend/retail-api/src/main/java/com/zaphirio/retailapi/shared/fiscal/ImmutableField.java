package com.zaphirio.retailapi.shared.fiscal;

import java.lang.annotation.*;

/**
 * Marks a field as immutable after entity finalization.
 *
 * Used in conjunction with @ImmutableDocument to prevent modification
 * of certain fields once a document (invoice, receipt, etc.) is finalized.
 *
 * This annotation helps enforce fiscal compliance requirements where
 * finalized documents cannot be modified.
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface ImmutableField {

    /**
     * Human-readable description of why this field is immutable.
     *
     * @return Description explaining the immutability reason
     */
    String reason() default "This field cannot be modified after document finalization";

    /**
     * Whether this field can be modified before finalization.
     *
     * @return true if field is mutable before finalization, false if always immutable
     */
    boolean editableBeforeFinalization() default true;
}
