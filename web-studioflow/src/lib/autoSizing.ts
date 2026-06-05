/**
 * AI Auto-Sizing Engine — matches student measurements to vendor sizing charts
 * with per-dimension analysis, confidence scoring, flagging, and alternative recommendations.
 */

import type { SizingChart, SizingChartRow, StudentMeasurement } from "@/data/types";

export interface DimensionMatch {
  dimension: string;
  studentValue: number | null;
  chartRange: { min: number; max: number };
  withinRange: boolean;
  distanceFromCenter: number; // percentage from center (0 = exact center, 100 = at boundary)
}

export interface AutoSizeResult {
  recommendedSize: string;
  confidencePct: number;
  alternativeSize?: string;
  reason?: string;
  flags: string[];
  dimensionMatches: Record<string, DimensionMatch>;
}

/**
 * Run auto-sizing for a student against a sizing chart.
 * Returns the best-matching size with confidence score and detailed analysis.
 */
export function autoSize(
  measurement: StudentMeasurement,
  chart: SizingChart,
): AutoSizeResult {
  if (!chart.chartData || chart.chartData.length === 0) {
    return {
      recommendedSize: "",
      confidencePct: 0,
      flags: ["No chart data available"],
      dimensionMatches: {},
    };
  }

  const results: { size: string; score: number; matches: Record<string, DimensionMatch> }[] = [];

  for (const row of chart.chartData) {
    const { score, matches } = scoreRow(measurement, row);
    results.push({ size: row.size, score, matches });
  }

  if (results.length === 0) {
    return {
      recommendedSize: "",
      confidencePct: 0,
      flags: ["No matching size found"],
      dimensionMatches: {},
    };
  }

  // Sort by score descending (higher is better match)
  results.sort((a, b) => b.score - a.score);

  const best = results[0];
  const alternative = results.length > 1 ? results[1] : undefined;

  const flags: string[] = [];

  // Check for borderline matches
  for (const match of Object.values(best.matches)) {
    if (!match.withinRange) {
      flags.push(`${match.dimension}: outside expected range`);
    } else if (match.distanceFromCenter > 80) {
      flags.push(`${match.dimension}: near upper bound of size range`);
    } else if (match.distanceFromCenter < -80) {
      flags.push(`${match.dimension}: near lower bound of size range`);
    }
  }

  // Check for missing measurements
  const missing: string[] = [];
  if (measurement.girthCm == null) missing.push("Girth");
  if (measurement.chestCm == null && hasDimensionInChart(chart, "chest")) missing.push("Chest");
  if (measurement.waistCm == null && hasDimensionInChart(chart, "waist")) missing.push("Waist");
  if (measurement.hipsCm == null && hasDimensionInChart(chart, "hips")) missing.push("Hips");
  if (measurement.heightCm == null && hasDimensionInChart(chart, "height")) missing.push("Height");
  if (measurement.inseamCm == null && hasDimensionInChart(chart, "inseam")) missing.push("Inseam");

  if (missing.length > 0) {
    flags.push(`Missing measurements: ${missing.join(", ")}`);
  }

  // Build alternative reason
  let reason: string | undefined;
  let alternativeSize: string | undefined;

  if (alternative && best.score - alternative.score < 15) {
    alternativeSize = alternative.size;
    const diffDims = Object.entries(best.matches).filter(
      ([dim, m]) => m.distanceFromCenter > 60,
    );
    if (diffDims.length > 0) {
      reason = `${diffDims.map(([d]) => d).join(", ")} near boundary — consider ${alternative.size}`;
    } else {
      reason = `Close match with ${alternative.size}`;
    }
  }

  // Convert score to confidence percentage (0-100)
  const confidencePct = Math.round(Math.min(100, Math.max(0, best.score)));

  return {
    recommendedSize: best.size,
    confidencePct,
    alternativeSize,
    reason,
    flags,
    dimensionMatches: best.matches,
  };
}

/**
 * Score a single chart row against student measurements.
 * Returns a normalized score (0-100) where 100 is a perfect center match on all dimensions.
 */
