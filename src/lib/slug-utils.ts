/**
 * 공항/노선 슬러그 변환 유틸리티 (클라이언트/서버 공용)
 * fs 모듈을 사용하지 않으므로 클라이언트 컴포넌트에서도 안전하게 import 가능
 */

// 노선 슬러그 생성 (출발-도착)
export function createRouteSlug(depCode: string, arrCode: string): string {
  return `${depCode}-${arrCode}`;
}

// 노선 슬러그 파싱
export function parseRouteSlug(slug: string): { depCode: string; arrCode: string } | null {
  const parts = slug.split('-');
  if (parts.length !== 2) return null;
  return {
    depCode: parts[0],
    arrCode: parts[1],
  };
}
