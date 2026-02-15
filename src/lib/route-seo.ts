/**
 * 노선 상세 페이지 SEO 데이터 생성 유틸리티
 * 통계, 메타데이터, 설명 텍스트, FAQ, 관련 노선 링크 생성
 */

import type { FlightEntry } from './types';
import { getAirportInfo } from './airport-info';
import { getAirportRegion } from './airport-regions';
import { getDepartureRoutes, getArrivalRoutes } from './data';
import { createRouteSlug } from './slug-utils';

// ── 타입 정의 ──

export interface RouteStats {
  airlines: string[];       // 고유 항공사 목록 (정렬됨)
  totalFlights: number;     // 총 항공편 수
  firstFlight: string;      // 첫편 시간 (HH:mm)
  lastFlight: string;       // 막편 시간 (HH:mm)
  dailyFlights: number;     // 매일 운항편 수
}

export interface RouteSeoMeta {
  title: string;
  description: string;
  h1: string;
  h2Schedule: string;
  h2RouteInfo: string;
  h2Fare: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface RouteRelatedLinks {
  reverseRoute: { slug: string; label: string; type: 'departure' | 'arrival' } | null;
  sameOriginRoutes: { slug: string; label: string; flightCount: number }[];
  sameDestRoutes: { slug: string; label: string; flightCount: number }[];
}

// ── 함수 구현 ──

/**
 * 항공편 목록에서 노선 통계를 계산
 */
export function computeRouteStats(flights: FlightEntry[]): RouteStats {
  const airlineSet = new Set<string>();
  flights.forEach(f => airlineSet.add(f.airline));
  const airlines = Array.from(airlineSet).sort();

  const sorted = [...flights].sort((a, b) =>
    a.scheduleTime.localeCompare(b.scheduleTime)
  );

  const firstFlight = sorted.length > 0 ? sorted[0].scheduleTime : '';
  const lastFlight = sorted.length > 0 ? sorted[sorted.length - 1].scheduleTime : '';

  const dailyFlights = flights.filter(f =>
    f.days.mon && f.days.tue && f.days.wed && f.days.thu &&
    f.days.fri && f.days.sat && f.days.sun
  ).length;

  return {
    airlines,
    totalFlights: flights.length,
    firstFlight,
    lastFlight,
    dailyFlights,
  };
}

/**
 * 공항 코드로 정식명 조회 (airport-info 우선, 없으면 fallback)
 */
function getFullAirportName(code: string, fallbackName: string): string {
  const info = getAirportInfo(code);
  return info?.name || fallbackName;
}

/**
 * 노선 SEO 메타데이터 생성
 */
export function generateRouteSeoMeta(
  depCode: string,
  arrCode: string,
  depName: string,
  arrName: string,
  stats: RouteStats,
  type: 'departure' | 'arrival',
): RouteSeoMeta {
  const depFullName = getFullAirportName(depCode, depName);
  const arrFullName = getFullAirportName(arrCode, arrName);

  const title = type === 'departure'
    ? `${depFullName}에서 ${arrName} 항공편 시간표 | 소요시간, 항공사 요금 비교`
    : `${depName}발 ${arrFullName} 도착편 시간표 | 소요시간, 항공사 요금 비교`;

  const h1 = `${depFullName} → ${arrFullName} 항공편 시간표`;
  const h2Schedule = `${depCode}-${arrCode} 운항 스케줄`;
  const h2RouteInfo = `${depCode}-${arrCode} 노선 정보`;
  const h2Fare = `${depCode}-${arrCode} 항공권 안내`;

  const topAirlines = stats.airlines.slice(0, 3).join(', ');
  const description = `${depFullName}에서 ${arrFullName}까지 총 ${stats.totalFlights}편, ${stats.airlines.length}개 항공사 운항. 첫편 ${stats.firstFlight}, 막편 ${stats.lastFlight}. ${topAirlines} 등 취항.`;

  return { title, description, h1, h2Schedule, h2RouteInfo, h2Fare };
}

/**
 * 노선 설명 텍스트 생성 (문단 배열)
 */
export function generateRouteDescription(
  depCode: string,
  arrCode: string,
  depName: string,
  arrName: string,
  stats: RouteStats,
  type: 'departure' | 'arrival',
  seasonLabel: string,
): string[] {
  const depFullName = getFullAirportName(depCode, depName);
  const arrFullName = getFullAirportName(arrCode, arrName);
  const typeLabel = type === 'departure' ? '출발' : '도착';

  const paragraphs: string[] = [];

  // 문단 1: 운항 개요
  paragraphs.push(
    `${depFullName}에서 ${arrFullName}까지 ${typeLabel}편은 총 ${stats.totalFlights}편이 운항하며, ${stats.airlines.length}개 항공사가 취항하고 있습니다. 첫 비행기는 ${stats.firstFlight}에 ${typeLabel}하고, 마지막 비행기는 ${stats.lastFlight}에 ${typeLabel}합니다.${stats.dailyFlights > 0 ? ` 이 중 ${stats.dailyFlights}편은 매일 운항합니다.` : ''}`
  );

  // 문단 2: 취항 항공사
  paragraphs.push(
    `이 노선에 취항하는 항공사는 ${stats.airlines.join(', ')}입니다.`
  );

  // 문단 3: 지역 정보 + 시즌
  const arrRegion = getAirportRegion(arrCode);
  const depRegion = getAirportRegion(depCode);
  const targetRegion = type === 'departure' ? arrRegion : depRegion;
  if (targetRegion) {
    const regionText = targetRegion.continent === '한국'
      ? `${targetRegion.country} 국내선`
      : `${targetRegion.continent} ${targetRegion.country}`;
    paragraphs.push(
      `${type === 'departure' ? arrFullName : depFullName}은(는) ${regionText}에 위치해 있습니다.${seasonLabel ? ` 현재 ${seasonLabel} 시즌 기준 시간표입니다.` : ''}`
    );
  } else if (seasonLabel) {
    paragraphs.push(`현재 ${seasonLabel} 시즌 기준 시간표입니다.`);
  }

  return paragraphs;
}

/**
 * 노선 FAQ 항목 생성
 */
export function generateRouteFAQ(
  depCode: string,
  arrCode: string,
  depName: string,
  arrName: string,
  stats: RouteStats,
  type: 'departure' | 'arrival',
): FAQItem[] {
  const depFullName = getFullAirportName(depCode, depName);
  const arrFullName = getFullAirportName(arrCode, arrName);
  const typeLabel = type === 'departure' ? '출발' : '도착';

  const items: FAQItem[] = [];

  // Q1: 항공편 수
  items.push({
    question: `${depFullName}에서 ${arrFullName} ${typeLabel}편은 몇 편인가요?`,
    answer: `총 ${stats.totalFlights}편이 운항하며, ${stats.airlines.length}개 항공사가 취항합니다.`,
  });

  // Q2: 항공사 목록
  items.push({
    question: `${depCode}-${arrCode} 노선에 어떤 항공사가 운항하나요?`,
    answer: `${stats.airlines.join(', ')} 등 ${stats.airlines.length}개 항공사가 운항합니다.`,
  });

  // Q3: 첫편/막편
  items.push({
    question: `${depFullName}에서 ${arrFullName}행 첫 비행기와 마지막 비행기는 몇 시인가요?`,
    answer: `첫 비행기는 ${stats.firstFlight}에, 마지막 비행기는 ${stats.lastFlight}에 ${typeLabel}합니다.`,
  });

  // Q4: 매일 운항 여부 (조건부)
  if (stats.dailyFlights < stats.totalFlights) {
    items.push({
      question: `${depCode}-${arrCode} 노선은 매일 운항하나요?`,
      answer: stats.dailyFlights > 0
        ? `전체 ${stats.totalFlights}편 중 ${stats.dailyFlights}편이 매일 운항하며, 나머지는 특정 요일에만 운항합니다. 자세한 요일은 위 시간표에서 확인하세요.`
        : `모든 항공편이 특정 요일에만 운항합니다. 자세한 운항 요일은 위 시간표에서 확인하세요.`,
    });
  }

  return items;
}

/**
 * 관련 노선 링크 생성 (반대 방향, 같은 출발지, 같은 도착지)
 */
export function getRelatedRoutes(
  depCode: string,
  arrCode: string,
  type: 'departure' | 'arrival',
): RouteRelatedLinks {
  const depRoutes = getDepartureRoutes();
  const arrRoutes = getArrivalRoutes();

  // 반대 방향 노선
  let reverseRoute: RouteRelatedLinks['reverseRoute'] = null;
  if (type === 'departure') {
    const reverse = arrRoutes.find(r => r.depAirportCode === arrCode && r.arrAirportCode === depCode);
    if (reverse) {
      reverseRoute = {
        slug: createRouteSlug(arrCode, depCode),
        label: `${reverse.depAirportName} → ${reverse.arrAirportName} 도착편`,
        type: 'arrival',
      };
    }
  } else {
    const reverse = depRoutes.find(r => r.depAirportCode === arrCode && r.arrAirportCode === depCode);
    if (reverse) {
      reverseRoute = {
        slug: createRouteSlug(arrCode, depCode),
        label: `${reverse.depAirportName} → ${reverse.arrAirportName} 출발편`,
        type: 'departure',
      };
    }
  }

  // 같은 출발지/도착지 노선
  const sourceRoutes = type === 'departure' ? depRoutes : arrRoutes;
  const routeType = type;

  // 같은 출발지 다른 목적지 (편수 순, 최대 5개)
  const sameOriginRoutes = sourceRoutes
    .filter(r => r.depAirportCode === depCode && r.arrAirportCode !== arrCode)
    .sort((a, b) => b.flights.length - a.flights.length)
    .slice(0, 5)
    .map(r => ({
      slug: createRouteSlug(r.depAirportCode, r.arrAirportCode),
      label: `${r.depAirportName} → ${r.arrAirportName}`,
      flightCount: r.flights.length,
    }));

  // 같은 도착지 다른 출발지 (최대 4개)
  const sameDestRoutes = sourceRoutes
    .filter(r => r.arrAirportCode === arrCode && r.depAirportCode !== depCode)
    .sort((a, b) => b.flights.length - a.flights.length)
    .slice(0, 4)
    .map(r => ({
      slug: createRouteSlug(r.depAirportCode, r.arrAirportCode),
      label: `${r.depAirportName} → ${r.arrAirportName}`,
      flightCount: r.flights.length,
    }));

  return { reverseRoute, sameOriginRoutes, sameDestRoutes };
}
