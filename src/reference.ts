import type { GlobalSettings } from "./types";

export const OPTIONS = {
  counselingType: ["일반상담", "전문상담", "순회상담"],
  weeClass: ["일반", "Wee클래스"],
  category: ["상담", "검사", "자문", "교육", "연구", "의뢰"],
  grade: ["해당없음", "1학년", "2학년", "3학년", "4학년", "5학년", "6학년", "혼합"],
  gender: ["", "남", "여", "혼성"],
  counselorAffiliation: [
    "전문상담교사",
    "전문상담순회교사",
    "Wee카운슬러",
    "학생상담자원봉사자",
    "교사",
    "전문상담사",
    "사회복지사",
    "교육복지사",
    "임상심리사",
    "그외"
  ],
  channel: ["면담", "전화상담", "사이버상담"]
} as const;

export const DEPENDENT_OPTIONS: Record<string, Record<string, string[]>> = {
  상담: {
    학부모상담: ["학생관련상담", "교사관련상담", "학습", "기타"],
    개인상담: ["학업", "진로", "성격", "성", "대인관계", "가정 및 가족관계", "일탈 및 비행", "학교폭력 가해", "학교폭력 피해", "자해 및 자살", "정신건강", "컴퓨터 및 스마트폰 과사용", "정보제공", "기타"],
    집단상담: ["학업", "진로", "학교폭력", "성격/대인관계", "기타"]
  },
  검사: {
    심리검사: ["성격검사", "적성검사", "정서검사"],
    진단검사: ["위기진단", "학교적응"]
  },
  자문: {
    교사자문: ["학생이해", "개입방법"],
    보호자자문: ["양육상담", "연계안내"]
  },
  교육: {
    예방교육: ["학교폭력", "생명존중"],
    역량교육: ["의사소통", "정서조절"]
  },
  연구: {
    사례연구: ["사례회의", "운영분석"]
  },
  의뢰: {
    내부의뢰: ["교내연계", "Wee연계"],
    외부의뢰: ["기관연계", "병원연계"]
  }
};

export const DEFAULT_SETTINGS: GlobalSettings = {
  counselingType: "일반상담",
  weeClass: "일반",
  category: "상담",
  subcategory: "개인상담",
  counselingMethod: "학업",
  counselingCount: "1",
  schoolYear: "2026",
  grade: "1학년",
  gender: "",
  hour: "1",
  minute: "00",
  counselorAffiliation: "교사",
  channel: "면담"
};

export function getSubcategoryOptions(category: string): string[] {
  return Object.keys(DEPENDENT_OPTIONS[category] ?? {});
}

export function getCounselingMethodOptions(category: string, subcategory: string): string[] {
  return DEPENDENT_OPTIONS[category]?.[subcategory] ?? [];
}
