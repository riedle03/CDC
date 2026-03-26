import { useEffect, useMemo, useState } from "react";
import { createWorkbookBlob, triggerBlobDownload } from "./core/export";
import { DEFAULT_SETTINGS, getCounselingMethodOptions, getSubcategoryOptions } from "./reference";
import { useCdcStore } from "./store/cdcStore";
import { EXPORT_COLUMNS } from "./types";
import type { ExportColumn, GlobalSettings } from "./types";

const FIELD_LABELS: Record<keyof GlobalSettings, string> = {
  counselingType: "상담분류",
  weeClass: "Wee클래스",
  category: "대분류",
  subcategory: "중분류",
  counselingMethod: "상담구분",
  counselingCount: "상담인원",
  schoolYear: "학년도",
  grade: "학년",
  gender: "성별",
  hour: "상담시간(시)",
  minute: "상담시간(분)",
  counselorAffiliation: "상담사소속",
  channel: "상담매체구분"
};

type OptionMap = Record<string, readonly string[]>;
type SettingsFieldKey = keyof GlobalSettings;
type SettingsGroup = {
  title: string;
  description: string;
  fields: SettingsFieldKey[];
};
type PreparedDownload = {
  blob: Blob;
  filename: string;
};

const BASE_OPTIONS: OptionMap = {
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
};

const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: "상담 기준",
    description: "업로드 파일의 분류 체계를 먼저 고정합니다.",
    fields: ["counselingType", "weeClass", "category", "subcategory", "counselingMethod"]
  },
  {
    title: "대상 정보",
    description: "학생군에 공통 적용되는 기준값입니다.",
    fields: ["grade", "gender", "counselingCount", "schoolYear"]
  },
  {
    title: "운영 정보",
    description: "시간, 소속, 매체와 같은 운영 항목을 마무리합니다.",
    fields: ["hour", "minute", "counselorAffiliation", "channel"]
  }
];

