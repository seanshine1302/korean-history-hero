export interface EnemyDifficultyTier {
  level: number;
  name: string;
  badge: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  activeColor: string;
  powerMultiplier: number;
  rewardMultiplier: number;
  desc: string;
  detail: string;
}

export const ENEMY_DIFFICULTY_TIERS: EnemyDifficultyTier[] = [
  {
    level: 0,
    name: '기본 기준 (최저)',
    badge: '0단계 (기준)',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-300',
    badgeText: 'text-emerald-700',
    activeColor: 'bg-emerald-500 text-white',
    powerMultiplier: 1.0,
    rewardMultiplier: 1.0,
    desc: '현재 기본 기준 난이도예요! 어린 대원도 편안하게 승리할 수 있어요.',
    detail: '적군 전투력 100% (기본값) · 추가 보너스 없음',
  },
  {
    level: 1,
    name: '약간 긴장',
    badge: '1단계',
    badgeBg: 'bg-emerald-100',
    badgeBorder: 'border-emerald-400',
    badgeText: 'text-emerald-800',
    activeColor: 'bg-emerald-600 text-white',
    powerMultiplier: 1.15,
    rewardMultiplier: 1.1,
    desc: '적군이 조금 더 단단해졌어요. 가벼운 긴장감과 함께 출발!',
    detail: '적군 전투력 +15% · 승리 보상 골드/경험치 +10%',
  },
  {
    level: 2,
    name: '방심 금물',
    badge: '2단계',
    badgeBg: 'bg-teal-100',
    badgeBorder: 'border-teal-400',
    badgeText: 'text-teal-800',
    activeColor: 'bg-teal-600 text-white',
    powerMultiplier: 1.3,
    rewardMultiplier: 1.2,
    desc: '적들이 조직적으로 움직이기 시작해요.',
    detail: '적군 전투력 +30% · 승리 보상 골드/경험치 +20%',
  },
  {
    level: 3,
    name: '정예 부대',
    badge: '3단계',
    badgeBg: 'bg-sky-100',
    badgeBorder: 'border-sky-400',
    badgeText: 'text-sky-800',
    activeColor: 'bg-sky-600 text-white',
    powerMultiplier: 1.45,
    rewardMultiplier: 1.3,
    desc: '훈련받은 적군 정예 대원들이 침략을 준비해요.',
    detail: '적군 전투력 +45% · 승리 보상 골드/경험치 +30%',
  },
  {
    level: 4,
    name: '강력한 적',
    badge: '4단계',
    badgeBg: 'bg-blue-100',
    badgeBorder: 'border-blue-400',
    badgeText: 'text-blue-800',
    activeColor: 'bg-blue-600 text-white',
    powerMultiplier: 1.6,
    rewardMultiplier: 1.4,
    desc: '무기와 방어구를 잘 갖추지 않으면 버티기 어려워요.',
    detail: '적군 전투력 +60% · 승리 보상 골드/경험치 +40%',
  },
  {
    level: 5,
    name: '맹렬한 공세',
    badge: '5단계',
    badgeBg: 'bg-amber-100',
    badgeBorder: 'border-amber-400',
    badgeText: 'text-amber-800',
    activeColor: 'bg-amber-600 text-white',
    powerMultiplier: 1.8,
    rewardMultiplier: 1.5,
    desc: '적군의 기세가 거세져 거점이 큰 위협을 받아요!',
    detail: '적군 전투력 +80% · 승리 보상 골드/경험치 +50%',
  },
  {
    level: 6,
    name: '숙련된 용사',
    badge: '6단계',
    badgeBg: 'bg-orange-100',
    badgeBorder: 'border-orange-400',
    badgeText: 'text-orange-800',
    activeColor: 'bg-orange-600 text-white',
    powerMultiplier: 2.0,
    rewardMultiplier: 1.65,
    desc: '전투력이 기준 대비 2배로 상승한 강력한 적이에요!',
    detail: '적군 전투력 +100% (2배) · 승리 보상 골드/경험치 +65%',
  },
  {
    level: 7,
    name: '역전의 군단',
    badge: '7단계',
    badgeBg: 'bg-rose-100',
    badgeBorder: 'border-rose-400',
    badgeText: 'text-rose-800',
    activeColor: 'bg-rose-600 text-white',
    powerMultiplier: 2.25,
    rewardMultiplier: 1.8,
    desc: '수많은 전장을 거친 베테랑 군단이 맞섭니다.',
    detail: '적군 전투력 +125% · 승리 보상 골드/경험치 +80%',
  },
  {
    level: 8,
    name: '역사 속 영웅전',
    badge: '8단계',
    badgeBg: 'bg-red-100',
    badgeBorder: 'border-red-400',
    badgeText: 'text-red-800',
    activeColor: 'bg-red-600 text-white',
    powerMultiplier: 2.5,
    rewardMultiplier: 2.0,
    desc: '최고급 장비와 높은 기지 레벨이 필수적인 난관이에요!',
    detail: '적군 전투력 +150% (2.5배) · 승리 보상 골드/경험치 +100%',
  },
  {
    level: 9,
    name: '전설의 대군',
    badge: '9단계',
    badgeBg: 'bg-purple-100',
    badgeBorder: 'border-purple-400',
    badgeText: 'text-purple-800',
    activeColor: 'bg-purple-600 text-white',
    powerMultiplier: 2.8,
    rewardMultiplier: 2.25,
    desc: '시공간의 균열을 넘어온 압도적인 대군세예요!',
    detail: '적군 전투력 +180% (2.8배) · 승리 보상 골드/경험치 +125%',
  },
  {
    level: 10,
    name: '신화적 최강전',
    badge: '10단계 (최고)',
    badgeBg: 'bg-fuchsia-100',
    badgeBorder: 'border-fuchsia-400',
    badgeText: 'text-fuchsia-900',
    activeColor: 'bg-fuchsia-700 text-white',
    powerMultiplier: 3.2,
    rewardMultiplier: 2.5,
    desc: '궁극의 역사 수호자만이 도달할 수 있는 한계 돌파 모드!',
    detail: '적군 전투력 +220% (3.2배) · 승리 보상 골드/경험치 +150%',
  },
];

export function getEnemyDifficultyTier(level: number): EnemyDifficultyTier {
  const safeLevel = Math.max(0, Math.min(10, Math.round(level || 0)));
  return ENEMY_DIFFICULTY_TIERS[safeLevel] || ENEMY_DIFFICULTY_TIERS[0];
}
