import { Component, inject, ChangeDetectionStrategy } from "@angular/core";

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AuthStore } from "../../../../core/auth/auth.store";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Page Header -->
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
        <p class="text-gray-600 mt-2">
          Administra la configuración de tu cuenta, preferencias y opciones de privacidad
        </p>
      </div>

      <!-- Notification Settings -->
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Notificaciones</h2>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div>
              <p class="font-medium text-gray-900">Notificaciones por correo</p>
              <p class="text-sm text-gray-600">
                Recibe actualizaciones sobre tu cuenta
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
              ></div>
            </label>
          </div>

          <div
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div>
              <p class="font-medium text-gray-900">Alertas de facturas</p>
              <p class="text-sm text-gray-600">
                Recibe notificaciones cuando se creen o actualicen facturas
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
              ></div>
            </label>
          </div>

          <div
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div>
              <p class="font-medium text-gray-900">Alertas de bajo stock</p>
              <p class="text-sm text-gray-600">
                Recibe notificaciones cuando los productos estén bajos en stock
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
              ></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Privacy Settings -->
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Privacidad</h2>
        <div class="space-y-4">
          <div
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div>
              <p class="font-medium text-gray-900">Visibilidad del perfil</p>
              <p class="text-sm text-gray-600">
                Permitir que otros vean tu perfil
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
              ></div>
            </label>
          </div>

          <div
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div>
              <p class="font-medium text-gray-900">Estado de actividad</p>
              <p class="text-sm text-gray-600">Mostrar cuando estás en línea</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
              ></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Language & Region -->
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Idioma y Región</h2>
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Idioma</label
            >
            <select
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>English</option>
              <option>Español</option>
              <option>Português</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Zona horaria</label
            >
            <select
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>UTC+1 (España)</option>
              <option>UTC-3 (Argentina)</option>
              <option>UTC-5 (Colombia)</option>
              <option>UTC-6 (México)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Display Settings -->
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Pantalla</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3"
              >Tema</label
            >
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked
                  class="w-4 h-4"
                />
                <span class="text-gray-700">Claro</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="theme" value="dark" class="w-4 h-4" />
                <span class="text-gray-700">Oscuro</span>
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
        <button
          class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          Cancel
        </button>
        <button
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class SettingsComponent {
  store = inject(AuthStore);
}
