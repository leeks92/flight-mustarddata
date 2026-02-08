import type { Metadata } from 'next';
import Link from 'next/link';
import { getArrivalRoutes } from '@/lib/data';
import { getAllAirportRegions, getContinentOrder, CONTINENT_ORDER } from '@/lib/airport-regions';
import { BreadcrumbJsonLd, ItemListJsonLd } from '@/components/JsonLd';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: '도착편 시간표 - 인천공항 도착 항공편 조회',
  description: '인천국제공항에 도착하는 항공편 시간표입니다. 출발지별 항공편 정보, 도착 시간, 항공사, 터미널 정보를 대륙별·국가별로 확인하세요.',
};

// 대륙별 아이콘
const CONTINENT_ICON: Record<string, string> = {
  '한국': '🇰🇷',
  '동아시아': '🌏',
  '동남아시아': '🌴',
  '남아시아': '🏔️',
  '중앙아시아': '🏜️',
  '중동': '🕌',
  '유럽': '🏰',
  '북미': '🗽',
  '중남미': '🌮',
  '오세아니아': '🦘',
  '아프리카': '🌍',
};

// 대륙별 배경 그라데이션 스타일
const CONTINENT_STYLE: Record<string, string> = {
  '한국': 'from-rose-50 to-white border-rose-200',
  '동아시아': 'from-amber-50 to-white border-amber-200',
  '동남아시아': 'from-emerald-50 to-white border-emerald-200',
  '남아시아': 'from-orange-50 to-white border-orange-200',
  '중앙아시아': 'from-yellow-50 to-white border-yellow-200',
  '중동': 'from-amber-50 to-white border-amber-200',
  '유럽': 'from-blue-50 to-white border-blue-200',
  '북미': 'from-indigo-50 to-white border-indigo-200',
  '중남미': 'from-lime-50 to-white border-lime-200',
  '오세아니아': 'from-cyan-50 to-white border-cyan-200',
  '아프리카': 'from-yellow-50 to-white border-yellow-200',
};

interface OriginInfo {
  code: string;
  name: string;
  count: number;
  arrCode: string; // 도착 공항 코드 (라우팅용)
}

interface CountryGroup {
  country: string;
  origins: OriginInfo[];
}

interface ContinentGroup {
  continent: string;
  countries: CountryGroup[];
  totalOrigins: number;
  totalFlights: number;
}

export default function ArrivalListPage() {
  const routes = getArrivalRoutes();
  const regionMap = getAllAirportRegions();

  // 출발지별 그룹핑
  const airportMap = new Map<string, OriginInfo>();
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
        arrCode: route.arrAirportCode,
      });
    }
  });

  const origins = Array.from(airportMap.values());

  // 대륙 > 국가별 그룹핑
  const continentMap = new Map<string, Map<string, OriginInfo[]>>();

  for (const origin of origins) {
    const region = regionMap[origin.code];
    const continent = region?.continent || '기타';
    const country = region?.country || '기타';

    if (!continentMap.has(continent)) {
      continentMap.set(continent, new Map());
    }
    const countryMap = continentMap.get(continent)!;
    if (!countryMap.has(country)) {
      countryMap.set(country, []);
    }
    countryMap.get(country)!.push(origin);
  }

  // 대륙 순서대로 정렬
  const continentGroups: ContinentGroup[] = Array.from(continentMap.entries())
    .sort(([a], [b]) => getContinentOrder(a) - getContinentOrder(b))
    .map(([continent, countryMap]) => {
      const countries: CountryGroup[] = Array.from(countryMap.entries())
        .sort(([a], [b]) => a.localeCompare(b, 'ko'))
        .map(([country, origs]) => ({
          country,
          origins: origs.sort((a, b) => b.count - a.count),
        }));

      const totalOrigins = countries.reduce((sum, c) => sum + c.origins.length, 0);
      const totalFlights = countries.reduce(
        (sum, c) => sum + c.origins.reduce((s, o) => s + o.count, 0), 0
      );

      return { continent, countries, totalOrigins, totalFlights };
    });

  const breadcrumbItems = [
    { name: '홈', url: BASE_URL },
    { name: '도착편 시간표', url: `${BASE_URL}/arrivals` },
  ];

  const listItems = origins
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map((origin, i) => ({
      name: `${origin.name} → 인천 항공편`,
      url: `${BASE_URL}/arrivals/routes/${origin.code}-${origin.arrCode}`,
      position: i + 1,
    }));

  const getContinentId = (continent: string) =>
    `continent-${continent.replace(/\s/g, '-')}`;

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
      <p className="text-gray-600 mb-8">
        인천국제공항에 도착하는 {origins.length}개 출발지 항공편을 대륙별·국가별로 확인하세요.
      </p>

      {origins.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">아직 도착편 데이터가 없습니다.</p>
          <p className="text-sm mt-2">데이터가 수집되면 자동으로 표시됩니다.</p>
        </div>
      ) : (
        <>
          {/* 대륙 바로가기 네비게이션 */}
          <nav className="mb-10 flex flex-wrap gap-2">
            {continentGroups.map(({ continent, totalOrigins }) => (
              <a
                key={continent}
                href={`#${getContinentId(continent)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-700 rounded-full transition-colors"
              >
                <span>{CONTINENT_ICON[continent] || '✈️'}</span>
                <span>{continent}</span>
                <span className="text-xs text-gray-400">({totalOrigins})</span>
              </a>
            ))}
          </nav>

          {/* 대륙별 섹션 */}
          {continentGroups.map(({ continent, countries, totalOrigins, totalFlights }) => (
            <section
              key={continent}
              id={getContinentId(continent)}
              className="mb-12 scroll-mt-4"
            >
              {/* 대륙 헤더 */}
              <div className={`bg-gradient-to-r ${CONTINENT_STYLE[continent] || 'from-gray-50 to-white border-gray-200'} border rounded-xl p-5 mb-5`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">{CONTINENT_ICON[continent] || '✈️'}</span>
                    {continent}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {countries.length}개 국가 · {totalOrigins}개 노선 · {totalFlights}편
                  </span>
                </div>
              </div>

              {/* 국가별 그룹 */}
              {countries.map(({ country, origins: countryOrigins }) => (
                <div key={country} className="mb-6">
                  {continent !== country && (
                    <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-indigo-400 rounded-full" />
                      {country}
                      <span className="text-xs text-gray-400 font-normal">({countryOrigins.length})</span>
                    </h3>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {countryOrigins.map((origin) => (
                      <Link
                        key={origin.code}
                        href={`/arrivals/routes/${origin.code}-${origin.arrCode}`}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-indigo-300 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded font-mono">
                            {origin.code}
                          </span>
                          <span className="text-xs text-gray-400">{origin.count}편</span>
                        </div>
                        <div className="text-base font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                          {origin.name} &rarr; 인천
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
