export const TAXONOMY = [
  {
    major: "AM 제조/서비스",
    minors: ["우나스텔라", "LG전자", "기타(단발성)"],
    customPrompt: "신규 고객사명을 입력하세요 (예: 삼성전자):"
  },
  {
    major: "설비 운용 및 관리",
    minors: ["A40PM3SN01(BLT-S400-3)", "A40PM3SN02(BLT-S400-3)", "A40PM4SN01(EOS M400-4)", "A29PM1SN01(EOS M290-1)", "A65PM8SN01(BLT S600-8)", "A65PM8SN02(BLT S600-8)", "A40PM6SN01(LiM X400-6)", "A15PM1SN01(LiM X150-1)"],
    customPrompt: "신규 설비명을 입력하세요:"
  },
  {
    major: "후공정 및 검사",
    minors: ["절삭가공", "열처리", "와이어 방전가공", "품질검사"],
    customPrompt: "신규 공정명을 입력하세요:"
  },
  {
    major: "기술개발 및 실증",
    minors: ["공정최적화", "불량원인분석", "소재물성평가", "공정환경평가"],
    customPrompt: null
  },
  {
    major: "센터 운영 및 기타",
    minors: ["원자재/부자재관리", "근태(휴가)", "기타업무"],
    customPrompt: "신규 항목을 입력하세요:"
  }
];

export const isMajorTag = (tag) => {
  return TAXONOMY.some(c => c.major === tag);
};
