const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
const csvFilePath = path.join(dataDir, 'metal_team_reports.csv');

const headers = [
  { id: 'date', title: 'date' },
  { id: 'name', title: 'name' },
  { id: 'task', title: 'task' },
  { id: 'project', title: 'project' },
  { id: 'printer', title: 'printer' },
  { id: 'keywords', title: 'keywords' }
];

const csvWriter = createObjectCsvWriter({
  path: csvFilePath,
  header: headers,
  append: false // Overwrite existing file
});

const team = ["장동훈 (팀장)", "김진석 (파트장)", "유지민 (파트장)", "강철", "배지훈", "양원재", "박세빈"];

const tasksPool = [
  "알루미늄 분말(AlSi10Mg) 50kg 신규 구매 기안 상신",
  "알루미늄 EOS M290 프린팅 진행: LIG 제작 검토의 건 완료",
  "구리(Cu) 공정변수 1차 열처리 접수 및 공인시험 접수 예정",
  "4/30일 풍산과 기술미팅 예정 (자료 준비 완료)",
  "의료용 임플란트 2차 시제품 서포트 제거 및 후처리 진행중",
  "Concept Laser M2 챔버 내부 클리닝 및 필터 정기 교체",
  "티타늄(Ti6Al4V) 파라미터 최적화 테스트: 밀도 99.8% 달성",
  "신규 프로젝트 킥오프 회의 참석 (항공우주 부품 경량화)",
  "SLM 280 장비 레이저 영점 교정 및 테스트 빌드 진행",
  "품질팀 인계 전 치수 검사 및 3D 스캐닝 완료",
  "장비 구동 중 발생한 로그 에러 분석 및 제조사 문의 완료",
  "다음 주 공정 테스트를 위한 3D CAD 모델링 수정 작업 완료"
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockData(count = 60) {
  const records = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 28);
    const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    const name = getRandom(team);
    
    // Create bulleted list of 3-4 items
    const numItems = Math.floor(Math.random() * 2) + 3; // 3 or 4
    let taskLines = [];
    for (let j = 1; j <= numItems; j++) {
      taskLines.push(`${j}. ${getRandom(tasksPool)}`);
    }
    const task = taskLines.join('\n');

    records.push({
      date: date.toISOString(),
      name,
      task,
      project: '',
      printer: '',
      keywords: ''
    });
  }
  
  records.sort((a, b) => new Date(a.date) - new Date(b.date));
  return records;
}

const records = generateMockData(60);

csvWriter.writeRecords(records)
  .then(() => {
    console.log(`Successfully generated ${records.length} mock reports with bullet points.`);
  })
  .catch(err => {
    console.error('Error generating mock data:', err);
  });
