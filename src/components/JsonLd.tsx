/**
 * JSON-LD 구조화 데이터 컴포넌트
 * Google 리치 스니펫을 위한 Schema.org 마크업
 */

interface WebSiteSchemaProps {
  name: string;
  url: string;
  description: string;
}

interface AirportSchemaProps {
  name: string;
  address?: string;
  telephone?: string;
  url: string;
  iataCode?: string;
}

interface FlightSchemaProps {
  departureAirport: string;
  arrivalAirport: string;
  departureIata?: string;
  arrivalIata?: string;
  url: string;
  airline?: string;
  flightNumber?: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ItemListItem {
  name: string;
  url: string;
  description?: string;
  position?: number;
}

interface HowToStep {
  name: string;
  text: string;
  url?: string;
}

// WebSite 스키마 (메인 페이지용)
export function WebSiteJsonLd({ name, url, description }: WebSiteSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Airport 스키마 (공항 페이지용)
export function AirportJsonLd({
  name,
  address,
  telephone,
  url,
  iataCode,
}: AirportSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Airport',
    name,
    url,
  };

  if (iataCode) {
    schema.iataCode = iataCode;
  }

  if (address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressCountry: 'KR',
    };
  }

  if (telephone) {
    schema.telephone = telephone;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Flight 스키마 (노선 페이지용)
export function FlightJsonLd({
  departureAirport,
  arrivalAirport,
  departureIata,
  arrivalIata,
  url,
  airline,
  flightNumber,
}: FlightSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Flight',
    name: `${departureAirport} → ${arrivalAirport} 항공편`,
    departureAirport: {
      '@type': 'Airport',
      name: departureAirport,
      ...(departureIata && { iataCode: departureIata }),
    },
    arrivalAirport: {
      '@type': 'Airport',
      name: arrivalAirport,
      ...(arrivalIata && { iataCode: arrivalIata }),
    },
    url,
  };

  if (airline) {
    schema.provider = {
      '@type': 'Airline',
      name: airline,
    };
  }

  if (flightNumber) {
    schema.flightNumber = flightNumber;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Breadcrumb 스키마
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// FAQ 스키마
export function FAQJsonLd({ items }: { items: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Organization 스키마
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '항공편 시간표 - mustarddata',
    url: 'https://flight.mustarddata.com',
    logo: 'https://flight.mustarddata.com/icon.png',
    sameAs: [
      'https://mustarddata.com',
      'https://bus.mustarddata.com',
      'https://train.mustarddata.com',
      'https://calc.mustarddata.com',
      'https://apt.mustarddata.com',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'Korean',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ItemList 스키마
export function ItemListJsonLd({ items, name }: { items: ItemListItem[]; name: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position || index + 1,
      name: item.name,
      url: item.url,
      ...(item.description && { description: item.description }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// HowTo 스키마
export function HowToJsonLd({
  name,
  description,
  steps,
  totalTime,
}: {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(totalTime && { totalTime }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Service 스키마
export function ServiceJsonLd({
  name,
  description,
  provider,
  areaServed,
}: {
  name: string;
  description: string;
  provider: string;
  areaServed: string[];
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: provider,
    },
    areaServed: areaServed.map(area => ({
      '@type': 'Place',
      name: area,
    })),
    serviceType: '항공 운항 정보 서비스',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
