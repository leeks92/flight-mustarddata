/**
 * 한국 15개 공항의 주차요금, 교통편, 혼잡도 정적 데이터
 * 공항 공식 사이트 기반 (airport.kr, airport.co.kr)
 */

export interface ParkingFee {
  type: string;           // 단기주차장, 장기주차장 등
  rates: {
    label: string;        // "30분", "10분", "1일" 등
    price: string;        // "1,200원" 등
  }[];
  discountInfo?: string;
}

export interface TransportOption {
  type: string;           // 공항철도, 리무진버스, 택시 등
  description: string;
  estimatedCost?: string;
  estimatedTime?: string;
}

export interface CongestionTip {
  period: string;         // 시간대 설명
  level: 'low' | 'medium' | 'high';
  description: string;
}

export interface KoreanAirportExtra {
  operatingHours: string;
  parking: ParkingFee[];
  transport: TransportOption[];
  congestionTips: CongestionTip[];
  website?: string;
}

const koreanAirportExtraMap: Record<string, KoreanAirportExtra> = {
  // ── Tier 1 ──
  'ICN': {
    operatingHours: '24시간 운영',
    parking: [
      {
        type: '단기주차장 (P1·P2)',
        rates: [
          { label: '30분', price: '1,200원' },
          { label: '1시간', price: '2,400원' },
          { label: '1일', price: '18,000원' },
        ],
        discountInfo: '경차·저공해차 50% 할인, 장애인 80% 할인',
      },
      {
        type: '장기주차장 (P3·P4)',
        rates: [
          { label: '30분', price: '600원' },
          { label: '1시간', price: '1,200원' },
          { label: '1일', price: '9,000원' },
        ],
        discountInfo: '사전 예약 시 추가 할인, 발레파킹 가능',
      },
      {
        type: '제2여객터미널 주차장',
        rates: [
          { label: '30분', price: '1,200원' },
          { label: '1시간', price: '2,400원' },
          { label: '1일', price: '18,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '공항철도 (AREX)',
        description: '서울역~인천공항 직통열차 43분, 일반열차 약 66분',
        estimatedCost: '직통 11,000원, 일반 4,850원',
        estimatedTime: '43~66분',
      },
      {
        type: '리무진버스',
        description: '서울, 경기 주요 지역 운행. 강남, 명동, 잠실 등',
        estimatedCost: '10,000~18,000원',
        estimatedTime: '60~90분',
      },
      {
        type: '택시',
        description: '서울 도심까지 약 60~80분 소요',
        estimatedCost: '65,000~80,000원',
        estimatedTime: '60~80분',
      },
      {
        type: 'KTX (SRT)',
        description: '인천공항역에서 KTX·SRT 환승 가능',
        estimatedCost: '노선별 상이',
        estimatedTime: '서울역까지 약 50분 (환승 포함)',
      },
    ],
    congestionTips: [
      { period: '오전 6~8시', level: 'high', description: '동남아·일본행 아침 출발편 집중, 보안검색 30~50분 소요' },
      { period: '오전 10시~오후 2시', level: 'medium', description: '중국·유럽행 출발, 평균 대기 15~30분' },
      { period: '오후 5~7시', level: 'high', description: '미주행 저녁 출발편 집중, 주말 특히 혼잡' },
      { period: '오후 8시 이후', level: 'low', description: '심야 출발편 일부, 비교적 한산' },
    ],
    website: 'https://www.airport.kr',
  },

  'GMP': {
    operatingHours: '05:00~23:00 (국제선 운영시간 제한)',
    parking: [
      {
        type: '국내선 주차장',
        rates: [
          { label: '30분', price: '1,200원' },
          { label: '1시간', price: '2,400원' },
          { label: '1일', price: '12,000원' },
        ],
        discountInfo: '경차 50% 할인',
      },
      {
        type: '국제선 주차장',
        rates: [
          { label: '30분', price: '1,200원' },
          { label: '1시간', price: '2,400원' },
          { label: '1일', price: '12,000원' },
        ],
      },
      {
        type: '화물청사 주차장',
        rates: [
          { label: '30분', price: '600원' },
          { label: '1일', price: '8,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '지하철 (5호선·9호선·공항철도)',
        description: '김포공항역 (5·9호선, 공항철도) 도보 5분 이내',
        estimatedCost: '1,400~2,000원',
        estimatedTime: '도심까지 30~50분',
      },
      {
        type: '리무진버스',
        description: '강남, 수원, 인천 등 수도권 주요 지역 운행',
        estimatedCost: '7,000~15,000원',
        estimatedTime: '40~70분',
      },
      {
        type: '택시',
        description: '서울 도심까지 약 30~40분',
        estimatedCost: '20,000~35,000원',
        estimatedTime: '30~40분',
      },
    ],
    congestionTips: [
      { period: '오전 6~8시', level: 'high', description: '국내선 첫 출발편 (제주·김해행) 집중' },
      { period: '오전 9시~오후 12시', level: 'medium', description: '국내·국제선 평균 이용률' },
      { period: '오후 5~7시', level: 'high', description: '퇴근 시간대, 제주행 저녁 출발편 혼잡' },
    ],
    website: 'https://www.airport.co.kr/gimpo',
  },

  'PUS': {
    operatingHours: '05:00~24:00',
    parking: [
      {
        type: '국내선 주차장',
        rates: [
          { label: '30분', price: '1,000원' },
          { label: '1시간', price: '2,000원' },
          { label: '1일', price: '10,000원' },
        ],
        discountInfo: '경차 50% 할인',
      },
      {
        type: '국제선 주차장',
        rates: [
          { label: '30분', price: '1,000원' },
          { label: '1시간', price: '2,000원' },
          { label: '1일', price: '10,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '경전철 (부산-김해)',
        description: '공항역에서 사상역(2호선), 대저역 환승 가능',
        estimatedCost: '1,500~2,200원',
        estimatedTime: '사상까지 20분',
      },
      {
        type: '리무진버스',
        description: '부산역, 해운대, 서면 등 부산 시내 주요 지역 운행',
        estimatedCost: '7,000~8,000원',
        estimatedTime: '40~70분',
      },
      {
        type: '택시',
        description: '부산 시내(서면)까지 약 30분',
        estimatedCost: '15,000~25,000원',
        estimatedTime: '30~50분',
      },
    ],
    congestionTips: [
      { period: '오전 6~8시', level: 'high', description: '국내선 제주행 첫 출발편 집중' },
      { period: '오전 9시~오후 3시', level: 'medium', description: '국제선 일본행 출발편 분산' },
      { period: '오후 5~7시', level: 'high', description: '국내선 저녁 출발편 혼잡' },
    ],
    website: 'https://www.airport.co.kr/gimhae',
  },

  'CJU': {
    operatingHours: '06:00~23:00',
    parking: [
      {
        type: '국내선 주차장 (P1·P2)',
        rates: [
          { label: '30분', price: '1,000원' },
          { label: '1시간', price: '2,000원' },
          { label: '1일', price: '10,000원' },
        ],
        discountInfo: '경차 50% 할인',
      },
      {
        type: '국제선 주차장',
        rates: [
          { label: '30분', price: '1,000원' },
          { label: '1시간', price: '2,000원' },
          { label: '1일', price: '10,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '공항 리무진버스 (600번)',
        description: '중문관광단지, 서귀포 방면 운행',
        estimatedCost: '5,000원',
        estimatedTime: '중문까지 약 50분',
      },
      {
        type: '시내버스',
        description: '제주시내 주요 지역 운행 (급행 포함)',
        estimatedCost: '1,200~3,000원',
        estimatedTime: '제주시내 20~40분',
      },
      {
        type: '택시',
        description: '제주시내 약 15분, 서귀포 약 50~60분',
        estimatedCost: '제주시내 6,000원, 서귀포 35,000원',
        estimatedTime: '15~60분',
      },
      {
        type: '렌터카',
        description: '공항 주변 다수 렌터카 업체 밀집',
        estimatedCost: '1일 30,000~80,000원',
      },
    ],
    congestionTips: [
      { period: '오전 7~9시', level: 'high', description: '김포·김해행 아침 출발편 집중, 성수기 보안검색 30분 이상' },
      { period: '오전 10시~오후 3시', level: 'medium', description: '평균 이용률, 주말 약간 혼잡' },
      { period: '오후 5~8시', level: 'high', description: '귀경편 집중, 금·일요일 특히 혼잡' },
      { period: '태풍·폭설 시', level: 'high', description: '결항 다발, 대기 승객 급증' },
    ],
    website: 'https://www.airport.co.kr/jeju',
  },

  // ── Tier 2 ──
  'TAE': {
    operatingHours: '05:30~23:00',
    parking: [
      {
        type: '주차장',
        rates: [
          { label: '30분', price: '800원' },
          { label: '1시간', price: '1,600원' },
          { label: '1일', price: '8,000원' },
        ],
        discountInfo: '경차 50% 할인',
      },
    ],
    transport: [
      {
        type: '시내버스',
        description: '동대구역, 대구 시내 방면 버스 운행',
        estimatedCost: '1,400원',
        estimatedTime: '동대구역까지 30~40분',
      },
      {
        type: '택시',
        description: '대구 시내까지 약 20~30분',
        estimatedCost: '10,000~18,000원',
        estimatedTime: '20~30분',
      },
    ],
    congestionTips: [
      { period: '오전 6~8시', level: 'high', description: '제주행 아침 출발편 집중' },
      { period: '주중 오전 10시 이후', level: 'low', description: '비교적 한산' },
    ],
    website: 'https://www.airport.co.kr/daegu',
  },

  'CJJ': {
    operatingHours: '05:30~23:00',
    parking: [
      {
        type: '주차장',
        rates: [
          { label: '30분', price: '800원' },
          { label: '1시간', price: '1,600원' },
          { label: '1일', price: '8,000원' },
        ],
        discountInfo: '경차 50% 할인',
      },
    ],
    transport: [
      {
        type: '리무진버스',
        description: '청주 시내, 세종시, 대전 방면 운행',
        estimatedCost: '4,000~8,000원',
        estimatedTime: '청주 시내 30분, 대전 60분',
      },
      {
        type: '택시',
        description: '청주 시내까지 약 30분',
        estimatedCost: '15,000~20,000원',
        estimatedTime: '30분',
      },
    ],
    congestionTips: [
      { period: '오전 6~8시', level: 'high', description: '제주행·국제선 아침 출발편 집중' },
      { period: '주중 오후', level: 'low', description: '비교적 한산' },
      { period: '주말 오전', level: 'medium', description: '제주행 주말 이용객 증가' },
    ],
    website: 'https://www.airport.co.kr/cheongju',
  },

  'MWX': {
    operatingHours: '06:00~22:00',
    parking: [
      {
        type: '주차장',
        rates: [
          { label: '30분', price: '500원' },
          { label: '1시간', price: '1,000원' },
          { label: '1일', price: '5,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '리무진버스',
        description: '목포, 광주 방면 공항버스 운행',
        estimatedCost: '6,000~10,000원',
        estimatedTime: '목포 40분, 광주 70분',
      },
      {
        type: '택시',
        description: '무안·목포까지 약 30~40분',
        estimatedCost: '20,000~30,000원',
        estimatedTime: '30~40분',
      },
    ],
    congestionTips: [
      { period: '오전 출발편 시간', level: 'medium', description: '제주행·국제선 출발 시 일시적 혼잡' },
      { period: '그 외 시간대', level: 'low', description: '대부분 한산' },
    ],
    website: 'https://www.airport.co.kr/muan',
  },

  'KWJ': {
    operatingHours: '06:00~22:00',
    parking: [
      {
        type: '주차장',
        rates: [
          { label: '30분', price: '500원' },
          { label: '1시간', price: '1,000원' },
          { label: '1일', price: '5,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '시내버스',
        description: '광주 시내 주요 지역 버스 운행',
        estimatedCost: '1,400원',
        estimatedTime: '광주 시내 20~30분',
      },
      {
        type: '택시',
        description: '광주 시내까지 약 15~20분',
        estimatedCost: '8,000~12,000원',
        estimatedTime: '15~20분',
      },
    ],
    congestionTips: [
      { period: '오전 출발편 시간', level: 'medium', description: '제주행 출발 시 일시적 혼잡' },
      { period: '그 외 시간대', level: 'low', description: '대부분 한산' },
    ],
    website: 'https://www.airport.co.kr/gwangju',
  },

  // ── Tier 3 ──
  'RSU': {
    operatingHours: '06:00~22:00',
    parking: [
      {
        type: '주차장',
        rates: [
          { label: '30분', price: '500원' },
          { label: '1시간', price: '1,000원' },
          { label: '1일', price: '5,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '시내버스·택시',
        description: '여수 시내까지 버스 또는 택시 이용',
        estimatedCost: '택시 8,000~12,000원',
        estimatedTime: '여수 시내 15~20분',
      },
    ],
    congestionTips: [
      { period: '출발편 시간대', level: 'medium', description: '김포행 출발 시 일시적 혼잡' },
      { period: '그 외', level: 'low', description: '한산' },
    ],
  },

  'USN': {
    operatingHours: '06:00~22:00',
    parking: [
      {
        type: '주차장',
        rates: [
          { label: '30분', price: '500원' },
          { label: '1시간', price: '1,000원' },
          { label: '1일', price: '5,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '시내버스·택시',
        description: '울산 시내까지 버스 또는 택시 이용',
        estimatedCost: '택시 10,000~15,000원',
        estimatedTime: '울산 시내 20~30분',
      },
    ],
    congestionTips: [
      { period: '출발편 시간대', level: 'medium', description: '김포·제주행 출발 시 혼잡' },
      { period: '그 외', level: 'low', description: '한산' },
    ],
  },

  'KPO': {
    operatingHours: '06:00~22:00',
    parking: [
      {
        type: '주차장',
        rates: [
          { label: '30분', price: '500원' },
          { label: '1시간', price: '1,000원' },
          { label: '1일', price: '5,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '시내버스·택시',
        description: '포항·경주 시내까지 버스 또는 택시 이용',
        estimatedCost: '택시 10,000~15,000원',
        estimatedTime: '포항 시내 20분, 경주 40분',
      },
    ],
    congestionTips: [
      { period: '출발편 시간대', level: 'medium', description: '김포·제주행 출발 시 혼잡' },
      { period: '그 외', level: 'low', description: '한산' },
    ],
  },

  'WJU': {
    operatingHours: '06:00~22:00',
    parking: [
      {
        type: '주차장',
        rates: [
          { label: '30분', price: '500원' },
          { label: '1시간', price: '1,000원' },
          { label: '1일', price: '5,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '시내버스·택시',
        description: '원주 시내까지 버스 또는 택시 이용',
        estimatedCost: '택시 10,000~15,000원',
        estimatedTime: '원주 시내 20분',
      },
    ],
    congestionTips: [
      { period: '출발편 시간대', level: 'low', description: '소규모 공항, 대부분 한산' },
    ],
  },

  'KUV': {
    operatingHours: '06:00~22:00',
    parking: [
      {
        type: '주차장',
        rates: [
          { label: '30분', price: '500원' },
          { label: '1시간', price: '1,000원' },
          { label: '1일', price: '5,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '시내버스·택시',
        description: '군산 시내까지 버스 또는 택시 이용',
        estimatedCost: '택시 8,000~12,000원',
        estimatedTime: '군산 시내 15분',
      },
    ],
    congestionTips: [
      { period: '출발편 시간대', level: 'low', description: '소규모 공항, 대부분 한산' },
    ],
  },

  'SHO': {
    operatingHours: '06:00~22:00',
    parking: [
      {
        type: '주차장',
        rates: [
          { label: '30분', price: '500원' },
          { label: '1시간', price: '1,000원' },
          { label: '1일', price: '5,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '리무진버스',
        description: '속초·양양 시내, 강릉 방면 운행',
        estimatedCost: '4,000~6,000원',
        estimatedTime: '속초 20분, 강릉 50분',
      },
      {
        type: '택시',
        description: '속초까지 약 20분',
        estimatedCost: '15,000~20,000원',
        estimatedTime: '20분',
      },
    ],
    congestionTips: [
      { period: '주말·성수기', level: 'medium', description: '관광 수요 증가 시 혼잡' },
      { period: '주중', level: 'low', description: '대부분 한산' },
    ],
    website: 'https://www.airport.co.kr/yangyang',
  },

  'HIN': {
    operatingHours: '06:00~22:00',
    parking: [
      {
        type: '주차장',
        rates: [
          { label: '30분', price: '500원' },
          { label: '1시간', price: '1,000원' },
          { label: '1일', price: '5,000원' },
        ],
      },
    ],
    transport: [
      {
        type: '시내버스·택시',
        description: '사천·진주 시내까지 버스 또는 택시 이용',
        estimatedCost: '택시 10,000~15,000원',
        estimatedTime: '진주 시내 30분',
      },
    ],
    congestionTips: [
      { period: '출발편 시간대', level: 'low', description: '소규모 공항, 대부분 한산' },
    ],
  },
};

/**
 * 한국 공항 부가 정보 (주차·교통·혼잡도) 조회
 */
export function getKoreanAirportExtra(code: string): KoreanAirportExtra | null {
  return koreanAirportExtraMap[code] || null;
}
