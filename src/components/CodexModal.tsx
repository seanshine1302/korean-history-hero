import React, { useState, useEffect } from 'react';
import {
  EraSaveState,
  InvasionRulesConfig,
  KnowledgeItem,
} from '../types/game';
import { sound } from '../utils/sound';
import { X, BookOpen, User, Shield, Volume2, Award, Lock, Sparkles } from 'lucide-react';

interface CodexModalProps {
  eraId: number;
  eraName: string;
  eraSave: EraSaveState;
  eraKnowledgeItems: KnowledgeItem[];
  invasionRules: InvasionRulesConfig;
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({
  eraId,
  eraName,
  eraSave,
  eraKnowledgeItems,
  invasionRules,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'artifact' | 'person' | 'guardian'>('artifact');

  useEffect(() => {
    return () => {
      sound.stopSpeaking();
    };
  }, []);

  const unlockedSet = new Set(eraSave.unlocked_codex_ids || []);
  const graduatedSet = new Set(eraSave.graduated_master_ids || []);

  // Category 1: Curated Well-known Artifacts & Cultural Heritage with real photos
  const artifactItems = eraKnowledgeItems.filter((item) => Boolean(item.visual_asset));
  // Category 2: Historical Persons, Events & Culture (text-focused without unrelated icons)
  const personItems = eraKnowledgeItems.filter((item) => !item.visual_asset);

  // Category 3: Guardian (Enemies & Bosses from invasionRules)
  const encounter = invasionRules.era_encounters[String(eraId)];
  const guardianList = [];
  if (encounter) {
    if (encounter.normal_enemy.sub_enemies) {
      encounter.normal_enemy.sub_enemies.forEach((sub) => {
        guardianList.push({
          id: sub.id,
          name: sub.name,
          asset: sub.asset,
          isBoss: false,
          description: encounter.normal_enemy.description,
          unlocked:
            unlockedSet.has(sub.id) || unlockedSet.has(encounter.normal_enemy.id),
        });
      });
    } else {
      guardianList.push({
        id: encounter.normal_enemy.id,
        name: encounter.normal_enemy.name,
        asset: encounter.normal_enemy.asset,
        isBoss: false,
        description: encounter.normal_enemy.description,
        unlocked: unlockedSet.has(encounter.normal_enemy.id),
      });
    }

    guardianList.push({
      id: encounter.boss.id,
      name: encounter.boss.name,
      asset: encounter.boss.asset,
      isBoss: true,
      description: encounter.boss.description,
      rewardItem: encounter.boss.reward_item,
      unlocked: unlockedSet.has(encounter.boss.id) || eraSave.boss_cleared,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl border-4 border-emerald-400 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-black bg-white/20 px-2.5 py-0.5 rounded-full">
              제{eraId}시대 · {eraName}
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-0.5">
              📖 나만의 역사 수집 도감
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              sound.stopSpeaking();
              onClose();
            }}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* 3 Category Tabs (Section 9.1) */}
        <div className="grid grid-cols-3 bg-emerald-50 border-b-2 border-emerald-200 p-2 gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('artifact');
            }}
            className={`py-3 px-2 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'artifact'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-emerald-100'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>대표 유물·문화재 ({artifactItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('person');
            }}
            className={`py-3 px-2 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'person'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-emerald-100'
            }`}
          >
            <User className="w-5 h-5" />
            <span>역사 인물·이야기 ({personItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('guardian');
            }}
            className={`py-3 px-2 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'guardian'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-emerald-100'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>수호단 도감 ({guardianList.length})</span>
          </button>
        </div>

