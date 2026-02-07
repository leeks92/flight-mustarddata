import type { Metadata } from 'next';
import Link from 'next/link';
import { getArrivalRoutes } from '@/lib/data';
import { BreadcrumbJsonLd, ItemListJsonLd } from '@/components/JsonLd';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: '도착편 시간표 - 인천공항 도착 항공편 조회',
  description: '인천국제공항에 도착하는 항공편 시간표입니다. 출발지별 항공편 정보, 도착 시간, 항공사, 터미널 정보를 확인하세요.',
};

export default function ArrivalListPage() {
  const routes = getArrivalRoutes();

  // 출발지별 그룹핑
  const airportMap = new Map<string, { code: string; name: string; count: number }>();
  routes.forEach(route => {
    const key = route.depAirportCode;
    const existing = airportMap.get(key);
    if (existing) {
      existing.count += route.flights.length;
    } else {
      airportMap.set(key, {
        code: route.depAirportCode,
        name: route.depAirportName,
        count: route.flights.length,
      });
    }
  });

  const origins = Array.from(airportMap.values())
    .sort((a, b) => b.count - a.count);

  const breadcrumbItems = [
    { name: '홈', url: BASE_URL },
    { name: '도착편 시간표', url: `${BASE_URL}/arrivals` },
  ];

  const listItems = origins.slice(0, 20).map((origin, i) => ({
    name: `${origin.name} → 인천 항공편`,
    url: `${BASE_URL}/arrivals/${origin.code}`,
    position: i + 1,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ItemListJsonLd items={listItems} name="인천공항 도착 출발지" />

      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-sky-600">홈</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">도착편 시간표</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">도착편 시간표</h1>
      <p className="text-gray-600 mb-8">인천국제공항에 도착하는 항공편의 출발지별 시간표입니다.</p>

      {origins.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">아직 도착편 데이터가 없습니다.</p>
          <p className="text-sm mt-2">데이터가 수집되면 자동으로 표시됩니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {origins.map((origin) => (
            <Link
              key={origin.code}
              href={`/arrivals/routes/${origin.code}-${routes.find(r => r.depAirportCode === origin.code)?.arrAirportCode || 'ICN'}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-indigo-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{origin.code}</span>
                <span className="text-xs text-gray-400">{origin.count}편</span>
              </div>
              <div className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                {origin.name} &rarr; 인천
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
