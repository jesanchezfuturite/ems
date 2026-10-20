import { PUBLIC_API_URL } from 'astro:env/client';

export const API_URL = PUBLIC_API_URL.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * GET al API del administrador. Lanza ApiError si la respuesta no es 2xx, no es JSON
 * o trae un `Code` distinto de 200 (el API responde HTTP 200 con `Code: 400` cuando no encuentra el registro).
 */
export async function apiGet<T = any>(path: string): Promise<T> {
  const url = `${API_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (err) {
    throw new ApiError(`Sin respuesta de ${url}: ${(err as Error).message}`);
  }
  if (!res.ok) throw new ApiError(`${url} respondió HTTP ${res.status}`, res.status);

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(`${url} no devolvió JSON`, res.status);
  }
  if (json && typeof json.Code === 'number' && json.Code !== 200) {
    throw new ApiError(json.message || `${url} respondió Code ${json.Code}`, json.Code);
  }
  return json;
}

/** El API envuelve las listas de distintas formas: [], {data: []} o {data: {data: []}} (paginado). */
export function unwrapList<T = any>(json: any): T[] {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.data?.data)) return json.data.data;
  throw new ApiError('Formato de lista inesperado en la respuesta del API');
}

export const slugify = (text: string) =>
  (text || '').toString().toLowerCase().trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');

// ---------- Directorio ----------

/** URL canónica del perfil: el ID va al inicio para que dos médicos con el mismo nombre no choquen. */
export const doctorPath = (doc: { id: number | string; nombre?: string }) =>
  `/directorio/${doc.id}-${slugify(doc.nombre || '')}`;

/** Devuelve el perfil o null si el médico no existe o no está disponible. */
export async function getDoctor(id: string | number) {
  try {
    const json = await apiGet(`/api/directorio-medico/get/${encodeURIComponent(id)}`);
    const profile = json?.data ?? json;
    return profile && Object.keys(profile).length > 0 ? profile : null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) return null;
    throw err;
  }
}

export async function searchDoctors(params: Record<string, string | number>) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  return unwrapList(await apiGet(`/api/directorio-medico/search?${qs}`));
}

// ---------- Blog ----------

/** Portada de respaldo para artículos sin `cover_image`. */
export const ARTICLE_FALLBACK_IMAGE = '/images/img_especialistas.webp';

export async function getArticles() {
  const articles = unwrapList(await apiGet('/api/v1/public/blog-articles'));
  return articles
    .map((a) => ({ ...a, cover_image: a.cover_image || ARTICLE_FALLBACK_IMAGE }))
    .sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf());
}

/** El API no filtra por slug (ignora `?slug=`), así que se busca en la lista completa. */
export async function getArticle(slug: string) {
  const articles = await getArticles();
  return articles.find((a) => a.slug === slug) ?? null;
}
