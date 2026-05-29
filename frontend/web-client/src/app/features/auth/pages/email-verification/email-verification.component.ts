import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md bg-white rounded-lg shadow-xl p-8 space-y-8">
        <!-- Success State -->
        @if (verificationStatus === 'success') {
          <div class="text-center">
            <div class="flex justify-center mb-4">
              <div class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">Email Verified!</h1>
            <p class="text-gray-600 mt-2">Your email has been successfully verified.</p>
            
            <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-700">
                You will be redirected to the login page in a few seconds...
              </p>
            </div>

            <button
              (click)="redirectToLogin()"
              class="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Go to Sign In
            </button>
          </div>
        }

        <!-- Loading State -->
        @if (verificationStatus === 'loading') {
          <div class="text-center">
            <div class="flex justify-center mb-4">
              <div class="inline-flex items-center justify-center h-16 w-16">
                <div class="animate-spin">
                  <svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mt-4">Verifying...</h1>
            <p class="text-gray-600 mt-2">Please wait while we verify your email.</p>
          </div>
        }

        <!-- Error State -->
        @if (verificationStatus === 'error') {
          <div class="text-center">
            <div class="flex justify-center mb-4">
              <div class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">Verification Failed</h1>
            <p class="text-gray-600 mt-2">{{ errorMessage }}</p>
            
            <div class="mt-6 space-y-3">
              <button
                (click)="requestNewLink()"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Request New Verification Link
              </button>
              <a
                routerLink="/landing/signup"
                class="block w-full text-center text-blue-600 hover:text-blue-800 font-medium text-sm py-2"
              >
                Back to Sign Up
              </a>
            </div>
          </div>
        }

        <!-- Expired State -->
        @if (verificationStatus === 'expired') {
          <div class="text-center">
            <div class="flex justify-center mb-4">
              <div class="inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
                <svg class="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">Link Expired</h1>
            <p class="text-gray-600 mt-2">Your verification link has expired. Please request a new one.</p>
            
            <div class="mt-6">
              <button
                (click)="requestNewLink()"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Request New Verification Link
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class EmailVerificationComponent implements OnInit {
  store = inject(AuthStore);
  verificationStatus: 'loading' | 'success' | 'error' | 'expired' = 'loading';
  errorMessage = '';

  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];
    
    if (!token) {
      this.verificationStatus = 'error';
      this.errorMessage = 'No verification token provided.';
      return;
    }

    this.verifyEmail(token);
  }

  private verifyEmail(token: string): void {
    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.verificationStatus = 'success';
        setTimeout(() => this.redirectToLogin(), 3000);
      },
      error: (error) => {
        if (error.error?.code === 'VERIFICATION_LINK_EXPIRED') {
          this.verificationStatus = 'expired';
        } else {
          this.verificationStatus = 'error';
          this.errorMessage = error.error?.message || 'Email verification failed. Please try again.';
        }
      }
    });
  }

  redirectToLogin(): void {
    this.router.navigate(['/landing/login']);
  }

  requestNewLink(): void {
    // This would typically navigate to a resend verification page
    // or show a modal to input the email again
    this.router.navigate(['/landing/signup']);
  }
}
