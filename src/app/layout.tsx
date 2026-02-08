import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import { BASE_URL } from '@/lib/constants';

const GA_ID = 'G-7BEBJG33KL';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0284c7',
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: '인천공항 항공편 시간표 - 출발편, 도착편, 운항 현황 조회',
    template: '%s | 항공편 시간표',
  },
  description:
    '인천국제공항 출발편, 도착편 항공 시간표를 무료로 조회하세요. 정기운항편 스케줄, 터미널 정보, 항공사별 편명 조회. 대한항공, 아시아나항공, 제주항공 등 전체 항공사 운항 정보 제공.',
  keywords: [
    '인천공항 시간표',
    '인천공항 출발편',
    '인천공항 도착편',
    '항공편 시간표',
    '비행기 시간표',
    '인천공항 운항현황',
    '인천공항 탑승구',
    '인천공항 터미널',
    '대한항공 시간표',
    '아시아나 시간표',
    '제주항공 시간표',
    '항공편 조회',
    '정기운항편',
    '인천공항 출국',
    '인천공항 입국',
  ],
  alternates: {
    canonical: BASE_URL,
    types: {
      'application/rss+xml': `${BASE_URL}/feed.xml`,
    },
  },
  openGraph: {
    title: '인천공항 항공편 시간표 - 출발편, 도착편 조회',
    description: '인천국제공항 항공편 시간표를 무료로 조회하세요. 정기운항편 스케줄, 터미널 정보 제공.',
    type: 'website',
    locale: 'ko_KR',
    url: BASE_URL,
    siteName: '항공편 시간표',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '인천공항 항공편 시간표 조회',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '인천공항 항공편 시간표',
    description: '인천국제공항 항공편 시간표를 무료로 조회하세요.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: '교통',
  creator: 'MustardData',
  publisher: 'MustardData',
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  other: {
    'naver-site-verification': '', // TODO: 네이버 인증 코드 설정
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="google-adsense-account" content="ca-pub-3224638013189545" />
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3224638013189545"
          crossOrigin="anonymous"
        />
        {/* 네이버 SEO 최적화 메타태그 */}
        <meta name="NaverBot" content="All" />
        <meta name="NaverBot" content="index,follow" />
        <meta name="Yeti" content="All" />
        <meta name="Yeti" content="index,follow" />
        {/* 다음 SEO */}
        <meta name="daumsa" content="index,follow" />
        {/* 모바일 최적화 */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="항공편 시간표" />
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
      </head>
      <body className="min-h-screen flex flex-col">
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `}
        </Script>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
