import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다 (404)',
  description: '요청하신 페이지를 찾을 수 없습니다. 항공편 시간표, 공항 정보를 이용해 보세요.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 아이콘 */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-sky-50 text-sky-600 mb-4">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-xl text-gray-600">페이지를 찾을 수 없습니다</p>
        </div>

        {/* 설명 */}
        <p className="text-gray-500 mb-8">
          요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.
          <br />
          아래 링크를 통해 원하시는 정보를 찾아보세요.
        </p>

        {/* 주요 링크 */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-sky-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-sky-700 transition"
          >
            메인 페이지로 이동
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/departures"
              className="block bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition text-sm"
            >
              출발편 시간표
            </Link>
            <Link
              href="/arrivals"
              className="block bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition text-sm"
            >
              도착편 시간표
            </Link>
          </div>

          <Link
            href="/airports"
            className="block bg-gray-50 text-gray-600 py-3 px-4 rounded-lg font-medium hover:bg-gray-100 transition text-sm"
          >
            공항 정보
          </Link>
        </div>

        {/* 인기 노선 */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-medium text-gray-500 mb-4">인기 노선 바로가기</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { name: '인천 → 도쿄(나리타)', href: '/departures/routes/ICN-NRT' },
              { name: '인천 → 오사카', href: '/departures/routes/ICN-KIX' },
              { name: '김포 → 제주', href: '/departures/routes/GMP-CJU' },
            ].map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="text-sm text-sky-600 hover:text-sky-800 hover:underline"
              >
                {route.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
