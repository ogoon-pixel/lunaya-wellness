# 루나야 · 오늘의 건기식 브리프 & 나만의 건기식

소스와 자동 갱신: https://github.com/ogoon-pixel/lunaya-wellness
사이트: https://ogoon-pixel.github.io/lunaya-wellness/
DB: Supabase 프로젝트 `dnpxtlfwnnmoezatebss` (Lunaya Wellness, 서울)

## 구성
- React + Vite 정적 사이트를 GitHub Pages로 배포합니다.
- 브리프·상품·가격·수집 상태는 Supabase PostgreSQL에 저장합니다.
- 공개 방문자는 RLS 정책에 따라 `lw_products`, `lw_briefs`, `lw_source_status`만 읽습니다.
- `lw_crawl_runs`는 서버 작업만 접근합니다. 브라우저에서 DB 쓰기를 허용하지 않습니다.
- 공개 연결 키는 `config.json`에 있습니다. 서버 비밀키는 절대로 코드에 넣지 않습니다.
- 비교 대상: 아이허브, 국내 브랜드몰, 네이버 스마트스토어·쇼핑, 쿠팡, 11번가, G마켓 검색.
- 카테고리: 비타민D, 오메가3, 마그네슘, 유산균, 비타민C, 종합비타민, 간영양제, 탈모·모발, 뇌영양제, 키영양제.

## 실행
Node.js 22 이상에서 `npm ci`, `npm test`, `npm run dev`, `npm run build`를 사용합니다.
`npm run collect`는 환경변수 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`가 필요합니다.

## Supabase
`supabase.sql`을 SQL Editor에서 최초 한 번 실행합니다. 이후 변경은 별도의 추가 마이그레이션으로 관리합니다.
`migrate.mjs`는 이전 공개 사이트에서 상품·브리프를 읽어 새 DB로 옮깁니다. `SUPABASE_SECRET_KEY`는 서버 환경변수로만 전달하세요.

## 자동 갱신
GitHub Actions `refresh.yml`이 한국 시간 오전 8시에 수집합니다. GitHub 스케줄은 지연될 수 있습니다.
Repository Settings → Secrets and variables → Actions에 `SUPABASE_SECRET_KEY`를 등록합니다.
뉴스는 Google 뉴스 RSS로 수집합니다. 네이버 API는 호출하지 않습니다. 선택적으로 `ELEVENST_API_KEY`를 등록하면 11번가 상품 검색을 활성화할 수 있습니다.
네이버 쇼핑 검색 API는 2026-07-31 종료되어 호출하지 않습니다. API HUB 쇼핑 인사이트는 상품·가격 검색 API가 아닙니다.
쿠팡·아이허브 등 자동 접근이 제한된 상품은 가격 미확인으로 표시합니다. 접근 제한을 우회하지 않습니다.
검색 링크는 검색 결과를 여는 기능이며, 그 자체를 수집·가격 검증 완료로 간주하지 않습니다.

## 제품 분류
탈모·모발과 키영양제는 탐색 편의를 위한 분류입니다. 일반 영양 보충제가 탈모 치료나 키 성장 효과를 인정받았다는 의미는 아닙니다. 쇼핑몰 평점은 임상 효과가 아닙니다.

## 운영 계정
이 저장소·DB·워크플로는 `ogoon-pixel` 계정으로 관리합니다. 기존 `ojungin` 계정용 인증정보를 사용하지 않습니다.

## 방문자 검색
매일 오전 8시 수집 작업만 외부 API를 호출합니다. 상품·뉴스는 Supabase에 저장하고, 방문자의 추가 검색·카테고리·가격·제조사 정렬은 DB에서 읽은 데이터만 사용합니다. 검색 결과가 없어도 외부 API를 호출하지 않습니다.

## 브리프 성분 관심도
네이버 API HUB 쇼핑인사이트를 매일 1회 호출합니다. 건강식품(50000023) 분야에서 검토된 비타민D·비타민C·마그네슘을 동일 요청으로 비교합니다. 전일까지 14일 데이터를 lw_briefs.payload.insights에 날짜별 저장합니다. 최근 7일 평균 지수와 이전 7일 평균 지수의 차이가 가장 큰 상승 성분을 선정하며, 모두 상승하지 않으면 최근 7일 평균이 높은 성분을 선정합니다. 14일 데이터가 완전하지 않거나 API가 실패하면 기존 가이드를 순환합니다. Google RSS 뉴스는 유지하며 뉴스가 있는 날에도 보조 성분 가이드에 같은 선정 기준을 적용합니다. 방문자 화면과 HTML 저장 파일에 선정 이유를 표시합니다. 상대 클릭 지수는 실제 클릭 수·판매량·효능이 아닙니다. 기존 NCP_APIGW_API_KEY_ID, NCP_APIGW_API_KEY Actions Secret만 서버에서 사용합니다.

## SEO
빌드 시 공개 Supabase 데이터로 홈·products.html·briefs/YYYY-MM-DD.html(최근 30일)을 정적 렌더링합니다. 본문·고유 메타데이터·canonical·Open Graph·WebSite/WebPage JSON-LD·sitemap.xml을 생성합니다. 매일 수집 성공 시 Pages 워크플로가 다시 실행되어 정적 본문과 사이트맵이 갱신됩니다. 검색엔진 등록용 사이트맵: https://ogoon-pixel.github.io/lunaya-wellness/sitemap.xml . GitHub 프로젝트 사이트는 도메인 루트 robots.txt를 관리할 수 없으므로 페이지별 robots 메타를 사용합니다. Search Console·네이버 서치어드바이저 등록은 소유자 계정의 인증이 별도 필요하며 색인·순위는 보장되지 않습니다.
