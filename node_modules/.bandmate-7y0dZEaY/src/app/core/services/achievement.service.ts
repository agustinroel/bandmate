import { Injectable, inject, signal } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { supabase } from '../supabase/supabase.client';
import {
  Achievement,
  AchievementToastComponent,
} from '../../shared/ui/achievement-toast/achievement-toast.component';

@Injectable({ providedIn: 'root' })
export class AchievementService {
  private readonly auth = inject(AuthStore);
  private readonly supabase = supabase;

  readonly userAchievements = signal<Achievement[]>([]);

  private toastInstance?: AchievementToastComponent;

  // Local list of achievements
  private readonly ACHIEVEMENTS: Record<string, Achievement> = {
    first_song_practice: {
      id: 'first_song_practice',
      title: '¡Primera Canción!',
      description: 'Has completado tu primera sesión de práctica.',
      icon: 'music_note',
    },
    first_arrangement: {
      id: 'first_arrangement',
      title: 'Maestro de Arreglos',
      description: 'Has creado tu primer arreglo musical.',
      icon: 'edit_note',
    },
    first_song_created: {
      id: 'first_song_created',
      title: 'Compositor Novel',
      description: 'Has añadido tu primera canción a la biblioteca.',
      icon: 'add_circle',
    },
    first_band: {
      id: 'first_band',
      title: 'Líder de Banda',
      description: 'Has fundado tu primera banda.',
      icon: 'groups',
    },
    first_invite: {
      id: 'first_invite',
      title: 'Reclutador',
      description: 'Has invitado a tu primer compañero de banda.',
      icon: 'person_add',
    },
    practice_streak_1: {
      id: 'practice_streak_1',
      title: 'Día 1: Calentando',
      description: 'Has empezado una racha de práctica.',
      icon: 'local_fire_department',
    },
    practice_streak_5: {
      id: 'practice_streak_5',
      title: '5 Días: Imparable',
      description: 'Has practicado durante 5 días seguidos.',
      icon: 'workspace_premium',
    },
    practice_streak_10: {
      id: 'practice_streak_10',
      title: '10 Días: Gran Maestría',
      description: '¡10 días de práctica constante! Eres un ejemplo.',
      icon: 'military_tech',
    },
    practice_streak_20: {
      id: 'practice_streak_20',
      title: '20 Días: Leyenda',
      description: 'Tu constancia ha alcanzado el nivel de leyenda.',
      icon: 'stars',
    },
    night_owl: {
      id: 'night_owl',
      title: 'Búho Nocturno',
      description: 'Práctica a altas horas de la madrugada.',
      icon: 'dark_mode',
    },
    early_bird: {
      id: 'early_bird',
      title: 'Madrugador',
      description: 'Empezando el día con buena música.',
      icon: 'wb_sunny',
    },
    tuner_used_first: {
      id: 'tuner_used_first',
      title: 'Siempre Afinado',
      description: 'Has usado el afinador por primera vez.',
      icon: 'tune',
    },
  };

  /**
   * Inject the reference to the global toast component
   */
  registerToast(component: AchievementToastComponent) {
    console.log('AchievementService: Toast component registered');
    this.toastInstance = component;
  }

  /**
   * For testing/debugging UI
   */
  debugShow(achievementId: string) {
    const achievement = this.ACHIEVEMENTS[achievementId];
    if (achievement) {
      this.toastInstance?.show(achievement);
    }
  }

  /**
   * Unlock an achievement for the current user
   */
  async unlock(achievementId: string): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const achievement = this.ACHIEVEMENTS[achievementId];
    if (!achievement) {
      console.warn(`Achievement ${achievementId} not found in metadata.`);
      return;
    }

    try {
      // Call RPC to unlock (idempotent)
      const { data, error } = await this.supabase.rpc('unlock_achievement', {
        p_user_id: userId,
        p_achievement_id: achievementId,
      });

      if (error) throw error;

      console.log(`Achievement check for ${achievementId}: newly unlocked = ${data}`);

      // If data is true, it means it was newly unlocked
      if (data === true) {
        if (!this.toastInstance) {
          console.error('AchievementService: Cannot show toast, instance not registered!');
        }
        this.toastInstance?.show(achievement);
      }
    } catch (err) {
      console.error('Failed to unlock achievement:', err);
    }
  }

  /**
   * Helper to check specific conditions (e.g. streaks)
   */
  async checkPracticeStreak(days: number): Promise<void> {
    if (days >= 1) await this.unlock('practice_streak_1');
    if (days >= 5) await this.unlock('practice_streak_5');
    if (days >= 10) await this.unlock('practice_streak_10');
    if (days >= 20) await this.unlock('practice_streak_20');
  }

  /**
   * Check time-based achievements
   */
  async checkTimeAchievements(): Promise<void> {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
      await this.unlock('night_owl');
    } else if (hour >= 5 && hour < 8) {
      await this.unlock('early_bird');
    }
  }

  /**
   * Load unlocked achievements for the current user
   */
  async loadUserAchievements(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    try {
      const { data, error } = await this.supabase.rpc('get_user_achievements', {
        p_user_id: userId,
      });

      if (error) throw error;

      const unlockedIds = data as string[];
      const unlocked = unlockedIds
        .map((id) => this.ACHIEVEMENTS[id])
        .filter((a): a is Achievement => !!a);

      this.userAchievements.set(unlocked);
    } catch (err) {
      console.error('Failed to load user achievements:', err);
    }
  }
}
