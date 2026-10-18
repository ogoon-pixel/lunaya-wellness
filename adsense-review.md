# 애드센스 재검토 점검 — 2026-10-18

## 실제 거절 사유
Google AdSense의 ogoonshop.com 상세 화면: **게시자 콘텐츠가 없는 화면에 Google 게재 광고**. ads.txt 상태는 찾을 수 없음.

## 확인한 문제와 조치
|항목|관찰|조치|
|---|---|---|
|도메인|HTTP 프레임 안에 GitHub 주소를 표시; HTTPS 접속 실패|예스닉 포워딩 해제, GitHub Pages Custom domain 등록, 루트 A 4개와 www CNAME 등록|
|직접 콘텐츠|신청 도메인의 외곽 문서에는 자체 본문 없음|도메인 루트에서 사전 렌더링한 HTML 제공하도록 빌드 변경|
|자체 정보|뉴스 제목·구매 목록 비중 큼|라벨, 실제 결제 가격, 후기 해석에 관한 자체 실전 가이드 3편과 홈 탐색 추가|
|투명성|소개·편집 원칙·전체 개인정보 안내 없음|소개, 편집·광고 원칙, 문의, 개인정보·쿠키 안내 추가|
|광고|공통 head에 Google 광고 실행 코드|전체 Google 광고 실행 제거; 소유권 확인 메타 태그 유지. 쿠팡 광고는 제휴 관계 공개|
|ads.txt|신청 도메인에서 찾을 수 없음|루트 ads.txt 생성: google.com, pub-1486084747549283, DIRECT, f08c47fec0942fa0|
|검색·탐색|GitHub 주소와 경로 고정|canonical·사이트맵·내부 링크·자산을 https://ogoonshop.com/ 기준으로 변경, robots.txt 추가|
|기존 기능|메일 서버 CORS가 GitHub 주소만 허용|ogoonshop.com 및 www HTTPS origin 추가, 입력 검증·제한 유지|

## 검증
타입 검사, 기존 기능 및 메일 시간제한 회귀 검증 통과. 프로덕션 빌드 성공. 정적 HTML 16개·내부 절대 링크 102개 유효성 검사 통과. Google 광고 실행 스크립트 미포함 검사 통과. 새 origin의 메일 잘못된 요청은 400으로 안전하게 거절되고 CORS 응답은 해당 origin을 반환함. 실제 메일 발송 성공을 의미하지 않음.

## 재심사 전 필수 확인
- 예스닉 권한 네임서버 사이의 전파가 끝나야 함. 변경 직후 ns2는 새 IP, ns3는 이전 포워딩 IP를 반환했음.
- GitHub Pages가 DNS를 확인한 후 TLS 인증서를 발급해야 함. HTTPS 강제 적용을 확인할 것.
- https://ogoonshop.com/ 및 /products.html, /guides.html, /privacy.html, /ads.txt, /robots.txt, /sitemap.xml이 정상 응답해야 함.
- 개인정보·외부 광고 지역별 동의 요구를 확인하지 않은 상태에서 Google 광고 실행을 다시 활성화하지 않을 것.
- DNS/TLS가 확인되기 전에는 '문제를 수정했음을 확인합니다' 체크와 검토 요청을 제출하지 말 것.
- Google의 콘텐츠 품질 평가는 별도 심사이며, 이번 조치가 승인을 보장하지 않음. 뉴스 RSS는 제목·원문 링크 목록으로 명확히 구분하고 새로운 자체 분석으로 위장하지 않음.

## 공식 참고
- https://support.google.com/publisherpolicies/answer/11112688?hl=ko
- https://support.google.com/adsense/answer/81904?hl=ko
- https://support.google.com/adsense/answer/1348695?hl=ko
- https://support.google.com/adsense/answer/7679060?hl=ko
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
