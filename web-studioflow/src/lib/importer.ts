import * as XLSX from "xlsx";
import type { ParsedRow, SheetInfo } from "@/data/migrationTypes";

/**
 * Parse a CSV or XLSX file and return all sheet information.
 * For CSV files, returns a single sheet named after the file.
 * For XLSX files with multiple sheets, returns info for every sheet.
 */
export function parseFile(file: File): Promise<{ sheets: SheetInfo[]; fileName: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetNames = workbook.SheetNames;

        if (sheetNames.length === 0) {
          reject(new Error("No sheets found in the file."));
          return;
        }

        const sheets: SheetInfo[] = [];

        for (const name of sheetNames) {
          const sheet = workbook.Sheets[name];
          const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

          if (json.length < 2) {
            // Sheet has no header+data rows — still include but marked
            sheets.push({ name, headers: [], rowCount: 0, rows: [] });
            continue;
          }

          const headers = (json[0] as string[]).map((h) => String(h).trim());
          const rows: ParsedRow[] = [];

          for (let i = 1; i < json.length; i++) {
            const rawRow = json[i] as string[];
            const raw: Record<string, string> = {};

            headers.forEach((header, colIdx) => {
              const val = rawRow[colIdx];
              raw[header] = val !== undefined && val !== null ? String(val).trim() : "";
            });

            // Skip completely empty rows
            if (Object.values(raw).every((v) => v === "")) continue;

            rows.push({ index: i, raw, mapped: {} });
          }

          sheets.push({ name, headers, rowCount: rows.length, rows });
        }

        resolve({ sheets, fileName: file.name });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to parse file."));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse a specific sheet from an already-parsed workbook result.
 * Used when the user picks which sheets to import from a multi-sheet file.
 */
export function parseSheetFromInfo(sheet: SheetInfo): { rows: ParsedRow[]; headers: string[] } {
  return {
    rows: sheet.rows,
    headers: sheet.headers,
  };
}

/**
 * Generate and download a CSV template file.
 */
export function downloadTemplate(
  headers: string[],
  sampleRows: Record<string, string>[],
  fileName: string,
): void {
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.join(","));

  // Sample rows
  for (const row of sampleRows) {
    const values = headers.map((h) => {
      const val = row[h] ?? "";
      // Quote values containing commas or quotes
      return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    });
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
