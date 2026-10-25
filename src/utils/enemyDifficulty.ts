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
    powerMultiplier: 1.5,
    rewardMultiplier: 1.25,
    desc: '적군이 단단해지고 공격력이 1.5배로 상승했어요!',
    detail: '적군 전투력 +50% (1.5배) · 승리 보상 +25%',
  },
  {
    level: 2,
    name: '방심 금물',
    badge: '2단계',
    badgeBg: 'bg-teal-100',
    badgeBorder: 'border-teal-400',
    badgeText: 'text-teal-800',
    activeColor: 'bg-teal-600 text-white',
    powerMultiplier: 2.0,
    rewardMultiplier: 1.5,
    desc: '적들의 전투력이 기준의 2배에 달해 무기를 정비해야 해요.',
    detail: '적군 전투력 +100% (2배) · 승리 보상 +50%',
  },
  {
    level: 3,
    name: '정예 부대',
    badge: '3단계',
    badgeBg: 'bg-sky-100',
    badgeBorder: 'border-sky-400',
    badgeText: 'text-sky-800',
    activeColor: 'bg-sky-600 text-white',
    powerMultiplier: 2.5,
    rewardMultiplier: 1.8,
    desc: '훈련받은 적군 정예 대원들이 2.5배의 위력으로 몰려와요.',
    detail: '적군 전투력 +150% (2.5배) · 승리 보상 +80%',
  },
  {
    level: 4,
    name: '강력한 적',
    badge: '4단계',
    badgeBg: 'bg-blue-100',
    badgeBorder: 'border-blue-400',
    badgeText: 'text-blue-800',
    activeColor: 'bg-blue-600 text-white',
    powerMultiplier: 3.0,
    rewardMultiplier: 2.2,
    desc: '기준 대비 3배 강력해진 적군! 거점 레벨과 장비 강화 필수!',
    detail: '적군 전투력 +200% (3배) · 승리 보상 +120%',
  },
  {
    level: 5,
    name: '맹렬한 공세',
    badge: '5단계',
    badgeBg: 'bg-amber-100',
    badgeBorder: 'border-amber-400',
    badgeText: 'text-amber-800',
    activeColor: 'bg-amber-600 text-white',
    powerMultiplier: 3.5,
    rewardMultiplier: 2.6,
    desc: '거점 방어벽을 단숨에 흔드는 3.5배 위력의 공세! 전술 퀴즈로 극복해요!',
    detail: '적군 전투력 +250% (3.5배) · 승리 보상 +160%',
  },
  {
    level: 6,
    name: '숙련된 용사',
    badge: '6단계',
    badgeBg: 'bg-orange-100',
    badgeBorder: 'border-orange-400',
    badgeText: 'text-orange-800',
    activeColor: 'bg-orange-600 text-white',
    powerMultiplier: 4.1,
    rewardMultiplier: 3.1,
    desc: '전투력이 기준 대비 4.1배로 상승한 베테랑 군단입니다!',
    detail: '적군 전투력 +310% (4.1배) · 승리 보상 +210%',
  },
  {
    level: 7,
    name: '역전의 군단',
    badge: '7단계',
    badgeBg: 'bg-rose-100',
    badgeBorder: 'border-rose-400',
    badgeText: 'text-rose-800',
    activeColor: 'bg-rose-600 text-white',
    powerMultiplier: 4.8,
    rewardMultiplier: 3.7,
    desc: '수많은 전장을 거친 베테랑 군단이 4.8배 파워로 압박해요!',
    detail: '적군 전투력 +380% (4.8배) · 승리 보상 +270%',
  },
  {
    level: 8,
    name: '역사 속 영웅전',
    badge: '8단계',
    badgeBg: 'bg-red-100',
    badgeBorder: 'border-red-400',
    badgeText: 'text-red-800',
    activeColor: 'bg-red-600 text-white',
    powerMultiplier: 5.6,
    rewardMultiplier: 4.4,
    desc: '최상급 장비와 전술 퀴즈 풀이가 필수적인 5.6배 대혈투!',
    detail: '적군 전투력 +460% (5.6배) · 승리 보상 +340%',
  },
  {
    level: 9,
    name: '전설의 대군',
    badge: '9단계',
    badgeBg: 'bg-purple-100',
    badgeBorder: 'border-purple-400',
    badgeText: 'text-purple-800',
    activeColor: 'bg-purple-600 text-white',
    powerMultiplier: 6.6,
    rewardMultiplier: 5.2,
    desc: '시공간 균열을 가득 메운 6.6배 파워의 전설적인 대군세!',
    detail: '적군 전투력 +560% (6.6배) · 승리 보상 +420%',
  },
  {
    level: 10,
    name: '신화적 최강전',
    badge: '10단계 (최고)',
    badgeBg: 'bg-fuchsia-100',
    badgeBorder: 'border-fuchsia-400',
    badgeText: 'text-fuchsia-900',
    activeColor: 'bg-fuchsia-700 text-white',
    powerMultiplier: 7.8,
    rewardMultiplier: 6.0,
    desc: '기준 대비 약 8배(7.8배)에 달하는 신화적 난이도! 전술 퀴즈 만점 도전!',
    detail: '적군 전투력 +680% (7.8배) · 승리 보상 +500% (6배 대박)',
  },
];

export function getEnemyDifficultyTier(level: number): EnemyDifficultyTier {
  const safeLevel = Math.max(0, Math.min(10, Math.round(level || 0)));
  return ENEMY_DIFFICULTY_TIERS[safeLevel] || ENEMY_DIFFICULTY_TIERS[0];
}
