import React, { useState } from 'react';
import { BaseGraphicsConfig, PlayerProfile } from '../types/game';
import { sound } from '../utils/sound';
import { Compass, Trophy, CheckCircle2, Shield, Sparkles, UserCheck, Castle } from 'lucide-react';

interface EraSelectScreenProps {
  profile: PlayerProfile;
  baseGraphics: BaseGraphicsConfig;
  totalQuestionsByEra: Record<number, number>;
  onSelectEra: (eraId: number) => void;
  onSwitchProfile: () => void;
}

const ERA_PERIOD_LABELS: Record<number, string> = {
  1: '약 70만 년 전 ~ 기원전',
  2: '기원전 2333년 ~ 초기 국가',
  3: '기원전 1세기 ~ 7세기',
  4: '676년 ~ 926년',
  5: '918년 ~ 1392년',
  6: '1392년 ~ 1897년',
  7: '1876년 ~ 1910년',
  8: '1910년 ~ 1945년 광복',
};

export const EraSelectScreen: React.FC<EraSelectScreenProps> = ({
  profile,
  baseGraphics,
  totalQuestionsByEra,
  onSelectEra,
  onSwitchProfile,
}) => {
  const [selectedEraId, setSelectedEraId] = useState<number>(profile.last_played_era || 1);

  const selectedEraConfig = baseGraphics.eras[String(selectedEraId)];
  const selectedEraSave = profile.eras[String(selectedEraId)];
  const totalQuestions = totalQuestionsByEra[selectedEraId] || 100;
  const solvedCount = selectedEraSave?.solved_question_ids?.length || 0;
  const explorationPercent = Math.min(100, Math.round((solvedCount / totalQuestions) * 100));
  const accuracyPercent =
    selectedEraSave && selectedEraSave.total_attempts > 0
      ? Math.round((selectedEraSave.correct_attempts / selectedEraSave.total_attempts) * 100)
      : 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 via-orange-50 to-sky-100 flex flex-col p-3 sm:p-6">
      <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col justify-between gap-4">
        {/* Top Header */}
        <header className="flex items-center justify-between bg-white/90 backdrop-blur px-4 py-3 rounded-2xl shadow-md border-2 border-amber-300">
          <div className="flex items-center gap-3">
            <img
              src={
                profile.gender === 'boy'
                  ? '/assets/heroes/hero_joseon_boy.png'
                  : '/assets/heroes/hero_joseon_girl.png'
              }
              alt={profile.name}
              className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-300 object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-800">{profile.name} 대원</span>
                <span className="text-xs font-extrabold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                  역사 탐험가
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500">어느 시대로 시간여행을 떠날까요?</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onSwitchProfile();
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm flex items-center gap-1.5 transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>여행자 바꾸기</span>
          </button>
        </header>

        {/* Upper UI: 8 Era Cards Grid (Mobile 2 cols x 4 rows, Tablet/Desktop 4 cols x 2 rows) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((eraId) => {
            const eraCfg = baseGraphics.eras[String(eraId)];
            const eraSave = profile.eras[String(eraId)];
            const eraTotalQ = totalQuestionsByEra[eraId] || 100;
            const eraSolved = eraSave?.solved_question_ids?.length || 0;
            const eraPct = Math.min(100, Math.round((eraSolved / eraTotalQ) * 100));
            const isSelected = selectedEraId === eraId;
            const baseLv = eraSave?.base_level || 1;
            const baseImg =
              eraCfg?.base_levels[`level_${baseLv}`]?.asset_path ||
              `/assets/bases/base_prehistoric_lv1.png`;

            return (
              <button
                key={eraId}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setSelectedEraId(eraId);
                }}
                className={`relative text-left p-3 rounded-2xl border-4 transition-all flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'border-amber-500 bg-gradient-to-b from-amber-50 to-white shadow-xl scale-[1.02] ring-4 ring-amber-300/50'
                    : 'border-white/80 bg-white/85 hover:bg-white shadow-md opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    제{eraId}시대
                  </span>
                  {eraSave?.boss_cleared && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-black bg-yellow-300 text-yellow-950 px-1.5 py-0.5 rounded-full">
                      <Trophy className="w-3 h-3" /> 마스터
                    </span>
                  )}
                </div>

                <div className="my-1 flex items-center justify-center h-20 sm:h-24 relative">
                  <img
                    src={baseImg}
                    alt={eraCfg?.era_name}
                    className="max-h-full max-w-full object-contain drop-shadow"
                  />
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 truncate">
                    {eraCfg?.era_name}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500 truncate">
                    {ERA_PERIOD_LABELS[eraId]}
                  </p>

                  {/* Mini progress bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-[11px] font-extrabold text-slate-600 mb-0.5">
                      <span>탐험도 {eraPct}%</span>
                      <span>거점 Lv.{baseLv}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, eraPct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Lower UI: Selected Era Detailed Progress & Main CTA Button (Section 4.3) */}
        {selectedEraConfig && selectedEraSave && (
          <div className="bg-white/95 backdrop-blur rounded-3xl p-4 sm:p-6 shadow-xl border-4 border-amber-400">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Era Overview */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center shrink-0 p-2">
                  <img
                    src={
                      profile.gender === 'boy'
                        ? selectedEraConfig.hero_boy
                        : selectedEraConfig.hero_girl
                    }
                    alt={selectedEraConfig.era_name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-black">
                      제{selectedEraId}시대
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                      {selectedEraConfig.era_name}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1">
                    {selectedEraConfig.subtitle}
                  </p>

                  {/* 5 Stats Pills required by Section 4.3 */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 text-center">
                      <div className="text-[11px] font-bold text-slate-500">탐험도</div>
                      <div className="text-sm sm:text-base font-black text-amber-700">
                        {explorationPercent}%
                      </div>
                    </div>
                    <div className="bg-sky-50 border border-sky-200 rounded-xl px-2.5 py-1.5 text-center">
                      <div className="text-[11px] font-bold text-slate-500">푼 문제 수</div>
                      <div className="text-sm sm:text-base font-black text-sky-700">
                        {solvedCount}문제
                      </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1.5 text-center">
                      <div className="text-[11px] font-bold text-slate-500">정답률</div>
                      <div className="text-sm sm:text-base font-black text-emerald-700">
                        {accuracyPercent}%
                      </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl px-2.5 py-1.5 text-center">
                      <div className="text-[11px] font-bold text-slate-500">캐릭터 레벨</div>
                      <div className="text-sm sm:text-base font-black text-purple-700">
                        Lv.{selectedEraSave.char_level}
                      </div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl px-2.5 py-1.5 text-center col-span-3 sm:col-span-1">
                      <div className="text-[11px] font-bold text-slate-500">거점 레벨</div>
                      <div className="text-sm sm:text-base font-black text-orange-700">
                        Lv.{selectedEraSave.base_level} / 5
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary CTA Button */}
              <button
                type="button"
                onClick={() => {
                  sound.playFanfare();
                  onSelectEra(selectedEraId);
                }}
                className="w-full md:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-black text-xl shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95 shrink-0"
              >
                <Compass className="w-7 h-7 animate-spin" style={{ animationDuration: '8s' }} />
                <span>이 시대로 떠나기!</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
