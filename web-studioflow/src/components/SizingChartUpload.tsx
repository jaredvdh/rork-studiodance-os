import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileUp,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { SizingChart, SizingChartRow, Costume, StudentMeasurement, SizeRecommendation } from "@/data/types";
import { parseCsvChart, autoSize, parseChartWithAI, detectChartUnit, normalizeChartRow } from "@/lib/autoSizing";
import { cn } from "@/lib/utils";

interface SizingChartUploadProps {
  costumes: Costume[];
  charts: SizingChart[];
  measurements: StudentMeasurement[];
  onAddChart: (chart: Omit<SizingChart, "id" | "studioId" | "createdAt">) => Promise<void>;
  onDeleteChart: (id: string) => void;
  onAddRecommendation: (rec: Omit<SizeRecommendation, "id" | "studioId" | "createdAt" | "updatedAt">) => Promise<void>;
  onClose?: () => void;
}

export default function SizingChartUpload({
  costumes,
  charts,
  measurements,
  onAddChart,
  onDeleteChart,
  onAddRecommendation,
  onClose,
}: SizingChartUploadProps) {
  const [mode, setMode] = useState<"list" | "upload" | "manual">("list");
  const [vendor, setVendor] = useState("");
  const [chartName, setChartName] = useState("");
  const [costumeId, setCostumeId] = useState<string>("");
  const [fileType, setFileType] = useState<"csv" | "manual">("manual");
  const [rows, setRows] = useState<SizingChartRow[]>([emptyRow()]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runAll, setRunAll] = useState(false);

  const [aiParsing, setAiParsing] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const text = await file.text();
      if (file.name.endsWith(".csv")) {
        const parsed = parseCsvChart(text);
        if (parsed.length === 0) {
          toast.error("Could not parse any size rows from this file");
          return;
        }
        // Detect unit system from the data
        const detectedUnit = detectChartUnit(parsed);
        const normalized = parsed.map((r) => normalizeChartRow(r, detectedUnit));
        setRows(normalized);
        setFileType("csv");
        setMode("manual");
        toast.success(`Parsed ${parsed.length} size rows${detectedUnit === "imperial" ? " (detected as imperial — converted to metric)" : ""}`);
      } else if (file.name.endsWith(".pdf") || file.name.endsWith(".xlsx") || file.name.endsWith(".txt")) {
        // Use AI to parse unstructured sizing chart text
        setAiParsing(true);
        try {
          const parsed = await parseChartWithAI(text);
          if (parsed.length === 0) {
            toast.error("AI could not extract any size rows from this file");
            return;
          }
          setRows(parsed);
          setFileType("manual");
          setMode("manual");
          toast.success(`AI extracted ${parsed.length} size rows`);
        } catch {
          toast.error("AI parsing failed. Try pasting the chart data directly into the manual editor.");
        } finally {
          setAiParsing(false);
        }
      } else {
        toast.info("Unsupported file format. Please use CSV for structured charts, or PDF/TXT for AI parsing.");
      }
    } catch {
      toast.error("Failed to parse file.");
    } finally {
      setParsing(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!vendor.trim() || !chartName.trim()) {
      toast.error("Vendor and chart name are required");
      return;
    }
    const validRows = rows.filter((r) => r.size.trim());
    if (validRows.length === 0) {
      toast.error("At least one size row is required");
      return;
    }
    setSaving(true);
    try {
      await onAddChart({
        vendor: vendor.trim(),
        chartName: chartName.trim(),
        costumeId: costumeId || undefined,
        chartData: validRows,
        fileType,
      });
      toast.success("Sizing chart saved");
      setVendor("");
      setChartName("");
      setCostumeId("");
      setRows([emptyRow()]);
      setMode("list");
    } catch {
      toast.error("Failed to save chart");
    } finally {
      setSaving(false);
    }
  }, [vendor, chartName, costumeId, rows, fileType, onAddChart]);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow()]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateRow = useCallback((index: number, field: keyof SizingChartRow, value: string) => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== index) return r;
      const numFields: (keyof SizingChartRow)[] = ["chestMin", "chestMax", "waistMin", "waistMax", "girthMin", "girthMax", "heightMin", "heightMax", "hipsMin", "hipsMax", "weightMin", "weightMax"];
      if (numFields.includes(field as typeof numFields[number])) {
        const n = Number(value);
        return { ...r, [field]: isNaN(n) ? undefined : n };
      }
      return { ...r, [field]: value };
    }));
  }, []);

  const handleRunAutoSizeForAll = useCallback(async () => {
    setRunAll(true);
    let count = 0;
    try {
      for (const chart of charts) {
        if (!chart.chartData.length) continue;
        for (const m of measurements) {
          if (m.status !== "approved") continue;
          const result = autoSize(m, chart);
          if (!result.recommendedSize) continue;
          await onAddRecommendation({
            studentId: m.studentId,
            costumeId: chart.costumeId ?? "",
            sizingChartId: chart.id,
            recommendedSize: result.recommendedSize,
            confidencePct: result.confidencePct,
            alternativeSize: result.alternativeSize,
            reason: result.reason,
            flags: result.flags,
            parentApproved: false,
          });
          count++;
        }
      }
      toast.success(`Generated ${count} size recommendations`);
    } catch {
      toast.error("Auto-sizing failed");
    } finally {
      setRunAll(false);
    }
  }, [charts, measurements, onAddRecommendation]);

  const chartCount = charts.length;

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-2xl border border-border/70 bg-card p-1">
          <button
            onClick={() => setMode("list")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition",
              mode === "list" ? "bg-rose text-white shadow" : "text-muted-foreground hover:bg-secondary",
            )}
          >
            Charts ({chartCount})
          </button>
          <button
            onClick={() => { setMode("upload"); setFileType("csv"); }}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition",
              mode === "upload" ? "bg-rose text-white shadow" : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Upload className="inline-block mr-1 h-3.5 w-3.5" />
            Upload
          </button>
          <button
            onClick={() => { setMode("manual"); setRows([emptyRow()]); }}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition",
              mode === "manual" && mode !== "upload" ? "bg-rose text-white shadow" : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Pencil className="inline-block mr-1 h-3.5 w-3.5" />
            Manual
          </button>
        </div>
        {charts.length > 0 && measurements.length > 0 && (
          <button
            onClick={handleRunAutoSizeForAll}
            disabled={runAll}
            className="inline-flex items-center gap-2 rounded-full bg-plum px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className={cn("h-4 w-4", runAll && "animate-spin")} />
            Run Auto-Size for All
          </button>
        )}
      </div>

      {/* List mode */}
      {mode === "list" && (
        <div className="space-y-4">
          {charts.length === 0 ? (
            <div className="rounded-2xl border border-border/70 bg-card p-12 text-center">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-semibold">No sizing charts yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload vendor sizing charts (CSV) to enable AI auto-sizing.
              </p>
              <button
                onClick={() => { setMode("upload"); setFileType("csv"); }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:opacity-90"
              >
                <Upload className="h-4 w-4" /> Upload First Chart
              </button>
            </div>
          ) : (
            charts.map((chart) => {
              const linkedCostume = chart.costumeId
                ? costumes.find((c) => c.id === chart.costumeId)
                : undefined;
              return (
                <div key={chart.id} className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{chart.chartName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {chart.vendor}
                        {linkedCostume && <> · {linkedCostume.name}</>}
                        {chart.fileType && <> · {chart.fileType.toUpperCase()}</>}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteChart(chart.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-rose/10 hover:text-rose"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Preview table */}
                  <div className="overflow-x-auto rounded-xl border border-border/60">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-secondary/40">
                          <th className="py-2 px-3 text-left font-semibold">Size</th>
                          <th className="py-2 px-2 text-center font-semibold">Chest</th>
                          <th className="py-2 px-2 text-center font-semibold">Waist</th>
                          <th className="py-2 px-2 text-center font-semibold">Girth</th>
                          <th className="py-2 px-2 text-center font-semibold">Height</th>
                          <th className="py-2 px-2 text-center font-semibold">Hips</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chart.chartData.map((row, i) => (
                          <tr key={i} className="border-t border-border/40">
                            <td className="py-2 px-3 font-medium">{row.size}</td>
                            <td className="py-2 px-2 text-center text-muted-foreground">
                              {row.chestMin != null && row.chestMax != null ? `${row.chestMin}–${row.chestMax}` : "—"}
                            </td>
                            <td className="py-2 px-2 text-center text-muted-foreground">
                              {row.waistMin != null && row.waistMax != null ? `${row.waistMin}–${row.waistMax}` : "—"}
                            </td>
                            <td className="py-2 px-2 text-center text-muted-foreground">
                              {row.girthMin != null && row.girthMax != null ? `${row.girthMin}–${row.girthMax}` : "—"}
                            </td>
                            <td className="py-2 px-2 text-center text-muted-foreground">
                              {row.heightMin != null && row.heightMax != null ? `${row.heightMin}–${row.heightMax}` : "—"}
                            </td>
                            <td className="py-2 px-2 text-center text-muted-foreground">
                              {row.hipsMin != null && row.hipsMax != null ? `${row.hipsMin}–${row.hipsMax}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Upload mode */}
      {mode === "upload" && (
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-center space-y-4">
          <div className="grid h-16 w-16 place-items-center mx-auto rounded-2xl bg-rose/10">
            <FileUp className="h-8 w-8 text-rose" />
          </div>
          <div>
            <p className="text-lg font-semibold">Upload a Vendor Sizing Chart</p>
            <p className="text-sm text-muted-foreground">Supports CSV files with columns: Size, ChestMin, ChestMax, WaistMin, WaistMax, GirthMin, GirthMax, HeightMin, HeightMax</p>
          </div>
          <label className="inline-flex items-center gap-2 rounded-full bg-rose px-5 py-3 text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition">
            <Upload className="h-4 w-4" />
            Choose CSV File
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {parsing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-spin" />
              Parsing chart data...
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            After parsing, you'll preview and edit the extracted sizes before saving.
          </p>
        </div>
      )}

      {/* Manual entry mode */}
      {(mode === "manual" || (mode === "upload" && rows.length > 0 && rows[0].size)) && (
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">
              {mode === "upload" ? "Preview & Edit Chart" : "Manual Chart Entry"}
            </h3>
            <button
              onClick={() => setMode("upload")}
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              Back to upload
            </button>
          </div>

          {/* Chart metadata */}
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold block mb-1">Vendor <span className="text-rose">*</span></span>
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Dancewear Co."
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-rose"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold block mb-1">Chart Name <span className="text-rose">*</span></span>
              <input
                value={chartName}
                onChange={(e) => setChartName(e.target.value)}
                placeholder="e.g. Ballet Dress Size Guide"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-rose"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold block mb-1">Link to Costume</span>
              <select
                value={costumeId}
                onChange={(e) => setCostumeId(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-rose"
              >
                <option value="">None (general chart)</option>
                {costumes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Sizing rows grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Sizes</p>
              <button
                onClick={addRow}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-secondary"
              >
                <Plus className="h-3 w-3" /> Add Row
              </button>
            </div>

            {/* Header row */}
            <div className="grid grid-cols-9 gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-2">
              <span>Size</span>
              <span>Chest Min</span>
              <span>Chest Max</span>
              <span>Waist Min</span>
              <span>Waist Max</span>
              <span>Girth Min</span>
              <span>Girth Max</span>
              <span>Height Min</span>
              <span>Height Max</span>
            </div>

            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-9 gap-2 items-center">
                <input
                  value={row.size}
                  onChange={(e) => updateRow(i, "size", e.target.value)}
                  placeholder="XS"
                  className="rounded-lg border border-input bg-background px-2 py-2 text-xs outline-none focus:border-rose"
                />
                <input
                  value={row.chestMin ?? ""}
                  onChange={(e) => updateRow(i, "chestMin", e.target.value)}
                  placeholder="—"
                  type="number"
                  className="rounded-lg border border-input bg-background px-2 py-2 text-xs outline-none focus:border-rose"
                />
                <input
                  value={row.chestMax ?? ""}
                  onChange={(e) => updateRow(i, "chestMax", e.target.value)}
                  placeholder="—"
                  type="number"
                  className="rounded-lg border border-input bg-background px-2 py-2 text-xs outline-none focus:border-rose"
                />
                <input
                  value={row.waistMin ?? ""}
                  onChange={(e) => updateRow(i, "waistMin", e.target.value)}
                  placeholder="—"
                  type="number"
                  className="rounded-lg border border-input bg-background px-2 py-2 text-xs outline-none focus:border-rose"
                />
                <input
                  value={row.waistMax ?? ""}
                  onChange={(e) => updateRow(i, "waistMax", e.target.value)}
                  placeholder="—"
                  type="number"
                  className="rounded-lg border border-input bg-background px-2 py-2 text-xs outline-none focus:border-rose"
                />
                <input
                  value={row.girthMin ?? ""}
                  onChange={(e) => updateRow(i, "girthMin", e.target.value)}
                  placeholder="—"
                  type="number"
                  className="rounded-lg border border-input bg-background px-2 py-2 text-xs outline-none focus:border-rose"
                />
                <input
                  value={row.girthMax ?? ""}
                  onChange={(e) => updateRow(i, "girthMax", e.target.value)}
                  placeholder="—"
                  type="number"
                  className="rounded-lg border border-input bg-background px-2 py-2 text-xs outline-none focus:border-rose"
                />
                <input
                  value={row.heightMin ?? ""}
                  onChange={(e) => updateRow(i, "heightMin", e.target.value)}
                  placeholder="—"
                  type="number"
                  className="rounded-lg border border-input bg-background px-2 py-2 text-xs outline-none focus:border-rose"
                />
                <input
                  value={row.heightMax ?? ""}
                  onChange={(e) => updateRow(i, "heightMax", e.target.value)}
                  placeholder="—"
                  type="number"
                  className="rounded-lg border border-input bg-background px-2 py-2 text-xs outline-none focus:border-rose"
                />
                {rows.length > 1 && (
                  <button
                    onClick={() => removeRow(i)}
                    className="absolute -right-7 grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-rose/10 hover:text-rose transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={() => { setMode("list"); setRows([emptyRow()]); }}
              className="rounded-full border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-rose px-6 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Chart"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function emptyRow(): SizingChartRow {
  return { size: "" };
}
