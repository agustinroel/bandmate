import { Injectable, signal, effect } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'auto';

const THEME_KEY = 'bm.theme.mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly currentTheme = signal<AppTheme>('light');
  readonly isDark = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    if (typeof window === 'undefined') return;

    const saved = (localStorage.getItem(THEME_KEY) as AppTheme) || 'light';
    this.setTheme(saved);

    // Listen to OS scheme changes if auto
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.currentTheme() === 'auto') {
          this.applyDarkState(e.matches);
        }
      });
    }
  }

  setTheme(theme: AppTheme) {
    this.currentTheme.set(theme);
    if (typeof window === 'undefined') return;

    localStorage.setItem(THEME_KEY, theme);

    if (theme === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyDarkState(prefersDark);
    } else {
      this.applyDarkState(theme === 'dark');
    }
  }

  private applyDarkState(dark: boolean) {
    this.isDark.set(dark);
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (dark) {
      root.setAttribute('data-bs-theme', 'dark');
      root.classList.add('theme-dark');
      document.body.classList.add('theme-dark');
    } else {
      root.setAttribute('data-bs-theme', 'light');
      root.classList.remove('theme-dark');
      document.body.classList.remove('theme-dark');
    }
  }

  toggleTheme() {
    const next = this.isDark() ? 'light' : 'dark';
    this.setTheme(next);
  }
}
