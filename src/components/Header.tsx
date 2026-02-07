import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-sky-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg md:text-xl font-bold hover:opacity-90 shrink-0">
            항공편 시간표
          </Link>
          <nav className="flex gap-3 md:gap-6 text-sm md:text-base">
            <Link href="/departures" className="hover:underline">
              출발편
            </Link>
            <Link href="/arrivals" className="hover:underline">
              도착편
            </Link>
            <Link href="/airports" className="hover:underline">
              공항
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
