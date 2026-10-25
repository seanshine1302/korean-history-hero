export type UserDifficulty = 'easy' | 'normal' | 'hard';
export type Gender = 'boy' | 'girl';

export interface EraSaveState {
  gold: number;
  char_level: number;
  char_exp: number;
  base_level: number;
  invasion_gauge: number;
  owned_items: string[];
  equipped_items: string[];
  owned_artifacts: string[];
  placed_artifacts: Record<string, string>; // slot_1 ~ slot_5 -> artifact_id
  solved_question_ids: string[];
  total_attempts: number;
  correct_attempts: number;
  wrong_master_ids: string[];
  graduated_master_ids: string[]; // '완벽히 이해한 역사 지식' 배지 획득 목록 (Section 10.2)
  unlocked_codex_ids: string[];
  boss_cleared: boolean;
}

export interface PlayerProfile {
  id: string;
  name: string;
  gender: Gender;
  difficulty?: UserDifficulty;
  enemy_difficulty?: number; // 0 (기본 최저) ~ 10 (최고 난이도)
  cloud_sync_code?: string; // 클라우드 동기화 탐험 코드 (예: KOR-8492)
  cloud_last_synced?: string; // 마지막 클라우드 동기화 시간 (ISO)
  created_at: string;
  last_played_era: number;
  eras: Record<string, EraSaveState>;
}

export interface GameSaveData {
  current_profile_id: string | null;
  profiles: Record<string, PlayerProfile>;
}

export interface KnowledgeItem {
  knowledge_id: string;
  era: string;
  era_id: number;
  category: 'person' | 'artifact' | 'event' | 'culture' | 'system';
  title: string;
  summary: string;
  evidence_type: 'historical_fact' | 'tradition' | 'myth' | 'interpretation';
  keywords: string[];
  source_pdf: string;
  visual_asset: string;
  recommended_grade?: number;
  cognitive_complexity?: 'low' | 'medium' | 'high';
  historical_context_level?: number;
  visual_cue_required?: boolean;
}

export interface QuizQuestion {
  question_id: string;
  master_id: string;
  internal_difficulty: number;
  question_type: 'artifact_identification' | 'person_matching' | 'cause_effect' | 'myth_understanding';
  visual_cue_asset: string;
  stem: string;
  choices: string[];
  answer_index: number;
  explanation: string;
}

export interface DifficultyProfileConfig {
  version: string;
  profiles: Record<UserDifficulty, {
    label: string;
    difficulty_weights: Record<string, number>;
  }>;
}

export interface EconomyRulesConfig {
  version: string;
  quiz_rewards: {
    correct_gold_by_difficulty: Record<UserDifficulty, number>;
    correct_exp_by_difficulty: Record<UserDifficulty, number>;
    perfect_clear_bonus_gold: number;
    review_correct_gold: number;
  };
  character_level_up_exp: number[];
  base_upgrade_costs: Record<string, number>;
  sell_refund_rate?: number;
}

export interface SubEnemy {
  id: string;
  name: string;
  asset: string;
}

export interface EncounterUnit {
  id: string;
  name: string;
  asset: string;
  sub_enemies?: SubEnemy[];
  power: number;
  difficulty?: number;
  reward_gold: number;
  reward_exp: number;
  reward_item?: string;
  description: string;
}

export interface InvasionRulesConfig {
  version: string;
  gauge_rules: {
    max_gauge: number;
    increase_per_wrong: number;
    decrease_per_review_correct: number;
    max_invasion_per_session: number;
  };
  era_encounters: Record<string, {
    event_type: 'combat' | 'mission';
    normal_enemy: EncounterUnit;
    boss: EncounterUnit;
  }>;
}

export interface DisplaySlotConfig {
  slot_id: string;
  x: number;
  y: number;
  scale: number;
}

export interface BaseLevelGraphic {
  name: string;
  asset_path: string;
  character_position: { x: number; y: number };
  display_slots: DisplaySlotConfig[];
}

export interface EraGraphicConfig {
  era: string;
  era_name: string;
  subtitle: string;
  hero_boy: string;
  hero_girl: string;
  base_levels: Record<string, BaseLevelGraphic>;
}

export interface BaseGraphicsConfig {
  version: string;
  eras: Record<string, EraGraphicConfig>;
}

export interface EquipmentItem {
  id: string;
  era: number;
  category: 'weapon' | 'armor' | 'accessory';
  name: string;
  asset: string;
  cost: number;
  power_bonus: number;
  defense_bonus: number;
  description: string;
}

export interface DisplayArtifactItem {
  id: string;
  era: number;
  name: string;
  asset: string;
  cost: number;
  power_bonus: number;
  defense_bonus: number;
  description: string;
}

export interface ShopCatalogConfig {
  version: string;
  equipment_items: EquipmentItem[];
  display_artifacts: DisplayArtifactItem[];
}
