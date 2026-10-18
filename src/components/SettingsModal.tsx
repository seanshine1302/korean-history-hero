import React from 'react';
import { UserDifficulty } from '../types/game';
import { sound } from '../utils/sound';
import {
  Settings,
  X,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  Info,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDifficulty: UserDifficulty;
  onChangeDifficulty: (difficulty: UserDifficulty) => void;
  muted?: boolean;
  onToggleMute?: () => void;
  isQuizActive?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentDifficulty,
  onChangeDifficulty,
  muted = sound.muted,
  onToggleMute,
  isQuizActive = false,
}) => {
  if (!isOpen) return null;

  const difficultyOptions: {
    id: UserDifficulty;
    name: string;
    targetText: string;
    desc: string;
    badge: string;
    badgeColor: string;
    borderActive: string;
    bgActive: string;
    reward: string;
  }[] = [
    {
      id: 'easy',
      name: '쉬움',
      targetText: '초등 2학년 추천',
      desc: '그림 힌트와 쉬운 단서로 재미있게 역사를 배워요!',
      badge: '🌱 쉬움',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      borderActive: 'border-emerald-500 ring-4 ring-emerald-100 bg-emerald-50/70',
      bgActive: 'bg-emerald-500 text-white',
      reward: '정답당 +10G / +10EXP',
    },
    {
      id: 'normal',
      name: '보통',
      targetText: '역사 탐험 대원',
      desc: '유물의 쓰임새와 인물의 업적을 균형 있게 연결해 봐요!',
      badge: '⭐ 보통',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      borderActive: 'border-sky-500 ring-4 ring-sky-100 bg-sky-50/70',
      bgActive: 'bg-sky-500 text-white',
      reward: '정답당 +15G / +15EXP',
    },
    {
      id: 'hard',
      name: '어려움',
      targetText: '역사 박사 도전',
      desc: '사건의 원인과 결과, 깊이 있는 역사 이야기를 추론해요!',
      badge: '👑 어려움',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      borderActive: 'border-purple-500 ring-4 ring-purple-100 bg-purple-50/70',
      bgActive: 'bg-purple-500 text-white',
      reward: '정답당 +20G / +20EXP',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border-4 border-amber-400 shadow-2xl p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-amber-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-700 shadow-sm">
              <Settings className="w-6 h-6 animate-[spin_8s_linear_infinite]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">게임 환경 설정</h2>
              <p className="text-xs font-bold text-slate-500">
                난이도 및 게임 설정을 언제든지 조절할 수 있어요
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              게임 난이도 조절
            </span>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              현재: {difficultyOptions.find((d) => d.id === currentDifficulty)?.name}
            </span>
          </div>

          {isQuizActive && (
            <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900 font-bold">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                문제 풀이 중 난이도를 변경하면 <strong>다음 문제부터 즉시 반영</strong>되며 보상도 새 난이도 기준으로 적용돼요!
              </span>
            </div>
          )}

          <div className="space-y-2.5">
            {difficultyOptions.map((opt) => {
              const isSelected = currentDifficulty === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onChangeDifficulty(opt.id);
                  }}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-3 transition-all flex items-center justify-between gap-3 active:scale-98 ${
                    isSelected
                      ? opt.borderActive
                      : 'border-slate-200 bg-slate-50/60 hover:bg-amber-50/50 hover:border-amber-300'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${opt.badgeColor}`}
                      >
                        {opt.badge}
                      </span>
                      <span className="text-xs font-extrabold text-slate-400">
                        ({opt.targetText})
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-600 mt-1 line-clamp-1">
                      {opt.desc}
                    </div>
                    <div className="text-[11px] font-black text-amber-700 mt-1">
                      🎁 {opt.reward}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-center">
                    <div
                      className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? `${opt.bgActive} border-transparent shadow-sm`
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Section */}
        {onToggleMute && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                {muted ? (
                  <VolumeX className="w-4 h-4 text-red-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div>
                <div className="text-sm font-black text-slate-800">효과음 및 음성 읽어주기</div>
                <div className="text-xs font-bold text-slate-500">
                  {muted ? '현재 소리가 꺼져 있어요' : '효과음과 문제 읽어주기 소리가 켜져 있어요'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onToggleMute();
                sound.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-colors shadow-sm ${
                muted
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {muted ? '소리 켜기' : '소리 켬'}
            </button>
          </div>
        )}

        {/* Bottom Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-base shadow-lg transition-transform active:scale-98"
          >
            설정 완료
          </button>
        </div>
      </div>
    </div>
  );
};
