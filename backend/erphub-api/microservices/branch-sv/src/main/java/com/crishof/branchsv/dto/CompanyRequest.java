package com.crishof.branchsv.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CompanyRequest {

    @NotBlank(message = "El nombre de la empresa es obligatorio")
    @Size(max = 100, message = "El nombre no debe exceder 100 caracteres")
    private String name;

    @NotBlank(message = "El CUIT es obligatorio")
    @Pattern(regexp = "^\\d{2}-\\d{8}-\\d$", message = "El CUIT debe tener formato XX-XXXXXXXX-X")
    private String cuit;

    @NotBlank(message = "La posición IVA es obligatoria")
    @Size(max = 50, message = "La posición IVA no debe exceder 50 caracteres")
    private String ivaStatus;

    private LocalDate startOfActivities;

    @Size(max = 20, message = "El número de ingresos brutos no debe exceder 20 caracteres")
    private String grossIncomeNumber;

    @NotBlank(message = "La razón social es obligatoria")
    @Size(max = 100, message = "La razón social no debe exceder 100 caracteres")
    private String legalName;

    @Email(message = "El email debe ser válido")
    @Size(max = 150, message = "El email no debe exceder 150 caracteres")
    private String email;

    @Size(max = 20, message = "El teléfono no debe exceder 20 caracteres")
    private String phone;

    @Size(max = 255, message = "El sitio web no debe exceder 255 caracteres")
    private String website;

    @Builder.Default
    private boolean active = true;
}
