export const BASE_URL = 'https://flight.mustarddata.com';
export const SITE_NAME = '항공편 시간표';

// 인기 노선 (메인, sitemap, footer 공용)
export const POPULAR_ROUTES = [
  { dep: 'ICN', arr: 'NRT', depName: '인천', arrName: '도쿄(나리타)' },
  { dep: 'ICN', arr: 'KIX', depName: '인천', arrName: '오사카(간사이)' },
  { dep: 'ICN', arr: 'HND', depName: '인천', arrName: '도쿄(하네다)' },
  { dep: 'ICN', arr: 'FUK', depName: '인천', arrName: '후쿠오카' },
  { dep: 'ICN', arr: 'BKK', depName: '인천', arrName: '방콕' },
  { dep: 'ICN', arr: 'SIN', depName: '인천', arrName: '싱가포르' },
  { dep: 'ICN', arr: 'PVG', depName: '인천', arrName: '상하이(푸동)' },
  { dep: 'ICN', arr: 'LAX', depName: '인천', arrName: '로스앤젤레스' },
];

// 주요 공항 목록 (메인, sitemap, 공항 페이지 공용)
export const MAJOR_AIRPORTS = [
  { code: 'ICN', name: '인천국제공항' },
  { code: 'GMP', name: '김포국제공항' },
  { code: 'PUS', name: '김해국제공항' },
  { code: 'CJU', name: '제주국제공항' },
  { code: 'TAE', name: '대구국제공항' },
  { code: 'CJJ', name: '청주국제공항' },
  { code: 'MWX', name: '무안국제공항' },
  { code: 'SHO', name: '속초양양국제공항' },
];

// 주요 공항 코드 (sitemap priority용)
export const MAJOR_AIRPORT_CODES = MAJOR_AIRPORTS.map(a => a.code);

// 인기 노선 slug (sitemap priority용)
export const POPULAR_ROUTE_SLUGS = POPULAR_ROUTES.map(r => `${r.dep}-${r.arr}`);
