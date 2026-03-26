import type { ExportRow, GlobalSettings, RawEntry } from "../types";

const RELATIVE_DAY_OFFSETS: Record<string, number> = {
  오늘: 0,
  내일: 1,
  모레: 2,
  글피: 3,
  그글피: 4,
  어제: -1,
  그저께: -2
};

const WEEKDAY_INDEX: Record<string, number> = {
  월: 0,
  화: 1,
  수: 2,
  목: 3,
  금: 4,
  토: 5,
  일: 6
};

const TRAILING_WEEKDAY_PATTERN = /\s*[\(\[]?\s*[월화수목금토일](?:요일)?\s*[\)\]]?\.?$/;
const DATE_EXTRACTORS = [
  /(?<!\d)(\d{8})(?!\d)/,
  /(?<!\d)(\d{6})(?!\d)/,
  /((?:\d{2,4})\s*(?:년|[./-])\s*\d{1,2}\s*(?:월|[./-])\s*\d{1,2}(?:일)?\.?(?:\s*[\(\[]?\s*[월화수목금토일](?:요일)?\s*[\)\]]?)?)/,
  /((?:\d{1,2})\s*(?:월|[./-])\s*\d{1,2}(?:일)?\.?(?:\s*[\(\[]?\s*[월화수목금토일](?:요일)?\s*[\)\]]?)?)/,
  /(오늘|내일|모레|글피|그글피|어제|그저께)/,
  /((?:(?:지난|저번|전|이번|다음)\s*주\s*)?[월화수목금토일](?:요일)?)/,
  /((?:(?:지난|저번|전|이번|다음)주)?[월화수목금토일](?:요일)?)/,
  /((?:\d{2,4})년\s*\d{1,2}월\s*\d{1,2})/,
  /((?:\d{1,2})월\s*\d{1,2})/
];

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toLocalDate(referenceDate: Date): Date {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 12);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date): Date {
  return addDays(date, -((date.getDay() + 6) % 7));
}

function isValidDate(year: number, month: number, day: number): boolean {
  const candidate = new Date(year, month - 1, day, 12);
  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  );
}

function formatDateParts(year: number, month: number, day: number, useShortYear = false): string {
  const monthText = pad2(month);
  const dayText = pad2(day);

  if (useShortYear) {
    return `${pad2(year % 100)}${monthText}${dayText}`;
  }

  return `${year}${monthText}${dayText}`;
}

function parseExplicitDate(input: string): string {
  const trimmed = input.trim().replace(TRAILING_WEEKDAY_PATTERN, "");
  const compactMatch = trimmed.match(/^(\d{8}|\d{6})$/);

  if (compactMatch) {
    return compactMatch[1];
  }

  const match = trimmed.match(
    /^(\d{2,4})\s*(?:년|[./-])\s*(\d{1,2})\s*(?:월|[./-])\s*(\d{1,2})(?:일)?\.?$/
  );

  if (!match) {
    return "";
  }

  const [, yearText, monthText, dayText] = match;
  const year = yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!isValidDate(year, month, day)) {
    return "";
  }

  return formatDateParts(year, month, day, yearText.length === 2);
}

function parseMonthDay(input: string, referenceDate: Date): string {
  const trimmed = input.trim().replace(TRAILING_WEEKDAY_PATTERN, "");
  const match = trimmed.match(/^(\d{1,2})\s*(?:월|[./-])\s*(\d{1,2})(?:일)?\.?$/);

  if (!match) {
    return "";
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = referenceDate.getFullYear();

  if (!isValidDate(year, month, day)) {
    return "";
  }

  return formatDateParts(year, month, day);
}

function parseRelativeDate(input: string, referenceDate: Date): string {
  const key = input.trim().replace(/\s+/g, "");
  const offset = RELATIVE_DAY_OFFSETS[key];

  if (offset === undefined) {
    return "";
  }

  const resolved = addDays(referenceDate, offset);
  return formatDateParts(resolved.getFullYear(), resolved.getMonth() + 1, resolved.getDate());
}

function parseWeekdayDate(input: string, referenceDate: Date): string {
  const normalized = input.trim().replace(/\s+/g, "");
  const match = normalized.match(/^(?:(지난|저번|전|이번|다음)주)?([월화수목금토일])(?:요일)?$/);

  if (!match) {
    return "";
  }

  const modifier = match[1] ?? "";
  const weekday = match[2];
  const weekBase = startOfWeek(referenceDate);
  const weekOffset =
    modifier === "다음" ? 7 : modifier === "지난" || modifier === "저번" || modifier === "전" ? -7 : 0;
  const resolved = addDays(weekBase, weekOffset + WEEKDAY_INDEX[weekday]);

  return formatDateParts(resolved.getFullYear(), resolved.getMonth() + 1, resolved.getDate());
}

export function extractDateText(input: string): string {
  for (const pattern of DATE_EXTRACTORS) {
    const match = input.match(pattern);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "";
}

export function normalizeDate(input: string, referenceDate = new Date()): string {
  const localReferenceDate = toLocalDate(referenceDate);

  return (
    parseExplicitDate(input) ||
    parseMonthDay(input, localReferenceDate) ||
    parseRelativeDate(input, localReferenceDate) ||
    parseWeekdayDate(input, localReferenceDate) ||
    input.replace(/[^\d]/g, "")
  );
}

export function maskName(name: string): string {
  const trimmed = name.trim();

  if (trimmed.length <= 1) {
    return trimmed;
  }

  if (trimmed.length === 2) {
    return `${trimmed[0]}0`;
  }

  return `${trimmed[0]}${"0".repeat(trimmed.length - 2)}${trimmed[trimmed.length - 1]}`;
}

export function toExportRow(entry: RawEntry, settings: GlobalSettings): ExportRow {
  return {
    "*상담분류": settings.counselingType,
    "*Wee클래스": settings.weeClass,
    "*대분류": settings.category,
    "*중분류": settings.subcategory,
    "*상담구분": settings.counselingMethod,
    "*상담인원": settings.counselingCount,
    "*학년도": settings.schoolYear,
    "*상담일자": normalizeDate(entry.dateText),
    "학년": settings.grade,
    "성별": settings.gender,
    "*상담제목": maskName(entry.name),
    "*상담내용": "",
    "*상담시간(시)": settings.hour,
    "*상담시간(분)": settings.minute,
    "*상담사소속": settings.counselorAffiliation,
    "*상담매체구분": settings.channel
  };
}
