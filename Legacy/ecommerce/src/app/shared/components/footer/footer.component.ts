import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">

      <!-- TRUST STRIP -->
      <div class="trust-strip">
        <div class="trust-strip-inner">
          @for (t of trustItems; track t.icon) {
            <div class="ts-item">
              <span class="ts-icon" aria-hidden="true">{{ t.icon }}</span>
              <div>
                <div class="ts-title">{{ t.title }}</div>
                <div class="ts-desc">{{ t.desc }}</div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- MAIN FOOTER -->
      <div class="footer-main">
        <div class="footer-inner">
          <div class="footer-grid">

            <!-- Brand -->
            <div class="footer-brand-col">
              <div class="footer-logo">
                <span class="logo-icon" aria-hidden="true">🎸</span>
                <div>
                  <div class="logo-name">RetailManager</div>
                  <div class="logo-sub">Musical Instruments</div>
                </div>
              </div>
              <p class="brand-blurb">Tu tienda de instrumentos musicales de confianza desde 2008. Más de 80.000 artículos. Envíos a toda Europa.</p>
              <div class="contact-info">
                <div>📞 +34 91 123 45 67</div>
                <div>✉️ info&#64;retailmanager.es</div>
                <div>⏰ Lu–Vi 9–20h · Sá 10–14h</div>
              </div>
              <div class="social-row">
                <a class="social-btn fb" href="#" aria-label="Facebook">f</a>
                <a class="social-btn ig" href="#" aria-label="Instagram">ig</a>
                <a class="social-btn yt" href="#" aria-label="YouTube">yt</a>
                <a class="social-btn tw" href="#" aria-label="Twitter/X">𝕏</a>
              </div>
            </div>

            <!-- Información -->
            <div>
              <h4>Información</h4>
              <ul>
                <li><a href="#">Quiénes somos</a></li>
                <li><a href="#">Trabaja con nosotros</a></li>
                <li><a href="#">Sostenibilidad</a></li>
                <li><a href="#">Prensa &amp; medios</a></li>
                <li><a routerLink="/noticias">Blog musical</a></li>
                <li><a href="#">Afiliados</a></li>
              </ul>
            </div>

            <!-- Ayuda -->
            <div>
              <h4>Ayuda al cliente</h4>
              <ul>
                <li><a href="#">Centro de ayuda</a></li>
                <li><a href="#">Envíos y entregas</a></li>
                <li><a href="#">Devoluciones 30 días</a></li>
                <li><a href="#">Garantías</a></li>
                <li><a href="#">Financiación 0%</a></li>
                <li><a href="#">Estado del pedido</a></li>
              </ul>
            </div>

            <!-- Legal -->
            <div>
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Aviso legal</a></li>
                <li><a href="#">Política de privacidad</a></li>
                <li><a href="#">Política de cookies</a></li>
                <li><a href="#">Condiciones generales</a></li>
                <li><a href="#">RGPD / LOPD</a></li>
                <li><a href="#">Accesibilidad</a></li>
              </ul>
            </div>

            <!-- Payment & Security -->
            <div>
              <h4>Métodos de pago</h4>
              <div class="pay-logos">
                @for (p of payMethods; track p) {
                  <span class="pay-logo">{{ p }}</span>
                }
              </div>
              <h4 class="mt-12">Seguridad &amp; Certificados</h4>
              <div class="cert-logos">
                @for (c of certBadges; track c.label) {
                  <div class="cert-badge" [attr.aria-label]="c.label">
                    <span class="cert-icon" aria-hidden="true">{{ c.icon }}</span>
                    <span class="cert-label">{{ c.label }}</span>
                  </div>
                }
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- BOTTOM BAR -->
      <div class="footer-bottom-bar">
        <div class="footer-bottom-inner">
          <span>© 2025 RetailManager SaaS · CIF: B-12345678 · Registrado en el Registro Mercantil de Madrid</span>
          <span class="bottom-links">
            <a href="#">Privacidad</a>
            <a href="#">Cookies</a>
            <a href="#">Accesibilidad</a>
            <a href="#">Mapa web</a>
          </span>
        </div>
      </div>

    </footer>
  `,
  styles: [`
    .footer { background: #111; color: #888; }

    /* TRUST STRIP */
    .trust-strip {
      background: #1a1a1a;
      border-top: 2px solid var(--red);
      border-bottom: 1px solid #222;
    }
    .trust-strip-inner {
      max-width: 1500px;
      margin: 0 auto;
      padding: 14px 16px;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }
    .ts-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 8px;
      border-right: 1px solid #2a2a2a;
    }
    .ts-item:last-child { border-right: none; }
    .ts-icon { font-size: 20px; flex-shrink: 0; }
    .ts-title { font-size: 11px; font-weight: 800; color: #e0e0e8; font-family: var(--font-display); text-transform: uppercase; letter-spacing: .2px; }
    .ts-desc  { font-size: 10px; color: #666; margin-top: 1px; }

    /* MAIN */
    .footer-main { padding: 28px 0 20px; }
    .footer-inner { max-width: 1500px; margin: 0 auto; padding: 0 16px; }
    .footer-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr 1fr 1.2fr;
      gap: 24px;
    }

    /* Brand col */
    .footer-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .logo-icon { font-size: 26px; }
    .logo-name { font-size: 16px; font-weight: 900; color: #e8e8f0; font-family: var(--font-display); letter-spacing: -.2px; }
    .logo-sub  { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: .5px; }
    .brand-blurb { font-size: 10.5px; color: #666; line-height: 1.6; margin-bottom: 10px; }
    .contact-info { font-size: 10.5px; color: #777; line-height: 1.8; margin-bottom: 12px; }
    .social-row { display: flex; gap: 6px; }
    .social-btn {
      width: 30px;
      height: 30px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      cursor: pointer;
      transition: opacity .15s;
      font-family: var(--font-display);
    }
    .social-btn:hover { opacity: .8; }
    .fb { background: #1877f2; color: #fff; }
    .ig { background: #e1306c; color: #fff; }
    .yt { background: #ff0000; color: #fff; }
    .tw { background: #222; color: #fff; border: 1px solid #333; }

    /* Columns */
    h4 {
      color: #c0c0cc;
      font-size: 10.5px;
      font-weight: 800;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: .7px;
      font-family: var(--font-display);
    }
    .mt-12 { margin-top: 16px; }
    ul { list-style: none; display: flex; flex-direction: column; gap: 5px; }
    ul li a {
      font-size: 11px;
      color: #666;
      cursor: pointer;
      transition: color .15s;
      text-decoration: none;
      display: inline-block;
    }
    ul li a:hover { color: #e8e8f0; }

    /* Pay logos */
    .pay-logos { display: flex; gap: 5px; flex-wrap: wrap; }
    .pay-logo {
      background: #1c1c1c;
      border: 1px solid #2a2a2a;
      border-radius: 3px;
      padding: 4px 9px;
      font-size: 9.5px;
      font-weight: 700;
      color: #888;
      font-family: var(--font-mono);
      white-space: nowrap;
    }

    /* Cert badges */
    .cert-logos { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px; }
    .cert-badge {
      background: #1c1c1c;
      border: 1px solid #2a2a2a;
      border-radius: 4px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-width: 44px;
    }
    .cert-icon { font-size: 14px; }
    .cert-label { font-size: 8px; color: #666; text-transform: uppercase; letter-spacing: .3px; font-family: var(--font-display); text-align: center; }

    /* BOTTOM BAR */
    .footer-bottom-bar {
      background: #0a0a0a;
      border-top: 1px solid #1a1a1a;
      padding: 10px 0;
    }
    .footer-bottom-inner {
      max-width: 1500px;
      margin: 0 auto;
      padding: 0 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #444;
      flex-wrap: wrap;
      gap: 8px;
    }
    .bottom-links { display: flex; gap: 16px; }
    .bottom-links a { color: #555; text-decoration: none; transition: color .15s; }
    .bottom-links a:hover { color: #888; }

    @media (max-width: 1100px) {
      .footer-grid { grid-template-columns: 1.2fr 1fr 1fr; }
      .trust-strip-inner { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 700px) {
      .footer-grid { grid-template-columns: 1fr 1fr; }
      .trust-strip-inner { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .footer-grid { grid-template-columns: 1fr; }
      .trust-strip-inner { grid-template-columns: 1fr; }
      .footer-bottom-inner { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class FooterComponent {
  readonly trustItems = [
    { icon: '🏆', title: 'Garantía 3 años',      desc: 'En todos los productos nuevos'      },
    { icon: '🚚', title: 'Envío 24-48h',          desc: 'Gratis en pedidos +99€'             },
    { icon: '🔄', title: '30 días devolución',    desc: 'Sin preguntas, reembolso total'     },
    { icon: '💳', title: 'Pago en cuotas 0%',     desc: 'Con Aplazame y Sequra'             },
    { icon: '🎓', title: 'Soporte experto',       desc: 'Músicos con +15 años experiencia'  },
  ];

  readonly payMethods = ['VISA', 'Mastercard', 'PayPal', 'Bizum', 'Aplazame', 'Sequra', 'Transferencia'];

  readonly certBadges = [
    { icon: '🔒', label: 'SSL 256-bit' },
    { icon: '✅', label: 'RGPD' },
    { icon: '🛡️', label: 'Confianza Online' },
  ];
}
