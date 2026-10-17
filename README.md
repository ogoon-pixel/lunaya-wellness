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
