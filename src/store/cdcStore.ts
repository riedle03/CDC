import { create } from "zustand";
import { DEFAULT_SETTINGS } from "../reference";
import { parseRawEntries } from "../core/parse";
import { toExportRow } from "../core/normalize";
import { validateRows, validateSettings } from "../core/validate";
import { SETTINGS_STORAGE_KEY } from "../types";
import type { ExportColumn, ExportRow, GlobalSettings, RawEntry, ValidationIssue } from "../types";

type PreviewRow = {
  id: string;
  source: RawEntry;
  row: ExportRow;
};

type CdcState = {
  settings: GlobalSettings;
  rawInput: string;
  previewRows: PreviewRow[];
  issues: ValidationIssue[];
  settingsIssues: string[];
  lastExportedAt: string;
  setSetting: (field: keyof GlobalSettings, value: string) => void;
  setRawInput: (value: string) => void;
  generateRows: () => void;
  updateCell: (rowId: string, column: ExportColumn, value: string) => void;
  removeRow: (rowId: string) => void;
  saveSettingsPreset: () => void;
  loadSettingsPreset: () => void;
};

function buildRows(settings: GlobalSettings, rawInput: string) {
  const entries = parseRawEntries(rawInput);
  const previewRows = entries.map((entry) => ({
    id: entry.id,
    source: entry,
    row: toExportRow(entry, settings)
  }));
  const issues = validateRows(previewRows);
  return { previewRows, issues };
}

export const useCdcStore = create<CdcState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  rawInput: "",
  previewRows: [],
  issues: [],
  settingsIssues: [],
  lastExportedAt: "",
  setSetting: (field, value) => {
    const nextSettings = { ...get().settings, [field]: value };
    set({
      settings: nextSettings,
      settingsIssues: validateSettings(nextSettings)
    });
  },
  setRawInput: (value) => set({ rawInput: value }),
  generateRows: () => {
    const settings = get().settings;
    const settingsIssues = validateSettings(settings);

    if (settingsIssues.length > 0) {
      set({ settingsIssues });
      return;
    }

    const { previewRows, issues } = buildRows(settings, get().rawInput);
    set({ previewRows, issues, settingsIssues: [] });
  },
  updateCell: (rowId, column, value) => {
    const nextRows = get().previewRows.map((previewRow) =>
      previewRow.id === rowId
        ? {
            ...previewRow,
            row: {
              ...previewRow.row,
              [column]: value
            }
          }
        : previewRow
    );
    set({
      previewRows: nextRows,
      issues: validateRows(nextRows)
    });
  },
  removeRow: (rowId) => {
    const nextRows = get().previewRows.filter((previewRow) => previewRow.id !== rowId);
    set({
      previewRows: nextRows,
      issues: validateRows(nextRows)
    });
  },
  saveSettingsPreset: () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(get().settings));
  },
  loadSettingsPreset: () => {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as GlobalSettings;
    set({
      settings: parsed,
      settingsIssues: validateSettings(parsed)
    });
  }
}));
