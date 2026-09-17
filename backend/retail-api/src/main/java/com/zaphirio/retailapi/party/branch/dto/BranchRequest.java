package com.zaphirio.retailapi.party.branch.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BranchRequest {

    @NotNull(message = "El ID de la empresa es obligatorio")
    private UUID companyId;

    @NotBlank(message = "El código es obligatorio")
    @Size(max = 20, message = "El código no debe exceder 20 caracteres")
    private String code;

    @NotBlank(message = "El nombre es obligatorio")
    private String name;

    private String address;

    @Size(max = 100, message = "La localidad no debe exceder 100 caracteres")
    private String locality;

    @Size(max = 10, message = "El código postal no debe exceder 10 caracteres")
    private String postalCode;

    @Size(max = 100, message = "El país no debe exceder 100 caracteres")
    private String country;

    @Size(max = 20, message = "El teléfono no debe exceder 20 caracteres")
    private String phone;

    @Email(message = "El email debe ser válido")
    @Size(max = 150, message = "El email no debe exceder 150 caracteres")
    private String email;

    @Size(max = 255, message = "El sitio web no debe exceder 255 caracteres")
    private String website;

    @NotNull(message = "El punto de venta es obligatorio")
    @Min(value = 1, message = "El punto de venta debe ser mayor a 0")
    @Max(value = 9999, message = "El punto de venta no debe exceder 9999")
    private Integer pointOfSale;

    @Builder.Default
    private boolean active = true;
}

