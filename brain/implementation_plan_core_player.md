# 🎼 Hoja de Ruta: Core Player Experience MVP

Este plan prioriza la experiencia del músico sentado con su instrumento. El objetivo es que la transición entre "Abrir App" y "Tocar canción con acordes perfectos" sea menor a 10 segundos.

---

## 🔝 Prioridad 1: El Escenario (Song Viewer & Utilities)

_Objetivo: Que el músico no tenga que tocar la pantalla una vez que suena la primera nota._

### 🛠️ [NEW] Barra de Control "Live" en Song Viewer

- **Controles de Transposición**: Botones `+` / `-` y botón `Reset` integrados directamente sobre la letra.
- **Auto-Scroll Inteligente**: Implementar el motor de scroll de la `PracticePage` en el visor individual. Slider de velocidad persistente por canción.
- **Wake Lock Ubicuo**: Asegurar que la pantalla **nunca** se apague mientras hay una canción abierta.

### 🎸 Utilidades "One-Tap"

- **Floating Tuner**: El afinador debe poder abrirse como un pequeño overlay mientras se sigue viendo la canción.
- **Metrónomo Visual**: Un indicador sutil de tempo (pulso luminoso) opcional en la esquina.

---

## ⚡ Prioridad 2: Adquisición de Contenido (Frictionless Ingestion)

_Objetivo: Si el músico quiere tocarla, Bandmate la tiene._

- **Búsqueda con Auto-Import**: Integrar el motor de MusicBrainz/Gemini en el buscador global.
  - _Flujo:_ Buscar → "No en tu biblioteca" → Botón "Generar Arreglo IA" → Apertura inmediata del viewer (en < 5 seg).
- **Corrección Técnica de IA (Hardening)**: Ajustar los prompts de IA para que prioricen la "ejecución real" (ej: añadir bajos caminantes o voicings específicos de jazz si el género lo requiere).

---

## 🏛️ Prioridad 3: Organización de la Sesión

_Objetivo: Estructurar la práctica sin burocracia._

- **Quick-Setlist "Jam"**: Un botón para "Añadir a sesión actual" desde cualquier parte, creando un setlist efímero para la tarde de práctica.
- **Navegación por Secciones**: Botones rápidos para saltar a `Verse`, `Chorus`, `Bridge` (Scroll instantáneo).

---

## 📈 Prioridad 4: Progreso y Feedback

_Objetivo: Sentir que cada minuto con el instrumento cuenta._

- **Widget de Práctica Hoy**: En la Home, mostrar "Llevas 12 min de práctica" en tiempo real.
- **Historial de Repeticiones**: Marcar canciones como "Dominada" o "En progreso" con un solo click.

---

## 🏗️ Cambios Técnicos Inmediatos

1.  **Refactor `SongViewerComponent`**: Mover la lógica de `transpose` y `scroll` de la `PracticePage` a un servicio compartido o al visor core.
2.  **UI/UX**: Rediseñar el header del `SongViewer` para dar cabida a estos controles sin saturar la vista.
