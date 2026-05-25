import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { CATEGORIES, BRANDS, NEWS_ITEMS } from '../../core/data/mock-data';
import { Product } from '../../core/models';

type FeaturedTab = 'trending' | 'bestsellers' | 'new' | 'recommended';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home">

      <!-- HERO -->
      <section class="hero" aria-label="Featured promotion">
        <div class="hero-main">
          <div class="hero-content">
            <span class="hero-eyebrow">Spring Sale 2025 — Limited time</span>
            <h1 class="hero-title">Fender American<br>Professional II Stratocaster</h1>
            <p class="hero-body">Alder body · V-Mod II pickups · Deep "C" neck profile. Made in USA. The choice of professional guitarists worldwide.</p>
            <div class="hero-price-row">
              <span class="hero-price">1.299&nbsp;€</span>
              <span class="hero-price-old">1.499&nbsp;€</span>
              <span class="hero-badge-sale">−13%</span>
            </div>
            <div class="hero-ctas">
              <a routerLink="/producto/fender-am-pro-ii-strat" class="hero-btn-primary">View offer</a>
              <a routerLink="/catalogo/guitarras" class="hero-btn-ghost">See all guitars</a>
            </div>
          </div>
          <div class="hero-img-area" aria-hidden="true">
            <div class="hero-img-placeholder">
              <span class="hero-emoji">🎸</span>
            </div>
          </div>
        </div>
        <div class="hero-side">
          <div class="hero-card hc-green">
            <div class="hc-tag">New arrival</div>
            <div class="hc-title">Gibson ES-335 Studio 2025</div>
            <div class="hc-price-row">
              <span class="hc-from">from</span>
              <span class="hc-price">2.199&nbsp;€</span>
            </div>
          </div>
          <div class="hero-card hc-navy">
            <div class="hc-tag hc-tag-red">Outlet −25%</div>
            <div class="hc-title">Roland Fantom-7 · Ex-demo</div>
            <div class="hc-price-row">
              <span class="hc-from">was 1.899&nbsp;€ · now</span>
              <span class="hc-price">1.424&nbsp;€</span>
            </div>
          </div>
        </div>
      </section>

      <!-- BENEFITS BAR -->
      <div class="benefits-bar" role="list">
        @for (b of benefits; track b.label) {
          <div class="benefit-item" role="listitem">
            <span class="benefit-label">{{ b.label }}</span>
            <span class="benefit-desc">{{ b.desc }}</span>
          </div>
        }
      </div>

      <!-- CATEGORIES -->
      <section aria-labelledby="cats-heading">
        <div class="sec-title">
          <span id="cats-heading">Shop by category</span>
          <a class="sec-link" routerLink="/catalogo">All categories &rsaquo;</a>
        </div>
        <div class="cats-grid">
          @for (cat of categories; track cat.slug) {
            <a class="cat-card" [routerLink]="['/catalogo', cat.slug]" [attr.aria-label]="cat.name">
              <div class="cat-img" aria-hidden="true">
                <span class="cat-emoji">{{ cat.emoji }}</span>
              </div>
              <div class="cat-body">
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-count">{{ cat.count | number }} items</span>
              </div>
            </a>
          }
        </div>
      </section>

      <!-- OUTLET BANNER -->
      <div class="outlet-banner" role="complementary" aria-label="Outlet section">
        <div class="ob-text">
          <div class="ob-label">OUTLET</div>
          <div class="ob-title">Up to 40% off — Ex-demo &amp; refurbished instruments</div>
          <div class="ob-desc">Tested and certified by our technicians &middot; Full warranty included</div>
        </div>
        <a class="ob-btn" routerLink="/catalogo">Browse Outlet</a>
      </div>

      <!-- FEATURED PRODUCTS -->
      <section aria-labelledby="featured-heading">
        <div class="sec-title">
          <span id="featured-heading">Featured products</span>
        </div>
        <div class="tabs-bar" role="tablist">
          @for (tab of tabs; track tab.key) {
            <button
              class="tab-btn"
              role="tab"
              [class.active]="activeTab() === tab.key"
              [attr.aria-selected]="activeTab() === tab.key"
              (click)="setTab(tab.key)"
            >{{ tab.label }}</button>
          }
        </div>
        <div class="products-grid" role="list">
          @for (p of featuredProducts(); track p.id) {
            <div role="listitem">
              <app-product-card [product]="p" />
            </div>
          }
        </div>
      </section>

      <!-- BRANDS -->
      <section aria-labelledby="brands-heading">
        <div class="sec-title">
          <span id="brands-heading">Popular brands</span>
          <a class="sec-link" routerLink="/marcas">All brands &rsaquo;</a>
        </div>
        <div class="brands-grid">
          @for (b of brandsHome; track b.name) {
            <button class="brand-tile" (click)="toastSvc.show('Showing products from ' + b.name)">
              {{ b.name }}
            </button>
          }
        </div>
      </section>

      <!-- NEWSLETTER -->
      <div class="nl-block" role="complementary" aria-label="Newsletter subscription">
        <div class="nl-text">
          <div class="nl-title">Subscribe to our newsletter</div>
          <div class="nl-desc">Exclusive deals, new arrivals and buying guides. No spam. Unsubscribe anytime.</div>
        </div>
        <div class="nl-form">
          <input class="nl-input" type="email" placeholder="your@email.com" aria-label="Email address" #nlEmail>
          <button class="nl-btn" (click)="subscribe(nlEmail.value)">Subscribe</button>
        </div>
      </div>

      <!-- NEWS -->
      <section aria-labelledby="news-heading">
        <div class="sec-title">
          <span id="news-heading">Latest news</span>
          <a class="sec-link" routerLink="/noticias">All articles &rsaquo;</a>
        </div>
        <div class="news-grid">
          @for (n of newsItems; track n.title) {
            <a class="news-card" routerLink="/noticias" [attr.aria-label]="n.title">
              <div class="news-img" aria-hidden="true">
                <span>{{ n.emoji }}</span>
              </div>
              <div class="news-body">
                <div class="news-cat">{{ n.cat }}</div>
                <div class="news-title">{{ n.title }}</div>
                <div class="news-date">{{ n.date }}</div>
              </div>
            </a>
          }
        </div>
      </section>

      <!-- TRUST -->
      <div class="trust-row" role="list">
        @for (t of trustItems; track t.title) {
          <div class="trust-item" role="listitem">
            <div class="trust-title">{{ t.title }}</div>
            <div class="trust-desc">{{ t.desc }}</div>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .home { display: flex; flex-direction: column; gap: 20px; }

    /* ---- HERO ---- */
    .hero {
      display: grid;
      grid-template-columns: 1fr 220px;
      gap: 10px;
      min-height: 220px;
    }
    .hero-main {
      background: #0d1117;
      border-radius: var(--r-2xl);
      overflow: hidden;
      display: grid;
      grid-template-columns: 1fr 200px;
      align-items: center;
    }
    .hero-content {
      padding: 28px 28px 28px 30px;
      color: #fff;
    }
    .hero-eyebrow {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      color: #f59e0b;
      text-transform: uppercase;
      letter-spacing: .8px;
      margin-bottom: 10px;
    }
    .hero-title {
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 800;
      line-height: 1.2;
      color: #fff;
      margin-bottom: 10px;
      letter-spacing: -.4px;
    }
    .hero-body {
      font-size: 13px;
      color: rgba(255,255,255,.65);
      line-height: 1.6;
      margin-bottom: 16px;
      max-width: 380px;
    }
    .hero-price-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 18px;
    }
    .hero-price { font-size: 24px; font-weight: 800; color: #fff; font-family: var(--font-display); }
    .hero-price-old { font-size: 14px; color: rgba(255,255,255,.4); text-decoration: line-through; }
    .hero-badge-sale {
      font-size: 11px;
      font-weight: 700;
      background: #dc2626;
      color: #fff;
      padding: 2px 7px;
      border-radius: var(--r-sm);
    }
    .hero-ctas { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .hero-btn-primary {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 9px 20px;
      border-radius: var(--r-lg);
      font-weight: 600;
      font-size: 13.5px;
      text-decoration: none;
      transition: background var(--t-fast);
    }
    .hero-btn-primary:hover { background: var(--primary-dark); color: #fff; }
    .hero-btn-ghost {
      color: rgba(255,255,255,.6);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      border-bottom: 1px solid rgba(255,255,255,.25);
    }
    .hero-btn-ghost:hover { color: #fff; border-bottom-color: #fff; }
    .hero-img-area {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: rgba(255,255,255,.03);
      border-left: 1px solid rgba(255,255,255,.06);
    }
    .hero-emoji { font-size: 80px; opacity: .7; display: block; }

    /* Side cards */
    .hero-side { display: flex; flex-direction: column; gap: 10px; }
    .hero-card {
      border-radius: var(--r-2xl);
      padding: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #fff;
      min-height: 96px;
    }
    .hc-green { background: #0d3d24; }
    .hc-navy  { background: #0c1a35; }
    .hc-tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .5px;
      background: rgba(255,255,255,.15);
      color: rgba(255,255,255,.85);
      padding: 2px 7px;
      border-radius: var(--r-sm);
      margin-bottom: 6px;
      align-self: flex-start;
    }
    .hc-tag-red { background: #dc2626; color: #fff; }
    .hc-title { font-size: 13px; font-weight: 600; line-height: 1.35; color: rgba(255,255,255,.9); margin-bottom: 10px; }
    .hc-price-row { display: flex; flex-direction: column; gap: 1px; }
    .hc-from { font-size: 10px; color: rgba(255,255,255,.4); }
    .hc-price { font-size: 19px; font-weight: 800; font-family: var(--font-display); }

    /* ---- BENEFITS BAR ---- */
    .benefits-bar {
      background: var(--surface);
      border: 1px solid var(--gray-200);
      border-radius: var(--r-xl);
      display: grid;
      grid-template-columns: repeat(5, 1fr);
    }
    .benefit-item {
      padding: 12px 16px;
      border-right: 1px solid var(--gray-200);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .benefit-item:last-child { border-right: none; }
    .benefit-label { font-size: 13px; font-weight: 600; color: var(--gray-900); }
    .benefit-desc  { font-size: 11.5px; color: var(--gray-500); }

    /* ---- CATEGORIES ---- */
    .cats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }
    .cat-card {
      background: var(--surface);
      border: 1px solid var(--gray-200);
      border-radius: var(--r-xl);
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      transition: border-color var(--t-fast), box-shadow var(--t-fast);
    }
    .cat-card:hover {
      border-color: var(--primary);
      box-shadow: 0 2px 8px rgba(26,107,58,.10);
      color: inherit;
    }
    .cat-img {
      height: 80px;
      background: var(--gray-50);
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid var(--gray-100);
    }
    .cat-emoji { font-size: 32px; opacity: .8; }
    .cat-body {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .cat-name  { font-size: 13px; font-weight: 600; color: var(--gray-800); }
    .cat-count { font-size: 11px; color: var(--gray-400); }

    /* ---- OUTLET BANNER ---- */
    .outlet-banner {
      background: #f8f3ea;
      border: 1px solid #e8dcc4;
      border-radius: var(--r-xl);
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .ob-label {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: #92400e;
      margin-bottom: 4px;
    }
    .ob-title { font-size: 16px; font-weight: 700; color: var(--gray-900); margin-bottom: 3px; font-family: var(--font-display); }
    .ob-desc  { font-size: 12px; color: var(--gray-600); }
    .ob-btn {
      background: #92400e;
      color: #fff;
      border: none;
      padding: 10px 22px;
      border-radius: var(--r-lg);
      font-weight: 600;
      font-size: 13px;
      text-decoration: none;
      white-space: nowrap;
      transition: background var(--t-fast);
      flex-shrink: 0;
    }
    .ob-btn:hover { background: #78350f; color: #fff; }

    /* ---- TABS ---- */
    .tabs-bar {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--gray-200);
      margin-bottom: 14px;
    }
    .tab-btn {
      padding: 8px 16px;
      border: none;
      background: none;
      font-size: 13.5px;
      font-weight: 500;
      color: var(--gray-500);
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: color var(--t-fast), border-color var(--t-fast);
      cursor: pointer;
    }
    .tab-btn:hover { color: var(--gray-800); }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); font-weight: 600; }

    /* ---- PRODUCTS GRID ---- */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    /* ---- BRANDS ---- */
    .brands-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
    }
    .brand-tile {
      background: var(--surface);
      border: 1px solid var(--gray-200);
      border-radius: var(--r-lg);
      padding: 12px 8px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--gray-700);
      text-align: center;
      cursor: pointer;
      transition: border-color var(--t-fast), color var(--t-fast), background var(--t-fast);
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-body);
    }
    .brand-tile:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-bg); }

    /* ---- NEWSLETTER ---- */
    .nl-block {
      background: #f0f5ff;
      border: 1px solid #c7d7f5;
      border-radius: var(--r-xl);
      padding: 24px 28px;
      display: flex;
      align-items: center;
      gap: 32px;
    }
    .nl-text { flex: 1; min-width: 0; }
    .nl-title { font-size: 16px; font-weight: 700; color: var(--gray-900); margin-bottom: 4px; font-family: var(--font-display); }
    .nl-desc  { font-size: 12.5px; color: var(--gray-600); }
    .nl-form  { display: flex; gap: 8px; flex-shrink: 0; }
    .nl-input {
      border: 1px solid var(--gray-300);
      padding: 9px 14px;
      border-radius: var(--r-lg);
      font-size: 13.5px;
      outline: none;
      width: 240px;
      background: var(--surface);
      font-family: var(--font-body);
    }
    .nl-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(26,107,58,.1); }
    .nl-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 9px 20px;
      border-radius: var(--r-lg);
      font-weight: 600;
      font-size: 13.5px;
      white-space: nowrap;
      transition: background var(--t-fast);
    }
    .nl-btn:hover { background: var(--primary-dark); }

    /* ---- NEWS ---- */
    .news-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .news-card {
      background: var(--surface);
      border: 1px solid var(--gray-200);
      border-radius: var(--r-xl);
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      display: block;
      transition: border-color var(--t-fast), box-shadow var(--t-fast);
    }
    .news-card:hover { border-color: var(--gray-300); box-shadow: var(--shadow-sm); color: inherit; }
    .news-img {
      height: 80px;
      background: var(--gray-100);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      border-bottom: 1px solid var(--gray-200);
    }
    .news-body { padding: 12px 14px 14px; }
    .news-cat   { font-size: 10px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 5px; }
    .news-title { font-size: 13px; font-weight: 600; color: var(--gray-800); line-height: 1.4; margin-bottom: 6px; }
    .news-date  { font-size: 11px; color: var(--gray-400); }

    /* ---- TRUST ---- */
    .trust-row {
      background: var(--surface);
      border: 1px solid var(--gray-200);
      border-radius: var(--r-xl);
      display: grid;
      grid-template-columns: repeat(5, 1fr);
    }
    .trust-item {
      padding: 14px 16px;
      border-right: 1px solid var(--gray-200);
    }
    .trust-item:last-child { border-right: none; }
    .trust-title { font-size: 13px; font-weight: 600; color: var(--gray-900); margin-bottom: 3px; }
    .trust-desc  { font-size: 11.5px; color: var(--gray-500); line-height: 1.4; }

    /* ---- RESPONSIVE ---- */
    @media (max-width: 1100px) {
      .hero { grid-template-columns: 1fr; }
      .hero-side { display: none; }
      .products-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 900px) {
      .benefits-bar { grid-template-columns: repeat(3, 1fr); }
      .cats-grid { grid-template-columns: repeat(3, 1fr); }
      .brands-grid { grid-template-columns: repeat(4, 1fr); }
      .news-grid { grid-template-columns: 1fr 1fr; }
      .trust-row { grid-template-columns: repeat(2, 1fr); }
      .products-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .hero-main { grid-template-columns: 1fr; }
      .hero-img-area { display: none; }
      .cats-grid { grid-template-columns: repeat(2, 1fr); }
      .brands-grid { grid-template-columns: repeat(3, 1fr); }
      .news-grid { grid-template-columns: 1fr; }
      .nl-block { flex-direction: column; gap: 16px; }
      .nl-form { width: 100%; flex-direction: column; }
      .nl-input { width: 100%; }
      .products-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class HomeComponent implements OnInit {
  protected toastSvc  = inject(ToastService);
  private productSvc  = inject(ProductService);

  readonly categories = CATEGORIES;
  readonly newsItems  = NEWS_ITEMS.slice(0, 3);
  readonly brandsHome = BRANDS.slice(0, 12);

  readonly activeTab  = signal<FeaturedTab>('trending');
  readonly featuredProducts = signal<Product[]>([]);

  readonly tabs = [
    { key: 'trending'    as FeaturedTab, label: 'Trending'      },
    { key: 'bestsellers' as FeaturedTab, label: 'Best sellers'  },
    { key: 'new'         as FeaturedTab, label: 'New arrivals'  },
    { key: 'recommended' as FeaturedTab, label: 'Recommended'   },
  ];

  readonly benefits = [
    { label: '30-day money back',   desc: 'No questions asked'            },
    { label: '3-year warranty',     desc: 'On all new instruments'        },
    { label: 'Free shipping',       desc: 'On orders over 49 €'          },
    { label: 'Secure payment',      desc: 'SSL encrypted checkout'        },
    { label: 'Expert support',      desc: 'Musicians with 15+ years exp.' },
  ];

  readonly trustItems = [
    { title: '3-year warranty',   desc: 'On all new instruments, no exceptions'  },
    { title: '24–48h delivery',   desc: 'Orders placed before 14:00 ship same day'},
    { title: '30-day returns',    desc: 'No questions. Full refund guaranteed'    },
    { title: '0% financing',      desc: 'Up to 36 months with Aplazame'          },
    { title: 'Expert advice',     desc: 'Musicians with 15+ years of experience' },
  ];

  ngOnInit(): void {
    this.setTab('trending');
  }

  setTab(tab: FeaturedTab): void {
    this.activeTab.set(tab);
    const all = this.productSvc.allProducts();
    const map: Record<FeaturedTab, Product[]> = {
      trending:    all.filter(p => p.tags.includes('featured') || p.tags.includes('deal')),
      bestsellers: all.filter(p => p.tags.includes('topSeller')),
      new:         all.filter(p => p.tags.includes('new') || p.tags.includes('outlet')),
      recommended: all.filter(p => p.rating >= 4.7),
    };
    const list = map[tab];
    this.featuredProducts.set(list.length ? list : all.slice(0, 8));
  }

  subscribe(email: string): void {
    if (email?.includes('@')) {
      this.toastSvc.show('Subscribed successfully!');
    } else {
      this.toastSvc.show('Please enter a valid email', 'error');
    }
  }
}
