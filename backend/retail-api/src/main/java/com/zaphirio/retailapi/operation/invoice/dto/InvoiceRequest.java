package com.zaphirio.retailapi.operation.invoice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvoiceRequest {

    @NotNull(message = "El ID del proveedor es requerido")
    private UUID supplierId;

    @NotBlank(message = "La ubicación no puede estar vacía")
    private String location;

    @NotNull(message = "El ID de la rama es requerido")
    private UUID branchId;

    @NotNull(message = "El ID de la ubicación es requerido")
    private UUID locationId;

    @NotNull(message = "La fecha de factura es requerida")
    private LocalDate invoiceDate;

    @NotNull(message = "La fecha de vencimiento es requerida")
    private LocalDate dueDate;

    private LocalDate receptionDate;
    private LocalDate savedDate;

    @NotBlank(message = "El tipo de factura es requerido")
    private String invoiceType;

    @NotBlank(message = "El prefijo de factura es requerido")
    private String invoicePrefix;

    @NotBlank(message = "El número de factura es requerido")
    private String invoiceNumber;

    private String packingListPrefix;
    private String packingListNumber;

    @NotEmpty(message = "Debe incluir al menos un artículo en la factura")
    @Valid
    private List<InvoiceItemRequest> invoiceItemsRequest;

    private List<OtherConceptRequest> otherConceptsRequest;

    @NotNull(message = "saveStocks no puede ser nulo")
    private boolean saveStocks;

    @NotNull(message = "taxSave no puede ser nulo")
    private boolean taxSave;

    @NotNull(message = "fixedAsset no puede ser nulo")
    private boolean fixedAsset;

    @NotNull(message = "askForPriceUpdate no puede ser nulo")
    private boolean askForPriceUpdate;

    private String currency;

    private String observations;

    @DecimalMin(value = "0.0", message = "El subtotal1 debe ser mayor o igual a 0")
    private double subtotal1;

    @DecimalMin(value = "0.0", message = "El descuento debe ser mayor o igual a 0")
    private Double discount;

    @DecimalMin(value = "0.0", message = "El interés debe ser mayor o igual a 0")
    private double interest;

    @DecimalMin(value = "0.0", message = "El subtotal2 debe ser mayor o igual a 0")
    private double subtotal2;

    @DecimalMin(value = "0.0", message = "netValue21 debe ser mayor o igual a 0")
    private double netValue21;

    @DecimalMin(value = "0.0", message = "vat21 debe ser mayor o igual a 0")
    private double vat21;

    @DecimalMin(value = "0.0", message = "netValue105 debe ser mayor o igual a 0")
    private double netValue105;

    @DecimalMin(value = "0.0", message = "vat105 debe ser mayor o igual a 0")
    private double vat105;

    @DecimalMin(value = "0.0", message = "netValue27 debe ser mayor o igual a 0")
    private double netValue27;

    @DecimalMin(value = "0.0", message = "vat27 debe ser mayor o igual a 0")
    private double vat27;

    @DecimalMin(value = "0.0", message = "netValue0 debe ser mayor o igual a 0")
    private double netValue0;

    @DecimalMin(value = "0.0", message = "internalTax debe ser mayor o igual a 0")
    private double internalTax;

    @DecimalMin(value = "0.0", message = "withholdingVat debe ser mayor o igual a 0")
    private double withholdingVat;

    @DecimalMin(value = "0.0", message = "withholdingSuss debe ser mayor o igual a 0")
    private double withholdingSuss;

    @DecimalMin(value = "0.0", message = "withholdingGrossReceiptsTax debe ser mayor o igual a 0")
    private double withholdingGrossReceiptsTax;

    @DecimalMin(value = "0.0", message = "withholdingIncome debe ser mayor o igual a 0")
    private double withholdingIncome;

    @DecimalMin(value = "0.0", message = "stateTax debe ser mayor o igual a 0")
    private double stateTax;

    @DecimalMin(value = "0.0", message = "localTax debe ser mayor o igual a 0")
    private double localTax;

    @DecimalMin(value = "0.0", message = "El redondeo debe ser mayor o igual a 0")
    private double rounding;

    @DecimalMin(value = "0.0", message = "El precio total debe ser mayor o igual a 0")
    private double totalPrice;

    @Override
    public String toString() {
        return "InvoiceRequest {\n" +
                "  supplierId=" + supplierId + ",\n" +
                "  location='" + location + "',\n" +
                "  branchId=" + branchId + ",\n" +
                "  locationId=" + locationId + ",\n" +
                "  invoiceDate=" + invoiceDate + ",\n" +
                "  dueDate=" + dueDate + ",\n" +
                "  receptionDate=" + receptionDate + ",\n" +
                "  savedDate=" + savedDate + ",\n" +
                "  invoiceType='" + invoiceType + "',\n" +
                "  invoicePrefix='" + invoicePrefix + "',\n" +
                "  invoiceNumber='" + invoiceNumber + "',\n" +
                "  packingListPrefix='" + packingListPrefix + "',\n" +
                "  packingListNumber='" + packingListNumber + "',\n" +
                "  invoiceItemsRequest=" + invoiceItemsRequest + ",\n" +
                "  saveStocks=" + saveStocks + ",\n" +
                "  taxSave=" + taxSave + ",\n" +
                "  fixedAsset=" + fixedAsset + ",\n" +
                "  askForPriceUpdate=" + askForPriceUpdate + ",\n" +
                "  observations='" + observations + "',\n" +
                "  subtotal1=" + subtotal1 + ",\n" +
                "  discount=" + discount + ",\n" +
                "  interest=" + interest + ",\n" +
                "  subtotal2=" + subtotal2 + ",\n" +
                "  netValue21=" + netValue21 + ",\n" +
                "  vat21=" + vat21 + ",\n" +
                "  netValue105=" + netValue105 + ",\n" +
                "  vat105=" + vat105 + ",\n" +
                "  netValue27=" + netValue27 + ",\n" +
                "  vat27=" + vat27 + ",\n" +
                "  netValue0=" + netValue0 + ",\n" +
                "  internalTax=" + internalTax + ",\n" +
                "  withholdingVat=" + withholdingVat + ",\n" +
                "  withholdingSuss=" + withholdingSuss + ",\n" +
                "  withholdingGrossReceiptsTax=" + withholdingGrossReceiptsTax + ",\n" +
                "  withholdingIncome=" + withholdingIncome + ",\n" +
                "  stateTax=" + stateTax + ",\n" +
                "  localTax=" + localTax + ",\n" +
                "  rounding=" + rounding + ",\n" +
                "  totalPrice=" + totalPrice + "\n" +
                '}';
    }
}