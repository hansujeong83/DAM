# DAM 도메인 모델 초안

이 문서는 현재까지 논의한 DAM의 업무 개념을 구현 가능한 단위로 정리한 초안이다. 운영 데이터와 현장 업무 인터뷰를 통해 용어·관계·필수값을 확정해야 한다.

## 핵심 도메인

| 도메인 | 주요 개념 | 책임 |
|---|---|---|
| Tenant & Identity | Tenant, Profile, Membership | 조직·사용자·접근 경계 |
| Farm | Farm, Farm Member | 농장과 운영 주체 |
| Production | Sensor, Production Record | 센서·재배·생산 데이터 |
| Harvest | Harvest Batch | 수확 단위 및 LOT |
| Traceability | Trace Event | 생산·가공·이동 이력 |
| Catalog | Product, Brand | 상품과 브랜드 정보 |
| Commerce | Customer, Order, Order Item | 주문·고객·거래 |
| Knowledge | Knowledge Document | 문서·지식 원천 |
| AI | AI Job | 비동기 AI 실행과 결과 추적 |
| Governance | Audit Log | 주요 변경 이력 |

## 관계 요약

- Tenant 1:N Farm / Profile / Brand / Product / Customer / Order
- Farm 1:N Sensor / Harvest Batch
- Harvest Batch 1:N Trace Event
- Product N:M Harvest Batch (실제 판매 단위와 수확 배치 연결은 추후 Product Batch/LOT 연결 테이블로 확장)
- Customer 1:N Order
- Order 1:N Order Item
- Tenant 1:N Knowledge Document / AI Job / Audit Log

## 설계 결정 및 미확정 사항

1. 현재 스키마는 초기 코어 모델이며 전체 목표 50~70개 테이블의 완성본이 아니다.
2. 가공·소분·혼합 시 배치 계보(lineage)를 표현하는 parent/child batch 모델을 추가 설계해야 한다.
3. 상품과 수확 배치의 다대다 연결을 위한 product_harvest_batches 또는 별도 lot 테이블이 필요하다.
4. 농장·필지·작물·재배작업·투입재·수확량·품질 측정의 세부 모델을 확장해야 한다.
5. tenant별 사용자 권한은 역할(Role)과 정책(Policy)을 구분해 설계해야 한다.
6. Supabase Auth의 auth.users와 profiles 연결, RLS 정책, 서비스 역할 권한은 실제 프로젝트에서 검증해야 한다.
7. 벡터 임베딩은 사용 중인 PostgreSQL pgvector 버전과 차원에 맞춰 별도 migration으로 추가한다.
8. ESG·탄소·DPP 산출은 데이터 출처와 계산 방법론이 확정된 이후 별도 도메인으로 추가한다.

## 명명 규칙

- 테이블·컬럼: snake_case, 소문자
- 기본키: uuid, 컬럼명 id
- 외래키: 참조 테이블 단수형_id
- 시간: timestamptz, UTC 저장
- 상태: 검증 가능한 제한값 또는 참조 테이블 사용
- 금액: 통화 코드와 함께 numeric 사용
- 원천 데이터: 출처·수집 시각·수정 주체를 추적
