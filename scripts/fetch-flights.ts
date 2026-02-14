/**
 * 항공편 정기운항 시간표 데이터 수집
 *
 * 1. 인천국제공항공사 (공공데이터포털) — ICN 출발/도착 국제선
 *    API: https://www.data.go.kr/data/15095059/openapi.do
 *
 * 2. 한국공항공사 (KAC) — 14개 국내공항 국내선/국제선
 *    국내선: http://openapi.airport.co.kr/service/rest/DflightScheduleList
 *    국제선: http://openapi.airport.co.kr/service/rest/IflightScheduleList
 *
 * 사용법: npm run fetch-data  (.env 파일에서 FLIGHT_API_KEY, KAC_API_KEY 자동 로드)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';

// ===== 타입 정의 =====

/** 인천공항 API 응답 항목 (정기운항편) */
interface ScheduleItem {
  airline: string;      // 항공사명
  airport: string;      // 출발/도착지 공항명
  airportcode: string;  // 출발/도착지 공항 IATA 코드
  flightid: string;     // 편명
  st: string;           // 정기운항 시간 (HHmm)
  firstdate: string;    // 정기운항 시작일 (YYYYMMDD)
  lastdate: string;     // 정기운항 종료일 (YYYYMMDD)
  season: string;       // 시즌명 (W21, S22 등)
  monday: string;       // 월요일 취항 (Y/N)
  tuesday: string;      // 화요일 취항
  wednesday: string;    // 수요일 취항
  thursday: string;     // 목요일 취항
  friday: string;       // 금요일 취항
  saturday: string;     // 토요일 취항
  sunday: string;       // 일요일 취항
}

/** KAC 국내선 API 응답 항목 */
interface KacDomesticItem {
  airlineKorean: string;       // 항공사명 (한글)
  startcity: string;           // 출발 도시명
  arrivalcity: string;         // 도착 도시명
  domesticNum: string;         // 편명
  domesticStartTime: string;   // 출발 시간 (HHmm)
  domesticArrivalTime: string; // 도착 시간 (HHmm)
  domesticMon: string;         // 월요일 (Y/N)
  domesticTue: string;         // 화요일
  domesticWed: string;         // 수요일
  domesticThu: string;         // 목요일
  domesticFri: string;         // 금요일
  domesticSat: string;         // 토요일
  domesticSun: string;         // 일요일
  domesticStdate: string;      // 운항 시작일
  domesticEddate: string;      // 운항 종료일
}

/** KAC 국제선 API 응답 항목 */
interface KacInternationalItem {
  airlineKorean: string;         // 항공사명 (한글)
  airport: string;               // 공항명
  city: string;                  // 도시명
  internationalIoType: string;   // IN(도착)/OUT(출발)
  internationalNum: string;      // 편명
  internationalTime: string;     // 시간 (HHmm)
  internationalMon: string;      // 월요일 (Y/N)
  internationalTue: string;      // 화요일
  internationalWed: string;      // 수요일
  internationalThu: string;      // 목요일
  internationalFri: string;      // 금요일
  internationalSat: string;      // 토요일
  internationalSun: string;      // 일요일
  internationalStdate: string;   // 운항 시작일
  internationalEddate: string;   // 운항 종료일
}

interface Airport {
  airportCode: string;
  airportName: string;
}

interface FlightEntry {
  airline: string;
  flightId: string;
  scheduleTime: string; // HH:mm
  days: {
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thu: boolean;
    fri: boolean;
    sat: boolean;
    sun: boolean;
  };
  firstDate: string;    // YYYY-MM-DD
  lastDate: string;     // YYYY-MM-DD
  season: string;
}

interface RouteData {
  depAirportCode: string;
  depAirportName: string;
  arrAirportCode: string;
  arrAirportName: string;
  flights: FlightEntry[];
}

interface Metadata {
  lastUpdated: string;
  season: string;
  airportCount: number;
  departureRouteCount: number;
  arrivalRouteCount: number;
}

// ===== 설정 =====

const SERVICE_KEY = process.env.FLIGHT_API_KEY || '';
const KAC_SERVICE_KEY = process.env.KAC_API_KEY || '';
const DATA_DIR = path.join(process.cwd(), 'data');

// 인천공항공사 여객기 정기운항편 일정 정보 API (HTTPS)
const DEPARTURE_URL = 'https://apis.data.go.kr/B551177/PaxFltSched/getPaxFltSchedDepartures';
const ARRIVAL_URL = 'https://apis.data.go.kr/B551177/PaxFltSched/getPaxFltSchedArrivals';

