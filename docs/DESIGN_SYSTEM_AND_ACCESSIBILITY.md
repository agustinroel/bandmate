# Guía de Diseño, Experiencia de Usuario y Accesibilidad de Bandmate

> **Regla de Desarrollo Obligatoria**: Cada nueva funcionalidad de UI o rediseño de interfaz en Bandmate debe consultar y cumplir estrictamente los principios descritos en este documento, integrando las directrices de **Vercel Web Design Guidelines**, **Auditoría de Accesibilidad (WCAG 2.1 AA)**, **Frontend Design (Anthropic)** y **UX/UI PRO MAX**.

---

## 1. Vercel Web Design Guidelines

Bandmate adopta la sobriedad, nitidez y elegancia del diseño de Vercel, Apple y X.com:

1. **Jerarquía Visual y Tipografía**:
   - Títulos claros con tracking sutilmente negativo (`letter-spacing: -0.01em` a `-0.02em`).
   - Peso tipográfico intencional: `font-weight: 700` o `800` para títulos, `600` para metadatos clave, `400` para textos secundarios.
   - Tamaños tipográficos coherentes con escala armónica (`11px` para microetiquetas, `0.85rem` para textos secundarios, `1rem` base).

2. **Bordes Nítidos y Profundidad Sutil**:
   - Bordes precisos y de bajo contraste (`1px solid rgba(0, 0, 0, 0.08)` en modo claro; `1px solid rgba(255, 255, 255, 0.08)` en modo oscuro).
   - Sombras multicapa difusas (`0 4px 16px rgba(0, 0, 0, 0.04)`) que evitan manchas oscuras artificiales.
   - Radio de curvatura consistente: `rounded-pill` (`9999px`) para botones de acción social y etiquetas; `16px` a `24px` para tarjetas modulares.

3. **Modo Oscuro Puro y Alto Contraste**:
   - Fondos ultra oscuros pero no planos: base `--bm-bg: #030712`, superficies `--bm-surface: #0f172a`.
   - Textos principales con contraste garantizado: `#f8fafc` o `#ffffff`.
   - Elementos interactivos con hover de iluminación sutil (`background: rgba(255, 255, 255, 0.06)`).

---

## 2. Auditoría de Accesibilidad (WCAG 2.1 Nivel AA)

Para asegurar que cualquier músico del mundo, independientemente de sus capacidades físicas o cognitivas, pueda utilizar Bandmate:

1. **Contraste de Color (Ratio >= 4.5:1)**:
   - Todo texto o icono informativo sobre fondo claro u oscuro debe superar el ratio mínimo de 4.5:1 (y 3:1 para texto de gran tamaño >= 18pt).
   - En modo oscuro, evitar el uso de variables con tintes oscuros (como `#264653`) en títulos o textos; deben mapearse a tokens luminosos (`#f8fafc`).
   - Los botones deshabilitados deben mantener legibilidad suficiente (`color: #94a3b8` / `opacity: 0.65`).

2. **Navegación por Teclado y Estados de Foco**:
   - Todos los elementos interactivos (`button`, `a`, `input`, `textarea`, pills) deben ser alcanzables vía `Tab`.
   - Focos visibles (`:focus-visible`) que nunca deben ocultarse con `outline: none` sin proveer un reemplazo visual evidente (como `box-shadow: 0 0 0 3px rgba(233, 196, 106, 0.3)`).

3. **Áreas de Toque Táctiles (Touch Targets)**:
   - Todo botón o enlace interactivo debe tener un tamaño mínimo de área de toque de **44x44px** (o espaciado equivalente con padding) para facilitar su uso en dispositivos móviles y escenarios de escenario o directo.

4. **Etiquetado Semántico y Lectores de Pantalla**:
   - Atributos `aria-label` descriptivos en botones que solo contienen iconos (ej. `aria-label="Copiar enlace de publicación"`).
   - Iconos decorativos acompañados de texto o con `aria-hidden="true"`.
   - Atributos `alt` obligatorios y descriptivos en avatares de músicos y portadas de discos.

---

## 3. Principios de Frontend Design (Anthropic)

1. **Gestión de Estado Robusta y Reactiva**:
   - Uso de Signals en Angular (`signal`, `computed`, `effect`) para actualizaciones atómicas sin ciclos de render innecesarios.
   - Estados de carga claros (`Skeleton` o spinners discretos), estados de error comprensibles con reintento, y estados vacíos enriquecidos con llamadas a la acción (*Empty States*).

2. **Resiliencia de Red y Fallbacks**:
   - Degradación elegante: si una imagen de perfil falla o no existe, mostrar avatar por defecto (`avatar-fallback.svg`) sin romper el layout.
   - Respuestas asíncronas con feedback instantáneo y notificaciones Toast claras (`NotificationsService`).

3. **Internacionalización Integral (i18n)**:
   - Ningún texto visible en cabecera, navegación, feed, diálogos o botones debe estar hardcodeado.
   - Todo texto debe consumir `i18n.t('clave', 'Texto por defecto')`.
   - Soporte dinámico para Español (`es`) e Inglés (`en`) persistido en `localStorage` o perfil.

---

## 4. UX/UI PRO MAX Standards

1. **Micro-interacciones y Animaciones Fluidas**:
   - Entradas escalonadas (*staggered entrance*) en listados de tarjetas y posts mediante GSAP (`AnimationService.staggerList`).
   - Feedback táctil en botones de "Me gusta" con animación de pulso elástica (`bmPulse`).
   - Transiciones ultra suaves (`cubic-bezier(0.16, 1, 0.3, 1)` de 200 a 300ms).

2. **Experiencia de Red Social Moderna (Estilo X.com)**:
   - Selector "Para ti" y "Siguiendo" con indicador inferior fluido.
   - Caja de publicación con selector de tipo de contenido (💬 Estado, 🎸 Riff, 🎵 Canción, 🚨 Busco Músico) y botón flotante de publicación en esquina derecha.
   - Detección automática y resaltado de `#hashtags` interactivos para filtrado instantáneo.
   - Barra lateral con tendencias musicales dinámicas calculadas desde los posts y recomendaciones personalizadas de "A quién seguir".
   - Botón de seguir contextual en cada tarjeta de músico y publicación.
