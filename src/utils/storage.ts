import { EraSaveState, GameSaveData, Gender, PlayerProfile } from '../types/game';

export const SAVE_STORAGE_KEY = 'history_game_save_v1';

export function createInitialEraState(eraId: number): EraSaveState {
  // Give a starter item in Era 1 or clean initial state
  const starterItemByEra: Record<number, string> = {
    1: 'equip_prehistoric_spear',
    2: 'equip_gojoseon_spear',
    3: 'equip_three_kingdoms_sword',
    4: 'equip_ns_sword',
    5: 'equip_goryeo_blade',
    6: 'equip_joseon_blade',
    7: 'equip_korean_empire_greatsword',
    8: 'equip_ind_pistol'
  };

  const starter = starterItemByEra[eraId];
  return {
    gold: 150, // Friendly starting gold so 2nd-grade children can immediately try decorating or saving up
    char_level: 1,
    char_exp: 0,
    base_level: 1,
    invasion_gauge: 0,
    owned_items: starter ? [starter] : [],
    equipped_items: starter ? [starter] : [],
    owned_artifacts: [],
    placed_artifacts: {},
    solved_question_ids: [],
    total_attempts: 0,
    correct_attempts: 0,
    wrong_master_ids: [],
    graduated_master_ids: [],
    unlocked_codex_ids: [],
    boss_cleared: false
  };
}

export function createNewProfile(name: string, gender: Gender, id?: string): PlayerProfile {
  const profileId = id || `prof_${Date.now()}`;
  const eras: Record<string, EraSaveState> = {};
  for (let i = 1; i <= 8; i++) {
    eras[String(i)] = createInitialEraState(i);
  }
  return {
    id: profileId,
    name: name.trim() || '용감한 탐험가',
    gender,
    difficulty: 'easy',
    enemy_difficulty: 0,
    created_at: new Date().toISOString(),
    last_played_era: 1,
    eras
  };
}

export function loadSaveData(): GameSaveData {
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) {
      return { current_profile_id: null, profiles: {} };
    }
    const parsed = JSON.parse(raw) as GameSaveData;
    // Normalize eras 1..8 in case an older save is missing fields
    if (parsed.profiles) {
      Object.keys(parsed.profiles).forEach(profId => {
        const prof = parsed.profiles[profId];
        if (!prof.id) prof.id = profId;
        if (!prof.difficulty) prof.difficulty = 'easy';
        if (prof.enemy_difficulty === undefined || prof.enemy_difficulty === null) {
          prof.enemy_difficulty = 0;
        } else {
          // 0 ~ 10 clamp
          prof.enemy_difficulty = Math.max(0, Math.min(10, Math.round(prof.enemy_difficulty)));
        }
        if (!prof.eras) prof.eras = {};
        for (let i = 1; i <= 8; i++) {
          const eraKey = String(i);
          if (!prof.eras[eraKey]) {
            prof.eras[eraKey] = createInitialEraState(i);
          } else {
            const e = prof.eras[eraKey];
            e.owned_items = e.owned_items || [...(e.equipped_items || [])];
            e.owned_artifacts = e.owned_artifacts || Object.values(e.placed_artifacts || {});
            e.graduated_master_ids = e.graduated_master_ids || [];
            e.total_attempts = e.total_attempts ?? (e.solved_question_ids?.length || 0);
            e.correct_attempts = e.correct_attempts ?? (e.solved_question_ids?.length || 0);
          }
        }
      });
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load save data:', e);
    return { current_profile_id: null, profiles: {} };
  }
}

export function saveGameData(data: GameSaveData): void {
  try {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save game data:', e);
  }
}
