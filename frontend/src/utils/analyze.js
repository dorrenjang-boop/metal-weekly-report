// Keyword List
export const KEYWORDS_DICTIONARY = [
  // 소재
  "알루미늄", "티타늄", "구리", "분말", "AlSi10Mg", "Ti6Al4V",
  // 공정
  "열처리", "파라미터", "서포트", "밀도", "조형", "빌드", "공정변수", "스캐닝",
  // 장비
  "Concept Laser", "EOS", "SLM", "레이저", "영점", "에러", "클리닝",
  // 프로젝트/기타
  "임플란트", "항공우주", "품질", "불량", "미팅", "LIG", "풍산", "기안", "우나스텔라", "Limlaser"
];

// Topic Definition
export const TOPICS = {
  "소재 기술": ["알루미늄", "티타늄", "구리", "분말", "AlSi10Mg", "Ti6Al4V"],
  "공정 최적화": ["열처리", "파라미터", "서포트", "밀도", "조형", "빌드", "공정변수", "스캐닝"],
  "장비 및 인프라": ["Concept Laser", "EOS", "SLM", "레이저", "영점", "에러", "클리닝"],
  "프로젝트/기타": ["임플란트", "항공우주", "품질", "불량", "미팅", "LIG", "풍산", "기안", "우나스텔라", "Limlaser"]
};

// Project Keywords for the Printable Report View
export const PROJECT_KEYWORDS = [
  "LIG", "풍산", "임플란트", "항공우주", "우나스텔라", "Limlaser"
];

// 프로젝트명 표준화 함수
export const standardizeProjectName = (tag) => {
  if (!tag) return '공통/기타';
  
  // 신규 대분류-중분류 체계 태그는 있는 그대로 반환
  if (tag.includes(' - ')) return tag.trim();

  const t = tag.toUpperCase();
  if (t.includes('EOS') || t.includes('M290')) return 'EOS M290';
  if (t.includes('A40') || t.includes('A40PM')) return 'A40PM';
  if (t.includes('A65') || t.includes('A65PM')) return 'A65PM';
  return tag.trim();
};

// "해당 없음" 필터링 함수
export const isNoOpLine = (text) => {
  if (!text) return true;
  const clean = text.replace(/[\s\-\*\.]/g, '');
  return clean === '해당없음' || clean === '없음' || clean === '해당사항없음' || clean === 'N/A' || clean === 'NA' || clean === '';
};

// Extract Keywords from text
export function extractKeywords(textOrObject) {
  if (!textOrObject) return [];
  
  let combinedText = "";
  if (typeof textOrObject === 'string') {
    combinedText = textOrObject;
  } else if (typeof textOrObject === 'object') {
    combinedText = `${textOrObject.thisWeekTask || ''} ${textOrObject.nextWeekTask || ''} ${textOrObject.task || ''}`;
  }

  const found = [];
  const lowerText = combinedText.toLowerCase();
  
  KEYWORDS_DICTIONARY.forEach(kw => {
    if (lowerText.includes(kw.toLowerCase())) {
      found.push(kw);
    }
  });
  
  return found;
}

// Map Keywords to Topics
export function getTopicsFromKeywords(keywords) {
  const foundTopics = new Set();
  
  keywords.forEach(kw => {
    Object.keys(TOPICS).forEach(topic => {
      if (TOPICS[topic].includes(kw)) {
        foundTopics.add(topic);
      }
    });
  });
  
  return Array.from(foundTopics);
}

// Calculate week string (e.g. "2026년 4월 4주차")
export function getWeekString(dateString) {
  if (!dateString) return "날짜 미상";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "날짜 미상";

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  const firstDayOfMonth = new Date(year, date.getMonth(), 1);
  const firstDayWeekday = firstDayOfMonth.getDay() === 0 ? 7 : firstDayOfMonth.getDay(); 
  const offsetDate = date.getDate() + firstDayWeekday - 1;
  const weekNumber = Math.ceil(offsetDate / 7);
  
  return `${year}년 ${month}월 ${weekNumber}주차`;
}

// Generate structured data for the Printable Report View
export function generatePrintableReport(reports) {
  const result = {
    thisWeek: {},
    nextWeek: {}
  };

  reports.forEach(r => {
    // This Week
    if (r.thisWeekTask || r.task) {
      let currentProject = "기타 업무";
      const text = r.thisWeekTask || r.task;
      const lines = text.split('\n');
      
      lines.forEach(line => {
        if (!line || isNoOpLine(line)) return;
        const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
        if (cleanLine.length === 0) return;

        const match = cleanLine.match(/^\[(.*?)\]/);
        if (match) {
          // Normalize double brackets like [[5축가공기]
          const rawTag = match[1].replace(/^\[+/, '').trim();
          currentProject = standardizeProjectName(rawTag);
          const remainingText = cleanLine.replace(/^\[.*?\]\s*/, '').trim();
          if (remainingText.length > 0 && !isNoOpLine(remainingText)) {
            if (!result.thisWeek[currentProject]) result.thisWeek[currentProject] = [];
            const displayLine = remainingText.replace(/^[-•*]?\s*/, '');
            result.thisWeek[currentProject].push(`${displayLine} (${r.name.split(' ')[0]})`);
          }
        } else {
          if (!result.thisWeek[currentProject]) result.thisWeek[currentProject] = [];
          const displayLine = cleanLine.replace(/^[-•*]?\s*/, '');
          result.thisWeek[currentProject].push(`${displayLine} (${r.name.split(' ')[0]})`);
        }
      });
    }
    
    // Next Week
    if (r.nextWeekTask) {
      let currentProject = "기타 업무";
      const lines = r.nextWeekTask.split('\n');
      
      lines.forEach(line => {
        if (!line || isNoOpLine(line)) return;
        const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
        if (cleanLine.length === 0) return;

        const match = cleanLine.match(/^\[(.*?)\]/);
        if (match) {
          const rawTag = match[1].replace(/^\[+/, '').trim();
          currentProject = standardizeProjectName(rawTag);
          const remainingText = cleanLine.replace(/^\[.*?\]\s*/, '').trim();
          if (remainingText.length > 0 && !isNoOpLine(remainingText)) {
            if (!result.nextWeek[currentProject]) result.nextWeek[currentProject] = [];
            const displayLine = remainingText.replace(/^[-•*]?\s*/, '');
            result.nextWeek[currentProject].push(`${displayLine} (${r.name.split(' ')[0]})`);
          }
        } else {
          if (!result.nextWeek[currentProject]) result.nextWeek[currentProject] = [];
          const displayLine = cleanLine.replace(/^[-•*]?\s*/, '');
          result.nextWeek[currentProject].push(`${displayLine} (${r.name.split(' ')[0]})`);
        }
      });
    }
  });

  return result;
}
