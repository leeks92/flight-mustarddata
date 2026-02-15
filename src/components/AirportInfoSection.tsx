/**
 * 공항 상세 페이지 SEO 콘텐츠 섹션
 * 설명 + 주차·혼잡도·교통편 (한국만) + 관련 공항 + FAQ 아코디언
 */

import Link from 'next/link';
import type { FAQItem } from '@/lib/route-seo';
import type { AirportSeoMeta, AirportRelatedLinks } from '@/lib/airport-seo';
import type { KoreanAirportExtra } from '@/lib/airport-parking';

interface AirportInfoSectionProps {
  descriptions: string[];
  faqItems: FAQItem[];
  relatedLinks: AirportRelatedLinks;
  seoMeta: AirportSeoMeta;
  isKorean: boolean;
  extra?: KoreanAirportExtra | null;
}

function CongestionBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const styles = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };
  const labels = { low: '한산', medium: '보통', high: '혼잡' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

export default function AirportInfoSection({
  descriptions,
  faqItems,
  relatedLinks,
  seoMeta,
  isKorean,
  extra,
}: AirportInfoSectionProps) {
  const { sameRegionAirports, popularRoutes } = relatedLinks;
  const hasRelated = sameRegionAirports.length > 0 || popularRoutes.length > 0;

  return (
    <>
      {/* 공항 안내 */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{seoMeta.h2Info}</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3 text-sm text-gray-700 leading-relaxed">
          {descriptions.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      {/* 주차 요금 (한국만) */}
      {isKorean && extra && extra.parking.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{seoMeta.h2Parking}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {extra.parking.map((p, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">{p.type}</h3>
                <div className="space-y-1.5">
                  {p.rates.map((r, j) => (
                    <div key={j} className="flex justify-between text-sm">
                      <span className="text-gray-500">{r.label}</span>
                      <span className="font-medium text-gray-900">{r.price}</span>
                    </div>
                  ))}
                </div>
                {p.discountInfo && (
                  <p className="mt-3 text-xs text-sky-600 bg-sky-50 rounded px-2 py-1.5">{p.discountInfo}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 혼잡도 안내 (한국만) */}
      {isKorean && extra && extra.congestionTips.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{seoMeta.h2Congestion}</h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {extra.congestionTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <CongestionBadge level={tip.level} />
                <div className="flex-1 text-sm">
                  <span className="font-medium text-gray-800">{tip.period}</span>
                  <p className="text-gray-600 mt-0.5">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            ※ 일반적인 혼잡 패턴이며, 실시간 정보는{' '}
            {extra.website ? (
              <a href={extra.website} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">
                공식 사이트
              </a>
            ) : (
              '공식 사이트'
            )}
            에서 확인하세요.
          </p>
        </section>
      )}

      {/* 교통편 (한국만) */}
      {isKorean && extra && extra.transport.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{seoMeta.h2Transport}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {extra.transport.map((t, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">{t.type}</h3>
                <p className="text-sm text-gray-600 mb-2">{t.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {t.estimatedCost && (
                    <span>비용: <span className="text-gray-700 font-medium">{t.estimatedCost}</span></span>
                  )}
                  {t.estimatedTime && (
                    <span>소요: <span className="text-gray-700 font-medium">{t.estimatedTime}</span></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 관련 공항 + 인기 노선 */}
      {hasRelated && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">관련 공항 및 노선</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
            {sameRegionAirports.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">같은 지역 공항</h3>
                <div className="flex flex-wrap gap-2">
                  {sameRegionAirports.map(a => (
                    <Link
                      key={a.code}
                      href={`/airports/${a.code}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                    >
                      {a.name}
                      <span className="text-xs text-gray-400">({a.code})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {popularRoutes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">인기 노선</h3>
                <div className="flex flex-wrap gap-2">
                  {popularRoutes.map(route => (
                    <Link
                      key={route.slug}
                      href={`/${route.type === 'departure' ? 'departures' : 'arrivals'}/routes/${route.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-md text-sm hover:bg-sky-100 transition-colors"
                    >
                      {route.label}
                      <span className="text-xs text-sky-500">({route.flightCount}편)</span>
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