// 한국공항공사 (KAC) API
const KAC_DOMESTIC_URL = 'http://openapi.airport.co.kr/service/rest/DflightScheduleList/getDflightScheduleList';
const KAC_INTERNATIONAL_URL = 'http://openapi.airport.co.kr/service/rest/IflightScheduleList/getIflightScheduleList';

// KAC 관할 14개 공항
const KAC_AIRPORTS = ['GMP', 'PUS', 'CJU', 'TAE', 'KWJ', 'USN', 'RSU', 'HIN', 'KPO', 'KUV', 'WJU', 'YNY', 'MWX', 'CJJ'];

// KAC 공항 한글명
const KAC_AIRPORT_NAMES: Record<string, string> = {
  GMP: '김포', PUS: '김해', CJU: '제주', TAE: '대구', KWJ: '광주',
  USN: '울산', RSU: '여수', HIN: '사천', KPO: '포항경주', KUV: '군산',
  WJU: '원주', YNY: '양양', MWX: '무안', CJJ: '청주',
};

// KAC 도시명 → IATA 코드 매핑 (국내선)
const CITY_TO_IATA: Record<string, string> = {
  '김포': 'GMP', '김해': 'PUS', '제주': 'CJU', '대구': 'TAE', '광주': 'KWJ',
  '울산': 'USN', '여수': 'RSU', '사천': 'HIN', '포항': 'KPO', '포항경주': 'KPO',
  '군산': 'KUV', '원주': 'WJU', '양양': 'YNY', '무안': 'MWX', '청주': 'CJJ',
  '인천': 'ICN',
};

// ===== 유틸 함수 =====

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveJson(filename: string, data: unknown): void {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** 시간 포맷 (HHmm -> HH:mm) */
function formatTime(timeStr: string): string {
  if (!timeStr || timeStr.length < 4) return '';
  const padded = timeStr.padStart(4, '0');
  return `${padded.substring(0, 2)}:${padded.substring(2, 4)}`;
}

/** 날짜 포맷 (YYYYMMDD -> YYYY-MM-DD) */
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) return '';
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
}

/** 오늘 날짜를 YYYYMMDD 형식으로 반환 */
function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

// ===== 인천공항 API 호출 (페이지네이션) =====

async function fetchAllPages(url: string, type: string): Promise<ScheduleItem[]> {
  const allItems: ScheduleItem[] = [];
  let pageNo = 1;
  const numOfRows = 1000; // 최대 행 수
  let totalCount = 0;

  console.log(`\n${type} 데이터 수집 중...`);

  while (true) {
    // 공공데이터포털 API는 serviceKey를 이미 URL 인코딩된 상태로 전달해야 함
    // URLSearchParams를 사용하면 이중 인코딩되므로 직접 URL 구성
    const queryString = `serviceKey=${SERVICE_KEY}&type=json&numOfRows=${numOfRows}&pageNo=${pageNo}&lang=K`;
    const fullUrl = `${url}?${queryString}`;

    try {
      const response = await fetch(fullUrl);
      const text = await response.text();

      if (!response.ok) {
        console.error(`  - HTTP 에러: ${response.status} ${response.statusText}`);
        console.error(`  - 응답: ${text.substring(0, 500)}`);
        break;
      }

      if (!text || text.trim() === '') {
        console.log(`  - 페이지 ${pageNo}: 빈 응답`);
        break;
      }

      // XML 에러 응답 처리 (공공데이터포털 에러는 XML로만 출력됨)
      if (text.startsWith('<?xml') || text.startsWith('<')) {
        console.error(`  - XML 응답 수신:`);
        console.error(`  - ${text.substring(0, 500)}`);
        break;
      }

      const data = JSON.parse(text);

      if (data.response?.header?.resultCode !== '00') {
        console.error(`  - API 에러: ${data.response?.header?.resultCode} - ${data.response?.header?.resultMsg}`);
        break;
      }

      totalCount = data.response?.body?.totalCount || 0;
      const items = data.response?.body?.items;

      if (!items || (Array.isArray(items) && items.length === 0)) {
        break;
      }

      const itemList = Array.isArray(items) ? items : [items];
      allItems.push(...itemList);

      console.log(`  - 페이지 ${pageNo}: ${itemList.length}건 (누적 ${allItems.length}/${totalCount})`);

      if (allItems.length >= totalCount) break;

      pageNo++;
      await delay(2000); // API rate limit 대응 (2초 대기)
    } catch (error) {
      console.error(`  - 페이지 ${pageNo} 에러:`, error);
      break;
    }
  }

  console.log(`  - 총 ${allItems.length}건 수집 완료`);
  return allItems;
}

