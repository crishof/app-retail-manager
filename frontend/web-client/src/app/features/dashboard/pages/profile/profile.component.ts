import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../../../core/auth/auth.store';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Page Header -->
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Mi perfil</h1>
        <p class="text-gray-600 mt-2">Gestiona la información y preferencias de tu cuenta</p>
      </div>

      <!-- Profile Info Card -->
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Información de la Cuenta</h2>

        @if (store.currentUser()) {
          <div class="space-y-6">
            <!-- Avatar Section -->
            <div class="flex items-center gap-6">
              <div class="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                 <span class="text-3xl font-bold text-white">
                   {{ (store.currentUser()?.firstName || 'U').charAt(0).toUpperCase() }}
                 </span>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-600 mb-2">Foto de Perfil</p>
                <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                  Subir Foto
                </button>
              </div>
            </div>

            <div class="border-t border-gray-200"></div>

            <!-- User Details Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="md:col-span-2">
                 <label class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                 <p class="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                   {{ store.currentUser()?.firstName || 'N/A' }}
                 </p>
              </div>
              <div class="md:col-span-2">
                 <label class="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                 <p class="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                   {{ store.currentUser()?.lastName || 'N/A' }}
                 </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <p class="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                  {{ store.currentUser()?.email || 'N/A' }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                <p class="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                  {{ store.currentUser()?.companyName || 'N/A' }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <p class="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                  {{ roleLabel[store.currentUser()?.role || 'USER'] || 'Usuario' }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Creación</label>
                <p class="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                  {{ store.currentUser()?.createdAt ? (store.currentUser()?.createdAt | date: 'MMM d, yyyy') : 'N/A' }}
                </p>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Security Section -->
      <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Seguridad</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Contraseña</p>
              <p class="text-sm text-gray-600">Cambia tu contraseña regularmente</p>
            </div>
            <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
              Cambiar Contraseña
            </button>
          </div>
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Autenticación de Dos Factores</p>
              <p class="text-sm text-gray-600">Agrega una capa extra de seguridad</p>
            </div>
            <button class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg cursor-not-allowed text-sm font-medium" disabled>
              Próximamente
            </button>
          </div>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="bg-red-50 border border-red-200 rounded-lg p-8">
        <h2 class="text-xl font-bold text-red-900 mb-6">Zona de Peligro</h2>
        <p class="text-sm text-red-800 mb-4">
          Eliminar tu cuenta es permanente y no se puede deshacer. Todos tus datos serán eliminados.
        </p>
        <button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium">
          Eliminar Cuenta
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class ProfileComponent {
  store = inject(AuthStore);

  readonly roleLabel: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Manager',
    USER: 'Usuario',
  };
}
