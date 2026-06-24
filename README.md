# 금속기술팀 주간 업무 보고 시스템 (Metal Team Weekly Report System)

## [TrueNAS 운영 가이드]
> **이 프로젝트는 Z: 드라이브(TrueNAS)에서 직접 구동됩니다.**
> 
> 소스 코드를 수정한 후에는 반드시 루트 폴더에 있는 `update_nas.bat`을 더블클릭하여 변경사항을 홈페이지에 즉각 반영하세요.

---

### 시스템 아키텍처 (2.0)
- **Frontend**: React, Vite
- **Backend**: Node.js, Express, PM2, Multer
- **Database**: SQLite (`reports.db`)

### 로컬 개발 시
- `npm run dev` (Frontend)
- `npx nodemon server.js` (Backend)

### 배포 환경 (NAS)
- 서버 실행: `build_and_run_nas.bat`
- 원클릭 업데이트: `update_nas.bat`
