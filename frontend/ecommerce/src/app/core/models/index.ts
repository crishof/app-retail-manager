// =========================================================
// CORE MODELS — RetailManager Ecommerce
// =========================================================

export type StockStatus = 'inStock' | 'lowStock' | 'outOfStock';
export type ProductTag  = 'deal' | 'new' | 'topSeller' | 'featured' | 'outlet';

export interface Product {
  id:        string;
  slug:      string;
  emoji:     string;
  brand:     string;
  name:      string;
  desc:      string;
  price:     number;
  oldPrice:  number | null;
  discount:  number;
  rating:    number;
  reviews:   number;
  stock:     StockStatus;
  tags:      ProductTag[];
  category:  string;
  imageUrl?: string;
}

export interface CartItem {
  id:       string;
  name:     string;
  brand:    string;
  price:    number;
  emoji:    string;
  qty:      number;
  imageUrl?: string;
}

export interface Brand {
  name:   string;
  emoji:  string;
  count?: number;
  slug?:  string;
}

export interface NewsItem {
  id?:     string;
  cat:     string;
  emoji:   string;
  title:   string;
  date:    string;
  slug?:   string;
  imageUrl?: string;
}

export interface Tenant {
  id:    string;
  name:  string;
  color: string;
  icon:  string;
}

export interface Category {
  slug:  string;
  name:  string;
  emoji: string;
  count: number;
}

export interface CheckoutAddress {
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
  address:   string;
  city:      string;
  zip:       string;
  country:   string;
}

export interface CheckoutState {
  step:         number;
  address:      Partial<CheckoutAddress>;
  shippingMethod: 'standard' | 'express' | 'pickup';
  paymentMethod:  'card' | 'paypal' | 'aplazame' | 'bizum' | 'transfer';
}

export interface Toast {
  id:      number;
  message: string;
  type:    'success' | 'error' | 'info';
}

export interface FilterState {
  brands:       string[];
  priceMax:     number;
  availability: string[];
  ratingMin:    number;
  types:        string[];
  onlyDeals:    boolean;
  onlyOutlet:   boolean;
}
