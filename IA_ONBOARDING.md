# Guía de Contexto y Onboarding (Para AI y Nuevos Colaboradores)

Este documento extiende el `README.md` principal y sirve como un mapa actualizado del estado de la arquitectura, reglas y últimos cambios estructurales realizados en el frontend del **Hospital Christus Sur** (importante: *ver la regla estricta sobre terminologías prohibidas en el README*). 

## 🏗 Arquitectura Funcional Reciente

El proyecto en Astro ha ido evolucionando y está configurado bajo una lógica de **Generación Estática de Sitios (SSG)** acoplado por APIs.

### 1. Sistema de Revalidación (SSG + Laravel)
Para maximizar el rendimiento y el SEO, el proyecto **no realiza llamadas a bases de datos on-request** (no usa SSR tradicional). Todas las rutas del Directorio y Blog se compilan en archivos estáticos usando `getStaticPaths`. 
* **Regla de Actualización:** Cuando se publican o desactivan registros en el backend de Laravel (CRM), se envía un *Webhook oculto* que dispara de forma asíncrona el comando de producción `npm run build` en el servidor origen. Esto vuelve a generar los estáticos sin requerir de servidores Node.js.

### 2. Módulo: Directorio Médico (`src/pages/directorio.astro`)
En lugar de depender de archivos locales, el directorio ahora se conecta con el endpoint de producción.
* **Componentes de UX:** Se incluyen "Skeletons Loaders" antes del despliegue masivo y funciones Title Case en el cliente para sanitizar nombres procedentes de bases de datos antiguas.
* **Fricción Cero en Enlaces**: Los botones de contacto (`WhatsApp`) ahora redireccionan a nuestra propia pasarela optimizada en `/contacto` para retener tráfico.
* **Rutas Amigables (Slugify):**
El directorio utiliza URLs legibles usando el nombre exacto del especialista en lugar de puros IDs genéricos, logrando rutas dinámicas a través de `src/pages/directorio/[nombre].astro`. 
*Ruta de ejemplo:* `/directorio/dr-juan-perez` (por dentro la plantilla pasa el ID silenciosamente vía `Astro.props` por seguridad al consultar el CRM).

### 3. Módulo: Blog Médico (`src/pages/blog/`)
El sistema anterior con `Astro Content Collections (.md locales)` fue deprecado.
* **Página principal (Index)**: Ejecuta una integración REST pura atacando a `https://hospital.futurite.info/api/v1/public/blog-articles`. Genera las etiquetas dinámicamente según lo provisto por la API, con filtrado instántaneo usando Javascript Vanilla para evitar recargas completas asincrónicamente.
* **Generación de Extractos Segura:** Se utiliza una función `stripHtml` para limpiar etiquetas devueltas desde editores WYSIWYG antes de presentarlas como resúmenes.
* **Dynamic Article View (`[...slug].astro`)**: Estructurado usando Microdatos `schema.org` (Article Mode) y CSS moderno (Glassmorphism card mode + Tailwind Typo base). Todo conectado a la misma URL de producción para jalar los contenidos.

### 4. Módulo: Contacto (`src/pages/contacto.astro`)
Diseñada como página resolutiva para eliminar fricción:
* Incorpora el "Bento Grid System" en el apartado visual para la visualización elegante de las urgencias y ubicaciones telefónicas.
* Cuenta con formulario espaciado (`space-y-8`) para alta legibilidad en dispositivos pequeños. Animaciones delegadas enteramente por Tailwind y transiciones en lugar de saturar GSAP en elementos estancados.

## 📋 Resumen de Reglas para IA o Desarrollo
* **Tipografía y Estilos base:** Cualquier ajuste UI asimila Tailwind v4. Los componentes tipo cristal o tarjetas pulidas preferentemente heredarán la clase `@utility glass-card` del `global.css`.
* **Tracer Links Muteados:** Los CTAs para agenda o ayuda quirúrgica ya no rebotan exteriormente a WhatsApp por primera instancia, sino que se enrutan internamente `/contacto` asegurando mediciones de retención.
* **API Endpoints Current Status:** Totalmente enlazados en Producción (`hospital.futurite.info/api/v1/public/...`). 
* No utilizar lógica destructiva como variables globales pesadas. Usar scripts `is:inline` únicamente cuando involucre bindings al DOM puro o pre-animaciones críticas (como el GSAP loader).
