import type { Metadata } from 'next';
import Link from 'next/link';
import { getDepartureRoutes, getDepartureRoute, getAirport, getMetadata, formatSeason } from '@/lib/data';
import { BreadcrumbJsonLd, FlightJsonLd } from '@/components/JsonLd';
import { createRouteSlug, parseRouteSlug } from '@/lib/slugs';
import { notFound } from 'next/navigation';
import { BASE_URL } from '@/lib/constants';
import FlightTable from '@/components/FlightTable';

export const dynamicParams = false;

interface Props {
  params: Promise<{ route: string }>;
}

export async function generateStaticParams() {
  const routes = getDepartureRoutes();
  const slugs = new Set<string>();
  const params = routes
    .filter(r => {
      const slug = createRouteSlug(r.depAirportCode, r.arrAirportCode);
      if (slugs.has(slug)) return false;
      slugs.add(slug);
      return true;
    })
    .map(r => ({
      route: createRouteSlug(r.depAirportCode, r.arrAirportCode),
    }));
  return params.length > 0 ? params : [{ route: '_placeholder' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { route: routeSlug } = await params;
  const parsed = parseRouteSlug(routeSlug);
  if (!parsed) return { title: '노선 정보 없음' };

  const depAirport = getAirport(parsed.depCode);
  const arrAirport = getAirport(parsed.arrCode);
  const depName = depAirport?.airportName || parsed.depCode;
  const arrName = arrAirport?.airportName || parsed.arrCode;

  return {
    title: `${depName} → ${arrName} 출발편 정기운항 시간표 - 항공사, 편명, 운항요일`,
    description: `${depName}에서 ${arrName}까지 정기운항 출발편 시간표입니다. 항공사별 편명, 출발 시간, 요일별 운항 정보를 확인하세요.`,
    openGraph: {
      title: `${depName} → ${arrName} 출발편 시간표`,
      description: `${depName}에서 ${arrName}까지 정기운항 출발편 시간표. 항공사별 편명, 출발 시간, 운항 요일 정보.`,
      url: `${BASE_URL}/departures/routes/${routeSlug}`,
      siteName: '항공편 시간표',
      type: 'website',
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary',
      title: `${depName} → ${arrName} 출발편 시간표`,
      description: `${depName}에서 ${arrName}까지 정기운항 출발편 시간표.`,
    },
    alternates: {
      canonical: `${BASE_URL}/departures/routes/${routeSlug}`,
    },
  };
}

export default async function DepartureRoutePage({ params }: Props) {
  const { route: routeSlug } = await params;
  const parsed = parseRouteSlug(routeSlug);

  if (!parsed) {
    notFound();
  }

  const route = getDepartureRoute(parsed.depCode, parsed.arrCode);
  const depAirport = getAirport(parsed.depCode);
  const arrAirport = getAirport(parsed.arrCode);
  const metadata = getMetadata();

  if (!route) {
    notFound();
  }

  const depName = depAirport?.airportName || route.depAirportName;
  const arrName = arrAirport?.airportName || route.arrAirportName;
  const seasonLabel = metadata?.season ? formatSeason(metadata.season) : '';

  const breadcrumbItems = [
    { name: '홈', url: BASE_URL },
    { name: '출발편 시간표', url: `${BASE_URL}/departures` },
    { name: `${depName} → ${arrName}`, url: `${BASE_URL}/departures/routes/${routeSlug}` },
  ];

  // 시간순 정렬
  const sortedFlights = [...route.flights].sort((a, b) =>
    a.scheduleTime.localeCompare(b.scheduleTime)
  );

  // 항공사 수
  const airlines = new Set(sortedFlights.map(f => f.airline));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <FlightJsonLd
        departureAirport={depName}
        arrivalAirport={arrName}
        departureIata={parsed.depCode}
        arrivalIata={parsed.arrCode}
        url={`${BASE_URL}/departures/routes/${routeSlug}`}
      />

      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-sky-600">홈</Link>
        <span className="mx-2">/</span>
        <Link href="/departures" className="hover:text-sky-600">출발편 시간표</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{depName} &rarr; {arrName}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {depName} &rarr; {arrName} 출발편
      </h1>
      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-8">
        <span>총 <strong className="text-gray-900">{sortedFlights.length}</strong>편</span>
        <span className="text-gray-300">|</span>
        <span>항공사 <strong className="text-gray-900">{airlines.size}</strong>개</span>
        {seasonLabel && (
          <>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-sky-400"></span>
              {seasonLabel} 시즌
            </span>
          </>
        )}
      </div>

      {/* 시간표 테이블 */}
      <FlightTable flights={sortedFlights} type="departure" />

      {/* 공식 사이트 안내 */}
      <div className="mt-6 bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm">
        <p className="text-sky-800">
          실시간 운항 현황(탑승구, 지연/결항 등)은{' '}
          <a href="https://www.airport.kr" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-medium hover:underline">인천국제공항 공식 사이트</a>에서 확인하세요.
        </p>
      </div>

      {/* 안내 문구 */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p>* 정기운항편 시간표는 인천국제공항공사 및 한국공항공사의 공공데이터를 기반으로 제공되며, 시즌/계절에 따라 변경될 수 있습니다.</p>
        <p className="mt-1">* 정확한 정보는 각 항공사 또는 <a href="https://www.airport.kr" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">인천공항 공식 사이트</a>, <a href="https://www.airport.co.kr" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">한국공항공사</a>에서 확인하세요.</p>
      </div>
    </div>
  );
}

