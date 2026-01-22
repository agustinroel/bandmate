import { Injectable, computed, signal } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  readonly _session = signal<Session | null>(null);

  readonly session = computed(() => this._session());
  readonly user = computed<User | null>(() => this._session()?.user ?? null);
  readonly isAuthed = computed(() => !!this.user());

  constructor() {
    supabase.auth.getSession().then(({ data }) => {
      this._session.set(data.session ?? null);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      this._session.set(session ?? null);
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
