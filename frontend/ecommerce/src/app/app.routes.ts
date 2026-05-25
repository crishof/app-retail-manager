import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./features/catalog/catalog.component').then(m => m.CatalogComponent)
  },
  {
    path: 'catalogo/:category',
    loadComponent: () =>
      import('./features/catalog/catalog.component').then(m => m.CatalogComponent)
  },
  {
    path: 'producto/:slug',
    loadComponent: () =>
      import('./features/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'carrito',
    loadComponent: () =>
      import('./features/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'marcas',
    loadComponent: () =>
      import('./features/brands/brands.component').then(m => m.BrandsComponent)
  },
  {
    path: 'noticias',
    loadComponent: () =>
      import('./features/news/news.component').then(m => m.NewsComponent)
  },
  {
    path: 'favoritos',
    loadComponent: () =>
      import('./features/favorites/favorites.component').then(m => m.FavoritesComponent)
  },
  {
    path: 'cuenta',
    loadComponent: () =>
      import('./features/account/account.component').then(m => m.AccountComponent)
  },
  {
    path: 'pedidos',
    redirectTo: 'cuenta',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
