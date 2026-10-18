# Bandmate — Guía de Publicación en Google Play Store (Android `.aab`)

Bandmate está configurado con soporte completo para **PWA Offline + Notificaciones Push** y dos vías listas para empaquetar y publicar en **Google Play Store** (`com.bandmate.app`):

1. **Vía A (Recomendada por Google): Trusted Web Activity (TWA) con Bubblewrap** — Genera un paquete `.aab` (Android App Bundle) ultraligero (~2 MB) que se actualiza automáticamente cada vez que despliegas en producción.
2. **Vía B: Capacitor Native Shell** — Genera un proyecto nativo de Android Studio con acceso a plugins nativos adicionales.

---

## Vía A: Empaquetado TWA con Bubblewrap (`.aab` para Google Play Console)

### 1. Generar la llave de firma (`android.keystore`)
Ejecuta en la carpeta `apps/web`:
```bash
keytool -genkey -v -keystore apps/web/android.keystore -alias bandmate-release -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Obtener la huella SHA-256 y actualizar `assetlinks.json`
Obtén el fingerprint SHA-256 de tu keystore:
```bash
keytool -list -v -keystore apps/web/android.keystore -alias bandmate-release
```
Copia el valor `SHA256` y reemplázalo en:
- `apps/web/public/.well-known/assetlinks.json` (`sha256_cert_fingerprints`)

> **Nota**: Una vez que subas el primer `.aab` a Google Play Console con **Play App Signing** activado, copia también el certificado SHA-256 que te muestra Google Play Console en *Setup -> App signing* y agrégalo al array `sha256_cert_fingerprints` de `assetlinks.json`.

### 3. Construir el Android App Bundle (`.aab`) y `.apk`
Desde la raíz del repositorio:
```bash
npm run mobile:twa:build
```
Esto generará:
- `apps/web/app-release-bundle.aab` → Archivo listo para subir a **Google Play Console → Production / Internal Testing**.
- `apps/web/app-release-signed.apk` → Archivo listo para instalar y probar directamente en cualquier teléfono Android.

---

## Vía B: Empaquetado con Capacitor (Android Studio)

Si prefieres compilar el bundle estático dentro del contenedor nativo de Capacitor (`apps/web/capacitor.config.ts`):

```bash
# 1. Instalar dependencias de Capacitor en apps/web (solo la primera vez)
npm install -w apps/web @capacitor/core @capacitor/cli @capacitor/android @capacitor/status-bar @capacitor/splash-screen @capacitor/push-notifications

# 2. Inicializar plataforma Android (solo la primera vez)
npx --prefix apps/web cap add android

# 3. Compilar la web en modo producción y sincronizar con Android
npm run mobile:cap:sync

# 4. Abrir en Android Studio para generar Signed Bundle (.aab)
npm run mobile:cap:android
```

---

## Checklist de Google Play Console Validado
- **Application ID**: `com.bandmate.app`
- **Web App Manifest**: `/manifest.webmanifest` con íconos `192x192` y `512x512` (`any` + `maskable`) y `shortcuts` de acceso directo.
- **Offline & Stage Mode**: Service Worker (`/sw.js`) con caché offline de canciones y setlists + `navigator.wakeLock` para que la pantalla nunca se apague en medio de un tema.
- **Push Notifications**: Soporte nativo en `/sw.js` (`push` + `notificationclick`) e integración en `UserNotificationsService`.
