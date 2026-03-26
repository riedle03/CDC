import type { RawEntry } from "../types";
import { extractDateText } from "./normalize";

const TIME_REGEX = /\b(\d{1,2}:\d{2})\b/;

function extractName(parts: string[]): string {
  if (parts.length === 0) {
    return "";
  }

  return parts[parts.length - 1].trim();
}

export function parseRawEntries(input: string): RawEntry[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split(/\s+/).filter(Boolean);
      const dateText = extractDateText(line);
      const timeText = line.match(TIME_REGEX)?.[1] ?? "";
      const studentId = parts.find((part) => /^\d{4,}$/.test(part)) ?? "";
      const name = extractName(parts);

      return {
        id: `row-${index + 1}`,
        raw: line,
        dateText,
        timeText,
        studentId,
        name
      };
    });
}
