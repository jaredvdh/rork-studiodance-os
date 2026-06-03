import * as XLSX from "xlsx";
import type { ParsedRow } from "@/data/migrationTypes";

/** Parse a CSV or XLSX file into an array of parsed rows. */
export function parseFile(file: File): Promise<{ rows: ParsedRow[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error("No sheets found in the file."));
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

        if (json.length < 2) {
          reject(new Error("File must contain a header row and at least one data row."));
          return;
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

        resolve({ rows, headers });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to parse file."));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}

/** Generate and download a CSV template file. */
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
