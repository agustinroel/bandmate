import { Injectable, computed, signal } from '@angular/core';

export type SupportedLang = 'es' | 'en';

const LANG_KEY = 'bm.app.lang';

const TRANSLATIONS: Record<SupportedLang, Record<string, string>> = {
  es: {
    // Navigation
    'nav.songs': 'Canciones',
    'nav.setlists': 'Setlists',
    'nav.practice': 'Práctica',
    'nav.community': 'Comunidad',
    'nav.settings': 'Ajustes',
    'nav.profile': 'Perfil',
    'nav.logout': 'Cerrar sesión',

    // Community Header
    'community.hero.badge': 'Ecosistema Global',
    'community.hero.title': 'El punto de encuentro para todos los músicos del mundo.',
    'community.hero.subtitle': 'Comparte tus arreglos, descubre bandas, encuentra integrantes y conéctate directamente.',

    // Tabs
    'community.tabs.feed': 'Feed Musical',
    'community.tabs.musicians': 'Músicos & Bandas',
    'community.tabs.auditions': 'Audiciones',

    // Feed Filters & Composer
    'feed.for_you': 'Para ti',
    'feed.following': 'Siguiendo',
    'feed.composer.placeholder': '¿Qué estás tocando o componiendo hoy? Comparte un riff, busca músicos o publica un tema...',
    'feed.composer.status': '💬 Estado',
    'feed.composer.riff': '🎸 Riff',
    'feed.composer.song': '🎵 Canción',
    'feed.composer.audition': '🚨 Busco Músico',
    'feed.composer.attach_song': 'Adjuntar Canción',
    'feed.composer.publish': 'Publicar',
    'feed.composer.publishing': 'Publicando...',
    'feed.composer.success': '¡Publicación compartida con la comunidad!',
    'feed.composer.error': 'No se pudo publicar',

    // Post Cards & Interactions
    'feed.post.reposted': 'ha reposteado',
    'feed.post.play_live': 'Tocar en Vivo',
    'feed.post.reply': 'Responder',
    'feed.post.reply_placeholder': 'Escribe tu respuesta...',
    'feed.post.no_comments': 'Aún no hay respuestas. ¡Sé el primero en comentar!',
    'feed.post.comments_loading': 'Cargando comentarios...',
    'feed.post.share_tooltip': 'Compartir',
    'feed.post.link_copied': 'Enlace copiado al portapapeles',
    'feed.post.audition_badge': '🚨 Audición Abierta',

    // Feed Empty State
    'feed.empty.title': 'Aún no hay publicaciones en la comunidad',
    'feed.empty.desc': 'Sé el primero en compartir un riff, consultar acordes o publicar novedades con músicos de todo el mundo.',
    'feed.empty.auditions_title': 'No hay audiciones activas',
    'feed.empty.auditions_desc': 'Publica una convocatoria para buscar baterista, bajista, guitarrista o cantante para tu banda.',
    'feed.end_of_feed': 'Has llegado al final · Bandmate Community',

    // Sidebar
    'community.sidebar.trending': 'Tendencias Musicales',
    'community.sidebar.bands': 'Bandas en tu Ciudad',
    'community.sidebar.active_band': 'Banda Activa',
    'community.sidebar.view': 'Ver',

    // Settings
    'settings.title': 'Ajustes',
    'settings.subtitle': 'Gestiona tu cuenta, suscripción, tema visual e idioma.',
    'settings.profile': 'Perfil',
    'settings.profile.desc': 'Información pública e identidad',
    'settings.subscription': 'Suscripción',
    'settings.preferences': 'Preferencias',
    'settings.preferences.desc': 'Personalización de interfaz, idioma y tema',
    'settings.theme': 'Tema Visual',
    'settings.theme.light': '☀️ Claro',
    'settings.theme.dark': '🌙 Oscuro',
    'settings.theme.auto': '💻 Sistema',
    'settings.language': 'Idioma',
    'settings.language.es': '🇪🇸 Español',
    'settings.language.en': '🇬🇧 English',
    'settings.save': 'Guardar Cambios',
  },
  en: {
    // Navigation
    'nav.songs': 'Songs',
    'nav.setlists': 'Setlists',
    'nav.practice': 'Practice',
    'nav.community': 'Community',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.logout': 'Sign Out',

    // Community Header
    'community.hero.badge': 'Global Ecosystem',
    'community.hero.title': 'The meeting ground for musicians worldwide.',
    'community.hero.subtitle': 'Share arrangements, discover bands, find members, and connect directly.',

    // Tabs
    'community.tabs.feed': 'Music Feed',
    'community.tabs.musicians': 'Musicians & Bands',
    'community.tabs.auditions': 'Auditions',

    // Feed Filters & Composer
    'feed.for_you': 'For you',
    'feed.following': 'Following',
    'feed.composer.placeholder': 'What are you playing or composing today? Share a riff, find members or publish a song...',
    'feed.composer.status': '💬 Status',
    'feed.composer.riff': '🎸 Riff',
    'feed.composer.song': '🎵 Song',
    'feed.composer.audition': '🚨 Musician Wanted',
    'feed.composer.attach_song': 'Attach Song',
    'feed.composer.publish': 'Post',
    'feed.composer.publishing': 'Posting...',
    'feed.composer.success': 'Post shared with the community!',
    'feed.composer.error': 'Could not publish post',

    // Post Cards & Interactions
    'feed.post.reposted': 'reposted',
    'feed.post.play_live': 'Play on Stage',
    'feed.post.reply': 'Reply',
    'feed.post.reply_placeholder': 'Write your reply...',
    'feed.post.no_comments': 'No replies yet. Be the first to comment!',
    'feed.post.comments_loading': 'Loading comments...',
    'feed.post.share_tooltip': 'Share',
    'feed.post.link_copied': 'Link copied to clipboard',
    'feed.post.audition_badge': '🚨 Open Audition',

    // Feed Empty State
    'feed.empty.title': 'No posts in the community yet',
    'feed.empty.desc': 'Be the first to share a riff, discuss chords, or post updates with musicians around the world.',
    'feed.empty.auditions_title': 'No active auditions',
    'feed.empty.auditions_desc': 'Post an audition call looking for a drummer, bassist, guitarist or vocalist for your band.',
    'feed.end_of_feed': 'You have reached the end · Bandmate Community',

    // Sidebar
    'community.sidebar.trending': 'Music Trends',
    'community.sidebar.bands': 'Bands in your City',
    'community.sidebar.active_band': 'Active Band',
    'community.sidebar.view': 'View',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account, subscription, visual theme, and language.',
    'settings.profile': 'Profile',
    'settings.profile.desc': 'Public identity and information',
    'settings.subscription': 'Subscription',
    'settings.preferences': 'Preferences',
    'settings.preferences.desc': 'Interface appearance, language, and theme',
    'settings.theme': 'Visual Theme',
    'settings.theme.light': '☀️ Light',
    'settings.theme.dark': '🌙 Dark',
    'settings.theme.auto': '💻 System',
    'settings.language': 'Language',
    'settings.language.es': '🇪🇸 Spanish',
    'settings.language.en': '🇬🇧 English',
    'settings.save': 'Save Changes',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly currentLang = signal<SupportedLang>('es');

  constructor() {
    this.initLang();
  }

  private initLang() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(LANG_KEY) as SupportedLang;
    if (saved === 'es' || saved === 'en') {
      this.currentLang.set(saved);
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase();
      this.currentLang.set(browserLang.startsWith('es') ? 'es' : 'en');
    }
  }

  setLang(lang: SupportedLang) {
    this.currentLang.set(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANG_KEY, lang);
    }
  }

  t(key: string): string {
    const dict = TRANSLATIONS[this.currentLang()] || TRANSLATIONS.es;
    return dict[key] || TRANSLATIONS.es[key] || key;
  }
}
