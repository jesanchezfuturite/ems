import { defineConfig, envField } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

const { ISR_BYPASS_TOKEN } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: vercel({
    // Las páginas con `prerender = false` (blog y perfiles) se generan en la primera visita y
    // quedan en caché. El backend las regenera al guardar llamando a /api/revalidate.
    isr: {
      bypassToken: ISR_BYPASS_TOKEN,
      // Red de seguridad: si una revalidación no llega, la página se regenera a las 24 h.
      expiration: 60 * 60 * 24,
      exclude: ['/api/revalidate'],
    },
  }),
  env: {
    schema: {
      PUBLIC_API_URL: envField.string({
        context: 'client',
        access: 'public',
        default: 'https://administrador.especialidadesmedicassur.com.mx',
      }),
      ISR_BYPASS_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
