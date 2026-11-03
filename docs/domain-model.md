# DAM 도메인 모델

## 데이터 흐름

`Tenant → Farm → Plot → Cultivation Cycle → Harvest Batch (LOT) → Processing Lineage → Product → Order`

농장 운영 데이터와 판매 데이터를 LOT로 연결한다. 데이터가 없는 항목은 추정하지 않고 미기록 상태로 둔다.

## 핵심 도메인

| 영역 | 엔티티 | 책임 |
|---|---|---|
| 조직 | Tenant, Profile, Membership | 조직 경계와 사용자 권한 |
| 농장 | Farm, Farm Member, Plot | 농장·구획·운영 주체 |
| 작물 | Crop Catalog, Cultivation Cycle | 작물·품종·재배 주기 |
| 재배 | Cultivation Task, Input Application | 작업 및 투입재 이력 |
| 생산 | Sensor, Production Record | 센서·환경·생산 데이터 |
| 수확 | Harvest Batch, Quality Measurement | 수확 LOT와 품질 측정 |
| 이력 | Trace Event, Batch Lineage | 작업 이벤트 및 가공·분할·혼합 계보 |
| 상품 | Brand, Product, Product Harvest Batch | 브랜드·상품과 원료 LOT 연결 |
| 거래 | Customer, Order, Order Item | 고객·주문·판매 |
| 지식·AI | Knowledge Document, AI Job | 문서 근거와 비동기 AI 작업 |
| 거버넌스 | Audit Log | 주요 변경 추적 |

## 중요한 관계 및 무결성

- Tenant 1:N Farm, Plot, Crop Catalog, Product, Customer
- Farm 1:N Plot; Plot 1:N Cultivation Cycle
- Crop Catalog 1:N Cultivation Cycle
- Cultivation Cycle 1:N Task / Input Application / Harvest Batch
- Harvest Batch 1:N Quality Measurement / Trace Event
- Harvest Batch N:M Harvest Batch through Harvest Batch Lineage
- Product N:M Harvest Batch through Product Harvest Batches
- 새 하위 테이블은 `(tenant_id, id)` 복합 외래키로 서로 다른 tenant의 데이터를 연결하지 못하도록 제한한다.
- 수확량·품질·투입량은 측정값과 단위를 함께 저장한다. 출처·측정방법·측정자·증빙은 가능한 경우 기록한다.

## 마이그레이션 순서

1. `001_initial_schema.sql`: 코어 테이블
2. `002_tenant_rls.sql`: 코어 테이블 tenant 격리 정책
3. `003_agriculture_domain.sql`: 필지·작물·재배·투입재·품질·LOT 계보 및 신규 테이블 RLS

## 운영 전 검증 필수

- staging에서 migration 전체를 순서대로 적용
- 두 개 이상의 tenant 계정으로 SELECT/INSERT/UPDATE/DELETE 격리 테스트
- 같은 tenant 내에서도 역할별 최소권한 테스트
- 실제 농가 업무 용어, 단위, 필수값과 작물별 품질 항목 검증
- 현재 migration은 저장소에 커밋된 설계·구현 초안이며 운영 DB 적용 완료를 의미하지 않는다.
