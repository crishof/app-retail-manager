package com.crishof.branchsv.util;

import lombok.experimental.UtilityClass;

/**
 * Utility class for validating Argentine business identifiers and formats.
 */
@UtilityClass
public class ArgentineValidator {

    /**
     * Validates CUIT format (Argentine company tax ID).
     * Format: XX-XXXXXXXX-X (e.g., 20-12345678-9)
     * @param cuit CUIT to validate
     * @return true if CUIT format is valid
     */
    public static boolean isValidCuitFormat(String cuit) {
        if (cuit == null || cuit.isBlank()) {
            return false;
        }
        return cuit.matches("^\\d{2}-\\d{8}-\\d$");
    }

    /**
     * Validates CUIT with Luhn algorithm check digit.
     * @param cuit CUIT to validate
     * @return true if CUIT format and check digit are valid
     */
    public static boolean isValidCuit(String cuit) {
        if (!isValidCuitFormat(cuit)) {
            return false;
        }

        // Remove dashes: XX-XXXXXXXX-X -> XXXXXXXXXXX
        String digitsOnly = cuit.replaceAll("-", "");

        // Extract check digit (last digit)
        int checkDigit = Character.getNumericValue(digitsOnly.charAt(10));

        // Calculate Luhn check digit
        int calculatedCheckDigit = calculateCuitCheckDigit(digitsOnly.substring(0, 10));

        return checkDigit == calculatedCheckDigit;
    }

    /**
     * Calculates CUIT check digit using Luhn algorithm variant for Argentina.
     * @param cuitBase first 10 digits of CUIT
     * @return calculated check digit
     */
    private static int calculateCuitCheckDigit(String cuitBase) {
        int[] multipliers = {5, 4, 3, 2, 7, 6, 5, 4, 3, 2};
        int sum = 0;

        for (int i = 0; i < 10; i++) {
            int digit = Character.getNumericValue(cuitBase.charAt(i));
            sum += digit * multipliers[i];
        }

        int remainder = sum % 11;
        return (11 - remainder) % 11;
    }

    /**
     * Validates punto de venta (sales point number).
     * Must be a positive number between 1 and 9999.
     * @param pointOfSale point of sale number
     * @return true if valid
     */
    public static boolean isValidPointOfSale(int pointOfSale) {
        return pointOfSale > 0 && pointOfSale <= 9999;
    }

    /**
     * Formats punto de venta as 4-digit string with leading zeros.
     * @param pointOfSale point of sale number
     * @return formatted string (e.g., "0004")
     */
    public static String formatPointOfSale(int pointOfSale) {
        return String.format("%04d", pointOfSale);
    }

    /**
     * Validates email format.
     * @param email email to validate
     * @return true if email format is valid
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return email.matches("^[A-Za-z0-9+_.-]+@(.+)$");
    }
}
