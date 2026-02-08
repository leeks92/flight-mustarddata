/**
 * 공항 코드별 대륙/국가 매핑 데이터
 * airports.json의 모든 공항을 대륙과 국가로 분류
 */

export interface AirportRegion {
  continent: string; // 대륙 한글명
  country: string;   // 국가 한글명
}

// 대륙 표시 순서
export const CONTINENT_ORDER = [
  '한국',
  '동아시아',
  '동남아시아',
  '남아시아',
  '중앙아시아',
  '중동',
  '유럽',
  '북미',
  '중남미',
  '오세아니아',
  '아프리카',
] as const;

// 공항 코드 → 대륙/국가 매핑
const airportRegionMap: Record<string, AirportRegion> = {
  // ── 한국 ──
  'ICN': { continent: '한국', country: '한국' },
  'GMP': { continent: '한국', country: '한국' },
  'PUS': { continent: '한국', country: '한국' },
  'CJU': { continent: '한국', country: '한국' },
  'TAE': { continent: '한국', country: '한국' },
  'CJJ': { continent: '한국', country: '한국' },
  'KWJ': { continent: '한국', country: '한국' },
  'RSU': { continent: '한국', country: '한국' },
  'USN': { continent: '한국', country: '한국' },
  'KPO': { continent: '한국', country: '한국' },
  'WJU': { continent: '한국', country: '한국' },
  'KUV': { continent: '한국', country: '한국' },
  'SHO': { continent: '한국', country: '한국' },
  'MWX': { continent: '한국', country: '한국' },
  'HIN': { continent: '한국', country: '한국' },

  // ── 동아시아 - 일본 ──
  'NRT': { continent: '동아시아', country: '일본' },
  'HND': { continent: '동아시아', country: '일본' },
  'KIX': { continent: '동아시아', country: '일본' },
  'FUK': { continent: '동아시아', country: '일본' },
  'CTS': { continent: '동아시아', country: '일본' },
  'NGO': { continent: '동아시아', country: '일본' },
  'OKA': { continent: '동아시아', country: '일본' },
  'KOJ': { continent: '동아시아', country: '일본' },
  'KMJ': { continent: '동아시아', country: '일본' },
  'NGS': { continent: '동아시아', country: '일본' },
  'KMQ': { continent: '동아시아', country: '일본' },
  'UKB': { continent: '동아시아', country: '일본' },
  'SDJ': { continent: '동아시아', country: '일본' },
  'KIJ': { continent: '동아시아', country: '일본' },
  'OIT': { continent: '동아시아', country: '일본' },
  'OKJ': { continent: '동아시아', country: '일본' },
  'TAK': { continent: '동아시아', country: '일본' },
  'MYJ': { continent: '동아시아', country: '일본' },
  'TKS': { continent: '동아시아', country: '일본' },
  'AOJ': { continent: '동아시아', country: '일본' },
  'HIJ': { continent: '동아시아', country: '일본' },
  'HSG': { continent: '동아시아', country: '일본' },
  'FSZ': { continent: '동아시아', country: '일본' },
  'KMI': { continent: '동아시아', country: '일본' },
  'SHI': { continent: '동아시아', country: '일본' },
  'SHM': { continent: '동아시아', country: '일본' },
  'UBJ': { continent: '동아시아', country: '일본' },
  'ISG': { continent: '동아시아', country: '일본' },
  'IBR': { continent: '동아시아', country: '일본' },
  'KKJ': { continent: '동아시아', country: '일본' },
  'OBO': { continent: '동아시아', country: '일본' },
  'HKD': { continent: '동아시아', country: '일본' },
  'YGJ': { continent: '동아시아', country: '일본' },

  // ── 동아시아 - 중국 ──
  'PEK': { continent: '동아시아', country: '중국' },
  'PKX': { continent: '동아시아', country: '중국' },
  'PVG': { continent: '동아시아', country: '중국' },
  'CAN': { continent: '동아시아', country: '중국' },
  'SZX': { continent: '동아시아', country: '중국' },
  'CTU': { continent: '동아시아', country: '중국' },
  'TFU': { continent: '동아시아', country: '중국' },
  'CKG': { continent: '동아시아', country: '중국' },
  'DLC': { continent: '동아시아', country: '중국' },
  'TAO': { continent: '동아시아', country: '중국' },
  'SHE': { continent: '동아시아', country: '중국' },
  'HRB': { continent: '동아시아', country: '중국' },
  'XMN': { continent: '동아시아', country: '중국' },
  'NKG': { continent: '동아시아', country: '중국' },
  'HGH': { continent: '동아시아', country: '중국' },
  'KWL': { continent: '동아시아', country: '중국' },
  'CSX': { continent: '동아시아', country: '중국' },
  'WUH': { continent: '동아시아', country: '중국' },
  'XIY': { continent: '동아시아', country: '중국' },
  'KMG': { continent: '동아시아', country: '중국' },
  'CGO': { continent: '동아시아', country: '중국' },
  'TNA': { continent: '동아시아', country: '중국' },
  'CGQ': { continent: '동아시아', country: '중국' },
  'TSN': { continent: '동아시아', country: '중국' },
  'YNJ': { continent: '동아시아', country: '중국' },
  'SJW': { continent: '동아시아', country: '중국' },
  'WUX': { continent: '동아시아', country: '중국' },
  'FOC': { continent: '동아시아', country: '중국' },
  'HFE': { continent: '동아시아', country: '중국' },
  'YNT': { continent: '동아시아', country: '중국' },
  'WEH': { continent: '동아시아', country: '중국' },
  'YTY': { continent: '동아시아', country: '중국' },
  'YNZ': { continent: '동아시아', country: '중국' },
  'WNZ': { continent: '동아시아', country: '중국' },
  'JMU': { continent: '동아시아', country: '중국' },
  'DYG': { continent: '동아시아', country: '중국' },
  'SYX': { continent: '동아시아', country: '중국' },
  'HAK': { continent: '동아시아', country: '중국' },

  // ── 동아시아 - 대만 ──
  'TPE': { continent: '동아시아', country: '대만' },
  'KHH': { continent: '동아시아', country: '대만' },
  'RMQ': { continent: '동아시아', country: '대만' },
  'HUN': { continent: '동아시아', country: '대만' },

  // ── 동아시아 - 홍콩/마카오 ──
  'HKG': { continent: '동아시아', country: '홍콩' },
  'MFM': { continent: '동아시아', country: '마카오' },

  // ── 동아시아 - 몽골 ──
  'UBN': { continent: '동아시아', country: '몽골' },

  // ── 동남아시아 ──
  'BKK': { continent: '동남아시아', country: '태국' },
  'DMK': { continent: '동남아시아', country: '태국' },
  'CNX': { continent: '동남아시아', country: '태국' },
  'HKT': { continent: '동남아시아', country: '태국' },
  'SIN': { continent: '동남아시아', country: '싱가포르' },
  'SGN': { continent: '동남아시아', country: '베트남' },
  'HAN': { continent: '동남아시아', country: '베트남' },
  'DAD': { continent: '동남아시아', country: '베트남' },
  'CXR': { continent: '동남아시아', country: '베트남' },
  'PQC': { continent: '동남아시아', country: '베트남' },
  'HPH': { continent: '동남아시아', country: '베트남' },
  'MNL': { continent: '동남아시아', country: '필리핀' },
  'CEB': { continent: '동남아시아', country: '필리핀' },
  'KLO': { continent: '동남아시아', country: '필리핀' },
  'TAG': { continent: '동남아시아', country: '필리핀' },
  'CRK': { continent: '동남아시아', country: '필리핀' },
  'KUL': { continent: '동남아시아', country: '말레이시아' },
  'BKI': { continent: '동남아시아', country: '말레이시아' },
  'CGK': { continent: '동남아시아', country: '인도네시아' },
  'DPS': { continent: '동남아시아', country: '인도네시아' },
  'MDC': { continent: '동남아시아', country: '인도네시아' },
  'BTH': { continent: '동남아시아', country: '인도네시아' },
  'RGN': { continent: '동남아시아', country: '미얀마' },
  'VTE': { continent: '동남아시아', country: '라오스' },
  'KTI': { continent: '동남아시아', country: '캄보디아' },
  'BWN': { continent: '동남아시아', country: '브루나이' },

  // ── 남아시아 ──
  'DEL': { continent: '남아시아', country: '인도' },
  'KTM': { continent: '남아시아', country: '네팔' },
  'CMB': { continent: '남아시아', country: '스리랑카' },
  'DAC': { continent: '남아시아', country: '방글라데시' },

  // ── 중앙아시아 ──
  'TAS': { continent: '중앙아시아', country: '우즈베키스탄' },
  'ALA': { continent: '중앙아시아', country: '카자흐스탄' },
  'NQZ': { continent: '중앙아시아', country: '카자흐스탄' },
  'CIT': { continent: '중앙아시아', country: '카자흐스탄' },
  'BSZ': { continent: '중앙아시아', country: '키르기스스탄' },
  'ASB': { continent: '중앙아시아', country: '투르크메니스탄' },

  // ── 중동 ──
  'DXB': { continent: '중동', country: 'UAE' },
  'AUH': { continent: '중동', country: 'UAE' },
  'DOH': { continent: '중동', country: '카타르' },
  'IST': { continent: '중동', country: '튀르키예' },

  // ── 유럽 ──
  'LHR': { continent: '유럽', country: '영국' },
  'CDG': { continent: '유럽', country: '프랑스' },
  'FRA': { continent: '유럽', country: '독일' },
  'MUC': { continent: '유럽', country: '독일' },
  'AMS': { continent: '유럽', country: '네덜란드' },
  'FCO': { continent: '유럽', country: '이탈리아' },
  'MXP': { continent: '유럽', country: '이탈리아' },
  'MAD': { continent: '유럽', country: '스페인' },
  'BCN': { continent: '유럽', country: '스페인' },
  'PRG': { continent: '유럽', country: '체코' },
  'VIE': { continent: '유럽', country: '오스트리아' },
  'HEL': { continent: '유럽', country: '핀란드' },
  'CPH': { continent: '유럽', country: '덴마크' },
  'WAW': { continent: '유럽', country: '폴란드' },
  'WRO': { continent: '유럽', country: '폴란드' },
  'BUD': { continent: '유럽', country: '헝가리' },
  'LIS': { continent: '유럽', country: '포르투갈' },

  // ── 북미 ──
  'JFK': { continent: '북미', country: '미국' },
  'LAX': { continent: '북미', country: '미국' },
  'SFO': { continent: '북미', country: '미국' },
  'ORD': { continent: '북미', country: '미국' },
  'SEA': { continent: '북미', country: '미국' },
  'ATL': { continent: '북미', country: '미국' },
  'DFW': { continent: '북미', country: '미국' },
  'EWR': { continent: '북미', country: '미국' },
  'IAD': { continent: '북미', country: '미국' },
  'BOS': { continent: '북미', country: '미국' },
  'LAS': { continent: '북미', country: '미국' },
  'DTW': { continent: '북미', country: '미국' },
  'MSP': { continent: '북미', country: '미국' },
  'SLC': { continent: '북미', country: '미국' },
  'ANC': { continent: '북미', country: '미국' },
  'HNL': { continent: '북미', country: '미국' },
  'KOA': { continent: '북미', country: '미국' },
  'GUM': { continent: '북미', country: '미국' },
  'SPN': { continent: '북미', country: '미국' },
  'YVR': { continent: '북미', country: '캐나다' },
  'YYZ': { continent: '북미', country: '캐나다' },

  // ── 중남미 ──
  'MEX': { continent: '중남미', country: '멕시코' },

  // ── 오세아니아 ──
  'SYD': { continent: '오세아니아', country: '호주' },
  'MEL': { continent: '오세아니아', country: '호주' },
  'BNE': { continent: '오세아니아', country: '호주' },
  'AKL': { continent: '오세아니아', country: '뉴질랜드' },

  // ── 아프리카 ──
  'ADD': { continent: '아프리카', country: '에티오피아' },
  'CAI': { continent: '아프리카', country: '이집트' },
};

/**
 * 공항 코드로 대륙/국가 정보를 조회
 */
export function getAirportRegion(airportCode: string): AirportRegion | null {
  return airportRegionMap[airportCode] || null;
}

/**
 * 전체 공항-지역 매핑 반환
 */
export function getAllAirportRegions(): Record<string, AirportRegion> {
  return airportRegionMap;
}

/**
 * 대륙 표시 순서 인덱스 반환 (정렬용)
 */
export function getContinentOrder(continent: string): number {
  const idx = CONTINENT_ORDER.indexOf(continent as typeof CONTINENT_ORDER[number]);
  return idx === -1 ? CONTINENT_ORDER.length : idx;
}
