import React, { useState } from 'react';
import {
  DisplayArtifactItem,
  EconomyRulesConfig,
  EquipmentItem,
  EraGraphicConfig,
  EraSaveState,
  ShopCatalogConfig,
} from '../types/game';
import { sound } from '../utils/sound';
import {
  X,
  Castle,
  Shirt,
  Sparkles,
  Coins,
  Check,
  ArrowUpCircle,
  Shield,
  Sword,
  Crown,
} from 'lucide-react';

interface ShopDecorateModalProps {
  eraId: number;
  eraConfig: EraGraphicConfig;
  eraSave: EraSaveState;
  economyRules: EconomyRulesConfig;
  shopCatalog: ShopCatalogConfig;
  initialTab?: 'base' | 'equipment' | 'artifact';
  initialSlotId?: string;
  onUpgradeBase: (cost: number) => void;
  onBuyAndEquipItem: (item: EquipmentItem) => void;
  onToggleEquipItem: (item: EquipmentItem) => void;
  onSellEquipment: (item: EquipmentItem) => void;
  onBuyArtifact: (artifact: DisplayArtifactItem, targetSlotId?: string) => void;
  onPlaceArtifact: (slotId: string, artifactId: string | null) => void;
  onSellArtifact: (artifact: DisplayArtifactItem, preferredUnplaceSlotId?: string) => void;
  onClose: () => void;
}

