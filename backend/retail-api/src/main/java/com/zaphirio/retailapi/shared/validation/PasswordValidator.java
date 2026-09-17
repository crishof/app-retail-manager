package com.zaphirio.retailapi.shared.validation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Slf4j
@Component
public class PasswordValidator {
    
    // Min 12 chars, at least 1 upper, 1 lower, 1 digit, 1 special char (@$!%*?&)
    private static final Pattern PASSWORD_PATTERN = 
        Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$");
    
    /**
     * Validates password against security requirements:
     * - Minimum 12 characters
     * - At least one uppercase letter
     * - At least one lowercase letter
     * - At least one digit
     * - At least one special character (@$!%*?&)
     */
    public boolean isValid(String password) {
        if (password == null || password.length() < 12) {
            log.warn("Password validation failed: length < 12");
            return false;
        }
        
        boolean valid = PASSWORD_PATTERN.matcher(password).matches();
        if (!valid) {
            log.warn("Password validation failed: missing required character types");
        }
        return valid;
    }
    
    /**
     * Returns user-friendly password requirements
     */
    public String getRequirements() {
        return "Password must be 12+ characters with uppercase, lowercase, digit, and special character (@$!%*?&)";
    }
}
