/**
 * 공항 상세 페이지 SEO 데이터 생성 유틸리티
 * 통계, 메타데이터, 설명 텍스트, FAQ, 관련 공항 링크 생성
 */

import type { RouteData } from './types';
import type { FAQItem } from './route-seo';
import type { KoreanAirportExtra } from './airport-parking';
import { getAirportInfo } from './airport-info';
import { getAirportRegion, getAllAirportRegions } from './airport-regions';
import { getAirports, getDepartureRoutes, getArrivalRoutes } from './data';

// ── 타입 정의 ──

export interface AirportStats {
  airlines: string[];
  totalFlights: number;
  depRouteCount: number;
  arrRouteCount: number;
  topDestinations: { code: string; name: string; flightCount: number }[];
  topOrigins: { code: string; name: string; flightCount: number }[];
}

export interface AirportSeoMeta {
  title: string;
  description: string;
  h1: string;
  h2Info: string;
  h2Parking: string;
  h2Congestion: string;
  h2Transport: string;
}

export interface AirportRelatedLinks {
  sameRegionAirports: { code: string; name: string }[];
  popularRoutes: { slug: string; label: string; flightCount: number; type: 'departure' | 'arrival' }[];
}

// ── 함수 구현 ──

/**
 * 공항 관련 노선에서 통계 계산
 */
export function computeAirportStats(
  depRoutes: RouteData[],
  arrRoutes: RouteData[],
): AirportStats {
  const airlineSet = new Set<string>();
  let totalFlights = 0;

  for (const route of depRoutes) {
    for (const f of route.flights) {
      airlineSet.add(f.airline);
      totalFlights++;
    }
  }
  for (const route of arrRoutes) {
    for (const f of route.flights) {
      airlineSet.add(f.airline);
      totalFlights++;
    }
  }

  const topDestinations = depRoutes
    .map(r => ({ code: r.arrAirportCode, name: r.arrAirportName, flightCount: r.flights.length }))
    .sort((a, b) => b.flightCount - a.flightCount)
    .slice(0, 5);

  const topOrigins = arrRoutes
    .map(r => ({ code: r.depAirportCode, name: r.depAirportName, flightCount: r.flights.length }))
    .sort((a, b) => b.flightCount - a.flightCount)
    .slice(0, 5);

  return {
    airlines: Array.from(airlineSet).sort(),
    totalFlights,
    depRouteCount: depRoutes.length,
    arrRouteCount: arrRoutes.length,
    topDestinations,
    topOrigins,
  };
}

/**
 * 공항 정식명 조회
 */
function getFullAirportName(code: string, fallbackName: string): string {
  const info = getAirportInfo(code);
  return info?.name || fallbackName;
}

/**
 * 공항 SEO 메타데이터 생성
 */
export function generateAirportSeoMeta(
  code: string,
  name: string,
  stats: AirportStats,
  isKorean: boolean,
  hasParking: boolean,
): AirportSeoMeta {
  const fullName = getFullAirportName(code, name);
  const totalRoutes = stats.depRouteCount + stats.arrRouteCount;
  const shortName = fullName.replace(/국제공항$/, '공항').replace(/공항공항$/, '공항');

  let title: string;
  let description: string;

  if (isKorean && hasParking) {
    title = `${shortName} 주차요금·교통편·혼잡도 | ${totalRoutes}개 노선, ${stats.airlines.length}개 항공사`;
    description = `${fullName}(${code}) 주차 요금, 교통편 안내, 혼잡 시간대 정보. ${totalRoutes}개 노선, ${stats.airlines.length}개 항공사 운항. 출발편 ${stats.depRouteCount}개, 도착편 ${stats.arrRouteCount}개 노선.`;
  } else if (isKorean) {
    title = `${shortName} (${code}) 운항 노선·항공편 안내 | ${totalRoutes}개 노선`;
    description = `${fullName}(${code}) 운항 노선, 항공편 시간표 안내. ${totalRoutes}개 노선, ${stats.airlines.length}개 항공사 운항.`;
  } else {
    title = `${fullName} (${code}) 한국 직항 노선 | ${totalRoutes}개 노선`;
    description = `${fullName}(${code})에서 한국 공항 직항 노선 안내. ${totalRoutes}개 노선, ${stats.airlines.length}개 항공사 운항.`;
  }

  const h1 = `${fullName} (${code}) 공항 안내`;
  const h2Info = `${shortName} 안내`;
  const h2Parking = `${shortName} 주차 요금`;
  const h2Congestion = `${shortName} 혼잡도 안내`;
  const h2Transport = `${shortName} 교통편`;

  return { title, description, h1, h2Info, h2Parking, h2Congestion, h2Transport };
}

/**
 * 공항 설명 텍스트 생성 (문단 배열)
 */
