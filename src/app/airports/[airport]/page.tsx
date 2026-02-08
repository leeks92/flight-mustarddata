import type { Metadata } from 'next';
import Link from 'next/link';
import { getAirports, getAirport, getDepartureRoutesFromAirport, getArrivalRoutesToAirport, getRoutesRelatedToAirport } from '@/lib/data';
import { getAirportInfo } from '@/lib/airport-info';
import { BreadcrumbJsonLd, AirportJsonLd } from '@/components/JsonLd';
import { notFound } from 'next/navigation';
import { BASE_URL } from '@/lib/constants';

export const dynamicParams = false;

interface Props {
  params: Promise<{ airport: string }>;
}

export async function generateStaticParams() {
  const airports = getAirports();
  const params = airports.map(a => ({ airport: a.airportCode }));
  return params.length > 0 ? params : [{ airport: '_placeholder' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airport: airportCode } = await params;
  const airport = getAirport(airportCode);
  const info = getAirportInfo(airportCode);
  const name = airport?.airportName || info?.name || airportCode;

  return {
    title: `${name} (${airportCode}) - 공항 정보, 운항 노선`,
    description: `${name}의 위치, 연락처, 출발편/도착편 운항 노선 정보를 확인하세요.`,
  };
}

export default async function AirportDetailPage({ params }: Props) {
  const { airport: airportCode } = await params;
  const airport = getAirport(airportCode);
  const info = getAirportInfo(airportCode);

  if (!airport && !info) {
    notFound();
  }

  const airportName = airport?.airportName || info?.name || airportCode;
  const isICN = airportCode === 'ICN';

  // 인천공항은 기존 방식 (직접 출발/도착 노선)
  // 해외 공항은 인천과의 연결 노선을 양방향으로 조회
  let depRoutes, arrRoutes;

  if (isICN) {
    depRoutes = getDepartureRoutesFromAirport(airportCode);
    arrRoutes = getArrivalRoutesToAirport(airportCode);
  } else {
    const related = getRoutesRelatedToAirport(airportCode);
    // fromICN: 인천→해당공항 출발편 = 해당 공항 입장에서 "인천에서 출발하여 이 공항에 도착하는 편"
    // toICN: 해당공항→인천 도착편 = 해당 공항 입장에서 "이 공항에서 출발하여 인천에 도착하는 편"
    depRoutes = related.toICN;   // 해당 공항에서 인천으로 출발하는 편
    arrRoutes = related.fromICN; // 인천에서 해당 공항으로 도착하는 편
  }

  const breadcrumbItems = [
    { name: '홈', url: BASE_URL },
    { name: '공항 정보', url: `${BASE_URL}/airports` },
    { name: airportName, url: `${BASE_URL}/airports/${airportCode}` },
  ];

  const totalRoutes = depRoutes.length + arrRoutes.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <AirportJsonLd
        name={airportName}
        address={info?.address}
        telephone={info?.telephone}
        url={`${BASE_URL}/airports/${airportCode}`}
        iataCode={airportCode}
      />

      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-sky-600">홈</Link>
        <span className="mx-2">/</span>
        <Link href="/airports" className="hover:text-sky-600">공항 정보</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{airportName}</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{airportName}</h1>
        <span className="text-lg font-mono bg-sky-100 text-sky-700 px-3 py-1 rounded-lg">{airportCode}</span>
      </div>

      {/* 공항 기본 정보 */}
      {info && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">공항 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {info.address && (
              <div className="flex gap-2">
                <span className="text-gray-500 shrink-0">주소:</span>
                <span className="text-gray-800">{info.address}</span>
              </div>
            )}
            {info.telephone && (
              <div className="flex gap-2">
                <span className="text-gray-500 shrink-0">전화:</span>
                <a href={`tel:${info.telephone}`} className="text-sky-600 hover:underline">{info.telephone}</a>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-gray-500 shrink-0">운항:</span>
              <div className="flex gap-2">
                {info.domestic && <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-xs">국내선</span>}
                {info.international && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">국제선</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 인천 ↔ 해당 공항 노선 안내 (인천이 아닌 경우) */}
      {!isICN && totalRoutes > 0 && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6 text-sm text-sky-800">
          <p>인천국제공항(ICN)과 {airportName}({airportCode}) 간 운항 노선입니다.</p>
        </div>
      )}

      {/* 출발편: 인천의 경우 ICN→각지, 해외 공항의 경우 해당공항→인천 */}
      {depRoutes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isICN ? '출발편' : `${airportName} → 인천`} ({depRoutes.length}개 노선)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {depRoutes.map((route) => (
              <Link
                key={`dep-${route.depAirportCode}-${route.arrAirportCode}`}
                href={`/arrivals/routes/${route.depAirportCode}-${route.arrAirportCode}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-sky-300 hover:shadow-md transition-all text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{route.depAirportName} &rarr; {route.arrAirportName}</span>
                  <span className="text-xs text-gray-400">{route.flights.length}편</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 도착편: 인천의 경우 각지→ICN, 해외 공항의 경우 인천→해당공항 */}
      {arrRoutes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isICN ? '도착편' : `인천 → ${airportName}`} ({arrRoutes.length}개 노선)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {arrRoutes.map((route) => (
              <Link
                key={`arr-${route.depAirportCode}-${route.arrAirportCode}`}
                href={`/departures/routes/${route.depAirportCode}-${route.arrAirportCode}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{route.depAirportName} &rarr; {route.arrAirportName}</span>
                  <span className="text-xs text-gray-400">{route.flights.length}편</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {totalRoutes === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">현재 운항 노선 데이터가 없습니다.</p>
          <p className="text-sm mt-2">데이터가 수집되면 자동으로 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}
