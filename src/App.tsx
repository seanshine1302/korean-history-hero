import React, { useState, useEffect } from 'react';
import {
  BaseGraphicsConfig,
  DifficultyProfileConfig,
  DisplayArtifactItem,
  EconomyRulesConfig,
  EquipmentItem,
  GameSaveData,
  Gender,
  InvasionRulesConfig,
  KnowledgeItem,
  QuizQuestion,
  ShopCatalogConfig,
  UserDifficulty,
} from './types/game';
import { createNewProfile, loadSaveData, saveGameData } from './utils/storage';
import { selectReviewQuestions, selectSessionQuestions } from './utils/quizEngine';
import { ProfileSelectScreen } from './components/ProfileSelectScreen';
import { EraSelectScreen } from './components/EraSelectScreen';
import { EraHomeScreen } from './components/EraHomeScreen';
import { QuizSessionResult, QuizSessionScreen } from './components/QuizSessionScreen';
import { InvasionModal, InvasionOutcome } from './components/InvasionModal';
import { ShopDecorateModal } from './components/ShopDecorateModal';
import { CodexModal } from './components/CodexModal';

type ScreenState = 'profile_select' | 'era_select' | 'era_home' | 'quiz_session';

export function App() {
  const [saveData, setSaveData] = useState<GameSaveData>(() => loadSaveData());
  const [screen, setScreen] = useState<ScreenState>(() => {
    const initial = loadSaveData();
    return initial.current_profile_id && initial.profiles[initial.current_profile_id]
      ? 'era_select'
      : 'profile_select';
  });

  const [currentEraId, setCurrentEraId] = useState<number>(() => {
    const initial = loadSaveData();
    const prof = initial.current_profile_id ? initial.profiles[initial.current_profile_id] : null;
    return prof?.last_played_era || 1;
  });

  // Static Configs & Question Banks loaded from public/data/
  const [difficultyConfig, setDifficultyConfig] = useState<DifficultyProfileConfig | null>(null);
  const [economyRules, setEconomyRules] = useState<EconomyRulesConfig | null>(null);
  const [invasionRules, setInvasionRules] = useState<InvasionRulesConfig | null>(null);
  const [baseGraphics, setBaseGraphics] = useState<BaseGraphicsConfig | null>(null);
  const [shopCatalog, setShopCatalog] = useState<ShopCatalogConfig | null>(null);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);
  const [eraQuestionBanks, setEraQuestionBanks] = useState<Record<number, QuizQuestion[]>>({});
  const [loading, setLoading] = useState(true);

  // Active Quiz Session state
  const [quizMode, setQuizMode] = useState<'normal' | 'review'>('normal');
  const [quizDifficulty, setQuizDifficulty] = useState<UserDifficulty>(() => {
    const initial = loadSaveData();
    const prof = initial.current_profile_id ? initial.profiles[initial.current_profile_id] : null;
    return prof?.difficulty || 'easy';
  });
  const [enemyDifficulty, setEnemyDifficulty] = useState<number>(() => {
    const initial = loadSaveData();
    const prof = initial.current_profile_id ? initial.profiles[initial.current_profile_id] : null;
    return prof?.enemy_difficulty ?? 0;
  });
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);

  // Active Modals in Era Home
  const [shopModalState, setShopModalState] = useState<{
    open: boolean;
    initialTab: 'base' | 'equipment' | 'artifact';
    initialSlotId: string;
  }>({ open: false, initialTab: 'base', initialSlotId: 'slot_1' });
  const [showCodexModal, setShowCodexModal] = useState(false);
  const [invasionModalState, setInvasionModalState] = useState<{
    open: boolean;
    isBoss: boolean;
  }>({ open: false, isBoss: false });

  // Persist saveData automatically whenever it changes
  useEffect(() => {
    saveGameData(saveData);
  }, [saveData]);

  // Preload static JSON configs and era question banks (<0.05s on Vercel CDN)
  useEffect(() => {
    async function loadAllStaticData() {
      try {
        const [diffRes, econRes, invRes, baseRes, shopRes, knowRes] = await Promise.all([
          fetch('/data/config/difficulty_profile.json').then((r) => r.json()),
          fetch('/data/config/economy_rules.json').then((r) => r.json()),
          fetch('/data/config/invasion_rules.json').then((r) => r.json()),
          fetch('/data/config/base_graphics_config.json').then((r) => r.json()),
          fetch('/data/config/shop_catalog.json').then((r) => r.json()),
          fetch('/data/knowledge/knowledge_master.json').then((r) => r.json()),
        ]);

        setDifficultyConfig(diffRes);
        setEconomyRules(econRes);
        setInvasionRules(invRes);
        setBaseGraphics(baseRes);
        setShopCatalog(shopRes);
        setKnowledgeList(knowRes.items || []);

        const banks: Record<number, QuizQuestion[]> = {};
        await Promise.all(
          [1, 2, 3, 4, 5, 6, 7, 8].map(async (eraId) => {
            const qRes = await fetch(`/data/questions/era_${eraId}.json`).then((r) => r.json());
            banks[eraId] = qRes.questions || [];
          })
        );
        setEraQuestionBanks(banks);
      } catch (err) {
        console.error('Error loading static game data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllStaticData();
  }, []);

  if (
    loading ||
    !difficultyConfig ||
    !economyRules ||
    !invasionRules ||
    !baseGraphics ||
    !shopCatalog
  ) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-2xl font-black text-slate-800">
          시간여행 지도를 펼치는 중이에요...
        </h2>
      </div>
    );
  }

  const currentProfile = saveData.current_profile_id
    ? saveData.profiles[saveData.current_profile_id]
    : null;

  const knowledgeMap: Record<string, KnowledgeItem> = {};
  knowledgeList.forEach((k) => {
    knowledgeMap[k.knowledge_id] = k;
  });

  const totalQuestionsByEra: Record<number, number> = {};
  [1, 2, 3, 4, 5, 6, 7, 8].forEach((id) => {
    totalQuestionsByEra[id] = eraQuestionBanks[id]?.length || 100;
  });

  // Helper to update current profile's current era state cleanly
  const updateCurrentEraState = (
    updater: (eraState: NonNullable<typeof currentProfile>['eras'][string]) => void
  ) => {
    if (!currentProfile) return;
    setSaveData((prev) => {
      const profId = prev.current_profile_id!;
      const prof = { ...prev.profiles[profId] };
      const eras = { ...prof.eras };
      const eraKey = String(currentEraId);
      const targetEra = JSON.parse(JSON.stringify(eras[eraKey]));
      updater(targetEra);
      eras[eraKey] = targetEra;
      prof.eras = eras;
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [profId]: prof,
        },
      };
    });
  };

  // Calculate character level from total EXP based on economyRules.character_level_up_exp
  const calculateCharLevel = (exp: number): number => {
    const thresholds = economyRules.character_level_up_exp;
    let level = 1;
    for (let i = 0; i < thresholds.length; i++) {
      if (exp >= thresholds[i]) {
        level = i + 1;
      }
    }
    return level;
  };

  // Profile Management Handlers
  const handleSelectProfile = (profileId: string) => {
    const prof = saveData.profiles[profileId];
    setSaveData((prev) => ({ ...prev, current_profile_id: profileId }));
    if (prof) {
      setCurrentEraId(prof.last_played_era || 1);
      setQuizDifficulty(prof.difficulty || 'easy');
      setEnemyDifficulty(prof.enemy_difficulty ?? 0);
    }
    setScreen('era_select');
  };

  const handleCreateProfile = (name: string, gender: Gender) => {
    const newProf = createNewProfile(name, gender);
    setSaveData((prev) => ({
      current_profile_id: newProf.id,
      profiles: {
        ...prev.profiles,
        [newProf.id]: newProf,
      },
    }));
    setCurrentEraId(1);
    setQuizDifficulty(newProf.difficulty || 'easy');
    setEnemyDifficulty(newProf.enemy_difficulty ?? 0);
    setScreen('era_select');
  };

  const handleUpdateDifficulty = (newDiff: UserDifficulty) => {
    setQuizDifficulty(newDiff);
    if (!currentProfile) return;
    setSaveData((prev) => {
      const profId = prev.current_profile_id;
      if (!profId || !prev.profiles[profId]) return prev;
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [profId]: {
            ...prev.profiles[profId],
            difficulty: newDiff,
          },
        },
      };
    });
  };

  const handleUpdateEnemyDifficulty = (newEnemyDiff: number) => {
    const clamped = Math.max(0, Math.min(10, Math.round(newEnemyDiff)));
    setEnemyDifficulty(clamped);
    if (!currentProfile) return;
    setSaveData((prev) => {
      const profId = prev.current_profile_id;
      if (!profId || !prev.profiles[profId]) return prev;
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [profId]: {
            ...prev.profiles[profId],
            enemy_difficulty: clamped,
          },
        },
      };
    });
  };

  const handleDeleteProfile = (profileId: string) => {
    setSaveData((prev) => {
      const nextProfiles = { ...prev.profiles };
      delete nextProfiles[profileId];
      const remainingIds = Object.keys(nextProfiles);
      return {
        current_profile_id:
          prev.current_profile_id === profileId ? remainingIds[0] || null : prev.current_profile_id,
        profiles: nextProfiles,
      };
    });
  };

  const handleSelectEra = (eraId: number) => {
    setCurrentEraId(eraId);
    if (currentProfile) {
      setSaveData((prev) => ({
        ...prev,
        profiles: {
          ...prev.profiles,
          [currentProfile.id]: {
            ...currentProfile,
            last_played_era: eraId,
          },
        },
      }));
    }
    setScreen('era_home');
  };

  // Start 10-question Quiz Session
  const handleStartQuiz = (difficulty: UserDifficulty) => {
    if (!currentProfile) return;
    const eraSave = currentProfile.eras[String(currentEraId)];
    const bank = eraQuestionBanks[currentEraId] || [];
    const selected = selectSessionQuestions(
      bank,
      difficulty,
      difficultyConfig,
      eraSave.solved_question_ids || [],
      10
    );
    setQuizMode('normal');
    setQuizDifficulty(difficulty);
    setSessionQuestions(selected);
    setScreen('quiz_session');
  };

  // Start Wrong-Answer Review Session (up to 5 sibling questions)
  const handleStartReview = () => {
    if (!currentProfile) return;
    const eraSave = currentProfile.eras[String(currentEraId)];
    const bank = eraQuestionBanks[currentEraId] || [];
    const selected = selectReviewQuestions(
      bank,
      eraSave.wrong_master_ids || [],
      eraSave.solved_question_ids || [],
      5
    );
    setQuizMode('review');
    setQuizDifficulty('easy');
    setSessionQuestions(selected);
    setScreen('quiz_session');
  };

  // Finish Quiz / Review Session
  const handleFinishQuizSession = (result: QuizSessionResult, triggerInvasionNow: boolean) => {
    updateCurrentEraState((eraState) => {
      eraState.gold += result.earnedGold;
      eraState.char_exp += result.earnedExp;
      eraState.char_level = calculateCharLevel(eraState.char_exp);

      eraState.total_attempts = (eraState.total_attempts || 0) + result.totalQuestions;
      eraState.correct_attempts = (eraState.correct_attempts || 0) + result.correctCount;

      // Record solved question IDs
      const solvedSet = new Set(eraState.solved_question_ids || []);
      result.solvedQuestionIds.forEach((id) => solvedSet.add(id));
      eraState.solved_question_ids = Array.from(solvedSet);

      // Unlock Codex entries for all correct master_ids
      const codexSet = new Set(eraState.unlocked_codex_ids || []);
      result.correctMasterIds.forEach((mId) => codexSet.add(mId));

      // Also unlock person codex entries if exploration reaches milestones
      const totalEraQ = totalQuestionsByEra[currentEraId] || 100;
      const pct = (eraState.solved_question_ids.length / totalEraQ) * 100;
      if (pct >= 30) {
        knowledgeList
          .filter((k) => k.era_id === currentEraId && k.category === 'person')
          .slice(0, 2)
          .forEach((k) => codexSet.add(k.knowledge_id));
      }
      eraState.unlocked_codex_ids = Array.from(codexSet);

      // Update wrong_master_ids & graduated_master_ids
      const wrongSet = new Set(eraState.wrong_master_ids || []);
      const gradSet = new Set(eraState.graduated_master_ids || []);

      if (result.mode === 'review') {
        // Section 10.2: Graduate master_ids answered correctly in Review!
        result.correctMasterIds.forEach((mId) => {
          wrongSet.delete(mId);
          gradSet.add(mId);
        });
      } else {
        result.wrongMasterIds.forEach((mId) => wrongSet.add(mId));
      }

      eraState.wrong_master_ids = Array.from(wrongSet);
      eraState.graduated_master_ids = Array.from(gradSet);

      // Update Invasion Gauge (clamped 0 ~ max_gauge)
      const maxG = invasionRules.gauge_rules.max_gauge || 100;
      eraState.invasion_gauge = Math.min(
        maxG,
        Math.max(0, (eraState.invasion_gauge || 0) + result.gaugeDelta)
      );
    });

    setScreen('era_home');
    if (triggerInvasionNow) {
      setInvasionModalState({ open: true, isBoss: false });
    }
  };

  // Complete Invasion / Boss Encounter
  const handleCompleteInvasion = (outcome: InvasionOutcome) => {
    updateCurrentEraState((eraState) => {
      eraState.gold += outcome.earnedGold;
      eraState.char_exp += outcome.earnedExp;
      eraState.char_level = calculateCharLevel(eraState.char_exp);

      if (!outcome.isBoss) {
        // Reset invasion gauge after defending or attempting defense
        eraState.invasion_gauge = 0;
      }

      if (outcome.victory) {
        const codexSet = new Set(eraState.unlocked_codex_ids || []);
        outcome.unlockedEnemyIds.forEach((id) => codexSet.add(id));
        eraState.unlocked_codex_ids = Array.from(codexSet);

        if (outcome.isBoss) {
          eraState.boss_cleared = true;
        }
      }
    });
    setInvasionModalState({ open: false, isBoss: false });
  };

  // Shop & Decoration Handlers
  const handleUpgradeBase = (cost: number) => {
    updateCurrentEraState((eraState) => {
      if (eraState.gold >= cost && eraState.base_level < 5) {
        eraState.gold -= cost;
        eraState.base_level += 1;
      }
    });
  };

  const handleBuyAndEquipItem = (item: EquipmentItem) => {
    updateCurrentEraState((eraState) => {
      if (eraState.gold < item.cost) return;
      eraState.gold -= item.cost;
      if (!eraState.owned_items.includes(item.id)) {
        eraState.owned_items.push(item.id);
      }
      // Replace any equipped item of the same category (weapon / armor / accessory)
      const otherEquipped = (eraState.equipped_items || []).filter((eqId) => {
        const eqObj = shopCatalog.equipment_items.find((e) => e.id === eqId);
        return eqObj && eqObj.category !== item.category;
      });
      eraState.equipped_items = [...otherEquipped, item.id];
    });
  };

  const handleToggleEquipItem = (item: EquipmentItem) => {
    updateCurrentEraState((eraState) => {
      const isEquipped = (eraState.equipped_items || []).includes(item.id);
      if (isEquipped) {
        eraState.equipped_items = eraState.equipped_items.filter((id) => id !== item.id);
      } else {
        const otherEquipped = (eraState.equipped_items || []).filter((eqId) => {
          const eqObj = shopCatalog.equipment_items.find((e) => e.id === eqId);
          return eqObj && eqObj.category !== item.category;
        });
        eraState.equipped_items = [...otherEquipped, item.id];
      }
    });
  };

  const handleSellEquipment = (item: EquipmentItem) => {
    const refundRate = economyRules.sell_refund_rate ?? 0.5;
    const refund = Math.floor(item.cost * refundRate);
    updateCurrentEraState((eraState) => {
      const owned = eraState.owned_items || [];
      const idx = owned.indexOf(item.id);
      if (idx === -1) return;
      owned.splice(idx, 1);
      eraState.owned_items = owned;
      eraState.equipped_items = (eraState.equipped_items || []).filter((id) => id !== item.id);
      eraState.gold += refund;
    });
  };

  const handleBuyArtifact = (artifact: DisplayArtifactItem, targetSlotId?: string) => {
    updateCurrentEraState((eraState) => {
      if (eraState.gold < artifact.cost) return;
      eraState.gold -= artifact.cost;
      if (!eraState.owned_artifacts) {
        eraState.owned_artifacts = [];
      }
      // Always push to allow owning multiple copies of the same display artifact
      eraState.owned_artifacts.push(artifact.id);

      if (!eraState.placed_artifacts) {
        eraState.placed_artifacts = {};
      }
      // Auto-place into targetSlotId if empty, otherwise into the first empty unlocked slot
      const maxSlots = eraState.base_level || 1;
      if (targetSlotId && !eraState.placed_artifacts[targetSlotId]) {
        eraState.placed_artifacts[targetSlotId] = artifact.id;
      } else {
        for (let i = 1; i <= maxSlots; i++) {
          const slotKey = `slot_${i}`;
          if (!eraState.placed_artifacts[slotKey]) {
            eraState.placed_artifacts[slotKey] = artifact.id;
            break;
          }
        }
      }
    });
  };

  const handlePlaceArtifact = (slotId: string, artifactId: string | null) => {
    updateCurrentEraState((eraState) => {
      const nextPlaced = { ...(eraState.placed_artifacts || {}) };
      if (artifactId === null) {
        delete nextPlaced[slotId];
      } else {
        const ownedCount = (eraState.owned_artifacts || []).filter(
          (id) => id === artifactId
        ).length;
        if (ownedCount <= 0) return;

        // Check how many other slots currently hold this same artifactId
        const otherSlotsWithSame = Object.keys(nextPlaced).filter(
          (k) => k !== slotId && nextPlaced[k] === artifactId
        );

        // Only remove from an existing slot if all owned copies are already placed in other slots
        if (otherSlotsWithSame.length >= ownedCount) {
          const excessCount = otherSlotsWithSame.length - ownedCount + 1;
          for (let i = 0; i < excessCount; i++) {
            delete nextPlaced[otherSlotsWithSame[i]];
          }
        }
        nextPlaced[slotId] = artifactId;
      }
      eraState.placed_artifacts = nextPlaced;
    });
  };

  const handleSellArtifact = (
    artifact: DisplayArtifactItem,
    preferredUnplaceSlotId?: string
  ) => {
    const refundRate = economyRules.sell_refund_rate ?? 0.5;
    const refund = Math.floor(artifact.cost * refundRate);
    updateCurrentEraState((eraState) => {
      const owned = eraState.owned_artifacts || [];
      const idx = owned.indexOf(artifact.id);
      if (idx === -1) return;

      // Remove 1 copy from owned_artifacts
      owned.splice(idx, 1);
      eraState.owned_artifacts = owned;
      eraState.gold += refund;

      // If placed copies now exceed remaining owned copies, unplace 1 copy
      const remainingOwnedCount = owned.filter((id) => id === artifact.id).length;
      const nextPlaced = { ...(eraState.placed_artifacts || {}) };
      const placedSlots = Object.keys(nextPlaced).filter((k) => nextPlaced[k] === artifact.id);

      if (placedSlots.length > remainingOwnedCount) {
        if (preferredUnplaceSlotId && nextPlaced[preferredUnplaceSlotId] === artifact.id) {
          delete nextPlaced[preferredUnplaceSlotId];
        } else {
          const lastSlot = placedSlots[placedSlots.length - 1];
          if (lastSlot) {
            delete nextPlaced[lastSlot];
          }
        }
        eraState.placed_artifacts = nextPlaced;
      }
    });
  };

  // Render Screens
  if (screen === 'profile_select' || !currentProfile) {
    return (
      <ProfileSelectScreen
        profiles={saveData.profiles}
        onSelectProfile={handleSelectProfile}
        onCreateProfile={handleCreateProfile}
        onDeleteProfile={handleDeleteProfile}
      />
    );
  }

  if (screen === 'era_select') {
    return (
      <EraSelectScreen
        profile={currentProfile}
        baseGraphics={baseGraphics}
        totalQuestionsByEra={totalQuestionsByEra}
        onSelectEra={handleSelectEra}
        onSwitchProfile={() => setScreen('profile_select')}
      />
    );
  }

  const currentEraConfig = baseGraphics.eras[String(currentEraId)];
  const currentEraSave = currentProfile.eras[String(currentEraId)];
  const eraKnowledgeItems = knowledgeList.filter((k) => k.era_id === currentEraId);

  if (screen === 'quiz_session') {
    return (
      <QuizSessionScreen
        eraName={currentEraConfig.era_name}
        mode={quizMode}
        difficulty={quizDifficulty}
        enemyDifficulty={enemyDifficulty}
        questions={sessionQuestions}
        allEraQuestions={eraQuestionBanks[currentEraId] || []}
        difficultyConfig={difficultyConfig}
        knowledgeMap={knowledgeMap}
        economyRules={economyRules}
        invasionRules={invasionRules}
        currentGauge={currentEraSave.invasion_gauge || 0}
        onFinishSession={handleFinishQuizSession}
        onCancel={() => setScreen('era_home')}
        onChangeDifficulty={handleUpdateDifficulty}
        onChangeEnemyDifficulty={handleUpdateEnemyDifficulty}
      />
    );
  }

  return (
    <>
      <EraHomeScreen
        eraId={currentEraId}
        gender={currentProfile.gender}
        eraConfig={currentEraConfig}
        eraSave={currentEraSave}
        economyRules={economyRules}
        invasionRules={invasionRules}
        shopCatalog={shopCatalog}
        difficulty={quizDifficulty}
        enemyDifficulty={enemyDifficulty}
        onChangeDifficulty={handleUpdateDifficulty}
        onChangeEnemyDifficulty={handleUpdateEnemyDifficulty}
        onBackToEraSelect={() => setScreen('era_select')}
        onStartQuiz={handleStartQuiz}
        onOpenShop={(initialTab = 'base', initialSlotId = 'slot_1') =>
          setShopModalState({ open: true, initialTab, initialSlotId })
        }
        onOpenCodex={() => setShowCodexModal(true)}
        onStartReview={handleStartReview}
        onStartInvasion={(isBoss) => setInvasionModalState({ open: true, isBoss })}
      />

      {shopModalState.open && (
        <ShopDecorateModal
          eraId={currentEraId}
          eraConfig={currentEraConfig}
          eraSave={currentEraSave}
          economyRules={economyRules}
          shopCatalog={shopCatalog}
          initialTab={shopModalState.initialTab}
          initialSlotId={shopModalState.initialSlotId}
          onUpgradeBase={handleUpgradeBase}
          onBuyAndEquipItem={handleBuyAndEquipItem}
          onToggleEquipItem={handleToggleEquipItem}
          onSellEquipment={handleSellEquipment}
          onBuyArtifact={handleBuyArtifact}
          onPlaceArtifact={handlePlaceArtifact}
          onSellArtifact={handleSellArtifact}
          onClose={() => setShopModalState((prev) => ({ ...prev, open: false }))}
        />
      )}

      {showCodexModal && (
        <CodexModal
          eraId={currentEraId}
          eraName={currentEraConfig.era_name}
          eraSave={currentEraSave}
          eraKnowledgeItems={eraKnowledgeItems}
          invasionRules={invasionRules}
          onClose={() => setShowCodexModal(false)}
        />
      )}

      {invasionModalState.open && (
        <InvasionModal
          eraId={currentEraId}
          gender={currentProfile.gender}
          isBoss={invasionModalState.isBoss}
          eraConfig={currentEraConfig}
          eraSave={currentEraSave}
          invasionRules={invasionRules}
          shopCatalog={shopCatalog}
          enemyDifficulty={enemyDifficulty}
          onComplete={handleCompleteInvasion}
          onClose={() => setInvasionModalState({ open: false, isBoss: false })}
        />
      )}
    </>
  );
}
