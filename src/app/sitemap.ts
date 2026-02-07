import type { MetadataRoute } from 'next';
import {
  getAirports,
  getDepartureRoutes,
  getArrivalRoutes,
  getMetadata,
} from '@/lib/data';
import { createRouteSlug } from '@/lib/slugs';
import { BASE_URL, MAJOR_AIRPORT_CODES, POPULAR_ROUTE_SLUGS } from '@/lib/constants';

// output: 'export' 호환을 위한 설정
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const airports = getAirports();
  const departureRoutes = getDepartureRoutes();
  const arrivalRoutes = getArrivalRoutes();
  const metadata = getMetadata();

  const dataLastModified = metadata?.lastUpdated
    ? new Date(metadata.lastUpdated)
    : new Date();

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: dataLastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/departures`,
      lastModified: dataLastModified,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/arrivals`,
      lastModified: dataLastModified,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/airports`,
      lastModified: dataLastModified,
      changeFrequency: 'daily',
      priority: 0.95,
    },
  ];

  // 공항 상세 페이지 (중복 제거)
  const airportSlugs = new Set<string>();
  const airportPages: MetadataRoute.Sitemap = airports
    .filter(a => {
      if (airportSlugs.has(a.airportCode)) return false;
      airportSlugs.add(a.airportCode);
      return true;
    })
    .map(a => {
      const isMajor = MAJOR_AIRPORT_CODES.includes(a.airportCode);
      return {
        url: `${BASE_URL}/airports/${a.airportCode}`,
        lastModified: dataLastModified,
        changeFrequency: 'weekly' as const,
        priority: isMajor ? 0.85 : 0.7,
      };
    });

  // 출발편 공항 페이지
  const depAirportSlugs = new Set<string>();
  const depAirportPages: MetadataRoute.Sitemap = departureRoutes
    .filter(r => {
      if (depAirportSlugs.has(r.depAirportCode)) return false;
      depAirportSlugs.add(r.depAirportCode);
      return true;
    })
    .map(r => ({
      url: `${BASE_URL}/departures/${r.depAirportCode}`,
      lastModified: dataLastModified,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

  // 도착편 공항 페이지
  const arrAirportSlugs = new Set<string>();
  const arrAirportPages: MetadataRoute.Sitemap = arrivalRoutes
    .filter(r => {
      if (arrAirportSlugs.has(r.arrAirportCode)) return false;
      arrAirportSlugs.add(r.arrAirportCode);
      return true;
    })
    .map(r => ({
      url: `${BASE_URL}/arrivals/${r.arrAirportCode}`,
      lastModified: dataLastModified,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

  // 출발편 노선 페이지 (중복 제거)
  const depRouteSlugs = new Set<string>();
  const depRoutePages: MetadataRoute.Sitemap = departureRoutes
    .filter(route => {
      const slug = createRouteSlug(route.depAirportCode, route.arrAirportCode);
      if (depRouteSlugs.has(slug)) return false;
      depRouteSlugs.add(slug);
      return true;
    })
    .map(route => {
      const slug = createRouteSlug(route.depAirportCode, route.arrAirportCode);
      const isPopular = POPULAR_ROUTE_SLUGS.includes(slug);
      return {
        url: `${BASE_URL}/departures/routes/${slug}`,
        lastModified: dataLastModified,
        changeFrequency: 'daily' as const,
        priority: isPopular ? 0.85 : 0.7,
      };
    });

  // 도착편 노선 페이지 (중복 제거)
  const arrRouteSlugs = new Set<string>();
  const arrRoutePages: MetadataRoute.Sitemap = arrivalRoutes
    .filter(route => {
      const slug = createRouteSlug(route.depAirportCode, route.arrAirportCode);
      if (arrRouteSlugs.has(slug)) return false;
      arrRouteSlugs.add(slug);
      return true;
    })
    .map(route => ({
      url: `${BASE_URL}/arrivals/routes/${createRouteSlug(route.depAirportCode, route.arrAirportCode)}`,
      lastModified: dataLastModified,
      changeFrequency: 'daily' as const,
      priority: 0.65,
    }));

  return [
    ...staticPages,
    ...airportPages,
    ...depAirportPages,
    ...arrAirportPages,
    ...depRoutePages,
    ...arrRoutePages,
  ];
}
