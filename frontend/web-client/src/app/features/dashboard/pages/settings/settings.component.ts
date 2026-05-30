import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Page Header -->
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
        <p class="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      <!-- Notification Settings -->
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Notifications</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Email Notifications</p>
              <p class="text-sm text-gray-600">Receive updates about your account</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Invoice Alerts</p>
              <p class="text-sm text-gray-600">Get notified when invoices are created or updated</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Low Stock Alerts</p>
              <p class="text-sm text-gray-600">Be notified when products are running low</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Privacy Settings -->
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Privacy</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Profile Visibility</p>
              <p class="text-sm text-gray-600">Allow others to see your profile</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Activity Status</p>
              <p class="text-sm text-gray-600">Show when you're online</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Language & Region -->
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Language & Region</h2>
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>English</option>
              <option>Español</option>
              <option>Português</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>UTC-3 (Argentina)</option>
              <option>UTC-5 (Colombia)</option>
              <option>UTC-6 (Mexico)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Display Settings -->
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Display</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Theme</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="theme" value="light" checked class="w-4 h-4" />
                <span class="text-gray-700">Light</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="theme" value="dark" class="w-4 h-4" />
                <span class="text-gray-700">Dark</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="theme" value="auto" class="w-4 h-4" />
                <span class="text-gray-700">Auto</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end gap-4">
        <button class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
          Cancel
        </button>
        <button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
          Save Changes
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class SettingsComponent {
  store = inject(AuthStore);
}
