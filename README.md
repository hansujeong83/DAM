# DAM — DATA × AGRI × MARKET

DAM은 농업 데이터를 자산화하고, 농가의 생산 이력을 브랜드·유통·고객 경험으로 연결하는 AI 기반 농식품 비즈니스 운영 시스템입니다.

> **제품 방향:** 농가와 농산물의 데이터를 수집·표준화하고, 수확 단위의 추적성을 바탕으로 상품·브랜드·주문·고객 데이터를 하나의 흐름으로 연결한다.

## 현재 저장소 상태

이 저장소는 기존의 빈 저장소를 DAM 프로젝트의 기준 저장소로 전환하는 초기 구축본입니다. 현재 포함된 것은 프로젝트 설명, 도메인 초안, 초기 데이터베이스 스키마, API 계약 초안, Next.js 시작 화면, CI 빌드 워크플로입니다.

**아직 구현·검증되지 않은 항목:** 운영 환경 배포, 실제 Supabase 프로젝트 연결, 인증·RLS 정책, 결제·주문 연동, IoT 수집, AI/RAG 검색, KG 추론, DPP/ESG 산출. 이 항목들은 문서의 단계별 계획에 따라 검증해야 합니다.

## 핵심 원칙

1. Domain First — 업무 도메인과 용어부터 확정
2. Single Source of Truth — 데이터의 기준 원천을 하나로 유지
3. Contract First — API 계약을 먼저 정의
4. Schema Driven Development — DB/API/UI가 동일한 모델을 공유
5. AI-Native Architecture — AI 기능을 독립 모듈로 설계
6. Modular by Design — 도메인별 독립성과 확장성 확보

## 핵심 업무 흐름

Farm → Production Data → Harvest Batch → Traceability → Product → Brand → Commerce / Order → Customer

Harvest Batch(수확 배치)를 생산·품질·가공·유통 이력의 연결 기준으로 사용합니다.

## 기술 방향

- Web: Next.js App Router, React, TypeScript, Tailwind CSS
- Data: PostgreSQL, Supabase, Prisma(도입 예정)
- API: OpenAPI 3.1
- AI: LLM Gateway, RAG, Knowledge Graph
- Traceability: LOT/QR 기반 이력 연결
- Integrations: Cafe24, ERP, 물류, IoT (검증 후 단계적 연결)

## 빠른 시작

```bash
npm install
npm run dev
```

환경변수 예시는 `.env.example`을 참고하세요. 실제 키와 비밀번호는 GitHub에 올리지 마세요.

## 문서

- [아키텍처](docs/architecture.md)
- [도메인 모델](docs/domain-model.md)
- [개발 로드맵](docs/roadmap.md)
- [초기 PostgreSQL 스키마](database/001_initial_schema.sql)
- [OpenAPI 계약 초안](openapi/openapi.yaml)

## 개발 상태

초기 기반 구축 단계. 스키마와 API는 설계 초안이며, 실제 운영 전 도메인 검토·마이그레이션 테스트·권한 검증·보안 검토가 필요합니다.
