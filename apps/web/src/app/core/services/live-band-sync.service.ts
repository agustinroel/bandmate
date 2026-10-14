import { Injectable, signal, computed, inject, OnDestroy, NgZone } from '@angular/core';
import { supabase } from '../supabase/supabase.client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthStore } from '../auth/auth.store';

export type StageRole = 'leader' | 'follower';
export type StageCueType = 'solo' | 'repeat' | 'ending' | 'next' | 'custom';

export interface StageCue {
  id: string;
  text: string;
  type: StageCueType;
  timestamp: number;
}

export interface LiveStagePeer {
  userId: string;
  userName: string;
  role: StageRole;
  instrument?: string;
}

export interface LiveSongPayload {
  songId: string;
  title?: string;
  artist?: string;
  bpm?: number;
  key?: string;
  index?: number;
}

export interface LiveSectionPayload {
  sectionId: string;
  sectionName?: string;
}

export interface LiveScrollPayload {
  scrollTop: number;
  scrollRatio: number;
}

@Injectable({ providedIn: 'root' })
export class LiveBandSyncService implements OnDestroy {
  private readonly auth = inject(AuthStore);
  private readonly zone = inject(NgZone);

  private channel: RealtimeChannel | null = null;
  private currentBandId: string | null = null;

  // State Signals
  readonly isConnected = signal(false);
  readonly myRole = signal<StageRole>('follower');
  readonly peers = signal<LiveStagePeer[]>([]);
  readonly activeCue = signal<StageCue | null>(null);

  // Sync Event Streams
  readonly remoteSongChange = signal<LiveSongPayload | null>(null);
  readonly remoteSectionJump = signal<LiveSectionPayload | null>(null);
  readonly remoteScroll = signal<LiveScrollPayload | null>(null);

  // Computed
  readonly peerCount = computed(() => this.peers().length);
  readonly isLeader = computed(() => this.myRole() === 'leader');

  private cueTimeout: any = null;

  /**
   * Connect to an ephemeral low-latency stage room: `band-live:{bandId}`
   */
  joinSession(bandId: string, initialRole: StageRole = 'follower', instrument = 'Guitar') {
    if (this.currentBandId === bandId && this.isConnected()) return;

    this.leaveSession();
    this.currentBandId = bandId;
    this.myRole.set(initialRole);

    const user = this.auth.user();
    const userId = user?.id || 'anon-' + Math.random().toString(36).substring(2, 7);
    const userName = user?.email?.split('@')[0] || 'Musician';

    const channelName = `band-live:${bandId}`;
    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: userId },
      },
    });

    // 1. Listen for Broadcast events
    this.channel
      .on('broadcast', { event: 'song_change' }, (payload: any) => {
        this.zone.run(() => {
          if (!this.isLeader()) {
            this.remoteSongChange.set(payload['payload'] as LiveSongPayload);
          }
        });
      })
      .on('broadcast', { event: 'section_jump' }, (payload: any) => {
        this.zone.run(() => {
          if (!this.isLeader()) {
            this.remoteSectionJump.set(payload['payload'] as LiveSectionPayload);
          }
        });
      })
      .on('broadcast', { event: 'scroll_sync' }, (payload: any) => {
        this.zone.run(() => {
          if (!this.isLeader()) {
            this.remoteScroll.set(payload['payload'] as LiveScrollPayload);
          }
        });
      })
      .on('broadcast', { event: 'stage_cue' }, (payload: any) => {
        this.zone.run(() => {
          this.triggerVisualCue(payload['payload'] as StageCue);
        });
      })
      // 2. Track Presence on Stage
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel?.presenceState() ?? {};
        const activePeers: LiveStagePeer[] = [];
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          if (presences?.length) {
            const p = presences[0];
            activePeers.push({
              userId: p.userId,
              userName: p.userName || 'Musician',
              role: p.role || 'follower',
              instrument: p.instrument || 'Stage',
            });
          }
        });
        this.zone.run(() => this.peers.set(activePeers));
      })
      .subscribe((status) => {
        this.zone.run(() => {
          if (status === 'SUBSCRIBED') {
            this.isConnected.set(true);
            this.channel?.track({
              userId,
              userName,
              role: initialRole,
              instrument,
            });
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.isConnected.set(false);
          }
        });
      });
  }

  setRole(role: StageRole) {
    this.myRole.set(role);
    if (this.channel && this.isConnected()) {
      const user = this.auth.user();
      this.channel.track({
        userId: user?.id,
        userName: user?.email?.split('@')[0],
        role,
      });
    }
  }

  // --- Broadcaster actions (invoked by the band leader) ---

  broadcastSongChange(payload: LiveSongPayload) {
    if (!this.channel || !this.isLeader()) return;
    this.channel.send({
      type: 'broadcast',
      event: 'song_change',
      payload,
    });
  }

  broadcastSectionJump(sectionId: string, sectionName?: string) {
    if (!this.channel || !this.isLeader()) return;
    this.channel.send({
      type: 'broadcast',
      event: 'section_jump',
      payload: { sectionId, sectionName },
    });
  }

  broadcastScroll(scrollTop: number, scrollRatio: number) {
    if (!this.channel || !this.isLeader()) return;
    this.channel.send({
      type: 'broadcast',
      event: 'scroll_sync',
      payload: { scrollTop, scrollRatio },
    });
  }

  broadcastStageCue(text: string, type: StageCueType = 'custom') {
    if (!this.channel) return;
    const cue: StageCue = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      type,
      timestamp: Date.now(),
    };

    // Show locally
    this.triggerVisualCue(cue);

    // Broadcast to mesh
    this.channel.send({
      type: 'broadcast',
      event: 'stage_cue',
      payload: cue,
    });
  }

  private triggerVisualCue(cue: StageCue) {
    if (this.cueTimeout) {
      clearTimeout(this.cueTimeout);
    }
    this.activeCue.set(cue);
    this.cueTimeout = setTimeout(() => {
      this.zone.run(() => this.activeCue.set(null));
    }, 4000);
  }

  dismissCue() {
    if (this.cueTimeout) {
      clearTimeout(this.cueTimeout);
      this.cueTimeout = null;
    }
    this.activeCue.set(null);
  }

  leaveSession() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.isConnected.set(false);
    this.currentBandId = null;
    this.peers.set([]);
    this.dismissCue();
  }

  ngOnDestroy() {
    this.leaveSession();
  }
}