function SettingsField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option || "미선택"}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void; }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} inputMode="numeric" onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export default function App() {
  const {
    settings,
    rawInput,
    previewRows,
    issues,
    settingsIssues,
    setSetting,
    setRawInput,
    generateRows,
    updateCell,
    removeRow,
    saveSettingsPreset,
    loadSettingsPreset
  } = useCdcStore();
  const [exportMessage, setExportMessage] = useState("");
  const [isPreparingExport, setIsPreparingExport] = useState(false);
  const [preparedDownload, setPreparedDownload] = useState<PreparedDownload | null>(null);

  const subcategoryOptions = useMemo(() => getSubcategoryOptions(settings.category), [settings.category]);
  const counselingMethodOptions = useMemo(
    () => getCounselingMethodOptions(settings.category, settings.subcategory),
    [settings.category, settings.subcategory]
  );

  useEffect(() => {
    loadSettingsPreset();
  }, [loadSettingsPreset]);

  useEffect(() => {
    if (!subcategoryOptions.includes(settings.subcategory) && subcategoryOptions[0]) {
      setSetting("subcategory", subcategoryOptions[0]);
    }
  }, [settings.subcategory, setSetting, subcategoryOptions]);

  useEffect(() => {
    if (!counselingMethodOptions.includes(settings.counselingMethod) && counselingMethodOptions[0]) {
      setSetting("counselingMethod", counselingMethodOptions[0]);
    }
  }, [counselingMethodOptions, setSetting, settings.counselingMethod]);

  useEffect(() => {
    setPreparedDownload(null);
    setExportMessage("");
    setIsPreparingExport(false);
  }, [previewRows, issues.length]);

  const issueMap = useMemo(() => {
    const map = new Map<string, string[]>();
    issues.forEach((issue) => {
      const current = map.get(issue.rowId) ?? [];
      current.push(`${issue.field}: ${issue.message}`);
      map.set(issue.rowId, current);
    });
    return map;
  }, [issues]);

  const helperStats = useMemo(
    () => [
      { label: "생성 행", value: String(previewRows.length).padStart(2, "0") },
      { label: "검증 이슈", value: String(issues.length).padStart(2, "0") },
      { label: "설정 오류", value: String(settingsIssues.length).padStart(2, "0") }
    ],
    [issues.length, previewRows.length, settingsIssues.length]
  );

  const prepareExport = async () => {
    if (previewRows.length === 0 || issues.length > 0 || isPreparingExport) {
      return;
    }

    setIsPreparingExport(true);
    setPreparedDownload(null);
    setExportMessage("엑셀 파일을 준비하는 중입니다.");

    await new Promise((resolve) => window.setTimeout(resolve, 300));

    const filename = `cdc-${new Date().toISOString().slice(0, 10)}.xlsx`;
    const blob = createWorkbookBlob(previewRows.map((previewRow) => previewRow.row));

    setPreparedDownload({ blob, filename });
    setExportMessage("엑셀 파일 준비가 완료되었습니다. 다운로드 버튼을 눌러 저장하세요.");
    setIsPreparingExport(false);
  };

  const downloadPreparedFile = () => {
    if (!preparedDownload) {
      return;
    }

    triggerBlobDownload(preparedDownload.blob, preparedDownload.filename);
    setExportMessage("다운로드가 시작되었습니다.");
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-copy-block">
          <p className="eyebrow">Counseling Workflow Studio</p>
          <h1>Counseling Data Converter</h1>
          <p className="hero-copy">
            반복되는 상담 업로드 작업을 정리된 입력 흐름으로 바꾸고, 검토 가능한 결과표까지 한 화면에서 완성합니다.
          </p>
          <p className="hero-summary">설정 고정 → 원시 데이터 붙여넣기 → 생성 결과 검토 → 엑셀 다운로드</p>
        </div>
        <div className="hero-card" aria-label="핵심 정보">
          <div className="hero-stat">
            <span className="hero-stat-label">Workflow</span>
            <strong>4-Step</strong>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-label">Output</span>
            <strong>16 Columns</strong>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-label">Mode</span>
            <strong>Review Before Export</strong>
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="workspace">
          <div className="workspace-header">
            <div>
              <p className="section-kicker">Input Workspace</p>
              <h2>설정과 원시 입력을 한 번에 준비</h2>
            </div>
            <p className="workspace-copy">
              기본값을 고정한 뒤 텍스트를 붙여넣고 바로 생성할 수 있도록 입력 단계를 하나의 작업 구역으로 묶었습니다.
            </p>
          </div>

          <div className="workspace-grid">
            <section className="panel panel-soft">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Step 1</p>
                  <h2>기본값 설정</h2>
                </div>
                <div className="panel-actions">
                  <button className="secondary-button" onClick={() => Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => setSetting(key as keyof GlobalSettings, value))}>
                    기본값 복원
                  </button>
                  <button className="secondary-button" onClick={saveSettingsPreset}>
                    설정 저장
                  </button>
                </div>
              </div>

              <div className="settings-groups">
                {SETTINGS_GROUPS.map((group) => (
                  <section key={group.title} className="settings-group-card">
                    <div className="settings-group-head">
                      <h3>{group.title}</h3>
                      <p>{group.description}</p>
                    </div>
                    <div className="grid fields-grid compact-grid">
                      {group.fields.map((field) =>
                        field === "counselingCount" || field === "schoolYear" || field === "hour" || field === "minute" ? (
                          <NumberField key={field} label={FIELD_LABELS[field]} value={settings[field]} onChange={(value) => setSetting(field, value)} />
                        ) : (
                          <SettingsField
                            key={field}
                            label={FIELD_LABELS[field]}
                            value={settings[field]}
                            options={
                              field === "subcategory"
                                ? subcategoryOptions
                                : field === "counselingMethod"
                                  ? counselingMethodOptions
                                  : BASE_OPTIONS[field]
                            }
                            onChange={(value) => setSetting(field, value)}
                          />
                        )
                      )}
                    </div>
                  </section>
                ))}
              </div>

              {settingsIssues.length > 0 && (
                <div className="issue-box">
                  {settingsIssues.map((issue) => (
                    <p key={issue}>{issue}</p>
                  ))}
                </div>
              )}
            </section>

            <section className="panel panel-strong input-panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Step 2</p>
                  <h2>원시 데이터 붙여넣기</h2>
                </div>
                <button className="primary-button" onClick={generateRows}>
                  데이터 생성
                </button>
              </div>
              <div className="helper-card">
                <p className="helper-title">입력 예시</p>
                <p className="helper">
                  <code>2026-03-09 12:30 2401 김하늘</code>
                </p>
                <p className="helper">
                  <code>26.03.02 2402 이서준</code>
                </p>
              </div>
              <div className="metric-strip" aria-label="현재 상태 요약">
                {helperStats.map((stat) => (
                  <div key={stat.label} className="metric-card">
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>
              <textarea
                className="paste-area"
                value={rawInput}
                onChange={(event) => setRawInput(event.target.value)}
                placeholder={"2026-03-09 12:30 2401 김하늘\n26.03.02 2402 이서준\n26-03-02 2403 박민서"}
              />
            </section>
          </div>
        </section>

        <section className="panel panel-table">
          <div className="panel-header review-header">
            <div>
              <p className="section-kicker">Step 3</p>
              <h2>결과 검토 작업면</h2>
            </div>
            <div className="review-summary">
              <div className="review-badge">
                <span>행 수</span>
                <strong>{previewRows.length}</strong>
              </div>
              <div className="review-badge review-badge-alert">
                <span>이슈</span>
                <strong>{issues.length}</strong>
              </div>
              <div className="status-pill">{issues.length > 0 ? `${issues.length}개 이슈` : "검증 통과"}</div>
            </div>
          </div>
          <p className="helper table-helper">생성된 업로드 데이터를 바로 수정하고, 오류가 있으면 같은 화면에서 확인합니다.</p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {EXPORT_COLUMNS.map((column, index) => (
                    <th key={column} className={index === 0 ? "sticky-lead" : ""}>
                      {column}
                    </th>
                  ))}
                  <th className="sticky-trail">이슈</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((previewRow) => (
                  <tr key={previewRow.id} className={issueMap.has(previewRow.id) ? "row-error" : ""}>
                    {EXPORT_COLUMNS.map((column, index) => (
                      <td key={`${previewRow.id}-${column}`} className={index === 0 ? "sticky-lead lead-cell" : ""}>
                        <EditableCell rowId={previewRow.id} column={column} value={previewRow.row[column]} onCommit={updateCell} />
                      </td>
                    ))}
                    <td className="issue-cell sticky-trail">
                      <div className="issue-cell-body">
                        <div>
                          {(issueMap.get(previewRow.id) ?? []).map((issue) => (
                            <span key={issue} className="issue-chip">
                              {issue}
                            </span>
                          ))}
                        </div>
                        <button className="row-delete-button" type="button" onClick={() => removeRow(previewRow.id)}>
                          이 행 삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel export-panel">
          <div>
            <p className="section-kicker">Step 4</p>
            <h2>엑셀 내보내기</h2>
            <p className="helper">이슈가 없으면 준비 버튼이 활성화되고, 준비 완료 후 다운로드 버튼이 나타납니다.</p>
          </div>
          <div className="export-controls">
            {exportMessage && <span className="success-badge export-message">{exportMessage}</span>}
            {isPreparingExport && (
              <div className="export-progress" role="status" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                <span>엑셀 파일을 준비하는 중입니다...</span>
              </div>
            )}
            <div className="panel-actions export-actions-row">
              <button className="primary-button" disabled={previewRows.length === 0 || issues.length > 0 || isPreparingExport} onClick={prepareExport}>
                엑셀 내보내기 준비
              </button>
              {preparedDownload && !isPreparingExport && (
                <button className="download-button" type="button" onClick={downloadPreparedFile}>
                  준비된 파일 다운로드
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>© 2026 이대형 · Counseling Data Converter (CDC) — riedel@e-mirim.hs.kr · Made with Codex & Claude Code</p>
      </footer>
    </div>
  );
}

function EditableCell({ rowId, column, value, onCommit }: { rowId: string; column: ExportColumn; value: string; onCommit: (rowId: string, column: ExportColumn, value: string) => void; }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return <input className="cell-input" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => onCommit(rowId, column, draft)} />;
}
