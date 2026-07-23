# 금속기술팀 주간/월간/연간 대시보드 및 OEE 시스템 구축 계획

요청하신 `A65PM_E_8_IN718_1782440060.xlsx` 파일과 `Yearly Overview.pdf` 파일을 성공적으로 분석하였습니다. 이를 바탕으로 대시보드 구축을 위한 인사이트와 데이터베이스 스키마 초안을 제안합니다.

## 1. 파일 분석 및 인사이트

### 1.1. Excel 빌드 이력 데이터 (A65PM_E_8_IN718_1782440060.xlsx)
- **분석 결과**: 기존 monday.com에서 관리되던 빌드 이력으로, 각 빌드의 일정, 담당자, 공정 상태, 완료 여부(성공/실패/중단), 장비 가동 시간(Run Time), 고객사/프로젝트명, 제품 카테고리, 발생한 이슈 등의 정보가 포함되어 있습니다.
- **활용 방안**: 이 원시 데이터들을 클라우드 데이터베이스화하여, 프론트엔드 대시보드의 각종 차트를 그리기 위한 기초 데이터로 사용합니다.

### 1.2. PDF 대시보드 레이아웃 (Yearly Overview.pdf)
- **분석 결과**: 엑셀 데이터를 바탕으로 다양한 지표를 시각화한 대시보드입니다.
- **주요 시각화 항목**:
  1. **고객사별 빌드 현황 (Pie Chart)**: `Client / Project` 기반
  2. **제작 어플리케이션 현황 (Pie Chart)**: `Product Category` (콜드플레이트, 연소기 등) 기반
  3. **빌드 목적 분포 (Pie Chart)**: `Job Type` (본제품, 공정개발, 시제품 등) 기반
  4. **공정 성공률 (Pie Chart)**: `Completion State` (Success, Failed, Aborted) 기반
  5. **공정 리스크 분석 (Pie Chart)**: `Issue/Error` (리코터 충돌, 가스 입력 등) 기반
  6. **장비 가동률 (Bar Chart)**: 장비별 `Run Time(hr)` 총합
  7. **재료 소모량 (Bar Chart)**: 장비별 파우더 소모량 (Volume 데이터 등을 바탕으로 산출 필요)
  8. **월별 장비 가동 시간 (Bar Chart)**: 장비별/월별 가동 시간 추이

---

## 2. 데이터베이스 스키마 초안 (클라우드 DB 구조)

Cloud Run의 Ephemeral(일회성) 환경을 고려하여 로컬 SQLite 대신 Firestore(또는 Cloud SQL) 환경에 적합한 논리적 스키마를 설계했습니다.

### 2.1. `machines` (장비 정보)
| 필드명 | 타입 | 설명 |
|---|---|---|
| `id` | String | 장비 고유 ID (예: `BLT-S600-1`) |
| `name` | String | 장비명 (예: `BLT S600-8 #1`) |
| `material` | String | 사용 소재 (예: `IN718`, `AlSi10Mg`) |

### 2.2. `build_logs` (빌드 이력)
| 필드명 | 타입 | 설명 |
|---|---|---|
| `id` | String | 빌드 고유 ID |
| `machine_id` | String | 연관 장비 ID |
| `build_name` | String | 빌드명 (예: A65PM01-B0001-261216) |
| `engineer` | String | 담당 엔지니어 |
| `start_date` | Date | 시작 일정 |
| `end_date` | Date | 종료 일정 |
| `completion_state` | String | 완료 상태 (`Success`, `Failed`, `Aborted`) |
| `job_type` | String | 빌드 목적 (`공정개발`, `시제품`, `본제품` 등) |
| `issue_error` | String | 에러 사유 (`리코터 충돌`, `가스 부족` 등) |
| `run_time_hr` | Number | 가동 시간 (시간 단위) |
| `volume_mm3` | Number | 빌드 볼륨 |
| `powder_usage_kg`| Number | 파우더 소모량 (입력 혹은 볼륨/비중 기반 계산) |
| `client_project` | String | 고객사 및 프로젝트 명 |
| `product_category` | String | 제품 카테고리 (`공정검사시편`, `연소기` 등) |
| `description` | String | 상세 설명 및 비고 |

### 2.3. `oee_records` (OEE 설비종합효율 입력 데이터 - **신규**)
장비별 OEE(가동률, 성능가동률, 양품률) 산출을 위해 주기적(예: 주간/일간)으로 입력받는 데이터입니다.

| 필드명 | 타입 | 설명 |
|---|---|---|
| `id` | String | OEE 레코드 고유 ID |
| `machine_id` | String | 대상 장비 ID |
| `record_date` | Date | 기록 기준일 (또는 주차) |
| `planned_time_hr` | Number | 계획된 생산 시간 (시간) |
| `down_time_hr` | Number | 장비 정지/비가동 시간 (시간) |
| `ideal_cycle_time` | Number | 양품 1개 생산에 필요한 이상적 시간 (또는 목표 생산 속도) |
| `total_parts_qty` | Number | 총 생산 수량 |
| `good_parts_qty` | Number | 양품 수량 |

> **OEE 계산 공식 (대시보드 시각화 시 적용):**
> - **가동률 (Availability)** = (계획 생산 시간 - 비가동 시간) / 계획 생산 시간
> - **성능가동률 (Performance)** = (이상적 사이클 타임 × 총 생산 수량) / 실제 가동 시간
> - **양품률 (Quality)** = 양품 수량 / 총 생산 수량
> - **OEE (%)** = 가동률 × 성능가동률 × 양품률

---

## 3. 프론트엔드 및 백엔드 개발 방안

- **백엔드**: `backend/server_cloud.js`를 메인 엔트리로 사용하고 8080 포트 사용. (로컬 파일 저장 금지, Cloud DB 연동 구조로 Firestore SDK 활용)
- **프론트엔드**: React + Vite + `react-router-dom` 활용. Glassmorphism, 세련된 색상 조합, 부드러운 애니메이션을 적용하여 "Premium Design" 원칙 달성.

### 3.1. 화면 라우팅 (Pages)
- `/` (Dashboard): 주간/월간/연간 종합 통계 및 PDF 형태의 차트 시각화 (Recharts 또는 Chart.js 활용)
- `/builds`: 빌드 이력 조회 및 신규 등록 테이블
- `/oee`: 장비별 OEE 데이터 입력 폼 및 개별 OEE 트렌드 차트

## User Review Required

1. **데이터베이스 스키마 승인**: 제안해 드린 `build_logs` 및 `oee_records` 스키마가 업무 요건을 충분히 반영하고 있는지 확인 부탁드립니다. (추가로 필요한 필드가 있다면 말씀해 주세요.)
2. **실제 DB 기술 스택**: `Cloud Run` 환경에서 데이터베이스는 임베디드 NoSQL 형태의 가상 모킹으로 먼저 개발할지, 아니면 `Firestore` 연동 구조로 바로 작성할지 선호하시는 방향이 있으신가요? (초기 개발 편의를 위해 Firestore SDK 구조를 잡고 로컬 메모리/파일 대체 모킹을 하거나 실제 연결을 구성할 수 있습니다.)
