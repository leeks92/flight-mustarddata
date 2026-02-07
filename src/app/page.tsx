import Link from 'next/link';
import { getAirports, getDepartureRoutes, getArrivalRoutes, getMetadata, getActiveAirportCount } from '@/lib/data';
import { WebSiteJsonLd, OrganizationJsonLd, FAQJsonLd, ItemListJsonLd, HowToJsonLd, ServiceJsonLd } from '@/components/JsonLd';
import SearchForm from '@/components/SearchForm';
import { createRouteSlug } from '@/lib/slugs';
import { BASE_URL, POPULAR_ROUTES, MAJOR_AIRPORTS } from '@/lib/constants';

const faqItems = [
  {
    question: '인천공항 항공편 시간표는 어떻게 조회하나요?',
    answer: '본 서비스에서 출발 공항과 도착 공항을 선택하면 해당 노선의 항공편 시간표를 조회할 수 있습니다. 출발편과 도착편을 구분하여 검색이 가능합니다.',
  },
  {
    question: '인천공항 터미널은 어떻게 구분되나요?',
    answer: '인천국제공항은 제1터미널(T1)과 제2터미널(T2)로 나뉩니다. 대한항공, 델타항공, 에어프랑스 등은 제2터미널, 아시아나항공, 제주항공 등은 제1터미널을 이용합니다.',
  },
  {
    question: '정기운항 시간표는 무엇인가요?',
    answer: '정기운항 시간표는 시즌별(하계/동계) 고정된 운항 스케줄로, 요일별 취항 여부와 정기 출발/도착 시간을 확인할 수 있습니다. 당일 실시간 운항 현황(지연/결항 등)은 인천국제공항 공식 사이트에서 확인할 수 있습니다.',
  },
  {
    question: '국내선 항공편도 조회할 수 있나요?',
    answer: '현재는 인천국제공항 출발/도착 국제선 항공편 정보를 제공하고 있습니다. 국내선 시간표는 각 항공사 공식 사이트 또는 한국공항공사에서 확인할 수 있습니다.',
  },
  {
    question: '항공권 예매는 어디서 할 수 있나요?',
    answer: '항공권 예매는 각 항공사 공식 사이트(대한항공, 아시아나항공, 제주항공 등)나 여행사, 항공권 비교 사이트(네이버항공권, 스카이스캐너 등)에서 할 수 있습니다.',
  },
];

// HowTo 스텝
const howToSteps = [
  {
    name: '시간표 검색',
    text: '출발 공항과 도착 공항을 선택하여 항공편 시간표를 검색합니다. 운항 요일, 출발 시간, 항공사 정보를 확인할 수 있습니다.',
  },
  {
    name: '항공편 확인',
    text: '원하는 항공편의 편명, 출발/도착 시간, 터미널, 탑승구 정보를 확인합니다.',
  },
  {
    name: '항공권 예매',
    text: '확인한 항공편을 각 항공사 공식 사이트나 여행사를 통해 예매합니다.',
  },
  {
    name: '공항 도착',
    text: '출발 2~3시간 전까지 공항에 도착하여 체크인과 보안 검색을 진행합니다. 탑승구 위치를 확인하세요.',
  },
];

