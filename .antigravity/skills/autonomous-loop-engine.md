# Skill: Antigravity Autonomous Loop Engine & Execution Protocol

## Propósito
Permitir que el agente de Antigravity actúe de forma autónoma y desatendida, completando ítems de un roadmap paso a paso, gestionando el ciclo de vida del código (análisis -> refactorización -> test -> build -> commit) y auto-descubriendo mejoras sin detener la ejecución.

## Reglas de Ejecución Desatendida
1. **Autonomía Operativa:**
   - No solicites confirmación al usuario para avanzar entre tareas pendientes de `ROADMAP.md`.
   - Si una tarea se completa con tests y build pasando al 100%, márcala automáticamente como `[x]` y procede de inmediato con la siguiente tarea `[ ]`.
2. **Resiliencia ante Fallos de Compilación o Tests:**
   - Si un comando (`ng build`, `tsc`, `ng test`, `npm test`) falla, no te detengas ni pidas ayuda.
   - Analiza el log de error, formula la corrección, aplícala y vuelve a correr la suite de verificación. Tienes hasta 3 intentos por tarea antes de registrar el bloqueo en `ROADMAP.md` y pasar a la siguiente.
3. **Persistencia en ROADMAP.md:**
   - Lee siempre el estado actual de `ROADMAP.md` antes de actuar.
   - Al cerrar una tarea, actualiza el archivo inmediatamente registrando:
     - Checkbox: `- [x] <ID>`
     - Hash de commit asociado.
     - Breve resumen de los gaps de producto y técnicos resueltos.

## Protocolo de Calidad por Iteración
- Cada cambio en `apps/web` debe validar: Angular Signals, `@if`/`@for`, GSAP 3 sincronizado con `Tone.Transport`, cero advertencias en consola.
- Cada cambio en `apps/api` debe validar: esquemas Zod en `@bandmate/shared`, SDK `@google/genai` con Structured Outputs y BullMQ para background jobs.