export const ShopDecorateModal: React.FC<ShopDecorateModalProps> = ({
  eraId,
  eraConfig,
  eraSave,
  economyRules,
  shopCatalog,
  initialTab = 'base',
  initialSlotId = 'slot_1',
  onUpgradeBase,
  onBuyAndEquipItem,
  onToggleEquipItem,
  onSellEquipment,
  onBuyArtifact,
  onPlaceArtifact,
  onSellArtifact,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'base' | 'equipment' | 'artifact'>(initialTab);
  const [selectedSlotId, setSelectedSlotId] = useState<string>(initialSlotId);

  const baseLv = eraSave.base_level || 1;
  const nextLv = Math.min(5, baseLv + 1);
  const currentBaseGraphic = eraConfig.base_levels[`level_${baseLv}`];
  const nextBaseGraphic = eraConfig.base_levels[`level_${nextLv}`];
  const upgradeCost = economyRules.base_upgrade_costs[`level_${nextLv}`] || 0;
  const sellRefundRate = economyRules.sell_refund_rate ?? 0.5;

  const eraEquipment = shopCatalog.equipment_items.filter((e) => e.era === eraId);
  const eraArtifacts = shopCatalog.display_artifacts.filter((a) => a.era === eraId);

  const availableSlots = currentBaseGraphic?.display_slots || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl border-4 border-amber-400 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-black bg-white/20 px-2.5 py-0.5 rounded-full">
              {eraConfig.era_name} 전용 상점
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-0.5">🎨 거점 꾸미기 & 장비 상점</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-amber-950/40 border border-amber-200/40 px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-yellow-300" />
              <span className="text-lg font-black">{eraSave.gold.toLocaleString()} G</span>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* 3 Tabs (Section 8.1) */}
        <div className="grid grid-cols-3 bg-amber-50 border-b-2 border-amber-200 p-2 gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('base');
            }}
            className={`py-3 px-2 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'base'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-amber-100'
            }`}
          >
            <Castle className="w-5 h-5" />
            <span>1. 거점 업그레이드</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('equipment');
            }}
            className={`py-3 px-2 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'equipment'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-amber-100'
            }`}
          >
            <Shirt className="w-5 h-5" />
            <span>2. 캐릭터 장비</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setActiveTab('artifact');
            }}
            className={`py-3 px-2 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'artifact'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>3. 유물 전시품</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: Base Upgrade (Lv.1 ~ Lv.5) */}
          {activeTab === 'base' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Current Base */}
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-center space-y-2">
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-200 text-slate-700">
                    현재 거점 (Lv.{baseLv})
                  </span>
                  <img
                    src={currentBaseGraphic?.asset_path}
                    alt={currentBaseGraphic?.name}
                    className="w-40 h-40 mx-auto object-contain"
                  />
                  <h3 className="text-lg font-black text-slate-800">{currentBaseGraphic?.name}</h3>
                  <p className="text-xs font-bold text-slate-500">
                    유물 전시 슬롯: {baseLv}개 사용 가능
                  </p>
                </div>

                {/* Next Base Preview */}
                <div className="bg-amber-50 border-3 border-amber-300 rounded-2xl p-4 text-center space-y-2">
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500 text-white">
                    {baseLv >= 5 ? '최고 레벨 달성!' : `다음 단계 미리보기 (Lv.${nextLv})`}
                  </span>
                  <img
                    src={nextBaseGraphic?.asset_path}
                    alt={nextBaseGraphic?.name}
                    className="w-40 h-40 mx-auto object-contain drop-shadow-md"
                  />
                  <h3 className="text-lg font-black text-amber-900">{nextBaseGraphic?.name}</h3>
                  <p className="text-xs font-bold text-amber-700">
                    {baseLv >= 5
                      ? '👑 시대 최종 보스전이 열렸어요!'
                      : `전시 슬롯 ${nextLv}개로 증가 & 수호력 +25 보너스!`}
                  </p>
                </div>
              </div>

              {/* Level 1~5 Stepper */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="text-xs font-black text-slate-500 mb-2">
                  단계별 거점 성장 로드맵 (Lv.5 달성 시 최종 보스전 해금!)
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lv) => {
                    const lvInfo = eraConfig.base_levels[`level_${lv}`];
                    const unlocked = baseLv >= lv;
                    return (
                      <div
                        key={lv}
                        className={`p-2 rounded-xl border-2 text-center ${
                          unlocked
                            ? 'border-amber-400 bg-amber-50 text-amber-900'
                            : 'border-slate-200 bg-white text-slate-400 opacity-70'
                        }`}
                      >
                        <div className="text-xs font-black">Lv.{lv}</div>
                        <img
                          src={lvInfo?.asset_path}
                          alt={`Lv.${lv}`}
                          className="w-12 h-12 mx-auto object-contain my-1"
                        />
                        <div className="text-[10px] font-bold truncate">{lvInfo?.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {baseLv < 5 ? (
                <button
                  type="button"
                  disabled={eraSave.gold < upgradeCost}
                  onClick={() => {
                    sound.playFanfare();
                    onUpgradeBase(upgradeCost);
                  }}
                  className={`w-full py-4 rounded-2xl font-black text-xl shadow-lg flex items-center justify-center gap-2 transition-all ${
                    eraSave.gold >= upgradeCost
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white active:scale-98'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowUpCircle className="w-6 h-6" />
                  <span>
                    거점 Lv.{nextLv} 업그레이드 ({upgradeCost.toLocaleString()} G)
                  </span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-300 text-center text-purple-900 font-black flex items-center justify-center gap-2">
                  <Crown className="w-6 h-6 text-amber-500" />
                  <span>최고 레벨(Lv.5) 거점 완성! 시대 홈에서 보스전에 도전해 보세요!</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Character Equipment (Weapons, Armor, Accessories) */}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-600">
                시대별 무기와 갑옷, 장신구를 구매해 장착하면 캐릭터 외형 옆에 표시되고 거점 방어 전투력이 올라가요! 보유한 장비는 상점에 되팔 수도 있어요.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {eraEquipment.map((item) => {
                  const isOwned = (eraSave.owned_items || []).includes(item.id);
                  const isEquipped = (eraSave.equipped_items || []).includes(item.id);
                  const canAfford = eraSave.gold >= item.cost;
                  const sellPrice = Math.floor(item.cost * sellRefundRate);

                  const categoryLabel =
                    item.category === 'weapon'
                      ? '⚔️ 무기'
                      : item.category === 'armor'
                      ? '🛡️ 방어구'
                      : '💍 장신구';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border-3 flex flex-col justify-between gap-3 ${
                        isEquipped
                          ? 'border-amber-500 bg-amber-50/70 shadow-md'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 p-2 shrink-0 flex items-center justify-center">
                          <img
                            src={item.asset}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {categoryLabel}
                            </span>
                            {isOwned && (
                              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                보유 중
                              </span>
                            )}
                            {isEquipped && (
                              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                장착 중
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-black text-slate-800 mt-1">{item.name}</h4>
                          <p className="text-xs font-bold text-slate-500 mt-0.5 break-keep">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs font-black text-blue-700">
                            {item.power_bonus > 0 && <span>공격 +{item.power_bonus}</span>}
                            {item.defense_bonus > 0 && <span>방어 +{item.defense_bonus}</span>}
                          </div>
                        </div>
                      </div>

                      {isOwned ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              onToggleEquipItem(item);
                            }}
                            className={`flex-1 py-2.5 px-3 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 ${
                              isEquipped
                                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            <span>{isEquipped ? '장착 해제' : '장착하기'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              onSellEquipment(item);
                            }}
                            className="py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-1 shrink-0 transition-colors"
                            title="장비를 상점에 되팔고 골드를 돌려받아요"
                          >
                            <Coins className="w-3.5 h-3.5 text-rose-500" />
                            <span>되팔기 (+{sellPrice}G)</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            sound.playFanfare();
                            onBuyAndEquipItem(item);
                          }}
                          className={`w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Coins className="w-4 h-4" />
                          <span>구매 및 장착 ({item.cost} G)</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Display Artifacts (for Base Slots 1~5) */}
          {activeTab === 'artifact' && (
            <div className="space-y-4">
              {/* Slot Selector Bar */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3.5">
                <div className="text-xs font-black text-amber-900 mb-2">
                  거점에 배치할 전시 슬롯을 먼저 선택하세요 (현재 거점 Lv.{baseLv} → 슬롯{' '}
                  {availableSlots.length}개 개방 · 동일한 유물도 중복 구매하여 여러 슬롯에 전시할 수 있어요!)
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((slot, idx) => {
                    const placedArtId = eraSave.placed_artifacts?.[slot.slot_id];
                    const placedArt = shopCatalog.display_artifacts.find(
                      (a) => a.id === placedArtId
                    );
                    const isSelected = selectedSlotId === slot.slot_id;
                    return (
                      <button
                        key={slot.slot_id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setSelectedSlotId(slot.slot_id);
                        }}
                        className={`px-3.5 py-2 rounded-xl border-2 text-xs font-black flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500 text-white shadow'
                            : 'border-amber-300 bg-white text-slate-700'
                        }`}
                      >
                        <span>슬롯 {idx + 1}:</span>
                        <span>{placedArt ? placedArt.name.split(' ')[0] : '비어 있음'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Artifact Catalog */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {eraArtifacts.map((art) => {
                  const ownedCount = (eraSave.owned_artifacts || []).filter(
                    (id) => id === art.id
                  ).length;
                  const placedSlots = Object.entries(eraSave.placed_artifacts || {})
                    .filter(([, aId]) => aId === art.id)
                    .map(([sId]) => sId);
                  const placedCount = placedSlots.length;
                  const spareCount = Math.max(0, ownedCount - placedCount);
                  const isPlacedInSelectedSlot =
                    eraSave.placed_artifacts?.[selectedSlotId] === art.id;
                  const canAfford = eraSave.gold >= art.cost;
                  const sellPrice = Math.floor(art.cost * sellRefundRate);
                  const selectedSlotLabel = selectedSlotId.replace('slot_', '슬롯 ');

                  return (
                    <div
                      key={art.id}
                      className={`p-4 rounded-2xl border-3 flex flex-col justify-between gap-3 ${
                        placedCount > 0
                          ? 'border-emerald-400 bg-emerald-50/50'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 p-2 shrink-0 flex items-center justify-center">
                          <img
                            src={art.asset}
                            alt={art.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            {ownedCount > 0 ? (
                              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                보유 {ownedCount}개
                              </span>
                            ) : (
                              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                미보유
                              </span>
                            )}
                            {placedCount > 0 && (
                              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                전시 중:{' '}
                                {placedSlots
                                  .map((s) => s.replace('slot_', '슬롯'))
                                  .join(', ')}
                              </span>
                            )}
                            {spareCount > 0 && (
                              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                                여유 {spareCount}개
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-black text-slate-800">{art.name}</h4>
                          <p className="text-xs font-bold text-slate-500 mt-0.5 break-keep">
                            {art.description}
                          </p>
                          <div className="text-xs font-black text-emerald-700 mt-1">
                            수호 보너스 +{art.power_bonus + art.defense_bonus} (개당)
                          </div>
                        </div>
                      </div>

                      {ownedCount > 0 ? (
                        <div className="space-y-2">
                          {/* Primary Slot Placement / Unplacement Action */}
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              if (isPlacedInSelectedSlot) {
                                onPlaceArtifact(selectedSlotId, null);
                              } else {
                                onPlaceArtifact(selectedSlotId, art.id);
                              }
                            }}
                            className={`w-full py-2.5 rounded-xl font-black text-sm transition-colors ${
                              isPlacedInSelectedSlot
                                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                                : spareCount > 0
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow'
                                : 'bg-sky-500 hover:bg-sky-600 text-white'
                            }`}
                          >
                            {isPlacedInSelectedSlot
                              ? `${selectedSlotLabel} 전시 해제`
                              : spareCount > 0
                              ? `${selectedSlotLabel}에 전시하기`
                              : `${selectedSlotLabel}(으)로 위치 이동`}
                          </button>

                          {/* Secondary Row: Buy Additional Copy & Sell Copy */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={!canAfford}
                              onClick={() => {
                                sound.playFanfare();
                                onBuyArtifact(art, selectedSlotId);
                              }}
                              className={`flex-1 py-2 px-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors ${
                                canAfford
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                              title="동일한 유물을 추가로 구매해 다른 슬롯에도 배치할 수 있어요"
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>추가 구매 ({art.cost}G)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                onSellArtifact(art, selectedSlotId);
                              }}
                              className="py-2 px-3 rounded-xl font-black text-xs sm:text-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center gap-1 shrink-0 transition-colors"
                              title="보유한 유물 1개를 상점에 되팔고 골드를 돌려받아요"
                            >
                              <Coins className="w-3.5 h-3.5 text-rose-500" />
                              <span>되팔기 (+{sellPrice}G)</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!canAfford}
                          onClick={() => {
                            sound.playFanfare();
                            onBuyArtifact(art, selectedSlotId);
                          }}
                          className={`w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Coins className="w-4 h-4" />
                          <span>유물 구매하기 ({art.cost} G)</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
