/**
 * 공항 좌표 기반 비행 소요시간 추정
 * Haversine 대권거리 → 평균 속도 보정 → "약 X시간 Y분" 포맷
 */

interface Coords {
  lat: number;
  lng: number;
}

// 공항 IATA 코드 → 위도/경도
const airportCoords: Record<string, Coords> = {
  // ── 한국 ──
  ICN: { lat: 37.4602, lng: 126.4407 },
  GMP: { lat: 37.5583, lng: 126.7906 },
  PUS: { lat: 35.1796, lng: 128.9382 },
  CJU: { lat: 33.5104, lng: 126.4914 },
  TAE: { lat: 35.8941, lng: 128.6589 },
  CJJ: { lat: 36.7166, lng: 127.4987 },
  KWJ: { lat: 35.1264, lng: 126.8089 },
  RSU: { lat: 34.8424, lng: 127.6169 },
  USN: { lat: 35.5935, lng: 129.3518 },
  KPO: { lat: 35.9878, lng: 129.4206 },
  WJU: { lat: 37.4381, lng: 127.9601 },
  KUV: { lat: 35.9038, lng: 126.6158 },
  SHO: { lat: 38.0614, lng: 128.6689 },
  MWX: { lat: 34.9914, lng: 126.3828 },
  HIN: { lat: 35.0886, lng: 128.0703 },

  // ── 일본 ──
  NRT: { lat: 35.7647, lng: 140.3864 },
  HND: { lat: 35.5494, lng: 139.7798 },
  KIX: { lat: 34.4347, lng: 135.2440 },
  FUK: { lat: 33.5859, lng: 130.4511 },
  CTS: { lat: 42.7752, lng: 141.6925 },
  NGO: { lat: 34.8584, lng: 136.8049 },
  OKA: { lat: 26.1958, lng: 127.6459 },
  KOJ: { lat: 31.8034, lng: 130.7195 },
  KMJ: { lat: 32.8373, lng: 130.8551 },
  NGS: { lat: 32.9169, lng: 129.9136 },
  KMQ: { lat: 36.3946, lng: 136.4068 },
  UKB: { lat: 34.6328, lng: 135.2239 },
  SDJ: { lat: 38.1397, lng: 140.9170 },
  KIJ: { lat: 37.9559, lng: 139.1209 },
  OIT: { lat: 33.4794, lng: 131.7372 },
  OKJ: { lat: 34.7569, lng: 133.8551 },
  TAK: { lat: 34.2142, lng: 134.0156 },
  MYJ: { lat: 33.8272, lng: 132.6996 },
  TKS: { lat: 34.1328, lng: 134.6069 },
  AOJ: { lat: 40.7347, lng: 140.6907 },
  HIJ: { lat: 34.4361, lng: 132.9194 },
  HSG: { lat: 33.1497, lng: 130.3019 },
  FSZ: { lat: 34.7956, lng: 138.1894 },
  KMI: { lat: 31.8772, lng: 131.4486 },
  SHI: { lat: 24.8267, lng: 125.1447 },
  SHM: { lat: 33.6622, lng: 135.3644 },
  UBJ: { lat: 33.9300, lng: 131.2786 },
  ISG: { lat: 24.3446, lng: 124.1870 },
  IBR: { lat: 36.1809, lng: 140.4149 },
  KKJ: { lat: 33.8459, lng: 131.0347 },
  OBO: { lat: 42.7333, lng: 143.2172 },
  HKD: { lat: 41.7700, lng: 140.8222 },
  YGJ: { lat: 35.4922, lng: 133.2361 },

  // ── 중국 ──
  PEK: { lat: 40.0799, lng: 116.6031 },
  PKX: { lat: 39.5098, lng: 116.4105 },
  PVG: { lat: 31.1434, lng: 121.8052 },
  CAN: { lat: 23.3924, lng: 113.2988 },
  SZX: { lat: 22.6394, lng: 113.8108 },
  CTU: { lat: 30.5728, lng: 103.9472 },
  TFU: { lat: 30.3145, lng: 104.4412 },
  CKG: { lat: 29.7192, lng: 106.6417 },
  DLC: { lat: 38.9657, lng: 121.5386 },
  TAO: { lat: 36.2661, lng: 120.3744 },
  SHE: { lat: 41.6398, lng: 123.4834 },
  HRB: { lat: 45.6234, lng: 126.2500 },
  XMN: { lat: 24.5440, lng: 118.1277 },
  NKG: { lat: 31.7420, lng: 118.8620 },
  HGH: { lat: 30.2295, lng: 120.4344 },
  KWL: { lat: 25.2181, lng: 110.0390 },
  CSX: { lat: 28.1892, lng: 113.2200 },
  WUH: { lat: 30.7838, lng: 114.2081 },
  XIY: { lat: 34.4471, lng: 108.7516 },
  KMG: { lat: 24.9924, lng: 102.7432 },
  CGO: { lat: 34.5197, lng: 113.8407 },
  TNA: { lat: 36.8572, lng: 117.2156 },
  CGQ: { lat: 43.9961, lng: 125.6853 },
  TSN: { lat: 39.1244, lng: 117.3462 },
  YNJ: { lat: 42.8828, lng: 129.4512 },
  SJW: { lat: 38.2807, lng: 114.6963 },
  WUX: { lat: 31.4944, lng: 120.4295 },
  FOC: { lat: 25.9348, lng: 119.6633 },
  HFE: { lat: 31.7800, lng: 117.2984 },
  YNT: { lat: 37.4016, lng: 120.9847 },
  WEH: { lat: 36.6465, lng: 122.2289 },
  YTY: { lat: 32.5634, lng: 119.7198 },
  YNZ: { lat: 33.4259, lng: 120.2030 },
  WNZ: { lat: 27.9122, lng: 120.8522 },
  JMU: { lat: 46.8434, lng: 130.4653 },
  DYG: { lat: 29.1028, lng: 110.4433 },
  SYX: { lat: 18.3029, lng: 109.4120 },
  HAK: { lat: 19.9349, lng: 110.4590 },

  // ── 대만 ──
  TPE: { lat: 25.0777, lng: 121.2325 },
  KHH: { lat: 22.5771, lng: 120.3500 },
  RMQ: { lat: 24.2646, lng: 120.6210 },
  HUN: { lat: 24.0230, lng: 121.6162 },

  // ── 홍콩/마카오 ──
  HKG: { lat: 22.3080, lng: 113.9185 },
  MFM: { lat: 22.1496, lng: 113.5920 },

  // ── 몽골 ──
  UBN: { lat: 47.8467, lng: 106.7666 },

  // ── 태국 ──
  BKK: { lat: 13.6900, lng: 100.7501 },
  DMK: { lat: 13.9126, lng: 100.6068 },
  CNX: { lat: 18.7668, lng: 98.9626 },
  HKT: { lat: 8.1132, lng: 98.3169 },

  // ── 싱가포르 ──
  SIN: { lat: 1.3644, lng: 103.9915 },

  // ── 베트남 ──
  SGN: { lat: 10.8188, lng: 106.6520 },
  HAN: { lat: 21.2187, lng: 105.8050 },
  DAD: { lat: 16.0439, lng: 108.1992 },
  CXR: { lat: 11.9981, lng: 109.2194 },
  PQC: { lat: 10.1698, lng: 103.9931 },
  HPH: { lat: 20.8194, lng: 106.7244 },

  // ── 필리핀 ──
  MNL: { lat: 14.5086, lng: 121.0198 },
  CEB: { lat: 10.3075, lng: 123.9793 },
  KLO: { lat: 11.6794, lng: 122.3764 },
  TAG: { lat: 9.6644, lng: 123.8514 },
  CRK: { lat: 15.1860, lng: 120.5600 },

  // ── 말레이시아 ──
  KUL: { lat: 2.7456, lng: 101.7072 },
  BKI: { lat: 5.9372, lng: 116.0511 },

  // ── 인도네시아 ──
  CGK: { lat: -6.1256, lng: 106.6558 },
  DPS: { lat: -8.7482, lng: 115.1672 },
  MDC: { lat: 1.5493, lng: 124.9261 },
  BTH: { lat: 1.1212, lng: 104.1191 },

  // ── 미얀마/라오스/캄보디아/브루나이 ──
  RGN: { lat: 16.9073, lng: 96.1332 },
  VTE: { lat: 17.9883, lng: 102.5633 },
  KTI: { lat: 11.5466, lng: 104.8441 },
  BWN: { lat: 4.9442, lng: 114.9283 },

  // ── 남아시아 ──
  DEL: { lat: 28.5562, lng: 77.1000 },
  KTM: { lat: 27.6966, lng: 85.3591 },
  CMB: { lat: 7.1808, lng: 79.8841 },
  DAC: { lat: 23.8432, lng: 90.3978 },

  // ── 중앙아시아 ──
  TAS: { lat: 41.2579, lng: 69.2813 },
  ALA: { lat: 43.3521, lng: 77.0405 },
  NQZ: { lat: 51.0222, lng: 71.4669 },
  CIT: { lat: 42.3642, lng: 69.4788 },
  BSZ: { lat: 43.0553, lng: 74.4776 },
  ASB: { lat: 37.9868, lng: 58.3610 },

  // ── 중동 ──
  DXB: { lat: 25.2532, lng: 55.3657 },
  AUH: { lat: 24.4330, lng: 54.6511 },
  DOH: { lat: 25.2731, lng: 51.6082 },
  IST: { lat: 41.2753, lng: 28.7519 },

  // ── 유럽 ──
  LHR: { lat: 51.4700, lng: -0.4543 },
  CDG: { lat: 49.0097, lng: 2.5479 },
  FRA: { lat: 50.0333, lng: 8.5706 },
  MUC: { lat: 48.3538, lng: 11.7861 },
  AMS: { lat: 52.3105, lng: 4.7683 },
  FCO: { lat: 41.8003, lng: 12.2389 },
  MXP: { lat: 45.6306, lng: 8.7281 },
  MAD: { lat: 40.4936, lng: -3.5668 },
  BCN: { lat: 41.2971, lng: 2.0785 },
  PRG: { lat: 50.1008, lng: 14.2600 },
  VIE: { lat: 48.1103, lng: 16.5697 },
  HEL: { lat: 60.3172, lng: 24.9633 },
  CPH: { lat: 55.6180, lng: 12.6508 },
  WAW: { lat: 52.1657, lng: 20.9671 },
  WRO: { lat: 51.1027, lng: 16.8858 },
  BUD: { lat: 47.4298, lng: 19.2611 },
  LIS: { lat: 38.7756, lng: -9.1354 },

  // ── 북미 ──
  JFK: { lat: 40.6413, lng: -73.7781 },
  LAX: { lat: 33.9425, lng: -118.4081 },
  SFO: { lat: 37.6213, lng: -122.3790 },
  ORD: { lat: 41.9742, lng: -87.9073 },
  SEA: { lat: 47.4502, lng: -122.3088 },
  ATL: { lat: 33.6407, lng: -84.4277 },
  DFW: { lat: 32.8998, lng: -97.0403 },
  EWR: { lat: 40.6895, lng: -74.1745 },
  IAD: { lat: 38.9531, lng: -77.4565 },
  BOS: { lat: 42.3656, lng: -71.0096 },
  LAS: { lat: 36.0840, lng: -115.1537 },
  DTW: { lat: 42.2124, lng: -83.3534 },
  MSP: { lat: 44.8848, lng: -93.2223 },
  SLC: { lat: 40.7899, lng: -111.9791 },
  ANC: { lat: 61.1743, lng: -149.9962 },
  HNL: { lat: 21.3187, lng: -157.9225 },
  KOA: { lat: 19.7388, lng: -156.0456 },
  GUM: { lat: 13.4834, lng: 144.7959 },
  SPN: { lat: 15.1190, lng: 145.7295 },
  YVR: { lat: 49.1947, lng: -123.1792 },
  YYZ: { lat: 43.6777, lng: -79.6248 },

  // ── 중남미 ──
  MEX: { lat: 19.4363, lng: -99.0721 },

  // ── 오세아니아 ──
  SYD: { lat: -33.9461, lng: 151.1772 },
  MEL: { lat: -37.6690, lng: 144.8410 },
  BNE: { lat: -27.3842, lng: 153.1175 },
  AKL: { lat: -37.0082, lng: 174.7850 },

  // ── 아프리카 ──
  ADD: { lat: 8.9779, lng: 38.7993 },
  CAI: { lat: 30.1219, lng: 31.4056 },
};

