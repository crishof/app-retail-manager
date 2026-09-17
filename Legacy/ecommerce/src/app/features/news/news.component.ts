import {
  Component, ChangeDetectionStrategy, signal, computed, inject, OnInit
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NEWS_ITEMS } from '../../core/data/mock-data';
import { NewsItem } from '../../core/models';

@Component({
  selector: 'app-news',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="news-page">
      <!-- Header -->
      <div class="page-header">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/">Inicio</a>
          <span class="bc-sep">›</span>
          <span>Noticias</span>
        </nav>
        <h1 class="page-title">Noticias y guías</h1>
        <p class="page-sub">Las últimas novedades del mundo musical</p>
      </div>

      <!-- Category filter -->
      <div class="cat-filters" role="navigation" aria-label="Filtrar por categoría">
        @for (cat of categories; track cat) {
          <button
            class="cat-btn"
            [class.active]="activeCategory() === cat"
            (click)="activeCategory.set(cat)"
          >{{ cat }}</button>
        }
      </div>

      <!-- Grid -->
      <div class="news-grid" role="list" aria-label="Artículos">
        @for (item of filteredNews(); track item.slug) {
          <article class="news-card" role="listitem">
            <div class="news-emoji" aria-hidden="true">{{ item.emoji }}</div>
            <div class="news-body">
              <span class="news-cat">{{ item.cat }}</span>
              <h2 class="news-title">
                <a [routerLink]="['/noticias', item.slug]">{{ item.title }}</a>
              </h2>
              <div class="news-meta">
                <span class="news-date">📅 {{ item.date }}</span>
                <a [routerLink]="['/noticias', item.slug]" class="news-read">
                  Leer más →
                </a>
              </div>
            </div>
          </article>
        }
        @if (filteredNews().length === 0) {
          <p class="no-results">No hay artículos en esta categoría.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .news-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 16px;
      font-family: var(--font-body);
    }
    .breadcrumb {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .breadcrumb a { color: #9ca3af; text-decoration: none; }
    .breadcrumb a:hover { color: var(--c-red, #dc2626); }
    .bc-sep { opacity: .5; }
    .page-header { margin-bottom: 20px; }
    .page-title {
      font-family: var(--font-display, 'Barlow Condensed');
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 4px;
      text-transform: uppercase;
      letter-spacing: -.5px;
    }
    .page-sub { font-size: 13px; color: #6b7280; margin: 0; }

    .cat-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 20px;
    }
    .cat-btn {
      padding: 5px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      background: #fff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all .15s;
    }
    .cat-btn:hover { border-color: var(--c-red, #dc2626); color: var(--c-red, #dc2626); }
    .cat-btn.active { background: var(--c-red, #dc2626); color: #fff; border-color: var(--c-red, #dc2626); }

    .news-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .news-card {
      display: flex;
      gap: 16px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 16px;
      transition: border-color .15s, box-shadow .15s;
    }
    .news-card:hover {
      border-color: var(--c-red, #dc2626);
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }
    .news-emoji { font-size: 36px; flex-shrink: 0; }
    .news-body { flex: 1; }
    .news-cat {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .06em;
      color: var(--c-red, #dc2626);
      background: #fff9f9;
      border: 1px solid var(--c-red, #dc2626);
      border-radius: 3px;
      padding: 1px 6px;
      margin-bottom: 6px;
    }
    .news-title {
      font-size: 14px;
      font-weight: 700;
      line-height: 1.4;
      margin: 0 0 8px;
    }
    .news-title a { color: inherit; text-decoration: none; }
    .news-title a:hover { color: var(--c-red, #dc2626); }
    .news-meta { display: flex; justify-content: space-between; align-items: center; }
    .news-date { font-size: 11px; color: #9ca3af; }
    .news-read { font-size: 12px; font-weight: 600; color: var(--c-red, #dc2626); text-decoration: none; }
    .news-read:hover { text-decoration: underline; }

    .no-results {
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      padding: 32px;
    }
  `]
})
export class NewsComponent implements OnInit {
  readonly items: NewsItem[] = NEWS_ITEMS;
  readonly activeCategory = signal('Todos');

  readonly categories = ['Todos', ...new Set(NEWS_ITEMS.map(n => n.cat))];

  readonly filteredNews = computed(() => {
    const cat = this.activeCategory();
    if (cat === 'Todos') return this.items;
    return this.items.filter(n => n.cat === cat);
  });

  ngOnInit(): void {}
}
