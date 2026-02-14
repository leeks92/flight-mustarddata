'use client';

const allSites = [
  { key: 'calc', name: '금융계산기', href: 'https://calc.mustarddata.com' },
  { key: 'apt', name: '아파트 실거래가', href: 'https://apt.mustarddata.com' },
  { key: 'bus', name: '버스 시간표', href: 'https://bus.mustarddata.com' },
  { key: 'train', name: '기차 시간표', href: 'https://train.mustarddata.com' },
  { key: 'flight', name: '항공편 시간표', href: 'https://flight.mustarddata.com' },
  { key: 'rest', name: '고속도로 휴게소', href: 'https://rest.mustarddata.com' },
  { key: 'car', name: '자동차 정보', href: 'https://car.mustarddata.com' },
  { key: 'pharmacy', name: '약국 찾기', href: 'https://pharmacy.mustarddata.com' },
  { key: 'parking', name: '주차장 찾기', href: 'https://parking.mustarddata.com' },
  { key: 'hospital', name: '병원 찾기', href: 'https://hospital.mustarddata.com' },
  { key: 'school', name: '학교 정보', href: 'https://school.mustarddata.com' },
  { key: 'market', name: '전통시장', href: 'https://market.mustarddata.com' },
];

export default function SisterSites({ currentSite }: { currentSite: string }) {
  const sites = allSites.filter((s) => s.key !== currentSite);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = e.target.value;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      e.target.value = '';
    }
  };

  return (
    <div>
      <h3 className="font-bold mb-3 text-gray-900">관련 서비스</h3>
      <select
        onChange={handleChange}
        defaultValue=""
        className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="" disabled>
          머스타드데이터 사이트 바로가기
        </option>
        {sites.map((site) => (
          <option key={site.key} value={site.href}>
            {site.name}
          </option>
        ))}
      </select>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {sites.map((site) => (
          <li key={site.key}>
            <a
              href={site.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {site.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
