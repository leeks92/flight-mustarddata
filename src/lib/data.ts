import * as fs from 'fs';
import * as path from 'path';
import type { Airport, DaysOfWeek, RouteData, Metadata } from './types';

const dataDir = path.join(process.cwd(), 'data');

// 모듈 레벨 캐시 (빌드 시 동일 파일 반복 읽기 방지)
const cache = new Map<string, unknown>();

// JSON 파일 로드 헬퍼 (캐시 적용)
function loadJson<T>(filename: string): T | null {
  if (cache.has(filename)) {
    return cache.get(filename) as T;
  }
  try {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content) as T;
    cache.set(filename, parsed);
    return parsed;
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return null;
  }
}

// 공항 목록
export function getAirports(): Airport[] {
  return loadJson<Airport[]>('airports.json') || [];
}

// 출발편 노선 목록
export function getDepartureRoutes(): RouteData[] {
  return loadJson<RouteData[]>('departure-routes.json') || [];
}

// 도착편 노선 목록
export function getArrivalRoutes(): RouteData[] {
  return loadJson<RouteData[]>('arrival-routes.json') || [];
}

// 모든 노선 (출발 + 도착)
export function getAllRoutes(): RouteData[] {
  return [...getDepartureRoutes(), ...getArrivalRoutes()];
}

// 메타데이터
export function getMetadata(): Metadata | null {
  return loadJson<Metadata>('metadata.json');
}

// 특정 출발 노선 조회
export function getDepartureRoute(
  depAirportCode: string,
  arrAirportCode: string
): RouteData | null {
  const routes = getDepartureRoutes();
  return (
    routes.find(
      r => r.depAirportCode === depAirportCode && r.arrAirportCode === arrAirportCode
    ) || null
  );
}

// 특정 도착 노선 조회
export function getArrivalRoute(
  depAirportCode: string,
  arrAirportCode: string
): RouteData | null {
  const routes = getArrivalRoutes();
  return (
    routes.find(
      r => r.depAirportCode === depAirportCode && r.arrAirportCode === arrAirportCode
    ) || null
  );
}

// 공항별 출발 노선 목록
export function getDepartureRoutesFromAirport(airportCode: string): RouteData[] {
  const routes = getDepartureRoutes();
  return routes.filter(r => r.depAirportCode === airportCode);
}

// 공항별 도착 노선 목록
export function getArrivalRoutesToAirport(airportCode: string): RouteData[] {
  const routes = getArrivalRoutes();
  return routes.filter(r => r.arrAirportCode === airportCode);
}

// 공항 정보 조회
export function getAirport(airportCode: string): Airport | null {
  const airports = getAirports();
  return airports.find(a => a.airportCode === airportCode) || null;
}

// 노선이 있는 공항 수 (통계용)
// departure: 출발편의 목적지 수, arrival: 도착편의 출발지 수
export function getActiveAirportCount(): { departure: number; arrival: number } {
  const departureRoutes = getDepartureRoutes();
  const arrivalRoutes = getArrivalRoutes();

  const depDestinations = new Set<string>();
  departureRoutes.forEach(r => depDestinations.add(r.arrAirportCode));

  const arrOrigins = new Set<string>();
  arrivalRoutes.forEach(r => arrOrigins.add(r.depAirportCode));

  return { departure: depDestinations.size, arrival: arrOrigins.size };
}

// 터미널 코드를 한글로 변환
export function getTerminalName(terminalId: string): string {
  const terminalMap: Record<string, string> = {
    'P01': '제1터미널',
    'P02': '탑승동',
    'P03': '제2터미널',
    'C01': '화물터미널 남측',
    'C02': '화물터미널 북측',
    'C03': '제2화물터미널',
  };
  return terminalMap[terminalId] || terminalId;
}

// 요일 한글 라벨
export function getDayLabel(day: keyof DaysOfWeek): string {
  const labels: Record<keyof DaysOfWeek, string> = {
    mon: '월', tue: '화', wed: '수', thu: '목',
    fri: '금', sat: '토', sun: '일',
  };
  return labels[day];
}

// 운항 요일 문자열 생성 (예: "월화수목금" 또는 "매일")
export function formatDays(days: DaysOfWeek): string {
  const allDays: (keyof DaysOfWeek)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const activeDays = allDays.filter(d => days[d]);

  if (activeDays.length === 7) return '매일';
  if (activeDays.length === 0) return '-';

  return activeDays.map(d => getDayLabel(d)).join('');
}

// 시즌 코드를 한글로 변환 (예: W25 -> 2025 동계, S26 -> 2026 하계)
export function formatSeason(season: string): string {
  if (!season || season.length < 3) return season;
  const type = season.charAt(0);
  const year = '20' + season.substring(1);
  return `${year} ${type === 'W' ? '동계' : '하계'}`;
}