export function generateAirportDescription(
  code: string,
  name: string,
  stats: AirportStats,
  isKorean: boolean,
  seasonLabel: string,
): string[] {
  const fullName = getFullAirportName(code, name);
  const region = getAirportRegion(code);
  const totalRoutes = stats.depRouteCount + stats.arrRouteCount;
  const paragraphs: string[] = [];

  // 문단 1: 공항 개요
  if (isKorean) {
    paragraphs.push(
      `${fullName}(${code})은(는) 총 ${totalRoutes}개 노선에 ${stats.airlines.length}개 항공사가 운항하고 있습니다. 출발편 ${stats.depRouteCount}개 노선, 도착편 ${stats.arrRouteCount}개 노선이 운영됩니다.${seasonLabel ? ` 현재 ${seasonLabel} 시즌 기준 시간표입니다.` : ''}`
    );
  } else {
    paragraphs.push(
      `${fullName}(${code})과(와) 한국 공항 간 직항 노선은 총 ${totalRoutes}개이며, ${stats.airlines.length}개 항공사가 운항합니다.${seasonLabel ? ` 현재 ${seasonLabel} 시즌 기준 시간표입니다.` : ''}`
    );
  }

  // 문단 2: 취항 항공사
  if (stats.airlines.length > 0) {
    const airlineList = stats.airlines.length > 10
      ? stats.airlines.slice(0, 10).join(', ') + ` 등 ${stats.airlines.length}개 항공사`
      : stats.airlines.join(', ');
    paragraphs.push(`취항 항공사는 ${airlineList}입니다.`);
  }

  // 문단 3: 인기 목적지/출발지
  if (isKorean && stats.topDestinations.length > 0) {
    const destList = stats.topDestinations.map(d => d.name).join(', ');
    paragraphs.push(`인기 목적지로는 ${destList} 등이 있습니다.`);
  } else if (!isKorean && stats.topOrigins.length > 0) {
    const originList = stats.topOrigins.map(o => o.name).join(', ');
    paragraphs.push(`한국에서는 ${originList} 공항에서 직항편을 이용할 수 있습니다.`);
  }

  // 문단 4: 지역 정보
  if (region) {
    if (isKorean) {
      const info = getAirportInfo(code);
      if (info?.address) {
        paragraphs.push(`${fullName}은(는) ${info.address}에 위치해 있습니다.`);
      }
    } else {
      const regionText = `${region.continent} ${region.country}`;
      paragraphs.push(`${fullName}은(는) ${regionText}에 위치해 있습니다.`);
    }
  }

  return paragraphs;
}

/**
 * 공항 FAQ 항목 생성
 */
export function generateAirportFAQ(
  code: string,
  name: string,
  stats: AirportStats,
  isKorean: boolean,
  extra?: KoreanAirportExtra | null,
): FAQItem[] {
  const fullName = getFullAirportName(code, name);
  const shortName = fullName.replace(/국제공항$/, '공항').replace(/공항공항$/, '공항');
  const totalRoutes = stats.depRouteCount + stats.arrRouteCount;
  const info = getAirportInfo(code);
  const items: FAQItem[] = [];

  if (isKorean && extra) {
    // 한국 공항: 주차요금
    if (extra.parking.length > 0) {
      const mainParking = extra.parking[0];
      const dailyRate = mainParking.rates.find(r => r.label === '1일');
      const rateInfo = dailyRate ? `1일 ${dailyRate.price}` : mainParking.rates.map(r => `${r.label} ${r.price}`).join(', ');
      items.push({
        question: `${shortName} 주차요금은 얼마인가요?`,
        answer: `${shortName} ${mainParking.type} 기준 ${rateInfo}입니다.${extra.parking.length > 1 ? ` 장기주차장 등 ${extra.parking.length}종의 주차장이 있으며, 주차장별 요금이 다릅니다.` : ''}${mainParking.discountInfo ? ` ${mainParking.discountInfo}.` : ''}`,
      });
    }

    // 한국 공항: 교통편
    if (extra.transport.length > 0) {
      const transportList = extra.transport.map(t => t.type).join(', ');
      items.push({
        question: `${shortName} 가는 방법(교통편)은?`,
        answer: `${shortName}까지 ${transportList} 등을 이용할 수 있습니다.${extra.transport[0].estimatedTime ? ` ${extra.transport[0].type} 기준 ${extra.transport[0].estimatedTime} 소요됩니다.` : ''}`,
      });
    }

    // 한국 공항: 혼잡도
    if (extra.congestionTips.length > 0) {
      const highTip = extra.congestionTips.find(t => t.level === 'high');
      items.push({
        question: `${shortName} 혼잡한 시간대는 언제인가요?`,
        answer: highTip
          ? `${highTip.period}이(가) 가장 혼잡합니다. ${highTip.description}. 출발 2시간 전(국제선) 또는 1시간 전(국내선) 도착을 권장합니다.`
          : `일반적으로 출발편 집중 시간대에 혼잡합니다. 출발 2시간 전(국제선) 또는 1시간 전(국내선) 도착을 권장합니다.`,
      });
    }

    // 운영시간
    items.push({
      question: `${shortName} 운영시간은?`,
      answer: `${fullName} 운영시간은 ${extra.operatingHours}입니다.`,
    });
  }

  // 공통: 전화번호
  if (info?.telephone) {
    items.push({
      question: `${shortName} 전화번호(연락처)는?`,
      answer: `${fullName} 대표 전화번호는 ${info.telephone}입니다.`,
    });
  }

  // 공통: 항공사
  if (stats.airlines.length > 0) {
    const topAirlines = stats.airlines.slice(0, 5).join(', ');
    items.push({
      question: `${shortName}${isKorean ? '에서' : '과(와) 한국 간'} 운항하는 항공사는?`,
      answer: `총 ${stats.airlines.length}개 항공사가 운항합니다. ${topAirlines}${stats.airlines.length > 5 ? ` 등` : ''}.`,
    });
  }

  // 공통: 노선 수
  items.push({
    question: `${shortName}${isKorean ? '' : ' 한국 직항'} 운항 노선은 몇 개인가요?`,
    answer: `총 ${totalRoutes}개 노선이 운항합니다. 출발편 ${stats.depRouteCount}개, 도착편 ${stats.arrRouteCount}개 노선입니다.`,
  });

  // 해외 공항: 위치
  if (!isKorean) {
    const region = getAirportRegion(code);
    if (region) {
      items.push({
        question: `${fullName}은(는) 어디에 있나요?`,
        answer: `${fullName}은(는) ${region.continent} ${region.country}에 위치해 있습니다.${info?.address ? ` 주소: ${info.address}` : ''}`,
      });
    }
  }

  return items;
}

