package com.zaphirio.retailapi.auth.service;


import com.zaphirio.retailapi.auth.dto.*;
import com.zaphirio.retailapi.auth.security.principal.SecurityUser;

import java.util.UUID;

public interface AuthService {

    SignupResponse signup(SignupRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(String refreshToken);

    AuthResponse verifyEmail(VerifyEmailRequest request);

    AuthResponse acceptInvite(AcceptInviteRequest request);

    InviteInfoResponse getInvitationInfo(String token);

    void resendEmailVerificationCode(String email);

    void forgotPassword(String email);

    void resetPassword(ResetPasswordRequest request);

    void logout(String refreshToken);

    void logoutAll(UUID userId);

    AuthMeResponse me(SecurityUser securityUser);

    InvitationResponse createInvitation(CreateInvitationRequest request);
}
