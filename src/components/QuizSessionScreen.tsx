import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  DifficultyProfileConfig,
  EconomyRulesConfig,
  InvasionRulesConfig,
  KnowledgeItem,
  QuizQuestion,
  UserDifficulty,
} from '../types/game';
import { sound } from '../utils/sound';
import { selectSessionQuestions } from '../utils/quizEngine';
import { SettingsModal } from './SettingsModal';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Volume2,
  Sparkles,
  Coins,
  BookOpen,
  AlertTriangle,
  ShieldCheck,
  Award,
  Home,
  Settings,
} from 'lucide-react';

export interface QuizSessionResult {
  mode: 'normal' | 'review';
  difficulty: UserDifficulty;
  solvedQuestionIds: string[];
  correctMasterIds: string[];
  wrongMasterIds: string[];
  earnedGold: number;
  earnedExp: number;
  gaugeDelta: number;
  totalQuestions: number;
  correctCount: number;
}

interface QuizSessionScreenProps {
  eraName: string;
  mode: 'normal' | 'review';
  difficulty: UserDifficulty;
  questions: QuizQuestion[];
  allEraQuestions?: QuizQuestion[];
  difficultyConfig?: DifficultyProfileConfig | null;
  knowledgeMap: Record<string, KnowledgeItem>;
  economyRules: EconomyRulesConfig;
  invasionRules: InvasionRulesConfig;
  currentGauge: number;
  enemyDifficulty?: number;
  onFinishSession: (result: QuizSessionResult, triggerInvasionNow: boolean) => void;
  onCancel: () => void;
  onChangeDifficulty?: (difficulty: UserDifficulty) => void;
  onChangeEnemyDifficulty?: (difficulty: number) => void;
}

