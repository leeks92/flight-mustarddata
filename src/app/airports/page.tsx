import type { Metadata } from 'next';
import Link from 'next/link';
import { getAirports } from '@/lib/data';
import { getAllAirportInfo } from '@/lib/airport-info';
import { getAllAirportRegions, getContinentOrder, CONTINENT_ORDER } from '@/lib/airport-regions';
import { BreadcrumbJsonLd, ItemListJsonLd } from '@/components/JsonLd';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: '공항 정보 - 대륙별·국가별 공항 안내',
  description: '인천공항, 김포공항, 김해공항, 제주공항 등 국내 주요 공항과 해외 공항의 위치, 연락처, 운항 노선 정보를 대륙별·국가별로 확인하세요.',
  openGraph: {
    title: '공항 정보 - 대륙별·국가별 공항 안내',
    description: '국내 주요 공항과 해외 공항의 위치, 연락처, 운항 노선 정보를 확인하세요.',
    url: `${BASE_URL}/airports`,
    siteName: '항공편 시간표',
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary',
    title: '공항 정보 - 대륙별·국가별 공항 안내',
    description: '국내 주요 공항과 해외 공항의 위치, 연락처, 운항 노선 정보를 확인하세요.',
  },
  alternates: {
    canonical: `${BASE_URL}/airports`,
  },
};

// 대륙별 아이콘 (이모지)
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

interface AirportWithInfo {
  airportCode: string;
  airportName: string;
  info: {
    name: string;
    address: string;
    telephone: string;
    domestic: boolean;
    international: boolean;
  } | null;
}

interface CountryGroup {
  country: string;
  airports: AirportWithInfo[];
}

interface ContinentGroup {
  continent: string;
  countries: CountryGroup[];
  totalAirports: number;
}

export default function AirportListPage() {
  const airports = getAirports();
  const airportInfoMap = getAllAirportInfo();
  const regionMap = getAllAirportRegions();

  const breadcrumbItems = [
    { name: '홈', url: BASE_URL },
    { name: '공항 정보', url: `${BASE_URL}/airports` },
  ];

  const listItems = airports.slice(0, 20).map((airport, i) => ({
    name: airport.airportName,
    url: `${BASE_URL}/airports/${airport.airportCode}`,
    position: i + 1,
  }));

  // 공항에 상세 정보 병합 (훈련용 코드 등 비실제 공항 제외)
  const excludeCodes = new Set(['ZZZ']);
  const airportsWithInfo: AirportWithInfo[] = airports
    .filter(a => !excludeCodes.has(a.airportCode))
    .map(a => ({
      ...a,
      info: airportInfoMap[a.airportCode] || null,
    }));

  // 대륙 > 국가별로 그룹핑
  const continentMap = new Map<string, Map<string, AirportWithInfo[]>>();

  for (const airport of airportsWithInfo) {
    const region = regionMap[airport.airportCode];
    const continent = region?.continent || '기타';
    const country = region?.country || '기타';

    if (!continentMap.has(continent)) {
      continentMap.set(continent, new Map());
    }
    const countryMap = continentMap.get(continent)!;
    if (!countryMap.has(country)) {
      countryMap.set(country, []);
    }
    countryMap.get(country)!.push(airport);
  }

  // 대륙 순서대로 정렬, 국가 내 공항은 이름순
  const continentGroups: ContinentGroup[] = Array.from(continentMap.entries())
    .sort(([a], [b]) => getContinentOrder(a) - getContinentOrder(b))
    .map(([continent, countryMap]) => {
      const countries: CountryGroup[] = Array.from(countryMap.entries())
        .sort(([a], [b]) => a.localeCompare(b, 'ko'))
        .map(([country, airports]) => ({
          country,
          airports: airports.sort((a, b) =>
            a.airportName.localeCompare(b.airportName, 'ko')
          ),
        }));

      return {
        continent,
        countries,
        totalAirports: countries.reduce((sum, c) => sum + c.airports.length, 0),
      };
    });

  // 대륙 목차용 ID 생성
  const getContinentId = (continent: string) =>
    `continent-${continent.replace(/\s/g, '-')}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ItemListJsonLd items={listItems} name="주요 공항 목록" />

      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-sky-600">홈</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">공항 정보</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">공항 정보</h1>
      <p className="text-gray-600 mb-8">
        전체 {airports.length}개 공항을 대륙별·국가별로 확인하세요.
      </p>

      {airports.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">아직 공항 데이터가 없습니다.</p>
          <p className="text-sm mt-2">데이터가 수집되면 자동으로 표시됩니다.</p>
        </div>
      ) : (
        <>
          {/* 대륙 바로가기 네비게이션 */}
          <nav className="mb-10 flex flex-wrap gap-2">
            {continentGroups.map(({ continent, totalAirports }) => (
              <a
                key={continent}
                href={`#${getContinentId(continent)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-sky-100 hover:text-sky-700 text-gray-700 rounded-full transition-colors"
              >
                <span>{CONTINENT_ICON[continent] || '✈️'}</span>
                <span>{continent}</span>
                <span className="text-xs text-gray-400">({totalAirports})</span>
              </a>
            ))}
          </nav>

          {/* 대륙별 섹션 */}
          {continentGroups.map(({ continent, countries, totalAirports }) => (
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
                    {countries.length}개 국가 · {totalAirports}개 공항
                  </span>
                </div>
              </div>

              {/* 국가별 그룹 */}
              {countries.map(({ country, airports: countryAirports }) => (
                <div key={country} className="mb-6">
                  {/* 한국은 국가 소제목 불필요 (대륙명 = 국가명) */}
                  {continent !== '한국' && (
                    <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-sky-400 rounded-full" />
                      {country}
                      <span className="text-xs text-gray-400 font-normal">({countryAirports.length})</span>
                    </h3>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {countryAirports.map((airport) => (
                      <Link
                        key={airport.airportCode}
                        href={`/airports/${airport.airportCode}`}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-sky-300 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded font-mono">
                            {airport.airportCode}
                          </span>
                          <div className="flex gap-1">
                            {airport.info?.domestic && (
                              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">국내선</span>
                            )}
                            {airport.info?.international && (
                              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">국제선</span>
                            )}
                          </div>
                        </div>
                        <div className="text-base font-bold text-gray-800 group-hover:text-sky-600 transition-colors mb-1">
                          {airport.airportName}
                        </div>
                        {airport.info?.address && (
                          <p className="text-xs text-gray-500 truncate">{airport.info.address}</p>
                        )}
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
