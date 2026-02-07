/**
 * 공항코드 ↔ 슬러그 매핑 (서버사이드 전용)
 * data.ts를 import하므로 서버 컴포넌트에서만 사용
 * 클라이언트에서는 slug-utils.ts를 사용
 */

import { getAirports, getDepartureRoutes, getArrivalRoutes } from './data';

// slug-utils에서 공용 함수 re-export
export { createRouteSlug, parseRouteSlug } from './slug-utils';

// 공항 코드로 슬러그 생성 (IATA 3자리 코드 그대로 사용)
export function createAirportSlug(airportCode: string): string {
  return airportCode;
}

// 슬러그 → 공항코드 매핑 캐시
let airportSlugToCodeMap: Map<string, string> | null = null;
let airportCodeToSlugMap: Map<string, string> | null = null;

function initAirportSlugMaps() {
  if (airportSlugToCodeMap && airportCodeToSlugMap) return;

  airportSlugToCodeMap = new Map();
  airportCodeToSlugMap = new Map();

  const airports = getAirports();
  for (const airport of airports) {
    const slug = createAirportSlug(airport.airportCode);
    airportSlugToCodeMap.set(slug, airport.airportCode);
    airportCodeToSlugMap.set(airport.airportCode, slug);
  }
}

export function getAirportCodeBySlug(slug: string): string | null {
  initAirportSlugMaps();
  return airportSlugToCodeMap!.get(slug) || null;
}

export function getSlugByAirportCode(airportCode: string): string | null {
  initAirportSlugMaps();
  return airportCodeToSlugMap!.get(airportCode) || null;
}

export function getAllAirportSlugs(): string[] {
  initAirportSlugMaps();
  return Array.from(airportCodeToSlugMap!.values());
}

export function getAllDepartureRouteSlugs(): string[] {
  const routes = getDepartureRoutes();
  const slugs = new Set<string>();
  routes.forEach(r => slugs.add(`${r.depAirportCode}-${r.arrAirportCode}`));
  return Array.from(slugs);
}

export function getAllArrivalRouteSlugs(): string[] {
  const routes = getArrivalRoutes();
  const slugs = new Set<string>();
  routes.forEach(r => slugs.add(`${r.depAirportCode}-${r.arrAirportCode}`));
  return Array.from(slugs);
}
