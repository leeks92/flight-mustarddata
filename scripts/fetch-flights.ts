/**
 * 인천국제공항공사 여객기 정기운항편 일정 정보 데이터 수집
 * API: https://www.data.go.kr/data/15095059/openapi.do
 *
 * 정기 운항 스케줄 (시즌별: 하계 3월말~10월말 / 동계 10월말~익년 3월말)
 * - 항공사명, 공항명, 공항코드, 편명, 출발시간, 요일별 취항여부
 * - 정기운항 시작일/종료일, 시즌 코드
 *
 * 사용법: npm run fetch-data  (.env 파일에서 FLIGHT_API_KEY 자동 로드)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// ===== 타입 정의 =====

/** API 응답 항목 (정기운항편) */
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

// ===== API 호출 (페이지네이션) =====

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

// ===== 데이터 처리 =====

function processSchedules(items: ScheduleItem[], type: 'departure' | 'arrival'): {
  routes: RouteData[];
  airports: Airport[];
  season: string;
} {
  // 오늘 날짜 기준으로 유효한 스케줄만 필터 (운항 종료일이 오늘 이후인 것)
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
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

// ===== 메인 =====

async function main() {
  console.log('========================================');
  console.log('  인천공항 정기운항편 데이터 수집 시작');
  console.log('========================================');

  if (!SERVICE_KEY) {
    console.error('\nFLIGHT_API_KEY 환경 변수가 설정되지 않았습니다.');
    console.log('사용법: FLIGHT_API_KEY=your_api_key tsx scripts/fetch-flights.ts');
    process.exit(1);
  }

  ensureDataDir();

  // 출발편 수집
  const departureItems = await fetchAllPages(DEPARTURE_URL, '출발편');
  await delay(1000);

  // 도착편 수집
  const arrivalItems = await fetchAllPages(ARRIVAL_URL, '도착편');

  // 데이터 처리
  const departureData = processSchedules(departureItems, 'departure');
  const arrivalData = processSchedules(arrivalItems, 'arrival');

  // 공항 목록 병합 (중복 제거)
  const allAirportMap = new Map<string, string>();
  [...departureData.airports, ...arrivalData.airports].forEach(a => {
    allAirportMap.set(a.airportCode, a.airportName);
  });
  const allAirports: Airport[] = Array.from(allAirportMap.entries())
    .map(([code, name]) => ({ airportCode: code, airportName: name }))
    .sort((a, b) => a.airportName.localeCompare(b.airportName, 'ko'));

  // 시즌 (출발/도착 중 최신)
  const season = departureData.season || arrivalData.season || '';

  // 저장
  saveJson('airports.json', allAirports);
  saveJson('departure-routes.json', departureData.routes);
  saveJson('arrival-routes.json', arrivalData.routes);

  const metadata: Metadata = {
    lastUpdated: new Date().toISOString(),
    season,
    airportCount: allAirports.length,
    departureRouteCount: departureData.routes.length,
    arrivalRouteCount: arrivalData.routes.length,
  };
  saveJson('metadata.json', metadata);

  // 결과 출력
  console.log('\n========================================');
  console.log('  수집 완료');
  console.log('========================================');
  console.log(`  시즌: ${season}`);
  console.log(`  공항: ${allAirports.length}개`);
  console.log(`  출발 노선: ${departureData.routes.length}개`);
  console.log(`  출발 항공편: ${departureData.routes.reduce((s, r) => s + r.flights.length, 0)}건`);
  console.log(`  도착 노선: ${arrivalData.routes.length}개`);
  console.log(`  도착 항공편: ${arrivalData.routes.reduce((s, r) => s + r.flights.length, 0)}건`);

  if (departureData.routes.length > 0) {
    console.log('\n  인기 출발 노선 TOP 5:');
    departureData.routes.slice(0, 5).forEach((r, i) => {
      console.log(`    ${i + 1}. ${r.depAirportName} → ${r.arrAirportName} (${r.flights.length}편)`);
    });
  }
}

main().catch(console.error);
