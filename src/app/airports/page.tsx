import type { Metadata } from 'next';
import Link from 'next/link';
import { getAirports } from '@/lib/data';
import { getAllAirportInfo } from '@/lib/airport-info';
import { BreadcrumbJsonLd, ItemListJsonLd } from '@/components/JsonLd';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: '공항 정보 - 국내 주요 공항 안내',
  description: '인천공항, 김포공항, 김해공항, 제주공항 등 국내 주요 공항의 위치, 연락처, 운항 노선 정보를 확인하세요.',
};

export default function AirportListPage() {
  const airports = getAirports();
  const airportInfoMap = getAllAirportInfo();

  const breadcrumbItems = [
    { name: '홈', url: BASE_URL },
    { name: '공항 정보', url: `${BASE_URL}/airports` },
  ];

  const listItems = airports.slice(0, 20).map((airport, i) => ({
    name: airport.airportName,
    url: `${BASE_URL}/airports/${airport.airportCode}`,
    position: i + 1,
  }));

  // 국내 주요 공항 정보와 병합
  const airportsWithInfo = airports.map(a => ({
    ...a,
    info: airportInfoMap[a.airportCode] || null,
  }));

  // 주요 공항 먼저, 나머지 이름순
  const majorCodes = ['ICN', 'GMP', 'PUS', 'CJU', 'TAE', 'CJJ', 'MWX', 'SHO'];
  const sorted = airportsWithInfo.sort((a, b) => {
    const aIdx = majorCodes.indexOf(a.airportCode);
    const bIdx = majorCodes.indexOf(b.airportCode);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.airportName.localeCompare(b.airportName, 'ko');
  });

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
      <p className="text-gray-600 mb-8">주요 공항의 위치, 연락처 및 운항 정보를 확인하세요.</p>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">아직 공항 데이터가 없습니다.</p>
          <p className="text-sm mt-2">데이터가 수집되면 자동으로 표시됩니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((airport) => (
            <Link
              key={airport.airportCode}
              href={`/airports/${airport.airportCode}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-sky-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
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
              <div className="text-lg font-bold text-gray-800 group-hover:text-sky-600 transition-colors mb-1">
                {airport.airportName}
              </div>
              {airport.info?.address && (
                <p className="text-xs text-gray-500 truncate">{airport.info.address}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
