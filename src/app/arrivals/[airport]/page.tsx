import type { Metadata } from 'next';
import Link from 'next/link';
import { getArrivalRoutes, getArrivalRoutesToAirport, getAirport } from '@/lib/data';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import { notFound } from 'next/navigation';
import { BASE_URL } from '@/lib/constants';

// 빌드 시 데이터가 없어도 에러 발생하지 않도록 설정
export const dynamicParams = false;

interface Props {
  params: Promise<{ airport: string }>;
}

export async function generateStaticParams() {
  const routes = getArrivalRoutes();
  const codes = new Set<string>();
  routes.forEach(r => codes.add(r.arrAirportCode));
  const params = Array.from(codes).map(code => ({ airport: code }));
  return params.length > 0 ? params : [{ airport: '_placeholder' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airport: airportCode } = await params;
  const airport = getAirport(airportCode);
  const name = airport?.airportName || airportCode;

  return {
    title: `${name} 도착편 시간표 - 출발지별 항공편 조회`,
    description: `${name}에 도착하는 항공편 시간표입니다. 출발지별 항공사, 편명, 도착 시간 정보를 확인하세요.`,
  };
}

export default async function ArrivalAirportPage({ params }: Props) {
  const { airport: airportCode } = await params;
  const routes = getArrivalRoutesToAirport(airportCode);
  const airport = getAirport(airportCode);

  if (routes.length === 0 && !airport) {
    notFound();
  }

  const airportName = airport?.airportName || airportCode;

  const breadcrumbItems = [
    { name: '홈', url: BASE_URL },
    { name: '도착편 시간표', url: `${BASE_URL}/arrivals` },
    { name: `${airportName} 도착`, url: `${BASE_URL}/arrivals/${airportCode}` },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-sky-600">홈</Link>
        <span className="mx-2">/</span>
        <Link href="/arrivals" className="hover:text-sky-600">도착편 시간표</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{airportName}</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">{airportName} 도착편</h1>
      <p className="text-gray-600 mb-8">{airportName}에 도착하는 항공편 목록입니다.</p>

      {routes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">도착편 데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route) => (
            <Link
              key={`${route.depAirportCode}-${route.arrAirportCode}`}
              href={`/arrivals/routes/${route.depAirportCode}-${route.arrAirportCode}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-indigo-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{route.depAirportCode}</span>
                <span className="text-xs text-gray-400">{route.flights.length}편</span>
              </div>
              <div className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                {route.depAirportName} &rarr; {route.arrAirportName}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
