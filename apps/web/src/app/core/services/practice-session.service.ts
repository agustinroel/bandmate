import { Injectable, inject, signal } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { supabase } from '../supabase/supabase.client';
import { AchievementService } from './achievement.service';

export interface PracticeStats {
  totalSeconds: number;
  sessionCount: number;
  songsCount: number;
  completedCount: number;
}

export interface PracticeSummary {
  today: PracticeStats;
  week: PracticeStats;
  month: PracticeStats;
  all: PracticeStats;
}

export interface MostPracticedSong {
  id: string;
  title: string;
  artist: string;
  practice_count: number;
  total_seconds: number;
}

@Injectable({ providedIn: 'root' })
export class PracticeSessionService {
  private readonly auth = inject(AuthStore);
  private readonly achievements = inject(AchievementService);
  private readonly supabase = supabase;

  // Current session tracking
  private _currentSessionId = signal<string | null>(null);
  private _sessionStartTime: Date | null = null;
  private _songsViewedCount = 0;

  // Current song tracking
  private _currentSongId: string | null = null;
  private _songStartTime: Date | null = null;

  // Stats cache
  readonly summary = signal<PracticeSummary | null>(null);
  readonly mostPracticed = signal<MostPracticedSong[]>([]);
  readonly streak = signal<number>(0);
  readonly isLoading = signal(false);

  /**
   * Start a new practice session
   */
  async startSession(setlistId: string): Promise<string | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;

    this._sessionStartTime = new Date();
    this._songsViewedCount = 0;

    const { data, error } = await this.supabase
      .from('practice_sessions')
      .insert({
        user_id: userId,
        setlist_id: setlistId,
        started_at: this._sessionStartTime.toISOString(),
        songs_practiced: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to start practice session:', error);
      return null;
    }

    this._currentSessionId.set(data.id);

    // ✅ Check time achievements (Night Owl / Early Bird)
    this.achievements.checkTimeAchievements();

    return data.id;
  }

  /**
   * Record when a song starts being viewed
   */
  async recordSongStart(songId: string): Promise<void> {
    const sessionId = this._currentSessionId();
    if (!sessionId) return;

    // 1. If there was a previous song, record its duration
    await this.recordSongEnd();

    // 2. Start new song tracking
    this._currentSongId = songId;
    this._songStartTime = new Date();
    this._songsViewedCount++;

    // Update main session song count
    await this.supabase
      .from('practice_sessions')
      .update({ songs_practiced: this._songsViewedCount })
      .eq('id', sessionId);
  }

  /**
   * End current song tracking and save to DB
   */
  private async recordSongEnd(): Promise<void> {
    const sessionId = this._currentSessionId();
    if (!sessionId || !this._currentSongId || !this._songStartTime) return;

    const endTime = new Date();
    const durationSec = Math.round((endTime.getTime() - this._songStartTime.getTime()) / 1000);

    // Only record if viewed for more than 2 seconds (to avoid skips)
    if (durationSec >= 2) {
      await this.supabase.rpc('record_song_practice', {
        p_session_id: sessionId,
        p_song_id: this._currentSongId,
        p_duration_sec: durationSec,
      });
    }

    this._currentSongId = null;
    this._songStartTime = null;
  }

  /**
   * End the current practice session
   */
  async endSession(completed: boolean = false): Promise<void> {
    const sessionId = this._currentSessionId();
    if (!sessionId || !this._sessionStartTime) return;

    // Record the last song
    await this.recordSongEnd();

    const endTime = new Date();
    const durationSec = Math.round((endTime.getTime() - this._sessionStartTime.getTime()) / 1000);

    const { error } = await this.supabase
      .from('practice_sessions')
      .update({
        ended_at: endTime.toISOString(),
        duration_sec: durationSec,
        songs_practiced: this._songsViewedCount,
        completed,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to end practice session:', error);
    } else {
      // ✅ Achievement triggers
      if (this._songsViewedCount > 0) {
        this.achievements.unlock('first_song_practice');
      }
    }

    // Reset tracking
    this._currentSessionId.set(null);
    this._sessionStartTime = null;
    this._songsViewedCount = 0;
  }

  /**
   * Load all stats for the current user
   */
  async loadStats(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.isLoading.set(true);

    try {
      // Load summary
      const { data: summaryData, error: summaryError } = await this.supabase.rpc(
        'get_practice_summary',
        { p_user_id: userId },
      );

      if (!summaryError && summaryData) {
        this.summary.set(summaryData as PracticeSummary);
      }

      // Load most practiced songs
      const { data: songsData, error: songsError } = await this.supabase.rpc(
        'get_most_practiced_songs',
        { p_user_id: userId, p_limit: 5 },
      );

      if (!songsError && songsData) {
        this.mostPracticed.set(songsData as MostPracticedSong[]);
      }

      // Load streak
      const { data: streakData, error: streakError } = await this.supabase.rpc(
        'get_practice_streak',
        { p_user_id: userId },
      );

      if (!streakError && streakData !== null) {
        this.streak.set(streakData as number);
        // ✅ Achievement triggers
        this.achievements.checkPracticeStreak(streakData as number);
      }
    } catch (err) {
      console.error('Failed to load practice stats:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Format seconds to human-readable duration
   */
  formatDuration(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds <= 0) return '0m';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
