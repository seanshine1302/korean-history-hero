import React, { useState } from 'react';
import {
  DisplayArtifactItem,
  EconomyRulesConfig,
  EquipmentItem,
  EraGraphicConfig,
  EraSaveState,
  Gender,
  InvasionRulesConfig,
  ShopCatalogConfig,
  UserDifficulty,
} from '../types/game';
import { sound } from '../utils/sound';
import {
  ArrowLeft,
  Coins,
  Play,
  Palette,
  BookOpen,
  FileEdit,
  AlertTriangle,
  Crown,
  Shield,
  Sword,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface EraHomeScreenProps {
  eraId: number;
  gender: Gender;
  eraConfig: EraGraphicConfig;
  eraSave: EraSaveState;
  economyRules: EconomyRulesConfig;
  invasionRules: InvasionRulesConfig;
  shopCatalog: ShopCatalogConfig;
  onBackToEraSelect: () => void;
  onStartQuiz: (difficulty: UserDifficulty) => void;
  onOpenShop: (initialTab?: 'base' | 'equipment' | 'artifact', initialSlotId?: string) => void;
  onOpenCodex: () => void;
  onStartReview: () => void;
  onStartInvasion: (isBoss: boolean) => void;
}

export const EraHomeScreen: React.FC<EraHomeScreenProps> = ({
  eraId,
  gender,
  eraConfig,
  eraSave,
  economyRules,
  invasionRules,
  shopCatalog,
  onBackToEraSelect,
  onStartQuiz,
  onOpenShop,
  onOpenCodex,
  onStartReview,
  onStartInvasion,
}) => {
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [muted, setMuted] = useState(sound.muted);

  const baseLv = eraSave.base_level || 1;
  const currentBaseGraphic =
    eraConfig.base_levels[`level_${baseLv}`] || eraConfig.base_levels['level_1'];

  const heroSrc = gender === 'boy' ? eraConfig.hero_boy : eraConfig.hero_girl;

  // Calculate equipped bonuses
  const equippedObjects: EquipmentItem[] = (eraSave.equipped_items || [])
    .map((id) => shopCatalog.equipment_items.find((item) => item.id === id))
    .filter((i): i is EquipmentItem => Boolean(i));

  const placedArtifactObjects: Record<string, DisplayArtifactItem> = {};
  Object.entries(eraSave.placed_artifacts || {}).forEach(([slotId, artId]) => {
    const found = shopCatalog.display_artifacts.find((a) => a.id === artId);
    if (found) placedArtifactObjects[slotId] = found;
  });

  const totalPower =
    30 +
    eraSave.char_level * 15 +
    eraSave.base_level * 20 +
    equippedObjects.reduce((s, i) => s + i.power_bonus + i.defense_bonus, 0) +
    Object.values(placedArtifactObjects).reduce((s, a) => s + a.power_bonus + a.defense_bonus, 0);

  // Character Exp progress
  const expTable = economyRules.character_level_up_exp;
  const currentLvExp = expTable[Math.min(eraSave.char_level - 1, expTable.length - 1)] || 0;
  const nextLvExp = expTable[Math.min(eraSave.char_level, expTable.length - 1)] || currentLvExp + 500;
  const expProgress =
    eraSave.char_level >= expTable.length
      ? 100
      : Math.min(
          100,
          Math.max(0, Math.round(((eraSave.char_exp - currentLvExp) / (nextLvExp - currentLvExp)) * 100))
        );

  const maxGauge = invasionRules.gauge_rules.max_gauge || 100;
  const isInvasionReady = eraSave.invasion_gauge >= maxGauge;
  const encounterInfo = invasionRules.era_encounters[String(eraId)];
  const isMissionEra = encounterInfo?.event_type === 'mission';

  const toggleMute = () => {
    sound.muted = !sound.muted;
    setMuted(sound.muted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-amber-50 to-emerald-100 flex flex-col justify-between p-3 sm:p-5 select-none">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between gap-3">
        {/* Top Bar: Back Button, Era Name, Gold, Sound Toggle (Section 5.1) */}
        <header className="flex items-center justify-between bg-white/95 backdrop-blur px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-md border-3 border-amber-300">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onBackToEraSelect();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm sm:text-base transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>시대 선택</span>
          </button>

          <div className="text-center">
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              제{eraId}시대 거점 (Lv.{baseLv})
            </span>
            <h1 className="text-lg sm:text-2xl font-black text-slate-800">
              {eraConfig.era_name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-100 border-2 border-amber-400 px-3 py-1.5 rounded-2xl shadow-inner">
              <Coins className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-base sm:text-lg font-black text-amber-900">
                {eraSave.gold.toLocaleString()} G
              </span>
            </div>
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              title={muted ? '소리 켜기' : '소리 끄기'}
            >
              {muted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Invasion Alert Banner (when gauge == 100) OR Boss Challenge Banner (when Base Lv.5) */}
        {isInvasionReady && encounterInfo && (
          <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl border-3 border-yellow-300 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-yellow-300" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-yellow-200">
                  {isMissionEra ? '긴급 역사 작전 발생!' : '시공간 균열! 거점 침입 경보!'}
                </div>
                <div className="text-base sm:text-lg font-black">
                  {isMissionEra
                    ? `'${encounterInfo.normal_enemy.name}'을(를) 시작할 준비가 되었나요?`
                    : `'${encounterInfo.normal_enemy.name}'이(가) 우리 거점 가까이에 나타났어요!`}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playAlert();
                onStartInvasion(false);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-yellow-300 hover:bg-yellow-200 text-red-950 font-black text-base shadow-lg shrink-0 active:scale-95"
            >
              {isMissionEra ? '작전 출발하기!' : '거점 방어하기!'}
            </button>
          </div>
        )}

        {!isInvasionReady && baseLv >= 5 && encounterInfo && (
          <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white p-3.5 rounded-2xl shadow-lg border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-amber-300 shrink-0" />
              <div>
                <div className="text-xs font-black text-amber-200">
                  거점 최고 레벨(Lv.5) 달성 특별 콘텐츠!
                </div>
                <div className="text-base font-black">
                  최종 보스: {encounterInfo.boss.name}{' '}
                  {eraSave.boss_cleared ? '(격파 완료! 다시 도전 가능)' : '(도전 가능!)'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playAlert();
                onStartInvasion(true);
              }}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-sm sm:text-base shadow-md shrink-0 active:scale-95"
            >
              {isMissionEra ? '최종 특별 작전 도전!' : '보스전 도전하기!'}
            </button>
          </div>
        )}

        {/* Center Stage: Base Graphics, Display Slots, Character & Status Overlay (Section 5.1 & Ref 5) */}
        <div className="relative flex-1 min-h-[320px] sm:min-h-[390px] bg-gradient-to-b from-sky-300/60 via-emerald-100/70 to-amber-100/90 rounded-3xl border-4 border-amber-300 shadow-inner overflow-hidden flex flex-col justify-between p-3 sm:p-4">
          {/* Top Overlay Stats: Character Lv/EXP, Defense Power, Invasion Gauge */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            {/* Character Level & EXP */}
            <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-2xl border-2 border-amber-200 shadow-sm flex items-center gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black bg-purple-600 text-white px-2 py-0.5 rounded-full">
                    캐릭터 Lv.{eraSave.char_level}
                  </span>
                  <span className="text-xs font-extrabold text-slate-700 flex items-center gap-0.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" /> 수호력 {totalPower}
                  </span>
                </div>
                <div className="w-32 sm:w-40 h-2 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${expProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Invasion / Time Rift Gauge */}
            <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-2xl border-2 border-red-200 shadow-sm">
              <div className="flex items-center justify-between gap-2 text-xs font-black text-slate-700">
                <span>시공간 균열(침입 게이지)</span>
                <span className={eraSave.invasion_gauge >= 75 ? 'text-red-600' : 'text-slate-600'}>
                  {eraSave.invasion_gauge} / {maxGauge}
                </span>
              </div>
              <div className="w-36 sm:w-44 h-2.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    eraSave.invasion_gauge >= 75
                      ? 'bg-red-500 animate-pulse'
                      : eraSave.invasion_gauge >= 50
                      ? 'bg-orange-500'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, eraSave.invasion_gauge)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Base Canvas Area */}
          <div className="relative flex-1 flex items-center justify-center my-2">
            {/* Base Building Image */}
            <img
              src={currentBaseGraphic.asset_path}
              alt={currentBaseGraphic.name}
              className="w-64 h-64 sm:w-80 sm:h-80 object-contain drop-shadow-2xl transition-all duration-500"
            />

            {/* Display Artifact Slots (Ref 5 coordinates) */}
            {currentBaseGraphic.display_slots.map((slot, idx) => {
              const placedArt = placedArtifactObjects[slot.slot_id];
              return (
                <div
                  key={slot.slot_id}
                  onClick={() => {
                    sound.playClick();
                    onOpenShop('artifact', slot.slot_id);
                  }}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    transform: `translate(-50%, -50%) scale(${slot.scale || 1})`,
                  }}
                  className="absolute z-10 cursor-pointer group"
                  title={
                    placedArt
                      ? `${placedArt.name} (클릭하여 변경)`
                      : `전시 슬롯 ${idx + 1} (꾸미기에서 유물을 배치해 보세요!)`
                  }
                >
                  {placedArt ? (
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/85 border-2 border-amber-400 p-1.5 shadow-lg group-hover:scale-110 transition-transform">
                      <img
                        src={placedArt.asset}
                        alt={placedArt.name}
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {placedArt.name.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-dashed border-amber-500/80 bg-white/50 hover:bg-amber-100/70 flex flex-col items-center justify-center text-amber-900 shadow-sm transition-all">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span className="text-[10px] font-black">슬롯 {idx + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Hero Character + Equipped Badges */}
            <div
              style={{
                left: `${currentBaseGraphic.character_position.x}%`,
                top: `${currentBaseGraphic.character_position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-20 flex flex-col items-center"
            >
              <div className="relative">
                <img
                  src={heroSrc}
                  alt="주인공 캐릭터"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xl"
                />
                {/* Equipped Items Floating Mini Icons */}
                <div className="absolute -right-4 top-0 flex flex-col gap-1">
                  {equippedObjects.map((eq) => (
                    <div
                      key={eq.id}
                      className="w-8 h-8 rounded-full bg-white border-2 border-amber-400 shadow p-1"
                      title={`장착 중: ${eq.name}`}
                    >
                      <img src={eq.asset} alt={eq.name} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
              <span className="mt-1 px-3 py-0.5 rounded-full bg-slate-900/80 text-white text-xs font-black shadow">
                {currentBaseGraphic.name}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar (Section 5.1): Main [▶ 문제 풀기] + [🎨 꾸미기], [📖 역사도감], [📝 오답 복습] */}
        <div className="space-y-2.5">
          {/* Primary CTA: ▶ 문제 풀기 */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowDifficultyModal(true);
            }}
            className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xl sm:text-2xl shadow-xl border-b-4 border-orange-700 flex items-center justify-center gap-3 transition-transform active:scale-98"
          >
            <Play className="w-7 h-7 fill-white" />
            <span>문제 풀기 (10문제 탐험)</span>
          </button>

          {/* 3 Secondary Action Buttons */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenShop();
              }}
              className="py-3.5 px-2 rounded-2xl bg-white hover:bg-amber-50 border-3 border-amber-300 shadow-md flex flex-col sm:flex-row items-center justify-center gap-1.5 text-slate-800 font-black text-sm sm:text-base active:scale-95 transition-all"
            >
              <Palette className="w-5 h-5 text-pink-500" />
              <span>꾸미기 상점</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenCodex();
              }}
              className="py-3.5 px-2 rounded-2xl bg-white hover:bg-amber-50 border-3 border-amber-300 shadow-md flex flex-col sm:flex-row items-center justify-center gap-1.5 text-slate-800 font-black text-sm sm:text-base active:scale-95 transition-all"
            >
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <span>역사도감 ({eraSave.unlocked_codex_ids?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onStartReview();
              }}
              className="relative py-3.5 px-2 rounded-2xl bg-white hover:bg-amber-50 border-3 border-amber-300 shadow-md flex flex-col sm:flex-row items-center justify-center gap-1.5 text-slate-800 font-black text-sm sm:text-base active:scale-95 transition-all"
            >
              <FileEdit className="w-5 h-5 text-sky-600" />
              <span>오답 복습</span>
              {eraSave.wrong_master_ids?.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-black rounded-full bg-red-500 text-white">
                  {eraSave.wrong_master_ids.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Difficulty Selection Modal (Section 2.1 & 2.2: 쉬움 / 보통 / 어려움) */}
      {showDifficultyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border-4 border-amber-400 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center">
              <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                {eraConfig.era_name} 퀴즈 탐험
              </span>
              <h2 className="text-2xl font-black text-slate-800 mt-2">
                어떤 난이도로 풀어볼까요?
              </h2>
              <p className="text-sm font-bold text-slate-500 mt-1">
                10문제를 끝까지 풀면 골드와 경험치, 역사도감을 얻어요!
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  sound.playFanfare();
                  setShowDifficultyModal(false);
                  onStartQuiz('easy');
                }}
                className="w-full p-4 rounded-2xl border-3 border-emerald-400 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-between transition-all active:scale-98"
              >
                <div className="text-left">
                  <div className="text-lg font-black text-emerald-900">🌱 쉬움 (초등 2학년 추천)</div>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">
                    그림과 쉬운 단서로 재미있게 역사를 배워요!
                  </div>
                </div>
                <span className="text-xs font-black bg-emerald-200 text-emerald-900 px-2.5 py-1 rounded-xl shrink-0">
                  정답당 +10G
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playFanfare();
                  setShowDifficultyModal(false);
                  onStartQuiz('normal');
                }}
                className="w-full p-4 rounded-2xl border-3 border-sky-400 bg-sky-50 hover:bg-sky-100 flex items-center justify-between transition-all active:scale-98"
              >
                <div className="text-left">
                  <div className="text-lg font-black text-sky-900">⭐ 보통 (역사 탐험 대원)</div>
                  <div className="text-xs font-bold text-sky-700 mt-0.5">
                    유물의 쓰임새와 인물의 업적을 연결해 봐요!
                  </div>
                </div>
                <span className="text-xs font-black bg-sky-200 text-sky-900 px-2.5 py-1 rounded-xl shrink-0">
                  정답당 +15G
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playFanfare();
                  setShowDifficultyModal(false);
                  onStartQuiz('hard');
                }}
                className="w-full p-4 rounded-2xl border-3 border-purple-400 bg-purple-50 hover:bg-purple-100 flex items-center justify-between transition-all active:scale-98"
              >
                <div className="text-left">
                  <div className="text-lg font-black text-purple-900">👑 어려움 (역사 박사 도전)</div>
                  <div className="text-xs font-bold text-purple-700 mt-0.5">
                    사건의 원인과 결과, 깊은 역사 이야기를 풀어봐요!
                  </div>
                </div>
                <span className="text-xs font-black bg-purple-200 text-purple-900 px-2.5 py-1 rounded-xl shrink-0">
                  정답당 +20G
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowDifficultyModal(false);
              }}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-base"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
