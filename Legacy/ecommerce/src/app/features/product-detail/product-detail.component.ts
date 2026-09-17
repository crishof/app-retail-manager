import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models';
import { PRODUCTS } from '../../core/data/mock-data';

type ProdTab = 'desc' | 'specs' | 'reviews' | 'bundle';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (product()) {
      <!-- BREADCRUMB -->
      <div class="bc-bar">
        <nav class="breadcrumb">
          <a routerLink="/">Inicio</a>
          <span class="sep">›</span>
          <a [routerLink]="['/catalogo', product()!.category]">{{ product()!.category | titlecase }}</a>
          <span class="sep">›</span>
          <span>{{ product()!.brand }} {{ product()!.name }}</span>
        </nav>
      </div>

      <div class="prod-layout">
        <!-- LEFT COLUMN -->
        <div>
          <!-- GALLERY -->
          <div class="prod-gallery">
            <div class="gallery-main" role="img" [attr.aria-label]="product()!.name">
              {{ selectedThumb() || product()!.emoji }}
            </div>
            <div class="gallery-thumbs">
              @for (thumb of thumbs; track thumb.emoji) {
                <button
                  class="thumb"
                  [class.active]="selectedThumb() === thumb.emoji"
                  (click)="selectedThumb.set(thumb.emoji)"
                  [attr.aria-label]="'Ver imagen ' + thumb.label"
                >{{ thumb.emoji }}</button>
              }
            </div>
          </div>

          <!-- TABS -->
          <div class="tabs-panel">
            <div class="prod-tabs">
              @for (tab of prodTabs; track tab.key) {
                <button
                  class="prod-tab"
                  [class.active]="activeTab() === tab.key"
                  (click)="activeTab.set(tab.key)"
                >{{ tab.label }}</button>
              }
            </div>

            @if (activeTab() === 'desc') {
              <div class="tab-content">
                <p class="prod-desc-text">
                  La <strong>{{ product()!.brand }} {{ product()!.name }}</strong>
                  {{ product()!.desc }} Fabricada con materiales de primera calidad,
                  esta guitarra combina la tradición con mejoras modernas que satisfacen
                  las exigencias de los músicos profesionales.
                </p>
                <div class="desc-highlights">
                  <div class="highlight-item">
                    <span>🇺🇸</span>
                    <strong>Made in USA</strong>
                    <span>Corona, California</span>
                  </div>
                  <div class="highlight-item">
                    <span>🎵</span>
                    <strong>V-Mod II Pickups</strong>
                    <span>Sonido vintage auténtico</span>
                  </div>
                  <div class="highlight-item">
                    <span>🔧</span>
                    <strong>Narrow-Tall Frets</strong>
                    <span>Bendings más precisos</span>
                  </div>
                </div>
              </div>
            }

            @if (activeTab() === 'specs') {
              <div class="tab-content">
                <table class="specs-table">
                  @for (spec of specs; track spec.key) {
                    <tr>
                      <td>{{ spec.key }}</td>
                      <td>{{ spec.value }}</td>
                    </tr>
                  }
                </table>
              </div>
            }

            @if (activeTab() === 'reviews') {
              <div class="tab-content">
                <div class="rating-summary">
                  <div class="rating-big">
                    <div class="rnum">{{ product()!.rating }}</div>
                    <div class="rstars">★★★★★</div>
                    <div class="rtotal">{{ product()!.reviews }} valoraciones</div>
                  </div>
                  <div class="rating-bars">
                    @for (bar of ratingBars; track bar.stars) {
                      <div class="rbar-row">
                        <span class="rbar-lbl">{{ bar.stars }}★</span>
                        <div class="bar-track" role="progressbar" [attr.aria-valuenow]="bar.pct">
                          <div class="bar-fill" [style.width.%]="bar.pct"></div>
                        </div>
                        <span class="bar-cnt">{{ bar.count }}</span>
                      </div>
                    }
                  </div>
                </div>
                @for (r of sampleReviews; track r.user) {
                  <div class="rev-card">
                    <div class="rev-hdr">
                      <div class="rev-avatar" [style.background]="r.color">{{ r.initials }}</div>
                      <div>
                        <div class="rev-user">{{ r.user }}</div>
                        <div class="rev-date">
                          <span class="stars">{{ r.stars }}</span> · {{ r.date }}
                        </div>
                      </div>
                      <span class="verified-badge">Compra verificada</span>
                    </div>
                    <p class="rev-text">{{ r.text }}</p>
                    <div class="rev-helpful">
                      ¿Te resultó útil?
                      <button (click)="toastSvc.show('👍 ¡Gracias por tu voto!')">👍 Sí ({{ r.helpful }})</button>
                    </div>
                  </div>
                }
              </div>
            }

            @if (activeTab() === 'bundle') {
              <div class="tab-content">
                <p class="bundle-intro">Completa tu setup con estos accesorios recomendados:</p>
                <div class="products-mini-grid">
                  @for (p of relatedProducts; track p.id) {
                    <app-product-card [product]="p" />
                  }
                </div>
              </div>
            }
          </div>

          <!-- RELATED -->
          <div class="related-section">
            <div class="sec-title" style="font-size:14px">Productos relacionados</div>
            <div class="products-mini-grid">
              @for (p of relatedProducts; track p.id) {
                <app-product-card [product]="p" />
              }
            </div>
          </div>
        </div>

        <!-- BUY BOX -->
        <div>
          <div class="sticky-buy">
            <div class="buy-brand">{{ product()!.brand.toUpperCase() }}</div>
            <h1 class="buy-title">{{ product()!.name }}</h1>
            <div class="buy-ref">Ref: {{ product()!.id.toUpperCase() }} · #12 en {{ product()!.category | titlecase }}</div>

            <div class="buy-price-row">
              <span class="buy-price">{{ product()!.price | number:'1.0-0' }}€</span>
              @if (product()!.oldPrice) {
                <span class="buy-old">{{ product()!.oldPrice! | number:'1.0-0' }}€</span>
                <span class="buy-disc">-{{ product()!.discount }}%</span>
              }
            </div>
            <div class="buy-tax">IVA (21%) incluido · Sin gastos de envío</div>

            <div class="buy-stars">
              <span class="stars" style="font-size:13px">★★★★★</span>
              <span style="font-size:11px;color:var(--ink-light)">{{ product()!.rating }} · {{ product()!.reviews }} opiniones</span>
            </div>

            <div class="buy-ship">
              <div class="srow">
                <span>🚚 Envío estándar (3-5 días)</span>
                <span class="ship-free">GRATIS</span>
              </div>
              <div class="srow">
                <span>⚡ Envío urgente (24-48h)</span>
                <span class="ship-price">+9.99€</span>
              </div>
              <div class="ship-note">Pedido antes 14h → sale hoy · Entrega: jue. 8 mayo</div>
            </div>

            @if (product()!.stock === 'lowStock') {
              <div class="low-stock-alert">⚠️ Solo quedan 3 unidades en stock</div>
            }

            <div class="qty-row">
              <label for="qty-select" class="qty-label">Cantidad:</label>
              <select id="qty-select" class="form-input" style="width:auto">
                <option>1</option><option>2</option><option>3</option>
              </select>
            </div>

            <button class="btn-add-big" (click)="addToCart()">
              🛒 Añadir a la cesta
            </button>

            <div class="prod-actions">
              <button class="act-btn" (click)="toggleFav()">
                {{ isFav() ? '❤️ En favoritos' : '♡ Favoritos' }}
              </button>
              <button class="act-btn" (click)="toastSvc.show('⚖️ Añadido a comparar')">⚖️ Comparar</button>
              <button class="act-btn" (click)="toastSvc.show('🔗 Enlace copiado')">🔗 Compartir</button>
            </div>

            <div class="financing-box">
              💳 <strong>Desde 54,13€/mes</strong> en 24 meses sin intereses con Aplazame<br>
              <span>0% TAE · Sin entrada · Aprobación en 5 minutos</span>
            </div>

            <div class="trust-mini">
              <span>🏆 Garantía 3 años</span>
              <span>🔄 30 días devolución</span>
              <span>🔒 Pago seguro SSL</span>
              <span>🎓 Soporte experto</span>
            </div>

            <div class="contact-box">
              <strong>¿Tienes dudas?</strong><br>
              <span>📞 91 123 45 67 · Lun-Vie 9-20h · Sáb 10-14h</span><br>
              <span class="chat-available">💬 Chat online disponible ahora</span>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="empty-state">
        <span class="e-icon">🔍</span>
        <h3>Producto no encontrado</h3>
        <p>El producto que buscas no existe o fue eliminado</p>
        <a routerLink="/catalogo" class="btn-primary" style="margin-top:16px;display:inline-block">Ver catálogo</a>
      </div>
    }
  `,
  styles: [`
    .bc-bar {
      background: var(--surface);
      border: 1.5px solid var(--line);
      border-radius: var(--r-md);
      padding: 10px 14px;
      margin-bottom: 10px;
    }
    .prod-layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 14px;
      align-items: start;
    }

    /* GALLERY */
    .prod-gallery {
      background: var(--surface);
      border: 1.5px solid var(--line);
      border-radius: var(--r-md);
      padding: 14px;
      margin-bottom: 10px;
    }
    .gallery-main {
      height: 260px;
      background: var(--line-soft);
      border-radius: var(--r-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 80px;
      margin-bottom: 10px;
      border: 1px solid var(--line);
    }
    .gallery-thumbs { display: flex; gap: 6px; }
    .thumb {
      width: 58px;
      height: 44px;
      background: var(--line-soft);
      border-radius: var(--r-sm);
      border: 2px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      transition: border-color .15s;
    }
    .thumb.active { border-color: var(--primary); }
    .thumb:hover { border-color: var(--gray-400); }

    /* TABS */
    .tabs-panel {
      background: var(--surface);
      border: 1.5px solid var(--line);
      border-radius: var(--r-md);
      padding: 14px;
      margin-bottom: 10px;
    }
    .prod-tabs {
      display: flex;
      border-bottom: 2px solid var(--line);
      margin-bottom: 14px;
    }
    .prod-tab {
      padding: 7px 14px;
      border: none;
      background: none;
      font-size: 12px;
      font-weight: 700;
      color: var(--ink-light);
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      transition: all .15s;
      font-family: var(--font-display);
      text-transform: uppercase;
      letter-spacing: .2px;
      white-space: nowrap;
    }
    .prod-tab.active { color: var(--primary); border-bottom-color: var(--primary); }

    .prod-desc-text { font-size: 12.5px; color: var(--ink-muted); line-height: 1.7; margin-bottom: 14px; }
    .desc-highlights {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .highlight-item {
      background: var(--line-soft);
      border: 1px solid var(--line);
      border-radius: var(--r-sm);
      padding: 10px;
      font-size: 11px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }
    .highlight-item span:first-child { font-size: 20px; }
    .highlight-item strong { color: var(--ink); font-weight: 700; }
    .highlight-item span:last-child { color: var(--ink-light); }

    .specs-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    .specs-table tr:nth-child(even) { background: var(--line-soft); }
    .specs-table td { padding: 6px 9px; border-bottom: 1px solid var(--line); }
    .specs-table td:first-child { color: var(--ink-muted); font-weight: 600; width: 44%; }

    .rating-summary { display: flex; gap: 20px; align-items: center; margin-bottom: 14px; padding: 14px; background: var(--line-soft); border-radius: var(--r-md); }
    .rating-big { text-align: center; }
    .rnum { font-size: 42px; font-weight: 900; line-height: 1; font-family: var(--font-display); }
    .rstars { font-size: 18px; color: #fbbf24; }
    .rtotal { font-size: 11px; color: var(--ink-light); }
    .rating-bars { flex: 1; }
    .rbar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; font-size: 11px; }
    .rbar-lbl { min-width: 18px; font-family: var(--font-mono); }
    .bar-track { flex: 1; height: 8px; background: var(--line); border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; background: #fbbf24; border-radius: 4px; }
    .bar-cnt { font-size: 10px; color: var(--ink-light); min-width: 22px; text-align: right; font-family: var(--font-mono); }

    .rev-card { border: 1.5px solid var(--line); border-radius: var(--r-md); padding: 12px; margin-bottom: 10px; background: var(--surface); }
    .rev-hdr { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .rev-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; font-family: var(--font-display); }
    .rev-user { font-size: 12px; font-weight: 700; }
    .rev-date { font-size: 10px; color: var(--ink-light); }
    .verified-badge { margin-left: auto; font-size: 10px; background: #f0fdf4; color: #166534; padding: 2px 7px; border-radius: 3px; white-space: nowrap; }
    .rev-text { font-size: 11.5px; color: var(--ink-muted); line-height: 1.6; margin-bottom: 8px; }
    .rev-helpful { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--ink-light); }
    .rev-helpful button { border: 1px solid var(--line); background: var(--surface); border-radius: 3px; padding: 2px 9px; cursor: pointer; font-size: 10px; }
    .rev-helpful button:hover { background: var(--line-soft); }

    .bundle-intro { font-size: 12px; color: var(--ink-muted); margin-bottom: 12px; }
    .products-mini-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }

    .related-section { background: var(--surface); border: 1.5px solid var(--line); border-radius: var(--r-md); padding: 14px; }

    /* BUY BOX */
    .sticky-buy {
      background: var(--surface);
      border: 1.5px solid var(--line);
      border-radius: var(--r-md);
      padding: 16px;
      position: sticky;
      top: 100px;
    }
    .buy-brand { font-size: 10px; font-weight: 900; color: var(--primary); text-transform: uppercase; letter-spacing: .8px; font-family: var(--font-display); margin-bottom: 4px; }
    .buy-title { font-family: var(--font-display); font-size: 16px; font-weight: 800; line-height: 1.3; margin-bottom: 3px; }
    .buy-ref { font-size: 10px; color: var(--ink-light); margin-bottom: 10px; font-family: var(--font-mono); }
    .buy-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
    .buy-price { font-size: 28px; font-weight: 900; font-family: var(--font-display); }
    .buy-old { font-size: 13px; color: var(--gray-300); text-decoration: line-through; }
    .buy-disc { background: var(--primary); color: #fff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 3px; font-family: var(--font-display); }
    .buy-tax { font-size: 10px; color: var(--ink-light); margin-bottom: 8px; }
    .buy-stars { margin-bottom: 12px; }

    .buy-ship {
      background: var(--line-soft);
      border-radius: var(--r-sm);
      padding: 9px 11px;
      margin-bottom: 10px;
      font-size: 11px;
    }
    .srow { display: flex; justify-content: space-between; padding: 2px 0; }
    .ship-free { color: var(--green); font-weight: 700; }
    .ship-price { font-weight: 700; }
    .ship-note { font-size: 10px; color: var(--ink-light); margin-top: 5px; }

    .low-stock-alert { font-size: 11px; color: var(--orange); font-weight: 700; margin-bottom: 10px; }
    .qty-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .qty-label { font-size: 11px; color: var(--ink-muted); }

    .btn-add-big {
      width: 100%;
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 13px;
      border-radius: var(--r-md);
      font-weight: 800;
      font-size: 14px;
      margin-bottom: 10px;
      cursor: pointer;
      font-family: var(--font-display);
      letter-spacing: .2px;
      transition: background .15s;
    }
    .btn-add-big:hover { background: var(--primary-dark); }

    .prod-actions { display: flex; gap: 6px; margin-bottom: 10px; }
    .act-btn {
      flex: 1;
      border: 1.5px solid var(--line);
      background: var(--surface);
      padding: 7px 6px;
      border-radius: var(--r-md);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all .15s;
    }
    .act-btn:hover { border-color: var(--primary); color: var(--primary); }

    .financing-box {
      background: var(--line-soft);
      border: 1px solid var(--line);
      border-radius: var(--r-sm);
      padding: 9px 11px;
      font-size: 11px;
      margin-bottom: 10px;
      line-height: 1.5;
    }
    .financing-box span { color: var(--ink-light); }

    .trust-mini {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
      margin-bottom: 10px;
    }
    .trust-mini span {
      font-size: 10px;
      color: var(--ink-muted);
      padding: 5px 6px;
      background: var(--line-soft);
      border-radius: var(--r-sm);
    }

    .contact-box {
      border-top: 1px solid var(--line);
      padding-top: 10px;
      font-size: 11px;
      line-height: 1.7;
      color: var(--ink-muted);
    }
    .chat-available { color: var(--primary); font-weight: 700; }

    @media (max-width: 900px) {
      .prod-layout { grid-template-columns: 1fr; }
      .desc-highlights { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  protected toastSvc = inject(ToastService);
  private cartSvc    = inject(CartService);
  private favsSvc    = inject(FavoritesService);
  private productSvc = inject(ProductService);
  private route      = inject(ActivatedRoute);

  readonly product        = signal<Product | null>(null);
  readonly selectedThumb  = signal<string>('');
  readonly activeTab      = signal<ProdTab>('desc');
  relatedProducts: Product[] = [];

  readonly prodTabs = [
    { key: 'desc' as ProdTab,    label: 'Descripción'      },
    { key: 'specs' as ProdTab,   label: 'Especificaciones' },
    { key: 'reviews' as ProdTab, label: 'Valoraciones'     },
    { key: 'bundle' as ProdTab,  label: 'Bundles'          },
  ];

  readonly thumbs = [
    { emoji: '🎸', label: 'Vista frontal'    },
    { emoji: '🔧', label: 'Detalle clavijas' },
    { emoji: '📐', label: 'Medidas'          },
    { emoji: '🎵', label: 'En acción'        },
  ];

  readonly specs = [
    { key: 'Marca',              value: 'Fender'                                      },
    { key: 'Modelo',             value: 'American Professional II Stratocaster'       },
    { key: 'País de fabricación',value: 'EE.UU. (Corona, California)'                },
    { key: 'Cuerpo',             value: 'Aliso seleccionado'                          },
    { key: 'Mástil',             value: 'Arce / Arce o Palisandro'                   },
    { key: 'Perfil de mástil',   value: 'Deep "C" modernizado'                       },
    { key: 'Radio del diapasón', value: '9.5" (241mm)'                               },
    { key: 'Número de trastes',  value: '22 trastes Narrow-Tall'                     },
    { key: 'Escala',             value: '648mm (25.5")'                              },
    { key: 'Pastillas',          value: '3x V-Mod II Single-Coil'                    },
    { key: 'Puente',             value: '2-Point Synchronized Tremolo'               },
    { key: 'Controles',          value: 'Master Volume, Tone 1, Tone 2'              },
    { key: 'Colores disponibles',value: 'Olympic White, 3-Color Sunburst, Miami Blue'},
    { key: 'Peso aprox.',        value: '3.5 kg'                                     },
    { key: 'Incluye',            value: 'Estuche rígido Fender, llave Allen, correa' },
    { key: 'N.º de artículo',    value: 'FEN-0113900700'                             },
  ];

  readonly ratingBars = [
    { stars: 5, pct: 78, count: 115 },
    { stars: 4, pct: 14, count: 21  },
    { stars: 3, pct: 5,  count: 7   },
    { stars: 2, pct: 2,  count: 3   },
    { stars: 1, pct: 1,  count: 1   },
  ];

  readonly sampleReviews = [
    { initials: 'JM', color: '#dc2626', user: 'Javier M. · Madrid',   date: 'hace 3 semanas', stars: '★★★★★', helpful: 24,
      text: 'Increíble guitarra. Llevo 20 años tocando y esta es de las mejores inversiones que he hecho. El setup de fábrica es perfecto. Las pastillas V-Mod II son excepcionales — brillante, cristalino, con ese quack característico.' },
    { initials: 'AL', color: '#065f46', user: 'Ana L. · Barcelona',   date: 'hace 6 semanas', stars: '★★★★☆', helpful: 11,
      text: 'Una guitarra de 10. Venía de una Stratocaster mexicana y el salto de calidad es enorme. Las maderas son más resonantes, el mástil tiene un perfil que se adapta perfectamente a mi mano.' },
    { initials: 'RG', color: '#7c3aed', user: 'Roberto G. · Sevilla', date: 'hace 2 meses',   stars: '★★★★★', helpful: 8,
      text: 'Vengo de tener una Custom Shop y la compré como guitarra de gira. Absolutamente gigante. El sustain, la resonancia, la comodidad del mástil... todo es de nivel profesional real.' },
  ];

  isFav(): boolean {
    return this.product() ? this.favsSvc.isFav(this.product()!.id) : false;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        const p = this.productSvc.getBySlug(slug);
        this.product.set(p || null);
        if (p) {
          this.selectedThumb.set(p.emoji);
          this.relatedProducts = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
        }
      }
    });
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.cartSvc.addProduct(p);
    this.toastSvc.show(`🛒 ${p.name.substring(0, 40)} añadido a la cesta`);
  }

  toggleFav(): void {
    const p = this.product();
    if (!p) return;
    this.favsSvc.toggle(p.id);
    this.toastSvc.show(this.isFav() ? '❤️ Añadido a favoritos' : 'Eliminado de favoritos');
  }
}
