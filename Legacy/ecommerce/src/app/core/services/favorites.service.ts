import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly STORAGE_KEY = 'rm_favs';

  private _favs = signal<Set<string>>(this.load());

  readonly favs = this._favs.asReadonly();

  private load(): Set<string> {
    try {
      return new Set(JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]'));
    } catch {
      return new Set();
    }
  }

  toggle(id: string): void {
    this._favs.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  isFav(id: string): boolean {
    return this._favs().has(id);
  }

  count(): number {
    return this._favs().size;
  }
}