/**
 * 관련 공항 및 인기 노선 링크 생성
 */
export function getRelatedAirports(
  code: string,
): AirportRelatedLinks {
  const region = getAirportRegion(code);
  const allRegions = getAllAirportRegions();
  const airports = getAirports();
  const airportCodes = new Set(airports.map(a => a.airportCode));

  // 같은 국가/대륙 공항 (최대 5개)
  const sameRegionAirports: AirportRelatedLinks['sameRegionAirports'] = [];
  if (region) {
    // 같은 국가 우선
    for (const [airCode, airRegion] of Object.entries(allRegions)) {
      if (airCode === code) continue;
      if (!airportCodes.has(airCode)) continue;
      if (airRegion.country === region.country) {
        const info = getAirportInfo(airCode);
        sameRegionAirports.push({
          code: airCode,
          name: info?.name || airCode,
        });
      }
      if (sameRegionAirports.length >= 5) break;
    }

    // 같은 대륙 보충
    if (sameRegionAirports.length < 5) {
      for (const [airCode, airRegion] of Object.entries(allRegions)) {
        if (airCode === code) continue;
        if (!airportCodes.has(airCode)) continue;
        if (sameRegionAirports.some(a => a.code === airCode)) continue;
        if (airRegion.continent === region.continent) {
          const info = getAirportInfo(airCode);
          sameRegionAirports.push({
            code: airCode,
            name: info?.name || airCode,
          });
        }
        if (sameRegionAirports.length >= 5) break;
      }
    }
  }

  // 인기 노선 (최대 5개, 편수 많은 순)
  const depRoutes = getDepartureRoutes();
  const arrRoutes = getArrivalRoutes();
  const routeEntries: AirportRelatedLinks['popularRoutes'] = [];

  // 출발 노선
  const depFromAirport = depRoutes
    .filter(r => r.depAirportCode === code)
    .sort((a, b) => b.flights.length - a.flights.length)
    .slice(0, 3);

  for (const r of depFromAirport) {
    routeEntries.push({
      slug: `${r.depAirportCode}-${r.arrAirportCode}`,
      label: `${r.depAirportName} → ${r.arrAirportName}`,
      flightCount: r.flights.length,
      type: 'departure',
    });
  }

  // 도착 노선
  const arrToAirport = arrRoutes
    .filter(r => r.arrAirportCode === code)
    .sort((a, b) => b.flights.length - a.flights.length)
    .slice(0, 3);

  for (const r of arrToAirport) {
    routeEntries.push({
      slug: `${r.depAirportCode}-${r.arrAirportCode}`,
      label: `${r.depAirportName} → ${r.arrAirportName}`,
      flightCount: r.flights.length,
      type: 'arrival',
    });
  }

  // 편수 순 정렬 후 최대 5개
  const popularRoutes = routeEntries
    .sort((a, b) => b.flightCount - a.flightCount)
    .slice(0, 5);

  return { sameRegionAirports, popularRoutes };
}
