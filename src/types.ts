export const EXPORT_COLUMNS = [
  "*상담분류",
  "*Wee클래스",
  "*대분류",
  "*중분류",
  "*상담구분",
  "*상담인원",
  "*학년도",
  "*상담일자",
  "학년",
  "성별",
  "*상담제목",
  "*상담내용",
  "*상담시간(시)",
  "*상담시간(분)",
  "*상담사소속",
  "*상담매체구분"
] as const;

export type ExportColumn = (typeof EXPORT_COLUMNS)[number];

export type ExportRow = Record<ExportColumn, string>;

export type GlobalSettings = {
  counselingType: string;
  weeClass: string;
  category: string;
  subcategory: string;
  counselingMethod: string;
  counselingCount: string;
  schoolYear: string;
  grade: string;
  gender: string;
  hour: string;
  minute: string;
  counselorAffiliation: string;
  channel: string;
};

export type RawEntry = {
  id: string;
  raw: string;
  dateText: string;
  timeText: string;
  studentId: string;
  name: string;
};

export type ValidationIssue = {
  rowId: string;
  field: ExportColumn | "line";
  message: string;
};

export const SETTINGS_STORAGE_KEY = "cdc-global-settings";
