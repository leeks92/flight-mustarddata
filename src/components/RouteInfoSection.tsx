/**
 * 노선 상세 페이지 SEO 콘텐츠 섹션
 * 노선 설명 + 관련 노선 링크 + FAQ 아코디언
 */

import Link from 'next/link';
import type { FAQItem, RouteRelatedLinks } from '@/lib/route-seo';

interface RouteInfoSectionProps {
  descriptions: string[];
  faqItems: FAQItem[];
  relatedLinks: RouteRelatedLinks;
  seoMeta: {
    h2RouteInfo: string;
    h2Fare: string;
    estimatedDuration: string | null;
  };
  type: 'departure' | 'arrival';
}

export default function RouteInfoSection({
  descriptions,
  faqItems,
  relatedLinks,
  seoMeta,
  type,
}: RouteInfoSectionProps) {
  const basePath = type === 'departure' ? '/departures' : '/arrivals';
  const { reverseRoute, sameOriginRoutes, sameDestRoutes } = relatedLinks;
  const hasRelated = reverseRoute || sameOriginRoutes.length > 0 || sameDestRoutes.length > 0;

  return (
    <>
      {/* 노선 정보 */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{seoMeta.h2RouteInfo}</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          {/* 소요시간 배지 */}
          {seoMeta.estimatedDuration && (
            <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-lg px-4 py-3">
              <span className="text-2xl font-bold text-sky-700">{seoMeta.estimatedDuration}</span>
              <div className="text-xs text-sky-600 leading-tight">
                <span>예상 소요시간 (직항 기준)</span>
                <br />
                <span className="text-sky-500">※ 항공편·기상 조건에 따라 달라질 수 있습니다</span>
              </div>
            </div>
          )}
          <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
            {descriptions.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* 항공권 안내 (관련 노선 링크) */}
      {hasRelated && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{seoMeta.h2Fare}</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
            {/* 반대 노선 */}
            {reverseRoute && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">반대 방향 노선</h3>
                <Link
                  href={`/${reverseRoute.type === 'departure' ? 'departures' : 'arrivals'}/routes/${reverseRoute.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-md text-sm hover:bg-sky-100 transition-colors"
                >
                  {reverseRoute.label}
                </Link>
              </div>
            )}

            {/* 같은 출발지 인기 노선 */}
            {sameOriginRoutes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">같은 출발지 인기 노선</h3>
                <div className="flex flex-wrap gap-2">
                  {sameOriginRoutes.map(route => (
                    <Link
                      key={route.slug}
                      href={`${basePath}/routes/${route.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                    >
                      {route.label}
                      <span className="text-xs text-gray-500">({route.flightCount}편)</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 같은 도착지 다른 노선 */}
            {sameDestRoutes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">같은 도착지 다른 출발지</h3>
                <div className="flex flex-wrap gap-2">
                  {sameDestRoutes.map(route => (
                    <Link
                      key={route.slug}
                      href={`${basePath}/routes/${route.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                    >
                      {route.label}
                      <span className="text-xs text-gray-500">({route.flightCount}편)</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 자주 묻는 질문 */}
      {faqItems.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
            {faqItems.map((item, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                  {item.question}
                  <span className="ml-2 text-gray-400 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-700 leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
