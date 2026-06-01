import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-md bg-white rounded-lg shadow-xl p-8 space-y-8">
        <!-- Header -->
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900">Create Account</h1>
          <p class="text-gray-600 mt-2">Join RetailManager today</p>
        </div>

        <!-- Error Alert -->
        @if (store.error()) {
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-700 font-medium">{{ store.error() }}</p>
          </div>
        }

        <!-- Signup Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- First Name -->
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              id="firstName"
              formControlName="firstName"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John"
            />
            @if (form.get('firstName')?.invalid && form.get('firstName')?.touched) {
              <p class="text-xs text-red-600 mt-1">First name is required (min 2 characters)</p>
            }
          </div>

          <!-- Last Name -->
          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              id="lastName"
              formControlName="lastName"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Doe"
            />
            @if (form.get('lastName')?.invalid && form.get('lastName')?.touched) {
              <p class="text-xs text-red-600 mt-1">Last name is required (min 2 characters)</p>
            }
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              formControlName="email"
              type="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <p class="text-xs text-red-600 mt-1">Please enter a valid email</p>
            }
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              formControlName="password"
              type="password"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            @if (form.get('password')?.touched) {
              <div class="mt-1 text-xs space-y-1">
                @if (!form.get('password')?.value?.match(/[A-Z]/)) {
                  <p class="text-red-600">✗ At least 1 uppercase letter</p>
                } @else {
                  <p class="text-green-600">✓ Uppercase letter</p>
                }
                
                @if (!form.get('password')?.value?.match(/[a-z]/)) {
                  <p class="text-red-600">✗ At least 1 lowercase letter</p>
                } @else {
                  <p class="text-green-600">✓ Lowercase letter</p>
                }
                
                @if (!form.get('password')?.value?.match(/[0-9]/)) {
                  <p class="text-red-600">✗ At least 1 number</p>
                } @else {
                  <p class="text-green-600">✓ Number</p>
                }
                
                @if (!form.get('password')?.value?.match(/[!@#$%^&*]/)) {
                  <p class="text-red-600">✗ At least 1 special character (!@#$%^&*)</p>
                } @else {
                  <p class="text-green-600">✓ Special character</p>
                }
                
                @if (form.get('password')?.value?.length < 8) {
                  <p class="text-red-600">✗ Minimum 8 characters</p>
                } @else {
                  <p class="text-green-600">✓ 8+ characters</p>
                }
              </div>
            }
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              formControlName="confirmPassword"
              type="password"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            @if (form.get('confirmPassword')?.touched && form.errors?.['passwordMismatch']) {
              <p class="text-xs text-red-600 mt-1">Passwords do not match</p>
            }
          </div>

          <!-- Terms -->
          <div class="flex items-start">
            <input
              id="terms"
              formControlName="acceptTerms"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            />
            <label for="terms" class="ml-2 text-sm text-gray-600">
              I agree to the
              <a href="#" class="text-blue-600 hover:text-blue-800">Terms of Service</a>
              and
              <a href="#" class="text-blue-600 hover:text-blue-800">Privacy Policy</a>
            </label>
          </div>
          @if (form.get('acceptTerms')?.invalid && form.get('acceptTerms')?.touched) {
            <p class="text-xs text-red-600">You must accept the terms</p>
          }

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="store.isLoading() || form.invalid"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (store.isLoading()) {
              <span class="inline-block animate-spin">⏳</span>
              <span>Creating account...</span>
            } @else {
              <span>Create Account</span>
            }
          </button>
        </form>

        <!-- Login Link -->
        <p class="text-center">
          Already have an account?
          <a routerLink="/landing/login" class="text-blue-600 hover:text-blue-800 font-medium">
            Sign In
          </a>
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class SignupComponent implements OnInit {
  form!: FormGroup;
  store = inject(AuthStore);

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    return passwordValid ? null : { weakPassword: true };
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (!password || !confirmPassword) return null;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (!this.form.valid) {
      return;
    }

    this.store.setIsLoading(true);
    this.store.clearError();

    const signupData = {
      firstName: this.form.value.firstName.trim(),
      lastName: this.form.value.lastName.trim(),
      email: this.form.value.email,
      password: this.form.value.password
    };

    this.authService.signup(signupData).subscribe({
      next: () => {
        this.store.setIsLoading(false);
        // Navigate to email verification page
        this.router.navigate(['/landing/email-verification'], {
          queryParams: { email: signupData.email }
        });
      },
      error: () => {
        this.store.setIsLoading(false);
      }
    });
  }
}
