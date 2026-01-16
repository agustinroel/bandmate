import type {
  AddSetlistItemDto,
  CreateSetlistDto,
  ReorderSetlistDto,
  Setlist,
  UpdateSetlistDto,
} from '@bandmate/shared';

async function http<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});

  const hasBody =
    init.body !== undefined &&
    init.body !== null &&
    !(typeof init.body === 'string' && init.body.length === 0);

  // ✅ Solo agregar Content-Type si realmente enviamos body
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...init, headers });

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
    return http<Setlist[]>('/api/setlists');
  }

  get(id: string) {
    return http<Setlist>(`/api/setlists/${id}`);
  }

  create(dto: CreateSetlistDto) {
    return http<Setlist>('/api/setlists', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  update(id: string, dto: UpdateSetlistDto) {
    return http<Setlist>(`/api/setlists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  remove(id: string) {
    return http<void>(`/api/setlists/${id}`, { method: 'DELETE' });
  }

  addItem(id: string, dto: AddSetlistItemDto) {
    return http<Setlist>(`/api/setlists/${id}/items`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  removeItem(id: string, songId: string) {
    return http<Setlist>(`/api/setlists/${id}/items/${songId}`, { method: 'DELETE' });
  }

  reorder(id: string, dto: ReorderSetlistDto) {
    return http<Setlist>(`/api/setlists/${id}/reorder`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }
}
