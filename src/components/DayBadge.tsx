/** 요일별 운항 여부를 표시하는 뱃지 */
export default function DayBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block w-5 h-5 rounded-full text-xs leading-5 text-center ${
        active
          ? 'bg-sky-500 text-white'
          : 'bg-gray-100 text-gray-300'
      }`}
      aria-label={active ? '운항' : '미운항'}
    >
      {active ? 'O' : '-'}
    </span>
  );
}
