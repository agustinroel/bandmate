import type {
  AddSetlistItemDto,
  CreateSetlistDto,
  ReorderSetlistDto,
  Setlist,
  UpdateSetlistDto,
} from '@bandmate/shared';
import { environment } from '../../../../environments/environment';

const base = environment.apiBaseUrl;

function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function normalizePath(url: string) {
  // convierte "api/x" -> "/api/x"
  return url.startsWith('/') ? url : `/${url}`;
}

/**
 * En browser: deja URLs relativas tal cual (proxy /api).
 * En SSR/Node: necesita URL absoluta. En dev apuntamos a API local:
 *   "/api/setlists" -> "http://localhost:3000/setlists"
 *   "/songs" -> "http://localhost:3000/songs"
 *
 * Si querés cambiar el host/puerto del API en SSR:
 * setear env var API_BASE_URL en el server (ej: http://localhost:3000)
 */
function toSsrAbsoluteUrl(url: string) {
  if (isAbsoluteUrl(url)) return url;

  const isServer = typeof window === 'undefined';
  if (!isServer) return url;

  const base = (process.env['API_BASE_URL'] as string) || 'http://localhost:3000';

  const path = normalizePath(url);

  // Si en el front usás proxy "/api", en SSR queremos pegar directo al API sin proxy.
  // Entonces removemos el prefijo "/api"
  const directPath = path.startsWith('/api/') ? path.slice(4) : path;

  return `${base}${directPath}`;
}

export async function http<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});

  const hasBody =
    init.body !== undefined &&
    init.body !== null &&
    !(typeof init.body === 'string' && init.body.length === 0);

  // ✅ Solo agregar Content-Type si realmente enviamos body
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const finalUrl = toSsrAbsoluteUrl(url);

  const res = await fetch(finalUrl, { ...init, headers });

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

export class SetlistsApi {
  list() {
    return http<Setlist[]>(`${base}/setlists`);
  }

  get(id: string) {
    return http<Setlist>(`${base}/setlists/${id}`);
  }

  create(dto: CreateSetlistDto) {
    return http<Setlist>(`${base}/setlists`, { method: 'POST', body: JSON.stringify(dto) });
  }

  update(id: string, dto: UpdateSetlistDto) {
    return http<Setlist>(`${base}/setlists/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
  }

  remove(id: string) {
    return http<void>(`${base}/setlists/${id}`, { method: 'DELETE' });
  }

  addItem(id: string, dto: AddSetlistItemDto) {
    return http<Setlist>(`${base}/setlists/${id}/items`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  removeItem(id: string, songId: string) {
    return http<Setlist>(`${base}/setlists/${id}/items/${songId}`, { method: 'DELETE' });
  }

  reorder(id: string, dto: ReorderSetlistDto) {
    return http<Setlist>(`${base}/setlists/${id}/reorder`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }
}
