import { Injectable, computed, signal } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly _session = signal<Session | null>(null);
  readonly initialized = signal(false);

  readonly session = computed(() => this._session());
  readonly user = computed<User | null>(() => this._session()?.user ?? null);
  readonly isAuthed = computed(() => !!this.user());

  private resolveReady?: (val: boolean) => void;
  readonly ready = new Promise<boolean>((resolve) => {
    this.resolveReady = resolve;
  });

  constructor() {
    supabase.auth.getSession().then(({ data }) => {
      this._session.set(data.session ?? null);
      this.initialized.set(true);
      this.resolveReady?.(true);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      this._session.set(session ?? null);
      if (!this.initialized()) {
        this.initialized.set(true);
        this.resolveReady?.(true);
      }
    });
  }

  signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          prompt: 'select_account',
        },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  signOut() {
    return supabase.auth.signOut();
  }

  accessToken(): string | null {
    return this._session()?.access_token ?? null;
  }
}
