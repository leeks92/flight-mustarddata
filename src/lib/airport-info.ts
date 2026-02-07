/**
 * 공항 상세 정보 (주소, 전화번호 등)
 */

interface AirportInfo {
  name: string;
  address: string;
  telephone: string;
  domestic: boolean; // 국내선 운항 여부
  international: boolean; // 국제선 운항 여부
}

// 주요 공항 정보 매핑
const airportInfoMap: Record<string, AirportInfo> = {
  'ICN': {
    name: '인천국제공항',
    address: '인천광역시 중구 공항로 272',
    telephone: '1577-2600',
    domestic: false,
    international: true,
  },
  'GMP': {
    name: '김포국제공항',
    address: '서울특별시 강서구 하늘길 112',
    telephone: '02-2660-2114',
    domestic: true,
    international: true,
  },
  'PUS': {
    name: '김해국제공항',
    address: '부산광역시 강서구 공항진입로 108',
    telephone: '051-974-3114',
    domestic: true,
    international: true,
  },
  'CJU': {
    name: '제주국제공항',
    address: '제주특별자치도 제주시 공항로 2',
    telephone: '064-797-2114',
    domestic: true,
    international: true,
  },
  'TAE': {
    name: '대구국제공항',
    address: '대구광역시 동구 공항로 221',
    telephone: '053-980-5114',
    domestic: true,
    international: true,
  },
  'CJJ': {
    name: '청주국제공항',
    address: '충청북도 청주시 흥덕구 강내면 남사리 산55',
    telephone: '043-210-6114',
    domestic: true,
    international: true,
  },
  'KWJ': {
    name: '광주공항',
    address: '광주광역시 광산구 상무대로 420',
    telephone: '062-942-0114',
    domestic: true,
    international: false,
  },
  'RSU': {
    name: '여수공항',
    address: '전라남도 여수시 율촌면 여수산단1로 82',
    telephone: '061-683-5114',
    domestic: true,
    international: false,
  },
  'USN': {
    name: '울산공항',
    address: '울산광역시 북구 산업로 1103',
    telephone: '052-219-0114',
    domestic: true,
    international: false,
  },
  'KPO': {
    name: '포항경주공항',
    address: '경상북도 포항시 남구 동해면 공항로 57',
    telephone: '054-284-0114',
    domestic: true,
    international: false,
  },
  'WJU': {
    name: '원주공항',
    address: '강원특별자치도 횡성군 횡성읍 횡성로 166',
    telephone: '033-340-8114',
    domestic: true,
    international: false,
  },
  'KUV': {
    name: '군산공항',
    address: '전북특별자치도 군산시 공항로 63',
    telephone: '063-469-8114',
    domestic: true,
    international: false,
  },
  'SHO': {
    name: '속초양양국제공항',
    address: '강원특별자치도 양양군 손양면 동해대로 596',
    telephone: '033-670-7114',
    domestic: true,
    international: true,
  },
  'MWX': {
    name: '무안국제공항',
    address: '전라남도 무안군 망운면 공항로 970-260',
    telephone: '061-455-2114',
    domestic: true,
    international: true,
  },
  'HIN': {
    name: '사천공항',
    address: '경상남도 사천시 사천읍 비행장길 47',
    telephone: '055-851-0114',
    domestic: true,
    international: false,
  },
};

export function getAirportInfo(airportCode: string): AirportInfo | null {
  return airportInfoMap[airportCode] || null;
}

export function getAllAirportInfo(): Record<string, AirportInfo> {
  return airportInfoMap;
}