// ===== 인천공항 데이터 처리 =====

function processSchedules(items: ScheduleItem[], type: 'departure' | 'arrival'): {
  routes: RouteData[];
  airports: Airport[];
  season: string;
} {
  // 오늘 날짜 기준으로 유효한 스케줄만 필터 (운항 종료일이 오늘 이후인 것)
  const today = getTodayStr();
  const validItems = items.filter(item => {
    if (!item.lastdate) return true;
    return item.lastdate >= today;
  });

  console.log(`  - 유효 스케줄: ${validItems.length}건 (전체 ${items.length}건 중)`);

  // 시즌 추출
  const seasons = new Set(validItems.map(i => i.season).filter(Boolean));
  const season = Array.from(seasons).sort().pop() || '';

  // 공항 목록 추출
  const airportMap = new Map<string, string>();
  airportMap.set('ICN', '인천');

  validItems.forEach(item => {
    if (item.airportcode && item.airport) {
      airportMap.set(item.airportcode, item.airport);
    }
  });

  const airports: Airport[] = Array.from(airportMap.entries()).map(([code, name]) => ({
    airportCode: code,
    airportName: name,
  }));

  // 노선별 그룹핑
  const routeMap = new Map<string, RouteData>();

  validItems.forEach(item => {
    if (!item.airportcode || !item.airport) return;

    let depCode: string, depName: string, arrCode: string, arrName: string;

    if (type === 'departure') {
      depCode = 'ICN';
      depName = '인천';
      arrCode = item.airportcode;
      arrName = item.airport;
    } else {
      depCode = item.airportcode;
      depName = item.airport;
      arrCode = 'ICN';
      arrName = '인천';
    }

    const routeKey = `${depCode}-${arrCode}`;

    if (!routeMap.has(routeKey)) {
      routeMap.set(routeKey, {
        depAirportCode: depCode,
        depAirportName: depName,
        arrAirportCode: arrCode,
        arrAirportName: arrName,
        flights: [],
      });
    }

    const route = routeMap.get(routeKey)!;

    // 동일 편명+시간 중복 방지
    const existing = route.flights.find(
      f => f.flightId === item.flightid && f.scheduleTime === formatTime(item.st)
    );
    if (existing) return;

    route.flights.push({
      airline: item.airline || '',
      flightId: item.flightid || '',
      scheduleTime: formatTime(item.st),
      days: {
        mon: item.monday === 'Y',
        tue: item.tuesday === 'Y',
        wed: item.wednesday === 'Y',
        thu: item.thursday === 'Y',
        fri: item.friday === 'Y',
        sat: item.saturday === 'Y',
        sun: item.sunday === 'Y',
      },
      firstDate: formatDate(item.firstdate),
      lastDate: formatDate(item.lastdate),
      season: item.season || '',
    });
  });

  // 각 노선 내 항공편 시간순 정렬
  const routes = Array.from(routeMap.values());
  routes.forEach(route => {
    route.flights.sort((a, b) => a.scheduleTime.localeCompare(b.scheduleTime));
  });

  // 노선을 항공편 수 기준 내림차순 정렬
  routes.sort((a, b) => b.flights.length - a.flights.length);

  return { routes, airports, season };
}

// ===== KAC API =====

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false, // 숫자 자동 변환 방지 — 편명, 시간 등 문자열 유지
});

