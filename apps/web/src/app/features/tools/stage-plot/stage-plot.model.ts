export type StageElementType =
  | 'drums'
  | 'lead_vocals'
  | 'backing_vocals'
  | 'guitar_amp'
  | 'bass_amp'
  | 'keyboard'
  | 'monitor_wedge'
  | 'iem'
  | 'di_box'
  | 'power_drop';

export interface StageElement {
  id: string;
  type: StageElementType;
  label: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  channelNumber?: number;
  micType?: string;
  phantomPower?: boolean;
  standType?: string;
  monitorNeeds?: string;
}

export interface TechRiderMeta {
  bandName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  venueName: string;
  date: string;
  notes: string;
  monitorMixes: number;
  powerDrops: number;
}

export interface StagePlotPreset {
  id: string;
  name: string;
  description: string;
  elements: StageElement[];
}

export const STAGE_ELEMENT_TEMPLATES: {
  type: StageElementType;
  name: string;
  icon: string;
  defaultLabel: string;
  defaultMic: string;
  hasInput: boolean;
  needsPhantom: boolean;
  defaultStand: string;
}[] = [
  {
    type: 'drums',
    name: 'Batería (Kit)',
    icon: 'album',
    defaultLabel: 'Batería Acústica',
    defaultMic: 'Kit Mics (Kick, Snare, OH L/R)',
    hasInput: true,
    needsPhantom: true,
    defaultStand: 'Short Booms & Clips',
  },
  {
    type: 'lead_vocals',
    name: 'Voz Principal',
    icon: 'mic',
    defaultLabel: 'Voz Principal',
    defaultMic: 'Shure SM58 / Beta 58A',
    hasInput: true,
    needsPhantom: false,
    defaultStand: 'Boom Stand (Trípode)',
  },
  {
    type: 'backing_vocals',
    name: 'Coros',
    icon: 'record_voice_over',
    defaultLabel: 'Voz Coros',
    defaultMic: 'Shure SM58',
    hasInput: true,
    needsPhantom: false,
    defaultStand: 'Boom Stand',
  },
  {
    type: 'guitar_amp',
    name: 'Amp Guitarra',
    icon: 'speaker',
    defaultLabel: 'Guitarra Eléctrica',
    defaultMic: 'Shure SM57 / Sennheiser e906',
    hasInput: true,
    needsPhantom: false,
    defaultStand: 'Short Stand',
  },
  {
    type: 'bass_amp',
    name: 'Amp Bajo',
    icon: 'volume_up',
    defaultLabel: 'Bajo Eléctrico',
    defaultMic: 'D.I. XLR Out / Mic AKG D112',
    hasInput: true,
    needsPhantom: false,
    defaultStand: 'Direct XLR',
  },
  {
    type: 'keyboard',
    name: 'Teclado / Synth',
    icon: 'piano',
    defaultLabel: 'Teclado Estéreo',
    defaultMic: '2x D.I. Box Activa',
    hasInput: true,
    needsPhantom: true,
    defaultStand: 'X-Stand Teclado',
  },
  {
    type: 'monitor_wedge',
    name: 'Monitor de Suelo',
    icon: 'surround_sound',
    defaultLabel: 'Wedge Monitor',
    defaultMic: 'N/A',
    hasInput: false,
    needsPhantom: false,
    defaultStand: 'Piso',
  },
  {
    type: 'iem',
    name: 'Transmisor In-Ear',
    icon: 'headphones',
    defaultLabel: 'IEM Transmitter',
    defaultMic: 'N/A',
    hasInput: false,
    needsPhantom: false,
    defaultStand: 'Rack',
  },
  {
    type: 'di_box',
    name: 'Caja D.I.',
    icon: 'settings_input_component',
    defaultLabel: 'Direct Box',
    defaultMic: 'D.I. Jack -> XLR',
    hasInput: true,
    needsPhantom: true,
    defaultStand: 'Piso',
  },
  {
    type: 'power_drop',
    name: 'Toma 220V AC',
    icon: 'power',
    defaultLabel: 'Punto de Corriente',
    defaultMic: 'N/A',
    hasInput: false,
    needsPhantom: false,
    defaultStand: 'Piso',
  },
];
