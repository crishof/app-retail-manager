import { Component, inject, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md bg-white rounded-lg shadow-xl p-8 space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900">Sign In</h1>
          <p class="text-gray-600 mt-2">Welcome back to RetailManager</p>
        </div>

        <!-- Error Alert -->
        @if (store.error()) {
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-700 font-medium">{{ store.error() }}</p>
          </div>
        }

        <!-- Login Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
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

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              formControlName="password"
              type="password"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
              [class.border-red-400]="form.get('password')?.invalid && form.get('password')?.touched"
            />
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <p class="text-xs text-red-600 mt-1">Password is required</p>
            }
          </div>

          <!-- Remember Me -->
          <div class="flex items-center">
            <input
              id="remember"
              formControlName="rememberMe"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="remember" class="ml-2 text-sm text-gray-600">
              Remember me
            </label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="store.isLoading() || form.invalid"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (store.isLoading()) {
              <span class="inline-block animate-spin">⏳</span>
              <span>Signing in...</span>
            } @else {
              <span>Sign In</span>
            }
          </button>
        </form>

        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">New to RetailManager?</span>
          </div>
        </div>

        <!-- Links -->
        <div class="space-y-2 text-center">
          <p>
            <a routerLink="/landing/signup" class="text-blue-600 hover:text-blue-800 font-medium text-sm">
              Create an account
            </a>
          </p>
          <p>
            <a routerLink="/landing/password-recovery" class="text-gray-600 hover:text-gray-800 text-sm">
              Forgot your password?
            </a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  store = inject(AuthStore);

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      return;
    }

    this.store.setIsLoading(true);
    this.store.clearError();

    this.authService.login(
      this.form.value.email,
      this.form.value.password
    ).subscribe({
      next: () => {
        this.store.setIsLoading(false);
        
        // Get return URL from query params or default to dashboard
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        this.router.navigate([returnUrl || '/dashboard']);
      },
      error: () => {
        this.store.setIsLoading(false);
      }
    });
  }
}
