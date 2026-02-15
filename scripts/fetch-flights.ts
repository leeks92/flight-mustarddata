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
 * 사용법: npm run fetch-data  (.env 파일에서 FLIGHT_API_KEY 자동 로드, KAC도 동일 키 사용)
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

/** KAC API 응답 항목 (국내선/국제선 공통 구조) */
interface KacFlightItem {
  airline: string;         // 항공사명 (한글)
  airlineCode: string;     // 항공사 코드
  flightid: string;        // 편명
  st: string;              // 출발/도착 시간 (HHmm)
  firstdate: string;       // 운항 시작일 (YYYYMMDD)
  lastdate: string;        // 운항 종료일 (YYYYMMDD)
  ynmon: string;           // 월요일 (Y/N)
  yntue: string;           // 화요일
  ynwed: string;           // 수요일
  ynthu: string;           // 목요일
  ynfri: string;           // 금요일
  ynsat: string;           // 토요일
  ynsun: string;           // 일요일
  depCityCode: string;     // 출발 공항 코드
  arrvCityCode: string;    // 도착 공항 코드
  depCity: string;         // 출발 도시명
  arrvCity: string;        // 도착 도시명
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
const KAC_SERVICE_KEY = process.env.KAC_API_KEY || process.env.FLIGHT_API_KEY || '';
const DATA_DIR = path.join(process.cwd(), 'data');

// 인천공항공사 여객기 정기운항편 일정 정보 API (HTTPS)
const DEPARTURE_URL = 'https://apis.data.go.kr/B551177/PaxFltSched/getPaxFltSchedDepartures';
const ARRIVAL_URL = 'https://apis.data.go.kr/B551177/PaxFltSched/getPaxFltSchedArrivals';

// 한국공항공사 (KAC) API — 공공데이터포털 경유
const KAC_DOMESTIC_URL = 'http://openapi.airport.co.kr/service/rest/statusofPaxSeasonalFlight/getDPaxSfitSched';
const KAC_INTERNATIONAL_URL = 'http://openapi.airport.co.kr/service/rest/statusofPaxSeasonalFlight/getIPaxSfitSched';

// KAC 관할 14개 공항
const KAC_AIRPORTS = ['GMP', 'PUS', 'CJU', 'TAE', 'KWJ', 'USN', 'RSU', 'HIN', 'KPO', 'KUV', 'WJU', 'YNY', 'MWX', 'CJJ'];

// KAC 공항 한글명
const KAC_AIRPORT_NAMES: Record<string, string> = {
  GMP: '김포', PUS: '김해', CJU: '제주', TAE: '대구', KWJ: '광주',
  USN: '울산', RSU: '여수', HIN: '사천', KPO: '포항경주', KUV: '군산',
  WJU: '원주', YNY: '양양', MWX: '무안', CJJ: '청주',
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
async function fetchKacDomestic(airportCode: string): Promise<KacFlightItem[]> {
  const items = await fetchKacXmlPages(KAC_DOMESTIC_URL, {
    depCityCode: airportCode,
  });
  return items as KacFlightItem[];
}

/** KAC 국제선 수집 (특정 공항 출발 + 도착) */
async function fetchKacInternational(airportCode: string): Promise<KacFlightItem[]> {
  // 출발편: depCityCode로 조회
  const depItems = await fetchKacXmlPages(KAC_INTERNATIONAL_URL, {
    depCityCode: airportCode,
  });
  await delay(500);
  // 도착편: arrvCityCode로 조회
  const arrItems = await fetchKacXmlPages(KAC_INTERNATIONAL_URL, {
    arrvCityCode: airportCode,
  });
  return [...depItems, ...arrItems] as KacFlightItem[];
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

/** KAC 항공편 항목 → FlightEntry 변환 */
function kacItemToFlight(item: KacFlightItem): FlightEntry | null {
  const timeStr = String(item.st || '').padStart(4, '0');
  const scheduleTime = formatTime(timeStr);
  if (!scheduleTime) return null;

  return {
    airline: String(item.airline || ''),
    flightId: String(item.flightid || ''),
    scheduleTime,
    days: {
      mon: String(item.ynmon) === 'Y',
      tue: String(item.yntue) === 'Y',
      wed: String(item.ynwed) === 'Y',
      thu: String(item.ynthu) === 'Y',
      fri: String(item.ynfri) === 'Y',
      sat: String(item.ynsat) === 'Y',
      sun: String(item.ynsun) === 'Y',
    },
    firstDate: formatDate(String(item.firstdate || '')),
    lastDate: formatDate(String(item.lastdate || '')),
    season: '',
  };
}

/** KAC 국내선 데이터 → RouteData 변환 */
function processKacDomestic(
  items: KacFlightItem[],
  depAirportCode: string,
  depRouteMap: Map<string, RouteData>,
  arrRouteMap: Map<string, RouteData>
): void {
  for (const item of items) {
    const depCode = String(item.depCityCode || depAirportCode);
    const arrCode = String(item.arrvCityCode || '');
    if (!arrCode) continue;

    // ICN 관련 노선은 스킵
    if (arrCode === 'ICN' || depCode === 'ICN') continue;

    const depName = KAC_AIRPORT_NAMES[depCode] || String(item.depCity || depCode);
    const arrName = KAC_AIRPORT_NAMES[arrCode] || String(item.arrvCity || arrCode);

    const flight = kacItemToFlight(item);
    if (!flight) continue;

    // 출발편
    const depKey = `${depCode}-${arrCode}`;
    addFlightToRoute(depRouteMap, depKey, {
      depAirportCode: depCode,
      depAirportName: depName,
      arrAirportCode: arrCode,
      arrAirportName: arrName,
    }, flight);

    // 도착편 (역방향)
    const arrKey = `${depCode}-${arrCode}`;
    addFlightToRoute(arrRouteMap, arrKey, {
      depAirportCode: depCode,
      depAirportName: depName,
      arrAirportCode: arrCode,
      arrAirportName: arrName,
    }, flight);
  }
}

/** KAC 국제선 데이터 → RouteData 변환 */
function processKacInternational(
  items: KacFlightItem[],
  airportCode: string,
  depRouteMap: Map<string, RouteData>,
  arrRouteMap: Map<string, RouteData>
): void {
  for (const item of items) {
    const depCode = String(item.depCityCode || '');
    const arrCode = String(item.arrvCityCode || '');
    if (!depCode || !arrCode) continue;

    // ICN 관련 노선 제외 (ICN 데이터는 공공데이터포털에서 수집)
    if (depCode === 'ICN' || arrCode === 'ICN') continue;

    const depName = KAC_AIRPORT_NAMES[depCode] || String(item.depCity || depCode);
    const arrName = KAC_AIRPORT_NAMES[arrCode] || String(item.arrvCity || arrCode);

    const flight = kacItemToFlight(item);
    if (!flight) continue;

    // depCityCode가 한국 공항이면 출발편, 아니면 도착편
    const isDepFromKorea = KAC_AIRPORTS.includes(depCode);

    if (isDepFromKorea) {
      const routeKey = `${depCode}-${arrCode}`;
      addFlightToRoute(depRouteMap, routeKey, {
        depAirportCode: depCode,
        depAirportName: depName,
        arrAirportCode: arrCode,
        arrAirportName: arrName,
      }, flight);
    } else {
      const routeKey = `${depCode}-${arrCode}`;
      addFlightToRoute(arrRouteMap, routeKey, {
        depAirportCode: depCode,
        depAirportName: depName,
        arrAirportCode: arrCode,
        arrAirportName: arrName,
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
