import { Component, inject, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md bg-white rounded-lg shadow-xl p-8 space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p class="text-gray-600 mt-2">Enter your email to receive a password reset link</p>
        </div>

        <!-- Success Message -->
        @if (showSuccessMessage) {
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-sm text-green-700 font-medium">
              ✓ If an account exists with that email, you will receive a password reset link shortly.
            </p>
          </div>
        }

        <!-- Error Alert -->
        @if (store.error()) {
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-700 font-medium">{{ store.error() }}</p>
          </div>
        }

        <!-- Password Recovery Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" [hidden]="showSuccessMessage" class="space-y-6">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              formControlName="email"
              type="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="you@example.com"
              [class.border-red-400]="form.get('email')?.invalid && form.get('email')?.touched"
            />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <p class="text-xs text-red-600 mt-1">
                @if (form.get('email')?.errors?.['required']) {
                  Email is required
                } @else if (form.get('email')?.errors?.['email']) {
                  Please enter a valid email
                }
              </p>
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
              <span>Sending...</span>
            } @else {
              <span>Send Reset Link</span>
            }
          </button>
        </form>

        <!-- Back Link -->
        <div class="text-center pt-4 border-t border-gray-200">
          <p>
            <a routerLink="/landing/login" class="text-blue-600 hover:text-blue-800 font-medium text-sm">
              Back to Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PasswordRecoveryComponent implements OnInit {
  form!: FormGroup;
  store = inject(AuthStore);
  showSuccessMessage = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      return;
    }

    this.store.setIsLoading(true);
    this.store.clearError();

    this.authService.requestPasswordReset(this.form.value.email).subscribe({
      next: () => {
        this.store.setIsLoading(false);
        this.showSuccessMessage = true;
        
        // Auto-redirect to login after 5 seconds
        setTimeout(() => {
          this.router.navigate(['/landing/login']);
        }, 5000);
      },
      error: () => {
        this.store.setIsLoading(false);
      }
    });
  }
}
