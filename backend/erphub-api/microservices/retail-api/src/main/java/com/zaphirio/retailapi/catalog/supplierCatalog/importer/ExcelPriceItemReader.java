package com.zaphirio.retailapi.catalog.supplierCatalog.importer;

import com.zaphirio.retailapi.catalog.supplierCatalog.dto.ColumnHeaderSuggestion;
import com.zaphirio.retailapi.catalog.supplierCatalog.exception.ImportFileException;
import com.zaphirio.retailapi.catalog.supplierCatalog.model.SupplierPriceItem;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.EncryptedDocumentException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Component
@Slf4j
public class ExcelPriceItemReader {

    private static final int MAX_LENGTH = 255;
    private static final BigDecimal DEFAULT_TAX_RATE = new BigDecimal("0.21");
    private static final String DEFAULT_CURRENCY = "$";
    private static final List<String> REQUIRED_HEADERS = List.of("brand", "model", "code");
    private static final int MAX_HEADER_SCAN_ROWS = 120;
    private static final int MIN_HEADER_COLUMNS = 2;
    private static final Map<String, String> HEADER_ALIASES = buildHeaderAliases();
    private static final Set<String> KNOWN_ATTRIBUTES = Set.of(
            "brand", "code", "model", "description", "category",
            "price", "tax-rate", "suggested-price", "suggested-web-price",
            "stock", "barcode", "currency", "internal-tax"
    );

    public List<SupplierPriceItem> read(MultipartFile file) {
        log.info("Reading excel file: {}", file.getOriginalFilename());
        try (InputStream is = file.getInputStream()) {
            return readFromStream(is);
        } catch (IOException e) {
            log.error("Failed to read excel file", e);
            throw new ImportFileException("Error reading excel file");
        }
    }

    public List<SupplierPriceItem> read(InputStream is, String filename) {
        log.info("Reading excel file: {}", filename);
        try {
            return readFromStream(is);
        } catch (IOException e) {
            log.error("Failed to read excel file", e);
            throw new ImportFileException("Error reading excel file");
        }
    }

