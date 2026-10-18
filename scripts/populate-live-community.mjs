import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT, 'apps/api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const DATA_DIR = path.join(ROOT, 'apps/api/.data');

const MUSICIANS = [
  {
    id: 'usr-lucas-cerati',
    username: 'lucas_stereo',
    full_name: 'Lucas Mendizábal',
    avatar_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=256&auto=format&fit=crop&q=80',
    instruments: ['Guitar', 'Vocals'],
    genres: ['Rock', 'Indie', 'Pop'],
    tier: 'pro',
    band: 'Vértigo Solar',
    isBandVerified: true,
    bio: 'Guitarrista principal en Vértigo Solar. Fanático de los delays analógicos, el audio estéreo de los 90s y las Fender Jazzmaster.',
  },
  {
    id: 'usr-valen-bass',
    username: 'valen_groove',
    full_name: 'Valentina Ríos',
    avatar_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=256&auto=format&fit=crop&q=80',
    instruments: ['Bass', 'Vocals'],
    genres: ['Funk', 'Soul', 'Rock'],
    tier: 'studio',
    band: 'Groove Baires',
    isBandVerified: true,
    bio: 'Bajista de sesión y productora. Precision Bass + cuerdas flatwound. Siempre lista para armar una base bien ajustada.',
  },
  {
    id: 'usr-mateo-drums',
    username: 'mateobeats',
    full_name: 'Mateo Echeverría',
    avatar_url: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=256&auto=format&fit=crop&q=80',
    instruments: ['Drums', 'Percussion'],
    genres: ['Rock', 'Grunge', 'Alternative'],
    tier: 'pro',
    band: 'Frecuencia Norte',
    isBandVerified: true,
    bio: 'Baterista de estudio y vivo. Ludwig Classic Maple 22/13/16. Si hay clic, me clavo; si no hay clic, empujo el estribillo.',
  },
  {
    id: 'usr-camila-keys',
    username: 'cami_synths',
    full_name: 'Camila Santoro',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80',
    instruments: ['Keyboard', 'Piano', 'Vocals'],
    genres: ['Pop', 'Indie', 'Synthwave'],
    tier: 'studio',
    band: 'Aethelgard',
    isBandVerified: true,
    bio: 'Tecladista, arregladora y obsesiva de los sintetizadores analógicos Prophet & Nord Stage. Armo pads y armonías vocales.',
  },
  {
    id: 'usr-nico-strato',
    username: 'nico_bluesman',
    full_name: 'Nicolás Pellegrini',
    avatar_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=256&auto=format&fit=crop&q=80',
    instruments: ['Guitar'],
    genres: ['Blues', 'Classic Rock', 'Soul'],
    tier: 'pro',
    band: 'Delta Sur',
    isBandVerified: false,
    bio: 'Stratocaster 62 Reissue directo a un valvular caliente. Buscando siempre el tono entre SRV, Gilmour y Mollo.',
  },
  {
    id: 'usr-sofi-vox',
    username: 'sofi_altamirano',
    full_name: 'Sofía Altamirano',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&auto=format&fit=crop&q=80',
    instruments: ['Vocals', 'Guitar'],
    genres: ['Indie', 'Folk', 'Pop'],
    tier: 'pro',
    band: 'Bruma Atlántica',
    isBandVerified: true,
    bio: 'Cantautora y frontwoman en Bruma Atlántica. Acústica en afinación DADGAD y letras para cantar a pulmón.',
  },
  {
    id: 'usr-tomas-riff',
    username: 'tomi_dropd',
    full_name: 'Tomás Villalba',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80',
    instruments: ['Guitar', 'Bass'],
    genres: ['Grunge', 'Metal', 'Hard Rock'],
    tier: 'pro',
    band: 'Óxido Urbano',
    isBandVerified: true,
    bio: 'Riffs pesados en Drop D, Les Paul Custom y cabezal Marshall JCM800. Amante de Soundgarden, Alice in Chains y La Renga.',
  },
  {
    id: 'usr-martina-sax',
    username: 'marti_horns',
    full_name: 'Martina Benítez',
    avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&auto=format&fit=crop&q=80',
    instruments: ['Saxophone', 'Keyboard'],
    genres: ['Jazz', 'Soul', 'Funk'],
    tier: 'free',
    band: 'Club Nocturno',
    isBandVerified: false,
    bio: 'Saxo tenor y arreglos de vientos para bandas de rock, soul y funk. Disponible para grabaciones remotas y fechas en vivo.',
  },
  {
    id: 'usr-julian-prod',
    username: 'juli_mixroom',
    full_name: 'Julián Krauss',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80',
    instruments: ['Guitar', 'Keyboard', 'Bass'],
    genres: ['Rock', 'Indie', 'Alternative'],
    tier: 'studio',
    band: 'Estudio Submarino',
    isBandVerified: true,
    bio: 'Productor musical, ingeniero de mezcla y multiinstrumentista. Ayudo a bandas a sonar demoledoras antes de entrar a grabar.',
  },
  {
    id: 'usr-clara-folk',
    username: 'clarita_cuerdas',
    full_name: 'Clara Montes',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&auto=format&fit=crop&q=80',
    instruments: ['Violin', 'Vocals', 'Ukulele'],
    genres: ['Folk', 'Indie', 'Pop'],
    tier: 'free',
    band: null,
    isBandVerified: false,
    bio: 'Violinista con pedalera de efectos y corista. Me encanta sumar texturas cinematográficas a proyectos indie y acústicos.',
  },
];

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Fetch real song IDs from Supabase so attachedSong links open real complete songs
  const songMap = {};
  if (supabase) {
    const { data: dbSongs } = await supabase.from('songs').select('id, title, artist, key, bpm');
    for (const s of dbSongs || []) {
      songMap[s.title.toLowerCase()] = {
        id: s.id,
        title: s.title,
        artist: s.artist,
        key: s.key || 'Em',
        bpm: s.bpm || 120,
      };
    }
  }

  const pickSong = (title, fallback) => {
    const found = songMap[title.toLowerCase()];
    return found || fallback;
  };

  const POSTS = [
    {
      id: 'post-bm-live-01',
      author: MUSICIANS[0],
      type: 'song_share',
      content:
        'Anoche cerramos el ensayo de 3 horas con este himno inmortal. El arreglo con todos los cortes de batería y el puente completo quedó impecable en el #StageMode de Bandmate. ¿Quién más la tiene fija en su #Setlist de vivo? #RockArgentino #DeMusicaLigera',
      attachedSong: pickSong('De Música Ligera', {
        id: 'seed-de-musica-ligera',
        title: 'De Música Ligera',
        artist: 'Soda Stereo',
        key: 'Bm',
        bpm: 124,
      }),
      tags: ['RockArgentino', 'DeMusicaLigera', 'StageMode', 'Setlist'],
      likesCount: 42,
      repostsCount: 9,
      commentsCount: 4,
      createdAt: hoursAgo(1.2),
    },
    {
      id: 'post-bm-live-02',
      author: MUSICIANS[1],
      type: 'looking_for_member',
      content:
        '🚨 ¡Atención bateristas de Buenos Aires / Zona Norte! En Groove Baires estamos buscando baterista estable para gira de clubes en mayo y grabación de EP (Funk / Neo-Soul / Rock). Tenemos sala propia equipada y repertorio cargado en Bandmate. ¡Postulate acá abajo! #BuscoBaterista #Audiciones #Ensayo',
      attachedSong: null,
      tags: ['BuscoBaterista', 'Audiciones', 'Ensayo'],
      likesCount: 31,
      repostsCount: 14,
      commentsCount: 3,
      createdAt: hoursAgo(2.5),
    },
    {
      id: 'post-bm-live-03',
      author: MUSICIANS[4],
      type: 'riff',
      content:
        'Estuve toda la tarde sacando los dos solos de Comfortably Numb nota por nota en el Modo Práctica con el loop al 75% de velocidad. El sustain que se logra empujando el Big Muff con un overdrive suave adelante es de otro planeta. #SoloGuitarra #GearTalk #Ensayo',
      attachedSong: pickSong('Comfortably Numb', {
        id: 'seed-comfortably-numb',
        title: 'Comfortably Numb',
        artist: 'Pink Floyd',
        key: 'Bm',
        bpm: 63,
      }),
      tags: ['SoloGuitarra', 'GearTalk', 'Ensayo'],
      likesCount: 54,
      repostsCount: 11,
      commentsCount: 4,
      createdAt: hoursAgo(3.8),
    },
    {
      id: 'post-bm-live-04',
      author: MUSICIANS[5],
      type: 'song_share',
      content:
        'Siempre que armamos fogón o prueba de sonido acústica termina saliendo #Wonderwall con capotraste en el 2do traste. Acá les dejo la versión completa con el pre-estribillo y el outro para que nadie se pierda en los cambios. #Setlist #Ensayo',
      attachedSong: pickSong('Wonderwall', {
        id: 'seed-wonderwall',
        title: 'Wonderwall',
        artist: 'Oasis',
        key: 'F#m',
        bpm: 87,
      }),
      tags: ['Wonderwall', 'Setlist', 'Ensayo'],
      likesCount: 39,
      repostsCount: 7,
      commentsCount: 3,
      createdAt: hoursAgo(5.1),
    },
    {
      id: 'post-bm-live-05',
      author: MUSICIANS[6],
      type: 'looking_for_member',
      content:
        '🔥 En Óxido Urbano buscamos bajista con equipo propio y ganas de sonar demoledor (afinación estándar y Drop D). Influencias: Divididos, Audioslave, Pearl Jam y La Renga. Ensayamos miércoles y sábados en Palermo. #BuscoBajista #Audiciones #RockArgentino',
      attachedSong: pickSong('ji ji ji', {
        id: 'seed-ji-ji-ji',
        title: 'Ji Ji Ji',
        artist: 'Patricio Rey y sus Redonditos de Ricota',
        key: 'Am',
        bpm: 138,
      }),
      tags: ['BuscoBajista', 'Audiciones', 'RockArgentino'],
      likesCount: 28,
      repostsCount: 12,
      commentsCount: 3,
      createdAt: hoursAgo(6.4),
    },
    {
      id: 'post-bm-live-06',
      author: MUSICIANS[3],
      type: 'status',
      content:
        'Acabo de probar la vista interactiva de acordes de Piano en Bandmate mientras armábamos los voicings de #StandByMe y Let It Be para el show del sábado. Poder transponer todo el arreglo +2 semitonos para la voz en un clic nos ahorró media hora de ensayo. #StageMode #Ensayo',
      attachedSong: pickSong('Stand By Me', {
        id: 'seed-stand-by-me',
        title: 'Stand By Me',
        artist: 'Ben E. King',
        key: 'A',
        bpm: 118,
      }),
      tags: ['StandByMe', 'StageMode', 'Ensayo'],
      likesCount: 47,
      repostsCount: 8,
      commentsCount: 3,
      createdAt: hoursAgo(8.0),
    },
    {
      id: 'post-bm-live-07',
      author: MUSICIANS[2],
      type: 'gig',
      content:
        '¡Fecha confirmada! Este viernes a las 22:30 hs tocamos con Frecuencia Norte en The Roxy Live. Ya tenemos todo el #Setlist sincronizado en #StageMode para salir al escenario sin un solo papel en el piso. ¡Los esperamos a todos! #RockArgentino #Ensayo',
      attachedSong: pickSong('Persiana Americana', {
        id: 'seed-persiana-americana',
        title: 'Persiana Americana',
        artist: 'Soda Stereo',
        key: 'Em',
        bpm: 102,
      }),
      tags: ['Setlist', 'StageMode', 'RockArgentino', 'Ensayo'],
      likesCount: 61,
      repostsCount: 15,
      commentsCount: 4,
      createdAt: hoursAgo(10.5),
    },
    {
      id: 'post-bm-live-08',
      author: MUSICIANS[8],
      type: 'riff',
      content:
        'Tip rápido de producción para guitarristas en sala de #Ensayo: bajen 3dB de ganancia en el ampli y suban los medios entre 800Hz y 1.5kHz. De repente cada nota del #SoloGuitarra corta la mezcla sin tapar al cantante ni pelearse con los platos. #GearTalk',
      attachedSong: null,
      tags: ['Ensayo', 'SoloGuitarra', 'GearTalk'],
      likesCount: 73,
      repostsCount: 22,
      commentsCount: 4,
      createdAt: hoursAgo(13.2),
    },
    {
      id: 'post-bm-live-09',
      author: MUSICIANS[7],
      type: 'looking_for_member',
      content:
        '🎷 En Club Nocturno buscamos baterista con buen manejo de dinámicas (ghost notes, shuffle y groove soul/funk) para ciclo acústico-eléctrico mensual. Repertorio: Amy Winehouse, Bill Withers, Spinetta y temas propios. #BuscoBaterista #Audiciones #StandByMe',
      attachedSong: pickSong('Valerie', {
        id: 'seed-valerie',
        title: 'Valerie',
        artist: 'Amy Winehouse',
        key: 'Eb',
        bpm: 106,
      }),
      tags: ['BuscoBaterista', 'Audiciones', 'StandByMe'],
      likesCount: 26,
      repostsCount: 9,
      commentsCount: 2,
      createdAt: hoursAgo(16.0),
    },
    {
      id: 'post-bm-live-10',
      author: MUSICIANS[9],
      type: 'song_share',
      content:
        'Estuvimos armando una versión a tres voces y violín de Flaca y Crimen para el próximo acústico. Qué armonías tan nobles tiene el #RockArgentino cuando lo desarmás en guitarra criolla y cuerdas. #DeMusicaLigera #Wonderwall',
      attachedSong: pickSong('Flaca', {
        id: 'seed-flaca',
        title: 'Flaca',
        artist: 'Andrés Calamaro',
        key: 'G',
        bpm: 96,
      }),
      tags: ['RockArgentino', 'DeMusicaLigera', 'Wonderwall'],
      likesCount: 44,
      repostsCount: 6,
      commentsCount: 3,
      createdAt: hoursAgo(19.5),
    },
    {
      id: 'post-bm-live-11',
      author: MUSICIANS[0],
      type: 'looking_for_member',
      content:
        '🎸 En Vértigo Solar abrimos audición para segunda guitarra rítmica / teclados + coros para nuestra gira de invierno. Buscamos alguien fanático del audio estéreo, delays con tap tempo y synth pads ochentosos. #Audiciones #RockArgentino #GearTalk',
      attachedSong: pickSong('Seguir Viviendo Sin Tu Amor', {
        id: 'seed-seguir-viviendo-sin-tu-amor',
        title: 'Seguir Viviendo Sin Tu Amor',
        artist: 'Luis Alberto Spinetta',
        key: 'D',
        bpm: 108,
      }),
      tags: ['Audiciones', 'RockArgentino', 'GearTalk'],
      likesCount: 35,
      repostsCount: 11,
      commentsCount: 2,
      createdAt: hoursAgo(22.0),
    },
    {
      id: 'post-bm-live-12',
      author: MUSICIANS[4],
      type: 'song_share',
      content:
        'Para los que pidieron un clásico de blues-rock para zapar en el final del ensayo: subí el arreglo completo de Pride and Joy y Hotel California con toda la progresión del solo de salida. ¡A romper esas cuerdas! #SoloGuitarra #StageMode #Setlist',
      attachedSong: pickSong('Hotel California', {
        id: 'seed-hotel-california',
        title: 'Hotel California',
        artist: 'Eagles',
        key: 'Bm',
        bpm: 74,
      }),
      tags: ['SoloGuitarra', 'StageMode', 'Setlist'],
      likesCount: 51,
      repostsCount: 13,
      commentsCount: 3,
      createdAt: hoursAgo(26.0),
    },
  ];

  const COMMENTS = [
    // Post 1 comments
    {
      id: 'cmt-bm-live-01',
      postId: 'post-bm-live-01',
      author: MUSICIANS[2],
      content: '¡Infaltable para cerrar arriba! En el corte antes del último estribillo siempre metemos dos compases de silencio total y explota. #RockArgentino',
      createdAt: hoursAgo(1.0),
    },
    {
      id: 'cmt-bm-live-02',
      postId: 'post-bm-live-01',
      author: MUSICIANS[1],
      content: 'El bajo en corcheas constantes en Bm – G – D – A te lleva solo. El #StageMode en la tablet arriba del ampli es un viaje de ida.',
      createdAt: hoursAgo(0.8),
    },
    {
      id: 'cmt-bm-live-03',
      postId: 'post-bm-live-01',
      author: MUSICIANS[3],
      content: 'Nosotros la enganchamos directo con Persiana Americana sin frenar el tempo en 124 BPM, la gente se vuelve loca.',
      createdAt: hoursAgo(0.6),
    },
    {
      id: 'cmt-bm-live-04',
      postId: 'post-bm-live-01',
      author: MUSICIANS[6],
      content: '¡Tremendo arreglo! Qué bueno que ahora está la letra y todos los cortes completos.',
      createdAt: hoursAgo(0.4),
    },
    // Post 2 comments
    {
      id: 'cmt-bm-live-05',
      postId: 'post-bm-live-02',
      author: MUSICIANS[2],
      content: '¡Qué proyectazo Valen! Les acabo de mandar mi postulación con un video en vivo tocando pocket funk. #BuscoBaterista',
      createdAt: hoursAgo(2.1),
    },
    {
      id: 'cmt-bm-live-06',
      postId: 'post-bm-live-02',
      author: MUSICIANS[8],
      content: 'Si necesitan grabar las baterías del EP en Estudio Submarino avisen que tenemos la Ludwig microfoneada lista.',
      createdAt: hoursAgo(1.8),
    },
    {
      id: 'cmt-bm-live-07',
      postId: 'post-bm-live-02',
      author: MUSICIANS[7],
      content: '¡Compartido para que llegue a más bateros! Si suman fila de vientos en mayo me anoto de cabeza.',
      createdAt: hoursAgo(1.5),
    },
    // Post 3 comments
    {
      id: 'cmt-bm-live-08',
      postId: 'post-bm-live-03',
      author: MUSICIANS[0],
      content: 'Ese combinación de Muff + Tube Screamer con delay en 420ms es la gloria absoluta. #SoloGuitarra #GearTalk',
      createdAt: hoursAgo(3.2),
    },
    {
      id: 'cmt-bm-live-09',
      postId: 'post-bm-live-03',
      author: MUSICIANS[8],
      content: 'Probalo con un toque de chorus estéreo muy sutil después del delay, abre el campo estéreo igual que en Pulse.',
      createdAt: hoursAgo(2.9),
    },
    {
      id: 'cmt-bm-live-10',
      postId: 'post-bm-live-03',
      author: MUSICIANS[6],
      content: 'El segundo solo sobre la base de Bm – A – G – Em es de los mejores momentos de la historia de la guitarra eléctrica.',
      createdAt: hoursAgo(2.4),
    },
    {
      id: 'cmt-bm-live-11',
      postId: 'post-bm-live-03',
      author: MUSICIANS[5],
      content: '¡El autoscroll en el Modo Práctica me salvó para no tener que soltar la púa en el cambio de sección!',
      createdAt: hoursAgo(2.0),
    },
    // Post 4 comments
    {
      id: 'cmt-bm-live-12',
      postId: 'post-bm-live-04',
      author: MUSICIANS[9],
      content: '¡Con una línea de violín haciendo la melodía del mellotrón en el estribillo queda soñada! #Wonderwall',
      createdAt: hoursAgo(4.6),
    },
    {
      id: 'cmt-bm-live-13',
      postId: 'post-bm-live-04',
      author: MUSICIANS[0],
      content: 'El secreto está en mantener el meñique y el anular clavados en la 1ra y 2da cuerda traste 3 durante todo el Em7 – G – Dsus4 – A7sus4.',
      createdAt: hoursAgo(4.2),
    },
    {
      id: 'cmt-bm-live-14',
      postId: 'post-bm-live-04',
      author: MUSICIANS[3],
      content: '¡Excelente que esté completa! Antes siempre nos faltaba la letra de la segunda estrofa.',
      createdAt: hoursAgo(3.9),
    },
    // Post 5 comments
    {
      id: 'cmt-bm-live-15',
      postId: 'post-bm-live-05',
      author: MUSICIANS[1],
      content: '¡Qué lindas influencias! Les reenvié la convocatoria a dos colegas bajistas que tocan con púa y Ampeg SVT. #BuscoBajista',
      createdAt: hoursAgo(5.8),
    },
    {
      id: 'cmt-bm-live-16',
      postId: 'post-bm-live-05',
      author: MUSICIANS[4],
      content: 'Ese riff de Ji Ji Ji doblado entre bajo y guitarra al unísono hace temblar cualquier escenario.',
      createdAt: hoursAgo(5.3),
    },
    {
      id: 'cmt-bm-live-17',
      postId: 'post-bm-live-05',
      author: MUSICIANS[2],
      content: '¡Éxitos con la búsqueda muchachos! Nos cruzamos el sábado en las salas de Palermo.',
      createdAt: hoursAgo(4.9),
    },
    // Post 6 comments
    {
      id: 'cmt-bm-live-18',
      postId: 'post-bm-live-06',
      author: MUSICIANS[5],
      content: '¡Tal cual! Como cantante, poder bajar medio tono o subir un tono entero según cómo tenés la garganta ese día sin volver locos a los demás es mágico.',
      createdAt: hoursAgo(7.4),
    },
    {
      id: 'cmt-bm-live-19',
      postId: 'post-bm-live-06',
      author: MUSICIANS[7],
      content: 'Y para los que tocamos vientos en Mi bemol o Si bemol nos re sirve para chequear la tonalidad al instante. #StandByMe',
      createdAt: hoursAgo(6.9),
    },
    {
      id: 'cmt-bm-live-20',
      postId: 'post-bm-live-06',
      author: MUSICIANS[1],
      content: 'El diagrama interactivo de teclado que agregaron se ve súper limpio en modo oscuro.',
      createdAt: hoursAgo(6.5),
    },
    // Post 7 comments
    {
      id: 'cmt-bm-live-21',
      postId: 'post-bm-live-07',
      author: MUSICIANS[0],
      content: '¡Ahí estaremos haciendo el aguante en primera fila! Rompan todo el viernes en el Roxy. #RockArgentino',
      createdAt: hoursAgo(9.8),
    },
    {
      id: 'cmt-bm-live-22',
      postId: 'post-bm-live-07',
      author: MUSICIANS[3],
      content: '¡Vamos Frecuencia Norte! Qué lujo ese #Setlist.',
      createdAt: hoursAgo(9.2),
    },
    {
      id: 'cmt-bm-live-23',
      postId: 'post-bm-live-07',
      author: MUSICIANS[4],
      content: 'Aguante salir al escenario sin carpetas ni papeles volándose con el ventilador del retorno jajaja #StageMode',
      createdAt: hoursAgo(8.7),
    },
    {
      id: 'cmt-bm-live-24',
      postId: 'post-bm-live-07',
      author: MUSICIANS[8],
      content: '¡Éxitos totales Mateo! Si graban consola multipista después pasame los tracks.',
      createdAt: hoursAgo(8.3),
    },
    // Post 8 comments
    {
      id: 'cmt-bm-live-25',
      postId: 'post-bm-live-08',
      author: MUSICIANS[6],
      content: '¡Amén! Y un filtro pasa-altos en 90Hz a las violas para dejarle todo el sublow libre al bombo y al bajo. #GearTalk',
      createdAt: hoursAgo(12.5),
    },
    {
      id: 'cmt-bm-live-26',
      postId: 'post-bm-live-08',
      author: MUSICIANS[4],
      content: 'Cuando descubrís que menos gain = más pegada y definición, no volvés atrás nunca más.',
      createdAt: hoursAgo(12.0),
    },
    {
      id: 'cmt-bm-live-27',
      postId: 'post-bm-live-08',
      author: MUSICIANS[2],
      content: 'En nombre de todos los bateristas del mundo: gracias por no poner el master en 9 apuntando a la altura de las rodillas 😂',
      createdAt: hoursAgo(11.4),
    },
    {
      id: 'cmt-bm-live-28',
      postId: 'post-bm-live-08',
      author: MUSICIANS[0],
      content: 'Inclinando el combo 30 grados hacia tus oídos bajás el volumen en sala a la mitad y te escuchás el doble de claro.',
      createdAt: hoursAgo(11.0),
    },
  ];

  // 1. Clean up #vitest / Test Musician junk from Supabase
  if (supabase) {
    console.log('🧹 Cleaning up #vitest test posts from Supabase...');
    const { data: junkPosts } = await supabase
      .from('community_posts')
      .select('id, content, author_name')
      .or('content.ilike.%#vitest%,author_name.eq.Test Musician');

    if (junkPosts && junkPosts.length > 0) {
      const junkIds = junkPosts.map((p) => p.id);
      await supabase.from('community_comments').delete().in('post_id', junkIds);
      await supabase.from('community_likes').delete().in('post_id', junkIds);
      await supabase.from('community_posts').delete().in('id', junkIds);
      console.log(`   Deleted ${junkIds.length} test posts from Supabase.`);
    }
  }

  // 2. Format posts and comments for JSON store & Supabase
  const formattedPosts = POSTS.map((p) => ({
    id: p.id,
    authorId: p.author.id,
    authorName: p.author.full_name,
    authorUsername: p.author.username,
    authorAvatar: p.author.avatar_url,
    authorInstruments: p.author.instruments,
    authorTier: p.author.tier,
    authorBand: p.author.band,
    isBandVerified: p.author.isBandVerified,
    repostedBy: null,
    repostedByName: null,
    type: p.type,
    content: p.content,
    attachedSong: p.attachedSong,
    mediaUrl: null,
    mediaType: null,
    youtubeId: null,
    tags: p.tags,
    likesCount: p.likesCount,
    repostsCount: p.repostsCount,
    commentsCount: p.commentsCount,
    isLiked: false,
    createdAt: p.createdAt,
  }));

  const formattedComments = COMMENTS.map((c) => ({
    id: c.id,
    postId: c.postId,
    authorId: c.author.id,
    authorName: c.author.full_name,
    authorUsername: c.author.username,
    authorAvatar: c.author.avatar_url,
    content: c.content,
    createdAt: c.createdAt,
  }));

  // 3. Upsert into Supabase community_posts and community_comments
  if (supabase) {
    console.log('🚀 Upserting 12 rich community posts & 28 comments into Supabase...');
    const dbPosts = formattedPosts.map((p) => ({
      id: p.id,
      author_id: p.authorId,
      author_name: p.authorName,
      author_username: p.authorUsername,
      author_avatar: p.authorAvatar,
      author_instruments: p.authorInstruments,
      author_tier: p.authorTier,
      author_band: p.authorBand,
      is_band_verified: p.isBandVerified,
      reposted_by: p.repostedBy,
      reposted_by_name: p.repostedByName,
      type: p.type,
      content: p.content,
      attached_song: p.attachedSong,
      media_url: p.mediaUrl,
      media_type: p.mediaType,
      youtube_id: p.youtubeId,
      tags: p.tags,
      likes_count: p.likesCount,
      reposts_count: p.repostsCount,
      comments_count: p.commentsCount,
      created_at: p.createdAt,
    }));

    const { error: postErr } = await supabase.from('community_posts').upsert(dbPosts, { onConflict: 'id' });
    if (postErr) {
      console.warn('Supabase community_posts upsert warning:', postErr.message);
    }

    const dbComments = formattedComments.map((c) => ({
      id: c.id,
      post_id: c.postId,
      author_id: c.authorId,
      author_name: c.authorName,
      author_username: c.authorUsername,
      author_avatar: c.authorAvatar,
      content: c.content,
      created_at: c.createdAt,
    }));

    const { error: cmtErr } = await supabase.from('community_comments').upsert(dbComments, { onConflict: 'id' });
    if (cmtErr) {
      console.warn('Supabase community_comments upsert warning:', cmtErr.message);
    }

    // Fetch all non-test posts from Supabase so local JSON is 100% synced
    const { data: allDbPosts } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (allDbPosts && allDbPosts.length > 0) {
      const syncedPosts = allDbPosts
        .filter((r) => !(r.content || '').includes('#vitest') && r.author_name !== 'Test Musician')
        .map((r) => ({
          id: r.id,
          authorId: r.author_id,
          authorName: r.author_name,
          authorUsername: r.author_username,
          authorAvatar: r.author_avatar,
          authorInstruments: r.author_instruments || [],
          authorTier: r.author_tier,
          authorBand: r.author_band,
          isBandVerified: r.is_band_verified,
          repostedBy: r.reposted_by,
          repostedByName: r.reposted_by_name,
          type: r.type,
          content: r.content,
          attachedSong: r.attached_song,
          mediaUrl: r.media_url,
          mediaType: r.media_type,
          youtubeId: r.youtube_id,
          tags: r.tags || [],
          likesCount: r.likes_count ?? 0,
          repostsCount: r.reposts_count ?? 0,
          commentsCount: r.comments_count ?? 0,
          createdAt: r.created_at,
        }));
      await fs.writeFile(path.join(DATA_DIR, 'feed_posts.json'), JSON.stringify(syncedPosts, null, 2), 'utf8');
      console.log(`✅ Synced ${syncedPosts.length} live posts to apps/api/.data/feed_posts.json`);
    } else {
      await fs.writeFile(path.join(DATA_DIR, 'feed_posts.json'), JSON.stringify(formattedPosts, null, 2), 'utf8');
    }

    const { data: allDbComments } = await supabase
      .from('community_comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (allDbComments && allDbComments.length > 0) {
      const syncedComments = allDbComments
        .filter((r) => r.author_name !== 'Commenter Musician')
        .map((r) => ({
          id: r.id,
          postId: r.post_id,
          authorId: r.author_id,
          authorName: r.author_name,
          authorUsername: r.author_username,
          authorAvatar: r.author_avatar,
          content: r.content,
          createdAt: r.created_at,
        }));
      await fs.writeFile(path.join(DATA_DIR, 'feed_comments.json'), JSON.stringify(syncedComments, null, 2), 'utf8');
      console.log(`✅ Synced ${syncedComments.length} live comments to apps/api/.data/feed_comments.json`);
    } else {
      await fs.writeFile(path.join(DATA_DIR, 'feed_comments.json'), JSON.stringify(formattedComments, null, 2), 'utf8');
    }
  } else {
    await fs.writeFile(path.join(DATA_DIR, 'feed_posts.json'), JSON.stringify(formattedPosts, null, 2), 'utf8');
    await fs.writeFile(path.join(DATA_DIR, 'feed_comments.json'), JSON.stringify(formattedComments, null, 2), 'utf8');
    console.log('✅ Wrote posts and comments to local JSON store.');
  }
}

main().catch((err) => {
  console.error('❌ Error populating community:', err);
  process.exit(1);
});
