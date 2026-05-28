package com.zaphirio.retailapi.auth.controller;

import com.zaphirio.retailapi.auth.dto.AcceptInviteRequest;
import com.zaphirio.retailapi.auth.dto.AuthResponse;
import com.zaphirio.retailapi.auth.dto.InviteInfoResponse;
import com.zaphirio.retailapi.auth.service.AuthService;
import com.zaphirio.retailapi.auth.util.ValidationUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for invitation-related operations.
 * Groups endpoints for invitation preview and acceptance.
 */
@RestController
@RequestMapping("/api/v1/invitations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Invitations", description = "Endpoints for managing user invitations")
public class InvitationsController {

    private final AuthService authService;

    /**
     * Returns invitation details without accepting it.
     * Allows users to validate the invitation before completing signup.
     *
     * @param token invitation token
     * @return invitation details
     */
    @GetMapping("/{token}/info")
    @Operation(
            summary = "Get invitation info",
            description = "Returns invitation details without accepting it."
    )
    public ResponseEntity<InviteInfoResponse> getInvitationInfo(
            @PathVariable String token) {
        log.debug("Getting invitation info for token: {}", token);
        InviteInfoResponse info = authService.getInvitationInfo(token);
        return ResponseEntity.ok(info);
    }

    /**
     * Accepts an invitation and creates a user account.
     * Sets email, full name, role, and password in a single flow.
     *
     * @param request invitation acceptance payload
     * @return authentication tokens
     */
    @PostMapping("/accept")
    @Operation(
            summary = "Accept invitation",
            description = "Accepts an invitation token and creates a user account with the provided details."
    )
    public ResponseEntity<AuthResponse> acceptInvitation(
            @Valid @RequestBody AcceptInviteRequest request) {
        log.info("Accepting invitation for email: {}", request.email());

        ValidationUtil.validateEmail(request.email());
        ValidationUtil.validatePassword(request.password());

        AuthResponse response = authService.acceptInvite(request);
        return ResponseEntity.ok(response);
    }
}
