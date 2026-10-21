# Guía de Contexto y Onboarding (Para AI y Nuevos Colaboradores)

Este documento extiende el `README.md` principal y sirve como un mapa actualizado del estado de la arquitectura, reglas y últimos cambios estructurales realizados en el frontend del **Hospital Christus Sur** (importante: *ver la regla estricta sobre terminologías prohibidas en el README*). 

## 🏗 Arquitectura Funcional Reciente

El proyecto en Astro genera casi todo el sitio en el build (SSG). El blog y los perfiles del directorio se renderizan **bajo demanda con caché ISR de Vercel**, para que el contenido nuevo aparezca sin hacer build.

### 1. API y revalidación (ISR + Laravel)
* **URL del API:** todas las llamadas usan `PUBLIC_API_URL` (por defecto producción, `https://administrador.especialidadesmedicassur.com.mx`) a través de `src/lib/api.ts`. En el servidor se usa `apiGet()`, que lanza error si la respuesta no es 2xx o trae un `Code` distinto de 200. En los scripts del navegador la URL llega con `define:vars={{ API_URL }}`. Nunca escribir el dominio a mano.
* **Páginas con ISR** (`export const prerender = false`): `/blog`, `/blog/[slug]` y `/directorio/[nombre]`. Se generan en la primera visita y quedan en caché. Si el API falla, Vercel sigue sirviendo la versión en caché. La caché expira sola a las 24 h.
* **Revalidación al guardar:** el backend llama a `POST /api/revalidate` con `Authorization: Bearer <ISR_BYPASS_TOKEN>` y `Content-Type: application/json`:
  * Médico: `{ "type": "doctor", "id": 261, "nombre": "<nombre anterior, opcional>" }`
  * Artículo: `{ "type": "article", "slug": "<slug>", "previousSlug": "<opcional>" }`
* **`/maternidad`** también usa ISR: el webhook la regenera con cualquier `{ "type": "doctor" }`, porque su sección de especialistas sale del API.
* **Variables de entorno** (ver `.env.example`): `PUBLIC_API_URL` e `ISR_BYPASS_TOKEN` (secreto de 32 caracteres o más, configurado en Vercel).

### 2. Módulo: Directorio Médico (`src/pages/directorio.astro`)
En lugar de depender de archivos locales, el directorio ahora se conecta con el endpoint de producción.
* **Componentes de UX:** Se incluyen "Skeletons Loaders" antes del despliegue masivo y funciones Title Case en el cliente para sanitizar nombres procedentes de bases de datos antiguas.
* **Fricción Cero en Enlaces**: Los botones de contacto (`WhatsApp`) ahora redireccionan a nuestra propia pasarela optimizada en `/contacto` para retener tráfico.
* **Rutas de perfil:** `/directorio/{id}-{nombre}` (por ejemplo `/directorio/261-jose-eduardo-rivera-gonzalez`), generadas con `doctorPath()` de `src/lib/api.ts`. El ID evita que dos médicos con el mismo nombre compartan página. Las URLs anteriores (`/directorio/{nombre}`) y las que tienen un nombre distinto redirigen con 301 a la canónica.

### 3. Módulo: Blog Médico (`src/pages/blog/`)
El sistema anterior con `Astro Content Collections (.md locales)` fue deprecado.
* **Página principal (Index)**: Lee `/api/v1/public/blog-articles` mediante `getArticles()` (los artículos sin portada usan `/images/img_especialistas.webp`). Genera las etiquetas dinámicamente según lo provisto por la API, con filtrado instántaneo usando Javascript Vanilla para evitar recargas completas asincrónicamente.
* **Generación de Extractos Segura:** Se utiliza una función `stripHtml` para limpiar etiquetas devueltas desde editores WYSIWYG antes de presentarlas como resúmenes.
* **Dynamic Article View (`[...slug].astro`)**: Estructurado usando Microdatos `schema.org` (Article Mode) y CSS moderno (Glassmorphism card mode + Tailwind Typo base). El API no filtra por slug, así que `getArticle()` busca el artículo en la lista completa; si no existe responde 404.

### 4. Módulo: Contacto (`src/pages/contacto.astro`)
Diseñada como página resolutiva para eliminar fricción:
* Incorpora el "Bento Grid System" en el apartado visual para la visualización elegante de las urgencias y ubicaciones telefónicas.
* Cuenta con formulario espaciado (`space-y-8`) para alta legibilidad en dispositivos pequeños. Animaciones delegadas enteramente por Tailwind y transiciones en lugar de saturar GSAP en elementos estancados.

## 📋 Resumen de Reglas para IA o Desarrollo
* **Tipografía y Estilos base:** Cualquier ajuste UI asimila Tailwind v4. Los componentes tipo cristal o tarjetas pulidas preferentemente heredarán la clase `@utility glass-card` del `global.css`.
* **Tracer Links Muteados:** Los CTAs para agenda o ayuda quirúrgica ya no rebotan exteriormente a WhatsApp por primera instancia, sino que se enrutan internamente `/contacto` asegurando mediciones de retención.
* **API Endpoints:** producción en `administrador.especialidadesmedicassur.com.mx`; `hospital.futurite.info` es QA y solo se usa cambiando `PUBLIC_API_URL`.
* No utilizar lógica destructiva como variables globales pesadas. Usar scripts `is:inline` únicamente cuando involucre bindings al DOM puro o pre-animaciones críticas (como el GSAP loader).
