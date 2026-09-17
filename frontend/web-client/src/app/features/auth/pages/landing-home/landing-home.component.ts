import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <!-- Navigation -->
      <nav class="fixed top-0 w-full bg-white/95 backdrop-blur shadow-sm z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div class="text-2xl font-bold text-blue-600">RetailManager</div>
          <div class="space-x-4">
            <a routerLink="/landing/login" class="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium">
              Sign In
            </a>
            <a routerLink="/landing/signup" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Manage Your Retail Business
            <span class="text-blue-600"> Effortlessly</span>
          </h1>
          
          <p class="text-xl text-gray-600 mb-8 leading-relaxed">
            RetailManager is a modern, intuitive ERP system designed for retail businesses.
            Manage inventory, sales, suppliers, and analytics all in one place.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a routerLink="/landing/signup" class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg transition">
              Start Free Trial
            </a>
            <a href="#features" class="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium text-lg transition">
              Learn More
            </a>
          </div>

          <!-- Hero Image Placeholder -->
          <div class="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg h-96 flex items-center justify-center">
            <div class="text-6xl">📦</div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-4xl font-bold text-center text-gray-900 mb-16">Powerful Features</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Feature 1 -->
            <div class="p-8 bg-white rounded-lg shadow hover:shadow-lg transition">
              <div class="text-5xl mb-4">📊</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Analytics Dashboard</h3>
              <p class="text-gray-600">
                Real-time insights into your sales, inventory, and business metrics. Make data-driven decisions with ease.
              </p>
            </div>

            <!-- Feature 2 -->
            <div class="p-8 bg-white rounded-lg shadow hover:shadow-lg transition">
              <div class="text-5xl mb-4">📦</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Inventory Management</h3>
              <p class="text-gray-600">
                Track stock levels, manage suppliers, and automate inventory operations across multiple branches.
              </p>
            </div>

            <!-- Feature 3 -->
            <div class="p-8 bg-white rounded-lg shadow hover:shadow-lg transition">
              <div class="text-5xl mb-4">💰</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Sales Management</h3>
              <p class="text-gray-600">
                Create invoices, manage customers, track payments, and generate reports effortlessly.
              </p>
            </div>

            <!-- Feature 4 -->
            <div class="p-8 bg-white rounded-lg shadow hover:shadow-lg transition">
              <div class="text-5xl mb-4">🔒</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Security</h3>
              <p class="text-gray-600">
                Enterprise-grade security with role-based access control, data encryption, and audit logs.
              </p>
            </div>

            <!-- Feature 5 -->
            <div class="p-8 bg-white rounded-lg shadow hover:shadow-lg transition">
              <div class="text-5xl mb-4">🌐</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Multi-branch Support</h3>
              <p class="text-gray-600">
                Manage multiple branches from a single dashboard with real-time synchronization.
              </p>
            </div>

            <!-- Feature 6 -->
            <div class="p-8 bg-white rounded-lg shadow hover:shadow-lg transition">
              <div class="text-5xl mb-4">🚀</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Always Available</h3>
              <p class="text-gray-600">
                Cloud-based platform accessible from anywhere, anytime, on any device.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div class="max-w-4xl mx-auto text-center text-white">
          <h2 class="text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p class="text-xl mb-8 opacity-90">
            Join hundreds of retail businesses already using RetailManager
          </p>
          <a routerLink="/landing/signup" class="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-bold text-lg transition">
            Start Your Free Trial Today
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-gray-900 text-gray-400 py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-6xl mx-auto text-center">
          <p>&copy; 2026 RetailManager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `,
  styles: []
})
export class LandingHomeComponent {}