function scoreRow(measurement: StudentMeasurement, row: SizingChartRow): {
  score: number;
  matches: Record<string, DimensionMatch>;
} {
  const matches: Record<string, DimensionMatch> = {};
  let totalScore = 0;
  let dimensionCount = 0;

  // Girth (most important for dance costumes)
  if (measurement.girthCm != null && row.girthMin != null && row.girthMax != null) {
    const match = checkRange("Girth", measurement.girthCm, row.girthMin, row.girthMax);
    matches.girth = match;
    if (match.withinRange) {
      totalScore += 100 - Math.abs(match.distanceFromCenter) * 0.5;
    } else {
      totalScore -= 30;
    }
    dimensionCount++;
  }

  // Chest
  if (measurement.chestCm != null && row.chestMin != null && row.chestMax != null) {
    const match = checkRange("Chest", measurement.chestCm, row.chestMin, row.chestMax);
    matches.chest = match;
    if (match.withinRange) {
      totalScore += 100 - Math.abs(match.distanceFromCenter) * 0.4;
    } else {
      totalScore -= 20;
    }
    dimensionCount++;
  }

  // Waist
  if (measurement.waistCm != null && row.waistMin != null && row.waistMax != null) {
    const match = checkRange("Waist", measurement.waistCm, row.waistMin, row.waistMax);
    matches.waist = match;
    if (match.withinRange) {
      totalScore += 100 - Math.abs(match.distanceFromCenter) * 0.4;
    } else {
      totalScore -= 20;
    }
    dimensionCount++;
  }

  // Hips
  if (measurement.hipsCm != null && row.hipsMin != null && row.hipsMax != null) {
    const match = checkRange("Hips", measurement.hipsCm, row.hipsMin, row.hipsMax);
    matches.hips = match;
    if (match.withinRange) {
      totalScore += 100 - Math.abs(match.distanceFromCenter) * 0.4;
    } else {
      totalScore -= 15;
    }
    dimensionCount++;
  }

  // Height
  if (measurement.heightCm != null && row.heightMin != null && row.heightMax != null) {
    const match = checkRange("Height", measurement.heightCm, row.heightMin, row.heightMax);
    matches.height = match;
    if (match.withinRange) {
      totalScore += 100 - Math.abs(match.distanceFromCenter) * 0.3;
    } else {
      totalScore -= 15;
    }
    dimensionCount++;
  }

  // Weight (optional)
  if (measurement.weightKg != null && row.weightMin != null && row.weightMax != null) {
    const match = checkRange("Weight", measurement.weightKg, row.weightMin, row.weightMax);
    matches.weight = match;
    if (match.withinRange) {
      totalScore += 100 - Math.abs(match.distanceFromCenter) * 0.2;
    } else {
      totalScore -= 10;
    }
    dimensionCount++;
  }

  // Normalize score
  const score = dimensionCount > 0 ? Math.round(totalScore / dimensionCount) : 0;

  return { score, matches };
}

function checkRange(
  dimension: string,
  value: number,
  min: number,
  max: number,
): DimensionMatch {
  const center = (min + max) / 2;
  const range = max - min;
  const withinRange = value >= min && value <= max;

  // Distance from center as percentage of half-range (-100 to +100)
  const distanceFromCenter = range > 0 ? ((value - center) / (range / 2)) * 100 : 0;

  return {
    dimension,
    studentValue: value,
    chartRange: { min, max },
    withinRange,
    distanceFromCenter,
  };
}

function hasDimensionInChart(chart: SizingChart, dim: string): boolean {
  return chart.chartData.some((row) => {
    switch (dim) {
      case "chest": return row.chestMin != null || row.chestMax != null;
      case "waist": return row.waistMin != null || row.waistMax != null;
      case "hips": return row.hipsMin != null || row.hipsMax != null;
      case "height": return row.heightMin != null || row.heightMax != null;
      case "inseam": return false;
      default: return false;
    }
  });
}

/**
 * Parse CSV content into SizingChartRow[].
 * Expects headers: Size, ChestMin, ChestMax, WaistMin, WaistMax, GirthMin, GirthMax, HeightMin, HeightMax
 */
export function parseCsvChart(csv: string): SizingChartRow[] {
  const lines = csv.split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: SizingChartRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (!cols[0]) continue;

    const row: SizingChartRow = { size: cols[0] };
    const colIndex = (name: string) => headers.indexOf(name.toLowerCase());

    const cMin = colIndex("chestmin");
    const cMax = colIndex("chestmax");
    const wMin = colIndex("waistmin");
    const wMax = colIndex("waistmax");
    const gMin = colIndex("girthmin");
    const gMax = colIndex("girthmax");
    const hMin = colIndex("heightmin");
    const hMax = colIndex("heightmax");
    const wtMin = colIndex("weightmin");
    const wtMax = colIndex("weightmax");
    const hipMin = colIndex("hipsmin");
    const hipMax = colIndex("hipsmax");

    if (cMin >= 0 && cMax >= 0) { row.chestMin = parseNum(cols[cMin]); row.chestMax = parseNum(cols[cMax]); }
    if (wMin >= 0 && wMax >= 0) { row.waistMin = parseNum(cols[wMin]); row.waistMax = parseNum(cols[wMax]); }
    if (gMin >= 0 && gMax >= 0) { row.girthMin = parseNum(cols[gMin]); row.girthMax = parseNum(cols[gMax]); }
    if (hMin >= 0 && hMax >= 0) { row.heightMin = parseNum(cols[hMin]); row.heightMax = parseNum(cols[hMax]); }
    if (wtMin >= 0 && wtMax >= 0) { row.weightMin = parseNum(cols[wtMin]); row.weightMax = parseNum(cols[wtMax]); }
    if (hipMin >= 0 && hipMax >= 0) { row.hipsMin = parseNum(cols[hipMin]); row.hipsMax = parseNum(cols[hipMax]); }

    rows.push(row);
  }

  return rows;
}

function parseNum(v: string | undefined): number | undefined {
  if (!v || v === "") return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}
