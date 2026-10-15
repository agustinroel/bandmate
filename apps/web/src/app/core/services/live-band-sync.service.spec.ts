import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { LiveBandSyncService } from './live-band-sync.service';
import { supabase } from '../supabase/supabase.client';
import { AuthStore } from '../auth/auth.store';

try {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
} catch {
  // Already initialized in ng test
}

describe('LiveBandSyncService', () => {
  let service: LiveBandSyncService;
  let mockChannel: any;
  let handlers: Record<string, Function>;

  beforeEach(() => {
    TestBed.resetTestingModule();
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
    TestBed.resetTestingModule();
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

  it('should handle incoming scroll_sync broadcast when follower, but ignore when leader', () => {
    service.joinSession('band-rock-99', 'follower');

    handlers['broadcast:scroll_sync']?.({
      payload: { scrollTop: 320, scrollRatio: 0.45 },
    });
    expect(service.remoteScroll()).toEqual({
      scrollTop: 320,
      scrollRatio: 0.45,
    });

    // When leader, incoming remote scroll should NOT overwrite leader's scroll
    service.setRole('leader');
    handlers['broadcast:scroll_sync']?.({
      payload: { scrollTop: 999, scrollRatio: 0.99 },
    });
    expect(service.remoteScroll()).toEqual({
      scrollTop: 320,
      scrollRatio: 0.45,
    });
  });

  it('should broadcast custom stage cue with text and type custom', () => {
    service.joinSession('band-rock-99', 'leader');

    service.broadcastStageCue('SOLO DE TECLADOS 8 BARES', 'custom');

    const cue = service.activeCue();
    expect(cue).not.toBeNull();
    expect(cue?.text).toBe('SOLO DE TECLADOS 8 BARES');
    expect(cue?.type).toBe('custom');

    expect(mockChannel.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'stage_cue',
      payload: expect.objectContaining({
        text: 'SOLO DE TECLADOS 8 BARES',
        type: 'custom',
      }),
    });
  });

  it('should track presence with peer instruments and reflect in peers signal', () => {
    service.joinSession('band-rock-99', 'follower', 'Bass');

    mockChannel.presenceState.mockReturnValue({
      'usr-1': [{ userId: 'usr-1', userName: 'Alex', role: 'leader', instrument: 'Lead Guitar' }],
      'usr-2': [{ userId: 'usr-2', userName: 'John', role: 'follower', instrument: 'Drums' }],
    });

    handlers['presence:sync']?.();

    expect(service.peers()).toHaveLength(2);
    expect(service.peers()[0]).toEqual({
      userId: 'usr-1',
      userName: 'Alex',
      role: 'leader',
      instrument: 'Lead Guitar',
    });
    expect(service.peers()[1]).toEqual({
      userId: 'usr-2',
      userName: 'John',
      role: 'follower',
      instrument: 'Drums',
    });
    expect(service.peerCount()).toBe(2);
  });

  it('should update instrument dynamically and preserve it across role changes', () => {
    service.joinSession('band-rock-99', 'follower', 'Bass');
    expect(service.myInstrument()).toBe('Bass');

    service.setInstrument('Keys');
    expect(service.myInstrument()).toBe('Keys');
    expect(mockChannel.track).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'follower',
        instrument: 'Keys',
      })
    );

    service.setRole('leader');
    expect(mockChannel.track).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'leader',
        instrument: 'Keys',
      })
    );
  });

  it('should prevent follower from broadcasting scroll or section jump', () => {
    service.joinSession('band-rock-99', 'follower');

    service.broadcastScroll(100, 0.2);
    expect(mockChannel.send).not.toHaveBeenCalled();

    service.broadcastSectionJump('sec-intro');
    expect(mockChannel.send).not.toHaveBeenCalled();
  });

  it('should disconnect cleanly and reset all remote streams on leaveSession', () => {
    service.joinSession('band-rock-99', 'follower');
    handlers['broadcast:scroll_sync']?.({ payload: { scrollTop: 100, scrollRatio: 0.2 } });
    handlers['broadcast:song_change']?.({ payload: { songId: 's-1' } });
    handlers['broadcast:section_jump']?.({ payload: { sectionId: 'sec-1' } });

    expect(service.remoteScroll()).not.toBeNull();
    expect(service.remoteSongChange()).not.toBeNull();
    expect(service.remoteSectionJump()).not.toBeNull();

    service.leaveSession();
    expect(mockChannel.unsubscribe).toHaveBeenCalled();
    expect(service.isConnected()).toBe(false);
    expect(service.peers()).toEqual([]);
    expect(service.activeCue()).toBeNull();
    expect(service.remoteScroll()).toBeNull();
    expect(service.remoteSongChange()).toBeNull();
    expect(service.remoteSectionJump()).toBeNull();
  });
});
