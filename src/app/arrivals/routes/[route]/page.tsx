import type { Metadata } from 'next';
import Link from 'next/link';
import { getArrivalRoutes, getArrivalRoute, getAirport, formatDays, getMetadata, formatSeason } from '@/lib/data';
import { BreadcrumbJsonLd, FlightJsonLd } from '@/components/JsonLd';
import { createRouteSlug, parseRouteSlug } from '@/lib/slugs';
import { notFound } from 'next/navigation';
import { BASE_URL } from '@/lib/constants';
import DayBadge from '@/components/DayBadge';

export const dynamicParams = false;

interface Props {
  params: Promise<{ route: string }>;
}

export async function generateStaticParams() {
  const routes = getArrivalRoutes();
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
    title: `${depName} → ${arrName} 도착편 정기운항 시간표 - 항공사, 편명, 운항요일`,
    description: `${depName}에서 인천(${arrName})까지 정기운항 도착편 시간표입니다. 항공사별 편명, 도착 시간, 요일별 운항 정보를 확인하세요.`,
    alternates: {
      canonical: `${BASE_URL}/arrivals/routes/${routeSlug}`,
    },
  };
}

export default async function ArrivalRoutePage({ params }: Props) {
  const { route: routeSlug } = await params;
  const parsed = parseRouteSlug(routeSlug);

  if (!parsed) {
    notFound();
  }

  const route = getArrivalRoute(parsed.depCode, parsed.arrCode);
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
    { name: '도착편 시간표', url: `${BASE_URL}/arrivals` },
    { name: `${depName} → ${arrName}`, url: `${BASE_URL}/arrivals/routes/${routeSlug}` },
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
        url={`${BASE_URL}/arrivals/routes/${routeSlug}`}
      />

      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-sky-600">홈</Link>
        <span className="mx-2">/</span>
        <Link href="/arrivals" className="hover:text-sky-600">도착편 시간표</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{depName} &rarr; {arrName}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {depName} &rarr; {arrName} 도착편
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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>항공사</th>
                <th>편명</th>
                <th>도착 시간</th>
                <th>운항 요일</th>
                <th className="hidden sm:table-cell">월</th>
                <th className="hidden sm:table-cell">화</th>
                <th className="hidden sm:table-cell">수</th>
                <th className="hidden sm:table-cell">목</th>
                <th className="hidden sm:table-cell">금</th>
                <th className="hidden sm:table-cell">토</th>
                <th className="hidden sm:table-cell">일</th>
              </tr>
            </thead>
            <tbody>
              {sortedFlights.map((flight, index) => (
                <tr key={index}>
                  <td className="font-medium">{flight.airline}</td>
                  <td className="text-indigo-600 font-mono">{flight.flightId}</td>
                  <td className="font-bold">{flight.scheduleTime}</td>
                  <td className="sm:hidden text-xs">
                    {formatDays(flight.days)}
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.mon} />
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.tue} />
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.wed} />
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.thu} />
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.fri} />
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.sat} />
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.sun} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 공식 사이트 안내 */}
      <div className="mt-6 bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm">
        <p className="text-sky-800">
          실시간 운항 현황(수하물수취대, 지연/결항 등)은{' '}
          <a href="https://www.airport.kr" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-medium hover:underline">인천국제공항 공식 사이트</a>에서 확인하세요.
        </p>
      </div>

      {/* 안내 문구 */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p>* 정기운항편 시간표는 인천국제공항공사 공공데이터를 기반으로 제공되며, 시즌/계절에 따라 변경될 수 있습니다.</p>
        <p className="mt-1">* 정확한 정보는 각 항공사 또는 <a href="https://www.airport.kr" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">인천공항 공식 사이트</a>에서 확인하세요.</p>
      </div>
    </div>
  );
}

