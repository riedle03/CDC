import * as XLSX from "xlsx";
import { EXPORT_COLUMNS } from "../types";
import type { ExportRow } from "../types";

export function exportRowsToWorkbook(rows: ExportRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [...EXPORT_COLUMNS]
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "입력");
  return workbook;
}

export function createWorkbookBlob(rows: ExportRow[]) {
  const workbook = exportRowsToWorkbook(rows);
  const bytes = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}

export function triggerBlobDownload(blob: Blob, filename = "cdc-export.xlsx") {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
