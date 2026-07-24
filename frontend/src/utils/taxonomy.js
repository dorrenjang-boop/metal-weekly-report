export const TAXONOMY = [
  {
    major: "AM 제조/서비스",
    minors: ["우나스텔라", "LG전자", "기타(단발성)"],
    customPrompt: "신규 고객사명을 입력하세요 (예: 삼성전자):",
    description: "영업, 수주 및 고객사 대응 관련 업무"
  },
  {
    major: "설비 운용 및 관리",
    minors: ["A40PM3SN01(BLT-S400-3)", "A40PM3SN02(BLT-S400-3)", "A40PM4SN01(EOS M400-4)", "A29PM1SN01(EOS M290-1)", "A65PM8SN01(BLT S600-8)", "A65PM8SN02(BLT S600-8)", "A40PM6SN01(LiM X400-6)", "A15PM1SN01(LiM X150-1)"],
    customPrompt: null,
    description: "3D 프린터 등 장비 유지보수 및 점검 업무"
  },
  {
    major: "후공정 및 관리",
    minors: ["절삭가공", "열처리", "와이어 방전가공"],
    customPrompt: null,
    description: "출력 후 가공, 열처리 등 후공정 작업 업무"
  },
  {
    major: "기술개발 및 실증",
    minors: ["공정개발", "불량원인분석", "소재물성평가", "공정환경평가", "품질검사"],
    customPrompt: null,
    description: "공정개발, 품질검사, R&D 및 소재 실증 업무"
  },
  {
    major: "센터 운영 및 기타",
    minors: ["원/부자재관리", "근태(휴가)", "기타업무"],
    customPrompt: null,
    description: "원/부자재 관리, 부서 행정, 휴가 등 공통 업무"
  }
];

export const isMajorTag = (tag) => {
  return TAXONOMY.some(c => c.major === tag);
};
