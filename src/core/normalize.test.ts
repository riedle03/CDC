import { describe, expect, it } from "vitest";
import { extractDateText, maskName, normalizeDate } from "./normalize";

describe("normalize helpers", () => {
  it("normalizes explicit date formats", () => {
    expect(normalizeDate("2026-03-09")).toBe("20260309");
    expect(normalizeDate("2026.03.09.")).toBe("20260309");
    expect(normalizeDate("26.03.02")).toBe("260302");
    expect(normalizeDate("26-03-02")).toBe("260302");
    expect(normalizeDate("2026년 3월 9일")).toBe("20260309");
    expect(normalizeDate("20260309")).toBe("20260309");
  });

  it("resolves month/day and relative expressions against the reference date", () => {
    const referenceDate = new Date(2026, 2, 26, 9);

    expect(normalizeDate("3/9", referenceDate)).toBe("20260309");
    expect(normalizeDate("3월 9일", referenceDate)).toBe("20260309");
    expect(normalizeDate("오늘", referenceDate)).toBe("20260326");
    expect(normalizeDate("내일", referenceDate)).toBe("20260327");
    expect(normalizeDate("모레", referenceDate)).toBe("20260328");
    expect(normalizeDate("어제", referenceDate)).toBe("20260325");
    expect(normalizeDate("월요일", referenceDate)).toBe("20260323");
    expect(normalizeDate("다음주 화요일", referenceDate)).toBe("20260331");
    expect(normalizeDate("지난주 금요일", referenceDate)).toBe("20260320");
  });

  it("extracts flexible date text from a raw line", () => {
    expect(extractDateText("2026년 3월 9일 1608 심윤진")).toBe("2026년 3월 9일");
    expect(extractDateText("3/9 1608 심윤진")).toBe("3/9");
    expect(extractDateText("오늘 1608 심윤진")).toBe("오늘");
    expect(extractDateText("다음주 화요일 1608 심윤진")).toBe("다음주 화요일");
    expect(extractDateText("20260309화 1608 심윤진")).toBe("20260309");
  });

  it("masks middle characters in a name", () => {
    expect(maskName("심윤진")).toBe("심0진");
    expect(maskName("홍길동백")).toBe("홍00백");
    expect(maskName("유나")).toBe("유0");
  });
});
