package com.zaphirio.retailapi.operation.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvoiceItemRequest {

    @NotNull(message = "El ID del producto es requerido")
    private UUID id;

    @NotNull(message = "La cantidad es requerida")
    @Positive(message = "La cantidad debe ser un número positivo")
    private Integer quantity;

    @NotNull(message = "El precio es requerido")
    @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a 0")
    private Double price;

    @NotNull(message = "La tasa de impuesto es requerida")
    @DecimalMin(value = "0.0", message = "La tasa de impuesto no puede ser negativa")
    private Double taxRate;

    @NotNull(message = "La tasa de descuento es requerida")
    @DecimalMin(value = "0.0", message = "La tasa de descuento no puede ser negativa")
    private Double discountRate;

}