/** KAC XML API에서 모든 페이지 수집 */
async function fetchKacXmlPages(url: string, params: Record<string, string>): Promise<unknown[]> {
  const allItems: unknown[] = [];
  let pageNo = 1;
  const numOfRows = 1000;

  while (true) {
    // serviceKey가 이미 인코딩된 경우 대비: 직접 URL 구성
    const fullUrl = `${url}?serviceKey=${KAC_SERVICE_KEY}&numOfRows=${numOfRows}&pageNo=${pageNo}&${Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;

    try {
      const response = await fetch(fullUrl);
      const text = await response.text();

      if (!response.ok) {
        console.error(`    KAC HTTP 에러: ${response.status}`);
        break;
      }

      if (!text || text.trim() === '') break;

      const parsed = xmlParser.parse(text);
      const body = parsed?.response?.body;

      if (!body) {
        // 에러 응답 확인
        const errMsg = parsed?.response?.header?.resultMsg || parsed?.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg;
        if (errMsg) {
          console.error(`    KAC API 에러: ${errMsg}`);
        }
        break;
      }

      const totalCount = Number(body.totalCount) || 0;
      if (totalCount === 0) break;

      const items = body.items?.item;
      if (!items) break;

      const itemList = Array.isArray(items) ? items : [items];
      allItems.push(...itemList);

      if (allItems.length >= totalCount) break;

      pageNo++;
      await delay(500);
    } catch (error) {
      console.error(`    KAC 페이지 ${pageNo} 에러:`, error);
      break;
    }
  }

  return allItems;
}

/** KAC 국내선 수집 (특정 공항 출발) */
async function fetchKacDomestic(airportCode: string): Promise<KacDomesticItem[]> {
  const today = getTodayStr();
  const items = await fetchKacXmlPages(KAC_DOMESTIC_URL, {
    schDate: today,
    schDeptCityCode: airportCode,
  });
  return items as KacDomesticItem[];
}

/** KAC 국제선 수집 (특정 공항) */
async function fetchKacInternational(airportCode: string): Promise<KacInternationalItem[]> {
  const today = getTodayStr();
  const items = await fetchKacXmlPages(KAC_INTERNATIONAL_URL, {
    schDate: today,
    schAirCode: airportCode,
  });
  return items as KacInternationalItem[];
}

/** 도시명에서 IATA 코드 추출 */
function cityToIata(cityName: string): string | null {
  if (!cityName) return null;
  // 정확한 매칭
  if (CITY_TO_IATA[cityName]) return CITY_TO_IATA[cityName];
  // 부분 매칭 (예: "포항/경주" → "포항경주")
  const normalized = cityName.replace(/[\/\s]/g, '');
  if (CITY_TO_IATA[normalized]) return CITY_TO_IATA[normalized];
  return null;
}

/** RouteData에 항공편 추가 (중복 방지) */
function addFlightToRoute(routeMap: Map<string, RouteData>, routeKey: string, routeInfo: Omit<RouteData, 'flights'>, flight: FlightEntry): void {
  if (!routeMap.has(routeKey)) {
    routeMap.set(routeKey, { ...routeInfo, flights: [] });
  }
  const route = routeMap.get(routeKey)!;
  // 동일 편명+시간 중복 방지
  const exists = route.flights.find(f => f.flightId === flight.flightId && f.scheduleTime === flight.scheduleTime);
  if (!exists) {
    route.flights.push(flight);
  }
}

/** KAC 국내선 데이터 → RouteData 변환 */
function processKacDomestic(
  items: KacDomesticItem[],
  depAirportCode: string,
  depRouteMap: Map<string, RouteData>,
  arrRouteMap: Map<string, RouteData>
): void {
  const depName = KAC_AIRPORT_NAMES[depAirportCode] || depAirportCode;

  for (const item of items) {
    const arrCode = cityToIata(item.arrivalcity);
    if (!arrCode) continue;

    // ICN 관련 노선은 스킵 (인천은 국내선 없지만 혹시 대비)
    if (arrCode === 'ICN' || depAirportCode === 'ICN') continue;

    const arrName = KAC_AIRPORT_NAMES[arrCode] || item.arrivalcity;
    const timeStr = String(item.domesticStartTime || '').padStart(4, '0');

    const flight: FlightEntry = {
      airline: String(item.airlineKorean || ''),
      flightId: String(item.domesticNum || ''),
      scheduleTime: formatTime(timeStr),
      days: {
        mon: String(item.domesticMon) === 'Y',
        tue: String(item.domesticTue) === 'Y',
        wed: String(item.domesticWed) === 'Y',
        thu: String(item.domesticThu) === 'Y',
        fri: String(item.domesticFri) === 'Y',
        sat: String(item.domesticSat) === 'Y',
        sun: String(item.domesticSun) === 'Y',
      },
      firstDate: formatDate(String(item.domesticStdate || '')),
      lastDate: formatDate(String(item.domesticEddate || '')),
      season: '',
    };

    if (!flight.scheduleTime) continue;

    // 출발편: depAirportCode → arrCode
    const depKey = `${depAirportCode}-${arrCode}`;
    addFlightToRoute(depRouteMap, depKey, {
      depAirportCode,
      depAirportName: depName,
      arrAirportCode: arrCode,
      arrAirportName: arrName,
    }, flight);

    // 도착편: depAirportCode → arrCode (역방향)
    const arrKey = `${depAirportCode}-${arrCode}`;
    addFlightToRoute(arrRouteMap, arrKey, {
      depAirportCode,
      depAirportName: depName,
      arrAirportCode: arrCode,
      arrAirportName: arrName,
    }, flight);
  }
}

/** KAC 국제선 데이터 → RouteData 변환 */
function processKacInternational(
  items: KacInternationalItem[],
  airportCode: string,
  depRouteMap: Map<string, RouteData>,
  arrRouteMap: Map<string, RouteData>
): void {
  const airportName = KAC_AIRPORT_NAMES[airportCode] || airportCode;

  for (const item of items) {
    const ioType = String(item.internationalIoType || '').toUpperCase();
    const foreignAirport = String(item.airport || '');
    const foreignCity = String(item.city || foreignAirport);
    const timeStr = String(item.internationalTime || '').padStart(4, '0');

    // ICN 관련 노선 제외 (ICN 데이터는 공공데이터포털에서 수집)
    if (foreignAirport === 'ICN' || foreignCity.includes('인천')) continue;

    const flight: FlightEntry = {
      airline: String(item.airlineKorean || ''),
      flightId: String(item.internationalNum || ''),
      scheduleTime: formatTime(timeStr),
      days: {
        mon: String(item.internationalMon) === 'Y',
        tue: String(item.internationalTue) === 'Y',
        wed: String(item.internationalWed) === 'Y',
        thu: String(item.internationalThu) === 'Y',
        fri: String(item.internationalFri) === 'Y',
        sat: String(item.internationalSat) === 'Y',
        sun: String(item.internationalSun) === 'Y',
      },
      firstDate: formatDate(String(item.internationalStdate || '')),
      lastDate: formatDate(String(item.internationalEddate || '')),
      season: '',
    };

    if (!flight.scheduleTime) continue;

    if (ioType === 'OUT') {
      // 출발: 한국공항 → 외국공항
      const routeKey = `${airportCode}-${foreignAirport}`;
      addFlightToRoute(depRouteMap, routeKey, {
        depAirportCode: airportCode,
        depAirportName: airportName,
        arrAirportCode: foreignAirport,
        arrAirportName: foreignCity,
      }, flight);
    } else if (ioType === 'IN') {
      // 도착: 외국공항 → 한국공항
      const routeKey = `${foreignAirport}-${airportCode}`;
      addFlightToRoute(arrRouteMap, routeKey, {
        depAirportCode: foreignAirport,
        depAirportName: foreignCity,
        arrAirportCode: airportCode,
        arrAirportName: airportName,
      }, flight);
    }
  }
}

/** 기존 RouteData[]를 Map으로 변환 */
function routesToMap(routes: RouteData[]): Map<string, RouteData> {
  const map = new Map<string, RouteData>();
  for (const route of routes) {
    const key = `${route.depAirportCode}-${route.arrAirportCode}`;
    map.set(key, { ...route, flights: [...route.flights] });
  }
  return map;
}

/** Map<string, RouteData>를 정렬된 배열로 변환 */
function mapToSortedRoutes(map: Map<string, RouteData>): RouteData[] {
  const routes = Array.from(map.values());
  // 각 노선 내 항공편 시간순 정렬
  routes.forEach(route => {
    route.flights.sort((a, b) => a.scheduleTime.localeCompare(b.scheduleTime));
  });
  // 노선을 항공편 수 기준 내림차순 정렬
  routes.sort((a, b) => b.flights.length - a.flights.length);
  return routes;
}

// ===== 메인 =====

async function main() {
  console.log('========================================');
  console.log('  항공편 정기운항 데이터 수집 시작');
  console.log('========================================');

  if (!SERVICE_KEY) {
    console.error('\nFLIGHT_API_KEY 환경 변수가 설정되지 않았습니다.');
    console.log('사용법: FLIGHT_API_KEY=your_api_key tsx scripts/fetch-flights.ts');
    process.exit(1);
  }

  ensureDataDir();

  // ── 1. 인천공항 데이터 수집 (공공데이터포털) ──
  console.log('\n[1/2] 인천공항 데이터 수집 (공공데이터포털)');

  const departureItems = await fetchAllPages(DEPARTURE_URL, '출발편');
  await delay(1000);
  const arrivalItems = await fetchAllPages(ARRIVAL_URL, '도착편');

  const departureData = processSchedules(departureItems, 'departure');
  const arrivalData = processSchedules(arrivalItems, 'arrival');

  // RouteData를 Map으로 변환 (병합용)
  const depRouteMap = routesToMap(departureData.routes);
  const arrRouteMap = routesToMap(arrivalData.routes);

  // 공항 목록 (ICN + 공공데이터포털에서 수집된 공항)
  const allAirportMap = new Map<string, string>();
  [...departureData.airports, ...arrivalData.airports].forEach(a => {
    allAirportMap.set(a.airportCode, a.airportName);
  });

  // 시즌 (출발/도착 중 최신)
  const season = departureData.season || arrivalData.season || '';

  // ── 2. KAC 데이터 수집 (한국공항공사) ──
  if (KAC_SERVICE_KEY) {
    console.log('\n[2/2] KAC 데이터 수집 (한국공항공사 14개 공항)');

    for (const airportCode of KAC_AIRPORTS) {
      console.log(`\n  ${KAC_AIRPORT_NAMES[airportCode]}(${airportCode}) 수집...`);

      // KAC 공항 정보 등록
      allAirportMap.set(airportCode, KAC_AIRPORT_NAMES[airportCode]);

      // 국내선 수집
      try {
        const domesticItems = await fetchKacDomestic(airportCode);
        if (domesticItems.length > 0) {
          console.log(`    국내선: ${domesticItems.length}건`);
          processKacDomestic(domesticItems, airportCode, depRouteMap, arrRouteMap);
        } else {
          console.log(`    국내선: 0건`);
        }
      } catch (error) {
        console.error(`    국내선 에러:`, error);
      }

      await delay(500);

      // 국제선 수집
      try {
        const intlItems = await fetchKacInternational(airportCode);
        if (intlItems.length > 0) {
          console.log(`    국제선: ${intlItems.length}건`);
          processKacInternational(intlItems, airportCode, depRouteMap, arrRouteMap);
        } else {
          console.log(`    국제선: 0건`);
        }
      } catch (error) {
        console.error(`    국제선 에러:`, error);
      }

      await delay(1000); // API rate limit 대응
    }
  } else {
    console.log('\n[2/2] KAC_API_KEY 미설정 — KAC 데이터 수집 건너뜀');
  }

  // ── 3. 데이터 병합 및 저장 ──
  const finalDepRoutes = mapToSortedRoutes(depRouteMap);
  const finalArrRoutes = mapToSortedRoutes(arrRouteMap);

  // KAC 데이터에서 추가된 외국 공항명도 등록
  for (const route of [...finalDepRoutes, ...finalArrRoutes]) {
    if (!allAirportMap.has(route.depAirportCode)) {
      allAirportMap.set(route.depAirportCode, route.depAirportName);
    }
    if (!allAirportMap.has(route.arrAirportCode)) {
      allAirportMap.set(route.arrAirportCode, route.arrAirportName);
    }
  }

  const allAirports: Airport[] = Array.from(allAirportMap.entries())
    .map(([code, name]) => ({ airportCode: code, airportName: name }))
    .sort((a, b) => a.airportName.localeCompare(b.airportName, 'ko'));

  // 저장
  saveJson('airports.json', allAirports);
  saveJson('departure-routes.json', finalDepRoutes);
  saveJson('arrival-routes.json', finalArrRoutes);

  const metadata: Metadata = {
    lastUpdated: new Date().toISOString(),
    season,
    airportCount: allAirports.length,
    departureRouteCount: finalDepRoutes.length,
    arrivalRouteCount: finalArrRoutes.length,
  };
  saveJson('metadata.json', metadata);

  // 결과 출력
  console.log('\n========================================');
  console.log('  수집 완료');
  console.log('========================================');
  console.log(`  시즌: ${season}`);
  console.log(`  공항: ${allAirports.length}개`);
  console.log(`  출발 노선: ${finalDepRoutes.length}개`);
  console.log(`  출발 항공편: ${finalDepRoutes.reduce((s, r) => s + r.flights.length, 0)}건`);
  console.log(`  도착 노선: ${finalArrRoutes.length}개`);
  console.log(`  도착 항공편: ${finalArrRoutes.reduce((s, r) => s + r.flights.length, 0)}건`);

  if (finalDepRoutes.length > 0) {
    console.log('\n  인기 출발 노선 TOP 5:');
    finalDepRoutes.slice(0, 5).forEach((r, i) => {
      console.log(`    ${i + 1}. ${r.depAirportName} → ${r.arrAirportName} (${r.flights.length}편)`);
    });
  }
}

main().catch(console.error);
