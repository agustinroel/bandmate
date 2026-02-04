import { Injectable, inject } from '@angular/core';
import type {
  AddSetlistItemDto,
  CreateSetlistDto,
  ReorderSetlistDto,
  Setlist,
  UpdateSetlistDto,
} from '@bandmate/shared';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../core/auth/auth.store'; // ajustá path si difiere

const base = environment.apiBaseUrl;

function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function normalizePath(url: string) {
  return url.startsWith('/') ? url : `/${url}`;
}

function toSsrAbsoluteUrl(url: string) {
  if (isAbsoluteUrl(url)) return url;

  const isServer = typeof window === 'undefined';
  if (!isServer) return url;

  const base = (process.env['API_BASE_URL'] as string) || 'http://localhost:3000';
  const path = normalizePath(url);
  const directPath = path.startsWith('/api/') ? path.slice(4) : path;
  return `${base}${directPath}`;
}

export async function http<T>(
  url: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const hasBody =
    init.body !== undefined &&
    init.body !== null &&
    !(typeof init.body === 'string' && init.body.length === 0);

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const finalUrl = toSsrAbsoluteUrl(url);
  const res = await fetch(finalUrl, { cache: 'no-store', ...init, headers });

  if (!res.ok) {
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? `HTTP ${res.status}`);
    }
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) return undefined as T;

  return (await res.json()) as T;
}

@Injectable({ providedIn: 'root' })
export class SetlistsApi {
  readonly auth = inject(AuthStore);

  private token(): string | undefined {
    return this.auth.accessToken() ?? undefined;
  }

  list() {
    return http<Setlist[]>(`${base}/setlists`, {}, this.token());
  }

  get(id: string) {
    return http<Setlist>(`${base}/setlists/${id}`, {}, this.token());
  }

  create(dto: CreateSetlistDto) {
    return http<Setlist>(
      `${base}/setlists`,
      { method: 'POST', body: JSON.stringify(dto) },
      this.token(),
    );
  }

  update(id: string, dto: UpdateSetlistDto) {
    return http<Setlist>(
      `${base}/setlists/${id}`,
      { method: 'PATCH', body: JSON.stringify(dto) },
      this.token(),
    );
  }

  remove(id: string) {
    return http<void>(`${base}/setlists/${id}`, { method: 'DELETE' }, this.token());
  }

  addItem(id: string, dto: AddSetlistItemDto) {
    return http<Setlist>(
      `${base}/setlists/${id}/items`,
      { method: 'POST', body: JSON.stringify(dto) },
      this.token(),
    );
  }

  removeItem(id: string, songId: string) {
    return http<Setlist>(
      `${base}/setlists/${id}/items/${songId}`,
      { method: 'DELETE' },
      this.token(),
    );
  }

  reorder(id: string, dto: ReorderSetlistDto) {
    return http<Setlist>(
      `${base}/setlists/${id}/reorder`,
      { method: 'POST', body: JSON.stringify(dto) },
      this.token(),
    );
  }
}
