# flight-mustarddata

인천국제공항 항공편 시간표 조회 서비스

## 기능

- 인천공항 출발편/도착편 시간표 조회
- 공항별, 노선별 항공편 검색
- 항공사, 편명, 출발/도착 시간, 터미널, 탑승구 정보
- SEO 최적화 (JSON-LD, sitemap, robots.txt)
- RSS 피드

## 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **스타일링**: Tailwind CSS 4
- **언어**: TypeScript
- **배포**: GitHub Pages (정적 사이트)
- **데이터**: 인천국제공항공사 공공데이터 API

## 데이터 소스

- [인천국제공항공사 여객편 주간 운항 현황](https://www.data.go.kr/data/15095074/openapi.do)
- D+0 ~ D+6일간 주간 운항 현황 제공
- 출발편/도착편 구분 조회

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev

# 데이터 수집
FLIGHT_API_KEY=your_api_key npm run fetch-data

# 빌드
npm run build
```

## 환경 변수

| 변수 | 설명 |
|------|------|
| `FLIGHT_API_KEY` | 공공데이터포털 API 인증키 |

## 자동화

- **데이터 수집**: GitHub Actions로 매일 자동 실행
- **배포**: main 브랜치 push 시 자동 빌드 및 GitHub Pages 배포

## URL 구조

- `/` - 메인 페이지
- `/출발편/시간표/` - 출발편 목록
- `/출발편/시간표/노선/{출발코드}-{도착코드}/` - 출발 노선 상세
- `/도착편/시간표/` - 도착편 목록
- `/도착편/시간표/노선/{출발코드}-{도착코드}/` - 도착 노선 상세
- `/공항/` - 공항 목록
- `/공항/{공항코드}/` - 공항 상세
