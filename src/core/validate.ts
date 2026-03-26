import { z } from "zod";
import { getCounselingMethodOptions, getSubcategoryOptions, OPTIONS } from "../reference";
import type { ExportRow, GlobalSettings, ValidationIssue } from "../types";

const settingsSchema = z.object({
  counselingType: z.string().min(1),
  weeClass: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().min(1),
  counselingMethod: z.string().min(1),
  counselingCount: z.string().min(1),
  schoolYear: z.string().regex(/^\d{4}$/),
  grade: z.string().min(1),
  gender: z.string(),
  hour: z.string().regex(/^\d+$/),
  minute: z.string().regex(/^\d+$/),
  counselorAffiliation: z.string().min(1),
  channel: z.string().min(1)
});

const rowSchema = z.object({
  "*상담일자": z.string().regex(/^(\d{6}|\d{8})$/),
  "*상담제목": z.string().min(1),
  "*상담인원": z.string().regex(/^\d+$/),
  "*학년도": z.string().regex(/^\d{4}$/),
  "*상담시간(시)": z.string().regex(/^\d+$/),
  "*상담시간(분)": z.string().regex(/^\d+$/)
});

export function validateSettings(settings: GlobalSettings): string[] {
  const messages: string[] = [];
  const result = settingsSchema.safeParse(settings);

  if (!result.success) {
    messages.push(...result.error.issues.map((issue) => issue.message));
  }

  if (!(OPTIONS.grade as readonly string[]).includes(settings.grade)) {
    messages.push("학년 값이 허용 목록에 없습니다.");
  }

  if (!(OPTIONS.gender as readonly string[]).includes(settings.gender)) {
    messages.push("성별 값이 허용 목록에 없습니다.");
  }

  if (!(OPTIONS.counselingType as readonly string[]).includes(settings.counselingType)) {
    messages.push("상담분류 값이 허용 목록에 없습니다.");
  }

  if (!(OPTIONS.weeClass as readonly string[]).includes(settings.weeClass)) {
    messages.push("Wee클래스 값이 허용 목록에 없습니다.");
  }

  if (!(OPTIONS.category as readonly string[]).includes(settings.category)) {
    messages.push("대분류 값이 허용 목록에 없습니다.");
  }

  if (!(OPTIONS.counselorAffiliation as readonly string[]).includes(settings.counselorAffiliation)) {
    messages.push("상담사소속 값이 허용 목록에 없습니다.");
  }

  if (!(OPTIONS.channel as readonly string[]).includes(settings.channel)) {
    messages.push("상담매체구분 값이 허용 목록에 없습니다.");
  }

  if (!getSubcategoryOptions(settings.category).includes(settings.subcategory)) {
    messages.push("중분류가 대분류와 맞지 않습니다.");
  }

  if (!getCounselingMethodOptions(settings.category, settings.subcategory).includes(settings.counselingMethod)) {
    messages.push("상담구분이 대분류/중분류와 맞지 않습니다.");
  }

  return messages;
}

export function validateRows(rows: Array<{ id: string; row: ExportRow }>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  rows.forEach(({ id, row }) => {
    const result = rowSchema.safeParse(row);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        issues.push({
          rowId: id,
          field: (issue.path[0] as keyof ExportRow) ?? "line",
          message: issue.message
        });
      });
    }
  });

  return issues;
}
