import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  EncounterUnit,
  EraGraphicConfig,
  EraSaveState,
  Gender,
  InvasionRulesConfig,
  ShopCatalogConfig,
} from '../types/game';
import { sound } from '../utils/sound';
import { getEnemyDifficultyTier } from '../utils/enemyDifficulty';
import { Shield, Sword, FastForward, Trophy, Sparkles, Coins, Home, Heart } from 'lucide-react';

export interface InvasionOutcome {
  isBoss: boolean;
  victory: boolean;
  earnedGold: number;
  earnedExp: number;
  unlockedEnemyIds: string[];
  rewardItemName?: string;
}

interface InvasionModalProps {
  eraId: number;
  gender: Gender;
  isBoss: boolean;
  eraConfig: EraGraphicConfig;
  eraSave: EraSaveState;
  invasionRules: InvasionRulesConfig;
  shopCatalog: ShopCatalogConfig;
  enemyDifficulty?: number;
  onComplete: (outcome: InvasionOutcome) => void;
  onClose: () => void;
}

export const InvasionModal: React.FC<InvasionModalProps> = ({
  eraId,
  gender,
  isBoss,
  eraConfig,
  eraSave,
  invasionRules,
  shopCatalog,
  enemyDifficulty = 0,
  onComplete,
  onClose,
}) => {
  const [phase, setPhase] = useState<'ready' | 'battle' | 'result'>('ready');
  const [battleStep, setBattleStep] = useState(0);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  const encounterCfg = invasionRules.era_encounters[String(eraId)];
  const isMission = encounterCfg?.event_type === 'mission';
  const targetUnit: EncounterUnit = isBoss ? encounterCfg.boss : encounterCfg.normal_enemy;

  const enemyTier = getEnemyDifficultyTier(enemyDifficulty);

  const equippedObjects = (eraSave.equipped_items || [])
    .map((id) => shopCatalog.equipment_items.find((e) => e.id === id))
    .filter(Boolean);

  const placedObjects = Object.values(eraSave.placed_artifacts || {})
    .map((id) => shopCatalog.display_artifacts.find((a) => a.id === id))
    .filter(Boolean);

  const playerPower =
    35 +
    eraSave.char_level * 18 +
    eraSave.base_level * 25 +
    equippedObjects.reduce((s, e) => s + (e?.power_bonus || 0) + (e?.defense_bonus || 0), 0) +
    placedObjects.reduce((s, a) => s + (a?.power_bonus || 0) + (a?.defense_bonus || 0), 0);

  const baseEnemyPower = targetUnit.power || targetUnit.difficulty || 50;
  const enemyPower = Math.round(baseEnemyPower * enemyTier.powerMultiplier);
  // Friendly child-oriented win formula: normal invasions almost always succeed or encourage growth; bosses check if playerPower is close
  const isVictory = isBoss ? playerPower >= enemyPower * 0.72 : playerPower >= enemyPower * 0.5;

  const earnedRewardGold = isVictory
    ? Math.round(targetUnit.reward_gold * enemyTier.rewardMultiplier)
    : 20;
  const earnedRewardExp = isVictory
    ? Math.round(targetUnit.reward_exp * enemyTier.rewardMultiplier)
    : 10;

  // Max HP derived from power so leveling up and equipping items visibly increases HP
  const playerMaxHp = Math.round(playerPower * 2.5);
  const enemyMaxHp = Math.round(enemyPower * 2.5);

  // Calculate current HP based on battleStep (0 ~ 4)
  const getBattleHp = (step: number) => {
    if (step <= 0) {
      return { playerHp: playerMaxHp, enemyHp: enemyMaxHp };
    }
    if (isVictory) {
      // Player wins: Enemy HP drops to 0 over 4 steps; Player takes moderate damage based on enemyPower
      const enemyRatios = [1, 0.72, 0.42, 0.15, 0];
      const damageFactor = Math.min(0.65, Math.max(0.2, (enemyPower / Math.max(1, playerPower)) * 0.45));
      const playerRatios = [
        1,
        1 - damageFactor * 0.3,
        1 - damageFactor * 0.65,
        1 - damageFactor * 0.9,
        1 - damageFactor,
      ];
      const idx = Math.min(4, step);
      return {
        playerHp: Math.max(1, Math.round(playerMaxHp * playerRatios[idx])),
        enemyHp: Math.max(0, Math.round(enemyMaxHp * enemyRatios[idx])),
      };
    } else {
      // Enemy wins: Player HP drops to 0 over 4 steps; Enemy takes damage proportional to playerPower
      const playerRatios = [1, 0.68, 0.36, 0.12, 0];
      const enemyDamageFactor = Math.min(0.75, Math.max(0.3, (playerPower / Math.max(1, enemyPower)) * 0.8));
      const enemyRatios = [
        1,
        1 - enemyDamageFactor * 0.3,
        1 - enemyDamageFactor * 0.6,
        1 - enemyDamageFactor * 0.85,
        1 - enemyDamageFactor,
      ];
      const idx = Math.min(4, step);
      return {
        playerHp: Math.max(0, Math.round(playerMaxHp * playerRatios[idx])),
        enemyHp: Math.max(1, Math.round(enemyMaxHp * enemyRatios[idx])),
      };
    }
  };

  const { playerHp, enemyHp } = getBattleHp(battleStep);
  const playerHpPercent = Math.max(0, Math.min(100, Math.round((playerHp / playerMaxHp) * 100)));
  const enemyHpPercent = Math.max(0, Math.min(100, Math.round((enemyHp / enemyMaxHp) * 100)));

  const getHpBarColor = (percent: number, isEnemy = false) => {
    if (percent > 50) return isEnemy ? 'from-rose-500 to-red-600' : 'from-emerald-400 to-green-600';
    if (percent > 25) return 'from-amber-400 to-orange-500';
    return 'from-red-500 to-rose-700';
  };

  const baseLv = eraSave.base_level || 1;
  const baseAsset =
    eraConfig.base_levels[`level_${baseLv}`]?.asset_path ||
    eraConfig.base_levels['level_1'].asset_path;
  const heroAsset = gender === 'boy' ? eraConfig.hero_boy : eraConfig.hero_girl;

  useEffect(() => {
    if (phase !== 'battle') return;

    const messages = isMission
      ? [
          `1단계: ${eraConfig.era_name} 독립 거점에서 비밀 암호와 지도를 확인했어요!`,
          `2단계: ${targetUnit.name} 경로의 감시망을 지혜롭게 통과하고 있어요!`,
          `3단계: 장착한 장비와 거점 연락 시설이 큰 힘을 발휘했어요!`,
          isVictory
            ? `작전 성공! 소중한 독립 임무를 무사히 완수했어요!`
            : `앗, 경계가 삼엄해 잠시 거점으로 돌아와 다시 준비하기로 했어요!`,
        ]
      : [
          `1단계: ${targetUnit.name} 무리가 거점 앞으로 다가왔어요!`,
          `2단계: 거점 방어 시설과 전시 유물이 빛나며 수호 결계를 펼쳤어요!`,
          `3단계: 용감한 시간여행 대원이 장착 무기로 힘차게 맞서 싸웠어요!`,
          isVictory
            ? `수호 성공! ${targetUnit.name}을(를) 멋지게 물리치고 시공간을 지켰어요!`
            : `거점을 끝까지 지켰지만 적의 힘이 조금 강했어요. 장비를 더 갖추어 다시 도전해 봐요!`,
        ];

    const timer = setInterval(() => {
      setBattleStep((prev) => {
        const next = prev + 1;
        if (next <= messages.length) {
          sound.playCombatHit();
          setBattleLog((old) => [...old, messages[next - 1]]);
        }
        if (next >= messages.length) {
          clearInterval(timer);
          setTimeout(() => {
            if (isVictory) {
              sound.playFanfare();
              confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            } else {
              sound.playWrong();
            }
            setPhase('result');
          }, 600);
        }
        return next;
      });
    }, 650);

    return () => clearInterval(timer);
  }, [phase, isMission, isVictory, eraConfig.era_name, targetUnit.name]);

  const handleSkipToResult = () => {
    sound.playFanfare();
    setBattleStep(4);
    if (isVictory) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
    setPhase('result');
  };

  const handleConfirmFinish = () => {
    sound.playClick();
    const unlockedIds: string[] = [];
    if (isVictory) {
      unlockedIds.push(targetUnit.id);
      if (targetUnit.sub_enemies) {
        targetUnit.sub_enemies.forEach((sub) => unlockedIds.push(sub.id));
      }
    }

    onComplete({
      isBoss,
      victory: isVictory,
      earnedGold: earnedRewardGold,
      earnedExp: earnedRewardExp,
      unlockedEnemyIds: unlockedIds,
      rewardItemName: isBoss && isVictory ? targetUnit.reward_item : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl border-4 border-amber-400 shadow-2xl overflow-hidden p-5 sm:p-7 space-y-5">
        {/* Phase 1: Player Confirmation Before Starting (Section 5.3: No forced auto-start) */}
        {phase === 'ready' && (
          <div className="space-y-5 text-center">
            <div className="inline-block px-4 py-1 rounded-full bg-red-100 text-red-800 font-black text-xs sm:text-sm">
              {isBoss
                ? isMission
                  ? '🌟 최종 특별 역사 미션!'
                  : '👑 시대 최종 보스전!'
                : isMission
                ? '📜 시대 역사 미션 이벤트'
                : '🚨 시공간 균열! 거점 방어전'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
              {targetUnit.name}
            </h2>
            <p className="text-sm sm:text-base font-bold text-slate-600 break-keep">
              {targetUnit.description}
            </p>

            {/* Visual Versus Preview with Initial HP Gauges */}
            <div className="bg-gradient-to-r from-sky-100 via-amber-50 to-red-100 rounded-2xl p-4 border-2 border-amber-300 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex flex-col items-center">
                <img src={heroAsset} alt="내 캐릭터" className="w-20 h-20 object-contain" />
                <span className="text-xs font-black text-slate-700 mt-1">우리 수호대</span>
                <span className="text-xs font-black text-blue-700">⚔️ 수호력 {playerPower}</span>
                <div className="w-full mt-2 bg-white/90 rounded-xl p-1.5 border border-emerald-300 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] font-black text-emerald-900 mb-1 px-0.5">
                    <span className="inline-flex items-center gap-0.5">
                      <Heart className="w-3 h-3 text-emerald-600 fill-emerald-500" /> 체력
                    </span>
                    <span>
                      {playerMaxHp} / {playerMaxHp}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-emerald-400 to-green-600 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="text-2xl font-black text-amber-600 px-1">VS</div>

              <div className="flex flex-col items-center">
                <div className="relative">
                  <img
                    src={targetUnit.asset}
                    alt={targetUnit.name}
                    className="w-20 h-20 object-contain drop-shadow"
                  />
                  {enemyDifficulty > 0 && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow">
                      +{Math.round((enemyTier.powerMultiplier - 1) * 100)}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-black text-slate-700">{targetUnit.name}</span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${enemyTier.badgeBg} ${enemyTier.badgeBorder} ${enemyTier.badgeText}`}
                  >
                    Lv.{enemyDifficulty}
                  </span>
                </div>
                <span className="text-xs font-black text-red-700">
                  {isMission ? `🔥 난이도 ${enemyPower}` : `🔥 전투력 ${enemyPower}`}
                  {enemyDifficulty > 0 && (
                    <span className="text-[10px] text-slate-400 font-bold ml-1">
                      (기본 {baseEnemyPower})
                    </span>
                  )}
                </span>
                <div className="w-full mt-2 bg-white/90 rounded-xl p-1.5 border border-rose-300 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] font-black text-rose-900 mb-1 px-0.5">
                    <span className="inline-flex items-center gap-0.5">
                      <Heart className="w-3 h-3 text-rose-600 fill-rose-500" /> 체력
                    </span>
                    <span>
                      {enemyMaxHp} / {enemyMaxHp}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-bold text-amber-900">
              💡 안심하세요! 혹시 패배하더라도 거점 레벨, 캐릭터 레벨, 역사도감은 절대 줄어들지 않아요!
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-base"
              >
                나중에 하기
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playAlert();
                  setBattleStep(0);
                  setBattleLog([]);
                  setPhase('battle');
                }}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black text-xl shadow-lg"
              >
                {isMission ? '역사 작전 출발!' : '거점 수호 시작!'}
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Base Zoom Animation & Auto-Battle with Live HP Gauges & Skip Support (Section 5.3) */}
        {phase === 'battle' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-orange-700 bg-orange-100 px-3 py-1 rounded-full animate-pulse">
                {isMission ? '🏃 역사 작전 진행 중...' : '⚔️ 자동 수호 전투 진행 중...'}
              </span>
              <button
                type="button"
                onClick={handleSkipToResult}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs"
              >
                <FastForward className="w-4 h-4" />
                <span>건너뛰기</span>
              </button>
            </div>

            {/* Live Battle HP Gauge HUD */}
            <div className="grid grid-cols-2 gap-3 bg-slate-900 text-white p-3.5 rounded-2xl border-2 border-amber-400 shadow-md">
              {/* Player HP Gauge */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-emerald-300 truncate flex items-center gap-1">
                    🛡️ 우리 수호대
                  </span>
                  <span className="text-white tabular-nums">
                    {playerHp} / {playerMaxHp} ({playerHpPercent}%)
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-600">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getHpBarColor(
                      playerHpPercent,
                      false
                    )} transition-all duration-500`}
                    style={{ width: `${playerHpPercent}%` }}
                  />
                </div>
              </div>

              {/* Enemy HP Gauge */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-rose-300 truncate flex items-center gap-1">
                    👾 {targetUnit.name}
                    <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-600 px-1 py-0.2 rounded font-extrabold">
                      Lv.{enemyDifficulty}
                    </span>
                  </span>
                  <span className="text-white tabular-nums">
                    {enemyHp} / {enemyMaxHp} ({enemyHpPercent}%)
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-600">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getHpBarColor(
                      enemyHpPercent,
                      true
                    )} transition-all duration-500`}
                    style={{ width: `${enemyHpPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Animated Stage */}
            <div className="relative h-48 bg-gradient-to-b from-sky-200 to-amber-100 rounded-2xl border-2 border-amber-300 flex items-center justify-around p-4 overflow-hidden">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 transition-transform duration-500 scale-105">
                  <img src={baseAsset} alt="거점" className="w-20 h-20 object-contain" />
                  <img
                    src={heroAsset}
                    alt="영웅"
                    className="w-20 h-20 object-contain animate-bounce"
                  />
                </div>
                <span className="text-[11px] font-black bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow">
                  HP {playerHp}
                </span>
              </div>

              <div className="text-3xl animate-ping">💥</div>

              <div className="flex flex-col items-center gap-1">
                <img
                  src={targetUnit.asset}
                  alt={targetUnit.name}
                  className={`w-24 h-24 object-contain transition-all duration-500 ${
                    enemyHp === 0 ? 'opacity-30 grayscale scale-90' : 'animate-pulse'
                  }`}
                />
                <span className="text-[11px] font-black bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow">
                  HP {enemyHp}
                </span>
              </div>
            </div>

            {/* Step-by-step Battle Logs */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 min-h-[120px] space-y-2">
              {battleLog.map((line, i) => (
                <p
                  key={i}
                  className="text-sm font-extrabold text-slate-700 animate-in fade-in slide-in-from-bottom-1"
                >
                  ✨ {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Phase 3: Result Summary & Return Home (Section 5.3) */}
        {phase === 'result' && (
          <div className="space-y-5 text-center">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-amber-50 border-3 border-amber-300 p-2 flex items-center justify-center">
              <img
                src={targetUnit.asset}
                alt={targetUnit.name}
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-black mb-2 ${
                  isVictory
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isVictory
                  ? isMission
                    ? '🎉 역사 미션 대성공!'
                    : '🛡️ 거점 방어 대성공!'
                  : '💪 아쉽지만 거점을 무사히 지켰어요!'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
                {isVictory
                  ? `${targetUnit.name} 클리어!`
                  : '조금만 더 힘을 키워 다시 도전해요!'}
              </h2>
            </div>

            {/* Rewards Box */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 flex items-center justify-center gap-2">
                <Coins className="w-7 h-7 text-amber-500" />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-500">
                    보상 골드
                    {isVictory && enemyDifficulty > 0 && (
                      <span className="ml-1 text-[10px] text-amber-700 font-black">
                        (+{Math.round((enemyTier.rewardMultiplier - 1) * 100)}%)
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-black text-amber-800">
                    +{earnedRewardGold} G
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-3.5 flex items-center justify-center gap-2">
                <Sparkles className="w-7 h-7 text-purple-500" />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-500">
                    보상 경험치
                    {isVictory && enemyDifficulty > 0 && (
                      <span className="ml-1 text-[10px] text-purple-700 font-black">
                        (+{Math.round((enemyTier.rewardMultiplier - 1) * 100)}%)
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-black text-purple-800">
                    +{earnedRewardExp} EXP
                  </div>
                </div>
              </div>
            </div>

            {isVictory && (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 text-sm font-black text-emerald-900">
                📖 수호단 도감 해금: <span className="underline">{targetUnit.name}</span> 등록 완료!
                {isBoss && targetUnit.reward_item && (
                  <div className="mt-1 text-amber-700">
                    🏆 전설 유물 보상: [{targetUnit.reward_item}] 획득!
                  </div>
                )}
              </div>
            )}

            {!isVictory && (
              <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-3.5 text-xs font-bold text-sky-900">
                <Heart className="w-4 h-4 inline mr-1 text-pink-500" />
                패널티 없음! 내 레벨과 학습 기록은 모두 안전하게 보존되었어요. [꾸미기 상점]에서 장비를 장착하면 수호력이 올라가요!
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmFinish}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Home className="w-6 h-6" />
              <span>보상 받고 거점으로 복귀</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
