import type { Metadata } from 'next';
import Link from 'next/link';
import { getAirports, getAirport, getRoutesRelatedToAirport, getDepartureRoutes, getArrivalRoutes, getMetadata, formatSeason } from '@/lib/data';
import { getAirportInfo } from '@/lib/airport-info';
import { getAirportRegion } from '@/lib/airport-regions';
import { getKoreanAirportExtra } from '@/lib/airport-parking';
import { computeAirportStats, generateAirportSeoMeta, generateAirportDescription, generateAirportFAQ, getRelatedAirports } from '@/lib/airport-seo';
import { BreadcrumbJsonLd, AirportJsonLd, FAQJsonLd } from '@/components/JsonLd';
import AirportInfoSection from '@/components/AirportInfoSection';
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

/** 공항 코드에서 addressCountry ISO 코드 추출 */
function getCountryCode(airportCode: string): string {
  const region = getAirportRegion(airportCode);
  if (!region) return 'KR';
  const countryMap: Record<string, string> = {
    '한국': 'KR', '일본': 'JP', '중국': 'CN', '대만': 'TW', '홍콩': 'HK', '마카오': 'MO',
    '몽골': 'MN', '태국': 'TH', '싱가포르': 'SG', '베트남': 'VN', '필리핀': 'PH',
    '말레이시아': 'MY', '인도네시아': 'ID', '미얀마': 'MM', '라오스': 'LA', '캄보디아': 'KH',
    '브루나이': 'BN', '인도': 'IN', '네팔': 'NP', '스리랑카': 'LK', '방글라데시': 'BD',
    '우즈베키스탄': 'UZ', '카자흐스탄': 'KZ', '키르기스스탄': 'KG', '투르크메니스탄': 'TM',
    'UAE': 'AE', '카타르': 'QA', '튀르키예': 'TR',
    '영국': 'GB', '프랑스': 'FR', '독일': 'DE', '네덜란드': 'NL', '이탈리아': 'IT',
    '스페인': 'ES', '체코': 'CZ', '오스트리아': 'AT', '핀란드': 'FI', '덴마크': 'DK',
    '폴란드': 'PL', '헝가리': 'HU', '포르투갈': 'PT',
    '미국': 'US', '캐나다': 'CA', '멕시코': 'MX',
    '호주': 'AU', '뉴질랜드': 'NZ', '에티오피아': 'ET', '이집트': 'EG',
  };
  return countryMap[region.country] || 'KR';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airport: airportCode } = await params;
  const airport = getAirport(airportCode);
  const info = getAirportInfo(airportCode);
  const name = airport?.airportName || info?.name || airportCode;
  const region = getAirportRegion(airportCode);
  const isKorean = region?.continent === '한국';

  let depRoutes, arrRoutes;
  if (isKorean) {
    const related = getRoutesRelatedToAirport(airportCode);
    depRoutes = related.departures;
    arrRoutes = related.arrivals;
  } else {
    depRoutes = getDepartureRoutes().filter(r => r.arrAirportCode === airportCode);
    arrRoutes = getArrivalRoutes().filter(r => r.depAirportCode === airportCode);
  }

  const stats = computeAirportStats(depRoutes, arrRoutes);
  const extra = isKorean ? getKoreanAirportExtra(airportCode) : null;
  const seoMeta = generateAirportSeoMeta(airportCode, name, stats, isKorean, !!extra);

  return {
    title: seoMeta.title,
    description: seoMeta.description,
    openGraph: {
      title: seoMeta.title,
      description: seoMeta.description,
      url: `${BASE_URL}/airports/${airportCode}`,
      siteName: '항공편 시간표',
      type: 'website',
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary',
      title: seoMeta.title,
      description: seoMeta.description,
    },
    alternates: {
      canonical: `${BASE_URL}/airports/${airportCode}`,
    },
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
  const region = getAirportRegion(airportCode);
  const isKorean = region?.continent === '한국';

  let depRoutes, arrRoutes;

  if (isKorean) {
    const related = getRoutesRelatedToAirport(airportCode);
    depRoutes = related.departures;
    arrRoutes = related.arrivals;
  } else {
    depRoutes = getDepartureRoutes().filter(r => r.arrAirportCode === airportCode);
    arrRoutes = getArrivalRoutes().filter(r => r.depAirportCode === airportCode);
  }

  // SEO 데이터 생성
  const stats = computeAirportStats(depRoutes, arrRoutes);
  const extra = isKorean ? getKoreanAirportExtra(airportCode) : null;
  const seoMeta = generateAirportSeoMeta(airportCode, airportName, stats, isKorean, !!extra);
  const meta = getMetadata();
  const seasonLabel = meta?.season ? formatSeason(meta.season) : '';
  const descriptions = generateAirportDescription(airportCode, airportName, stats, isKorean, seasonLabel);
  const faqItems = generateAirportFAQ(airportCode, airportName, stats, isKorean, extra);
  const relatedLinks = getRelatedAirports(airportCode);
  const countryCode = getCountryCode(airportCode);

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
        addressCountry={countryCode}
      />
      {faqItems.length > 0 && <FAQJsonLd items={faqItems} />}

      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-sky-600">홈</Link>
        <span className="mx-2">/</span>
        <Link href="/airports" className="hover:text-sky-600">공항 정보</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{airportName}</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{seoMeta.h1}</h1>
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
            {isKorean && extra && (
              <div className="flex gap-2">
                <span className="text-gray-500 shrink-0">운영:</span>
                <span className="text-gray-800">{extra.operatingHours}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 외국 공항: 한국 공항과의 연결 노선 안내 */}
      {!isKorean && totalRoutes > 0 && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6 text-sm text-sky-800">
          <p>한국 공항과 {airportName}({airportCode}) 간 운항 노선입니다.</p>
        </div>
      )}

      {/* 출발편 */}
      {depRoutes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            출발편 ({depRoutes.length}개 노선)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {depRoutes.map((route) => (
              <Link
                key={`dep-${route.depAirportCode}-${route.arrAirportCode}`}
                href={`/departures/routes/${route.depAirportCode}-${route.arrAirportCode}`}
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

      {/* 도착편 */}
      {arrRoutes.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            도착편 ({arrRoutes.length}개 노선)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {arrRoutes.map((route) => (
              <Link
                key={`arr-${route.depAirportCode}-${route.arrAirportCode}`}
                href={`/arrivals/routes/${route.depAirportCode}-${route.arrAirportCode}`}
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

      {/* SEO 콘텐츠: 설명, 주차, 혼잡도, 교통편, 관련 공항, FAQ */}
      <AirportInfoSection
        descriptions={descriptions}
        faqItems={faqItems}
        relatedLinks={relatedLinks}
        seoMeta={seoMeta}
        isKorean={isKorean}
        extra={extra}
      />
    </div>
  );
}
