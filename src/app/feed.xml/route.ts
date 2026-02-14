import { getDepartureRoutes, getArrivalRoutes, getMetadata } from '@/lib/data';
import { createRouteSlug } from '@/lib/slugs';
import { BASE_URL } from '@/lib/constants';

// output: 'export' 호환을 위한 설정
export const dynamic = 'force-static';

export async function GET() {
  const now = new Date();
  const routes = getDepartureRoutes();
  const metadata = getMetadata();
  const lastUpdated = metadata?.lastUpdated ? new Date(metadata.lastUpdated).toUTCString() : now.toUTCString();

  const items: string[] = [];

  // 메인 페이지
  items.push(`
    <item>
      <title><![CDATA[항공편 시간표 - 전국 공항 출발편, 도착편 조회]]></title>
      <link>${BASE_URL}</link>
      <guid>${BASE_URL}</guid>
      <description><![CDATA[전국 15개 공항의 출발편, 도착편 항공 시간표를 조회하세요. 항공사, 편명, 출발/도착 시간, 터미널 정보를 확인할 수 있습니다.]]></description>
      <pubDate>${lastUpdated}</pubDate>
    </item>`);

  // 출발편 페이지
  items.push(`
    <item>
      <title><![CDATA[출발편 시간표 - 전국 공항 출발 항공편 조회]]></title>
      <link>${BASE_URL}/departures</link>
      <guid>${BASE_URL}/departures</guid>
      <description><![CDATA[전국 공항 출발편 시간표입니다. 목적지별 항공편 정보를 확인하세요.]]></description>
      <pubDate>${lastUpdated}</pubDate>
    </item>`);

  // 도착편 페이지
  items.push(`
    <item>
      <title><![CDATA[도착편 시간표 - 전국 공항 도착 항공편 조회]]></title>
      <link>${BASE_URL}/arrivals</link>
      <guid>${BASE_URL}/arrivals</guid>
      <description><![CDATA[전국 공항 도착편 시간표입니다. 출발지별 항공편 정보를 확인하세요.]]></description>
      <pubDate>${lastUpdated}</pubDate>
    </item>`);

  // 공항 목록 페이지
  items.push(`
    <item>
      <title><![CDATA[공항 정보 - 주요 공항 안내]]></title>
      <link>${BASE_URL}/airports</link>
      <guid>${BASE_URL}/airports</guid>
      <description><![CDATA[주요 공항의 위치, 연락처 및 운항 노선 정보를 확인하세요.]]></description>
      <pubDate>${lastUpdated}</pubDate>
    </item>`);

  // 인기 출발 노선 (최대 15개)
  routes.slice(0, 15).forEach(route => {
    const routeSlug = createRouteSlug(route.depAirportCode, route.arrAirportCode);
    const url = `${BASE_URL}/departures/routes/${routeSlug}`;

    items.push(`
    <item>
      <title><![CDATA[${route.depAirportName} → ${route.arrAirportName} 출발편 시간표]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description><![CDATA[${route.depAirportName}에서 ${route.arrAirportName}까지 정기운항 출발편 시간표. 항공사, 편명, 출발 시간, 운항 요일 정보.]]></description>
      <pubDate>${lastUpdated}</pubDate>
    </item>`);
  });

  // 인기 도착 노선 (최대 15개)
  const arrivalRoutes = getArrivalRoutes();
  arrivalRoutes.slice(0, 15).forEach(route => {
    const routeSlug = createRouteSlug(route.depAirportCode, route.arrAirportCode);
    const url = `${BASE_URL}/arrivals/routes/${routeSlug}`;

    items.push(`
    <item>
      <title><![CDATA[${route.depAirportName} → ${route.arrAirportName} 도착편 시간표]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description><![CDATA[${route.depAirportName}에서 ${route.arrAirportName}까지 정기운항 도착편 시간표. 항공사, 편명, 도착 시간, 운항 요일 정보.]]></description>
      <pubDate>${lastUpdated}</pubDate>
    </item>`);
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>항공편 시간표 - 전국 공항 출발편, 도착편</title>
    <link>${BASE_URL}</link>
    <description>전국 15개 공항의 출발편, 도착편 항공 시간표를 조회하세요. 항공사, 편명, 출발/도착 시간, 터미널 정보를 확인할 수 있습니다.</description>
    <language>ko</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items.join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=604800, s-maxage=604800', // 7일 캐시
    },
  });
}
