import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const ERA_NAMES = {
  1: '선사 시대',
  2: '고조선과 여러 나라',
  3: '삼국과 가야',
  4: '남북국 시대',
  5: '고려',
  6: '조선',
  7: '개항기와 대한제국',
  8: '일제강점기와 독립운동'
};

const ERA_PREFIX = {
  1: 'PRE',
  2: 'GOJ',
  3: 'TRK',
  4: 'NSK',
  5: 'GOR',
  6: 'JOS',
  7: 'EMP',
  8: 'IND'
};

// Clean up any custom PUA glyphs from PDF font encoding
function cleanPdfText(str) {
  if (!str) return '';
  return str
    .replace(/[\u0500-\u0FFF\uE000-\uF8FF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Classify a PDF file into Era 1~8 based on its filename and content
function classifyPdfToEra(file, title, text) {
  const numMatch = file.match(/eh_([nr])(\d+)_/);
  if (!numMatch) return 1;
  const type = numMatch[1];
  const code = parseInt(numMatch[2], 10);

  if (type === 'n') {
    if (code === 10) return 2; // 단군왕검, 고조선
    if (code >= 20 && code <= 130) return 3; // 박혁거세~김유신
    if (code >= 150 && code <= 210) return 4; // 김춘추/문무왕/원효/대조영/장보고/최치원
    if (code >= 220 && code <= 365) return 5; // 왕건~문익점/최무선
    if (code >= 370 && code <= 622) return 6; // 이성계~김정호/김정희
    if (code >= 623 && code <= 685) return 7; // 박규수/흥선대원군/동학/서재필/이준
    if (code >= 690) return 8; // 독립운동가들
  } else {
    // eh_r series
    if ([10, 11, 12, 20, 30, 35, 40].includes(code)) return 1; // 구석기/신석기/청동기/고인돌/암사동/전곡리/반구대
    if ([5, 45].includes(code)) return 2; // 고조선, 마한/삼한
    if (code >= 50 && code <= 65) return 3; // 고구려, 가야
    if ([80, 81, 82, 91, 92, 100, 110, 111, 112, 115, 116].includes(code)) return 3; // 삼국 문화유산
    if ([70, 90, 113, 114, 117, 120, 121].includes(code)) return 4; // 불국사/석굴암, 동궁과월지, 문무대왕릉, 성덕대왕신종, 발해, 청해진
    if (code === 118 || (code >= 122 && code <= 182)) return 5; // 고려 통일, 만월대, 고려청자, 팔만대장경, 직지 등
    if (code >= 183 && code <= 314) return 6; // 조선 문화유산과 사건
    if ([315, 317, 330, 331, 332, 352, 353, 360, 361, 362, 371, 377].includes(code)) return 7; // 개항기, 대한제국, 동학, 강화도, 정동 등
    if (code >= 320) return 8; // 3.1운동, 임시정부, 독립운동 등
  }
  return 6;
}

// Curated Core Master Knowledge Entities across all 8 Eras (2nd-grade friendly, curriculum-aligned, with sibling question hooks)
export const CURATED_KNOWLEDGE_ITEMS = [
  // ==================== ERA 1: 선사 시대 ====================
  {
    knowledge_id: 'K-PRE-001',
    era: '선사 시대',
    era_id: 1,
    category: 'artifact',
    title: '주먹도끼',
    summary: '구석기 시대 사람들이 돌을 깨뜨려서 사냥하거나 가죽을 벗길 때 사용한 만능 도구예요. 경기도 연천 전곡리 유적에서 많이 발견되었어요.',
    evidence_type: 'historical_fact',
    keywords: ['구석기', '주먹도끼', '뗀석기', '연천 전곡리', '사냥 도구'],
    source_pdf: 'eh_r0030_0010.pdf',
    visual_asset: '/assets/artifacts/art_pre_handaxe.jpg',
    quiz_facts: {
      purpose: '동물을 사냥하거나 가죽을 벗기고 나무를 다듬을 때 사용한 구석기 만능 돌 도구',
      period_clue: '돌을 깨뜨려 만든 뗀석기를 사용하던 구석기 시대 대표 유물'
    }
  },
  {
    knowledge_id: 'K-PRE-002',
    era: '선사 시대',
    era_id: 1,
    category: 'culture',
    title: '구석기 시대의 동굴과 막집 생활',
    summary: '구석기 시대 사람들은 열매를 따거나 사냥을 하며 먹을거리를 찾아 자주 이동했어요. 그래서 자연 동굴이나 나뭇가지로 대충 지은 막집에서 살았답니다.',
    evidence_type: 'historical_fact',
    keywords: ['구석기', '동굴', '막집', '이동 생활', '채집과 사냥'],
    source_pdf: 'eh_r0035_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '사냥감과 열매를 찾아 여러 곳으로 옮겨 다니며 살기에 알맞은 집',
      period_clue: '농사를 짓지 않고 자연 동굴이나 바위 그늘에서 불을 피워 추위를 피하던 시대'
    }
  },
  {
    knowledge_id: 'K-PRE-003',
    era: '선사 시대',
    era_id: 1,
    category: 'artifact',
    title: '빗살무늬 토기',
    summary: '신석기 시대 사람들이 곡식을 저장하거나 음식을 조리할 때 사용한 끝이 뾰족한 토기예요. 겉면에 빗살 같은 줄무늬가 새겨져 있어요.',
    evidence_type: 'historical_fact',
    keywords: ['신석기', '빗살무늬 토기', '서울 암사동', '곡식 저장', '뾰족한 바닥'],
    source_pdf: 'eh_r0020_0010.pdf',
    visual_asset: '/assets/artifacts/art_pre_comb_pottery.jpg',
    quiz_facts: {
      purpose: '강가나 바닷가 모래바닥에 꽂아 두고 도토리나 곡식을 보관하고 끓여 먹던 그릇',
      period_clue: '신석기 시대에 흙을 빚어 불에 구워 만든 가장 대표적인 토기'
    }
  },
  {
    knowledge_id: 'K-PRE-004',
    era: '선사 시대',
    era_id: 1,
    category: 'culture',
    title: '신석기 시대의 움집과 정착 생활',
    summary: '신석기 시대에 농사가 시작되면서 사람들은 한곳에 머물러 살기 시작했어요. 땅을 둥글게 파고 지붕을 덮은 움집에 모여 마을을 이루었답니다.',
    evidence_type: 'historical_fact',
    keywords: ['신석기', '움집', '정착 생활', '농사의 시작', '암사동 유적'],
    source_pdf: 'eh_r0020_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '바람과 추위를 막기 위해 땅을 파고 가운데 화덕을 만들어 따뜻하게 지낸 집',
      period_clue: '농사를 처음 시작하면서 이동하지 않고 강가에 마을을 이루어 살던 신석기 시대 집'
    }
  },
  {
    knowledge_id: 'K-PRE-005',
    era: '선사 시대',
    era_id: 1,
    category: 'artifact',
    title: '가락바퀴와 뼈바늘',
    summary: '신석기 시대 사람들이 실을 뽑을 때 사용한 가락바퀴와 옷을 꿰맬 때 쓴 동물의 뼈로 만든 뼈바늘이에요. 이 도구들로 옷과 그물을 만들었어요.',
    evidence_type: 'historical_fact',
    keywords: ['신석기', '가락바퀴', '뼈바늘', '옷 만들기', '실 뽑기'],
    source_pdf: 'eh_r0020_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '가운데 구멍에 막대를 꽂아 돌려서 실을 뽑고, 그 실로 옷이나 그물을 꿰매던 도구',
      period_clue: '신석기 시대 사람들이 직접 실을 뽑아 옷을 지어 입었음을 알려주는 유물'
    }
  },
  {
    knowledge_id: 'K-PRE-006',
    era: '선사 시대',
    era_id: 1,
    category: 'artifact',
    title: '간석기와 돌보습·돌괭이',
    summary: '신석기 시대에는 돌을 매끄럽게 갈아서 만든 간석기를 사용했어요. 돌괭이와 돌보습으로 땅을 일구어 조, 피, 수수 같은 곡식을 길렀답니다.',
    evidence_type: 'historical_fact',
    keywords: ['신석기', '간석기', '돌보습', '돌괭이', '농사 도구'],
    source_pdf: 'eh_r0020_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '단단한 돌을 숫돌에 매끄럽게 갈아서 밭을 갈거나 곡식을 심을 때 쓴 농사 도구',
      period_clue: '구석기의 뗀석기보다 훨씬 정교하게 돌을 갈아 만들던 신석기 시대 도구'
    }
  },
  {
    knowledge_id: 'K-PRE-007',
    era: '선사 시대',
    era_id: 1,
    category: 'artifact',
    title: '울산 반구대 암각화',
    summary: '선사 시대 사람들이 큰 바위에 고래와 호랑이, 사슴, 사냥하는 사람들의 모습을 정성껏 새겨 넣은 바위그림이에요. 사냥이 잘되기를 바라는 마음이 담겨 있어요.',
    evidence_type: 'historical_fact',
    keywords: ['반구대 암각화', '바위그림', '고래 사냥', '울산', '풍요 기원'],
    source_pdf: 'eh_r0040_0010.pdf',
    visual_asset: '/assets/artifacts/art_pre_bangudae.jpg',
    quiz_facts: {
      purpose: '바다에서 고래와 물고기를 많이 잡고 마을 사람들이 안전하기를 바라며 바위에 새긴 그림',
      period_clue: '울산의 절벽 바위에 고래와 배를 탄 사람, 육지 동물들이 생생하게 새겨진 선사 시대 문화유산'
    }
  },
  {
    knowledge_id: 'K-PRE-008',
    era: '선사 시대',
    era_id: 1,
    category: 'artifact',
    title: '반달 돌칼',
    summary: '청동기 시대 사람들이 벼의 이삭을 따서 수확할 때 사용한 반달 모양의 돌칼이에요. 구멍에 끈을 끼워 손에 쥐고 곡식을 거두었답니다.',
    evidence_type: 'historical_fact',
    keywords: ['청동기', '반달 돌칼', '벼농사', '추수 도구', '간석기'],
    source_pdf: 'eh_r0012_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '청동기 시대에 농사를 지은 뒤 익은 벼나 곡식의 이삭을 자를 때 사용한 도구',
      period_clue: '생김새가 밤하늘의 반달을 닮았고 두 개의 작은 구멍에 끈을 꿰어 손가락에 끼워 쓰던 돌칼'
    }
  },
  {
    knowledge_id: 'K-PRE-009',
    era: '선사 시대',
    era_id: 1,
    category: 'artifact',
    title: '고인돌',
    summary: '청동기 시대의 힘센 족장이나 마을 사람들을 묻었던 커다란 돌무덤이에요. 우리나라 강화, 고창, 화순의 고인돌은 유네스코 세계유산으로 지정되었어요.',
    evidence_type: 'historical_fact',
    keywords: ['청동기', '고인돌', '돌무덤', '족장', '세계유산'],
    source_pdf: 'eh_r0010_0010.pdf',
    visual_asset: '/assets/artifacts/art_pre_dolmen.jpg',
    quiz_facts: {
      purpose: '많은 사람들의 힘을 모아 거대한 덮개돌을 옮겨 만든 청동기 시대의 돌무덤이자 제단',
      period_clue: '탁자 모양이나 바둑판 모양의 큰 바위로 만들어졌으며 우리나라에 세계에서 가장 많이 남아 있는 유적'
    }
  },
  {
    knowledge_id: 'K-PRE-010',
    era: '선사 시대',
    era_id: 1,
    category: 'artifact',
    title: '비파형 동검과 청동 방울',
    summary: '청동기 시대에 구리와 주석을 섞어 만든 귀한 청동 무기와 제사 도구예요. 청동은 구하기 어려워 마을을 다스리는 군장(족장)만 가질 수 있었어요.',
    evidence_type: 'historical_fact',
    keywords: ['청동기', '비파형 동검', '청동 거울', '청동 방울', '군장'],
    source_pdf: 'eh_r0011_0010.pdf',
    visual_asset: '/assets/artifacts/art_pre_lute_dagger.jpg',
    quiz_facts: {
      purpose: '마을의 우두머리인 군장이 하늘에 제사를 지내거나 자신의 높은 힘을 보여줄 때 사용한 청동 도구',
      period_clue: '날 부분이 볼록하게 휘어져 악기 비파를 닮은 청동기 시대의 대표적인 칼'
    }
  },
  {
    knowledge_id: 'K-PRE-011',
    era: '선사 시대',
    era_id: 1,
    category: 'culture',
    title: '부여 송국리 청동기 마을 유적',
    summary: '청동기 시대 사람들은 강이 내려다보이는 언덕에 모여 살며 벼농사를 지었어요. 마을 주변에는 적을 막기 위해 나무 울타리(목책)를 세웠답니다.',
    evidence_type: 'historical_fact',
    keywords: ['청동기', '부여 송국리', '목책', '벼농사', '마을 유적'],
    source_pdf: 'eh_r0012_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '다른 부족의 침입으로부터 마을과 곡식을 안전하게 지키기 위해 세운 나무 담장(목책)과 도랑',
      period_clue: '네모난 집터와 반달 돌칼, 탄화된 쌀알이 발견된 충청남도 부여의 대표적인 청동기 시대 마을 유적'
    }
  },
  {
    knowledge_id: 'K-PRE-012',
    era: '선사 시대',
    era_id: 1,
    category: 'artifact',
    title: '민무늬 토기',
    summary: '청동기 시대 사람들이 사용한 겉면에 아무런 무늬가 없고 바닥이 평평한 토기예요. 신석기 시대의 빗살무늬 토기보다 더 단단하고 쓰기 편리했어요.',
    evidence_type: 'historical_fact',
    keywords: ['청동기', '민무늬 토기', '평평한 바닥', '곡식 보관'],
    source_pdf: 'eh_r0012_0010.pdf',
    visual_asset: '/assets/artifacts/art_pre_plain_pottery.jpg',
    quiz_facts: {
      purpose: '집 안의 평평한 바닥에 세워 두고 수확한 쌀과 곡식을 담거나 밥을 짓던 그릇',
      period_clue: '겉에 무늬를 넣지 않고 깔끔하게 빚어 높은 온도에서 단단하게 구워낸 청동기 시대 토기'
    }
  },

  // ==================== ERA 2: 고조선과 여러 나라 ====================
  {
    knowledge_id: 'K-GOJ-001',
    era: '고조선과 여러 나라',
    era_id: 2,
    category: 'person',
    title: '단군왕검과 고조선 건국',
    summary: '우리 역사 속 최초의 국가인 고조선을 세운 분이에요. 건국 신화에 따르면 하늘의 환웅과 웅녀 사이에서 태어나 아사달에 도읍을 정하고 나라를 다스렸어요.',
    evidence_type: 'myth',
    keywords: ['단군왕검', '고조선', '아사달', '개천절', '최초의 국가'],
    source_pdf: 'eh_n0010_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '하늘에 제사를 지내는 제사장(단군)과 나라를 다스리는 왕(왕검)의 뜻을 함께 담은 고조선의 건국자',
      period_clue: '기원전 2333년에 세워진 우리 민족 최초의 나라 고조선을 기념하여 오늘날 10월 3일 개천절로 축하하는 이야기'
    }
  },
  {
    knowledge_id: 'K-GOJ-002',
    era: '고조선과 여러 나라',
    era_id: 2,
    category: 'culture',
    title: '홍익인간 정신',
    summary: '건국 신화에 따르면 고조선은 "널리 인간 세상을 이롭게 한다"는 홍익인간의 뜻으로 세워졌어요. 사람들을 사랑하고 서로 돕는 따뜻한 마음이 담겨 있답니다.',
    evidence_type: 'myth',
    keywords: ['홍익인간', '널리 인간을 이롭게', '고조선 건국 이념', '환웅'],
    source_pdf: 'eh_n0010_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '사람들을 널리 이롭게 하고 평화롭게 살게 하겠다는 고조선의 건국 정신',
      period_clue: '환웅이 바람·구름·비를 다스리는 신하들을 데리고 태백산 신단수 아래로 내려올 때 품었던 뜻'
    }
  },
  {
    knowledge_id: 'K-GOJ-003',
    era: '고조선과 여러 나라',
    era_id: 2,
    category: 'event',
    title: '단군 신화 속 곰과 호랑이 이야기',
    summary: '건국 신화에 따르면 사람이 되고 싶어 하던 곰과 호랑이가 환웅이 준 쑥과 마늘을 먹었어요. 끈기 있게 견딘 곰이 여인(웅녀)으로 변해 단군왕검을 낳았답니다.',
    evidence_type: 'myth',
    keywords: ['단군 신화', '웅녀', '쑥과 마늘', '삼국유사', '곰 부족'],
    source_pdf: 'eh_n0010_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '하늘을 숭배하던 환웅 부족과 곰을 숭배하던 부족이 힘을 합쳐 고조선을 세웠음을 알려주는 이야기',
      period_clue: '고려 시대 일연 스님이 쓴 『삼국유사』에 기록되어 전해지는 고조선의 건국 신화'
    }
  },
  {
    knowledge_id: 'K-GOJ-004',
    era: '고조선과 여러 나라',
    era_id: 2,
    category: 'system',
    title: '고조선의 8조법',
    summary: '고조선 사회의 질서를 지키기 위해 만든 8가지 법이에요. 사람의 목숨과 노동력, 개인의 재산을 소중히 여겼다는 것을 알 수 있어요.',
    evidence_type: 'historical_fact',
    keywords: ['8조법', '고조선 법', '생명 존중', '재산 보호'],
    source_pdf: 'eh_r0005_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '백성들이 서로 해치지 않고 약속을 지키며 평화롭게 살도록 만든 고조선의 8가지 규칙',
      period_clue: '"사람을 죽인 자는 즉시 죽이고, 남에게 상처를 입힌 자는 곡식으로 갚는다"는 내용이 전해지는 법'
    }
  },
  {
    knowledge_id: 'K-GOJ-005',
    era: '고조선과 여러 나라',
    era_id: 2,
    category: 'artifact',
    title: '마니산 참성단',
    summary: '전해지는 이야기에 따르면 단군왕검이 하늘에 제사를 지내기 위해 인천 강화도 마니산 꼭대기에 돌을 쌓아 만든 제단이에요. 지금도 개천절마다 행사가 열려요.',
    evidence_type: 'tradition',
    keywords: ['마니산 참성단', '강화도', '하늘 제사', '단군왕검'],
    source_pdf: 'eh_n0010_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '높은 산 위에서 하늘은 둥글고 땅은 네모나다는 생각으로 돌을 쌓아 하늘에 제사를 지내던 곳',
      period_clue: '인천 강화도 마니산에 남아 있으며 단군왕검이 하늘에 감사의 제사를 올렸다고 전해지는 제단'
    }
  },
  {
    knowledge_id: 'K-GOJ-006',
    era: '고조선과 여러 나라',
    era_id: 2,
    category: 'system',
    title: '부여의 사출도와 영고',
    summary: '부여는 만주 넓은 평야에서 발전한 나라로, 왕 아래에 마가·우가·저가·구가라는 관리들이 사출도를 다스렸어요. 12월에는 하늘에 제사 지내는 영고 축제를 열었어요.',
    evidence_type: 'historical_fact',
    keywords: ['부여', '사출도', '마가·우가·저가·구가', '영고', '제천행사'],
    source_pdf: 'eh_r0005_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '말·소·돼지·개 등 가축의 이름을 딴 관리들이 나라의 네 구역을 나누어 다스리던 부여의 제도',
      period_clue: '사냥이 끝나는 12월에 북을 치며 하늘에 제사를 지내고 죄수를 풀어주던 부여의 제천행사 영고'
    }
  },
  {
    knowledge_id: 'K-GOJ-007',
    era: '고조선과 여러 나라',
    era_id: 2,
    category: 'culture',
    title: '초기 고구려의 동맹과 서옥제',
    summary: '초기 고구려 사람들은 활쏘기와 말타기를 아주 잘했어요. 해마다 10월에는 하늘에 제사를 지내는 동맹이라는 큰 축제를 열어 온 나라가 함께 즐겼답니다.',
    evidence_type: 'historical_fact',
    keywords: ['고구려', '동맹', '서옥제', '제천행사', '활쏘기'],
    source_pdf: 'eh_n0030_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '추수를 마친 10월에 온 백성이 모여 하늘과 조상에게 감사하며 하나로 뭉치던 고구려의 큰 축제',
      period_clue: '산과 계곡이 많은 지역에서 뛰어난 무예와 활쏘기 실력을 키웠던 초기 고구려의 문화'
    }
  },
  {
    knowledge_id: 'K-GOJ-008',
    era: '고조선과 여러 나라',
    era_id: 2,
    category: 'culture',
    title: '옥저와 동예의 생활 풍습',
    summary: '동해 바닷가에 자리 잡은 옥저와 동예는 해산물과 농산물이 풍부했어요. 동예는 다른 부족의 땅을 침범하지 않는 책화라는 규칙과 10월 무천 축제가 있었어요.',
    evidence_type: 'historical_fact',
    keywords: ['옥저', '동예', '무천', '책화', '가족 공동 무덤'],
    source_pdf: 'eh_r0005_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '부족마다 사냥하고 농사짓는 땅의 경계를 소중히 지켜 침범하면 소나 말로 물어주게 한 동예의 약속(책화)',
      period_clue: '왕이 없이 읍군·삼로라는 군장이 다스렸으며 동해안의 풍부한 소금과 어물을 거두던 나라들'
    }
  },
  {
    knowledge_id: 'K-GOJ-009',
    era: '고조선과 여러 나라',
    era_id: 2,
    category: 'culture',
    title: '삼한(마한·진한·변한)과 소도',
    summary: '한반도 남쪽에는 마한, 진한, 변한의 삼한이 있었어요. 삼한에는 천군이라는 제사장이 다스리는 신성한 지역인 소도가 있어서 죄인이 숨어도 잡아갈 수 없었어요.',
    evidence_type: 'historical_fact',
    keywords: ['삼한', '마한·진한·변한', '소도', '천군', '솟대', '벼농사'],
    source_pdf: 'eh_r0045_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '큰 나무(솟대)에 방울과 북을 매달아 하늘의 신을 모시던 삼한의 신성한 평화 구역(소도)',
      period_clue: '따뜻한 남쪽 평야에서 저수지를 만들어 벼농사를 짓고, 5월과 10월에 두 번 하늘에 제사를 지내던 나라들'
    }
  },
  {
    knowledge_id: 'K-GOJ-010',
    era: '고조선과 여러 나라',
    era_id: 2,
    category: 'artifact',
    title: '세형 동검과 잔무늬 거울(다뉴세문경)',
    summary: '고조선 후기와 여러 나라 시대에 한반도에서 독자적으로 발전한 날렵한 청동 검과 아주 고운 선 무늬가 새겨진 청동 거울이에요. 뛰어난 금속 기술을 보여줘요.',
    evidence_type: 'historical_fact',
    keywords: ['세형 동검', '잔무늬 거울', '다뉴세문경', '청동기 문화', '고조선'],
    source_pdf: 'eh_r0011_0010.pdf',
    visual_asset: '/assets/artifacts/art_goj_slender_dagger.jpg',
    quiz_facts: {
      purpose: '비파형 동검보다 허리가 가늘고 뾰족하게 만들어져 한반도의 독자적인 청동기 문화를 보여주는 칼',
      period_clue: '눈으로 보기 힘들 만큼 가늘고 정교한 수천 개의 선을 새겨 햇빛을 반사하던 청동 거울'
    }
  },

  // ==================== ERA 3: 삼국과 가야 ====================
  {
    knowledge_id: 'K-TRK-001',
    era: '삼국과 가야',
    era_id: 3,
    category: 'person',
    title: '주몽(동명성왕)과 고구려 건국',
    summary: '건국 신화에 따르면 알에서 태어나 활을 백발백중으로 잘 쏘던 주몽이 졸본 지역에 고구려를 세웠어요. 고구려는 씩씩한 기상으로 큰 영토를 넓혔답니다.',
    evidence_type: 'myth',
    keywords: ['주몽', '동명성왕', '고구려 건국', '졸본', '활쏘기'],
    source_pdf: 'eh_n0030_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '부여에서 내려와 졸본의 세력과 힘을 합쳐 기원전 37년에 고구려를 세운 첫 번째 왕',
      period_clue: '어릴 때부터 활을 잘 쏘아 "활을 잘 쏘는 사람"이라는 뜻의 이름을 가진 고구려의 시조'
    }
  },
  {
    knowledge_id: 'K-TRK-002',
    era: '삼국과 가야',
    era_id: 3,
    category: 'person',
    title: '박혁거세와 신라 건국',
    summary: '건국 신화에 따르면 경주 나정 우물가에서 흰 말이 지켜보던 큰 알에서 태어난 박혁거세가 사로국(신라)의 첫 임금이 되었어요.',
    evidence_type: 'myth',
    keywords: ['박혁거세', '신라 건국', '사로국', '나정', '경주'],
    source_pdf: 'eh_n0020_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '여섯 촌장들의 추대를 받아 기원전 57년에 서라벌(경주)에 신라의 전신인 사로국을 세운 왕',
      period_clue: '밝은 빛으로 세상을 다스린다는 뜻의 이름을 가진 신라의 시조'
    }
  },
  {
    knowledge_id: 'K-TRK-003',
    era: '삼국과 가야',
    era_id: 3,
    category: 'person',
    title: '온조왕과 백제 건국',
    summary: '주몽의 아들인 온조가 남쪽으로 내려와 따뜻하고 농사짓기 좋은 한강 유역(위례성)에 백제를 세웠어요. 백제는 바다를 통해 여러 나라와 활발히 교류했어요.',
    evidence_type: 'historical_fact',
    keywords: ['온조왕', '백제 건국', '한강 유역', '위례성', '풍납토성'],
    source_pdf: 'eh_n0040_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '기원전 18년에 넓은 평야와 바다로 나아가기 좋은 한강 유역에 도읍을 정하고 백제를 세운 왕',
      period_clue: '고구려에서 내려온 유민들과 한강 유역의 토착 세력이 힘을 합쳐 세운 나라의 시조'
    }
  },
  {
    knowledge_id: 'K-TRK-004',
    era: '삼국과 가야',
    era_id: 3,
    category: 'person',
    title: '김수로왕과 가야 연맹',
    summary: '건국 신화에 따르면 구지봉에 내려온 여섯 개의 황금 알 중 가장 먼저 태어난 김수로왕이 금관가야를 세웠어요. 가야는 철이 많이 나서 철기 문화가 크게 발달했어요.',
    evidence_type: 'myth',
    keywords: ['김수로왕', '금관가야', '가야 연맹', '구지봉', '철기 문화'],
    source_pdf: 'eh_n0050_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '낙동강 하류 김해 지역에서 풍부한 철을 바탕으로 금관가야를 세우고 해상 무역을 이끈 왕',
      period_clue: '단단한 철갑옷과 철제 무기를 만들어 주변 나라와 일본에까지 수출했던 가야 연맹의 중심 인물'
    }
  },
  {
    knowledge_id: 'K-TRK-005',
    era: '삼국과 가야',
    era_id: 3,
    category: 'person',
    title: '근초고왕과 백제의 전성기',
    summary: '4세기 백제의 전성기를 이끈 왕이에요. 마한의 남은 땅을 합치고 고구려의 평양성까지 진격했으며, 중국·가야·왜(일본)와 활발히 교류했답니다.',
    evidence_type: 'historical_fact',
    keywords: ['근초고왕', '백제 전성기', '4세기', '칠지도', '해상 교류'],
    source_pdf: 'eh_n0060_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '왕위가 아버지에서 아들로 이어지게 하여 왕권을 강화하고 백제의 영토를 가장 넓혔던 4세기 왕',
      period_clue: '일곱 개의 가지가 달린 칼인 칠지도를 왜왕에게 하사하며 백제의 높은 위상을 보여준 왕'
    }
  },
  {
    knowledge_id: 'K-TRK-006',
    era: '삼국과 가야',
    era_id: 3,
    category: 'person',
    title: '광개토 대왕과 장수왕',
    summary: '광개토 대왕은 만주 벌판까지 고구려의 영토를 크게 넓혔고, 아들 장수왕은 도읍을 평양성으로 옮기고 한강 유역까지 차지하며 5세기 고구려 전성기를 이루었어요.',
    evidence_type: 'historical_fact',
    keywords: ['광개토 대왕', '장수왕', '평양성 천도', '광개토 대왕릉비', '고구려 전성기'],
    source_pdf: 'eh_n0070_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '"땅을 넓힌 큰 임금"이라는 이름처럼 만주와 한반도 북부의 드넓은 영토를 개척하고 신라에 침입한 왜군까지 물리쳐 준 왕',
      period_clue: '아버지 광개토 대왕의 업적을 기리는 거대한 비석을 세우고 도읍을 국내성에서 평양성으로 옮긴 장수왕'
    }
  },
  {
    knowledge_id: 'K-TRK-007',
    era: '삼국과 가야',
    era_id: 3,
    category: 'person',
    title: '진흥왕과 신라의 발전(화랑도·순수비)',
    summary: '6세기 신라의 전성기를 이끈 왕이에요. 청소년 단체인 화랑도를 국가 조직으로 키우고 한강 유역을 차지한 뒤 북한산 등에 순수비를 세웠어요.',
    evidence_type: 'historical_fact',
    keywords: ['진흥왕', '화랑도', '북한산 순수비', '신라 전성기', '한강 유역'],
    source_pdf: 'eh_n0110_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '화랑도를 통해 인재를 기르고 한강 유역과 가야까지 영토를 넓힌 뒤 직접 땅을 돌아보며 순수비를 세운 6세기 신라 왕',
      period_clue: '세속오계의 가르침을 따르며 심신을 수련한 화랑들이 훗날 삼국 통일의 주역이 되도록 기틀을 마련한 왕'
    }
  },
  {
    knowledge_id: 'K-TRK-008',
    era: '삼국과 가야',
    era_id: 3,
    category: 'person',
    title: '이사부 장군과 우산국(독도)',
    summary: '신라 지증왕 때 이사부 장군이 나무로 만든 사자 인형을 배에 싣고 가서 지혜롭게 우산국(울릉도와 독도)을 신라의 땅으로 복속시켰어요.',
    evidence_type: 'historical_fact',
    keywords: ['이사부', '우산국', '울릉도와 독도', '나무 사자', '지증왕'],
    source_pdf: 'eh_n0090_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '싸우지 않고 나무로 만든 사자 모형의 지혜를 써서 울릉도와 독도가 속한 우산국을 우리 역사의 영토로 편입시킨 신라 장군',
      period_clue: '512년(신라 지증왕 13년)부터 울릉도와 독도가 우리 땅이었음을 보여주는 중요한 역사적 사건'
    }
  },
  {
    knowledge_id: 'K-TRK-009',
    era: '삼국과 가야',
    era_id: 3,
    category: 'person',
    title: '을지문덕과 살수대첩',
    summary: '수나라의 백만 대군이 고구려에 쳐들어왔을 때, 을지문덕 장군이 지혜로운 전략으로 살수(청천강)에서 적군을 크게 물리친 전투예요.',
    evidence_type: 'historical_fact',
    keywords: ['을지문덕', '살수대첩', '수나라 격퇴', '고구려 수호', '청천강'],
    source_pdf: 'eh_n0120_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '적군을 피곤하게 만든 뒤 살수(청천강)를 건널 때 공격하여 수나라의 침략으로부터 고구려를 지켜낸 위대한 승리',
      period_clue: '수나라 장수 우중문에게 시를 보내 여유롭게 유인한 뒤 대승을 거둔 고구려의 명장'
    }
  },
  {
    knowledge_id: 'K-TRK-010',
    era: '삼국과 가야',
    era_id: 3,
    category: 'artifact',
    title: '백제 금동대향로와 무령왕릉',
    summary: '백제 금동대향로는 용과 봉황, 악기를 연주하는 신선들이 정교하게 조각된 향로예요. 공주 무령왕릉에서는 백제의 화려한 금제 관꾸미개와 벽돌무덤이 발견되었어요.',
    evidence_type: 'historical_fact',
    keywords: ['백제 금동대향로', '무령왕릉', '부여 능산리', '백제 문화재', '봉황'],
    source_pdf: 'eh_r0092_0010.pdf',
    visual_asset: '/assets/artifacts/art_trk_incense_burner.jpg',
    quiz_facts: {
      purpose: '맨 아래에는 용이 받치고 뚜껑 위에는 봉황이 날개를 펴고 있는 백제 금속 공예의 최고 걸작 향로',
      period_clue: '무덤 주인이 누구인지 적힌 지석이 함께 발견되어 백제 역사의 비밀을 풀어준 공주의 무령왕릉'
    }
  },
  {
    knowledge_id: 'K-TRK-011',
    era: '삼국과 가야',
    era_id: 3,
    category: 'artifact',
    title: '신라 첨성대와 황금 유물(금관)',
    summary: '경주 첨성대는 선덕여왕 때 하늘의 별과 날씨를 관찰하기 위해 세운 동양에서 가장 오래된 천문대예요. 대릉원 무덤에서는 찬란한 신라 금관이 출토되었어요.',
    evidence_type: 'historical_fact',
    keywords: ['첨성대', '선덕여왕', '신라 금관', '대릉원', '천문대'],
    source_pdf: 'eh_r0080_0010.pdf',
    visual_asset: '/assets/artifacts/art_trk_cheomseongdae.jpg',
    quiz_facts: {
      purpose: '하늘의 별자리를 관측해 농사지을 시기와 나라의 중요한 일을 살피던 신라 시대의 천문 관측대',
      period_clue: '나뭇가지 모양과 사슴뿔 모양 장식에 곱은옥을 달아 황금의 나라 신라를 보여주는 유물(금관)'
    }
  },
  {
    knowledge_id: 'K-TRK-012',
    era: '삼국과 가야',
    era_id: 3,
    category: 'artifact',
    title: '고구려 고분 벽화(수렵도·씨름도)',
    summary: '고구려 무덤 안쪽 벽에 그려진 그림으로, 말을 타고 호랑이와 사슴을 사냥하는 수렵도와 씨름하는 모습 등이 생생하게 그려져 있어 당시 생활 모습을 잘 알려줘요.',
    evidence_type: 'historical_fact',
    keywords: ['고구려 고분 벽화', '무용총 수렵도', '각저총 씨름도', '사신도'],
    source_pdf: 'eh_r0050_0010.pdf',
    visual_asset: '/assets/artifacts/art_trk_mural_hunting.jpg',
    quiz_facts: {
      purpose: '말을 달리며 뒤돌아 활을 쏘는 고구려 사람들의 씩씩한 기상과 옷차림, 생활 풍습을 생생히 보여주는 무덤 속 그림',
      period_clue: '무용총의 수렵도와 각저총의 씨름도, 강서대묘의 사신도 등으로 유명한 고구려의 문화유산'
    }
  },

  // ==================== ERA 4: 남북국 시대 ====================
  {
    knowledge_id: 'K-NSK-001',
    era: '남북국 시대',
    era_id: 4,
    category: 'person',
    title: '김춘추(태종 무열왕)와 김유신',
    summary: '신라의 뛰어난 외교관 김춘추와 용맹한 장군 김유신은 힘을 합쳐 백제와 고구려를 차례로 통합하고 삼국 통일의 든든한 주춧돌을 놓았어요.',
    evidence_type: 'historical_fact',
    keywords: ['김춘추', '김유신', '태종 무열왕', '삼국 통일', '황산벌'],
    source_pdf: 'eh_n0130_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '뛰어난 외교력과 굳센 군사력을 결합하여 오랫동안 나뉘어 싸우던 삼국을 하나로 합치는 데 앞장선 두 인물',
      period_clue: '화랑 출신으로 평생 전장을 누빈 김유신 장군과 신라 제29대 태종 무열왕이 된 김춘추'
    }
  },
  {
    knowledge_id: 'K-NSK-002',
    era: '남북국 시대',
    era_id: 4,
    category: 'person',
    title: '문무왕과 삼국 통일 완성(대왕암)',
    summary: '문무왕은 한반도 전체를 차지하려던 당나라 군대를 매소성과 기벌포 전투에서 물리치고 676년에 마침내 삼국 통일을 완성했어요. 죽어서는 동해 바다의 용이 되어 나라를 지키고자 했어요.',
    evidence_type: 'historical_fact',
    keywords: ['문무왕', '삼국 통일 완성', '기벌포 전투', '문무대왕릉', '대왕암'],
    source_pdf: 'eh_n0170_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '고구려·백제 유민들과 힘을 합쳐 당나라 군대를 몰아내고 자주적인 삼국 통일을 완수한 신라의 왕',
      period_clue: '경주 앞바다의 바위섬(문무대왕릉)에 수중 무덤을 만들어 바닷길로 침입하는 왜구를 막겠다고 유언한 왕'
    }
  },
  {
    knowledge_id: 'K-NSK-003',
    era: '남북국 시대',
    era_id: 4,
    category: 'person',
    title: '대조영과 발해 건국',
    summary: '고구려 장수 출신인 대조영이 고구려 유민과 말갈족을 이끌고 동모산에서 발해를 세웠어요(698년). 이로써 남쪽의 통일신라와 북쪽의 발해가 함께하는 남북국 시대가 열렸어요.',
    evidence_type: 'historical_fact',
    keywords: ['대조영', '발해 건국', '동모산', '남북국 시대', '고구려 계승'],
    source_pdf: 'eh_n0180_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '고구려가 멸망한 뒤 유민들을 모아 당나라의 추격을 물리치고 동모산에 고구려를 계승한 새 나라 발해를 세운 인물',
      period_clue: '남쪽의 통일신라와 북쪽의 발해가 우리 역사의 무대를 나란히 이끌어가게 만든 발해의 첫 번째 왕(고왕)'
    }
  },
  {
    knowledge_id: 'K-NSK-004',
    era: '남북국 시대',
    era_id: 4,
    category: 'culture',
    title: '해동성국 발해와 고구려 문화 계승',
    summary: '발해는 9세기에 영토를 크게 넓히고 문화가 융성하여 "바다 동쪽의 번성한 나라(해동성국)"라고 불렸어요. 온돌과 모줄임천장, 수막새 기와 등 고구려 문화를 이어받았어요.',
    evidence_type: 'historical_fact',
    keywords: ['해동성국', '발해 문화', '석등', '이불병좌상', '고구려 계승'],
    source_pdf: 'eh_r0117_0010.pdf',
    visual_asset: '/assets/artifacts/art_nsk_balhae_buddha.jpg',
    quiz_facts: {
      purpose: '넓은 만주와 연해주까지 다스리며 학문과 문화가 크게 발달해 이웃 나라들로부터 "바다 동쪽의 융성한 나라"라 불린 발해의 별칭',
      period_clue: '추운 겨울을 이기는 온돌 장치와 웅장한 발해 석등, 정혜공주 묘의 굴식 돌방무덤으로 고구려의 후손임을 증명한 나라'
    }
  },
  {
    knowledge_id: 'K-NSK-005',
    era: '남북국 시대',
    era_id: 4,
    category: 'artifact',
    title: '불국사와 석굴암',
    summary: '통일신라 시대에 김대성이 불교의 이상 세계를 땅 위에 구현하기 위해 지은 절과 돌굴 사원이에요. 다보탑과 석가탑, 석굴암 본존불상이 유명하며 유네스코 세계유산이에요.',
    evidence_type: 'historical_fact',
    keywords: ['불국사', '석굴암', '다보탑', '석가탑', '통일신라 불교 예술'],
    source_pdf: 'eh_r0070_0010.pdf',
    visual_asset: '/assets/artifacts/art_nsk_seokguram.jpg',
    quiz_facts: {
      purpose: '화강암을 정교하게 다듬어 둥근 돔 천장을 만들고 자비로운 부처님 상을 모신 통일신라 건축과 과학의 결정체',
      period_clue: '경주 토함산에 자리 잡고 있으며 화려한 다보탑과 단아한 석가탑이 나란히 서 있는 사찰'
    }
  },
  {
    knowledge_id: 'K-NSK-006',
    era: '남북국 시대',
    era_id: 4,
    category: 'artifact',
    title: '무구정광대다라니경',
    summary: '불국사 석가탑을 수리할 때 탑 안에서 발견된 두루마리 불경이에요. 세계에서 가장 오래된 목판 인쇄물로 통일신라의 뛰어난 인쇄술과 한지 제작 기술을 보여줘요.',
    evidence_type: 'historical_fact',
    keywords: ['무구정광대다라니경', '석가탑', '목판 인쇄물', '통일신라'],
    source_pdf: 'eh_r0070_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '나무판에 글자를 새겨 닥나무 종이(한지)에 찍어낸 현존하는 세계에서 가장 오래된 목판 인쇄물',
      period_clue: '경주 불국사 삼층석탑(석가탑) 안에서 천 년이 넘는 세월 동안 온전히 보존되어 나온 보물'
    }
  },
  {
    knowledge_id: 'K-NSK-007',
    era: '남북국 시대',
    era_id: 4,
    category: 'person',
    title: '원효 대사와 의상 대사',
    summary: '원효 대사는 어려운 불교 교리를 노래와 춤으로 쉽게 풀어 백성들에게 널리 알렸고, 의상 대사는 부석사를 세워 통일신라 사람들의 마음을 하나로 모았어요.',
    evidence_type: 'historical_fact',
    keywords: ['원효 대사', '의상 대사', '불교 대중화', '나무아미타불', '부석사'],
    source_pdf: 'eh_n0160_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '글을 모르는 가난한 백성들도 마음만 깨끗하면 부처님의 구원을 받을 수 있다고 가르치며 불교를 널리 전한 스님',
      period_clue: '당나라 유학길에 동굴에서 해골물을 마시고 "모든 것은 마음먹기에 달려 있다(일체유심조)"는 깨달음을 얻은 스님'
    }
  },
  {
    knowledge_id: 'K-NSK-008',
    era: '남북국 시대',
    era_id: 4,
    category: 'person',
    title: '혜초 스님과 왕오천축국전',
    summary: '통일신라의 혜초 스님이 머나먼 인도(다섯 천축국)와 중앙아시아 여러 나라를 직접 여행하고 돌아와 각 나라의 생활 모습과 풍습을 기록한 여행기예요.',
    evidence_type: 'historical_fact',
    keywords: ['혜초', '왕오천축국전', '인도 여행기', '천축국', '둔황 석굴'],
    source_pdf: 'eh_n0190_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '부처님의 나라 인도와 서역의 기후, 음식, 옷차림, 문화를 생생하게 기록하여 세계사적으로도 귀중한 통일신라의 여행기',
      period_clue: '중국 둔황의 천불동 석굴에서 발견되어 세상에 다시 알려진 혜초 스님의 책'
    }
  },
  {
    knowledge_id: 'K-NSK-009',
    era: '남북국 시대',
    era_id: 4,
    category: 'person',
    title: '해상왕 장보고와 청해진',
    summary: '장보고 대사는 전라남도 완도에 군사 기지인 청해진을 세워 바다의 해적을 소탕했어요. 그리고 신라·당나라·일본을 잇는 바닷길 무역을 이끌었답니다.',
    evidence_type: 'historical_fact',
    keywords: ['장보고', '청해진', '완도', '해상 무역', '해적 소탕'],
    source_pdf: 'eh_n0200_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '신라 사람들을 붙잡아가던 해적을 물리치고 동아시아 바닷길 무역을 평화롭게 지킨 완도의 해양 기지',
      period_clue: '"바다를 맑게 하여 평안하게 한다"는 뜻의 청해진을 이끌며 해상왕이라 불린 통일신라의 인물'
    }
  },
  {
    knowledge_id: 'K-NSK-010',
    era: '남북국 시대',
    era_id: 4,
    category: 'artifact',
    title: '성덕대왕신종(에밀레종)과 동궁과 월지',
    summary: '성덕대왕신종은 은은하고 웅장한 소리가 멀리까지 퍼지는 통일신라의 거대한 범종이에요. 동궁과 월지(안압지)는 아름다운 연못과 정원이 있는 태자의 별궁 유적이에요.',
    evidence_type: 'historical_fact',
    keywords: ['성덕대왕신종', '동궁과 월지', '안압지', '통일신라 문화재'],
    source_pdf: 'eh_r0114_0010.pdf',
    visual_asset: '/assets/artifacts/art_nsk_emille_bell.jpg',
    quiz_facts: {
      purpose: '종 맨 위의 소리통(음관)과 바닥의 오목한 울림통 등 뛰어난 과학 기술로 천 년이 지나도 맑은 소리를 내는 큰 종',
      period_clue: '바다와 섬을 본떠 아름다운 인공 연못을 만들고 귀한 손님을 맞이해 잔치를 열던 통일신라 왕궁의 별궁'
    }
  },

  // ==================== ERA 5: 고려 ====================
  {
    knowledge_id: 'K-GOR-001',
    era: '고려',
    era_id: 5,
    category: 'person',
    title: '태조 왕건과 고려 건국·후삼국 통일',
    summary: '왕건은 고구려를 계승한다는 뜻으로 나라 이름을 "고려"라 짓고 개경을 도읍으로 삼았어요. 발해 유민까지 따뜻하게 받아들이며 936년에 후삼국을 하나로 통일했답니다.',
    evidence_type: 'historical_fact',
    keywords: ['태조 왕건', '고려 건국', '개경', '후삼국 통일', '민족 융합'],
    source_pdf: 'eh_n0220_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '신라와 후백제, 그리고 멸망한 발해의 사람들까지 한 가족으로 포용하여 진정한 민족 통일을 이룬 고려의 첫 번째 왕',
      period_clue: '918년에 세워져 오늘날 대한민국의 영어 이름인 "코리아(Korea)"의 유래가 된 나라와 그 건국자'
    }
  },
  {
    knowledge_id: 'K-GOR-002',
    era: '고려',
    era_id: 5,
    category: 'person',
    title: '광종과 과거제·노비안검법',
    summary: '고려 제4대 임금 광종은 억울하게 노비가 된 사람들을 양인으로 풀어주는 노비안검법을 실시하고, 실력으로 관리를 뽑는 과거제를 처음으로 도입했어요.',
    evidence_type: 'historical_fact',
    keywords: ['광종', '과거제', '노비안검법', '왕권 강화', '실력 중심'],
    source_pdf: 'eh_n0230_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '가문의 힘만 믿던 호족들의 세력을 누르고 학문과 실력이 뛰어난 인재를 시험으로 뽑아 나라를 튼튼하게 한 제도(과거제)',
      period_clue: '전쟁 포로나 빚 때문에 억울하게 노비가 된 사람들을 조사해 다시 자유로운 백성으로 되돌려준 고려 광종의 법'
    }
  },
  {
    knowledge_id: 'K-GOR-003',
    era: '고려',
    era_id: 5,
    category: 'person',
    title: '서희의 외교 담판과 강동 6주',
    summary: '거란의 대군이 고려에 쳐들어왔을 때, 서희 장군이 적장 소손녕과 당당하게 대화를 나누어 싸우지 않고도 오히려 압록강 동쪽의 강동 6주 땅을 얻어냈어요.',
    evidence_type: 'historical_fact',
    keywords: ['서희', '외교 담판', '강동 6주', '거란 침입', '소손녕'],
    source_pdf: 'eh_n0250_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '칼과 창으로 싸우는 대신 거란이 진짜 원하는 것이 무엇인지 파악해 지혜로운 말(외교 담판)로 전쟁을 막고 영토까지 넓힌 업적',
      period_clue: '"우리 고려는 고구려의 뒤를 이은 나라입니다!"라고 당당히 밝혀 압록강 유역 강동 6주를 되찾은 고려의 외교관'
    }
  },
  {
    knowledge_id: 'K-GOR-004',
    era: '고려',
    era_id: 5,
    category: 'person',
    title: '강감찬 장군과 귀주대첩',
    summary: '거란이 세 번째로 고려를 침략했을 때, 강감찬 장군이 귀주에서 거란군을 크게 무찔러 다시는 고려를 넘보지 못하게 한 빛나는 승리예요(1019년).',
    evidence_type: 'historical_fact',
    keywords: ['강감찬', '귀주대첩', '거란 격퇴', '고려 수호'],
    source_pdf: 'eh_n0260_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '강물을 막았다가 터뜨리고 퇴각하는 거란의 10만 대군을 귀주 벌판에서 완전히 물리쳐 고려에 오랜 평화를 가져온 전투',
      period_clue: '고구려 을지문덕의 살수대첩, 조선 이순신의 한산도 대첩과 함께 우리 역사 3대 대첩으로 꼽히는 강감찬 장군의 승리'
    }
  },
  {
    knowledge_id: 'K-GOR-005',
    era: '고려',
    era_id: 5,
    category: 'person',
    title: '윤관 장군과 별무반·동북 9성',
    summary: '말을 타고 빠르게 공격하는 여진족을 막기 위해 윤관 장군이 기병 중심의 특별 군대인 별무반을 만들었어요. 그리고 여진족을 물리쳐 동북 9성을 쌓았답니다.',
    evidence_type: 'historical_fact',
    keywords: ['윤관', '별무반', '동북 9성', '여진 정벌'],
    source_pdf: 'eh_n0270_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '기병인 신기군, 보병인 신보군, 승려 군대인 항마군으로 구성하여 여진족의 기병에 맞서 싸우기 위해 만든 고려의 특별 부대',
      period_clue: '여진족을 몰아내고 북쪽 국경에 아홉 개의 튼튼한 성(동북 9성)을 쌓은 고려의 장군'
    }
  },
  {
    knowledge_id: 'K-GOR-006',
    era: '고려',
    era_id: 5,
    category: 'artifact',
    title: '고려청자와 상감 기법',
    summary: '맑은 가을 하늘처럼 푸른 비색을 띠는 고려 시대의 대표적인 도자기예요. 그릇 표면에 무늬를 파고 흰 흙과 붉은 흙을 메워 구워내는 독창적인 상감 기법으로 유명해요.',
    evidence_type: 'historical_fact',
    keywords: ['고려청자', '상감청자', '비색', '운학문', '도자기'],
    source_pdf: 'eh_r0140_0010.pdf',
    visual_asset: '/assets/artifacts/art_gor_celadon.jpg',
    quiz_facts: {
      purpose: '도자기 표면에 학이나 구름 무늬를 파낸 뒤 다른 색의 흙을 채워 넣어 그림처럼 아름답게 표현한 고려만의 기술(상감 기법)',
      period_clue: '신비롭고 맑은 푸른빛(비색)으로 세계인들을 감탄시킨 고려 시대의 대표적인 예술품'
    }
  },
  {
    knowledge_id: 'K-GOR-007',
    era: '고려',
    era_id: 5,
    category: 'artifact',
    title: '팔만대장경(재조대장경)',
    summary: '몽골의 침입을 부처님의 힘과 백성들의 단결로 이겨내기 위해 나무판 8만여 장에 불교 경전을 한 글자씩 정성껏 새긴 문화유산이에요. 현재 합천 해인사 장경판전에 보관되어 있어요.',
    evidence_type: 'historical_fact',
    keywords: ['팔만대장경', '합천 해인사', '장경판전', '몽골 침입 극복', '유네스코 세계유산'],
    source_pdf: 'eh_r0150_0010.pdf',
    visual_asset: '/assets/artifacts/art_gor_tripitaka.jpg',
    quiz_facts: {
      purpose: '몽골군의 침략이라는 나라의 큰 위기를 극복하고자 온 백성이 마음을 모아 16년 동안 나무판에 새긴 대장경',
      period_clue: '바람이 잘 통하고 습도를 스스로 조절하는 합천 해인사 장경판전 덕분에 700년이 넘도록 뒤틀림 없이 보존된 세계유산'
    }
  },
  {
    knowledge_id: 'K-GOR-008',
    era: '고려',
    era_id: 5,
    category: 'artifact',
    title: '직지심체요절과 금속활자',
    summary: '고려 시대에 세계 최초로 발명된 금속활자로 찍어낸 책 가운데 오늘날까지 남아 있는 가장 오래된 책이에요(1377년). 유네스코 세계기록유산으로 등재되었어요.',
    evidence_type: 'historical_fact',
    keywords: ['직지심체요절', '금속활자', '청주 흥덕사', '세계기록유산', '인쇄술'],
    source_pdf: 'eh_r0160_0010.pdf',
    visual_asset: '/assets/artifacts/art_gor_jikji.jpg',
    quiz_facts: {
      purpose: '쉽게 닳거나 갈라지는 나무판 대신 쇳물을 부어 글자 조각(금속활자)을 만들어 여러 종류의 책을 튼튼하고 빠르게 찍어낸 발명',
      period_clue: '독일의 구텐베르크 성경보다 무려 78년이나 앞서 청주 흥덕사에서 금속활자로 인쇄된 현존 세계 최고(最古)의 책'
    }
  },
  {
    knowledge_id: 'K-GOR-009',
    era: '고려',
    era_id: 5,
    category: 'person',
    title: '김부식의 삼국사기와 일연의 삼국유사',
    summary: '『삼국사기』는 김부식이 펴낸 우리나라에 남아 있는 가장 오래된 역사책이고, 『삼국유사』는 일연 스님이 단군 신화를 비롯해 삼국의 다양한 이야기와 향가를 모아 쓴 책이에요.',
    evidence_type: 'historical_fact',
    keywords: ['삼국사기', '삼국유사', '김부식', '일연', '역사책'],
    source_pdf: 'eh_r0141_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '고구려·백제·신라 삼국의 역사를 잊지 않고 후손들에게 정확히 전하기 위해 고려 시대에 편찬된 두 권의 소중한 역사책',
      period_clue: '몽골의 침입 속에서도 우리 민족이 단군의 자손이라는 자부심을 일깨우기 위해 일연 스님이 단군 신화를 기록한 책(삼국유사)'
    }
  },
  {
    knowledge_id: 'K-GOR-010',
    era: '고려',
    era_id: 5,
    category: 'person',
    title: '최무선과 문익점의 발명과 애민 정신',
    summary: '최무선은 우리나라에서 처음으로 화약과 화포를 만들어 진포 대첩에서 왜구를 물리쳤고, 문익점은 목화씨를 가져와 백성들이 따뜻한 무명옷을 입을 수 있게 했어요.',
    evidence_type: 'historical_fact',
    keywords: ['최무선', '화통도감', '화포', '문익점', '목화씨', '무명옷'],
    source_pdf: 'eh_n0360_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '바닷가로 쳐들어와 백성들을 괴롭히던 왜구의 배를 화약과 화포로 시원하게 무찌르기 위해 세운 관청(화통도감)과 최무선',
      period_clue: '추운 겨울에 삼베옷만 입고 떨던 백성들에게 솜이불과 따뜻한 무명옷을 선물한 문익점과 목화 재배'
    }
  },
  {
    knowledge_id: 'K-GOR-011',
    era: '고려',
    era_id: 5,
    category: 'event',
    title: '김윤후와 처인성 전투·삼별초의 항쟁',
    summary: '몽골이 침입했을 때 승려 김윤후가 처인성에서 부곡민들과 힘을 합쳐 적장 살리타를 물리쳤고, 삼별초 군대는 강화도·진도·제주도로 옮겨 가며 끝까지 맞서 싸웠어요.',
    evidence_type: 'historical_fact',
    keywords: ['김윤후', '처인성 전투', '삼별초', '대몽 항쟁', '강화도'],
    source_pdf: 'eh_n0330_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '세계 최강이라 불리던 몽골군의 침입에 굴복하지 않고 백성과 군인이 하나 되어 나라를 지켜낸 용감한 항쟁',
      period_clue: '작은 토성이었던 용인 처인성에서 백성들과 함께 싸워 몽골군 총사령관 살리타를 화살로 쏘아 물리친 승려 김윤후'
    }
  },
  {
    knowledge_id: 'K-GOR-012',
    era: '고려',
    era_id: 5,
    category: 'culture',
    title: '국제 무역항 벽란도와 코리아(Korea)',
    summary: '예성강 입구의 벽란도는 송나라, 거란, 일본뿐 아니라 멀리 아라비아 상인들까지 찾아와 비단·인삼·청자를 거래하던 국제 무역항이었어요. 이때 고려라는 이름이 "코리아"로 세계에 알려졌어요.',
    evidence_type: 'historical_fact',
    keywords: ['벽란도', '코리아', '아라비아 상인', '국제 무역항', '예성강'],
    source_pdf: 'eh_r0154_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '고려의 도읍 개경 가까이에 위치해 여러 나라의 배와 아라비아 상인들이 드나들며 고려를 세계에 알린 무역 항구',
      period_clue: '인삼, 고려청자, 종이(한지), 먹 등을 수출하고 향료와 수은, 비단을 수입하던 고려 시대의 열린 바닷길'
    }
  },

  // ==================== ERA 6: 조선 ====================
  {
    knowledge_id: 'K-JOS-001',
    era: '조선',
    era_id: 6,
    category: 'person',
    title: '태조 이성계와 조선 건국·한양 천도',
    summary: '왜구와 홍건적을 물리쳐 백성들의 신망을 얻은 이성계가 정도전 등 신진사대부와 힘을 합쳐 1392년에 조선을 세웠어요. 그리고 한양(서울)으로 도읍을 옮기고 경복궁을 지었답니다.',
    evidence_type: 'historical_fact',
    keywords: ['태조 이성계', '조선 건국', '한양 천도', '경복궁', '정도전'],
    source_pdf: 'eh_n0370_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '나라의 한가운데에 있고 한강이 흘러 교통이 편리하며 산으로 둘러싸여 방어하기 좋은 한양(서울)을 새 수도로 정한 일',
      period_clue: '고조선의 이름을 이어받아 1392년에 새 나라 조선을 세우고 경복궁, 종묘, 사직단을 세운 첫 번째 임금'
    }
  },
  {
    knowledge_id: 'K-JOS-002',
    era: '조선',
    era_id: 6,
    category: 'person',
    title: '세종대왕과 훈민정음(한글) 창제',
    summary: '조선 제4대 임금 세종대왕은 한자를 몰라 억울한 일을 당하는 백성들을 가엾게 여겨 누구나 쉽게 배우고 쓸 수 있는 우리 글자 "훈민정음(한글)"을 만드셨어요(1443년).',
    evidence_type: 'historical_fact',
    keywords: ['세종대왕', '훈민정음', '한글', '집현전', '백성 사랑'],
    source_pdf: 'eh_n0390_0010.pdf',
    visual_asset: '/assets/artifacts/art_jos_hunminjeongeum.jpg',
    quiz_facts: {
      purpose: '"백성을 가르치는 바른 소리"라는 뜻으로, 백성들이 자신의 생각을 글자로 마음껏 표현할 수 있도록 만든 과학적인 우리 문자',
      period_clue: '글자를 만든 원리와 사용법을 자세히 적은 『훈민정음 해례본』이 유네스코 세계기록유산으로 지정된 자랑스러운 문화유산'
    }
  },
  {
    knowledge_id: 'K-JOS-003',
    era: '조선',
    era_id: 6,
    category: 'person',
    title: '장영실과 조선의 과학기구(자격루·측우기·앙부일구)',
    summary: '세종대왕은 신분이 낮았지만 손재주와 지혜가 뛰어난 장영실을 발탁했어요. 장영실은 스스로 시간을 알려주는 물시계 자격루와 해시계 앙부일구, 비의 양을 재는 측우기를 만들었어요.',
    evidence_type: 'historical_fact',
    keywords: ['장영실', '자격루', '앙부일구', '측우기', '혼천의', '과학기구'],
    source_pdf: 'eh_n0400_0010.pdf',
    visual_asset: '/assets/artifacts/art_jos_angbuilgu.jpg',
    quiz_facts: {
      purpose: '농사를 짓는 백성들에게 정확한 시간과 강우량(비의 양)을 알려주어 농사에 큰 도움을 준 조선 시대의 과학 발명품들',
      period_clue: '가마솥 모양의 해시계(앙부일구)에 글자를 모르는 백성을 위해 시간마다 동물 그림을 그려 넣은 따뜻한 배려'
    }
  },
  {
    knowledge_id: 'K-JOS-004',
    era: '조선',
    era_id: 6,
    category: 'artifact',
    title: '조선왕조실록과 경국대전',
    summary: '『조선왕조실록』은 조선 시대 왕들의 역사를 매일 기록해 남긴 세계기록유산이고, 『경국대전』은 나라를 다스리는 기본 법을 완성한 조선의 최고 법전이에요.',
    evidence_type: 'historical_fact',
    keywords: ['조선왕조실록', '경국대전', '사관', '사고', '세계기록유산'],
    source_pdf: 'eh_r0250_0010.pdf',
    visual_asset: '/assets/artifacts/art_jos_sillok.jpg',
    quiz_facts: {
      purpose: '사관이 왕의 말과 나랏일을 있는 그대로 공정하게 적고 왕조차 마음대로 볼 수 없게 하여 진실을 지킨 472년간의 역사 기록',
      period_clue: '전쟁이나 불에 타서 사라지지 않도록 전국 여러 곳의 깊은 산속 사고(보관소)에 나누어 보관한 지혜로운 기록물'
    }
  },
  {
    knowledge_id: 'K-JOS-005',
    era: '조선',
    era_id: 6,
    category: 'person',
    title: '이순신 장군과 거북선·한산도 대첩',
    summary: '1592년 임진왜란이 일어나자 이순신 장군은 철갑을 두른 거북선과 판옥선을 이끌고 바다를 지켰어요. 한산도 대첩에서는 학이 날개를 편 모양의 학익진 전술로 왜군을 크게 물리쳤어요.',
    evidence_type: 'historical_fact',
    keywords: ['이순신', '거북선', '한산도 대첩', '명량 해전', '학익진', '임진왜란'],
    source_pdf: 'eh_n0470_0010.pdf',
    visual_asset: '/assets/artifacts/art_jos_turtleship.jpg',
    quiz_facts: {
      purpose: '등판에 뾰족한 쇠못을 꽂아 적이 배에 올라타지 못하게 하고 용머리에서 화포를 쏘며 적진 한가운데로 돌격하던 조선의 돌격선',
      period_clue: '넓은 바다로 적선을 유인한 뒤 학이 날개를 펼친 듯한 진형(학익진)으로 포위해 대승을 거둔 한산도 대첩'
    }
  },
  {
    knowledge_id: 'K-JOS-006',
    era: '조선',
    era_id: 6,
    category: 'person',
    title: '권율·김시민 장군과 홍의장군 곽재우(의병)',
    summary: '임진왜란 때 김시민 장군은 진주성을 지켰고, 권율 장군은 행주산성에서 백성들과 힘을 합쳐 신기전과 화차로 승리했어요. 곽재우와 사명대사 등 수많은 의병도 스스로 일어나 나라를 구했어요.',
    evidence_type: 'historical_fact',
    keywords: ['권율', '행주대첩', '김시민', '진주대첩', '곽재우', '의병', '신기전'],
    source_pdf: 'eh_n0440_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '군인이 아닌 평범한 백성과 선비, 승려들이 나라가 위험에 빠지자 스스로 무기를 들고 일어나 싸운 구국 군대(의병)',
      period_clue: '붉은 옷을 입고 백마를 타며 왜군을 물리쳐 "홍의장군"이라 불린 의병장 곽재우와 행주산성의 권율 장군'
    }
  },
  {
    knowledge_id: 'K-JOS-007',
    era: '조선',
    era_id: 6,
    category: 'person',
    title: '허준과 동의보감',
    summary: '전쟁과 질병으로 고통받는 백성들을 치료하기 위해 허준이 우리 땅에서 나는 약재(향약)와 치료법을 알기 쉽게 정리해 펴낸 의학책이에요. 유네스코 세계기록유산으로 등재되었어요.',
    evidence_type: 'historical_fact',
    keywords: ['허준', '동의보감', '의학서', '세계기록유산', '백성 치료'],
    source_pdf: 'eh_n0500_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '값비싼 외국 약재 대신 우리 산과 들에서 쉽게 구할 수 있는 약초 이름을 한글로도 적어 백성들이 쉽게 병을 고치도록 한 의학책',
      period_clue: '16년 동안 정성을 다해 집필하여 동양 의학의 백과사전이라 불리는 허준의 걸작'
    }
  },
  {
    knowledge_id: 'K-JOS-008',
    era: '조선',
    era_id: 6,
    category: 'person',
    title: '안용복과 울릉도·독도 수호',
    summary: '조선 숙종 때 어부 출신인 안용복은 울릉도와 독도에 몰래 들어와 고기를 잡던 일본 어부들을 꾸짖어 쫓아내고, 일본에 직접 건너가 울릉도와 독도가 조선 땅이라는 확답을 받아냈어요.',
    evidence_type: 'historical_fact',
    keywords: ['안용복', '독도', '울릉도', '숙종', '영토 수호'],
    source_pdf: 'eh_n0540_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '두 번이나 일본에 건너가 울릉도와 독도(자산도)가 조선의 영토임을 당당히 밝히고 일본 막부의 도항 금지령을 이끌어낸 인물',
      period_clue: '평범한 백성이었지만 나라의 소중한 바다와 섬을 지키겠다는 뜨거운 마음으로 독도를 수호한 조선 후기의 영웅'
    }
  },
  {
    knowledge_id: 'K-JOS-009',
    era: '조선',
    era_id: 6,
    category: 'person',
    title: '영조와 정조의 탕평책과 수원 화성',
    summary: '영조와 정조는 신하들이 편을 가르지 않고 고르게 인재를 뽑는 탕평책을 펼쳤어요. 정조는 과학 기구인 거중기를 사용해 계획도시 수원 화성을 쌓고 상업을 발전시켰답니다.',
    evidence_type: 'historical_fact',
    keywords: ['영조', '정조', '탕평책', '수원 화성', '규장각', '거중기'],
    source_pdf: 'eh_r0310_0010.pdf',
    visual_asset: '/assets/artifacts/art_jos_hwaseong.jpg',
    quiz_facts: {
      purpose: '아버지 사도세자에 대한 효심과 백성들이 살기 좋은 새로운 상업·군사 도시를 만들겠다는 정조의 꿈이 담긴 유네스코 세계유산 성곽',
      period_clue: '어느 한쪽 편에 치우치지 않고 능력에 따라 인재를 골고루 등용하여 왕권을 튼튼히 한 영조와 정조의 정치(탕평책)'
    }
  },
  {
    knowledge_id: 'K-JOS-010',
    era: '조선',
    era_id: 6,
    category: 'person',
    title: '정약용과 실학(거중기·목민심서)',
    summary: '실학자 정약용은 백성들의 실제 삶에 도움이 되는 학문(실학)을 연구했어요. 도르래의 원리로 무거운 돌을 가볍게 들어 올리는 거중기를 설계하고 『목민심서』를 썼답니다.',
    evidence_type: 'historical_fact',
    keywords: ['정약용', '실학', '거중기', '목민심서', '수원 화성'],
    source_pdf: 'eh_n0610_0010.pdf',
    visual_asset: '/assets/artifacts/art_jos_geojunggi.jpg',
    quiz_facts: {
      purpose: '수원 화성을 쌓을 때 일하는 백성들이 다치지 않고 적은 힘으로 무거운 돌을 옮길 수 있도록 도르래 원리로 만든 기계(거중기)',
      period_clue: '지방을 다스리는 관리(수령)가 백성을 사랑하고 바르게 행동해야 할 도리를 자세히 적어 남긴 정약용의 책(목민심서)'
    }
  },
  {
    knowledge_id: 'K-JOS-011',
    era: '조선',
    era_id: 6,
    category: 'person',
    title: '김정호와 대동여지도',
    summary: '김정호는 누구나 나라의 지리를 한눈에 알 수 있도록 정확하고 자세한 우리나라 지도인 『대동여지도』를 만들었어요. 목판에 새겨 여러 장을 찍어내고 접어서 가지고 다니기 편하게 했답니다.',
    evidence_type: 'historical_fact',
    keywords: ['김정호', '대동여지도', '목판 지도', '10리 눈금'],
    source_pdf: 'eh_n0620_0010.pdf',
    visual_asset: '/assets/artifacts/art_jos_daedongyeojido.jpg',
    quiz_facts: {
      purpose: '길을 가는 나그네와 백성들도 산맥과 강, 도로의 거리(10리마다 눈금 표시)를 쉽게 알 수 있도록 목판으로 찍어낸 대형 지도',
      period_clue: '22첩의 병풍처럼 접었다 폈다 할 수 있게 만들어 휴대하기 편리하게 고안한 김정호의 과학적인 지도'
    }
  },
  {
    knowledge_id: 'K-JOS-012',
    era: '조선',
    era_id: 6,
    category: 'culture',
    title: '김홍도의 풍속화와 김만덕의 나눔, 상평통보',
    summary: '조선 후기에는 상평통보라는 엽전이 널리 쓰이고 서민 문화가 발달했어요. 화가 김홍도는 서당·씨름 등 백성들의 일상을 풍속화로 그렸고, 제주 거상 김만덕은 전 재산으로 굶주린 백성을 구했어요.',
    evidence_type: 'historical_fact',
    keywords: ['김홍도', '풍속화', '김만덕', '상평통보', '서민 문화'],
    source_pdf: 'eh_n0580_0010.pdf',
    visual_asset: '/assets/artifacts/art_jos_kimhongdo.jpg',
    quiz_facts: {
      purpose: '씨름판의 구경꾼, 서당에서 꾸중 듣는 아이, 논갈이하는 농부 등 조선 후기 평범한 백성들의 삶을 해학적이고 따뜻하게 담은 그림(풍속화)',
      period_clue: '제주도에 큰 흉년이 들었을 때 상업으로 모은 전 재산으로 쌀을 사서 백성들을 살려낸 나눔의 인물 김만덕'
    }
  },

  // ==================== ERA 7: 개항기와 대한제국 ====================
  {
    knowledge_id: 'K-EMP-001',
    era: '개항기와 대한제국',
    era_id: 7,
    category: 'person',
    title: '흥선대원군의 개혁과 병인양요·신미양요',
    summary: '흥선대원군은 왕권을 세우기 위해 경복궁을 다시 짓고 백성들을 괴롭히던 서원을 정리했어요. 또한 강화도로 침략해 온 프랑스군(병인양요)과 미군(신미양요)에 맞서 싸웠답니다.',
    evidence_type: 'historical_fact',
    keywords: ['흥선대원군', '병인양요', '신미양요', '척화비', '강화도', '양헌수', '어재연'],
    source_pdf: 'eh_n0624_0010.pdf',
    visual_asset: '/assets/artifacts/art_emp_gwangseongbo.jpg',
    quiz_facts: {
      purpose: '외국 군대가 허락 없이 강화도로 쳐들어오자 양헌수 장군(정족산성)과 어재연 장군(광성보)이 나라를 지키기 위해 맞서 싸운 사건',
      period_clue: '서양 세력의 침략을 경계하며 전국 곳곳에 "서양 오랑캐가 침범하는데 싸우지 않는 것은 화친하는 것이다"라는 척화비를 세운 인물'
    }
  },
  {
    knowledge_id: 'K-EMP-002',
    era: '개항기와 대한제국',
    era_id: 7,
    category: 'event',
    title: '강화도 조약과 개항장(부산·원산·인천)',
    summary: '1876년 일본의 군함 무력시위 속에 맺어진 강화도 조약(조일수호조규)은 우리나라 최초의 근대적 조약이지만 불평등한 내용이 담겨 있었어요. 이후 부산, 원산, 인천 항구가 차례로 열렸어요.',
    evidence_type: 'historical_fact',
    keywords: ['강화도 조약', '개항', '인천 개항장', '불평등 조약', '1876년'],
    source_pdf: 'eh_r0353_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '오랫동안 닫혀 있던 나라의 문을 열고 외국과 통상(무역)을 시작하게 되었지만, 우리나라 해안을 일본이 마음대로 측량하게 하는 등 불평등했던 조약',
      period_clue: '개항 이후 외국 상인과 외교관들이 들어오면서 근대식 우체국, 은행, 서양식 건물이 들어선 인천 개항장'
    }
  },
  {
    knowledge_id: 'K-EMP-003',
    era: '개항기와 대한제국',
    era_id: 7,
    category: 'person',
    title: '김옥균과 갑신정변, 근대 개화 노력',
    summary: '개항 이후 서양의 과학과 기술을 받아들여 나라를 부강하게 만들자는 개화사상이 퍼졌어요. 김옥균 등 급진 개화파는 신분제를 없애고 근대 국가를 세우려 갑신정변(1884)을 일으켰어요.',
    evidence_type: 'historical_fact',
    keywords: ['김옥균', '갑신정변', '개화사상', '박규수', '우정총국'],
    source_pdf: 'eh_n0650_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '청나라의 간섭에서 벗어나고 양반 중심의 낡은 신분 제도를 고쳐 근대적인 나라를 빠르게 만들려 했던 3일간의 개혁 운동',
      period_clue: '근대 우편 업무를 시작하던 우정총국 개국 축하연을 계기로 일어난 1884년의 정치 개혁 사건'
    }
  },
  {
    knowledge_id: 'K-EMP-004',
    era: '개항기와 대한제국',
    era_id: 7,
    category: 'person',
    title: '전봉준과 동학 농민 운동',
    summary: '1894년 전봉준과 농민들은 탐관오리의 괴롭힘을 막고 외세를 몰아내어 백성이 주인 되는 세상을 만들고자 동학 농민 운동을 일으켰어요. "사람이 곧 하늘이다(인내천)"라는 평등 정신을 외쳤어요.',
    evidence_type: 'historical_fact',
    keywords: ['전봉준', '동학 농민 운동', '최제우', '인내천', '우금치 전투', '집강소'],
    source_pdf: 'eh_n0660_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '부패한 관리들을 벌하고 신분 차별 없는 평등한 세상과 외세의 침략 반대를 외치며 농민들이 스스로 일어선 큰 운동',
      period_clue: '"새야 새야 파랑새야" 노래로 기억되는 녹두장군 전봉준과 농민들이 집강소를 설치해 개혁을 실천했던 1894년의 역사'
    }
  },
  {
    knowledge_id: 'K-EMP-005',
    era: '개항기와 대한제국',
    era_id: 7,
    category: 'person',
    title: '서재필과 독립신문·독립협회(만민공동회)',
    summary: '서재필은 백성들에게 나라 안팎의 소식을 알리기 위해 한글과 영어로 된 『독립신문』을 펴냈어요. 또한 독립협회를 만들어 독립문을 세우고 백성과 관리가 함께 토론하는 만민공동회를 열었어요.',
    evidence_type: 'historical_fact',
    keywords: ['서재필', '독립신문', '독립협회', '독립문', '만민공동회'],
    source_pdf: 'eh_n0685_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '한자를 모르는 일반 백성과 여성들도 신문을 읽고 나라의 주인으로서 권리를 깨우치도록 순한글로 발행한 최초의 민간 신문',
      period_clue: '신분과 직업을 가리지 않고 수많은 시민이 종로 광장에 모여 외세의 이권 침탈을 반대하고 나라의 정치를 토론한 만민공동회'
    }
  },
  {
    knowledge_id: 'K-EMP-006',
    era: '개항기와 대한제국',
    era_id: 7,
    category: 'event',
    title: '대한제국 선포와 광무개혁(덕수궁)',
    summary: '1897년 고종 황제는 서울 정동의 덕수궁(경운궁)과 환구단에서 우리나라가 자주독립 제국임을 세계에 알리며 "대한제국"을 선포했어요. 그리고 근대 공장과 학교를 세우는 광무개혁을 추진했어요.',
    evidence_type: 'historical_fact',
    keywords: ['대한제국', '고종 황제', '덕수궁', '환구단', '광무개혁', '대한제국 칙령 제41호'],
    source_pdf: 'eh_r0317_0010.pdf',
    visual_asset: '/assets/artifacts/art_emp_deoksugung.jpg',
    quiz_facts: {
      purpose: '우리나라가 어느 나라에도 속하지 않는 당당한 자주독립국임을 선포하고 옛것을 근본으로 삼아 새 기술을 받아들인(구본신참) 개혁',
      period_clue: '1900년 대한제국 칙령 제41호를 반포하여 울릉도를 군으로 승격시키고 독도를 관할하게 하여 독도 영유권을 법으로 명확히 한 나라'
    }
  },
  {
    knowledge_id: 'K-EMP-007',
    era: '개항기와 대한제국',
    era_id: 7,
    category: 'culture',
    title: '근대 문물과 근대 학교(전차·철도·배재학당·이화학당)',
    summary: '개항기와 대한제국 시기에는 전화, 전등, 전차, 기차(경인선) 등 서양의 근대 문물이 들어와 생활 모습이 크게 바뀌었어요. 배재학당, 이화학당 같은 근대식 학교도 세워져 새 학문을 가르쳤어요.',
    evidence_type: 'historical_fact',
    keywords: ['근대 문물', '전차', '경인선 철도', '배재학당', '이화학당', '광혜원'],
    source_pdf: 'eh_r0361_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '신분이나 남녀 차별 없이 신학문(과학, 외국어, 역사 등)을 가르쳐 나라를 이끌어갈 인재를 키운 근대식 학교들',
      period_clue: '밤거리를 환하게 밝힌 전등, 서울 서대문에서 청량리까지 달린 전차, 제물포와 노량진을 연결한 최초의 철도 경인선'
    }
  },
  {
    knowledge_id: 'K-EMP-008',
    era: '개항기와 대한제국',
    era_id: 7,
    category: 'event',
    title: '을사늑약과 헤이그 특사(이준·이상설·이위종)',
    summary: '1905년 일제가 군대를 동원해 강제로 대한제국의 외교권을 빼앗는 을사늑약을 맺었어요. 고종 황제는 이 조약이 무효임을 세계에 알리기 위해 네덜란드 헤이그 만국평화회의에 특사를 보냈어요.',
    evidence_type: 'historical_fact',
    keywords: ['을사늑약', '헤이그 특사', '이준', '이상설', '이위종', '헐버트'],
    source_pdf: 'eh_n0670_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '황제의 허락과 도장(옥새)도 없이 일제가 강제로 맺은 을사늑약의 부당함을 전 세계 대표들에게 알리려 파견된 세 명의 외교 사절',
      period_clue: '머나먼 네덜란드 헤이그까지 찾아가 만국평화회의장 밖에서까지 대한제국의 독립 의지를 호소한 이준·이상설·이위종 열사'
    }
  },
  {
    knowledge_id: 'K-EMP-009',
    era: '개항기와 대한제국',
    era_id: 7,
    category: 'event',
    title: '국채보상운동과 애국계몽운동',
    summary: '일제가 대한제국에 큰 빚(국채)을 지워 나라를 삼키려 하자, 1907년 대구에서 서상돈 등을 중심으로 온 국민이 담배를 끊고 비녀와 반지를 모아 나라 빚을 갚자는 국채보상운동을 펼쳤어요.',
    evidence_type: 'historical_fact',
    keywords: ['국채보상운동', '서상돈', '대한매일신보', '양기탁', '경제 독립'],
    source_pdf: 'eh_r0330_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '일본에게 진 나라의 빚 1,300만 원을 국민의 힘으로 스스로 갚아 경제적 자주권을 지키려 했던 범국민 모금 운동',
      period_clue: '남성들은 담배를 끊고 여성들은 은비녀와 가락지를 내놓으며 『대한매일신보』 등 신문사가 앞장서서 알린 애국 운동'
    }
  },
  {
    knowledge_id: 'K-EMP-010',
    era: '개항기와 대한제국',
    era_id: 7,
    category: 'person',
    title: '항일 의병 운동(최익현·신돌석·윤희순)',
    summary: '나라의 국권이 흔들리자 노학자 최익현, 태백산 호랑이라 불린 평민 출신 의병장 신돌석, 최초의 여성 의병장 윤희순 등 수많은 의병이 전국에서 일어나 일제에 맞서 싸웠어요.',
    evidence_type: 'historical_fact',
    keywords: ['항일 의병', '최익현', '신돌석', '윤희순', '태백산 호랑이'],
    source_pdf: 'eh_n0750_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '양반 유생뿐만 아니라 평민, 해산된 대한제국 군인, 여성들까지 하나로 뭉쳐 국권을 되찾기 위해 싸운 의병 투쟁',
      period_clue: '"안사람 의병가" 노래를 지어 부르며 여성 의병단을 이끌고 화약과 탄환을 만들어 독립군을 도운 최초의 여성 의병장 윤희순'
    }
  },

  // ==================== ERA 8: 일제강점기와 독립운동 ====================
  {
    knowledge_id: 'K-IND-001',
    era: '일제강점기와 독립운동',
    era_id: 8,
    category: 'person',
    title: '안중근 의사와 하얼빈 의거·동양평화론',
    summary: '1909년 안중근 의사는 침략의 앞장섰던 이토 히로부미를 하얼빈역에서 처단하고 대한독립 만세를 외쳤어요. 감옥에서도 한·중·일 세 나라가 서로 존중하며 평화롭게 살아야 한다는 『동양평화론』을 썼어요.',
    evidence_type: 'historical_fact',
    keywords: ['안중근', '하얼빈 의거', '이토 히로부미', '동양평화론', '단지동맹'],
    source_pdf: 'eh_n0770_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '대한제국의 국권을 빼앗고 동양의 평화를 깨뜨린 침략의 원흉을 처단하여 우리 민족의 뜨거운 독립 의지를 세계에 알린 의거',
      period_clue: '연해주에서 동지들과 손가락을 끊어 조국 독립을 맹세(단지동맹)하고 감옥에서 『동양평화론』을 집필한 독립운동가'
    }
  },
  {
    knowledge_id: 'K-IND-002',
    era: '일제강점기와 독립운동',
    era_id: 8,
    category: 'event',
    title: '3·1 운동과 유관순 열사',
    summary: '1919년 3월 1일, 학생과 시민, 농민 등 온 민족이 태극기를 흔들며 "대한독립 만세!"를 외친 평화적인 만세 운동이에요. 유관순 열사는 아우내 장터에서 만세 시위를 이끌고 감옥에서도 독립을 외쳤어요.',
    evidence_type: 'historical_fact',
    keywords: ['3·1 운동', '유관순', '독립선언서', '아우내 장터', '탑골공원', '만세 운동'],
    source_pdf: 'eh_n0860_0010.pdf',
    visual_asset: '/assets/artifacts/art_ind_samil.jpg',
    quiz_facts: {
      purpose: '어린 학생부터 노인까지 남녀노소 온 국민이 폭력 없이 태극기와 독립선언서를 들고 우리 민족의 자주독립을 세계에 선포한 최대 규모의 독립운동',
      period_clue: '서울 탑골공원에서 시작되어 천안 아우내 장터와 전국 방방곡곡, 해외까지 울려 퍼졌으며 대한민국 임시정부 수립의 계기가 된 운동'
    }
  },
  {
    knowledge_id: 'K-IND-003',
    era: '일제강점기와 독립운동',
    era_id: 8,
    category: 'system',
    title: '대한민국 임시정부와 백범 김구',
    summary: '3·1 운동의 정신을 이어받아 1919년 중국 상하이에 세워진 우리나라 최초의 민주공화제 정부예요. 백범 김구 선생은 임시정부를 이끌며 한국광복군을 창설하고 조국의 완전한 독립을 위해 헌신하셨어요.',
    evidence_type: 'historical_fact',
    keywords: ['대한민국 임시정부', '김구', '백범일지', '상하이', '한국광복군', '민주공화제'],
    source_pdf: 'eh_n0740_0010.pdf',
    visual_asset: '/assets/artifacts/art_ind_imjeong.jpg',
    quiz_facts: {
      purpose: '"대한민국은 민주공화제로 한다"고 헌법에 밝히고, 비밀 연락망(연통제)과 외교 활동, 한국광복군을 통해 독립운동을 총지휘한 정부',
      period_clue: '"내가 원하는 우리나라"에서 오직 높은 문화의 힘을 가진 평화로운 자주독립 국가를 꿈꾸었던 백범 김구 선생'
    }
  },
  {
    knowledge_id: 'K-IND-004',
    era: '일제강점기와 독립운동',
    era_id: 8,
    category: 'person',
    title: '이회영과 신흥무관학교·남자현 지사',
    summary: '이회영 선생과 여섯 형제는 전 재산을 팔아 만주 삼원보로 건너가 독립군을 기르는 신흥무관학교를 세웠어요. "독립군의 어머니" 남자현 지사도 만주에서 독립군들을 돌보며 용감히 활약했어요.',
    evidence_type: 'historical_fact',
    keywords: ['이회영', '신흥무관학교', '남자현', '만주 독립운동', '노블레스 오블리주'],
    source_pdf: 'eh_n0690_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '엄청난 부자였던 여섯 형제가 집과 땅을 모두 팔아 추운 만주 벌판에 세운 독립군 양성 학교(신흥무관학교)',
      period_clue: '이 학교에서 훈련받은 수많은 청년들이 훗날 봉오동 전투와 청산리 대첩의 핵심 주역이 된 독립운동의 요람'
    }
  },
  {
    knowledge_id: 'K-IND-005',
    era: '일제강점기와 독립운동',
    era_id: 8,
    category: 'person',
    title: '홍범도 장군의 봉오동 전투와 김좌진 장군의 청산리 대첩',
    summary: '1920년 홍범도 장군이 이끄는 대한독립군 연합부대가 봉오동에서 일본군을 크게 무찔렀고, 이어 김좌진 장군의 북로군정서군과 독립군 연합부대가 청산리에서 빛나는 대승을 거두었어요.',
    evidence_type: 'historical_fact',
    keywords: ['홍범도', '봉오동 전투', '김좌진', '청산리 대첩', '독립군 승리', '1920년'],
    source_pdf: 'eh_n0700_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '만주 지역의 독립군 부대들이 힘을 합쳐 지형을 이용한 뛰어난 작전으로 일본 정규군을 크게 물리친 무장 독립 전쟁의 대표적 승리',
      period_clue: '"날마다 장군"이라 불린 평민 포수 출신 홍범도 장군과 백야 김좌진 장군이 활약한 1920년의 자랑스러운 독립군 전투'
    }
  },
  {
    knowledge_id: 'K-IND-006',
    era: '일제강점기와 독립운동',
    era_id: 8,
    category: 'person',
    title: '이봉창·윤봉길 의사와 한인애국단, 의열단(김원봉)',
    summary: '김원봉이 이끈 의열단과 김구 선생이 조직한 한인애국단은 의로운 행동으로 일제에 맞섰어요. 이봉창 의사는 도쿄에서, 윤봉길 의사는 상하이 훙커우 공원에서 폭탄을 던져 독립 의지를 세계에 떨쳤어요.',
    evidence_type: 'historical_fact',
    keywords: ['윤봉길', '이봉창', '한인애국단', '의열단', '김원봉', '훙커우 공원'],
    source_pdf: 'eh_n0890_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '침체되어 있던 임시정부와 독립운동에 새로운 활력을 불어넣고 중국 등 세계 여러 나라가 한국 독립운동을 적극 돕게 만든 의거',
      period_clue: '농민들을 위한 야학 교사로 일하다가 상하이 훙커우 공원에서 물통 모양 폭탄으로 일제 수뇌부를 처단한 매헌 윤봉길 의사'
    }
  },
  {
    knowledge_id: 'K-IND-007',
    era: '일제강점기와 독립운동',
    era_id: 8,
    category: 'person',
    title: '주시경 선생과 조선어학회(우리말과 한글 수호)',
    summary: '주시경 선생은 우리말의 문법을 연구하고 "한글"이라는 이름을 지어 널리 보급했어요. 일제가 우리말 사용을 금지했을 때도 조선어학회 학자들은 목숨을 걸고 『우리말 큰사전』 원고를 지켜냈어요.',
    evidence_type: 'historical_fact',
    keywords: ['주시경', '조선어학회', '한글 수호', '우리말 큰사전', '말모이'],
    source_pdf: 'eh_n0730_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '"말이 오르면 나라도 오르고, 말이 내리면 나라도 내린다"며 일제의 민족말살 통치 속에서도 우리말과 글을 끝까지 연구하고 지킨 노력',
      period_clue: '전국 사람들의 사투리와 우리말 단어를 모아 사전을 만들려다 감옥에 갇히면서도 원고를 지켜 광복 후 『큰사전』을 펴낸 단체(조선어학회)'
    }
  },
  {
    knowledge_id: 'K-IND-008',
    era: '일제강점기와 독립운동',
    era_id: 8,
    category: 'person',
    title: '방정환(어린이날)과 전형필(문화재 수호)',
    summary: '소파 방정환 선생은 어린이도 존중받는 인격체라며 "어린이"라는 말을 만들고 어린이날을 제정했어요. 간송 전형필 선생은 전 재산을 바쳐 『훈민정음 해례본』과 고려청자 등 우리 문화유산이 일본으로 넘어가는 것을 막았어요.',
    evidence_type: 'historical_fact',
    keywords: ['방정환', '어린이날', '전형필', '간송미술관', '훈민정음 해례본 수호'],
    source_pdf: 'eh_n0840_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '미래의 주인인 아이들에게 꿈과 희망을 심어준 방정환 선생과, 막대한 재산으로 우리 민족의 혼이 담긴 보물들을 사들여 지켜낸 전형필 선생',
      period_clue: '일제강점기에 기와집 수백 채 값을 주고 『훈민정음 해례본』을 구해내어 오늘날 우리가 볼 수 있게 지킨 문화재 수호자'
    }
  },
  {
    knowledge_id: 'K-IND-009',
    era: '일제강점기와 독립운동',
    era_id: 8,
    category: 'person',
    title: '안창호·신채호·박은식과 민족 정신, 윤동주·이육사',
    summary: '안창호 선생은 교육과 실력 양성을 이끌었고, 신채호와 박은식 선생은 우리 역사를 연구해 민족의 혼을 일깨웠어요. 윤동주와 이육사 시인은 아름다운 우리말 시로 일제에 저항하며 광복의 희망을 노래했어요.',
    evidence_type: 'historical_fact',
    keywords: ['안창호', '신채호', '박은식', '윤동주', '이육사', '민족 사학', '저항 시인'],
    source_pdf: 'eh_n0760_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '"역사를 잊은 민족에게 미래는 없다", "나라는 몸이고 역사는 혼이다"라며 우리 역사를 통해 독립의 믿음을 심어준 역사학자들과 시인들',
      period_clue: '대성학교와 흥사단을 세워 청년들을 가르친 도산 안창호 선생과 『서시』, 『청포도』 등으로 광복의 날을 기다린 시인 윤동주·이육사'
    }
  },
  {
    knowledge_id: 'K-IND-010',
    era: '일제강점기와 독립운동',
    era_id: 8,
    category: 'event',
    title: '한국광복군과 8·15 광복(권기옥·유일한)',
    summary: '최초의 여성 비행사 권기옥, 기업 이윤으로 독립운동을 도운 유일한 박사, 그리고 대한민국 임시정부의 군대인 한국광복군까지 국내외 수많은 독립운동가의 희생과 노력 끝에 1945년 8월 15일 마침내 빛을 되찾는 광복을 맞이했어요.',
    evidence_type: 'historical_fact',
    keywords: ['한국광복군', '8·15 광복', '권기옥', '유일한', '대한민국 건국'],
    source_pdf: 'eh_r0382_0010.pdf',
    visual_asset: '',
    quiz_facts: {
      purpose: '35년간의 어두운 일제강점기를 끝내고 우리 민족이 끈질긴 독립운동 끝에 나라의 빛과 주권을 되찾은 1945년 8월 15일',
      period_clue: '하늘을 날며 독립을 위해 싸운 최초의 여성 비행사 권기옥과 연합군과 함께 국내 진공 작전을 준비했던 대한민국 임시정부의 정규군(한국광복군)'
    }
  }
];
