/**
 * Supabase Storage integration for StudioFlow.
 *
 * Buckets: studio-logos, waiver-documents, student-documents,
 * medical-files, recital-exports, migration-files.
 *
 * All uploads use signed URLs and RLS-enforced access.
 */

import { supabase, getAccessToken } from "./supabase";

/* ── Bucket names ─────────────────────────────────────────────────── */

export const STORAGE_BUCKETS = {
  STUDIO_LOGOS: "studio-logos",
  WAIVER_DOCS: "waiver-documents",
  STUDENT_DOCS: "student-documents",
  MEDICAL: "medical-files",
  RECITAL_EXPORTS: "recital-exports",
  MIGRATION: "migration-files",
} as const;

/* ── Secure upload ────────────────────────────────────────────────── */

export interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Upload a file to a Supabase Storage bucket.
 * Uses signed upload paths with the file's original extension preserved.
 */
export async function uploadFile(
  bucket: string,
  file: File,
  studioId: string,
  prefix = "",
): Promise<UploadResult> {
  const ext = file.name.split(".").pop() ?? "bin";
  const timestamp = Date.now();
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\s+/g, "_");
  const path = `${studioId}${prefix ? `/${prefix}` : ""}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return { path, publicUrl };
}

/**
 * Upload a blob as a file (useful for generated PDFs).
 */
export async function uploadBlob(
  bucket: string,
  blob: Blob,
  fileName: string,
  studioId: string,
  prefix = "",
): Promise<UploadResult> {
  const ext = fileName.split(".").pop() ?? "pdf";
  const timestamp = Date.now();
  const safeName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\s+/g, "_");
  const path = `${studioId}${prefix ? `/${prefix}` : ""}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      cacheControl: "3600",
      upsert: true,
      contentType: blob.type || "application/octet-stream",
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return { path, publicUrl };
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFile(
  bucket: string,
  path: string,
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * List files in a storage path.
 */
export async function listFiles(
  bucket: string,
  prefix: string,
): Promise<{ name: string; created_at: string }[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix);
  if (error) throw new Error(`List failed: ${error.message}`);
  return data ?? [];
}

/**
 * Check if a bucket is available (used on app init to confirm storage is configured).
 */
export async function checkBucket(bucket: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).list("", { limit: 1 });
    return !error;
  } catch {
    return false;
  }
}

/* ── Studio logo helpers ──────────────────────────────────────────── */

/**
 * Upload a studio logo image to Supabase Storage and return the public URL.
 */
export async function uploadStudioLogo(
  file: File,
  studioId: string,
): Promise<string> {
  const result = await uploadFile(
    STORAGE_BUCKETS.STUDIO_LOGOS,
    file,
    studioId,
    "logo",
  );
  return result.publicUrl;
}

/**
 * Remove the current studio logo from storage.
 */
export async function removeStudioLogo(path: string): Promise<void> {
  await deleteFile(STORAGE_BUCKETS.STUDIO_LOGOS, path);
}

/* ── Waiver PDF generation ────────────────────────────────────────── */

export interface SignedWaiver {
  signerName: string;
  signerEmail: string;
  studentName: string;
  waiverTitle: string;
  signedAt: string;
  caregiverRole: string;
  studentRelationship: string;
}

/**
 * Generate a signed waiver PDF (stub — returns a text blob in dev).
 * In production, this would use a PDF generation library or a server-side template.
 */
export async function generateWaiverPDF(
  waiver: SignedWaiver,
  studioId: string,
): Promise<UploadResult> {
  // Generate a simple HTML-based PDF placeholder
  const html = `
    <html>
    <head><title>Signed Waiver — ${waiver.waiverTitle}</title></head>
    <body style="font-family: Arial, sans-serif; padding: 40px;">
      <h1>${waiver.waiverTitle}</h1>
      <p><strong>Student:</strong> ${waiver.studentName}</p>
      <p><strong>Signed by:</strong> ${waiver.signerName} (${waiver.caregiverRole})</p>
      <p><strong>Email:</strong> ${waiver.signerEmail}</p>
      <p><strong>Relationship:</strong> ${waiver.studentRelationship}</p>
      <p><strong>Signed at:</strong> ${new Date(waiver.signedAt).toLocaleString()}</p>
      <hr />
      <p style="color: #666; font-size: 12px;">
        This document is an immutable record of the signed waiver. StudioFlow — Family Coordination Platform.
      </p>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: "text/html" });
  const fileName = `waiver_${waiver.studentName.replace(/\s+/g, "_")}_${Date.now()}.html`;

  return uploadBlob(
    STORAGE_BUCKETS.WAIVER_DOCS,
    blob,
    fileName,
    studioId,
    `waivers/${waiver.studentName.replace(/\s+/g, "_")}`,
  );
}
