import type { APIRoute } from 'astro';
import { ISR_BYPASS_TOKEN } from 'astro:env/server';
import { doctorPath, getDoctor } from '../../lib/api';

/**
 * Webhook para el backend: regenera las páginas en caché (ISR) de un médico o artículo al guardarlo.
 *
 *   POST /api/revalidate
 *   Authorization: Bearer <ISR_BYPASS_TOKEN>
 *   { "type": "doctor", "id": 261, "nombre": "JOSE EDUARDO RIVERA GONZALEZ" }
 *   { "type": "article", "slug": "nuevo-slug", "previousSlug": "slug-anterior" }
 *
 * `nombre` y `previousSlug` son opcionales: sirven para limpiar la URL anterior cuando cambia el
 * nombre o el slug, o cuando el médico se desactiva y el API ya no lo devuelve.
 */
export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, url }) => {
  if (!ISR_BYPASS_TOKEN) return json({ error: 'ISR_BYPASS_TOKEN no está configurado' }, 500);
  if (request.headers.get('authorization') !== `Bearer ${ISR_BYPASS_TOKEN}`) {
    return json({ error: 'No autorizado' }, 401);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'El cuerpo debe ser JSON' }, 400);
  }

  const paths = new Set<string>();
  if (body?.type === 'article' && body.slug) {
    paths.add('/blog');
    paths.add(`/blog/${body.slug}`);
    if (body.previousSlug) paths.add(`/blog/${body.previousSlug}`);
  } else if (body?.type === 'doctor' && body.id) {
    const doctor = await getDoctor(body.id);
    if (doctor) paths.add(doctorPath(doctor));
    if (body.nombre) paths.add(doctorPath({ id: body.id, nombre: body.nombre }));
  } else {
    return json({ error: 'Se esperaba { type: "doctor", id } o { type: "article", slug }' }, 400);
  }

  if (paths.size === 0) {
    return json({ error: 'El médico no existe en el API; envía también "nombre" para limpiar su página' }, 422);
  }
  // /maternidad muestra ginecólogos del API; se regenera con cualquier cambio de médico.
  if (body.type === 'doctor') paths.add('/maternidad');

  const results = await Promise.all(
    [...paths].map(async (path) => {
      const res = await fetch(new URL(path, url.origin), {
        headers: { 'x-prerender-revalidate': ISR_BYPASS_TOKEN },
        redirect: 'manual',
      });
      return { path, status: res.status };
    }),
  );

  return json({ revalidated: results });
};