/**
 * Haversine 공식으로 두 좌표 사이의 대권거리(km) 계산
 */
function haversineDistance(a: Coords, b: Coords): number {
  const R = 6371; // 지구 반지름 (km)
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;

  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * 거리(km) → 추정 비행시간(분)
 * 구간별 평균 속도와 이착륙 오버헤드를 적용
 */
function distanceToMinutes(distKm: number): number {
  let speedKmh: number;
  let overheadMin: number;

  if (distKm < 800) {
    speedKmh = 700;
    overheadMin = 30;
  } else if (distKm < 1500) {
    speedKmh = 750;
    overheadMin = 35;
  } else if (distKm < 4000) {
    speedKmh = 800;
    overheadMin = 40;
  } else {
    speedKmh = 850;
    overheadMin = 40;
  }

  const cruiseMin = (distKm / speedKmh) * 60;
  const total = cruiseMin + overheadMin;

  // 10분 단위 반올림
  return Math.round(total / 10) * 10;
}

/**
 * 분 → "약 X시간 Y분" 포맷
 */
function formatMinutes(min: number): string {
  if (min < 60) {
    return `약 ${min}분`;
  }
  const hours = Math.floor(min / 60);
  const remainder = min % 60;
  if (remainder === 0) {
    return `약 ${hours}시간`;
  }
  return `약 ${hours}시간 ${remainder}분`;
}

export interface FlightDuration {
  minutes: number;     // 추정 소요시간 (분)
  distanceKm: number;  // 대권거리 (km)
  formatted: string;   // "약 X시간 Y분"
}

/**
 * 두 공항 간 추정 비행 소요시간
 * 좌표가 없는 공항이면 null 반환
 */
export function estimateFlightDuration(
  depCode: string,
  arrCode: string,
): FlightDuration | null {
  const dep = airportCoords[depCode];
  const arr = airportCoords[arrCode];
  if (!dep || !arr) return null;

  const distanceKm = Math.round(haversineDistance(dep, arr));
  const minutes = distanceToMinutes(distanceKm);

  return {
    minutes,
    distanceKm,
    formatted: formatMinutes(minutes),
  };
}
