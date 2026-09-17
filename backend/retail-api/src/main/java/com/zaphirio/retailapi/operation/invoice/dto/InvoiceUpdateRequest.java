package com.zaphirio.retailapi.operation.invoice.dto;

import com.zaphirio.retailapi.operation.invoice.model.InvoiceItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InvoiceUpdateRequest {
    private UUID branchId;
    private UUID locationId;
    private List<InvoiceItem> invoiceItems;
}
