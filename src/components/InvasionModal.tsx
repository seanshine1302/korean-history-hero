import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  EncounterUnit,
  EraGraphicConfig,
  EraSaveState,
  Gender,
  InvasionRulesConfig,
  QuizQuestion,
  ShopCatalogConfig,
} from '../types/game';
import { sound } from '../utils/sound';
import { getEnemyDifficultyTier } from '../utils/enemyDifficulty';
import {
  Shield,
  Sword,
  FastForward,
  Trophy,
  Sparkles,
  Coins,
  Home,
  Heart,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  ArrowRight,
  Flame,
} from 'lucide-react';

export interface InvasionOutcome {
  isBoss: boolean;
  victory: boolean;
  earnedGold: number;
  earnedExp: number;
  unlockedEnemyIds: string[];
  rewardItemName?: string;
  solvedTacticalQuestionIds?: string[];
  tacticalCorrectCount?: number;
}

interface InvasionModalProps {
  eraId: number;
  gender: Gender;
  isBoss: boolean;
  eraConfig: EraGraphicConfig;
  eraSave: EraSaveState;
  invasionRules: InvasionRulesConfig;
  shopCatalog: ShopCatalogConfig;
  questions?: QuizQuestion[];
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
  questions = [],
  enemyDifficulty = 0,
  onComplete,
  onClose,
}) => {
  const [phase, setPhase] = useState<'ready' | 'tactics' | 'tactics_result' | 'battle' | 'result'>('ready');
  const [battleStep, setBattleStep] = useState(0);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  // ----------------------------------------------------
  // Tactical Quiz State (5 Questions, Stop on first mistake)
  // ----------------------------------------------------
  const [tacticalQuestions, setTacticalQuestions] = useState<QuizQuestion[]>([]);
  const [tacticalIndex, setTacticalIndex] = useState(0);
  const [tacticalCorrectCount, setTacticalCorrectCount] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [tacticalMistakeOccurred, setTacticalMistakeOccurred] = useState(false);
  const [solvedTacticalIds, setSolvedTacticalIds] = useState<string[]>([]);

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

  const basePlayerPower =
    35 +
    eraSave.char_level * 18 +
    eraSave.base_level * 25 +
    equippedObjects.reduce((s, e) => s + (e?.power_bonus || 0) + (e?.defense_bonus || 0), 0) +
    placedObjects.reduce((s, a) => s + (a?.power_bonus || 0) + (a?.defense_bonus || 0), 0);

  // ----------------------------------------------------
  // Tactical Bonus Calculation based on correct answers (0 ~ 5)
  // 1개: +35% (+20), 2개: +75% (+45), 3개: +120% (+70), 4개: +170% (+100), 5개: +240% (+140)
  // ----------------------------------------------------
  const tacticalBonusInfo = useMemo(() => {
    switch (tacticalCorrectCount) {
      case 1:
        return { percent: 35, flat: 20, label: '초급 전술 정찰 성공' };
      case 2:
        return { percent: 75, flat: 45, label: '중급 전술 대형 완성' };
      case 3:
        return { percent: 120, flat: 70, label: '상급 전술 기습 포위' };
      case 4:
        return { percent: 170, flat: 100, label: '특급 전술 완전 간파' };
      case 5:
        return { percent: 240, flat: 140, label: '신화급 전술 완벽 제압 (올클리어!)' };
      default:
        return { percent: 0, flat: 0, label: '기본 전술' };
    }
  }, [tacticalCorrectCount]);

  const boostedPlayerPower =
    Math.round(basePlayerPower * (1 + tacticalBonusInfo.percent / 100)) + tacticalBonusInfo.flat;

  const baseEnemyPower = targetUnit.power || targetUnit.difficulty || 50;
  const enemyPower = Math.round(baseEnemyPower * enemyTier.powerMultiplier);

  // 0단계(기준)에서는 초등 저학년 친화적 승리 판정(보스 0.72, 일반 0.50) 유지
  // 1~10단계에서는 단계별로 요구 승리 비율이 상승하지만, 전술 퀴즈의 강력한 버프로 승리 가능!
  const winThresholdRatio = isBoss
    ? Math.min(1.05, 0.72 + enemyDifficulty * 0.033)
    : Math.min(1.0, 0.5 + enemyDifficulty * 0.05);

  const isVictory = boostedPlayerPower >= enemyPower * winThresholdRatio;

  const earnedRewardGold = isVictory
    ? Math.round(targetUnit.reward_gold * enemyTier.rewardMultiplier + tacticalCorrectCount * 15)
    : 20 + tacticalCorrectCount * 5;
  const earnedRewardExp = isVictory
    ? Math.round(targetUnit.reward_exp * enemyTier.rewardMultiplier + tacticalCorrectCount * 10)
    : 10 + tacticalCorrectCount * 5;

  // Max HP derived from power so leveling up, equipping items and tactics visibly increases HP
  const playerMaxHp = Math.round(boostedPlayerPower * 2.5);
  const enemyMaxHp = Math.round(enemyPower * 2.5);

  // Initialize Tactical Questions (Pick 5 questions from current era questions)
  const initTacticalQuestions = () => {
    if (!questions || questions.length === 0) {
      return [];
    }
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    const selected: QuizQuestion[] = [];
    const usedMasters = new Set<string>();

    for (const q of shuffled) {
      if (!usedMasters.has(q.master_id)) {
        selected.push(q);
        usedMasters.add(q.master_id);
        if (selected.length >= 5) break;
      }
    }

    if (selected.length < 5) {
      for (const q of shuffled) {
        if (!selected.some((s) => s.question_id === q.question_id)) {
          selected.push(q);
          if (selected.length >= 5) break;
        }
      }
    }

    return selected.slice(0, 5);
  };

  const handleStartTactics = () => {
    sound.playAlert();
    const picked = initTacticalQuestions();
    if (picked.length === 0) {
      // Questions not available: go straight to battle
      setBattleStep(0);
      setBattleLog([]);
      setPhase('battle');
      return;
    }
    setTacticalQuestions(picked);
    setTacticalIndex(0);
    setTacticalCorrectCount(0);
    setSelectedChoice(null);
    setIsAnswerSubmitted(false);
    setTacticalMistakeOccurred(false);
    setSolvedTacticalIds([]);
    setPhase('tactics');
  };

  const handleDirectBattle = () => {
    sound.playAlert();
    setTacticalCorrectCount(0);
    setBattleStep(0);
    setBattleLog([]);
    setPhase('battle');
  };

  // Handle tactical quiz answer selection
  const handleSelectChoice = (choiceIdx: number) => {
    if (isAnswerSubmitted) return;

    const currentQ = tacticalQuestions[tacticalIndex];
    if (!currentQ) return;

    setSelectedChoice(choiceIdx);
    setIsAnswerSubmitted(true);

    const isCorrect = choiceIdx === currentQ.answer_index;

    if (isCorrect) {
      sound.playCorrect();
      const nextCount = tacticalCorrectCount + 1;
      setTacticalCorrectCount(nextCount);
      setSolvedTacticalIds((prev) => [...prev, currentQ.question_id]);

      setTimeout(() => {
        if (tacticalIndex < 4 && tacticalIndex + 1 < tacticalQuestions.length) {
          setTacticalIndex((prev) => prev + 1);
          setSelectedChoice(null);
          setIsAnswerSubmitted(false);
        } else {
          // All 5 solved correctly!
          sound.playFanfare();
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
          setPhase('tactics_result');
        }
      }, 900);
    } else {
      sound.playWrong();
      setTacticalMistakeOccurred(true);
      // Stop right here as requested!
    }
  };

  // Move from tactical mistake or tactical result to battle
  const handleProceedToBattleFromTactics = () => {
    sound.playAlert();
    setBattleStep(0);
    setBattleLog([]);
    setPhase('battle');
  };

  // Calculate current HP based on battleStep (0 ~ 4)
  const getBattleHp = (step: number) => {
    if (step <= 0) {
      return { playerHp: playerMaxHp, enemyHp: enemyMaxHp };
    }
    if (isVictory) {
      const enemyRatios = [1, 0.72, 0.42, 0.15, 0];
      const damageFactor = Math.min(
        0.65,
        Math.max(0.15, (enemyPower / Math.max(1, boostedPlayerPower)) * 0.45)
      );
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
      const playerRatios = [1, 0.68, 0.36, 0.12, 0];
      const enemyDamageFactor = Math.min(
        0.75,
        Math.max(0.3, (boostedPlayerPower / Math.max(1, enemyPower)) * 0.8)
      );
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

  // Battle loop timer
  useEffect(() => {
    if (phase !== 'battle') return;

    const tacticalPrefix =
      tacticalCorrectCount > 0
        ? `🎯 [전술 퀴즈 ${tacticalCorrectCount}개 적중!] 아군 수호력이 ${boostedPlayerPower}(+${tacticalBonusInfo.percent}%)로 폭발적으로 상승!`
        : `1단계: 우리 수호대가 거점 방어 태세를 갖추었어요!`;

    const messages = isMission
      ? [
          tacticalPrefix,
          `2단계: ${targetUnit.name} 감시망의 약점을 지혜롭게 통과하고 있어요!`,
          `3단계: 장착한 장비와 전술 작전이 강력한 힘을 발휘했어요!`,
          isVictory
            ? `작전 대성공! 소중한 독립 임무를 무사히 완수했어요!`
            : `앗, 경계가 삼엄해 잠시 거점으로 돌아와 다시 준비하기로 했어요!`,
        ]
      : [
          tacticalPrefix,
          `2단계: 거점 방어 시설과 전시 유물이 빛나며 수호 결계를 펼쳤어요!`,
          `3단계: 용감한 시간여행 대원이 전술 지휘 무기로 힘차게 맞서 싸웠어요!`,
          isVictory
            ? `수호 성공! ${targetUnit.name}을(를) 멋지게 물리치고 시공간을 지켰어요!`
            : `거점을 끝까지 지켰지만 적의 힘이 강했어요. 전술 퀴즈를 더 맞춰 다시 도전해 봐요!`,
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
    }, 700);

    return () => clearInterval(timer);
  }, [
    phase,
    isMission,
    isVictory,
    eraConfig.era_name,
    targetUnit.name,
    tacticalCorrectCount,
    boostedPlayerPower,
    tacticalBonusInfo.percent,
  ]);

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
      solvedTacticalQuestionIds: solvedTacticalIds,
      tacticalCorrectCount,
    });
  };

  const currentTacticalQuestion = tacticalQuestions[tacticalIndex];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl border-4 border-amber-400 shadow-2xl overflow-hidden p-5 sm:p-7 space-y-4 my-auto">
        {/* ========================================================================= */}
        {/* Phase 1: Ready Screen with Tactical Quiz Introduction */}
        {/* ========================================================================= */}
        {phase === 'ready' && (
          <div className="space-y-4 sm:space-y-5 text-center">
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
                <img src={heroAsset} alt="내 캐릭터" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                <span className="text-xs font-black text-slate-700 mt-1">우리 수호대</span>
                <span className="text-xs font-black text-blue-700">⚔️ 기본 수호력 {basePlayerPower}</span>
                <div className="w-full mt-2 bg-white/90 rounded-xl p-1.5 border border-emerald-300 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] font-black text-emerald-900 mb-1 px-0.5">
                    <span className="inline-flex items-center gap-0.5">
                      <Heart className="w-3 h-3 text-emerald-600 fill-emerald-500" /> 기본 체력
                    </span>
                    <span>{Math.round(basePlayerPower * 2.5)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-emerald-400 to-green-600 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="text-xl sm:text-2xl font-black text-amber-600 px-1">VS</div>

              <div className="flex flex-col items-center">
                <div className="relative">
                  <img
                    src={targetUnit.asset}
                    alt={targetUnit.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow"
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
                </span>
                <div className="w-full mt-2 bg-white/90 rounded-xl p-1.5 border border-rose-300 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] font-black text-rose-900 mb-1 px-0.5">
                    <span className="inline-flex items-center gap-0.5">
                      <Heart className="w-3 h-3 text-rose-600 fill-rose-500" /> 적 체력
                    </span>
                    <span>{enemyMaxHp}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical Quiz Feature Callout */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-3.5 text-left space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                <Flame className="w-5 h-5 text-orange-600 animate-bounce" />
                <span>적과의 결전! [실전 전술 퀴즈]로 능력치 강화!</span>
              </div>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                총 5문제를 차례로 풉니다. <strong>정답을 맞출 때마다 캐릭터 수호력과 체력이 대폭 상승</strong>하며, 도중에 <span className="text-rose-600 font-extrabold">틀리면 즉시 멈추고</span> 지금까지 맞춘 개수만큼만 능력치가 적용됩니다!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm"
              >
                나중에 하기
              </button>
              <button
                type="button"
                onClick={handleDirectBattle}
                className="px-4 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-sm"
              >
                퀴즈 없이 바로 전투
              </button>
              <button
                type="button"
                onClick={handleStartTactics}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-2 animate-pulse"
              >
                <Zap className="w-5 h-5 text-yellow-200" />
                <span>전술 퀴즈 풀고 싸우기!</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Phase 2: Tactical Quiz (5 questions, stop immediately on wrong answer) */}
        {/* ========================================================================= */}
        {phase === 'tactics' && currentTacticalQuestion && (
          <div className="space-y-4">
            {/* Header with 5-Step Progress Indicators */}
            <div className="flex items-center justify-between border-b pb-3 border-amber-200">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-orange-100 text-orange-700">
                  <Flame className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800">
                    실전 전술 퀴즈 ({tacticalIndex + 1} / 5)
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500">
                    틀리면 멈춥니다! 맞춘 만큼 수호력이 올라가요!
                  </p>
                </div>
              </div>

              {/* Step Badges (1~5) */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((idx) => {
                  const isDoneCorrect = idx < tacticalCorrectCount;
                  const isCurrent = idx === tacticalIndex && !tacticalMistakeOccurred;
                  const isWrongHere = idx === tacticalIndex && tacticalMistakeOccurred;

                  return (
                    <div
                      key={idx}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isDoneCorrect
                          ? 'bg-emerald-500 text-white shadow'
                          : isWrongHere
                          ? 'bg-rose-500 text-white animate-bounce shadow'
                          : isCurrent
                          ? 'bg-amber-500 text-white ring-4 ring-amber-200 scale-110'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isDoneCorrect ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isWrongHere ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Tactical Status HUD */}
            <div className="bg-gradient-to-r from-sky-50 via-amber-50 to-orange-50 rounded-2xl p-3 border border-amber-300 flex items-center justify-between text-xs font-black">
              <span className="text-slate-700 flex items-center gap-1">
                🛡️ 현재 능력치 보너스:
                <span className="text-blue-700 font-extrabold text-sm ml-1">
                  +{tacticalBonusInfo.percent}% (+{tacticalBonusInfo.flat})
                </span>
              </span>
              <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                정답 {tacticalCorrectCount} / 5
              </span>
            </div>

            {/* Question Stem */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800">
                전술 작전 문제 #{tacticalIndex + 1}
              </span>
              <p className="text-base sm:text-lg font-black text-slate-800 leading-snug break-keep">
                {currentTacticalQuestion.stem}
              </p>
              {currentTacticalQuestion.visual_cue_asset && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={currentTacticalQuestion.visual_cue_asset}
                    alt="참고자료"
                    className="max-h-32 rounded-xl object-contain border border-slate-200 shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Choices */}
            <div className="grid grid-cols-1 gap-2">
              {currentTacticalQuestion.choices.map((choice, cIdx) => {
                let btnStyle = 'bg-white hover:bg-amber-50 border-slate-200 text-slate-800';

                if (isAnswerSubmitted) {
                  if (cIdx === currentTacticalQuestion.answer_index) {
                    btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-black shadow-md ring-2 ring-emerald-400';
                  } else if (cIdx === selectedChoice) {
                    btnStyle = 'bg-rose-100 border-rose-500 text-rose-900 font-black shadow-md ring-2 ring-rose-400';
                  } else {
                    btnStyle = 'bg-slate-100 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={cIdx}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectChoice(cIdx)}
                    className={`w-full text-left p-3.5 rounded-2xl border-2 font-extrabold text-sm sm:text-base transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-200/80 text-slate-700 flex items-center justify-center text-xs font-black flex-shrink-0">
                        {cIdx + 1}
                      </span>
                      <span>{choice}</span>
                    </span>
                    {isAnswerSubmitted && cIdx === currentTacticalQuestion.answer_index && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    )}
                    {isAnswerSubmitted && cIdx === selectedChoice && cIdx !== currentTacticalQuestion.answer_index && (
                      <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mistake Alert & Stop Action */}
            {tacticalMistakeOccurred && (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-start gap-2 text-rose-800">
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-black text-rose-900">
                      앗, 오답입니다! 전술 퀴즈는 여기서 멈춥니다.
                    </h4>
                    <p className="text-xs font-bold text-rose-700 mt-1 leading-relaxed">
                      {currentTacticalQuestion.explanation || '이전까지 맞춘 문제 수만큼 전술 능력치 보너스가 적용됩니다!'}
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setPhase('tactics_result')}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-black text-base shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>획득한 전술 보너스로 결전 준비!</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* Phase 3: Tactical Briefing / Result Before Battle */}
        {/* ========================================================================= */}
        {phase === 'tactics_result' && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 border-2 border-amber-300 p-3 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-amber-600 animate-bounce" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 mb-1">
                {tacticalCorrectCount === 5 ? '👑 전술 퀴즈 올클리어!' : '⚔️ 전술 작전 브리핑'}
              </span>
              <h2 className="text-2xl font-black text-slate-800">
                {tacticalBonusInfo.label}
              </h2>
              <p className="text-sm font-bold text-slate-600 mt-1">
                총 5문제 중 <span className="text-blue-700 font-extrabold text-base">{tacticalCorrectCount}문제</span>를 맞추어 능력치가 향상되었어요!
              </p>
            </div>

            {/* Stat Boost Comparison Card */}
            <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-emerald-50 rounded-2xl p-4 border-2 border-blue-200 grid grid-cols-2 gap-3">
              <div className="bg-white/90 rounded-xl p-3 border border-blue-200 shadow-sm text-center">
                <span className="text-xs font-black text-slate-500">⚔️ 캐릭터 수호력</span>
                <div className="text-lg sm:text-xl font-black text-blue-700 mt-1">
                  {basePlayerPower} ➔ {boostedPlayerPower}
                </div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                  +{tacticalBonusInfo.percent}% 상승!
                </span>
              </div>

              <div className="bg-white/90 rounded-xl p-3 border border-emerald-200 shadow-sm text-center">
                <span className="text-xs font-black text-slate-500">❤️ 최대 체력(HP)</span>
                <div className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
                  {Math.round(basePlayerPower * 2.5)} ➔ {playerMaxHp}
                </div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  +{playerMaxHp - Math.round(basePlayerPower * 2.5)} HP 증가!
                </span>
              </div>
            </div>

            {/* VS Final comparison */}
            <div className="bg-slate-100 rounded-xl p-3 text-xs font-bold text-slate-700 flex items-center justify-around">
              <div>
                우리 강화 수호력: <strong className="text-blue-700 text-sm">{boostedPlayerPower}</strong>
              </div>
              <div className="text-slate-400 font-black">VS</div>
              <div>
                적군 전투력: <strong className="text-red-700 text-sm">{enemyPower}</strong> (Lv.{enemyDifficulty})
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToBattleFromTactics}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black text-xl shadow-lg flex items-center justify-center gap-2"
            >
              <Sword className="w-6 h-6" />
              <span>강화된 능력치로 결전 개시!</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Phase 4: Battle Animation & Live HP HUD */}
        {/* ========================================================================= */}
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
                    {tacticalCorrectCount > 0 && (
                      <span className="text-[10px] bg-blue-900 text-blue-200 border border-blue-400 px-1 rounded">
                        +{tacticalBonusInfo.percent}%
                      </span>
                    )}
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
                  <img src={baseAsset} alt="거점" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                  <img
                    src={heroAsset}
                    alt="영웅"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain animate-bounce"
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
                  className={`w-20 h-20 sm:w-24 sm:h-24 object-contain transition-all duration-500 ${
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

        {/* ========================================================================= */}
        {/* Phase 5: Result Summary */}
        {/* ========================================================================= */}
        {phase === 'result' && (
          <div className="space-y-4 sm:space-y-5 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-amber-50 border-3 border-amber-300 p-2 flex items-center justify-center">
              <img
                src={targetUnit.asset}
                alt={targetUnit.name}
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-black mb-1.5 ${
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

            {/* Tactical Quiz Contribution Banner */}
            {tacticalCorrectCount > 0 && (
              <div className="bg-sky-50 border border-sky-300 rounded-xl p-2.5 text-xs font-black text-sky-900 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>
                  전술 퀴즈 {tacticalCorrectCount}문제 적중 보너스로 추가 보상 및 수호력 강화가 적용되었어요!
                </span>
              </div>
            )}

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
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3 text-sm font-black text-emerald-900">
                📖 수호단 도감 해금: <span className="underline">{targetUnit.name}</span> 등록 완료!
                {isBoss && targetUnit.reward_item && (
                  <div className="mt-1 text-amber-700">
                    🏆 전설 유물 보상: [{targetUnit.reward_item}] 획득!
                  </div>
                )}
              </div>
            )}

            {!isVictory && (
              <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-3 text-xs font-bold text-sky-900">
                <Heart className="w-4 h-4 inline mr-1 text-pink-500" />
                패널티 없음! 내 레벨과 기록은 모두 안전해요. 전술 퀴즈 5문제를 모두 맞추면 최고 난이도 적도 이길 수 있어요!
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
