// 공항 정보
export interface Airport {
  airportCode: string; // IATA 3자리 코드 (ICN, GMP, PUS 등)
  airportName: string; // 공항 한글명
}

// 요일별 취항 여부
export interface DaysOfWeek {
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
}

// 정기운항편 항공편 정보
export interface FlightEntry {
  airline: string;      // 항공사명
  flightId: string;     // 편명 (KE094 등)
  scheduleTime: string; // 정기운항 시간 (HH:mm)
  days: DaysOfWeek;     // 요일별 취항 여부
  firstDate: string;    // 운항 시작일 (YYYY-MM-DD)
  lastDate: string;     // 운항 종료일 (YYYY-MM-DD)
  season: string;       // 시즌코드 (W25, S26 등)
}

// 노선 데이터 (출발편/도착편 공통)
export interface RouteData {
  depAirportCode: string;
  depAirportName: string;
  arrAirportCode: string;
  arrAirportName: string;
  flights: FlightEntry[];
}

// 메타데이터
export interface Metadata {
  lastUpdated: string;
  season: string;       // 현재 시즌 (W25, S26 등)
  airportCount: number;
  departureRouteCount: number;
  arrivalRouteCount: number;
}