        {/* Codex Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {(activeTab === 'artifact' || activeTab === 'person') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeTab === 'artifact' ? artifactItems : personItems).map((item) => {
                const isUnlocked = unlockedSet.has(item.knowledge_id);
                const isGraduated = graduatedSet.has(item.knowledge_id);
                const hintText = `${item.era}의 '${item.keywords[0]}' 관련 문제를 맞히면 정체가 밝혀져요!`;

                return (
                  <div
                    key={item.knowledge_id}
                    className={`p-4 rounded-2xl border-3 flex flex-col justify-between gap-3 transition-all ${
                      isUnlocked
                        ? 'border-emerald-400 bg-gradient-to-br from-white to-emerald-50/50 shadow-md'
                        : 'border-slate-200 bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Only show authentic artifact photo box when item.visual_asset exists */}
                      {Boolean(item.visual_asset) && (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-2 border-emerald-200 p-1.5 flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm">
                          <img
                            src={item.visual_asset}
                            alt={isUnlocked ? item.title : '미해금 유물 도감'}
                            className={`w-full h-full object-contain rounded-xl transition-all ${
                              isUnlocked ? '' : 'grayscale brightness-50 blur-[2px] opacity-60'
                            }`}
                          />
                          {!isUnlocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30">
                              <Lock className="w-6 h-6 text-white drop-shadow" />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {item.evidence_type === 'myth'
                              ? '✨ 건국 신화'
                              : item.evidence_type === 'tradition'
                              ? '📜 전해지는 이야기'
                              : item.visual_asset
                              ? '🏛️ 대표 유물·문화유산'
                              : '📖 역사 인물·사건'}
                          </span>
                          {isGraduated && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-300 text-amber-950">
                              <Award className="w-3 h-3" /> 완벽 이해 배지
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-black text-slate-800">
                          {isUnlocked ? item.title : '??? (미발견 역사 지식)'}
                        </h3>

                        <p className="text-sm font-bold text-slate-600 mt-1 leading-relaxed break-keep">
                          {isUnlocked ? item.summary : `힌트: ${hintText}`}
                        </p>
                      </div>
                    </div>

                    {isUnlocked && (
                      <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60">
                        <div className="flex flex-wrap gap-1">
                          {item.keywords.slice(0, 3).map((kw) => (
                            <span
                              key={kw}
                              className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-white border border-emerald-200 text-emerald-800"
                            >
                              #{kw}
                            </span>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            sound.speakKorean(`${item.title}. ${item.summary}`)
                          }
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>음성으로 듣기</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: Guardian (Enemies & Bosses) Codex */}
          {activeTab === 'guardian' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guardianList.map((g) => (
                <div
                  key={g.id}
                  className={`p-4 rounded-2xl border-3 flex flex-col justify-between gap-3 ${
                    g.unlocked
                      ? 'border-amber-400 bg-amber-50/50 shadow-md'
                      : 'border-slate-200 bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-white border-2 border-amber-200 p-2 flex items-center justify-center shrink-0 relative">
                      <img
                        src={g.asset}
                        alt={g.unlocked ? g.name : '미해금'}
                        className={`w-full h-full object-contain ${
                          g.unlocked ? '' : 'brightness-0 opacity-75'
                        }`}
                      />
                    </div>

                    <div className="flex-1">
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                          g.isBoss
                            ? 'bg-purple-600 text-white'
                            : 'bg-orange-200 text-orange-900'
                        }`}
                      >
                        {g.isBoss ? '👑 시대 최종 보스' : '⚔️ 거점 방해꾼'}
                      </span>

                      <h3 className="text-lg font-black text-slate-800 mt-1">
                        {g.unlocked ? g.name : '??? (침입 방어 또는 보스전 승리 시 해금)'}
                      </h3>

                      <p className="text-sm font-bold text-slate-600 mt-1 break-keep">
                        {g.unlocked
                          ? g.description
                          : g.isBoss
                          ? '힌트: 거점을 Lv.5까지 업그레이드하고 최종 보스전에서 승리하면 정체가 공개돼요!'
                          : '힌트: 거점 수호 이벤트를 클리어하면 도감에 등록돼요!'}
                      </p>

                      {g.unlocked && g.rewardItem && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-yellow-200 text-yellow-950 text-xs font-black">
                          <Sparkles className="w-3.5 h-3.5" /> 전리품: {g.rewardItem}
                        </div>
                      )}
                    </div>
                  </div>

                  {g.unlocked && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => sound.speakKorean(`${g.name}. ${g.description}`)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center gap-1.5"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>설명 듣기</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
