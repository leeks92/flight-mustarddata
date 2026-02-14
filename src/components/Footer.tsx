import Link from 'next/link';
import { POPULAR_ROUTES } from '@/lib/constants';
import SisterSites from './SisterSites';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-3 text-gray-900">항공편 시간표</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/departures" className="hover:text-sky-600">
                  출발편 시간표
                </Link>
              </li>
              <li>
                <Link href="/arrivals" className="hover:text-sky-600">
                  도착편 시간표
                </Link>
              </li>
              <li>
                <Link href="/airports" className="hover:text-sky-600">
                  공항 정보
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3 text-gray-900">인기 노선</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {POPULAR_ROUTES.slice(0, 4).map(route => (
                <li key={`${route.dep}-${route.arr}`}>
                  <Link href={`/departures/routes/${route.dep}-${route.arr}`} className="hover:text-sky-600">
                    {route.depName} &rarr; {route.arrName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3 text-gray-900">항공사</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <a
                  href="https://www.koreanair.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-600"
                >
                  대한항공
                </a>
              </li>
              <li>
                <a
                  href="https://flyasiana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-600"
                >
                  아시아나항공
                </a>
              </li>
              <li>
                <a
                  href="https://www.jejuair.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-600"
                >
                  제주항공
                </a>
              </li>
              <li>
                <a
                  href="https://www.jinair.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sky-600"
                >
                  진에어
                </a>
              </li>
            </ul>
          </div>
          <div>
            <SisterSites currentSite="flight" />
          </div>
        </div>
        <div className="mt-8 pt-6 border-t text-center text-sm text-gray-600">
          <p>
            &copy; {currentYear} MustardData. 본 사이트의 항공편 정보는 공공데이터를
            기반으로 제공되며, 실제 운항 정보와 다를 수 있습니다.
          </p>
          <p className="mt-2">
            정확한 시간표와 예매는 각 항공사 공식 사이트를 이용해 주세요.
          </p>
        </div>
      </div>
    </footer>
  );
}