export const QuizSessionScreen: React.FC<QuizSessionScreenProps> = ({
  eraName,
  mode,
  difficulty: initialDifficulty,
  questions: initialQuestions,
  allEraQuestions = [],
  difficultyConfig = null,
  knowledgeMap,
  economyRules,
  invasionRules,
  currentGauge,
  enemyDifficulty = 0,
  onFinishSession,
  onCancel,
  onChangeDifficulty,
  onChangeEnemyDifficulty,
}) => {
  const [currentDifficulty, setCurrentDifficulty] = useState<UserDifficulty>(initialDifficulty);
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [difficultyToast, setDifficultyToast] = useState<string | null>(null);
  const [muted, setMuted] = useState(sound.muted);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [solvedQuestionIds, setSolvedQuestionIds] = useState<string[]>([]);
  const [correctMasterIds, setCorrectMasterIds] = useState<string[]>([]);
  const [wrongMasterIds, setWrongMasterIds] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = sessionQuestions[currentIndex];

  const handleChangeDifficulty = (newDiff: UserDifficulty) => {
    if (newDiff === currentDifficulty) return;
    setCurrentDifficulty(newDiff);
    onChangeDifficulty?.(newDiff);

    // If in normal quiz mode and questions remain after the current one, update upcoming questions
    if (mode === 'normal' && difficultyConfig && allEraQuestions.length > 0) {
      const remainingCount = sessionQuestions.length - (currentIndex + 1);
      if (remainingCount > 0) {
        // Keep completed and current question
        const kept = sessionQuestions.slice(0, currentIndex + 1);
        const usedIds = kept.map((q) => q.question_id);

        const freshQuestions = selectSessionQuestions(
          allEraQuestions.filter((q) => !usedIds.includes(q.question_id)),
          newDiff,
          difficultyConfig,
          Array.from(new Set([...solvedQuestionIds, ...usedIds])),
          remainingCount
        );

        setSessionQuestions([...kept, ...freshQuestions]);
      }
    }

    const diffLabels: Record<UserDifficulty, string> = {
      easy: '쉬움 🌱',
      normal: '보통 ⭐',
      hard: '어려움 👑',
    };
    setDifficultyToast(`난이도가 '${diffLabels[newDiff]}'으로 변경되었어요!`);
    setTimeout(() => {
      setDifficultyToast(null);
    }, 3000);
  };

  const toggleMute = () => {
    sound.muted = !sound.muted;
    setMuted(sound.muted);
  };

  useEffect(() => {
    return () => {
      sound.stopSpeaking();
    };
  }, []);

  if (!currentQuestion && !isFinished) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-amber-300 max-w-md">
          <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-2xl font-black text-slate-800">복습할 오답 문제가 없어요!</h2>
          <p className="text-base font-bold text-slate-600 mt-2">
            이 시대의 틀린 문제를 모두 완벽하게 이해했어요! 참 잘했어요!
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-6 w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-lg"
          >
            거점으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const handleChoiceSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelectedChoice(idx);
    setIsSubmitted(true);

    const isCorrect = idx === currentQuestion.answer_index;
    if (isCorrect) {
      sound.playCorrect();
      setSolvedQuestionIds((prev) => [...prev, currentQuestion.question_id]);
      setCorrectMasterIds((prev) =>
        prev.includes(currentQuestion.master_id) ? prev : [...prev, currentQuestion.master_id]
      );
    } else {
      sound.playWrong();
      setWrongMasterIds((prev) =>
        prev.includes(currentQuestion.master_id) ? prev : [...prev, currentQuestion.master_id]
      );
    }
  };

  const handleNext = () => {
    sound.playClick();
    sound.stopSpeaking();
    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setIsSubmitted(false);
    } else {
      sound.playFanfare();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
      setIsFinished(true);
    }
  };

  if (isFinished) {
    const correctCount = solvedQuestionIds.length;
    const wrongCount = sessionQuestions.length - correctCount;

    const goldPerCorrect =
      mode === 'review'
        ? economyRules.quiz_rewards.review_correct_gold + 10 // Bonus gold for review
        : economyRules.quiz_rewards.correct_gold_by_difficulty[currentDifficulty] || 10;

    const expPerCorrect =
      mode === 'review'
        ? 10
        : economyRules.quiz_rewards.correct_exp_by_difficulty[currentDifficulty] || 10;

    const isPerfect =
      mode === 'normal' &&
      correctCount === sessionQuestions.length &&
      sessionQuestions.length >= 10;
    const perfectBonus = isPerfect ? economyRules.quiz_rewards.perfect_clear_bonus_gold : 0;

    const earnedGold = correctCount * goldPerCorrect + perfectBonus;
    const earnedExp = correctCount * expPerCorrect;

    // Gauge calculation (Section 6.3 & 10.2)
    const gaugeDelta =
      mode === 'review'
        ? -(correctCount * (invasionRules.gauge_rules.decrease_per_review_correct || 15))
        : wrongCount * (invasionRules.gauge_rules.increase_per_wrong || 25);

    const nextGauge = Math.min(
      invasionRules.gauge_rules.max_gauge || 100,
      Math.max(0, currentGauge + gaugeDelta)
    );
    const willTriggerInvasion =
      mode === 'normal' && nextGauge >= (invasionRules.gauge_rules.max_gauge || 100);

    const resultPayload: QuizSessionResult = {
      mode,
      difficulty: currentDifficulty,
      solvedQuestionIds,
      correctMasterIds,
      wrongMasterIds,
      earnedGold,
      earnedExp,
      gaugeDelta,
      totalQuestions: sessionQuestions.length,
      correctCount,
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-sky-100 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-3xl border-4 border-amber-400 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center">
            <span className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-sm mb-2">
              {mode === 'review' ? '오답 복습 완료!' : `${eraName} 10문제 탐험 완료!`}
            </span>
            <h2 className="text-3xl font-black text-slate-800">
              {correctCount === sessionQuestions.length
                ? '와아! 모든 문제를 맞혔어요! 🎉'
                : `참 잘했어요! ${sessionQuestions.length}문제 중 ${correctCount}문제 정답!`}
            </h2>
          </div>

          {/* Rewards Summary Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center gap-3">
              <Coins className="w-9 h-9 text-amber-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-500">획득한 골드</div>
                <div className="text-xl font-black text-amber-800">+{earnedGold} G</div>
                {perfectBonus > 0 && (
                  <div className="text-[11px] font-extrabold text-orange-600">
                    만점 보너스 +{perfectBonus}G 포함!
                  </div>
                )}
              </div>
            </div>

            <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-4 flex items-center gap-3">
              <Sparkles className="w-9 h-9 text-purple-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-500">획득한 경험치</div>
                <div className="text-xl font-black text-purple-800">+{earnedExp} EXP</div>
              </div>
            </div>
          </div>

          {/* Unlocked Codex / Graduated Review Notes */}
          {correctMasterIds.length > 0 && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                {mode === 'review' ? (
                  <>
                    <Award className="w-5 h-5 text-emerald-600" />
                    <span>'완벽히 이해한 역사 지식' 배지 획득 & 오답 노트 졸업!</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    <span>새로 배우거나 확인한 역사 도감 지식 ({correctMasterIds.length}개)</span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {correctMasterIds.map((mId) => {
                  const kItem = knowledgeMap[mId];
                  return (
                    <span
                      key={mId}
                      className="px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-xs font-extrabold text-emerald-900"
                    >
                      ✨ {kItem ? kItem.title : mId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Time Rift / Invasion Gauge Change */}
          <div
            className={`rounded-2xl p-4 border-2 flex items-center justify-between ${
              mode === 'review'
                ? 'bg-sky-50 border-sky-300 text-sky-900'
                : willTriggerInvasion
                ? 'bg-red-50 border-red-400 text-red-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              {mode === 'review' ? (
                <ShieldCheck className="w-7 h-7 text-sky-600 shrink-0" />
              ) : (
                <AlertTriangle
                  className={`w-7 h-7 shrink-0 ${
                    willTriggerInvasion ? 'text-red-600 animate-bounce' : 'text-amber-500'
                  }`}
                />
              )}
              <div>
                <div className="text-sm font-black">
                  {mode === 'review'
                    ? '시공간 균열 복구 성공! (침입 게이지 감소)'
                    : willTriggerInvasion
                    ? '앗! 시공간 균열 게이지가 100이 되어 침입 경보가 울렸어요!'
                    : '현재 시공간 균열(침입 게이지)'}
                </div>
                <div className="text-xs font-bold opacity-80">
                  {currentGauge} → {nextGauge} / 100 (
                  {gaugeDelta > 0 ? `+${gaugeDelta}` : gaugeDelta})
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {willTriggerInvasion && (
              <button
                type="button"
                onClick={() => {
                  sound.playAlert();
                  onFinishSession(resultPayload, true);
                }}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-6 h-6" />
                <span>지금 바로 거점 수호하러 가기!</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onFinishSession(resultPayload, false);
              }}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-lg shadow-lg flex items-center justify-center gap-2"
            >
              <Home className="w-6 h-6" />
              <span>보상 받고 시대 거점으로 돌아가기</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCorrectAnswer = selectedChoice === currentQuestion.answer_index;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-amber-50 to-orange-50 flex flex-col justify-between p-3 sm:p-6">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-between gap-4">
        {/* Quiz Header & Progress Bar */}
        <header className="bg-white/95 rounded-2xl p-4 shadow-md border-2 border-amber-300 space-y-2">
          {difficultyToast && (
            <div className="bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black px-3 py-1.5 rounded-xl text-center animate-bounce">
              ✨ {difficultyToast}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-xs sm:text-sm">
                {mode === 'review' ? '📝 오답 복습' : `🌟 ${eraName}`}
              </span>

              {mode === 'normal' && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowSettingsModal(true);
                  }}
                  className={`px-2.5 py-0.5 rounded-full font-black text-xs border transition-transform active:scale-95 flex items-center gap-1 shadow-sm ${
                    currentDifficulty === 'easy'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : currentDifficulty === 'normal'
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-purple-100 text-purple-800 border-purple-300'
                  }`}
                  title="난이도 변경하기"
                >
                  <span>
                    {currentDifficulty === 'easy'
                      ? '🌱 쉬움'
                      : currentDifficulty === 'normal'
                      ? '⭐ 보통'
                      : '👑 어려움'}
                  </span>
                </button>
              )}

              <span className="text-xs sm:text-base font-black text-slate-700">
                문제 {currentIndex + 1} / {sessionQuestions.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowSettingsModal(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs transition-colors shadow-sm"
                title="난이도 및 게임 설정"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>설정</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  if (window.confirm('문제 풀이를 멈추고 거점으로 돌아갈까요?')) {
                    onCancel();
                  }
                }}
                className="text-xs font-extrabold text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-xl bg-slate-100 transition-colors"
              >
                그만하기
              </button>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%` }}
            />
          </div>
        </header>

        {/* Question Card (2nd-grade friendly 2-sentence stem + visual cue + TTS button) */}
        <main className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border-4 border-amber-300 space-y-5">
          {/* Visual Cue & TTS Row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-amber-50/80 p-3.5 rounded-2xl border-2 border-amber-200">
            {Boolean(currentQuestion.visual_cue_asset) && (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white border-2 border-amber-300 p-1.5 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                <img
                  src={currentQuestion.visual_cue_asset}
                  alt="대표 유물·문화유산 사진"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            )}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black text-amber-800 bg-amber-200 px-2.5 py-0.5 rounded-full">
                  {currentQuestion.visual_cue_asset
                    ? '🏛️ 대표 유물·문화유산 사진 힌트'
                    : '집중해서 읽어 보세요!'}
                </span>
                <button
                  type="button"
                  onClick={() => sound.speakKorean(currentQuestion.stem)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 font-black text-xs transition-colors"
                >
                  <Volume2 className="w-4 h-4 text-sky-600" />
                  <span>문제 읽어주기</span>
                </button>
              </div>
              <p className="text-lg sm:text-xl font-black text-slate-800 leading-snug break-keep">
                {currentQuestion.stem}
              </p>
            </div>
          </div>

          {/* 4 Multiple Choice Buttons */}
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.choices.map((choiceText, idx) => {
              const isThisSelected = selectedChoice === idx;
              const isThisRight = idx === currentQuestion.answer_index;

              let btnStyle =
                'border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 text-slate-800';
              if (isSubmitted) {
                if (isThisRight) {
                  btnStyle =
                    'border-emerald-500 bg-emerald-50 text-emerald-950 ring-4 ring-emerald-200';
                } else if (isThisSelected && !isThisRight) {
                  btnStyle = 'border-red-400 bg-red-50 text-red-900';
                } else {
                  btnStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => handleChoiceSelect(idx)}
                  className={`w-full text-left p-4 rounded-2xl border-3 font-black text-base sm:text-lg flex items-center justify-between gap-3 transition-all ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                        isSubmitted && isThisRight
                          ? 'bg-emerald-500 text-white'
                          : isSubmitted && isThisSelected && !isThisRight
                          ? 'bg-red-500 text-white'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="break-keep">{choiceText}</span>
                  </div>

                  {isSubmitted && isThisRight && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  )}
                  {isSubmitted && isThisSelected && !isThisRight && (
                    <XCircle className="w-6 h-6 text-red-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Immediate One-line Explanation & Next Button (Section 6.1) */}
          {isSubmitted && (
            <div
              className={`p-4 rounded-2xl border-2 space-y-3 animate-in fade-in duration-150 ${
                isCorrectAnswer
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-orange-50 border-orange-300 text-orange-950'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-black text-base sm:text-lg">
                  {isCorrectAnswer ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      <span>정답이에요! 정말 대단해요! 👏</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-orange-600 shrink-0" />
                      <span>아쉬워요! 해설을 읽고 기억해 볼까요? 💡</span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => sound.speakKorean(currentQuestion.explanation)}
                  className="px-2.5 py-1 rounded-xl bg-white/80 hover:bg-white text-xs font-black flex items-center gap-1 shrink-0 shadow-sm"
                >
                  <Volume2 className="w-3.5 h-3.5" /> 해설 듣기
                </button>
              </div>

              <p className="text-sm sm:text-base font-bold leading-relaxed break-keep">
                {currentQuestion.explanation}
              </p>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-lg shadow-md flex items-center justify-center gap-2"
              >
                <span>
                  {currentIndex + 1 < sessionQuestions.length
                    ? '다음 문제로 가기'
                    : '결과 보러 가기!'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </main>

        <div className="text-center text-xs font-bold text-slate-400">
          끝까지 풀면 골드와 경험치, 역사도감 보상을 한 번에 받아요!
        </div>
      </div>

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentDifficulty={currentDifficulty}
        onChangeDifficulty={handleChangeDifficulty}
        enemyDifficulty={enemyDifficulty}
        onChangeEnemyDifficulty={onChangeEnemyDifficulty}
        muted={muted}
        onToggleMute={toggleMute}
        isQuizActive={true}
      />
    </div>
  );
};
