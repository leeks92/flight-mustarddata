/**
 * 항공편 정기운항 시간표 데이터 수집
 *
 * 1. 인천국제공항공사 (공공데이터포털) — ICN 출발/도착 국제선
 *    API: https://www.data.go.kr/data/15095059/openapi.do
 *
 * 2. TAGO (국토교통부) — 14개 국내공항 국내선 운항정보
 *    API: https://www.data.go.kr/data/15098526/openapi.do
 *
 * 사용법: npm run fetch-data  (.env 파일에서 FLIGHT_API_KEY 자동 로드)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

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

/** TAGO API 공항 항목 */
interface TagoAirport {
  airportId: string;   // e.g., NAARKSS
  airportNm: string;   // e.g., 김포
}

/** TAGO API 항공편 항목 */
interface TagoFlightItem {
  vihicleId: string;      // 항공편명 (OZ8903)
  airlineNm?: string;     // 항공사명
  depPlandTime: number;   // 출발시간 (YYYYMMDDHHmm 숫자)
  arrPlandTime: number;   // 도착시간
  depAirportNm: string;   // 출발공항명
  arrAirportNm: string;   // 도착공항명
  economyCharge?: number;
  prestigeCharge?: number;
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
const DATA_DIR = path.join(process.cwd(), 'data');

// 인천공항공사 여객기 정기운항편 일정 정보 API (HTTPS)
const DEPARTURE_URL = 'https://apis.data.go.kr/B551177/PaxFltSched/getPaxFltSchedDepartures';
const ARRIVAL_URL = 'https://apis.data.go.kr/B551177/PaxFltSched/getPaxFltSchedArrivals';

// TAGO 국내항공운항정보 API (국토교통부)
const TAGO_BASE_URL = 'http://apis.data.go.kr/1613000/DmstcFlightNvgInfoService';

// 공항명 → IATA 코드 매핑
const AIRPORT_NAME_TO_IATA: Record<string, string> = {
  '김포': 'GMP', '김해': 'PUS', '제주': 'CJU', '대구': 'TAE',
  '광주': 'KWJ', '울산': 'USN', '여수': 'RSU', '사천': 'HIN',
  '포항': 'KPO', '군산': 'KUV', '원주': 'WJU', '양양': 'YNY',
  '무안': 'MWX', '청주': 'CJJ', '인천': 'ICN',
};

// IATA 코드 → 공항 한글명
const IATA_TO_NAME: Record<string, string> = {
  GMP: '김포', PUS: '김해', CJU: '제주', TAE: '대구', KWJ: '광주',
  USN: '울산', RSU: '여수', HIN: '사천', KPO: '포항', KUV: '군산',
  WJU: '원주', YNY: '양양', MWX: '무안', CJJ: '청주',
};

// 편명 접두사 → 항공사명 (TAGO API에서 airlineNm 누락 시 사용)
const FLIGHT_PREFIX_TO_AIRLINE: Record<string, string> = {
  'KE': '대한항공', 'OZ': '아시아나항공', 'LJ': '진에어',
  '7C': '제주항공', 'TW': '티웨이항공', 'BX': '에어부산',
  'RS': '에어서울', 'ZE': '이스타항공', 'YP': '에어프레미아',
  'RF': '에어로케이', '4V': '플라이강원', 'PTA': '파라타항공',
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

/** 편명에서 항공사명 추론 (TAGO airlineNm 누락 시) */
function resolveAirlineName(airlineNm: string | undefined, vihicleId: string): string {
  if (airlineNm) return String(airlineNm);
  const id = String(vihicleId || '');
  // "PTA/6501" → "PTA", "OZ8903" → "OZ", "7C101" → "7C"
  const prefix = id.includes('/') ? id.split('/')[0] : id.replace(/\d+$/, '');
  return FLIGHT_PREFIX_TO_AIRLINE[prefix] || prefix;
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

// ===== TAGO 국내선 API =====

/** TAGO JSON API 호출 */
async function fetchTagoJson(endpoint: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const queryParts = [`serviceKey=${SERVICE_KEY}`, '_type=json'];
  for (const [key, value] of Object.entries(params)) {
    queryParts.push(`${key}=${encodeURIComponent(value)}`);
  }
  const url = `${TAGO_BASE_URL}/${endpoint}?${queryParts.join('&')}`;

  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }

  if (text.startsWith('<?xml') || text.startsWith('<')) {
    const errMatch = text.match(/returnAuthMsg>([^<]+)/);
    throw new Error(`API 에러: ${errMatch?.[1] || text.substring(0, 200)}`);
  }

  return JSON.parse(text);
}

/** TAGO 공항 목록 조회 */
async function fetchTagoAirports(): Promise<TagoAirport[]> {
  const data = await fetchTagoJson('getArprtList', {}) as { response: { header: { resultCode: string; resultMsg: string }; body: { items: { item: TagoAirport | TagoAirport[] } } } };

  if (data.response?.header?.resultCode !== '00') {
    throw new Error(`공항 목록 조회 실패: ${data.response?.header?.resultMsg}`);
  }

  const items = data.response?.body?.items?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

/** TAGO 특정 노선+날짜의 항공편 조회 */
async function fetchTagoFlights(depAirportId: string, arrAirportId: string, date: string): Promise<TagoFlightItem[]> {
  const allItems: TagoFlightItem[] = [];
  let pageNo = 1;
  const numOfRows = 200;

  while (true) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await fetchTagoJson('getFlightOpratInfoList', {
        depAirportId,
        arrAirportId,
        depPlandTime: date,
        numOfRows: String(numOfRows),
        pageNo: String(pageNo),
      }) as any;

      if (data.response?.header?.resultCode !== '00') break;

      const totalCount = data.response?.body?.totalCount || 0;
      if (totalCount === 0) break;

      const items = data.response?.body?.items?.item;
      if (!items) break;

      const itemList = Array.isArray(items) ? items : [items];
      allItems.push(...itemList);

      if (allItems.length >= totalCount) break;
      pageNo++;
      await delay(300);
    } catch {
      break;
    }
  }

  return allItems;
}

/** RouteData에 항공편 추가 (중복 방지) */
function addFlightToRoute(routeMap: Map<string, RouteData>, routeKey: string, routeInfo: Omit<RouteData, 'flights'>, flight: FlightEntry): void {
  if (!routeMap.has(routeKey)) {
    routeMap.set(routeKey, { ...routeInfo, flights: [] });
  }
  const route = routeMap.get(routeKey)!;
  const exists = route.flights.find(f => f.flightId === flight.flightId && f.scheduleTime === flight.scheduleTime);
  if (!exists) {
    route.flights.push(flight);
  }
}

/** TAGO 국내선 데이터 수집 → depRouteMap/arrRouteMap에 추가 */
async function collectTagoDomesticData(
  depRouteMap: Map<string, RouteData>,
  arrRouteMap: Map<string, RouteData>,
  allAirportMap: Map<string, string>
): Promise<void> {
  console.log('\n[2/2] TAGO 국내선 데이터 수집');

  // 1. 공항 목록 조회
  let tagoAirports: TagoAirport[];
  try {
    tagoAirports = await fetchTagoAirports();
    console.log(`  공항 ${tagoAirports.length}개 확인`);
  } catch (error) {
    console.error('  TAGO 공항 목록 조회 실패:', error);
    return;
  }

  // 2. 공항 ID→IATA 매핑 (ICN 제외 — ICN은 공공데이터포털에서 수집)
  const airportIdToIata = new Map<string, string>();
  const domesticAirports: TagoAirport[] = [];

  for (const apt of tagoAirports) {
    const iata = AIRPORT_NAME_TO_IATA[apt.airportNm];
    if (iata && iata !== 'ICN') {
      airportIdToIata.set(apt.airportId, iata);
      allAirportMap.set(iata, IATA_TO_NAME[iata] || apt.airportNm);
      domesticAirports.push(apt);
      console.log(`    ${apt.airportNm} → ${iata} (${apt.airportId})`);
    }
  }

  // 3. 7일간 날짜 생성 (오늘~6일 후 → 모든 요일 커버)
  const dayKeys: (keyof FlightEntry['days'])[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dates: { dateStr: string; dayKey: keyof FlightEntry['days'] }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      dateStr: d.toISOString().slice(0, 10).replace(/-/g, ''),
      dayKey: dayKeys[d.getDay()],
    });
  }
  console.log(`  조회 기간: ${dates[0].dateStr} ~ ${dates[6].dateStr}`);

  const firstDateFormatted = formatDate(dates[0].dateStr);
  const lastDateFormatted = formatDate(dates[6].dateStr);

  // 4. 모든 공항 쌍 조회 — 1단계: 활성 노선 탐색 (첫째날 + 넷째날)
  type AirportPair = { dep: TagoAirport; arr: TagoAirport };
  const activePairs: AirportPair[] = [];
  const pairCount = domesticAirports.length * (domesticAirports.length - 1);
  let checked = 0;

  console.log(`\n  활성 노선 탐색 (${pairCount}쌍)...`);

  for (const depApt of domesticAirports) {
    for (const arrApt of domesticAirports) {
      if (depApt.airportId === arrApt.airportId) continue;
      checked++;

      // 첫째 날 조회
      await delay(250);
      try {
        let flights = await fetchTagoFlights(depApt.airportId, arrApt.airportId, dates[0].dateStr);
        if (flights.length === 0) {
          // 다른 요일에만 운항할 수 있으므로 +3일도 확인
          await delay(250);
          flights = await fetchTagoFlights(depApt.airportId, arrApt.airportId, dates[3].dateStr);
        }
        if (flights.length > 0) {
          activePairs.push({ dep: depApt, arr: arrApt });
        }
      } catch {
        // skip
      }

      if (checked % 20 === 0) {
        console.log(`    ${checked}/${pairCount} 확인... (활성: ${activePairs.length})`);
      }
    }
  }

  console.log(`  활성 노선: ${activePairs.length}개 발견\n`);

  // 5. 활성 노선별 7일 전체 조회 → 요일별 스케줄 구축
  let totalFlights = 0;

  for (const { dep: depApt, arr: arrApt } of activePairs) {
    const depIata = airportIdToIata.get(depApt.airportId)!;
    const arrIata = airportIdToIata.get(arrApt.airportId)!;
    const depName = IATA_TO_NAME[depIata] || depApt.airportNm;
    const arrName = IATA_TO_NAME[arrIata] || arrApt.airportNm;

    // 각 항공편의 운항 요일 추적: key="편명|출발시각"
    const flightDays = new Map<string, {
      airline: string;
      flightId: string;
      scheduleTime: string;
      days: Set<keyof FlightEntry['days']>;
    }>();

    for (const dateInfo of dates) {
      await delay(250);
      try {
        const flights = await fetchTagoFlights(depApt.airportId, arrApt.airportId, dateInfo.dateStr);
        for (const f of flights) {
          const timeStr = String(f.depPlandTime).slice(8, 12);
          const scheduleTime = formatTime(timeStr);
          if (!scheduleTime) continue;

          const flightId = String(f.vihicleId || '');
          const key = `${flightId}|${scheduleTime}`;

          if (!flightDays.has(key)) {
            flightDays.set(key, {
              airline: resolveAirlineName(f.airlineNm, f.vihicleId),
              flightId,
              scheduleTime,
              days: new Set(),
            });
          }
          flightDays.get(key)!.days.add(dateInfo.dayKey);
        }
      } catch {
        // skip
      }
    }

    if (flightDays.size === 0) continue;

    // RouteData 구축
    const routeKey = `${depIata}-${arrIata}`;
    const routeInfo = {
      depAirportCode: depIata,
      depAirportName: depName,
      arrAirportCode: arrIata,
      arrAirportName: arrName,
    };

    for (const [, fInfo] of flightDays) {
      const flight: FlightEntry = {
        airline: fInfo.airline,
        flightId: fInfo.flightId,
        scheduleTime: fInfo.scheduleTime,
        days: {
          mon: fInfo.days.has('mon'),
          tue: fInfo.days.has('tue'),
          wed: fInfo.days.has('wed'),
          thu: fInfo.days.has('thu'),
          fri: fInfo.days.has('fri'),
          sat: fInfo.days.has('sat'),
          sun: fInfo.days.has('sun'),
        },
        firstDate: firstDateFormatted,
        lastDate: lastDateFormatted,
        season: '',
      };

      addFlightToRoute(depRouteMap, routeKey, routeInfo, flight);
      addFlightToRoute(arrRouteMap, routeKey, routeInfo, flight);
    }

    totalFlights += flightDays.size;
    console.log(`    ${depName}(${depIata}) → ${arrName}(${arrIata}): ${flightDays.size}편`);
  }

  console.log(`\n  TAGO 수집 완료: ${activePairs.length}개 노선, ${totalFlights}편`);
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
  routes.forEach(route => {
    route.flights.sort((a, b) => a.scheduleTime.localeCompare(b.scheduleTime));
  });
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

  // ── 2. TAGO 국내선 데이터 수집 ──
  await collectTagoDomesticData(depRouteMap, arrRouteMap, allAirportMap);

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
