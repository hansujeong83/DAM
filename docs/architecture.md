# DAM 시스템 아키텍처

## 1. 제품 정의

DAM(DATA × AGRI × MARKET)은 농업 현장의 데이터를 수집·정리하고, 농산물 생산 이력과 상품·브랜드·거래 데이터를 연결해 농가와 농식품 사업자의 운영 의사결정을 돕는 시스템이다.

## 2. 아키텍처 원칙

- **Domain First:** Farm, Harvest, Product, Brand, Commerce, Customer, AI 등 업무 경계를 먼저 정의한다.
- **Single Source of Truth:** 같은 사실을 여러 테이블이나 서비스에서 중복 관리하지 않는다.
- **Contract First:** OpenAPI 계약을 API 구현보다 먼저 확정한다.
- **Schema Driven:** PostgreSQL 스키마를 기준으로 Prisma 타입과 API DTO를 동기화한다.
- **AI-Native:** AI 기능은 업무 데이터의 권한·출처·버전 정보를 유지하는 별도 서비스 경계로 둔다.
- **Modular:** 모듈 간 직접 결합을 줄이고 명시적 API와 이벤트로 연결한다.

## 3. 논리 계층

1. Experience: Admin UI, Farm/User UI, Commerce UI
2. Application: 농장 관리, 생산·수확, 상품·브랜드, 주문·고객, 리포트
3. Domain: Farm, Production, Harvest, Traceability, Product, Brand, Commerce, Customer
4. Data: PostgreSQL/Supabase, 파일 저장소, 벡터 인덱스(추후)
5. Intelligence: LLM Gateway, RAG, Knowledge Graph, 분석·추천
6. Integration: Cafe24, ERP, 물류, IoT, QR/DPP 연동

## 4. 핵심 데이터 흐름

Farm → Production Record → Harvest Batch → Processing/Trace Event → Product → Brand → Order → Customer.

Harvest Batch는 수확 시점의 농장·작물·수확량·품질·LOT를 묶는 추적 단위다. 가공이나 분할·병합이 발생하면 원본 배치와 파생 배치의 관계를 별도 이벤트로 남긴다.

## 5. AI 구조

- LLM Gateway: 모델 제공자(OpenAI 등)를 업무 로직에서 분리한다.
- RAG: 문서·기록의 출처, 권한, 최신 버전을 검색 결과와 함께 보존한다.
- Knowledge Graph: 엔터티와 관계를 구조화한다. 관계의 근거와 생성 주체를 기록한다.
- AI Job: 요청, 실행 상태, 입력 참조, 출력 참조, 모델·프롬프트 버전을 추적한다.
- AI 출력은 검토 전까지 원천 업무 데이터를 자동 변경하지 않는다.

## 6. 보안 및 운영 원칙

- 테넌트 경계는 데이터베이스 정책과 서버 권한 검사 양쪽에서 강제한다.
- 서비스 역할 키는 서버 전용 환경변수로 관리한다.
- 브라우저에 비밀키를 노출하지 않는다.
- 모든 외부 연동은 재시도·중복 처리·오류 로그 정책을 둔다.
- 개인정보와 농가 영업정보는 최소 수집·최소 권한 원칙을 적용한다.
- RLS 정책과 권한 테스트가 완료되기 전에는 실제 고객 데이터를 적재하지 않는다.

## 7. 배포 흐름 목표

개발 브랜치 → Pull Request → CI(정적 검사·빌드) → main 병합 → 호스팅 서비스 자동 배포. 현재 CI 워크플로는 빌드 검증용이며, 실제 자동 배포는 Vercel 등 호스팅 프로젝트 연결과 환경변수 설정 후 활성화한다.
