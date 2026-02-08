'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createRouteSlug } from '@/lib/slug-utils';

interface Airport {
  airportCode: string;
  airportName: string;
}

interface Props {
  airports: Airport[];
}

// 검색 가능한 커스텀 드롭다운 컴포넌트
function SearchableSelect({
  airports,
  value,
  onChange,
  placeholder,
}: {
  airports: Airport[];
  value: string;
  onChange: (code: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedAirport = airports.find(a => a.airportCode === value);

  // 검색 필터
  const filtered = query
    ? airports.filter(a =>
        a.airportName.toLowerCase().includes(query.toLowerCase()) ||
        a.airportCode.toLowerCase().includes(query.toLowerCase())
      )
    : airports;

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 하이라이트 인덱스 변경 시 스크롤
  useEffect(() => {
    if (listRef.current && isOpen) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex, isOpen]);

  const open = useCallback(() => {
    setIsOpen(true);
    setHighlightIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const select = useCallback((code: string) => {
    onChange(code);
    setIsOpen(false);
    setQuery('');
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        open();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(i => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightIndex]) {
          select(filtered[highlightIndex].airportCode);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* 선택 버튼 (닫혀있을 때) */}
      <button
        type="button"
        onClick={open}
        onKeyDown={handleKeyDown}
        className={`w-full text-left border rounded-xl p-4 pr-10 transition-all bg-white hover:border-gray-400 ${
          isOpen ? 'ring-2 ring-sky-500 border-sky-400' : 'border-gray-300'
        } ${value ? 'text-gray-900' : 'text-gray-400'}`}
      >
        <span className="block truncate text-base">
          {selectedAirport ? `${selectedAirport.airportName} (${selectedAirport.airportCode})` : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* 검색 입력 */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="공항 검색 (이름 또는 코드)..."
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-gray-50 placeholder-gray-400"
                autoComplete="off"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 결과 목록 */}
          <ul ref={listRef} className="max-h-60 overflow-y-auto py-1 overscroll-contain">
            {filtered.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                &apos;{query}&apos; 검색 결과가 없습니다
              </li>
            ) : (
              filtered.map((airport, idx) => {
                const isSelected = airport.airportCode === value;
                const isHighlighted = idx === highlightIndex;
                return (
                  <li
                    key={airport.airportCode}
                    onClick={() => select(airport.airportCode)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`px-4 py-2.5 cursor-pointer text-sm flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-sky-600 text-white'
                        : isHighlighted
                          ? 'bg-sky-50 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">
                      {airport.airportName}
                      <span className={`ml-2 text-xs ${isSelected ? 'text-sky-200' : 'text-gray-400'}`}>
                        {airport.airportCode}
                      </span>
                    </span>
                    {isSelected && (
                      <svg className="w-4 h-4 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </li>
                );
              })
            )}
          </ul>

          {/* 결과 수 */}
          {query && filtered.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
              {filtered.length}개 공항
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 고정된 공항 표시 (선택 불가)
function FixedAirportDisplay({ code, name }: { code: string; name: string }) {
  return (
    <div className="w-full border border-gray-200 rounded-xl p-4 bg-gray-50 text-gray-900 flex items-center justify-between">
      <span className="text-base font-medium">{name} ({code})</span>
      <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">고정</span>
    </div>
  );
}

export default function SearchForm({ airports }: Props) {
  const router = useRouter();
  const [flightType, setFlightType] = useState<'departure' | 'arrival'>('departure');
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [error, setError] = useState('');

  // 이름순 정렬
  const sortedAirports = [...airports].sort((a, b) =>
    a.airportName.localeCompare(b.airportName, 'ko')
  );

  const handleFlightTypeChange = (type: 'departure' | 'arrival') => {
    setFlightType(type);
    // 출발편: 출발=인천 고정, 도착편: 도착=인천 고정
    if (type === 'departure') {
      setDeparture('ICN');
      setArrival('');
    } else {
      setDeparture('');
      setArrival('ICN');
    }
    setError('');
  };

  // 초기 상태: 출발편이므로 출발 공항을 인천으로 고정
  useEffect(() => {
    setDeparture('ICN');
  }, []);

  const handleSearch = () => {
    if (flightType === 'departure' && !arrival) {
      setError('도착 공항을 선택해주세요');
      return;
    }
    if (flightType === 'arrival' && !departure) {
      setError('출발 공항을 선택해주세요');
      return;
    }
    if (departure === arrival) {
      setError('출발 공항과 도착 공항이 같습니다');
      return;
    }

    setError('');

    const routeSlug = createRouteSlug(departure, arrival);

    if (flightType === 'departure') {
      router.push(`/departures/routes/${routeSlug}`);
    } else {
      router.push(`/arrivals/routes/${routeSlug}`);
    }
  };

  return (
    <div>
      {/* 출발/도착 선택 탭 */}
      <div className="flex mb-6">
        <button
          onClick={() => handleFlightTypeChange('departure')}
          className={`flex-1 py-3 px-4 text-center font-bold rounded-l-xl border transition-all ${
            flightType === 'departure'
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
          }`}
        >
          출발편
        </button>
        <button
          onClick={() => handleFlightTypeChange('arrival')}
          className={`flex-1 py-3 px-4 text-center font-bold rounded-r-xl border-t border-r border-b transition-all ${
            flightType === 'arrival'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
          }`}
        >
          도착편
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">출발 공항</label>
          {flightType === 'departure' ? (
            <FixedAirportDisplay code="ICN" name="인천" />
          ) : (
            <SearchableSelect
              airports={sortedAirports}
              value={departure}
              onChange={(code) => { setDeparture(code); setError(''); }}
              placeholder="공항 검색 또는 선택"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">도착 공항</label>
          {flightType === 'arrival' ? (
            <FixedAirportDisplay code="ICN" name="인천" />
          ) : (
            <SearchableSelect
              airports={sortedAirports}
              value={arrival}
              onChange={(code) => { setArrival(code); setError(''); }}
              placeholder="공항 검색 또는 선택"
            />
          )}
        </div>

        <div className="flex items-end">
          <button
            onClick={handleSearch}
            className={`w-full text-white py-4 rounded-xl font-bold text-lg transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 ${
              flightType === 'departure'
                ? 'bg-sky-600 hover:bg-sky-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            시간표 조회하기
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 text-red-600 text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {error}
        </div>
      )}
    </div>
  );
}
