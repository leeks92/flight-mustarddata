import type { MetadataRoute } from 'next';

// output: 'export' 호환을 위한 설정
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/static/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: 'Yeti', // 네이버 검색 봇
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: 'Daumoa', // 다음 검색 봇
        allow: '/',
        crawlDelay: 1,
      },
    ],
    sitemap: 'https://flight.mustarddata.com/sitemap.xml',
    host: 'https://flight.mustarddata.com',
  };
}