    public List<ColumnHeaderSuggestion> readHeaderSuggestions(MultipartFile file) {
        log.info("Reading headers from excel file: {}", file.getOriginalFilename());
        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            HeaderDetectionResult header = detectHeaderRow(sheet, Map.of());
            List<ColumnHeaderSuggestion> suggestions = new ArrayList<>();

            for (String rawHeader : header.rawHeaders()) {
                String canonical = canonicalHeader(rawHeader);
                String suggested = KNOWN_ATTRIBUTES.contains(canonical) ? canonical : null;
                suggestions.add(new ColumnHeaderSuggestion(rawHeader, suggested));
            }

            return suggestions;
        } catch (IOException | EncryptedDocumentException e) {
            log.error("Failed to read excel headers", e);
            throw new ImportFileException("Error leyendo los encabezados del archivo Excel");
        }
    }

    public List<SupplierPriceItem> readWithMapping(MultipartFile file, Map<String, String> customMapping) {
        log.info("Reading excel file with custom mapping: {}", file.getOriginalFilename());
        try (InputStream is = file.getInputStream()) {
            return readFromStreamWithMapping(is, customMapping);
        } catch (IOException e) {
            log.error("Failed to read excel file with mapping", e);
            throw new ImportFileException("Error reading excel file");
        }
    }

    private List<SupplierPriceItem> readFromStream(InputStream is) throws IOException {
        try (Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() < 2) {
                throw new ImportFileException("Excel file has no data rows");
            }

            HeaderDetectionResult header = detectHeaderRow(sheet, Map.of());
            List<String> headers = canonicalizeHeaders(header.rawHeaders());
            validateHeaders(headers);
            return parseRows(sheet, headers, header.rowIndex());

        } catch (IOException | EncryptedDocumentException e) {
            log.error("Failed to read excel file", e);
            throw new ImportFileException("Error reading excel file");
        }
    }

    private List<SupplierPriceItem> readFromStreamWithMapping(InputStream is, Map<String, String> customMapping)
            throws IOException {
        try (Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() < 2) {
                throw new ImportFileException("El archivo Excel no contiene filas de datos");
            }

            HeaderDetectionResult header = detectHeaderRow(sheet, customMapping);
            List<String> mappedHeaders = resolveMappedHeaders(header.rawHeaders(), customMapping);
            validateHeaders(mappedHeaders);
            return parseRows(sheet, mappedHeaders, header.rowIndex());

        } catch (IOException | EncryptedDocumentException e) {
            log.error("Failed to read excel file with mapping", e);
            throw new ImportFileException("Error reading excel file");
        }
    }

    private List<String> canonicalizeHeaders(List<String> rawHeaders) {
        List<String> headers = new ArrayList<>();
        for (String rawHeader : rawHeaders) {
            headers.add(canonicalHeader(rawHeader));
        }
        return headers;
    }

    private List<String> resolveMappedHeaders(List<String> rawHeaders, Map<String, String> customMapping) {
        List<String> resolved = new ArrayList<>();
        for (String rawHeader : rawHeaders) {
            String attribute = canonicalHeader(rawHeader);
            if (customMapping != null && customMapping.containsKey(rawHeader)) {
                List<String> mappedTargets = parseMappedTargets(customMapping.get(rawHeader));
                if (!mappedTargets.isEmpty()) {
                    attribute = String.join("|", mappedTargets);
                }
            }
            resolved.add(attribute);
        }

        return resolved;
    }

    private void validateHeaders(List<String> headers) {
        Set<String> headerSet = new HashSet<>();
        for (String header : headers) {
            headerSet.addAll(parseMappedTargets(header));
        }

        if (!headerSet.containsAll(REQUIRED_HEADERS)) {
            List<String> missing = REQUIRED_HEADERS.stream()
                    .filter(required -> !headerSet.contains(required))
                    .toList();
            throw new ImportFileException(
                    "Missing required columns. Required: " + REQUIRED_HEADERS + " | Missing: " + missing
            );
        }
    }

    private List<SupplierPriceItem> parseRows(Sheet sheet, List<String> headers, int headerRowIndex) {
        List<SupplierPriceItem> items = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        FormulaEvaluator evaluator = sheet.getWorkbook().getCreationHelper().createFormulaEvaluator();

        for (int i = headerRowIndex + 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) {
                continue;
            }

            if (isEmptyRow(row, headers.size(), formatter, evaluator)) {
                continue;
            }

            SupplierPriceItem item = new SupplierPriceItem();
            parseRow(row, headers, formatter, evaluator, item);
            applyDefaults(item);
            item.setLastUpdate(Instant.now());

            // Validate required fields before adding
            if (isValidItem(item, i + 1)) {
                items.add(item);
            } else {
                log.warn("Skipping invalid row {} (missing required fields)", i + 1);
            }
        }

        return items;
    }

    private void parseRow(Row row, List<String> headers, DataFormatter formatter, FormulaEvaluator evaluator, SupplierPriceItem item) {
        for (int col = 0; col < headers.size(); col++) {
            Cell cell = row.getCell(col);
            String value = formatter.formatCellValue(cell, evaluator).trim();
            List<String> targets = parseMappedTargets(headers.get(col));
            for (String target : targets) {
                applyCell(item, target, value);
            }
        }
    }

    private List<String> parseMappedTargets(String rawMapping) {
        if (rawMapping == null || rawMapping.isBlank()) {
            return List.of();
        }

        return List.of(rawMapping.split("[|,]"))
                .stream()
                .map(String::trim)
                .filter(v -> !v.isBlank())
                .map(this::canonicalHeader)
                .filter(KNOWN_ATTRIBUTES::contains)
                .distinct()
                .toList();
    }

    private HeaderDetectionResult detectHeaderRow(Sheet sheet, Map<String, String> customMapping) {
        DataFormatter formatter = new DataFormatter();
        int firstRow = Math.max(0, sheet.getFirstRowNum());
        int lastRow = Math.min(sheet.getLastRowNum(), firstRow + MAX_HEADER_SCAN_ROWS);

        HeaderDetectionResult best = null;
        int bestScore = Integer.MIN_VALUE;

        for (int rowIndex = firstRow; rowIndex <= lastRow; rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                continue;
            }

            List<String> rawHeaders = extractRawHeaders(row, formatter);
            if (rawHeaders.size() < MIN_HEADER_COLUMNS) {
                continue;
            }

            int score = scoreHeaderRow(rawHeaders, customMapping);
            if (score > bestScore) {
                bestScore = score;
                best = new HeaderDetectionResult(rowIndex, rawHeaders);
            }
        }

        if (best == null) {
            throw new ImportFileException("No se pudo detectar una fila de encabezados válida en el Excel");
        }

        log.info(
                "Detected header row | rowIndex={} | columnCount={} | headers={}",
                best.rowIndex(),
                best.rawHeaders().size(),
                summarizeHeaders(best.rawHeaders())
        );
        return best;
    }

    private String summarizeHeaders(List<String> rawHeaders) {
        if (rawHeaders == null || rawHeaders.isEmpty()) {
            return "[]";
        }

        int maxHeadersToLog = 40;
        List<String> safeHeaders = rawHeaders.stream()
                .limit(maxHeadersToLog)
                .map(h -> h == null ? "" : h.replaceAll("\\s+", " ").trim())
                .toList();

        if (rawHeaders.size() > maxHeadersToLog) {
            return safeHeaders + " ... (" + rawHeaders.size() + " total)";
        }
        return safeHeaders.toString();
    }

    private List<String> extractRawHeaders(Row row, DataFormatter formatter) {
        List<String> rawHeaders = new ArrayList<>();
        int lastCellNum = row.getLastCellNum();
        if (lastCellNum <= 0) {
            return rawHeaders;
        }

        for (int col = 0; col < lastCellNum; col++) {
            Cell cell = row.getCell(col);
            String raw = formatter.formatCellValue(cell).trim();
            if (!raw.isBlank()) {
                rawHeaders.add(raw);
            }
        }
        return rawHeaders;
    }

    private int scoreHeaderRow(List<String> rawHeaders, Map<String, String> customMapping) {
        int knownMatches = 0;
        int requiredMatches = 0;
        int mappingMatches = 0;
        int longTextPenalty = 0;
        int numericPenalty = 0;

        Set<String> canonicalSeen = new HashSet<>();
        Set<String> mappingKeys = customMapping == null ? Set.of() : customMapping.keySet();

        for (String raw : rawHeaders) {
            String canonical = canonicalHeader(raw);
            if (KNOWN_ATTRIBUTES.contains(canonical)) {
                knownMatches++;
            }
            if (REQUIRED_HEADERS.contains(canonical)) {
                requiredMatches++;
            }
            if (!mappingKeys.isEmpty() && mappingKeys.contains(raw)) {
                mappingMatches++;
            }

            canonicalSeen.add(canonical);

            if (raw.length() > 45) {
                longTextPenalty++;
            }
            if (isMostlyNumeric(raw)) {
                numericPenalty++;
            }
        }

        // Peso fuerte a coincidencias explícitas de mapping y alias conocidos.
        return (mappingMatches * 60)
                + (knownMatches * 20)
                + (requiredMatches * 15)
                + (canonicalSeen.size() * 2)
                + rawHeaders.size()
                - (longTextPenalty * 6)
                - (numericPenalty * 8);
    }

    private boolean isEmptyRow(Row row, int maxColumns, DataFormatter formatter, FormulaEvaluator evaluator) {
        for (int col = 0; col < maxColumns; col++) {
            Cell cell = row.getCell(col);
            if (!formatter.formatCellValue(cell, evaluator).trim().isBlank()) {
                return false;
            }
        }
        return true;
    }

    private boolean isValidItem(SupplierPriceItem item, int rowNum) {
        // Validate required fields: brand, model, code (supplier_code)
        if (item.getBrand() == null || item.getBrand().isBlank()) {
            log.debug("Row {}: Missing brand", rowNum);
            return false;
        }
        if (item.getModel() == null || item.getModel().isBlank()) {
            log.debug("Row {}: Missing model", rowNum);
            return false;
        }
        if (item.getSupplierCode() == null || item.getSupplierCode().isBlank()) {
            log.debug("Row {}: Missing supplier code", rowNum);
            return false;
        }
        return true;
    }

    private boolean isMostlyNumeric(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        String normalized = value.replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
        String stripped = normalized.replaceAll("[0-9.,%$€£+-]", "");
        return !normalized.isBlank() && stripped.length() <= 1;
    }

    private record HeaderDetectionResult(int rowIndex, List<String> rawHeaders) {
    }

    private void applyCell(SupplierPriceItem item, String header, String value) {
        // Sanitize formulas before processing
        value = sanitizeExcelFormula(value);
        
        switch (header) {
            case "brand" -> item.setBrand(emptyToNull(value));
            case "code" -> item.setSupplierCode(emptyToNull(value));
            case "model" -> item.setModel(emptyToNull(value));
            case "description" -> item.setDescription(truncate(value));
            case "category" -> item.setCategory(emptyToNull(value));
            case "price" -> item.setPrice(parseBigDecimal(value));
            case "tax-rate" -> item.setTaxRate(parseTaxRate(value));
            case "internal-tax" -> item.setInternalTax(parseTaxRate(value));
            case "suggested-price" -> item.setSuggestedPrice(parseBigDecimal(value));
            case "suggested-web-price" -> item.setSuggestedWebPrice(parseBigDecimal(value));
            case "stock" -> {
                String normalizedStock = truncateField(value, 50);
                // Si hay columnas duplicadas mapeadas a stock, conserva el primer valor no vacío
                // para priorizar el dato crudo del proveedor (ej. STK) sobre columnas derivadas.
                if (item.getStockRaw() == null || item.getStockRaw().isBlank()) {
                    item.setStockRaw(normalizedStock);
                }
            }
            case "barcode" -> item.setBarcode(emptyToNull(value));
            case "currency" -> item.setCurrency(emptyToNull(value));
            default -> log.debug("Skipping unmapped column: {}", header);
        }
    }

    private void applyDefaults(SupplierPriceItem item) {
        if (item.getCurrency() == null) {
            item.setCurrency(DEFAULT_CURRENCY);
        }
        if (item.getTaxRate() == null) {
            item.setTaxRate(DEFAULT_TAX_RATE);
        }
        if (item.getPrice() == null) {
            item.setPrice(BigDecimal.ZERO);
        }
    }

    private String emptyToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }

    private String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() > MAX_LENGTH ? value.substring(0, MAX_LENGTH) : value;
    }

    private String truncateField(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        if (value.length() > maxLength) {
            log.warn("Field value exceeds max length {} (got {}), truncating: {}", maxLength, value.length(), value);
            return value.substring(0, maxLength);
        }
        return value;
    }

    private String sanitizeExcelFormula(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        
        String trimmed = value.trim();
        // Detect Excel formulas: start with = or +
        if (trimmed.startsWith("=") || trimmed.startsWith("+")) {
            log.warn("Excel formula detected (not evaluated), treating as empty: {}", trimmed);
            return null;
        }
        
        return value;
    }

    private BigDecimal parseBigDecimal(String raw) {
        if (raw == null || raw.isBlank()) {
            return BigDecimal.ZERO;
        }

        String cleaned = raw.replaceAll("[^0-9,.-]", "").trim();
        if (cleaned.isBlank()) {
            return BigDecimal.ZERO;
        }
        
        // Detect format: European vs US numeric format
        int commaCount = (int) cleaned.chars().filter(ch -> ch == ',').count();
        int dotCount = (int) cleaned.chars().filter(ch -> ch == '.').count();
        int lastCommaIndex = cleaned.lastIndexOf(",");
        int lastDotIndex = cleaned.lastIndexOf(".");
        
        // Case 1: Both dots and commas (e.g., 2.731.840,50 or 2.731,8)
        // European: comma is decimal, dots are thousand separators
        if (dotCount > 0 && commaCount > 0 && lastCommaIndex > lastDotIndex) {
            cleaned = cleaned.replace(".", "");
            cleaned = cleaned.replace(",", ".");
        }
        // Case 2: Multiple dots, no commas (e.g., 2.731.840 = 2 million 731 thousand 840)
        // European format: all dots are thousand separators, remove them all
        else if (dotCount >= 2 && commaCount == 0) {
            cleaned = cleaned.replace(".", "");
        }
        // Case 3: Dot further right than comma (e.g., 2,731.84)
        // US format: comma is thousand separator, dot is decimal
        else if (dotCount > 0 && commaCount > 0 && lastDotIndex > lastCommaIndex) {
            cleaned = cleaned.replace(",", "");
        }
        // Case 4: Multiple commas, no dots (e.g., 2,731,840,50)
        // European format: replace all commas with empty except last one
        else if (commaCount >= 2 && dotCount == 0) {
            int lastComma = cleaned.lastIndexOf(",");
            cleaned = cleaned.substring(0, lastComma).replace(",", "") + "." + cleaned.substring(lastComma + 1);
        }
        // Case 5: Single comma, no dot
        else if (commaCount == 1 && dotCount == 0) {
            // Heuristic: if comma is 1-3 chars from end, it's likely decimal
            if (cleaned.length() - lastCommaIndex <= 3) {
                cleaned = cleaned.replace(",", ".");
            } else {
                cleaned = cleaned.replace(",", "");
            }
        }
        // Case 6: Single dot, no comma
        else if (dotCount == 1 && commaCount == 0) {
            // Heuristic: if dot is 1-3 chars from end, it's likely decimal
            if (cleaned.length() - lastDotIndex <= 3) {
                // Keep as is (decimal)
            } else {
                // Likely European thousand separator, remove it
                cleaned = cleaned.replace(".", "");
            }
        }
        // Default: remove commas if any
        else if (commaCount > 0) {
            cleaned = cleaned.replace(",", "");
        }

        try {
            return new BigDecimal(cleaned);
        } catch (NumberFormatException _) {
            log.warn("Invalid numeric value '{}', defaulting to 0", raw);
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal parseTaxRate(String raw) {
        if (raw == null || raw.isBlank()) {
            return DEFAULT_TAX_RATE;
        }

        boolean isPercentage = raw.contains("%");
        String normalized = raw.replace("%", "").replace(",", ".").trim();

        try {
            BigDecimal rate = new BigDecimal(normalized);
            // Accept both formats: "21%"/"21" and decimal "0.21".
            if (isPercentage || rate.compareTo(BigDecimal.ONE) > 0) {
                return rate.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            }
            return rate;

        } catch (NumberFormatException _) {
            log.warn("Invalid tax rate '{}', defaulting to {}", raw, DEFAULT_TAX_RATE);
            return DEFAULT_TAX_RATE;
        }
    }

    private String canonicalHeader(String rawHeader) {
        String normalized = normalizeHeader(rawHeader);
        return HEADER_ALIASES.getOrDefault(normalized, normalized);
    }

    private String normalizeHeader(String rawHeader) {
        if (rawHeader == null) {
            return "";
        }

        return Normalizer.normalize(rawHeader, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase()
                .trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "")
                .replaceAll("-{2,}", "-");
    }

    private static Map<String, String> buildHeaderAliases() {
        Map<String, String> aliases = new HashMap<>();

        aliases.put("brand", "brand");
        aliases.put("marca", "brand");

        aliases.put("code", "code");
        aliases.put("codigo", "code");
        aliases.put("cod", "code");
        aliases.put("supplier-code", "code");
        aliases.put("codigo-proveedor", "code");

        aliases.put("model", "model");
        aliases.put("modelo", "model");

        aliases.put("description", "description");
        aliases.put("descripcion", "description");

        aliases.put("category", "category");
        aliases.put("categoria", "category");

        aliases.put("price", "price");
        aliases.put("precio", "price");
        aliases.put("precio-lista", "price");
        aliases.put("precio-final", "price");

        aliases.put("tax-rate", "tax-rate");
        aliases.put("tax", "tax-rate");
        aliases.put("iva", "tax-rate");
        aliases.put("impuesto", "tax-rate");
        aliases.put("alicuota", "tax-rate");

        aliases.put("internal-tax", "internal-tax");
        aliases.put("i-i", "internal-tax");
        aliases.put("ii", "internal-tax");
        aliases.put("impuesto-interno", "internal-tax");
        aliases.put("impuesto-int", "internal-tax");
        aliases.put("percepcion-interna", "internal-tax");

        aliases.put("suggested-price", "suggested-price");
        aliases.put("precio-sugerido", "suggested-price");

        aliases.put("suggested-web-price", "suggested-web-price");
        aliases.put("precio-web", "suggested-web-price");
        aliases.put("precio-sugerido-web", "suggested-web-price");

        aliases.put("stock", "stock");
        aliases.put("stk", "stock");
        aliases.put("disponibilidad", "stock");
        aliases.put("stock-disponible", "stock");

        aliases.put("barcode", "barcode");
        aliases.put("codigo-barras", "barcode");
        aliases.put("ean", "barcode");
        aliases.put("ean13", "barcode");
        aliases.put("upc", "barcode");

        aliases.put("currency", "currency");
        aliases.put("moneda", "currency");

        return Collections.unmodifiableMap(aliases);
    }
}
