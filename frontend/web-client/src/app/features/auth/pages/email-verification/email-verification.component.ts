import { Component, inject, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md bg-white rounded-lg shadow-xl p-8 space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900">Verify Email</h1>
          <p class="text-gray-600 mt-2">Enter the 6-digit code sent to your email</p>
        </div>

        <!-- Error Alert -->
        @if (store.error()) {
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-700 font-medium">{{ store.error() }}</p>
          </div>
        }

        <!-- Verification Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Email Display -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              [value]="email"
              disabled
              class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
            />
            <p class="text-xs text-gray-500 mt-1">{{ email }}</p>
          </div>

          <!-- Verification Code -->
          <div>
            <label for="code" class="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              id="code"
              formControlName="code"
              type="text"
              maxlength="6"
              placeholder="000000"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
            />
            @if (form.get('code')?.invalid && form.get('code')?.touched) {
              <p class="text-xs text-red-600 mt-1">Code must be 6 digits</p>
            }
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="store.isLoading() || form.invalid"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (store.isLoading()) {
              <span class="inline-block animate-spin">⏳</span>
              <span>Verifying...</span>
            } @else {
              <span>Verify Email</span>
            }
          </button>
        </form>

        <!-- Resend Link -->
        <div class="text-center">
          <p class="text-sm text-gray-600">
            Didn't receive the code?
            <button
              (click)="resendCode()"
              [disabled]="store.isLoading()"
              class="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              Resend
            </button>
          </p>
        </div>

        <!-- Back to Signup -->
        <p class="text-center">
          <a
            routerLink="/landing/signup"
            class="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Back to Sign Up
          </a>
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class EmailVerificationComponent implements OnInit {
  form!: FormGroup;
  store = inject(AuthStore);
  email = '';

  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    // Get email from route query params
    this.email = this.route.snapshot.queryParams['email'] || '';
    
    if (!this.email) {
      this.store.setError('No email provided. Please start the signup process again.');
      return;
    }

    // Initialize form
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  onSubmit(): void {
    if (!this.form.valid || !this.email) {
      return;
    }

    this.authService.verifyEmail(this.email, this.form.get('code')?.value).subscribe({
      next: () => {
        // Redirect to login after successful verification
        this.router.navigate(['/landing/login'], {
          queryParams: { email: this.email }
        });
      },
      error: (error) => {
        console.error('Email verification error:', error);
      }
    });
  }

  resendCode(): void {
    if (!this.email) {
      this.store.setError('Email address not found.');
      return;
    }

    this.authService.resendVerification(this.email).subscribe({
      next: () => {
        this.store.setError(''); // Clear error
        this.form.reset();
        // Show success message
        alert('Verification code resent to ' + this.email);
      },
      error: (error) => {
        console.error('Resend verification error:', error);
      }
    });
  }
}
