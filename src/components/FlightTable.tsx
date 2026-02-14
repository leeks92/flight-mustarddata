'use client';

import { useState } from 'react';
import DayBadge from './DayBadge';
import type { FlightEntry, DaysOfWeek } from '@/lib/types';

const INITIAL_DISPLAY_COUNT = 20;

const DAY_LABELS: Record<keyof DaysOfWeek, string> = {
  mon: '월', tue: '화', wed: '수', thu: '목',
  fri: '금', sat: '토', sun: '일',
};
const ALL_DAYS: (keyof DaysOfWeek)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function formatDays(days: DaysOfWeek): string {
  const activeDays = ALL_DAYS.filter(d => days[d]);
  if (activeDays.length === 7) return '매일';
  if (activeDays.length === 0) return '-';
  return activeDays.map(d => DAY_LABELS[d]).join('');
}

interface FlightTableProps {
  flights: FlightEntry[];
  type: 'departure' | 'arrival';
}

export default function FlightTable({ flights, type }: FlightTableProps) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = flights.length > INITIAL_DISPLAY_COUNT;
  const displayedFlights = showAll ? flights : flights.slice(0, INITIAL_DISPLAY_COUNT);
  const remainingCount = flights.length - INITIAL_DISPLAY_COUNT;
  const flightIdClass = type === 'departure' ? 'text-sky-600' : 'text-indigo-600';
  const timeLabel = type === 'departure' ? '출발 시간' : '도착 시간';

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>항공사</th>
                <th>편명</th>
                <th>{timeLabel}</th>
                <th>운항 요일</th>
                <th className="hidden sm:table-cell">월</th>
                <th className="hidden sm:table-cell">화</th>
                <th className="hidden sm:table-cell">수</th>
                <th className="hidden sm:table-cell">목</th>
                <th className="hidden sm:table-cell">금</th>
                <th className="hidden sm:table-cell">토</th>
                <th className="hidden sm:table-cell">일</th>
              </tr>
            </thead>
            <tbody>
              {displayedFlights.map((flight, index) => (
                <tr key={index}>
                  <td className="font-medium">{flight.airline}</td>
                  <td className={`${flightIdClass} font-mono`}>{flight.flightId}</td>
                  <td className="font-bold">{flight.scheduleTime}</td>
                  <td className="sm:hidden text-xs">
                    {formatDays(flight.days)}
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.mon} />
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.tue} />
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.wed} />
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.thu} />
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.fri} />
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.sat} />
                  </td>
                  <td className="hidden sm:table-cell text-center">
                    <DayBadge active={flight.days.sun} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
        >
          나머지 {remainingCount}편 더보기
        </button>
      )}
    </>
  );
}
