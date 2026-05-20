package com.crishof.salessv.service;

import com.crishof.salessv.apiClient.InventoryClient;
import com.crishof.salessv.apiClient.StockMovementRequest;
import com.crishof.salessv.dto.*;
import com.crishof.salessv.exception.SaleNotFoundException;
import com.crishof.salessv.model.Sale;
import com.crishof.salessv.model.SaleItem;
import com.crishof.salessv.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SaleServiceImpl implements SaleService {

    private final SaleRepository saleRepository;
    private final InventoryClient inventoryClient;

    @Override
    public List<SaleResponse> getAll() {
        return saleRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public SaleResponse getById(UUID id) {
        return saleRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new SaleNotFoundException(id));
    }

    @Override
    @Transactional
    public SaleResponse save(SaleRequest request) {
        Sale sale = toSale(request);
        sale.getItems().forEach(item -> item.setSale(sale));
        Sale saved = saleRepository.save(sale);

        // Descontar stock en inventario para cada item de la venta.
        if (request.getInvoiceItemsRequest() != null) {
            request.getInvoiceItemsRequest().forEach(item -> {
                inventoryClient.registerMovement(StockMovementRequest.builder()
                        .productId(item.getId())
                        .branchId(request.getBranchId())
                        .locationId(request.getLocationId())
                        .quantity(-item.getQuantity())
                        .reason("INVOICE") // Debe coincidir con el enum de inventory-sv
                        .referenceId(saved.getId())
                        .build());
            });
        }

        return toResponse(saved);
    }

    @Override
    public List<SaleResponse> getByCustomerId(UUID customerId) {
        return saleRepository.findAllByCustomerIdOrderBySaleDateDesc(customerId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<SaleResponse> getByBranchId(UUID branchId) {
        return saleRepository.findAllByBranchIdOrderBySaleDateDesc(branchId)
                .stream().map(this::toResponse).toList();
    }

    // ── Private mappers ──────────────────────────────────────────────────────

    private String formatSaleNumber(String prefix, String number) {
        if (prefix == null || number == null) return null;
        try {
            return String.format("%04d", Integer.parseInt(prefix))
                    + "-" + String.format("%08d", Integer.parseInt(number));
        } catch (NumberFormatException e) {
            return prefix + "-" + number;
        }
    }

    private Sale toSale(SaleRequest req) {
        return Sale.builder()
                .customerId(req.getCustomerId())
                .branchId(req.getBranchId())
                .locationId(req.getLocationId())
                .saleDate(req.getInvoiceDate())
                .saleType(req.getInvoiceType())
                .saleNumber(formatSaleNumber(req.getInvoicePrefix(), req.getInvoiceNumber()))
                .items(req.getInvoiceItemsRequest() == null ? List.of() :
                        req.getInvoiceItemsRequest().stream().map(this::toItem).toList())
                .subtotal1(req.getSubtotal1())
                .discount(req.getDiscount())
                .interest(req.getInterest())
                .subtotal2(req.getSubtotal2())
                .netValue0(req.getNetValue0())
                .netValue105(req.getNetValue105())
                .netValue21(req.getNetValue21())
                .netValue27(req.getNetValue27())
                .vat105(req.getVat105())
                .vat21(req.getVat21())
                .vat27(req.getVat27())
                .internalTax(req.getInternalTax())
                .withholdingVat(req.getWithholdingVat())
                .withholdingSuss(req.getWithholdingSuss())
                .withholdingGrossReceiptsTax(req.getWithholdingGrossReceiptsTax())
                .withholdingIncome(req.getWithholdingIncome())
                .stateTax(req.getStateTax())
                .localTax(req.getLocalTax())
                .rounding(req.getRounding())
                .totalPrice(req.getTotalPrice())
                .observations(req.getObservations())
                .build();
    }

    private SaleItem toItem(SaleItemRequest req) {
        return SaleItem.builder()
                .productId(req.getId())
                .price(req.getPrice())
                .quantity(req.getQuantity())
                .discountRate(req.getDiscountRate())
                .taxRate(req.getTaxRate())
                .build();
    }

    private SaleItemResponse toItemResponse(SaleItem item) {
        return SaleItemResponse.builder()
                .productId(item.getProductId())
                .price(item.getPrice())
                .quantity(item.getQuantity())
                .discountRate(item.getDiscountRate())
                .taxRate(item.getTaxRate())
                .build();
    }

    private SaleResponse toResponse(Sale sale) {
        return SaleResponse.builder()
                .id(sale.getId())
                .customerId(sale.getCustomerId())
                .branchId(sale.getBranchId())
                .locationId(sale.getLocationId())
                .saleDate(sale.getSaleDate())
                .saleType(sale.getSaleType())
                .saleNumber(sale.getSaleNumber())
                .items(sale.getItems().stream().map(this::toItemResponse).toList())
                .subtotal1(sale.getSubtotal1())
                .discount(sale.getDiscount())
                .interest(sale.getInterest())
                .subtotal2(sale.getSubtotal2())
                .netValue0(sale.getNetValue0())
                .netValue105(sale.getNetValue105())
                .netValue21(sale.getNetValue21())
                .netValue27(sale.getNetValue27())
                .vat105(sale.getVat105())
                .vat21(sale.getVat21())
                .vat27(sale.getVat27())
                .internalTax(sale.getInternalTax())
                .withholdingVat(sale.getWithholdingVat())
                .withholdingSuss(sale.getWithholdingSuss())
                .withholdingGrossReceiptsTax(sale.getWithholdingGrossReceiptsTax())
                .withholdingIncome(sale.getWithholdingIncome())
                .stateTax(sale.getStateTax())
                .localTax(sale.getLocalTax())
                .rounding(sale.getRounding())
                .totalPrice(sale.getTotalPrice())
                .observations(sale.getObservations())
                .build();
    }
}
