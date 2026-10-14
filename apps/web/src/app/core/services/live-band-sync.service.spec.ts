import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LiveBandSyncService } from './live-band-sync.service';
import { supabase } from '../supabase/supabase.client';
import { AuthStore } from '../auth/auth.store';

describe('LiveBandSyncService', () => {
  let service: LiveBandSyncService;
  let mockChannel: any;
  let handlers: Record<string, Function>;

  beforeEach(() => {
    handlers = {};
    mockChannel = {
      on: vi.fn((type: string, filter: any, callback: Function) => {
        const key = filter?.event ? `${type}:${filter.event}` : type;
        handlers[key] = callback;
        return mockChannel;
      }),
      subscribe: vi.fn((callback?: Function) => {
        if (callback) callback('SUBSCRIBED');
        return mockChannel;
      }),
      track: vi.fn().mockResolvedValue('ok'),
      send: vi.fn().mockResolvedValue('ok'),
      unsubscribe: vi.fn().mockResolvedValue('ok'),
      presenceState: vi.fn().mockReturnValue({}),
    };

    vi.spyOn(supabase, 'channel').mockReturnValue(mockChannel as any);

    TestBed.configureTestingModule({
      providers: [
        LiveBandSyncService,
        {
          provide: AuthStore,
          useValue: {
            user: () => ({ id: 'usr-123', email: 'bandleader@bandmate.live' }),
          },
        },
      ],
    });

    service = TestBed.inject(LiveBandSyncService);
  });

  afterEach(() => {
    service.leaveSession();
    vi.restoreAllMocks();
  });

  it('should initialize with disconnected follower state', () => {
    expect(service.isConnected()).toBe(false);
    expect(service.myRole()).toBe('follower');
    expect(service.isLeader()).toBe(false);
    expect(service.peers()).toEqual([]);
    expect(service.activeCue()).toBeNull();
  });

  it('should join session and subscribe to realtime channel', () => {
    service.joinSession('band-rock-99', 'leader', 'Lead Guitar');

    expect(supabase.channel).toHaveBeenCalledWith('band-live:band-rock-99', expect.any(Object));
    expect(service.isConnected()).toBe(true);
    expect(service.myRole()).toBe('leader');
    expect(service.isLeader()).toBe(true);
    expect(mockChannel.track).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'usr-123',
        userName: 'bandleader',
        role: 'leader',
        instrument: 'Lead Guitar',
      })
    );
  });

  it('should update role dynamically', () => {
    service.joinSession('band-rock-99', 'follower');
    expect(service.isLeader()).toBe(false);

    service.setRole('leader');
    expect(service.myRole()).toBe('leader');
    expect(service.isLeader()).toBe(true);
    expect(mockChannel.track).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'leader',
      })
    );
  });

  it('should broadcast song changes only when leader', () => {
    service.joinSession('band-rock-99', 'follower');
    service.broadcastSongChange({ songId: 'song-1', title: 'Highway to Rock' });
    expect(mockChannel.send).not.toHaveBeenCalled();

    service.setRole('leader');
    service.broadcastSongChange({ songId: 'song-1', title: 'Highway to Rock', bpm: 120 });
    expect(mockChannel.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'song_change',
      payload: { songId: 'song-1', title: 'Highway to Rock', bpm: 120 },
    });
  });

  it('should broadcast section jump and scroll sync only when leader', () => {
    service.joinSession('band-rock-99', 'leader');

    service.broadcastSectionJump('sec-solo', 'Guitar Solo');
    expect(mockChannel.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'section_jump',
      payload: { sectionId: 'sec-solo', sectionName: 'Guitar Solo' },
    });

    service.broadcastScroll(450, 0.65);
    expect(mockChannel.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'scroll_sync',
      payload: { scrollTop: 450, scrollRatio: 0.65 },
    });
  });

  it('should broadcast stage cues and set activeCue locally', () => {
    service.joinSession('band-rock-99', 'leader');

    service.broadcastStageCue('ONE MORE TIME!', 'repeat');

    const cue = service.activeCue();
    expect(cue).not.toBeNull();
    expect(cue?.text).toBe('ONE MORE TIME!');
    expect(cue?.type).toBe('repeat');

    expect(mockChannel.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'stage_cue',
      payload: expect.objectContaining({
        text: 'ONE MORE TIME!',
        type: 'repeat',
      }),
    });

    service.dismissCue();
    expect(service.activeCue()).toBeNull();
  });

  it('should handle incoming broadcast events when follower', () => {
    service.joinSession('band-rock-99', 'follower');

    // Simulate song_change broadcast
    handlers['broadcast:song_change']?.({
      payload: { songId: 'song-remote-42', title: 'Sweet Harmony' },
    });
    expect(service.remoteSongChange()).toEqual({
      songId: 'song-remote-42',
      title: 'Sweet Harmony',
    });

    // Simulate section_jump broadcast
    handlers['broadcast:section_jump']?.({
      payload: { sectionId: 'sec-chorus', sectionName: 'Chorus 2' },
    });
    expect(service.remoteSectionJump()).toEqual({
      sectionId: 'sec-chorus',
      sectionName: 'Chorus 2',
    });

    // Simulate stage_cue broadcast
    handlers['broadcast:stage_cue']?.({
      payload: { id: 'cue-1', text: 'ENDING ON 4', type: 'ending', timestamp: 123456 },
    });
    expect(service.activeCue()?.text).toBe('ENDING ON 4');
  });

  it('should disconnect cleanly and reset state on leaveSession', () => {
    service.joinSession('band-rock-99', 'leader');
    expect(service.isConnected()).toBe(true);

    service.leaveSession();
    expect(mockChannel.unsubscribe).toHaveBeenCalled();
    expect(service.isConnected()).toBe(false);
    expect(service.peers()).toEqual([]);
    expect(service.activeCue()).toBeNull();
  });
});
