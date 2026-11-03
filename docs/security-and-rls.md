# DAM 보안 및 데이터 접근 정책

## 기본 원칙

- 모든 업무 데이터는 tenant 단위로 격리한다.
- 브라우저가 전달한 tenant_id만으로 접근 권한을 인정하지 않는다.
- 사용자 식별자는 Supabase Auth의 auth.uid()와 profiles.id를 동일한 UUID로 연결하는 것을 전제로 한다.
- 일반 사용자의 데이터 접근은 Row Level Security(RLS)가 최종 통제한다.
- service_role 키는 서버 전용이며 브라우저 번들·공개 저장소·로그에 노출하지 않는다.

## 마이그레이션 순서

1. database/001_initial_schema.sql
2. Supabase Auth 설정 및 profiles.id와 auth.users.id의 사용자 생성 흐름 구성
3. database/002_tenant_rls.sql
4. 별도 테스트 계정 2개와 테넌트 2개로 격리 테스트
5. 검증 완료 후 운영 반영

## 역할별 권한 초안

| 역할 | 권한 범위 |
|---|---|
| owner | 조직 데이터 조회 및 조직·구성원 관리 |
| admin | 조직 데이터 조회 및 구성원 관리 |
| manager | 농장 구성원 관리 및 운영 데이터 관리 |
| staff | 소속 조직의 업무 데이터 관리 |
| viewer | 소속 조직 데이터 조회 |

실제 권한은 테이블별 정책과 업무 API에서 함께 검증해야 한다. 이 문서의 역할표는 제품 정책 초안이며 모든 역할이 현재 동일한 권한을 갖는다는 뜻이 아니다.

## RLS 마이그레이션이 제공하는 범위

- tenant_memberships를 기준으로 조직 구성원 여부를 확인하는 보안 함수
- tenant_id가 직접 있는 테이블의 조직 구성원 접근 정책
- farm_members, order_items의 부모 레코드 기반 접근 정책
- audit_logs의 owner/admin 조회 정책
- 익명 사용자 접근 및 클라이언트 감사로그 쓰기 차단

## 아직 필요한 검증

- Supabase staging 프로젝트에서 SQL 실행 성공 여부
- 서로 다른 tenant 간 SELECT/INSERT/UPDATE/DELETE 격리 테스트
- owner/admin/staff/viewer 역할별 최소 권한 테스트
- 조직 최초 생성과 첫 owner 등록을 위한 신뢰 가능한 서버 프로비저닝 절차
- profiles 레코드 생성·수정 흐름과 Auth 사용자 생명주기 연동
- service_role을 사용하는 서버 작업의 감사 및 비밀정보 관리

**주의:** 이 마이그레이션은 저장소에 커밋된 보안 정책 초안이다. 실제 Supabase 프로젝트에 적용되거나 침투·권한 테스트를 통과한 상태가 아니다.