export default function HomePage() {
  const airports = getAirports();
  const departureRoutes = getDepartureRoutes();
  const arrivalRoutes = getArrivalRoutes();
  const metadata = getMetadata();
  const activeAirports = getActiveAirportCount();
  const totalRoutes = departureRoutes.length + arrivalRoutes.length;

  // ItemList용 인기 노선 데이터
  const popularRouteItems = POPULAR_ROUTES.map((route, index) => ({
    name: `${route.depName} → ${route.arrName} 항공편`,
    url: `${BASE_URL}/departures/routes/${createRouteSlug(route.dep, route.arr)}`,
    description: `${route.depName}에서 ${route.arrName}까지 항공편 시간표`,
    position: index + 1,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* JSON-LD 구조화 데이터 */}
      <WebSiteJsonLd
        name="인천공항 항공편 시간표 조회"
        url={BASE_URL}
        description="인천국제공항 출발편, 도착편 항공 시간표를 무료로 조회하세요. 정기운항편 스케줄, 터미널 정보 제공."
      />
      <OrganizationJsonLd />
      <FAQJsonLd items={faqItems} />
      <ItemListJsonLd items={popularRouteItems} name="인기 항공 노선" />
      <HowToJsonLd
        name="항공편 이용 방법"
        description="항공편 시간표를 확인하고 항공기를 이용하는 방법을 안내합니다."
        steps={howToSteps}
        totalTime="PT3H"
      />
      <ServiceJsonLd
        name="항공편 시간표 서비스"
        description="인천국제공항 출발편, 도착편 항공 시간표와 운항 정보를 무료로 제공하는 서비스입니다."
        provider="MustardData"
        areaServed={['인천', '서울', '부산', '제주', '대구', '청주', '광주', '무안']}
      />

      {/* 히어로 섹션 */}
      <section className="relative h-[400px] flex flex-col justify-center items-center text-white overflow-hidden bg-gradient-to-br from-sky-700 via-sky-600 to-indigo-700">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
            인천공항 항공편 시간표
          </h1>
          <p className="text-lg md:text-xl text-white mb-8 drop-shadow-md max-w-2xl mx-auto">
            출발 공항과 도착 공항을 선택하여 항공편 시간표와 운항 현황을 확인하세요
          </p>
        </div>
      </section>

      {/* 검색 섹션 */}
      <section className="relative -mt-20 z-20 px-4 mb-16">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">
              <svg className="w-6 h-6 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </span> 항공편 검색
          </h2>
          <SearchForm airports={airports} />

          {/* 통계 */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap justify-center gap-6 md:gap-12 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>출발 공항 <strong className="text-gray-900 text-lg ml-1">{activeAirports.departure}</strong>개</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>도착 공항 <strong className="text-gray-900 text-lg ml-1">{activeAirports.arrival}</strong>개</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>노선 <strong className="text-gray-900 text-lg ml-1">{totalRoutes.toLocaleString()}</strong>개</span>
            </div>
            {metadata && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span>업데이트 <span className="text-gray-700 ml-1">{new Date(metadata.lastUpdated).toLocaleDateString('ko-KR')}</span></span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* 출발편/도착편 링크 */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Link
            href="/departures"
            className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="p-8">
              <div className="inline-block p-3 rounded-lg bg-sky-50 text-sky-600 mb-4 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">출발편 시간표</h3>
              <p className="text-gray-700 mb-4">인천공항에서 출발하는 항공편 운항정보를 확인하세요.</p>
              <div className="flex items-center text-sky-700 font-medium">
                바로가기
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </Link>

          <Link
            href="/arrivals"
            className="group relative overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="p-8">
              <div className="inline-block p-3 rounded-lg bg-indigo-50 text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">도착편 시간표</h3>
              <p className="text-gray-700 mb-4">인천공항에 도착하는 항공편 운항정보를 확인하세요.</p>
              <div className="flex items-center text-indigo-700 font-medium">
                바로가기
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </div>
          </Link>
        </section>

        {/* 인기 노선 */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">주요 노선</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {POPULAR_ROUTES.map((route, index) => (
              <Link
                key={index}
                href={`/departures/routes/${createRouteSlug(route.dep, route.arr)}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-sky-300 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded">출발</span>
                  <span className="text-gray-400 group-hover:text-sky-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold text-gray-800">
                  <span>{route.depName}</span>
                  <span className="text-gray-300 mx-2">|</span>
                  <span>{route.arrName}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 공항 찾기 */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">공항 정보</h2>
          <div className="text-center">
            <Link
              href="/airports"
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              공항 정보 보기
            </Link>
            <p className="text-gray-500 mt-4 text-sm">주요 공항의 위치, 연락처 및 운항 노선 정보를 확인하세요</p>
          </div>
        </section>

        {/* FAQ 섹션 */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">자주 묻는 질문</h2>
          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <details key={index} className="bg-white border border-gray-200 rounded-lg group">
                <summary className="p-4 cursor-pointer font-medium text-gray-900 flex items-center justify-between hover:bg-gray-50">
                  <span>{faq.question}</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 text-gray-700 text-sm leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* 주요 공항 링크 */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">주요 공항</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MAJOR_AIRPORTS.map((airport, index) => (
              <Link
                key={index}
                href={`/airports/${airport.code}`}
                className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:border-sky-300 hover:shadow-md transition-all text-sm font-medium text-gray-800"
              >
                {airport.name}
              </Link>
            ))}
          </div>
        </section>

        {/* SEO 텍스트 */}
        <section className="mt-16 bg-gray-100 rounded-xl p-6 text-gray-700 text-sm leading-relaxed">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            항공편 시간표 서비스 안내
          </h2>
          <div className="space-y-3">
            <p>
              본 서비스는 인천국제공항공사의 공공데이터포털 API를 활용하여 인천국제공항의 여객편 운항 현황을 제공합니다.
              출발편과 도착편의 항공사, 편명, 예정 시간, 터미널, 탑승구 등의 정보를 쉽고 빠르게 검색할 수 있습니다.
            </p>
            <p>
              <strong>인천국제공항</strong>은 대한민국의 대표 국제공항으로, 연간 약 7천만 명의 여객이 이용하며
              전 세계 주요 도시로의 항공편을 운항하고 있습니다.
              제1터미널과 제2터미널을 운영하고 있으며, 항공사별로 이용 터미널이 다릅니다.
            </p>
            <p>
              제공되는 정보는 기상 상황, 항공사 사정 등에 따라 변경될 수 있습니다.
              정확한 항공편 정보와 예매는
              <a href="https://www.airport.kr" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-semibold ml-1">인천국제공항 공식 사이트</a>,
              각 항공사 홈페이지를 이용해 주시기 바랍니다.
            </p>
          </div>
        </section>

        {/* 항공편 이용 방법 */}
        <section className="mt-12 bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">항공편 이용 방법</h2>
          <ol className="space-y-3">
            {howToSteps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <div>
                  <strong className="text-gray-900">{step.name}</strong>
                  <p className="text-sm text-gray-600 mt-1">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
