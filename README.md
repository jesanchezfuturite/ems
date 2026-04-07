# Hospital Christus Sur - Interfaz Web

Este repositorio contiene la arquitectura frontend para **Hospital Christus Sur**. El proyecto está construido con un enfoque en alto rendimiento estático (SSG), animaciones inmersivas y pilarización SEO.

## ⚠️ Reglas de Contexto y Desarrollo Críticas (Contexto AI)

**NUNCA UTILIZAR LA PALABRA "MUGUERZA"**:
* Es mandato estricto referirse a la institución únicamente como **Hospital Christus Sur**.
* Por ningún motivo se debe utilizar la palabra prohibida en etiquetas `<title>`, atributos `alt=""` de imágenes, metadatos, Schema.org JSON-LD o texto visible de la interfaz.

## 🛠 Stack Tecnológico Instalado

* **Core:** [Astro v6](https://astro.build/) (con motor nativo sobre Vite 6).
* **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) (integrado como plugin de Vite vía `@tailwindcss/vite`).
* **Animaciones:** GSAP Core y ScrollTrigger (inyección por CDN directo optimizado).
* **Tipografía:** *Plus Jakarta Sans* (Google Fonts).
* **Iconografía:** Phosphor Icons Web.
* **Componentes Adicionales:** Swiper.js para sliders interactivos.

## 📐 Decisiones de Arquitectura

1. **Diseño Visual y Temática (Tailwind v4):**
   * El archivo `./src/styles/global.css` funge como único punto de verdad utilizando las normativas `<v4>`, eliminando la necesidad de un archivo `tailwind.config.mjs`.
   * **Paleta de Colores:** 
     * Azul Institucional (`--color-brand-blue`: `#004b87`)
     * Cian Quirúrgico (`--color-brand-cyan`: `#00a3e0`)
   * **Efectos:** Uso de la utilidad global `@utility glass-card` que aplica estilizaciones estandarizadas en Glassmorphism (backdrop-blur-md, bordes sutiles y transiciones dinámicas).

2. **Estructura del Layout Global (`./src/layouts/Layout.astro`):**
   * **SEO First:** Provisión nativa de estructura dinámica JSON-LD para `MedicalOrganization`, permitiendo ser rastreado semánticamente por motores de búsqueda.
   * **Performance:** Scripts pesados y CDNs (como Swiper y Phosphor) están protegidos mediante atributos `defer`.
   * **Seguridad de Hidratación:** La integración de animaciones globales GSAP debe ser inyectada protegiendo el entorno con etiquetas `<script is:inline>` y envueltas en `document.addEventListener('DOMContentLoaded', ...)` para evadir problemas de precompilación SSG.

3. **Capa de Interfaces:**
   * **Header (Top):** Barra de navegación estática tipo Mega Menú con efecto "glass-card", contiene rutas corporativas (Cirugías, Maternidad, Directorio Médico, Blog) y un CTA prominente de "Urgencias".
   * **Main Entry:** Inyector principal de páginas (`<slot />`) con una regla base de opacidad 0 y escala transformada 0.95 que GSAP sube al 100% una vez completado el DOM.
   * **Footer:** Estructuración minimalista bajo la metodología de "pilares de enlazado" para facilitar el flujo de Pagerank interno de SEO.

## 🚀 Comandos Rápidos

```bash
# Iniciar Servidor de Desarrollo en vivo
npm run dev

# Chequeo de Typescript y Generación a entorno de producción (dist/)
npm run build
```

---
*Este documento es el punto de referencia base de la infraestructura UI.*
